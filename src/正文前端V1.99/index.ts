// @no-production-source-map
import { teleportStyle } from '@util/script';
import RootApp from './RootApp.vue';
import { bindForkImageCache, disposeForkImagePreloader } from './assets/image-preload-runtime';
import { installFloatingPhone, isPhoneGeneration } from './phone/runtime';
import { installExperienceMaintenance } from './progression/maintenance-installer';
import { installProgressionCleanup } from './progression/retention';
import { installBankRuntime } from './bank/runtime';
import { installMoneyRuntime } from './money/runtime';
import { installAmamiStateRuntime } from './state/runtime';
import { readPlayerIdentityId } from './identity/selection';
import {
  destroyAllOpeningRenderers,
  destroyOpeningRenderer,
  pruneOpeningRenderers,
  renderOpeningMessage,
} from './opening/opening-renderer';
import { isOpeningMessageText, mutationTouchesOpeningSlot } from './opening/opening-slot';
import {
  clearInlineCombats,
  discardInlineCombat,
  getInlineCombatMessageIds,
  isCombatNarrationInProgress,
  pruneInlineCombats,
  refreshInlineCombatPlayers,
} from './battle/inline-session';
import {
  destroyAllBattleRenderers,
  destroyBattleRenderer,
  mutationTouchesBattleSlot,
  pruneBattleRenderers,
  renderBattleMessage,
} from './battle/battle-renderer';
import { resolveHostDeviceMode } from './device-mode';
import { RGB_ROLE_OUTPUT_CONTRACT } from './engine/rgb-names';
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
  extractChoiceAnalysis,
  extractChoiceOptions,
  extractContent,
  extractJsonPatchBlocks,
  extractParallelEvents,
  extractThinkingContent,
  getMessageDialogueMapSourceText,
  removeDialogueMapOutsideCot,
  stripCotBlocksForStructure,
  stripGeneratedParagraphLabels,
  stripNarrativeDisplayBlocks,
} from './engine/content-blocks';
import { getNarrativeSlot, mutationTouchesNarrativeSlot } from './engine/content-slot';
import { removeLegacyDisplayRules } from './engine/narrative-display-rule';
import {
  clearScriptMessageDisplays,
  prepareScriptMessageDisplay,
  pruneScriptMessageDisplays,
  releaseScriptMessageDisplay,
} from './engine/message-display';
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
  placeRendererHostInContentSlot,
  removeRendererHosts,
  restoreHiddenContent,
  scheduleRendererHostHeightSync,
  setHiddenContentVisibleForRenderer,
  setRendererHostMinimized,
} from './engine/renderer-host';
import type { RendererState } from './engine/renderer-host';
import {
  SECOND_USER_STORY_LEGACY_PROMPT_IDS,
  SECOND_USER_STORY_SOURCE_MESSAGE_ID,
  buildSecondUserStoryInput,
  resolveSecondUserStoryGenerationMessage,
  usesSecondUserStoryInput,
} from './engine/second-user-story-prompt';
import { readCanonicalUserVariableName } from './engine/tavern-variable-runtime';
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
const dialogueMapMemoryCache = new Map<number, ReturnType<typeof createStoredDialogueMap>>();
const preparedMessageCache = new Map<
  number,
  { source: string; swipeId: number; value: ReturnType<typeof prepareRendererMessage> }
>();
const pendingObservedMessageIds = new Set<number>();
const stopList: Array<() => void> = [];
let hasStopped = false;
let generationStartIndex: number | null = null;
let rendererChatId = SillyTavern.getCurrentChatId();
let chatObserver: MutationObserver | null = null;
let dialogueMapPromptInjection: { uninject: () => void } | null = null;

type LegacyStoryPromptHost = typeof globalThis & {
  __bpSecondUserStoryPromptRuntimeV1?: { injection: { uninject: () => void } };
};

