import { createScriptIdIframe, teleportStyle } from '@util/script';
import type { App as VueApp, Reactive } from 'vue';
import App from './App.vue';
import {
  DIALOGUE_MAP_DATA_KEY,
  DIALOGUE_MAP_OUTPUT_CONTRACT,
  DIALOGUE_MAP_PROMPT_ID,
  createStoredDialogueMap,
  extractDialogueMapFromMessage,
  readStoredDialogueMap,
  stripDialogueMapBlocks,
} from './engine/dialogue-map';
import type { DialogueMapEntry } from './types/narrative';
import './baipo-narrative-embed.css';

type ContentRendererContext = {
  message_id: number;
  content: string;
  during_streaming: boolean;
  dialogue_map: DialogueMapEntry[];
  variable_revision: number;
  variable_refresh_needed: boolean;
  set_original_content_visible: (visible: boolean) => void;
  set_variable_refresh_needed: (needed: boolean) => void;
};

type TextPoint = {
  node: Text;
  offset: number;
};

type RangeBoundaryPoint = {
  node: Node;
  offset: number;
};

type RendererState = {
  app: VueApp;
  data: Reactive<ContentRendererContext>;
  host: HTMLIFrameElement;
  mesText: HTMLElement;
  originalContentVisible: boolean;
  destroy: () => void;
};

const RENDERER_HOST_EXPANDED_HEIGHT = 'clamp(980px, 64vw, 1080px)';
const RENDERER_HOST_MINIMIZED_HEIGHT = 'clamp(220px, 20vw, 280px)';
const RENDERER_HOST_EXPANDED_MARGIN = '0.75rem 0';
const RENDERER_HOST_MINIMIZED_MARGIN = '0.35rem 0 0.65rem';
const VARIABLE_REFRESH_POLL_INTERVAL_MS = 1500;

function errorCatched<T extends unknown[], U>(fn: (...args: T) => U): (...args: T) => U | undefined {
  return (...args: T) => {
    try {
      const result = fn(...args);
      if (result instanceof Promise) {
        void result.catch(error => console.error('[content-chat-renderer]', error));
      }
      return result;
    } catch (error) {
      console.error('[content-chat-renderer]', error);
      return undefined;
    }
  };
}

const displayedContentPattern =
  /<(content|maintext)\b[^>]*>[\s\S]*?<\/\1>(?:\s*(?:<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>|\[\s*\{\s*"i"[\s\S]*?\]\s*))?/i;
const states = new Map<number, RendererState>();
const rangeRetryCounts = new Map<number, number>();
const streamingMessageIds = new Set<number>();
const dialogueMapMemoryCache = new Map<number, ReturnType<typeof createStoredDialogueMap>>();
const pendingObservedMessageIds = new Set<number>();
const internallyMutatingMessages = new WeakSet<HTMLElement>();
const stopList: Array<() => void> = [];
let hasStopped = false;
let chatObserver: MutationObserver | null = null;
let dialogueMapPromptInjection: { uninject: () => void } | null = null;

type TavernHelperRuntime = {
  injectPrompts?: typeof injectPrompts;
  getChatMessages?: typeof getChatMessages;
  setChatMessages?: typeof setChatMessages;
};

function getTavernHelperRuntime(): TavernHelperRuntime {
  return (globalThis as typeof globalThis & { TavernHelper?: TavernHelperRuntime }).TavernHelper ?? {};
}

function getInjectPromptsRuntime() {
  if (typeof injectPrompts === 'function') {
    return injectPrompts;
  }

  return getTavernHelperRuntime().injectPrompts;
}

function getSetChatMessagesRuntime() {
  if (typeof setChatMessages === 'function') {
    return setChatMessages;
  }

  return getTavernHelperRuntime().setChatMessages;
}

function getChatMessagesRuntime() {
  if (typeof getChatMessages === 'function') {
    return getChatMessages;
  }

  return getTavernHelperRuntime().getChatMessages;
}

function hasClosedContentTag(message: string) {
  const openMatch = message.match(/<(content|maintext)\b[^>]*>/i);
  if (openMatch === null || openMatch.index === undefined) {
    return false;
  }

  const tagName = openMatch[1];
  const contentStart = openMatch.index + openMatch[0].length;
  const tail = message.slice(contentStart);
  const closePattern = new RegExp(`</${tagName}>`, 'i');
  return closePattern.test(tail);
}

function extractContent(message: string) {
  const openMatch = message.match(/<(content|maintext)\b[^>]*>/i);
  if (openMatch === null || openMatch.index === undefined) {
    return null;
  }

  const tagName = openMatch[1];
  const contentStart = openMatch.index + openMatch[0].length;
  const tail = message.slice(contentStart);
  const closePattern = new RegExp(`</${tagName}>`, 'i');
  const closeMatch = tail.match(closePattern);

  if (closeMatch === null || closeMatch.index === undefined) {
    return tail;
  }

  return tail.slice(0, closeMatch.index);
}

function getMessageDialogueMapSourceText(message: string) {
  const cleanedMessage = stripDialogueMapBlocks(message);
  return stripHiddenBlocks(extractContent(cleanedMessage) ?? cleanedMessage);
}

function collectTextNodes(root: HTMLElement) {
  const ownerDocument = root.ownerDocument;
  const showText = ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4;
  const walker = ownerDocument.createTreeWalker(root, showText);
  const textNodes: Array<{ node: Text; start: number; end: number }> = [];
  let text = '';

  while (true) {
    const current = walker.nextNode();
    if (current === null) {
      break;
    }

    const node = current as Text;
    const value = node.nodeValue ?? '';
    const start = text.length;
    text += value;
    textNodes.push({ node, start, end: text.length });
  }

  return { text, textNodes };
}

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'draft',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'nai',
  'novelai',
  'option',
  'prompt',
  'prompts',
  'reasoning',
  'redacted_reasoning',
  'scratchpad',
  'sd',
  'stable_diffusion',
  'style',
  'sum',
  'think',
  'thinking',
  'updatevariable',
]);

