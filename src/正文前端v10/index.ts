import { createScriptIdIframe, teleportStyle } from '@util/script';
import type { App as VueApp, Reactive } from 'vue';
import App from './App.vue';
import './baipo-narrative-embed.css';

type ContentRendererContext = {
  message_id: number;
  content: string;
  during_streaming: boolean;
};

type TextPoint = {
  node: Text;
  offset: number;
};

type RendererState = {
  app: VueApp;
  data: Reactive<ContentRendererContext>;
  host: HTMLIFrameElement;
  extracted: DocumentFragment;
  destroy: (options?: DestroyStateOptions) => void;
};

type DestroyStateOptions = {
  restoreExtracted?: boolean;
};

const displayedContentPattern = /<(content|maintext)\b[^>]*>[\s\S]*?(?:<\/\1>|$)/i;
const states = new Map<number, RendererState>();
const rangeRetryCounts = new Map<number, number>();
const streamingMessageIds = new Set<number>();
const stopList: Array<() => void> = [];
let hasStopped = false;
let chatObserver: MutationObserver | null = null;

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

function stripHiddenBlocks(text: string) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, '')
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
  range.selectNode(contentElement);
  return range;
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
  const visibleContent = stripHiddenBlocks(content);
  if (visibleContent.length === 0) {
    return null;
  }

  const { text, textNodes } = collectTextNodes(root);
  const normalizedText = normalizeWithOffsets(text);
  const normalizedContent = normalizeWithOffsets(visibleContent);
  if (normalizedContent.text.length === 0) {
    return null;
  }

  const normalizedStart = normalizedText.text.indexOf(normalizedContent.text);
  if (normalizedStart < 0) {
    return null;
  }

  const normalizedEnd = normalizedStart + normalizedContent.text.length - 1;
  const originalStart = normalizedText.offsets[normalizedStart];
  const originalEnd = normalizedText.offsets[normalizedEnd] + 1;
  const startPoint = findTextPoint(textNodes, originalStart);
  const endPoint = findTextPoint(textNodes, originalEnd);
  if (startPoint === null || endPoint === null) {
    return null;
  }

  const range = root.ownerDocument.createRange();
  range.setStart(startPoint.node, startPoint.offset);
  range.setEnd(endPoint.node, endPoint.offset);
  return range;
}

function findDisplayedContentRange($mesText: JQuery<HTMLElement>, content: string): Range | null {
  const root = $mesText[0];
  if (root === undefined) {
    return null;
  }

  return findElementContentRange(root) ?? findLiteralTaggedContentRange(root) ?? findPlainContentRange(root, content);
}

function destroyState(messageId: number, options?: DestroyStateOptions) {
  states.get(messageId)?.destroy(options);
}

function isNodeConnectedToItsDocument(node: Node) {
  return node.ownerDocument.contains(node);
}

function isHostMounted(host: HTMLIFrameElement) {
  return host.contentDocument?.body.querySelector('.ContentChatRenderer') !== null;
}

