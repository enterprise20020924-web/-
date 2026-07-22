// @no-production-source-map
import { teleportStyle } from '@util/script';
import RootApp from './RootApp.vue';
import { resolveHostDeviceMode } from './device-mode';
import {
  DIALOGUE_MAP_DATA_KEY,
  DIALOGUE_MAP_OUTPUT_CONTRACT,
  DIALOGUE_MAP_PROMPT_ID,
  calibrateDialogueMapEntriesForSource,
  createStoredDialogueMap,
  extractDialogueMapFromMessage,
  getCurrentSwipeVariableValue,
  isDialogueMapCompleteForSource,
  readStoredDialogueMap,
} from './engine/dialogue-map';
import {
  extractChoiceOptions,
  extractContent,
  extractJsonPatchBlocks,
  extractParallelEvents,
  extractThinkingContent,
  getMessageDialogueMapSourceText,
  removeDialogueMapOutsideCot,
  stripCotBlocksForStructure,
  stripGeneratedParagraphLabels,
  stripHiddenBlocks,
} from './engine/content-blocks';
import {
  areChoiceOptionsEqual,
  areDialogueMapsEqual,
  areParallelEventsEqual,
  areStringArraysEqual,
} from './engine/content-equality';
import {
  createRendererHost,
  getMessageElementFromNode,
  getMessageIdFromElement,
  hasHiddenContentForRenderer,
  hideDisplayedContentForRenderer,
  installRendererHostAutoResize,
  isInternalRendererMutation,
  isNodeConnectedToItsDocument,
  isRenderableMessageElement,
  mutationTouchesMessageList,
  placeExistingRendererHosts,
  placeRendererHostBeforeMessageText,
  removeFollowingBareDialogueMapNodes,
  removeRendererHosts,
  restoreHiddenContent,
  scheduleRendererHostHeightSync,
  setHiddenContentVisibleForRenderer,
  setRendererHostMinimized,
} from './engine/renderer-host';
import type { RendererState } from './engine/renderer-host';
import type { DialogueMapEntry } from './types/narrative';
import type { ChoiceOption, ContentRendererContext, ParallelEvent } from './types/content-renderer';
import './baipo-narrative-embed.css';

const VARIABLE_REFRESH_POLL_INTERVAL_MS = 1500;
const MAX_RENDERED_AI_MESSAGE_COUNT = 3;
const AI_MESSAGE_SELECTOR = ".mes[is_user='false'][is_system='false']";
function resolveRendererLayoutMode() {
  return resolveHostDeviceMode(window);
}

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
const stopList: Array<() => void> = [];
let hasStopped = false;
let chatObserver: MutationObserver | null = null;
let dialogueMapPromptInjection: { uninject: () => void } | null = null;

