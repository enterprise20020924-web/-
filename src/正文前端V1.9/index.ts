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
  thinking_content: string;
  parallel_events: ParallelEvent[];
  choice_options: ChoiceOption[];
  json_patch_blocks: string[];
  during_streaming: boolean;
  dialogue_map: DialogueMapEntry[];
  variable_revision: number;
  variable_refresh_needed: boolean;
  set_original_content_visible: (visible: boolean) => void;
  set_variable_refresh_needed: (needed: boolean) => void;
};

type RendererState = {
  app: VueApp;
  data: Reactive<ContentRendererContext>;
  host: HTMLIFrameElement;
  mesText: HTMLElement;
  originalContentVisible: boolean;
  resizeObserver: ResizeObserver | null;
  resizeFrame: number | null;
  destroy: () => void;
};

type ParallelEvent = {
  character: string;
  description: string;
};

type ChoiceOption = {
  label: string;
  text: string;
};

const RENDERER_HOST_EXPANDED_HEIGHT = 'clamp(1220px, 88vw, 1480px)';
const RENDERER_HOST_MIN_EXPANDED_HEIGHT_PX = 1220;
const RENDERER_HOST_HEIGHT_PADDING_PX = 28;
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

const COT_BLOCK_PATTERNS = [
  /<konatan_planning~(?:\s+[^>]*)?>[\s\S]*?<\/konatan_planning~>/gi,
  /<(thinking|think|redacted_reasoning|fox_think|fox_thinking)\b[^>]*>[\s\S]*?<\/\1>/gi,
  /<think\b[^>]*>[\s\S]*?<\/redacted_reasoning>/gi,
  /<redacted_reasoning\b[^>]*>[\s\S]*?<\/think>/gi,
];

function stripCotBlocksForStructure(message: string) {
  let result = message;
  let previous = '';

  while (result !== previous) {
    previous = result;
    for (const pattern of COT_BLOCK_PATTERNS) {
      pattern.lastIndex = 0;
      result = result.replace(pattern, '');
    }
  }

  return result;
}

function getCotBlockRanges(message: string) {
  const ranges: Array<{ start: number; end: number }> = [];
  for (const pattern of COT_BLOCK_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(message);
    while (match !== null) {
      ranges.push({ start: match.index, end: match.index + match[0].length });
      match = pattern.exec(message);
    }
  }

  return ranges.sort((left, right) => left.start - right.start);
}

function isOffsetInsideRanges(offset: number, ranges: Array<{ start: number; end: number }>) {
  return ranges.some(range => offset >= range.start && offset < range.end);
}

function findJsonArrayEnd(value: string, start: number) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return null;
}

function findBareDialogueMapRangeOutsideCot(message: string, cotRanges: Array<{ start: number; end: number }>) {
  const contentClosePattern = /<\/(?:content|maintext)>/gi;
  let closeMatch: RegExpExecArray | null = null;
  let nextMatch = contentClosePattern.exec(message);
  while (nextMatch !== null) {
    if (!isOffsetInsideRanges(nextMatch.index, cotRanges)) {
      closeMatch = nextMatch;
    }
    nextMatch = contentClosePattern.exec(message);
  }

  if (closeMatch === null) {
    return null;
  }

  const contentEnd = closeMatch.index + closeMatch[0].length;
  const tail = message.slice(contentEnd);
  const whitespaceMatch = tail.match(/^\s*/);
  const jsonStartInTail = whitespaceMatch?.[0].length ?? 0;
  if (tail[jsonStartInTail] !== '[') {
    return null;
  }

  const jsonEndInTail = findJsonArrayEnd(tail, jsonStartInTail);
  if (jsonEndInTail === null) {
    return null;
  }

  const payload = tail.slice(jsonStartInTail, jsonEndInTail + 1);
  if (!/"i"\s*:/.test(payload) || !/"anchor"\s*:/.test(payload)) {
    return null;
  }

  return {
    start: contentEnd + jsonStartInTail,
    end: contentEnd + jsonEndInTail + 1,
  };
}