function stripKnownControlTagBlocks(text: string) {
  let result = text;
  let previous = '';
  const pairedTagPattern = /<([A-Za-z][\w:-]*)(?:\s+[^>]*)?>[\s\S]*?<\/\1>/gi;

  while (result !== previous) {
    previous = result;
    result = result.replace(pairedTagPattern, (match, tagName: string) =>
      HIDDEN_CONTENT_BLOCK_TAGS.has(tagName.toLowerCase()) ? '' : match,
    );
  }

  return result;
}

function stripAngleControlTags(text: string) {
  const withoutKnownBlocks = stripKnownControlTagBlocks(
    text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<think\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, '')
    .replace(/<redacted_reasoning\b[^>]*>[\s\S]*?<\/think>/gi, '')
      .replace(/<redacted_reasoning\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi, ''),
  );

  return withoutKnownBlocks
    .replace(/<![^>\n]*>/g, '')
    .replace(/<\?[\s\S]*?\?>/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '');
}

function stripHiddenBlocks(text: string) {
  return stripAngleControlTags(
    stripDialogueMapBlocks(text).replace(
      /(?:^|\n)[^\n]*(?:画图提示词|绘图提示词|文生图提示词|图像提示词|image prompt)[^\n]*(?=\n\s*<image\b)/gi,
      '\n',
    ),
  )
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeWithOffsets(input: string) {
  let text = '';
  const offsets: number[] = [];
  let lastWasSpace = true;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (/\s/.test(char)) {
      if (!lastWasSpace) {
        text += ' ';
        offsets.push(index);
        lastWasSpace = true;
      }
      continue;
    }

    text += char;
    offsets.push(index);
    lastWasSpace = false;
  }

  if (text.endsWith(' ')) {
    return {
      text: text.slice(0, -1),
      offsets: offsets.slice(0, -1),
    };
  }

  return { text, offsets };
}