function safeMatches(element: Element, selector: string) {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function shouldIgnoreOutsideTextNode(node: Text, root: HTMLElement, host: HTMLIFrameElement) {
  if (host.contains(node)) {
    return true;
  }

  let current = node.parentElement;
  while (current !== null && current !== root) {
    const tagName = current.tagName.toLowerCase();
    if (tagName === 'script' || tagName === 'style' || tagName === 'textarea' || tagName === 'iframe') {
      return true;
    }

    if (safeMatches(current, '.TH-render, .custom-moon-thinking, #curEditTextarea')) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function collectTextOutsideHost(root: HTMLElement, host: HTMLIFrameElement) {
  const ownerDocument = root.ownerDocument;
  const showText = ownerDocument.defaultView?.NodeFilter.SHOW_TEXT ?? 4;
  const walker = ownerDocument.createTreeWalker(root, showText);
  let text = '';

  while (true) {
    const current = walker.nextNode();
    if (current === null) {
      break;
    }

    const node = current as Text;
    if (!shouldIgnoreOutsideTextNode(node, root, host)) {
      text += node.nodeValue ?? '';
    }
  }

  return text;
}

function isContentDuplicatedOutsideHost(root: HTMLElement, host: HTMLIFrameElement, content: string) {
  const normalizedContent = normalizeWithOffsets(stripHiddenBlocks(content)).text;
  if (normalizedContent.length < 48) {
    return false;
  }

  const normalizedOutsideText = normalizeWithOffsets(collectTextOutsideHost(root, host)).text;
  const headProbe = normalizedContent.slice(0, Math.min(96, normalizedContent.length));
  const tailProbe =
    normalizedContent.length > 220
      ? normalizedContent.slice(Math.max(0, normalizedContent.length - 96))
      : normalizedContent.slice(Math.max(0, normalizedContent.length - 48));

  return normalizedOutsideText.includes(headProbe) && normalizedOutsideText.includes(tailProbe);
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

function renderOneMessage(messageId: number, streamMessage?: string) {
  if (hasStopped || !_.inRange(messageId, 0, SillyTavern.chat.length)) {
    return;
  }

  const message = streamMessage ?? getChatMessages(messageId)[0]?.message ?? '';
  const isStreamingMessage = streamMessage !== undefined || streamingMessageIds.has(messageId);
  if (isStreamingMessage && !hasClosedContentTag(message)) {
    rangeRetryCounts.delete(messageId);
    return;
  }
  if (isStreamingMessage) {
    streamingMessageIds.delete(messageId);
  }

  const content = extractContent(message);
  const $messageElement = $(`.mes[mesid='${messageId}']`);
  const $mesText = $messageElement.find('.mes_text').first() as JQuery<HTMLElement>;
  const existingState = states.get(messageId);

  if (isMessageEditing($messageElement)) {
    destroyState(messageId);
    return;
  }

  if (content === null || $mesText.length === 0) {
    rangeRetryCounts.delete(messageId);
    destroyState(messageId);
    return;
  }

  if (existingState !== undefined) {
    const isExistingHostConnected = isNodeConnectedToItsDocument(existingState.host);
    const hasDuplicatedContent =
      isExistingHostConnected && isContentDuplicatedOutsideHost($mesText[0], existingState.host, content);

    if (isExistingHostConnected && isHostMounted(existingState.host) && !hasDuplicatedContent) {
      rangeRetryCounts.delete(messageId);
      existingState.data.content = content;
      existingState.data.during_streaming = Boolean(streamMessage);
      return;
    }

    destroyState(messageId, { restoreExtracted: !hasDuplicatedContent });
  }

  const range = findDisplayedContentRange($mesText, content);
  if (range === null) {
    console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
    scheduleRangeRetry(messageId);
    return;
  }
  rangeRetryCounts.delete(messageId);

  const $host = createScriptIdIframe()
    .attr('id', `baipo-content-renderer-${messageId}`)
    .css({
      border: 0,
      display: 'block',
      width: '100%',
      'max-width': '100%',
      height: 'clamp(980px, 64vw, 1080px)',
      'min-height': 'clamp(980px, 64vw, 1080px)',
      margin: '0.75rem 0',
    });

  const extracted = range.extractContents();
  range.insertNode($host[0]);

  const data = reactive<ContentRendererContext>({
    message_id: messageId,
    content,
    during_streaming: Boolean(streamMessage),
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
    extracted,
    destroy: (options = {}) => {
      app.unmount();
      if (isNodeConnectedToItsDocument($host[0])) {
        if (options.restoreExtracted === false) {
          $host[0].remove();
        } else {
          $host[0].replaceWith(extracted);
        }
      }
      states.delete(messageId);
    },
  });
}

function renderAllMessages() {
  if (hasStopped) {
    return;
  }

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

function scopedEventOn<T extends EventType>(event: T, listener: ListenerType[T], first?: true) {
  stopList.push(first ? eventMakeFirst(event, errorCatched(listener)).stop : eventOn(event, errorCatched(listener)).stop);
}

const scheduleRenderAllMessages = _.debounce(() => {
  renderAllMessages();
}, 120);

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
  chatObserver = new ChatMutationObserver(() => {
    if (hasStopped) {
      return;
    }
    scheduleRenderAllMessages();
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
  scopedEventOn('chatLoaded', () => {
    streamingMessageIds.clear();
    states.forEach(({ destroy }) => destroy());
    renderAllMessages();
  });
  scopedEventOn(
    tavern_events.CHARACTER_MESSAGE_RENDERED,
    messageId => {
      scheduleStreamingRender.cancel();
      streamingMessageIds.delete(messageId);
      destroyAllInvalid();
      renderOneMessage(messageId);
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
  console.info('[content-chat-renderer] mounted');

  $(window).on('pagehide.content-chat-renderer', () => {
    hasStopped = true;
    scheduleRenderAllMessages.cancel();
    scheduleStreamingRender.cancel();
    streamingMessageIds.clear();
    states.forEach(({ destroy }) => destroy());
    stopList.forEach(stop => stop());
    console.info('[content-chat-renderer] unmounted');
  });
}

$(() => {
  errorCatched(init)();
});