type TavernHelperRuntime = {
  injectPrompts?: typeof injectPrompts;
  uninjectPrompts?: typeof uninjectPrompts;
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

function getUninjectPromptsRuntime() {
  if (typeof uninjectPrompts === 'function') {
    return uninjectPrompts;
  }

  return getTavernHelperRuntime().uninjectPrompts;
}

function getLegacyStoryPromptHost(): LegacyStoryPromptHost {
  try {
    if (typeof window !== 'undefined' && window.parent !== window) {
      const parent = window.parent as unknown as LegacyStoryPromptHost;
      if (parent.__bpSecondUserStoryPromptRuntimeV1) return parent;
    }
  } catch {
    // 跨域预览只能清理当前窗口保存的句柄。
  }

  return globalThis as LegacyStoryPromptHost;
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
  choiceAnalysis: string,
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
  if (state.data.choice_analysis !== choiceAnalysis) {
    state.data.choice_analysis = choiceAnalysis;
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
    window.setTimeout(() => {
      if (hasStopped) return;
      scheduleVariableRevisionBump(messageId);
      refreshInlineCombatPlayers(messageId);
    }, delay);
  });
}

function destroyAllInvalid() {
  pruneInlineCombats();
  const allowedMessageIds = createLatestRenderableAiMessageIdSet();
  pruneBattleRenderers(allowedMessageIds);
  pruneOpeningRenderers(allowedMessageIds);
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
      // Save the speaker map and clean the message together; history sent to the model needs only the prose.
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
    content:
      extractedContent === null ? null : stripGeneratedParagraphLabels(stripNarrativeDisplayBlocks(extractedContent)),
    thinkingContent: extractThinkingContent(message),
    parallelEvents: extractParallelEvents(cleanedMessage),
    choiceOptions: extractChoiceOptions(cleanedMessage),
    choiceAnalysis: extractChoiceAnalysis(cleanedMessage),
    jsonPatchBlocks: extractJsonPatchBlocks(cleanedMessage),
    dialogueMap,
  };
}

function readPreparedRendererMessage(messageId: number) {
  const chatMessage = getChatMessages(messageId)[0];
  const source = chatMessage?.message ?? '';
  const swipeId = SillyTavern.chat[messageId]?.swipe_id ?? 0;
  const cached = preparedMessageCache.get(messageId);
  if (cached?.source === source && cached.swipeId === swipeId) return cached.value;
  const value = prepareRendererMessage(messageId, source, chatMessage);
  preparedMessageCache.set(messageId, { source, swipeId, value });
  return value;
}

function isFightMessageText(message: string) {
  return /<fight\b[^>]*>|<\/fight>/i.test(message);
}

function isFightGenerationContext() {
  if (isCombatNarrationInProgress()) return true;
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
      content: `${DIALOGUE_MAP_OUTPUT_CONTRACT}\n\n${RGB_ROLE_OUTPUT_CONTRACT}`,
      should_scan: false,
      filter: () => !isFightGenerationContext() && !isPhoneGeneration(),
    },
  ]);
}

function uninstallDialogueMapPromptInjection() {
  dialogueMapPromptInjection?.uninject();
  dialogueMapPromptInjection = null;
}

function getChatHistoryForSecondUserStoryInput() {
  const getMessages = getChatMessagesRuntime();
  if (typeof getMessages !== 'function') {
    return [];
  }

  try {
    return getMessages('0-{{lastMessageId}}', { hide_state: 'all' }) as ChatMessage[];
  } catch (error) {
    console.warn('[content-chat-renderer] failed to read chat history for the identity story input', error);
    return [];
  }
}

function clearLegacySecondUserStoryPrompts() {
  const runtimeHost = getLegacyStoryPromptHost();
  runtimeHost.__bpSecondUserStoryPromptRuntimeV1?.injection.uninject();
  delete runtimeHost.__bpSecondUserStoryPromptRuntimeV1;
  getUninjectPromptsRuntime()?.([...SECOND_USER_STORY_LEGACY_PROMPT_IDS]);
}

async function appendSecondUserStoryInput(sourceUserMessage: { message_id: number; message?: string }) {
  const messageId = sourceUserMessage.message_id;
  const identityId = readPlayerIdentityId(messageId);
  if (!usesSecondUserStoryInput(identityId)) return;
  const message = buildSecondUserStoryInput(
    sourceUserMessage.message ?? '',
    readCanonicalUserVariableName(messageId, 0),
    identityId,
  );
  if (message === null) return;
  const setMessages = getSetChatMessagesRuntime();
  if (typeof setMessages !== 'function') return;
  await setMessages([{ message_id: messageId, message }], { refresh: 'affected' });
}