function stripRenderedInlineMarkup(text: string) {
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>\n]+>/g, '')
    .replace(/[*_`~]/g, '');
}

function getRenderedContentCandidates(content: string) {
  const visibleContent = stripHiddenBlocks(content);
  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const candidate of [visibleContent, stripRenderedInlineMarkup(visibleContent)]) {
    if (candidate.length === 0 || seen.has(candidate)) {
      continue;
    }

    seen.add(candidate);
    candidates.push(candidate);
  }

  return candidates;
}

function findTextPoint(
  textNodes: Array<{ node: Text; start: number; end: number }>,
  targetOffset: number,
): TextPoint | null {
  for (const item of textNodes) {
    if (targetOffset >= item.start && targetOffset <= item.end) {
      return {
        node: item.node,
        offset: Math.min(Math.max(targetOffset - item.start, 0), item.node.length),
      };
    }
  }

  return null;
}

function findElementContentRange(root: HTMLElement): Range | null {
  const contentElement = root.querySelector('content, maintext');
  if (contentElement === null) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStartBefore(contentElement);
  range.setEndAfter(findFollowingDialogueMapNode(contentElement) ?? contentElement);
  return range;
}

function findFollowingDialogueMapNode(contentElement: Element): Node | null {
  let current = contentElement.nextSibling;
  while (current !== null) {
    if (current.nodeType === Node.TEXT_NODE && (current.textContent ?? '').trim().length === 0) {
      current = current.nextSibling;
      continue;
    }

    if (current.nodeType === Node.TEXT_NODE && isDialogueMapRenderText(current.textContent ?? '')) {
      return current;
    }

    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element;
      const tagName = (current as Element).tagName.toLowerCase();
      if (tagName === 'br') {
        current = current.nextSibling;
        continue;
      }

      if (tagName === 'dialogue_map' || element.classList.contains('baipo-dialogue-map-status')) {
        return current;
      }

      if (isDialogueMapRenderElement(element)) {
        return current;
      }
    }

    return null;
  }

  return null;
}

function isBareDialogueMapText(text: string) {
  return /^\s*\[\s*\{\s*"i"[\s\S]*?\]\s*$/.test(text);
}

function isTaggedDialogueMapText(text: string) {
  return /^\s*<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>\s*$/.test(text);
}

function isDialogueMapRenderText(text: string) {
  return isBareDialogueMapText(text) || isTaggedDialogueMapText(text);
}

function isDialogueMapRenderElement(element: Element) {
  if (!['p', 'div', 'pre', 'code'].includes(element.tagName.toLowerCase())) {
    return false;
  }

  return isDialogueMapRenderText(element.textContent ?? '');
}

function isIgnorableAfterRendererNode(node: Node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').trim().length === 0;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const element = node as Element;
  if (element.tagName.toLowerCase() === 'br') {
    return true;
  }

  return ['p', 'div'].includes(element.tagName.toLowerCase()) && (element.textContent ?? '').trim().length === 0;
}

function removeFollowingBareDialogueMapNodes(host: HTMLElement) {
  runWithSuppressedMessageMutation(host, () => {
    let current = host.nextSibling;
    const pendingIgnorableNodes: Node[] = [];

    while (current !== null) {
      const next = current.nextSibling;

      if (isIgnorableAfterRendererNode(current)) {
        pendingIgnorableNodes.push(current);
        current = next;
        continue;
      }

      const isBareMap =
        (current.nodeType === Node.TEXT_NODE && isDialogueMapRenderText(current.textContent ?? '')) ||
        (current.nodeType === Node.ELEMENT_NODE && isDialogueMapRenderElement(current as Element));

      if (!isBareMap) {
        return;
      }

      pendingIgnorableNodes.forEach(node => node.remove());
      current.remove();
      return;
    }
  });
}

function findLiteralTaggedContentRange(root: HTMLElement): Range | null {
  const { text, textNodes } = collectTextNodes(root);
  const match = text.match(displayedContentPattern);
  if (match === null || match.index === undefined) {
    return null;
  }

  const startPoint = findTextPoint(textNodes, match.index);
  const endPoint = findTextPoint(textNodes, match.index + match[0].length);
  if (startPoint === null || endPoint === null) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
}

function findPlainContentRange(root: HTMLElement, content: string): Range | null {
  const contentCandidates = getRenderedContentCandidates(content);
  if (contentCandidates.length === 0) {
    return null;
  }

  const { text, textNodes } = collectTextNodes(root);
  const normalizedText = normalizeWithOffsets(text);

  for (const contentCandidate of contentCandidates) {
    const normalizedContent = normalizeWithOffsets(contentCandidate);
    if (normalizedContent.text.length === 0) {
      continue;
    }

    const normalizedStart = normalizedText.text.indexOf(normalizedContent.text);
    if (normalizedStart < 0) {
      continue;
    }

    const normalizedEnd = normalizedStart + normalizedContent.text.length - 1;
    const originalStart = normalizedText.offsets[normalizedStart];
    const originalEnd = normalizedText.offsets[normalizedEnd] + 1;
    const startPoint = findTextPoint(textNodes, originalStart);
    const endPoint = findTextPoint(textNodes, originalEnd);
    if (startPoint === null || endPoint === null) {
      continue;
    }

    const range = root.ownerDocument.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    return range;
  }

  return null;
}

function findDisplayedContentRange($mesText: JQuery<HTMLElement>, content: string): Range | null {
  const root = $mesText[0];
  if (root === undefined) {
    return null;
  }

  return findElementContentRange(root) ?? findLiteralTaggedContentRange(root) ?? findPlainContentRange(root, content);
}

function destroyState(messageId: number) {
  states.get(messageId)?.destroy();
}

function isNodeConnectedToItsDocument(node: Node) {
  return node.ownerDocument.contains(node);
}

function getElementFromNode(node: Node): Element | null {
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

function getMessageElementFromNode(node: Node): HTMLElement | null {
  return getElementFromNode(node)?.closest<HTMLElement>('.mes') ?? null;
}

function getMessageIdFromElement(messageElement: Element | null) {
  return Number(messageElement?.getAttribute('mesid') ?? 'NaN');
}

function isRenderableMessageElement(messageElement: Element | null): messageElement is HTMLElement {
  return messageElement?.matches(".mes[is_user='false'][is_system='false']") ?? false;
}

function runWithSuppressedMessageMutation<T>(node: Node | undefined, action: () => T): T {
  const messageElement = node === undefined ? null : getMessageElementFromNode(node);
  if (messageElement !== null) {
    internallyMutatingMessages.add(messageElement);
  }

  try {
    return action();
  } finally {
    if (messageElement !== null) {
      setTimeout(() => internallyMutatingMessages.delete(messageElement), 0);
    }
  }
}

function isInternalRendererMutation(mutation: MutationRecord) {
  const messageElement = getMessageElementFromNode(mutation.target);
  return messageElement !== null && internallyMutatingMessages.has(messageElement);
}

function mutationTouchesMessageList(mutation: MutationRecord) {
  return [...mutation.addedNodes, ...mutation.removedNodes].some(node => {
    const element = getElementFromNode(node);
    return element?.matches('.mes') === true || element?.querySelector('.mes') !== null;
  });
}

function areDialogueMapsEqual(left: DialogueMapEntry[], right: DialogueMapEntry[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return (
      entry.i === nextEntry.i &&
      entry.anchor === nextEntry.anchor &&
      entry.speaker === nextEntry.speaker &&
      entry.focus === nextEntry.focus &&
      entry.kind === nextEntry.kind
    );
  });
}

function updateRendererStateData(
  state: RendererState,
  content: string,
  duringStreaming: boolean,
  dialogueMap: DialogueMapEntry[],
) {
  if (state.data.content !== content) {
    state.data.content = content;
  }

  if (state.data.during_streaming !== duringStreaming) {
    state.data.during_streaming = duringStreaming;
  }

  if (!areDialogueMapsEqual(state.data.dialogue_map, dialogueMap)) {
    state.data.dialogue_map = dialogueMap;
  }
}

function bumpRendererVariableRevision(messageId?: number) {
  states.forEach((state, stateMessageId) => {
    if (messageId !== undefined && stateMessageId !== messageId) {
      return;
    }

    state.data.variable_revision += 1;
  });
}

function setVariableRefreshNeededForRenderer(messageId: number, needed: boolean) {
  const state = states.get(messageId);
  if (state !== undefined && state.data.variable_refresh_needed !== needed) {
    state.data.variable_refresh_needed = needed;
  }
}

const scheduleVariableRevisionBump = _.debounce((messageId?: number) => {
  if (hasStopped) {
    return;
  }

  bumpRendererVariableRevision(messageId);
}, 80);

function schedulePostVariableRevisionBump(messageId?: number) {
  [0, 250, 900].forEach(delay => {
    window.setTimeout(() => scheduleVariableRevisionBump(messageId), delay);
  });
}

function scheduleRangeRetry(messageId: number) {
  const retryCount = rangeRetryCounts.get(messageId) ?? 0;
  if (retryCount >= 10) {
    return;
  }

  rangeRetryCounts.set(messageId, retryCount + 1);
  setTimeout(errorCatched(() => renderOneMessage(messageId)), 350);
}

function destroyAllInvalid() {
  const minMessageId = Number($('#chat > .mes').first().attr('mesid'));
  states.forEach((_state, messageId) => {
    if (!_.inRange(messageId, minMessageId, SillyTavern.chat.length)) {
      destroyState(messageId);
    }
  });
}

function isMessageEditing($messageElement: JQuery<HTMLElement>) {
  return $messageElement.find('#curEditTextarea').length > 0;
}

function prepareRendererMessage(messageId: number, message: string, chatMessage: ChatMessage | undefined) {
  const extractedDialogueMap = extractDialogueMapFromMessage(message);
  const cleanedMessage = extractedDialogueMap.cleanedMessage;
  const sourceText = getMessageDialogueMapSourceText(cleanedMessage);
  const extractedStoredMap = createStoredDialogueMap(extractedDialogueMap.entries, sourceText);
  const storedDialogueMap =
    chatMessage === undefined
      ? readStoredDialogueMap(dialogueMapMemoryCache.get(messageId), sourceText)
      : readStoredDialogueMap(chatMessage.data?.[DIALOGUE_MAP_DATA_KEY], sourceText) ??
        readStoredDialogueMap(dialogueMapMemoryCache.get(messageId), sourceText);
  const dialogueMap = extractedDialogueMap.found ? extractedDialogueMap.entries : storedDialogueMap?.entries ?? [];

  if (chatMessage !== undefined && extractedDialogueMap.found) {
    dialogueMapMemoryCache.set(messageId, extractedStoredMap);
    const nextData = {
      ...(chatMessage.data ?? {}),
      [DIALOGUE_MAP_DATA_KEY]: extractedStoredMap,
    };
    const setMessages = getSetChatMessagesRuntime();
    if (typeof setMessages === 'function') {
      void setMessages([{ message_id: messageId, message: cleanedMessage, data: nextData }], { refresh: 'none' }).catch(error => {
        console.warn('[content-chat-renderer] failed to cache dialogue_map extraction', error);
      });
    }
  }

  return {
    message,
    content: extractContent(cleanedMessage) === null ? null : stripHiddenBlocks(extractContent(cleanedMessage) ?? ''),
    dialogueMap,
  };
}

function isFightMessageText(message: string) {
  return /<fight\b[^>]*>|<\/fight>/i.test(message);
}

function isFightGenerationContext() {
  const latestMessage = getChatMessagesRuntime()?.(-1)[0]?.message ?? '';
  return isFightMessageText(latestMessage);
}

function installDialogueMapPromptInjection() {
  const inject = getInjectPromptsRuntime();
  if (typeof inject !== 'function') {
    return;
  }

  dialogueMapPromptInjection?.uninject();
  dialogueMapPromptInjection = inject([
    {
      id: DIALOGUE_MAP_PROMPT_ID,
      position: 'in_chat',
      depth: 0,
      role: 'system',
      content: DIALOGUE_MAP_OUTPUT_CONTRACT,
      should_scan: false,
      filter: () => !isFightGenerationContext(),
    },
  ]);
}

function uninstallDialogueMapPromptInjection() {
  dialogueMapPromptInjection?.uninject();
  dialogueMapPromptInjection = null;
}

function destroyEditedMessageStates() {
  $('#chat')
    .find('#curEditTextarea')
    .closest('.mes')
    .each((_index, node) => {
      const messageId = Number($(node).attr('mesid') ?? 'NaN');
      if (!Number.isNaN(messageId)) {
        destroyState(messageId);
      }
    });
}

function getRendererHostId(messageId: number) {
  return `baipo-content-renderer-${messageId}`;
}

function removeRendererHosts($messageElement: JQuery<HTMLElement>, messageId: number) {
  runWithSuppressedMessageMutation($messageElement[0], () => {
    $messageElement.find(`iframe#${getRendererHostId(messageId)}`).remove();
  });
}