type TavernHelperRuntime = {
  injectPrompts?: typeof injectPrompts;
  getChatMessages?: typeof getChatMessages;
  getVariables?: typeof getVariables;
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

function getVariablesRuntime() {
  if (typeof getVariables === 'function') {
    return getVariables;
  }

  return getTavernHelperRuntime().getVariables;
}

function getMessageVariableValue(messageId: number, key: string) {
  const readVariables = getVariablesRuntime();
  if (typeof readVariables !== 'function') {
    return undefined;
  }

  try {
    return readVariables({ type: 'message', message_id: messageId })?.[key];
  } catch (error) {
    console.warn(`[content-chat-renderer] failed to read message variables for message ${messageId}`, error);
    return undefined;
  }
}

function destroyState(messageId: number) {
  states.get(messageId)?.destroy();
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
  setTimeout(
    errorCatched(() => renderOneMessage(messageId)),
    350,
  );
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
  const renderExtractedDialogueMap = calibrateDialogueMapEntriesForSource(extractedDialogueMap.entries, sourceText);
  const hasCompleteExtractedDialogueMap = isDialogueMapCompleteForSource(extractedDialogueMap.entries, sourceText);
  const extractedStoredMap =
    extractedDialogueMap.found && extractedDialogueMap.entries.length > 0
      ? createStoredDialogueMap(extractedDialogueMap.entries, sourceText)
      : null;
  const helperDialogueMapValue = chatMessage?.data?.[DIALOGUE_MAP_DATA_KEY];
  const helperSwipeDialogueMapValue = getCurrentSwipeVariableValue(chatMessage, DIALOGUE_MAP_DATA_KEY);
  const swipeDialogueMapValue = getCurrentSwipeVariableValue(SillyTavern.chat?.[messageId], DIALOGUE_MAP_DATA_KEY);
  const mergedMessageDialogueMapValue = getMessageVariableValue(messageId, DIALOGUE_MAP_DATA_KEY);
  const storedDialogueMap =
    readStoredDialogueMap(helperSwipeDialogueMapValue, sourceText, true) ??
    readStoredDialogueMap(swipeDialogueMapValue, sourceText, true) ??
    readStoredDialogueMap(mergedMessageDialogueMapValue, sourceText, true) ??
    readStoredDialogueMap(helperDialogueMapValue, sourceText, true) ??
    readStoredDialogueMap(dialogueMapMemoryCache.get(messageId), sourceText);
  const normalizedStoredDialogueMap =
    storedDialogueMap === null ? null : createStoredDialogueMap(storedDialogueMap.entries, sourceText);
  const renderStoredDialogueMap =
    normalizedStoredDialogueMap === null
      ? []
      : calibrateDialogueMapEntriesForSource(normalizedStoredDialogueMap.entries, sourceText);
  if (normalizedStoredDialogueMap !== null) {
    dialogueMapMemoryCache.set(messageId, normalizedStoredDialogueMap);
  }
  const dialogueMap = extractedDialogueMap.found ? renderExtractedDialogueMap : renderStoredDialogueMap;
  if (extractedDialogueMap.found && !hasCompleteExtractedDialogueMap) {
    console.warn(
      `[content-chat-renderer] incomplete dialogue_map for message ${messageId}; available P entries retained`,
    );
  }
  if (
    !extractedDialogueMap.found &&
    storedDialogueMap === null &&
    (helperDialogueMapValue !== undefined ||
      helperSwipeDialogueMapValue !== undefined ||
      swipeDialogueMapValue !== undefined ||
      mergedMessageDialogueMapValue !== undefined)
  ) {
    console.warn(`[content-chat-renderer] cached dialogue_map rejected for message ${messageId}`);
  }
  const shouldCacheExtractedMap =
    chatMessage !== undefined &&
    extractedStoredMap !== null &&
    (storedDialogueMap === null || !areDialogueMapsEqual(storedDialogueMap.entries, extractedStoredMap.entries));
  const messageWithoutDialogueMap = extractedDialogueMap.found ? removeDialogueMapOutsideCot(message) : message;

  if (
    chatMessage !== undefined &&
    extractedDialogueMap.found &&
    (shouldCacheExtractedMap || messageWithoutDialogueMap !== message)
  ) {
    if (extractedStoredMap !== null) {
      dialogueMapMemoryCache.set(messageId, extractedStoredMap);
    }
    const nextData =
      extractedStoredMap === null
        ? chatMessage.data
        : {
            ...(chatMessage.data ?? {}),
            [DIALOGUE_MAP_DATA_KEY]: extractedStoredMap,
          };
    const setMessages = getSetChatMessagesRuntime();
    if (typeof setMessages === 'function') {
      void setMessages([{ message_id: messageId, message: messageWithoutDialogueMap, data: nextData }], {
        refresh: 'none',
      }).catch(error => {
        console.warn('[content-chat-renderer] failed to cache dialogue_map extraction', error);
      });
    }
  }

  const extractedContent = extractContent(cleanedMessage);

  return {
    message,
    content: extractedContent === null ? null : stripGeneratedParagraphLabels(stripHiddenBlocks(extractedContent)),
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

function getAiMessageElements() {
  return $('#chat').children(AI_MESSAGE_SELECTOR).toArray() as HTMLElement[];
}

function getMessageIdFromAiElement(element: HTMLElement) {
  return Number(element.getAttribute('mesid') ?? 'NaN');
}

function getLatestRenderableAiMessageIds() {
  return getAiMessageElements()
    .slice(-MAX_RENDERED_AI_MESSAGE_COUNT)
    .map(getMessageIdFromAiElement)
    .filter(messageId => !Number.isNaN(messageId));
}

function createLatestRenderableAiMessageIdSet() {
  return new Set(getLatestRenderableAiMessageIds());
}

function removeRendererForMessage(messageId: number) {
  rangeRetryCounts.delete(messageId);
  pendingObservedMessageIds.delete(messageId);
  destroyState(messageId);

  const $messageElement = $(`.mes[mesid='${messageId}']`) as JQuery<HTMLElement>;
  const mesText = $messageElement.find('.mes_text').first()[0];
  if (mesText !== undefined) {
    restoreHiddenContent(messageId, mesText);
  }
  if ($messageElement.length > 0) {
    removeRendererHosts($messageElement, messageId);
  }
}

function pruneRenderersToLatestAiMessages(allowedMessageIds = createLatestRenderableAiMessageIdSet()) {
  states.forEach((_state, messageId) => {
    if (!allowedMessageIds.has(messageId)) {
      removeRendererForMessage(messageId);
    }
  });

  getAiMessageElements().forEach(element => {
    const messageId = getMessageIdFromAiElement(element);
    if (!Number.isNaN(messageId) && !allowedMessageIds.has(messageId)) {
      removeRendererForMessage(messageId);
    }
  });
}

function setOriginalContentVisibleForRenderer(messageId: number, visible: boolean) {
  const state = states.get(messageId);
  if (state === undefined || !isNodeConnectedToItsDocument(state.mesText)) {
    return;
  }

  state.originalContentVisible = visible;
  setHiddenContentVisibleForRenderer(messageId, state.mesText, visible);
  setRendererHostMinimized(state, visible);
}

function renderOneMessage(messageId: number, streamMessage?: string) {
  if (hasStopped || !_.inRange(messageId, 0, SillyTavern.chat.length)) {
    return;
  }

  const layoutMode = resolveRendererLayoutMode();

  const allowedMessageIds = createLatestRenderableAiMessageIdSet();
  if (!allowedMessageIds.has(messageId)) {
    removeRendererForMessage(messageId);
    return;
  }
  pruneRenderersToLatestAiMessages(allowedMessageIds);

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

  if (existingState !== undefined && existingState.layoutMode !== layoutMode) {
    destroyState(messageId);
  } else if (existingState !== undefined) {
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

  const $host = createRendererHost(messageId, layoutMode);

  placeRendererHostBeforeMessageText($host[0], mesText);
  removeFollowingBareDialogueMapNodes($host[0]);

  if (!hideDisplayedContentForRenderer(messageId, mesText)) {
    $host.remove();
    console.warn(`[content-chat-renderer] content range not found in message ${messageId}`);
    scheduleRangeRetry(messageId);
    return;
  }

  const data = reactive<ContentRendererContext>({
    layout_mode: layoutMode,
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

  const app = createApp(RootApp).provide('content_renderer_context', data);
  $host.on('load', function (this: HTMLIFrameElement) {
    this.contentDocument!.documentElement.dataset.bpLayout = layoutMode;
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
    layoutMode,
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
  const targetMessageIds = getLatestRenderableAiMessageIds();
  pruneRenderersToLatestAiMessages(new Set(targetMessageIds));
  targetMessageIds.forEach(messageId => {
    renderOneMessage(messageId);
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
  stopList.push(
    first ? eventMakeFirst(event, errorCatched(listener)).stop : eventOn(event, errorCatched(listener)).stop,
  );
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

  [
    tavern_events.MESSAGE_UPDATED,
    tavern_events.USER_MESSAGE_RENDERED,
    tavern_events.CHARACTER_MESSAGE_RENDERED,
  ].forEach(event =>
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

function installRendererLayoutModeSync() {
  const hostWindow = window.parent;
  const scheduleLayoutModeSync = () => scheduleRenderAllMessages();

  hostWindow.addEventListener('resize', scheduleLayoutModeSync);
  hostWindow.addEventListener('orientationchange', scheduleLayoutModeSync);
  hostWindow.visualViewport?.addEventListener('resize', scheduleLayoutModeSync);
  stopList.push(() => {
    hostWindow.removeEventListener('resize', scheduleLayoutModeSync);
    hostWindow.removeEventListener('orientationchange', scheduleLayoutModeSync);
    hostWindow.visualViewport?.removeEventListener('resize', scheduleLayoutModeSync);
  });
}

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
  installRendererLayoutModeSync();
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