function syncSecondUserStoryInputForChat() {
  const sourceUserMessage = getChatHistoryForSecondUserStoryInput().find(
    message =>
      message.message_id === SECOND_USER_STORY_SOURCE_MESSAGE_ID && message.role === 'user' && !message.is_hidden,
  );
  if (sourceUserMessage) {
    void appendSecondUserStoryInput(sourceUserMessage).catch(error => {
      console.warn('[content-chat-renderer] failed to append the identity story to user input', error);
    });
  }
}

function isCurrentRendererRuntimeConnected() {
  if (hasStopped) {
    return false;
  }

  try {
    return window.frameElement === null || window.frameElement.isConnected;
  } catch {
    return true;
  }
}

const scheduleSecondUserStoryInputSync = _.debounce(() => {
  if (isCurrentRendererRuntimeConnected()) {
    syncSecondUserStoryInputForChat();
  }
}, 0);

function syncSecondUserStoryInputForGeneration(type: string, dryRun: boolean) {
  const generationType = String(type ?? '')
    .trim()
    .toLowerCase();
  if (dryRun || generationType === 'quiet' || generationType === 'impersonate' || isPhoneGeneration()) return;
  const sourceUserMessage = resolveSecondUserStoryGenerationMessage(getChatHistoryForSecondUserStoryInput());
  if (sourceUserMessage) return appendSecondUserStoryInput(sourceUserMessage);
}

function destroyEditedMessageStates() {
  $('#chat')
    .find('#curEditTextarea')
    .closest('.mes')
    .each((_index, node) => {
      const messageId = Number($(node).attr('mesid') ?? 'NaN');
      if (!Number.isNaN(messageId)) {
        destroyState(messageId);
        destroyBattleRenderer(messageId);
        destroyOpeningRenderer(messageId);
      }
    });
}

function getAiMessageElements() {
  return $('#chat').children(AI_MESSAGE_SELECTOR).toArray() as HTMLElement[];
}

function getMessageIdFromAiElement(element: HTMLElement) {
  return Number(element.getAttribute('mesid') ?? 'NaN');
}

function getGeneratingMessageId(): number | null {
  const { chat, streamingProcessor } = SillyTavern;
  const streamingId = streamingProcessor?.messageId;
  if (
    typeof streamingId === 'number' &&
    streamingId >= (generationStartIndex ?? 0) &&
    !streamingProcessor.isStopped &&
    !streamingProcessor.isFinished &&
    !isPhoneGeneration()
  ) {
    return streamingId;
  }

  if (generationStartIndex === null || chat.length <= generationStartIndex) return null;
  const messageId = chat.length - 1;
  const message = chat[messageId];
  return message.is_user || message.is_system ? null : messageId;
}

function getLatestRenderableAiMessageIds() {
  const displayedIds = getAiMessageElements()
    .map(getMessageIdFromAiElement)
    .filter(messageId => !Number.isNaN(messageId));
  const generatingMessageId = getGeneratingMessageId();
  const recentCompletedIds = displayedIds
    .filter(messageId => messageId !== generatingMessageId)
    .slice(-MAX_RENDERED_AI_MESSAGE_COUNT);
  if (generatingMessageId !== null && displayedIds.includes(generatingMessageId)) {
    recentCompletedIds.push(generatingMessageId);
  }
  return [
    ...new Set([
      ...recentCompletedIds,
      ...getInlineCombatMessageIds().filter(messageId => displayedIds.includes(messageId)),
      // The admission form can live on floor zero; later replies must not discard an in-progress dossier.
      ...displayedIds.filter(messageId =>
        isOpeningMessageText(stripCotBlocksForStructure(SillyTavern.chat[messageId]?.mes ?? '')),
      ),
    ]),
  ];
}

function createLatestRenderableAiMessageIdSet() {
  return new Set(getLatestRenderableAiMessageIds());
}