function placeRendererHostBeforeMessageText(host: HTMLIFrameElement, mesText: HTMLElement) {
  runWithSuppressedMessageMutation(mesText, () => {
    const parent = mesText.parentElement;
    if (parent === null) {
      return;
    }

    if (host.parentElement !== parent || host.nextSibling !== mesText) {
      parent.insertBefore(host, mesText);
    }
  });
}

function placeExistingRendererHosts(
  $messageElement: JQuery<HTMLElement>,
  messageId: number,
  mesText: HTMLElement,
) {
  $messageElement.find(`iframe#${getRendererHostId(messageId)}`).each((_index, node) => {
    placeRendererHostBeforeMessageText(node as HTMLIFrameElement, mesText);
  });
}

function getHiddenContentSelector(messageId: number) {
  return `[data-baipo-content-renderer-hidden="${messageId}"]`;
}

function restoreHiddenContent(messageId: number, root: HTMLElement) {
  runWithSuppressedMessageMutation(root, () => {
    root.querySelectorAll<HTMLElement>(getHiddenContentSelector(messageId)).forEach(wrapper => {
      wrapper.replaceWith(...Array.from(wrapper.childNodes));
    });
  });
}

function hasHiddenContentForRenderer(messageId: number, mesText: HTMLElement) {
  return mesText.querySelector(getHiddenContentSelector(messageId)) !== null;
}