function removeDialogueMapOutsideCot(message: string) {
  const cotRanges = getCotBlockRanges(message);
  const removalRanges: Array<{ start: number; end: number }> = [];
  const dialogueMapPattern = /<dialogue_map\b[^>]*>[\s\S]*?<\/dialogue_map>/gi;
  let match = dialogueMapPattern.exec(message);
  while (match !== null) {
    if (!isOffsetInsideRanges(match.index, cotRanges)) {
      removalRanges.push({ start: match.index, end: match.index + match[0].length });
    }
    match = dialogueMapPattern.exec(message);
  }

  const bareMapRange = findBareDialogueMapRangeOutsideCot(message, cotRanges);
  if (bareMapRange !== null) {
    removalRanges.push(bareMapRange);
  }

  return removalRanges
    .sort((left, right) => right.start - left.start)
    .reduce((result, range) => `${result.slice(0, range.start)}${result.slice(range.end)}`, message)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasClosedContentTag(message: string) {
  const source = stripCotBlocksForStructure(message);
  const openMatch = source.match(/<(content|maintext)\b[^>]*>/i);
  if (openMatch === null || openMatch.index === undefined) {
    return false;
  }

  const tagName = openMatch[1];
  const contentStart = openMatch.index + openMatch[0].length;
  const tail = source.slice(contentStart);
  const closePattern = new RegExp(`</${tagName}>`, 'i');
  return closePattern.test(tail);
}

function extractContent(message: string) {
  const source = stripCotBlocksForStructure(message);
  const openMatch = source.match(/<(content|maintext)\b[^>]*>/i);
  if (openMatch === null || openMatch.index === undefined) {
    return null;
  }

  const tagName = openMatch[1];
  const contentStart = openMatch.index + openMatch[0].length;
  const tail = source.slice(contentStart);
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

const HIDDEN_CONTENT_BLOCK_TAGS = new Set([
  'analysis',
  'choice',
  'draft',
  'fox_think',
  'fox_thinking',
  'generate_image',
  'image',
  'image_prompt',
  'img',
  'jsonpatch',
  'nai',
  'novelai',
  'option',
  'parallel',
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
    stripCotBlocksForStructure(text.replace(/<!--[\s\S]*?-->/g, '')),
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
    .replace(/<choice>[\s\S]*?<\/choice>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/^\s*<[^>\n]+>\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function cleanThinkingBlockText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractThinkingContent(message: string) {
  const source = stripDialogueMapBlocks(message);
  const blocks: string[] = [];
  const seen = new Set<string>();
  const patterns = [
    /<(thinking|think|redacted_reasoning|fox_think|fox_thinking)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    /<konatan_planning~(?:\s+[^>]*)?>([\s\S]*?)<\/konatan_planning~>/gi,
    /<think\b[^>]*>([\s\S]*?)<\/redacted_reasoning>/gi,
    /<redacted_reasoning\b[^>]*>([\s\S]*?)<\/think>/gi,
  ];

  const pushBlock = (value: string) => {
    const cleaned = cleanThinkingBlockText(value);
    if (cleaned.length === 0 || seen.has(cleaned)) {
      return;
    }

    seen.add(cleaned);
    blocks.push(cleaned);
  };

  for (const pattern of patterns) {
    let match = pattern.exec(source);
    while (match !== null) {
      pushBlock(match[2] ?? match[1] ?? '');
      match = pattern.exec(source);
    }
  }

  return blocks.join('\n\n---\n\n');
}

function cleanParallelEventText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseParallelEvents(content: string): ParallelEvent[] {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .reduce<ParallelEvent[]>((events, line) => {
      const match = line.match(/^\[([^\|\[\]]+)\s*\|\s*(.+)\]$/);
      if (match === null) {
        return events;
      }

      const character = cleanParallelEventText(match[1] ?? '');
      const description = cleanParallelEventText(match[2] ?? '');
      if (character.length === 0 || description.length === 0) {
        return events;
      }

      events.push({ character, description });
      return events;
    }, []);
}

function extractParallelEvents(message: string): ParallelEvent[] {
  const source = stripDialogueMapBlocks(message);
  const blocks = Array.from(source.matchAll(/<parallel\b[^>]*>([\s\S]*?)<\/parallel>/gi));
  if (blocks.length === 0) {
    return [];
  }

  return parseParallelEvents((blocks.at(-1)?.[1] ?? '').trim());
}

function cleanChoiceOptionText(text: string) {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[A-Za-z][\w:-]*(?:\s+[^<>]*)?\s*\/?>/g, '')
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeChoiceOptionLabel(label: string | undefined, index: number) {
  const fallback = String.fromCharCode(65 + index);
  if (label === undefined) {
    return fallback;
  }

  const normalizedLabel = label.trim().toUpperCase();
  if (/^[A-Z]$/.test(normalizedLabel)) {
    return normalizedLabel;
  }

  const numericLabel = Number(normalizedLabel);
  if (Number.isInteger(numericLabel) && numericLabel >= 1 && numericLabel <= 26) {
    return String.fromCharCode(64 + numericLabel);
  }

  return fallback;
}

function parseChoiceOptions(content: string): ChoiceOption[] {
  const cleanedContent = cleanChoiceOptionText(
    content
      .replace(/<option_analysis\b[^>]*>[\s\S]*?<\/option_analysis>/gi, '')
      .replace(/<choice_analysis\b[^>]*>[\s\S]*?<\/choice_analysis>/gi, ''),
  );

  const options: ChoiceOption[] = [];
  let activeOption: ChoiceOption | null = null;

  for (const rawLine of cleanedContent.split('\n')) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    const bracketMatch = line.match(/^\[?\s*([A-Ea-e1-5])\s*(?:[.。:：、)|]|[-–—]\s*)\s*(.+?)\s*\]?$/);
    const plainMatch = line.match(/^(?:[-*]\s*)?([A-Ea-e1-5])\s*[.。:：、)]\s*(.+)$/);
    const match = bracketMatch ?? plainMatch;

    if (match !== null) {
      activeOption = {
        label: normalizeChoiceOptionLabel(match[1], options.length),
        text: cleanChoiceOptionText(match[2] ?? ''),
      };
      if (activeOption.text.length > 0) {
        options.push(activeOption);
      }
      continue;
    }

    if (activeOption !== null) {
      activeOption.text = `${activeOption.text}\n${line}`.trim();
      continue;
    }

    options.push({
      label: normalizeChoiceOptionLabel(undefined, options.length),
      text: line,
    });
  }

  return options.filter(option => option.text.length > 0).slice(0, 5);
}

function extractChoiceOptions(message: string): ChoiceOption[] {
  const source = stripDialogueMapBlocks(message);
  const choiceBlocks = Array.from(source.matchAll(/<choice\b[^>]*>([\s\S]*?)<\/choice>/gi));
  const optionBlocks = Array.from(source.matchAll(/<option\b[^>]*>([\s\S]*?)<\/option>/gi));
  const preferredBlocks = choiceBlocks.length > 0 ? choiceBlocks : optionBlocks;
  if (preferredBlocks.length === 0) {
    return [];
  }

  return parseChoiceOptions((preferredBlocks.at(-1)?.[1] ?? '').trim());
}

function extractJsonPatchBlocks(message: string) {
  return Array.from(message.matchAll(/<JSONPatch\b[^>]*>([\s\S]*?)<\/JSONPatch>/gi))
    .map(match => (match[1] ?? '').trim())
    .filter(block => block.length > 0);
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
      entry.p === nextEntry.p &&
      entry.line_start === nextEntry.line_start &&
      entry.line_end === nextEntry.line_end &&
      entry.anchor === nextEntry.anchor &&
      entry.speaker === nextEntry.speaker &&
      entry.focus === nextEntry.focus &&
      entry.kind === nextEntry.kind
    );
  });
}