function removeRendererForMessage(messageId: number) {
  preparedMessageCache.delete(messageId);
  pendingObservedMessageIds.delete(messageId);
  destroyState(messageId);
  destroyBattleRenderer(messageId);
  destroyOpeningRenderer(messageId);

  const $messageElement = $(`.mes[mesid='${messageId}']`) as JQuery<HTMLElement>;
  const mesText = $messageElement.find('.mes_text').first()[0];
  if (mesText !== undefined) {
    restoreHiddenContent(messageId, mesText);
  }
  if ($messageElement.length > 0) {
    removeRendererHosts($messageElement, messageId);
  }
  releaseScriptMessageDisplay(messageId);
}

function pruneRenderersToLatestAiMessages(allowedMessageIds = createLatestRenderableAiMessageIdSet()) {
  pruneBattleRenderers(allowedMessageIds);
  pruneOpeningRenderers(allowedMessageIds);
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
  pruneScriptMessageDisplays(allowedMessageIds);
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

function renderOneMessage(messageId: number) {
  if (hasStopped || !_.inRange(messageId, 0, SillyTavern.chat.length)) {
    return;
  }
  // Only the reply ST is writing must wait through the tokens after </content>.
  if (messageId === getGeneratingMessageId()) return;

  const layoutMode = resolveRendererLayoutMode();

  const allowedMessageIds = createLatestRenderableAiMessageIdSet();
  if (!allowedMessageIds.has(messageId)) {
    removeRendererForMessage(messageId);
    return;
  }
  pruneRenderersToLatestAiMessages(allowedMessageIds);

  const $messageElement = $(`.mes[mesid='${messageId}']`);
  const $mesText = $messageElement.find('.mes_text').first() as JQuery<HTMLElement>;
  const mesText = $mesText[0];
  const existingState = states.get(messageId);

  if (isMessageEditing($messageElement)) {
    if (mesText !== undefined) {
      restoreHiddenContent(messageId, mesText);
    }
    destroyState(messageId);
    destroyBattleRenderer(messageId);
    destroyOpeningRenderer(messageId);
    removeRendererHosts($messageElement, messageId);
    releaseScriptMessageDisplay(messageId, false);
    return;
  }

  const rawMessage = getChatMessages(messageId)[0]?.message ?? '';
  if (mesText !== undefined) {
    prepareScriptMessageDisplay(messageId, mesText, rawMessage, SillyTavern.chat[messageId]?.swipe_id ?? 0);
  }
  if (mesText !== undefined && isOpeningMessageText(stripCotBlocksForStructure(rawMessage))) {
    renderOpeningMessage(messageId, mesText, rawMessage, SillyTavern.chat[messageId]?.swipe_id ?? 0);
  } else {
    destroyOpeningRenderer(messageId);
  }
  if (mesText !== undefined && isFightMessageText(stripCotBlocksForStructure(rawMessage))) {
    renderBattleMessage(messageId, mesText, rawMessage, SillyTavern.chat[messageId]?.swipe_id ?? 0);
  } else {
    destroyBattleRenderer(messageId);
  }

  if (mesText === undefined || getNarrativeSlot(mesText) === null) {
    if (mesText !== undefined) {
      restoreHiddenContent(messageId, mesText);
    }
    destroyState(messageId);
    removeRendererHosts($messageElement, messageId);
    return;
  }

  const preparedMessage = readPreparedRendererMessage(messageId);
  const content = preparedMessage.content;
  if (content === null) {
    destroyState(messageId);
    return;
  }

  if (existingState !== undefined && existingState.layoutMode !== layoutMode) {
    destroyState(messageId);
  } else if (existingState !== undefined) {
    if (isNodeConnectedToItsDocument(existingState.host) && mesText.contains(existingState.host)) {
      const shouldRefreshHiddenContent =
        existingState.mesText !== mesText || !hasHiddenContentForRenderer(messageId, mesText);
      if (shouldRefreshHiddenContent && !hideDisplayedContentForRenderer(messageId, mesText)) return;
      existingState.mesText = mesText;
      setHiddenContentVisibleForRenderer(messageId, mesText, existingState.originalContentVisible);
      scheduleRendererHostHeightSync(existingState);
      updateRendererStateData(
        existingState,
        content,
        preparedMessage.thinkingContent,
        preparedMessage.parallelEvents,
        preparedMessage.choiceOptions,
        preparedMessage.choiceAnalysis,
        preparedMessage.jsonPatchBlocks,
        false,
        preparedMessage.dialogueMap,
      );
      return;
    }

    destroyState(messageId);
  }

  removeRendererHosts($messageElement, messageId);

  if (!hideDisplayedContentForRenderer(messageId, mesText)) return;

  const $host = createRendererHost(messageId, layoutMode);

  const data = reactive<ContentRendererContext>({
    layout_mode: layoutMode,
    message_id: messageId,
    content,
    thinking_content: preparedMessage.thinkingContent,
    parallel_events: preparedMessage.parallelEvents,
    choice_options: preparedMessage.choiceOptions,
    choice_analysis: preparedMessage.choiceAnalysis,
    json_patch_blocks: preparedMessage.jsonPatchBlocks,
    during_streaming: false,
    dialogue_map: preparedMessage.dialogueMap,
    variable_revision: 0,
    variable_refresh_needed: false,
    set_original_content_visible: visible => setOriginalContentVisibleForRenderer(messageId, visible),
    set_variable_refresh_needed: needed => setVariableRefreshNeededForRenderer(messageId, needed),
  });

  const app = createApp(RootApp).provide('content_renderer_context', data);
  let stopImageBindings: (() => void) | undefined;
  $host.on('load', function (this: HTMLIFrameElement) {
    stopImageBindings = bindForkImageCache(this.contentWindow!);
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
      stopImageBindings?.();
      if (state !== undefined && isNodeConnectedToItsDocument(state.mesText)) {
        restoreHiddenContent(messageId, state.mesText);
      }
      if (isNodeConnectedToItsDocument($host[0])) {
        $host[0].remove();
      }
      states.delete(messageId);
    },
  });
  // Register the load handler and state before insertion can start loading the iframe.
  if (!placeRendererHostInContentSlot($host[0], mesText)) destroyState(messageId);
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
  if (Number.isNaN(messageId) || messageId === getGeneratingMessageId()) {
    return;
  }

  pendingObservedMessageIds.add(messageId);
  scheduleRenderObservedMessages();
}

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
      if (
        isRenderableMessageElement(messageElement) &&
        (mutationTouchesNarrativeSlot(mutation) ||
          mutationTouchesBattleSlot(mutation) ||
          mutationTouchesOpeningSlot(mutation))
      ) {
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

async function init() {
  clearLegacySecondUserStoryPrompts();
  stopList.push(installAmamiStateRuntime());
  stopList.push(installProgressionCleanup());
  await installExperienceMaintenance();
  stopList.push(installBankRuntime());
  stopList.push(installMoneyRuntime());
  uninjectPrompts(['amami-cumulative-experience-v1']);
  const imageHost = $('#chat')[0].ownerDocument.defaultView!;
  // Script entries use the host's Vue renderer; its images are created in the host realm.
  bindForkImageCache(imageHost, imageHost);
  bindForkImageCache(window, imageHost);
  stopList.push(installFloatingPhone());
  const migrateDisplayRules = errorCatched(async () => {
    await removeLegacyDisplayRules();
    if (!hasStopped) scheduleRenderAllMessages();
  });
  installDialogueMapPromptInjection();
  syncSecondUserStoryInputForChat();
  stopList.push(uninstallDialogueMapPromptInjection);
  installVariableRefreshSync();
  installRendererLayoutModeSync();
  scopedEventOn('chatLoaded', () => {
    clearLegacySecondUserStoryPrompts();
    if (rendererChatId !== SillyTavern.getCurrentChatId()) {
      clearInlineCombats();
      rendererChatId = SillyTavern.getCurrentChatId();
    }
    installDialogueMapPromptInjection();
    syncSecondUserStoryInputForChat();
    generationStartIndex = null;
    preparedMessageCache.clear();
    dialogueMapMemoryCache.clear();
    states.forEach(({ destroy }) => destroy());
    destroyAllBattleRenderers();
    destroyAllOpeningRenderers();
    clearScriptMessageDisplays();
    migrateDisplayRules();
  });
  scopedEventOn(tavern_events.CHAT_CHANGED, () => {
    clearLegacySecondUserStoryPrompts();
    if (rendererChatId !== SillyTavern.getCurrentChatId()) {
      clearInlineCombats();
      rendererChatId = SillyTavern.getCurrentChatId();
    }
    generationStartIndex = null;
    preparedMessageCache.clear();
    dialogueMapMemoryCache.clear();
    pendingObservedMessageIds.clear();
    states.forEach(({ destroy }) => destroy());
    destroyAllBattleRenderers();
    destroyAllOpeningRenderers();
    clearScriptMessageDisplays();
    installDialogueMapPromptInjection();
    syncSecondUserStoryInputForChat();
    migrateDisplayRules();
  });
  scopedEventOn(tavern_events.GENERATION_STARTED, (type, _options, dryRun) => {
    if (dryRun || type === 'quiet' || type === 'impersonate' || isPhoneGeneration()) return;
    const { chat } = SillyTavern;
    const reusesLastFloor = ['regenerate', 'swipe', 'continue', 'append', 'appendFinal'].includes(type);
    generationStartIndex = reusesLastFloor && chat.length > 0 && !chat.at(-1)?.is_user ? chat.length - 1 : chat.length;
  });
  const finishGeneration = () => {
    if (isPhoneGeneration()) return;
    generationStartIndex = null;
    scheduleRenderAllMessages();
  };
  scopedEventOn(tavern_events.GENERATION_ENDED, finishGeneration);
  scopedEventOn(tavern_events.GENERATION_STOPPED, finishGeneration);
  scopedEventOn(tavern_events.USER_MESSAGE_RENDERED, messageId => {
    if (messageId === SECOND_USER_STORY_SOURCE_MESSAGE_ID) {
      return syncSecondUserStoryInputForGeneration('normal', false);
    }
  });
  scopedEventOn(
    tavern_events.GENERATION_AFTER_COMMANDS,
    (type, _option, dryRun) => syncSecondUserStoryInputForGeneration(type, dryRun),
    true,
  );
  scopedEventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, messageId => {
    if (messageId === getGeneratingMessageId()) return;
    destroyAllInvalid();
    queueObservedMessageRender(messageId);
  });
  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_DELETED, tavern_events.MESSAGE_SWIPED].forEach(event =>
    scopedEventOn(event, messageId => {
      if (event === tavern_events.MESSAGE_DELETED || event === tavern_events.MESSAGE_SWIPED)
        discardInlineCombat(messageId);
      preparedMessageCache.delete(messageId);
      destroyAllInvalid();
      destroyState(messageId);
      destroyBattleRenderer(messageId);
      destroyOpeningRenderer(messageId);
      queueObservedMessageRender(messageId);
    }),
  );
  scopedEventOn(tavern_events.MESSAGE_UPDATED, messageId => {
    preparedMessageCache.delete(messageId);
    queueObservedMessageRender(messageId);
  });
  [tavern_events.MORE_MESSAGES_LOADED, tavern_events.MESSAGE_DELETED].forEach(event =>
    scopedEventOn(event, () => scheduleRenderAllMessages()),
  );
  scopedEventOn(tavern_events.MESSAGE_DELETED, () => scheduleSecondUserStoryInputSync());

  attachChatObserver();
  migrateDisplayRules();
  console.info('[content-chat-renderer] V1.99 + 性斗（Battle Fuck） + SKYLINK + 入学档案 mounted');

  $(window).on('pagehide.content-chat-renderer', () => {
    disposeForkImagePreloader();
    hasStopped = true;
    scheduleRenderAllMessages.cancel();
    scheduleRenderObservedMessages.cancel();
    scheduleSecondUserStoryInputSync.cancel();
    pendingObservedMessageIds.clear();
    preparedMessageCache.clear();
    states.forEach(({ destroy }) => destroy());
    destroyAllBattleRenderers();
    destroyAllOpeningRenderers();
    clearScriptMessageDisplays(true);
    stopList.forEach(stop => stop());
    clearInlineCombats();
    console.info('[content-chat-renderer] unmounted');
  });
}

$(() => {
  errorCatched(init)();
});