function setHiddenContentVisibleForRenderer(messageId: number, mesText: HTMLElement, visible: boolean) {
  runWithSuppressedMessageMutation(mesText, () => {
    mesText.querySelectorAll<HTMLElement>(getHiddenContentSelector(messageId)).forEach(wrapper => {
      wrapper.style.display = visible ? 'contents' : 'none';
    });
  });
}

function setRendererHostMinimized(host: HTMLIFrameElement, minimized: boolean) {
  host.style.height = minimized ? RENDERER_HOST_MINIMIZED_HEIGHT : RENDERER_HOST_EXPANDED_HEIGHT;
  host.style.margin = minimized ? RENDERER_HOST_MINIMIZED_MARGIN : RENDERER_HOST_EXPANDED_MARGIN;
}

function setOriginalContentVisibleForRenderer(messageId: number, visible: boolean) {
  const state = states.get(messageId);
  if (state === undefined || !isNodeConnectedToItsDocument(state.mesText)) {
    return;
  }

  state.originalContentVisible = visible;
  setHiddenContentVisibleForRenderer(messageId, state.mesText, visible);
  setRendererHostMinimized(state.host, visible);
}

function isPreservedOriginalContentElement(element: Element) {
  const tagName = element.tagName.toLowerCase();
  if (['option', 'select', 'button', 'input', 'textarea', 'a'].includes(tagName)) {
    return true;
  }

  const markerText = [
    element.id,
    element.className,
    ...Array.from(element.attributes).map(attribute => `${attribute.name}=${attribute.value}`),
  ]
    .join(' ')
    .toLowerCase();

  return (
    /\b(option|options|choice|choices|select|button|btn)\b/.test(markerText) ||
    element.getAttribute('role') === 'button'
  );
}