function areParallelEventsEqual(left: ParallelEvent[], right: ParallelEvent[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return entry.character === nextEntry.character && entry.description === nextEntry.description;
  });
}

function areChoiceOptionsEqual(left: ChoiceOption[], right: ChoiceOption[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => {
    const nextEntry = right[index];
    return entry.label === nextEntry.label && entry.text === nextEntry.text;
  });
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left === right) {
    return true;
  }

  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => entry === right[index]);
}

function updateRendererStateData(
  state: RendererState,
  content: string,
  thinkingContent: string,
  parallelEvents: ParallelEvent[],
  choiceOptions: ChoiceOption[],
  jsonPatchBlocks: string[],
  duringStreaming: boolean,
  dialogueMap: DialogueMapEntry[],
) {
  if (state.data.content !== content) {
    state.data.content = content;
  }

  if (state.data.thinking_content !== thinkingContent) {
    state.data.thinking_content = thinkingContent;
  }

  if (!areParallelEventsEqual(state.data.parallel_events, parallelEvents)) {
    state.data.parallel_events = parallelEvents;
  }

  if (!areChoiceOptionsEqual(state.data.choice_options, choiceOptions)) {
    state.data.choice_options = choiceOptions;
  }

  if (!areStringArraysEqual(state.data.json_patch_blocks, jsonPatchBlocks)) {
    state.data.json_patch_blocks = jsonPatchBlocks;
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
  const structureMessage = stripCotBlocksForStructure(message);
  const extractedDialogueMap = extractDialogueMapFromMessage(structureMessage);
  const cleanedMessage = extractedDialogueMap.cleanedMessage;
  const sourceText = getMessageDialogueMapSourceText(cleanedMessage);
  const extractedStoredMap = createStoredDialogueMap(extractedDialogueMap.entries, sourceText);
  const storedDialogueMap =
    chatMessage === undefined
      ? readStoredDialogueMap(dialogueMapMemoryCache.get(messageId), sourceText)
      : readStoredDialogueMap(chatMessage.data?.[DIALOGUE_MAP_DATA_KEY], sourceText) ??
        readStoredDialogueMap(dialogueMapMemoryCache.get(messageId), sourceText);
  const dialogueMap = extractedDialogueMap.found ? extractedDialogueMap.entries : storedDialogueMap?.entries ?? [];
  const shouldCacheExtractedMap =
    chatMessage !== undefined &&
    extractedDialogueMap.found &&
    (storedDialogueMap === null || !areDialogueMapsEqual(storedDialogueMap.entries, extractedStoredMap.entries));
  const messageWithoutDialogueMap = extractedDialogueMap.found ? removeDialogueMapOutsideCot(message) : message;

  if (chatMessage !== undefined && extractedDialogueMap.found && (shouldCacheExtractedMap || messageWithoutDialogueMap !== message)) {
    dialogueMapMemoryCache.set(messageId, extractedStoredMap);
    const nextData = {
      ...(chatMessage.data ?? {}),
      [DIALOGUE_MAP_DATA_KEY]: extractedStoredMap,
    };
    const setMessages = getSetChatMessagesRuntime();
    if (typeof setMessages === 'function') {
      void setMessages([{ message_id: messageId, message: messageWithoutDialogueMap, data: nextData }], { refresh: 'none' }).catch(error => {
        console.warn('[content-chat-renderer] failed to cache dialogue_map extraction', error);
      });
    }
  }

  return {
    message,
    content: extractContent(cleanedMessage) === null ? null : stripHiddenBlocks(extractContent(cleanedMessage) ?? ''),
    thinkingContent: extractThinkingContent(message),
    parallelEvents: extractParallelEvents(cleanedMessage),
    choiceOptions: extractChoiceOptions(cleanedMessage),
    jsonPatchBlocks: extractJsonPatchBlocks(cleanedMessage),
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
  host.style.margin = minimized ? RENDERER_HOST_MINIMIZED_MARGIN : RENDERER_HOST_EXPANDED_MARGIN;
  if (minimized) {
    host.style.height = RENDERER_HOST_MINIMIZED_HEIGHT;
    return;
  }

  syncRendererHostExpandedHeight(host);
}

function measureRendererHostContentHeight(host: HTMLIFrameElement) {
  const body = host.contentDocument?.body;
  if (body === undefined) {
    return null;
  }

  const bodyTop = body.getBoundingClientRect().top;
  const childBottoms = Array.from(body.children).map(child => child.getBoundingClientRect().bottom - bodyTop);
  const measuredHeight = Math.max(0, ...childBottoms);
  return measuredHeight > 0 ? Math.ceil(measuredHeight) : body.scrollHeight;
}

function syncRendererHostExpandedHeight(host: HTMLIFrameElement) {
  const measuredHeight = measureRendererHostContentHeight(host);
  const nextHeight = measuredHeight === null
    ? RENDERER_HOST_EXPANDED_HEIGHT
    : `${Math.max(RENDERER_HOST_MIN_EXPANDED_HEIGHT_PX, measuredHeight + RENDERER_HOST_HEIGHT_PADDING_PX)}px`;
  host.style.height = nextHeight;
  host.style.margin = RENDERER_HOST_EXPANDED_MARGIN;
}

function scheduleRendererHostHeightSync(state: RendererState) {
  if (state.originalContentVisible || state.resizeFrame !== null) {
    return;
  }

  state.resizeFrame = window.requestAnimationFrame(() => {
    state.resizeFrame = null;
    if (!state.originalContentVisible && isNodeConnectedToItsDocument(state.host)) {
      syncRendererHostExpandedHeight(state.host);
    }
  });
}

function installRendererHostAutoResize(state: RendererState) {
  state.resizeObserver?.disconnect();
  state.resizeObserver = null;

  const documentElement = state.host.contentDocument?.documentElement;
  const body = state.host.contentDocument?.body;
  const ResizeObserverCtor = state.host.contentWindow?.ResizeObserver ?? window.ResizeObserver;
  if (documentElement === undefined || body === undefined || ResizeObserverCtor === undefined) {
    syncRendererHostExpandedHeight(state.host);
    return;
  }

  const observer = new ResizeObserverCtor(() => scheduleRendererHostHeightSync(state));
  observer.observe(documentElement);
  observer.observe(body);
  state.resizeObserver = observer;
  syncRendererHostExpandedHeight(state.host);
  window.setTimeout(() => scheduleRendererHostHeightSync(state), 120);
  window.setTimeout(() => scheduleRendererHostHeightSync(state), 480);
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

function createOriginalContentHideRange(root: HTMLElement) {
  if (root.childNodes.length === 0) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(root, 0);
  range.setEnd(root, root.childNodes.length);
  return range.collapsed ? null : range;
}

function hideDisplayedContentForRenderer(messageId: number, mesText: HTMLElement) {
  return runWithSuppressedMessageMutation(mesText, () => {
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
      if (shouldRefreshHiddenContent && !hideDisplayedContentForRenderer(messageId, mesText)) {
        console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
        scheduleRangeRetry(messageId);
        return;
      }

      rangeRetryCounts.delete(messageId);
      existingState.mesText = mesText;
      setHiddenContentVisibleForRenderer(messageId, mesText, existingState.originalContentVisible);
      placeRendererHostBeforeMessageText(existingState.host, mesText);
      scheduleRendererHostHeightSync(existingState);
      updateRendererStateData(
        existingState,
        content,
        preparedMessage.thinkingContent,
        preparedMessage.parallelEvents,
        preparedMessage.choiceOptions,
        preparedMessage.jsonPatchBlocks,
        Boolean(streamMessage),
        preparedMessage.dialogueMap,
      );
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

  if (!hideDisplayedContentForRenderer(messageId, mesText)) {
    $host.remove();
    console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
    scheduleRangeRetry(messageId);
    return;
  }

  const data = reactive<ContentRendererContext>({
    message_id: messageId,
    content,
    thinking_content: preparedMessage.thinkingContent,
    parallel_events: preparedMessage.parallelEvents,
    choice_options: preparedMessage.choiceOptions,
    json_patch_blocks: preparedMessage.jsonPatchBlocks,
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
    const state = states.get(messageId);
    if (state !== undefined) {
      installRendererHostAutoResize(state);
    }
  });

  states.set(messageId, {
    app,
    data,
    host: $host[0],
    mesText,
    originalContentVisible: false,
    resizeObserver: null,
    resizeFrame: null,
    destroy: () => {
      const state = states.get(messageId);
      state?.resizeObserver?.disconnect();
      if (state?.resizeFrame !== null && state?.resizeFrame !== undefined) {
        window.cancelAnimationFrame(state.resizeFrame);
      }
      app.unmount();
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