function getNodeIndex(node: Node) {
  return node.parentNode === null ? -1 : Array.prototype.indexOf.call(node.parentNode.childNodes, node);
}

function findOriginalContentPreserveBoundary(root: HTMLElement): RangeBoundaryPoint | null {
  const ownerDocument = root.ownerDocument;
  const showElementsAndText =
    (ownerDocument.defaultView?.NodeFilter.SHOW_ELEMENT ?? 1) |
    (ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4);
  const walker = ownerDocument.createTreeWalker(root, showElementsAndText);

  let current = walker.nextNode();
  while (current !== null) {
    if (current.nodeType === Node.TEXT_NODE) {
      const text = current.textContent ?? '';
      const optionIndex = text.search(/<\s*option\b|&lt;\s*option\b/i);
      if (optionIndex >= 0) {
        return { node: current as Text, offset: optionIndex };
      }
    } else if (current.nodeType === Node.ELEMENT_NODE && isPreservedOriginalContentElement(current as Element)) {
      const parent = current.parentNode;
      const index = getNodeIndex(current);
      if (parent !== null && index >= 0) {
        return { node: parent, offset: index };
      }
    }

    current = walker.nextNode();
  }

  return null;
}

function createOriginalContentHideRange(root: HTMLElement) {
  if (root.childNodes.length === 0) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(root, 0);
  const preserveBoundary = findOriginalContentPreserveBoundary(root);
  if (preserveBoundary === null) {
    range.setEnd(root, root.childNodes.length);
  } else {
    range.setEnd(preserveBoundary.node, preserveBoundary.offset);
  }

  return range.collapsed ? null : range;
}

function hideDisplayedContentForRenderer(messageId: number, mesText: HTMLElement, content: string) {
  return runWithSuppressedMessageMutation(mesText, () => {
    void content;
    restoreHiddenContent(messageId, mesText);

    const range = createOriginalContentHideRange(mesText);
    if (range === null) {
      return false;
    }

    const hiddenWrapper = mesText.ownerDocument.createElement('span');
    hiddenWrapper.dataset.baipoContentRendererHidden = String(messageId);
    hiddenWrapper.style.display = 'none';
    hiddenWrapper.append(range.extractContents());
    range.insertNode(hiddenWrapper);

    return true;
  });
}

function renderOneMessage(messageId: number, streamMessage?: string) {
  if (hasStopped || !_.inRange(messageId, 0, SillyTavern.chat.length)) {
    return;
  }

  const chatMessage = streamMessage === undefined ? getChatMessages(messageId)[0] : undefined;
  const rawMessage = streamMessage ?? chatMessage?.message ?? '';
  const preparedMessage = prepareRendererMessage(messageId, rawMessage, chatMessage);
  const message = preparedMessage.message;
  const isStreamingMessage = streamMessage !== undefined || streamingMessageIds.has(messageId);
  if (isStreamingMessage && !hasClosedContentTag(message)) {
    rangeRetryCounts.delete(messageId);
    return;
  }
  if (isStreamingMessage) {
    streamingMessageIds.delete(messageId);
  }

  const content = preparedMessage.content;
  const $messageElement = $(`.mes[mesid='${messageId}']`);
  const $mesText = $messageElement.find('.mes_text').first() as JQuery<HTMLElement>;
  const mesText = $mesText[0];
  const existingState = states.get(messageId);

  if (isMessageEditing($messageElement)) {
    if (mesText !== undefined) {
      restoreHiddenContent(messageId, mesText);
    }
    destroyState(messageId);
    removeRendererHosts($messageElement, messageId);
    return;
  }

  if (content === null || mesText === undefined) {
    rangeRetryCounts.delete(messageId);
    if (mesText !== undefined) {
      restoreHiddenContent(messageId, mesText);
    }
    destroyState(messageId);
    removeRendererHosts($messageElement, messageId);
    return;
  }

  placeExistingRendererHosts($messageElement, messageId, mesText);

  if (existingState !== undefined) {
    if (isNodeConnectedToItsDocument(existingState.host) && $messageElement[0]?.contains(existingState.host)) {
      const shouldRefreshHiddenContent =
        existingState.mesText !== mesText ||
        existingState.data.content !== content ||
        !hasHiddenContentForRenderer(messageId, mesText);
      if (shouldRefreshHiddenContent && !hideDisplayedContentForRenderer(messageId, mesText, content)) {
        console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
        scheduleRangeRetry(messageId);
        return;
      }

      rangeRetryCounts.delete(messageId);
      existingState.mesText = mesText;
      setHiddenContentVisibleForRenderer(messageId, mesText, existingState.originalContentVisible);
      placeRendererHostBeforeMessageText(existingState.host, mesText);
      updateRendererStateData(existingState, content, Boolean(streamMessage), preparedMessage.dialogueMap);
      return;
    }

    destroyState(messageId);
  }

  rangeRetryCounts.delete(messageId);
  removeRendererHosts($messageElement, messageId);

  const $host = createScriptIdIframe()
    .attr('id', getRendererHostId(messageId))
    .css({
      border: 0,
      display: 'block',
      width: '100%',
      'max-width': '100%',
      height: RENDERER_HOST_EXPANDED_HEIGHT,
      margin: RENDERER_HOST_EXPANDED_MARGIN,
    });

  placeRendererHostBeforeMessageText($host[0], mesText);
  removeFollowingBareDialogueMapNodes($host[0]);

  if (!hideDisplayedContentForRenderer(messageId, mesText, content)) {
    $host.remove();
    console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
    scheduleRangeRetry(messageId);
    return;
  }

  const data = reactive<ContentRendererContext>({
    message_id: messageId,
    content,
    during_streaming: Boolean(streamMessage),
    dialogue_map: preparedMessage.dialogueMap,
    variable_revision: 0,
    variable_refresh_needed: false,
    set_original_content_visible: visible => setOriginalContentVisibleForRenderer(messageId, visible),
    set_variable_refresh_needed: needed => setVariableRefreshNeededForRenderer(messageId, needed),
  });

  const app = createApp(App).provide('content_renderer_context', data);
  $host.on('load', function (this: HTMLIFrameElement) {
    teleportStyle(this.contentDocument!.head);
    app.mount(this.contentDocument!.body);
  });

  states.set(messageId, {
    app,
    data,
    host: $host[0],
    mesText,
    originalContentVisible: false,
    destroy: () => {
      app.unmount();
      const state = states.get(messageId);
      if (state !== undefined && isNodeConnectedToItsDocument(state.mesText)) {
        restoreHiddenContent(messageId, state.mesText);
      }
      if (isNodeConnectedToItsDocument($host[0])) {
        $host[0].remove();
      }
      states.delete(messageId);
    },
  });
}

function renderAllMessages() {
  if (hasStopped) {
    return;
  }

  scheduleRenderObservedMessages.cancel();
  pendingObservedMessageIds.clear();
  destroyEditedMessageStates();
  destroyAllInvalid();
  $('#chat')
    .children(".mes[is_user='false'][is_system='false']")
    .each((_index, node) => {
      const messageId = Number($(node).attr('mesid') ?? 'NaN');
      if (!Number.isNaN(messageId)) {
        renderOneMessage(messageId);
      }
    });
}

function schedulePostProcessedRenderAllMessages() {
  [300, 1200, 2600, 5200, 9000].forEach(delay => {
    const timer = window.setTimeout(
      errorCatched(() => {
        renderAllMessages();
      }),
      delay,
    );
    stopList.push(() => window.clearTimeout(timer));
  });
}

function schedulePostProcessedRenderOneMessage(messageId: number) {
  [300, 1200, 2600, 5200].forEach(delay => {
    const timer = window.setTimeout(
      errorCatched(() => {
        renderOneMessage(messageId);
      }),
      delay,
    );
    stopList.push(() => window.clearTimeout(timer));
  });
}

function scopedEventOn<T extends EventType>(event: T, listener: ListenerType[T], first?: true) {
  stopList.push(first ? eventMakeFirst(event, errorCatched(listener)).stop : eventOn(event, errorCatched(listener)).stop);
}

function scopedDynamicEventOn(event: string, listener: (...args: any[]) => void) {
  const subscribe = eventOn as unknown as (
    eventType: string,
    eventListener: (...args: any[]) => void,
  ) => { stop: () => void };
  stopList.push(subscribe(event, errorCatched(listener)).stop);
}

function installVariableRefreshSync() {
  const mvuEvents = (globalThis as { Mvu?: { events?: Record<string, string> } }).Mvu?.events;
  const eventNames = [
    mvuEvents?.VARIABLE_INITIALIZED ?? 'mag_variable_initiailized',
    mvuEvents?.BEFORE_MESSAGE_UPDATE ?? 'mag_before_message_update',
    mvuEvents?.VARIABLE_UPDATE_ENDED ?? 'mag_variable_update_ended',
  ];
  const seenEventNames = new Set<string>();

  eventNames.forEach(eventName => {
    if (seenEventNames.has(eventName)) {
      return;
    }

    seenEventNames.add(eventName);
    scopedDynamicEventOn(eventName, () => {
      schedulePostVariableRevisionBump();
    });
  });

  [tavern_events.MESSAGE_UPDATED, tavern_events.USER_MESSAGE_RENDERED, tavern_events.CHARACTER_MESSAGE_RENDERED].forEach(
    event =>
      scopedEventOn(event, (messageId: number) => {
        schedulePostVariableRevisionBump(messageId);
      }),
  );

  const pollTimer = window.setInterval(() => {
    const latestMessageId = getLastMessageId();
    const latestState = Number.isNaN(latestMessageId) ? undefined : states.get(latestMessageId);
    if (latestState?.data.variable_refresh_needed === true) {
      scheduleVariableRevisionBump(latestMessageId);
    }
  }, VARIABLE_REFRESH_POLL_INTERVAL_MS);
  stopList.push(() => window.clearInterval(pollTimer));
}

const scheduleRenderAllMessages = _.debounce(() => {
  renderAllMessages();
}, 120);

const scheduleRenderObservedMessages = _.debounce(() => {
  if (hasStopped) {
    return;
  }

  const messageIds = [...pendingObservedMessageIds];
  pendingObservedMessageIds.clear();
  destroyAllInvalid();
  messageIds.forEach(messageId => {
    const messageElement = $(`.mes[mesid='${messageId}']`)[0];
    if (isRenderableMessageElement(messageElement)) {
      renderOneMessage(messageId);
    }
  });
}, 120);

function queueObservedMessageRender(messageId: number) {
  if (Number.isNaN(messageId)) {
    return;
  }

  pendingObservedMessageIds.add(messageId);
  scheduleRenderObservedMessages();
}

const scheduleStreamingRender = _.debounce((messageId: number, message: string) => {
  renderOneMessage(messageId, message);
}, 120);

function getLastMessageId() {
  return Number($('#chat').children('.mes.last_mes').attr('mesid'));
}

function attachChatObserver() {
  const chatElement = $('#chat')[0];
  if (chatElement === undefined) {
    setTimeout(errorCatched(attachChatObserver), 500);
    return;
  }

  chatObserver?.disconnect();
  const ChatMutationObserver = chatElement.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  chatObserver = new ChatMutationObserver(mutations => {
    if (hasStopped) {
      return;
    }

    const changedMessageIds = new Set<number>();
    for (const mutation of mutations) {
      if (isInternalRendererMutation(mutation)) {
        continue;
      }

      if (mutation.target === chatElement || mutationTouchesMessageList(mutation)) {
        scheduleRenderAllMessages();
        return;
      }

      const messageElement = getMessageElementFromNode(mutation.target);
      if (isRenderableMessageElement(messageElement)) {
        changedMessageIds.add(getMessageIdFromElement(messageElement));
      }
    }

    changedMessageIds.forEach(queueObservedMessageRender);
  });
  chatObserver.observe(chatElement, {
    childList: true,
    subtree: true,
  });
  stopList.push(() => {
    chatObserver?.disconnect();
    chatObserver = null;
  });
}

function init() {
  installDialogueMapPromptInjection();
  stopList.push(uninstallDialogueMapPromptInjection);
  installVariableRefreshSync();
  scopedEventOn('chatLoaded', () => {
    installDialogueMapPromptInjection();
    streamingMessageIds.clear();
    states.forEach(({ destroy }) => destroy());
    renderAllMessages();
    schedulePostProcessedRenderAllMessages();
  });
  scopedEventOn(tavern_events.CHAT_CHANGED, () => {
    installDialogueMapPromptInjection();
  });
  scopedEventOn(
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    messageId => {
      scheduleStreamingRender.cancel();
      streamingMessageIds.delete(messageId);
      destroyAllInvalid();
      renderOneMessage(messageId);
      schedulePostProcessedRenderOneMessage(messageId);
    },
    true,
  );
  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_DELETED].forEach(event =>
    scopedEventOn(event, messageId => {
      scheduleStreamingRender.cancel();
      streamingMessageIds.delete(messageId);
      destroyAllInvalid();
      destroyState(messageId);
      renderOneMessage(messageId);
      schedulePostProcessedRenderOneMessage(messageId);
    }),
  );
  [tavern_events.MORE_MESSAGES_LOADED, tavern_events.MESSAGE_DELETED].forEach(event =>
    scopedEventOn(event, () => setTimeout(errorCatched(renderAllMessages), 1000)),
  );
  scopedEventOn(tavern_events.STREAM_TOKEN_RECEIVED, message => {
    const messageId = getLastMessageId();
    if (Number.isNaN(messageId)) {
      return;
    }

    streamingMessageIds.add(messageId);
    scheduleStreamingRender(messageId, message);
  });

  attachChatObserver();
  renderAllMessages();
  schedulePostProcessedRenderAllMessages();
  console.info('[content-chat-renderer] mounted');

  $(window).on('pagehide.content-chat-renderer', () => {
    hasStopped = true;
    scheduleRenderAllMessages.cancel();
    scheduleRenderObservedMessages.cancel();
    scheduleStreamingRender.cancel();
    pendingObservedMessageIds.clear();
    streamingMessageIds.clear();
    states.forEach(({ destroy }) => destroy());
    stopList.forEach(stop => stop());
    console.info('[content-chat-renderer] unmounted');
  });
}

$(() => {
  errorCatched(init)();
});
