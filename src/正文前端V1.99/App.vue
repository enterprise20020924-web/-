<template>
  <div class="bp-desktop-scale-shell">
    <div class="bp-desktop-scale-surface">
      <article
        :class="[
          'ContentChatRenderer',
          'bp-vector-ui',
          {
            'is-narrative-minimized': isNarrativeMinimized,
            'is-chat-mode': narrativeViewMode === 'chat',
          },
        ]"
        :style="desktopAssetCssVariables"
      >
        <section
          id="bp-narrative-panel"
          ref="mapFrameElement"
          :class="[
            'bp-panel',
            'bp-narrative-panel',
            {
              'is-minimized': isNarrativeMinimized,
              'is-talent-open': isTalentOpen,
              'is-map-open': isCampusMapOpen,
              'is-shittim-open': isFunctionPageOpen,
              'is-battle-open': inlineCombat?.visible,
            },
          ]"
          :aria-labelledby="isTalentOpen || isCampusMapOpen || isFunctionPageOpen ? undefined : 'bp-narrative-title'"
          :aria-label="
            isTalentOpen ? '天赋星盘' : isCampusMapOpen ? '校园地图' : isFunctionPageOpen ? '什亭之匣' : undefined
          "
        >
          <h2 id="bp-narrative-title" class="bp-visually-hidden">剧情舞台</h2>

          <DesktopNarrativeStage
            :background-inert="isBackgroundInert || isTalentOpen || inlineCombat?.visible === true"
            :has-battle="inlineCombat !== undefined"
            :is-narrative-minimized="isNarrativeMinimized"
            :stage-location-label="stageLocationLabel"
            :active-speaker-name="activeSpeakerName"
            :has-thinking-content="hasThinkingContent"
            :stage-time-label="stageTimeLabel"
            :stage-scene-background-url="stageSceneBackgroundUrl"
            :user-portrait-layers="userPortraitLayers"
            :user-portrait-url="userPortraitUrl"
            :is-current-user-speaking="isCurrentUserSpeaking"
            :user-alias="userStatus.alias"
            :npc-portrait-layers="npcPortraitLayers"
            :npc-portrait-url="npcPortraitUrl"
            :is-current-npc-speaking="isCurrentNpcSpeaking"
            :portrait-npc-label="portraitNpcLabel"
            :current-segment="currentSegment"
            :active-speaker-affiliation="activeSpeakerAffiliation"
            :preview-segments="previewSegments"
            :current-index="currentIndex"
            :is-at-end="isAtEnd"
            :segment-count="segments.length"
            :segment-speaker-label="segmentSpeakerLabel"
            :narrative-view-mode="narrativeViewMode"
            :chat-rows="chatRows"
            :is-streaming="isStreaming"
            @restore="restoreNarrative"
            @minimize="minimizeNarrative"
            @open-manual-battle="openManualBattlePage"
            @open-function="openFunctionPage"
            @open-thinking="openThinkingPage"
            @open-map="openCampusMap"
            @open-talent="openTalentStar"
            @scene-error="handleSceneBackgroundError"
            @preview-portrait="openPortraitPreview"
            @portrait-error="handlePortraitLayerError"
            @jump-segment="jumpToSegment"
            @previous="retreatNarrative"
            @next="advanceNarrative"
            @reverse="reverseNarrative"
            @toggle-view-mode="toggleNarrativeViewMode"
            @resume-battle="resumeBattle"
          />
          <div class="bp-desktop-overlay-host">
            <DesktopOverlays
              :is-function-page-open="isFunctionPageOpen"
              :is-thinking-page-open="isThinkingPageOpen"
              :thinking-content="thinkingContent"
              :has-thinking-content="hasThinkingContent"
              :present-relationship-contacts="presentRelationshipContacts"
              :contact-factions="contactFactions"
              :selected-relationship-contact="selectedRelationshipContact"
              :is-starting-battle="isStartingBattle"
              :portrait-preview="portraitPreview"
              @close-function="closeFunctionPage"
              @close-thinking="closeThinkingPage"
              @open-contact="openRelationshipContactPage"
              @close-contact="closeRelationshipContactPage"
              @start-sex-battle="startRelationshipSexBattle"
              @close-portrait="closePortraitPreview"
            />
          </div>
          <InlineBattleView v-if="inlineCombat?.opened" :key="inlineCombat.id" :session="inlineCombat" />
        </section>
        <DesktopSupportPanels
          :background-inert="isThinkingPageOpen || portraitPreview !== null"
          :parallel-events="isNarrativeMinimized ? [] : parallelEvents"
          :is-parallel-events-collapsed="isParallelEventsCollapsed"
          :choice-options="choiceOptions"
          :sex-battle-choice-entry="sexBattleChoiceEntry"
          :selected-choice-option-key="selectedChoiceOptionKey"
          :json-patch-panel="jsonPatchPanel"
          :json-patch-audit="jsonPatchAudit"
          :is-json-patch-panel-collapsed="isJsonPatchPanelCollapsed"
          :resolve-parallel-event-avatar-url="resolveParallelEventAvatarUrl"
          :resolve-parallel-event-affiliation="resolveParallelEventAffiliation"
          @toggle-parallel="toggleParallelEvents"
          @select-choice="handleChoiceOptionClick"
          @select-sex-battle="handleSexBattleChoiceClick"
          @toggle-jsonpatch="isJsonPatchPanelCollapsed = !isJsonPatchPanelCollapsed"
          @audit-jsonpatch="handleJsonPatchAuditClick"
          @parallel-avatar-error="handleParallelEventAvatarError"
        />
      </article>
      <CampusMapDialog
        v-if="isCampusMapOpen"
        :frame-element="mapFrameElement"
        :location-label="stageLocationLabel"
        :time-label="stageTimeLabel"
        @close="closeCampusMap"
      />
      <TalentStarView v-if="isTalentOpen" :frame-element="mapFrameElement" @close="closeTalentStar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import DesktopSupportPanels from './desktop/components/DesktopSupportPanels.vue';
import DesktopNarrativeStage from './desktop/components/DesktopNarrativeStage.vue';
import DesktopOverlays from './desktop/components/DesktopOverlays.vue';
import CampusMapDialog from './map/CampusMapDialog.vue';
import TalentStarView from './talent/TalentStarView.vue';
import InlineBattleView from './battle/InlineBattleView.vue';
import { showInlineCombat, useInlineCombat } from './battle/inline-session';
import { desktopAssetCssVariables } from './desktop/asset-metadata';
import {
  isJsonPatchDeltaOperation,
  parseJsonPatchPanel,
  partitionChoiceOptions,
  resolveJsonPatchOperationTone,
} from './desktop/panel-runtime';
import type { ChoiceOptionEntry } from './desktop/panel-runtime';
import { captureFocusedElement, restoreFocus } from './desktop/overlay-focus';
import { useJsonPatchAudit } from './desktop/use-jsonpatch-audit';
import type { PortraitLayer, PortraitPreview, PortraitPreviewSide } from './desktop/types';
import {
  formatVisibleAffiliation,
  safeSubstituteMacros,
  stripHiddenBlocks,
  uniqueNonEmpty,
} from './desktop/text-runtime';
import { buildNarrativeChatRows } from './engine/narrative-chat';
import { cleanTextKeepingTucao } from './engine/tucao-cameo';
import { konataCameo, resolveCameoAvatarCandidates } from './modules/cameo-profile';
import type { NarrativeChatAvatarCandidate } from './engine/narrative-chat';
import { splitDialogueSource } from './engine/dialogue-splitter';
import { matchesUserIdentityName } from './engine/user-identity';
import { getRelationshipAvatarUrl } from './assets/relationship-avatar';
import { readPlayerIdentityId } from './identity/selection';
import { resolveIdentityPortraitProfile } from './identity/presentation';
import { deriveKnownCharactersForContent } from './engine/known-characters';
import { readUserPortraitGender, readUserRoleName } from './engine/tavern-variable-runtime';
import { startConfiguredSexBattle, startManualSexBattle } from './engine/sex-battle-runtime';
import { useNarrativeViewMode } from './modules/narrative-view-mode';
import type { DialogueMood, DialogueSegment, DialogueSource } from './types/narrative';
import {
  fullbodyPortraitProfiles,
  getFullbodyPortraitUrl,
  resolveFullbodyAssetUrl,
  resolveFullbodyPortraitDisplayName,
  resolveFullbodyPortraitProfile,
  resolveUserPortraitProfile,
} from './portrait-registry';
import type { FullbodyPortraitProfile } from './portrait-registry';
import {
  createRelationshipContact,
  findRelationshipContact,
  groupContactsByFaction,
  isSameRelationshipName,
  readRelationshipSystemView,
  resolveRelationshipBattleStats,
  resolveRelationshipAvatarUrl,
  resolveRelationshipProfile,
  showTavernNotice,
  writeTextToTavernInput,
  focusTavernInput,
} from './mobile/relationship-runtime';
import type { RelationshipContact } from './mobile/relationship-runtime';
import { readMobileStageSceneView } from './mobile/scene-runtime';
import { useStageBackground } from './modules/use-stage-background';
import type { ContentRendererContext } from './types/content-renderer';
import type { UserPortraitGender } from './engine/tavern-variable-runtime';

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const currentIndex = ref(0);
const inlineCombat = useInlineCombat(context.message_id);
const { narrativeViewMode, toggleNarrativeViewMode } = useNarrativeViewMode();
const portraitPreview = ref<PortraitPreview | null>(null);
const portraitPreviewReturnFocus = ref<HTMLElement | null>(null);
const functionPageReturnFocus = ref<HTMLElement | null>(null);
const functionPageOpenedFromMinimized = ref(false);
const thinkingPageReturnFocus = ref<HTMLElement | null>(null);
const isFunctionPageOpen = ref(false);
const isThinkingPageOpen = ref(false);
const isCampusMapOpen = ref(false);
const isTalentOpen = ref(false);
const mapFrameElement = ref<HTMLElement | null>(null);
const campusMapReturnFocus = ref<HTMLElement | null>(null);
const talentReturnFocus = ref<HTMLElement | null>(null);
const isParallelEventsCollapsed = ref(true);
const isNarrativeMinimized = ref(false);
const selectedRelationshipContact = ref<RelationshipContact | null>(null);
const isStartingBattle = ref(false);
const isBackgroundInert = computed(
  () =>
    isFunctionPageOpen.value ||
    isThinkingPageOpen.value ||
    isCampusMapOpen.value ||
    selectedRelationshipContact.value !== null ||
    portraitPreview.value !== null,
);
const selectedChoiceOptionKey = ref<string | null>(null);
const preloadedPortraitUrls = new Set<string>();
const STAGED_SEGMENT_LOOKAHEAD = 2;
const MOOD_HOLD_SEGMENTS = 2;
const thinkingContent = computed(() => (context.thinking_content ?? '').trim());
const hasThinkingContent = computed(() => thinkingContent.value.length > 0);
const parallelEvents = computed(() => context.parallel_events ?? []);
const allChoiceOptions = computed(() => context.choice_options ?? []);
const choiceOptionPartition = computed(() => partitionChoiceOptions(allChoiceOptions.value));
const choiceOptions = computed(() => choiceOptionPartition.value.regular);
const sexBattleChoiceEntry = computed(() => choiceOptionPartition.value.sexBattle);
const jsonPatchPanel = computed(() => parseJsonPatchPanel(context.json_patch_blocks.at(-1) ?? null));
const { jsonPatchAudit, isJsonPatchPanelCollapsed, handleJsonPatchAuditClick } = useJsonPatchAudit(
  context,
  jsonPatchPanel,
);

const AMANE_NAME_PATTERN = /(?:响木)?天音/;
const USER_FULLBODY_PORTRAITS: Record<UserPortraitGender, string> = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png') ?? '',
  female: getFullbodyPortraitUrl('女主.png') ?? '',
};

const contentText = computed(() => cleanTextKeepingTucao(safeSubstituteMacros(context.content), stripHiddenBlocks));
const variableRevision = computed(() => context.variable_revision);
const userAlias = computed(
  () => uniqueNonEmpty([safeSubstituteMacros('{{user}}'), SillyTavern.name1, '你'])[0] ?? '你',
);
const userRoleName = computed(() => readUserRoleName(context.message_id, variableRevision.value));
const userStatus = computed(() => ({ alias: userRoleName.value ?? userAlias.value }));
const userPortraitGender = computed(() => readUserPortraitGender(context.message_id, variableRevision.value));
const userCharacterProfile = computed(() => {
  const identity = readPlayerIdentityId(context.message_id, variableRevision.value);
  return identity === null ? resolveUserPortraitProfile(userStatus.value.alias) : resolveIdentityPortraitProfile(identity);
});
const stageSceneView = computed(() => readMobileStageSceneView(context.message_id, variableRevision.value));
const stageTimeLabel = computed(() => stageSceneView.value.timeLabel);
const stageLocationLabel = computed(() => stageSceneView.value.locationLabel);
const { stageSceneBackgroundUrl, handleSceneBackgroundError } = useStageBackground(stageSceneView);
const isStreaming = computed(() => context.during_streaming);

const fallbackNpcLabel = computed(() => {
  const message = getChatMessages(context.message_id)[0];
  return uniqueNonEmpty([message?.name ?? '', safeSubstituteMacros('{{char}}'), SillyTavern.name2])[0] ?? '未识别';
});

const dialogueSource = computed<DialogueSource>(() => ({
  id: `content-message-${context.message_id}`,
  messageId: String(context.message_id),
  content: contentText.value,
  knownCharacters: uniqueNonEmpty([
    ...deriveKnownCharactersForContent(
      contentText.value,
      fallbackNpcLabel.value,
      userStatus.value.alias,
      SillyTavern.name1,
    ),
    ...context.dialogue_map.flatMap(entry => [entry.speaker, entry.focus]),
  ]),
  userAliases: uniqueNonEmpty([
    '{{user}}',
    userStatus.value.alias,
    userRoleName.value,
    userAlias.value,
    SillyTavern.name1,
    '你',
    '我',
  ]),
  primaryUserName: userStatus.value.alias,
  secondaryUserNames: [],
  dialogueMap: context.dialogue_map,
  speakerInferenceMode: context.during_streaming || context.dialogue_map.length === 0 ? 'conservative' : 'normal',
}));

const splitResult = computed(() => splitDialogueSource(dialogueSource.value));
const segments = computed(() => splitResult.value.segments);
const knownCharacters = computed(() => splitResult.value.knownCharacters);
const npcKnownCharacters = computed(() => knownCharacters.value.filter(name => !isUserRoleSpeakerName(name)));
const relationshipSystemView = computed(() => readRelationshipSystemView(context.message_id, variableRevision.value));
const presentRelationshipContacts = computed(() =>
  relationshipSystemView.value.presentNames.map(name => {
    return (
      findRelationshipContact(name, relationshipSystemView.value.contacts) ?? createRelationshipContact(name, null)
    );
  }),
);
const knownRelationshipContacts = computed(() =>
  relationshipSystemView.value.contacts.filter(
    contact =>
      !relationshipSystemView.value.presentNames.some(presentName => isSameRelationshipName(contact.name, presentName)),
  ),
);
const contactFactions = computed(() => groupContactsByFaction(knownRelationshipContacts.value));
const currentSegment = computed(() => segments.value[currentIndex.value] ?? null);
const isAtEnd = computed(() => segments.value.length > 0 && currentIndex.value >= segments.value.length - 1);
const chatRows = computed(() =>
  buildNarrativeChatRows(segments.value, {
    resolveSpeakerName: resolveChatSpeakerName,
    resolveAffiliation: resolveChatAffiliation,
    resolveAvatarCandidates: resolveChatAvatarCandidates,
  }),
);

const previewSegments = computed(() => {
  const start = Math.max(0, currentIndex.value - 1);
  const end = Math.min(segments.value.length, start + 3);
  return segments.value.slice(start, end);
});

const stagedUserSegment = computed(() =>
  findStagedSegment(segments.value, currentIndex.value, 'user', { allowLookahead: !isStreaming.value }),
);
const stagedNpcSegment = computed(() =>
  findStagedSegment(segments.value, currentIndex.value, 'npc', { allowLookahead: !isStreaming.value }),
);
const stagedUserMoodSegment = computed(() =>
  findMoodSegment(segments.value, currentIndex.value, 'user', { allowLookahead: !isStreaming.value }),
);
const stagedNpcMoodSegment = computed(() =>
  findMoodSegment(segments.value, currentIndex.value, 'npc', { allowLookahead: !isStreaming.value }),
);

const activeNpcLabel = computed(() => {
  if (currentSegment.value?.presentation === 'cameo') return null;
  if (
    currentSegment.value?.kind === 'npc' &&
    currentSegment.value.speaker !== null &&
    !isUserRoleSpeakerName(currentSegment.value.speaker)
  ) {
    return resolveFullbodyPortraitDisplayName(currentSegment.value.speaker);
  }

  return null;
});

const focusNpcLabel = computed(() => {
  const activePortraitSpeaker = getNpcPortraitSpeakerFromSegment(currentSegment.value);
  if (activePortraitSpeaker !== null) {
    return activePortraitSpeaker;
  }

  return findPreviousNpcPortraitSpeaker(segments.value, currentIndex.value);
});

const isCurrentUserSpeaking = computed(
  () =>
    currentSegment.value?.kind === 'user' &&
    currentSegment.value.speaker !== null &&
    isExplicitSpeechSegment(currentSegment.value),
);
const isCurrentNpcSpeaking = computed(() => activeNpcLabel.value !== null);

const activeSpeakerName = computed(() => {
  if (currentSegment.value?.presentation === 'cameo') return konataCameo.name;
  if (currentSegment.value === null) {
    return null;
  }

  if (currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null) {
    return userStatus.value.alias;
  }

  if (currentSegment.value?.kind === 'npc' && activeNpcLabel.value !== null) {
    return activeNpcLabel.value;
  }

  return '旁白';
});

const portraitNpcLabel = computed(() => {
  return focusNpcLabel.value;
});

const fallbackUserPortraitUrl = computed(() => USER_FULLBODY_PORTRAITS[userPortraitGender.value]);

const activeUserMood = computed<DialogueMood>(() => {
  if (currentSegment.value?.kind !== 'user') {
    return 'neutral';
  }

  if (stagedUserMoodSegment.value === null) {
    return 'neutral';
  }

  return getSegmentMood(stagedUserMoodSegment.value);
});

const activeNpcMood = computed<DialogueMood>(() => {
  if (currentSegment.value?.kind !== 'npc') {
    return 'neutral';
  }

  if (stagedNpcMoodSegment.value === null) {
    return 'neutral';
  }

  return getSegmentMood(stagedNpcMoodSegment.value);
});

const userPortraitUrl = computed(() => resolveUserPortraitUrl(activeUserMood.value));
const shouldUseCurrentTextForNpcPortrait = computed(() => {
  if (currentSegment.value?.kind !== 'npc') {
    return false;
  }

  return !isStreaming.value || currentSegment.value.speaker !== null;
});

const npcPortraitContext = computed(() =>
  uniqueNonEmpty([
    shouldUseCurrentTextForNpcPortrait.value ? portraitNpcLabel.value : null,
    shouldUseCurrentTextForNpcPortrait.value ? currentSegment.value?.text : null,
  ]).join('\n'),
);

const npcPortraitUrl = computed(() =>
  portraitNpcLabel.value === null
    ? null
    : resolveNpcPortraitUrl(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value),
);

const activeSpeakerAffiliation = computed(() => {
  if (currentSegment.value === null || activeSpeakerName.value === '旁白') {
    return null;
  }

  if (currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null) {
    return formatVisibleAffiliation(userCharacterProfile.value?.affiliation ?? null);
  }

  if (currentSegment.value?.kind === 'npc' && activeNpcLabel.value !== null) {
    return formatVisibleAffiliation(resolveCharacterProfileBySpeakerName(activeNpcLabel.value)?.affiliation ?? null);
  }

  if (currentSegment.value?.kind !== 'npc') {
    return null;
  }

  return null;
});

const userPortraitLayers = computed(() => {
  const layers = new Map<string, PortraitLayer>();

  function addLayer(mood: DialogueMood) {
    const src = resolveUserPortraitUrl(mood);
    layers.set(src, createPortraitLayer(`user:${userPortraitGender.value}`, src, createUserFallbackUrls(mood)));
  }

  addLayer('neutral');
  if (isStreaming.value) {
    addLayer(activeUserMood.value);
    return Array.from(layers.values());
  }

  for (const segment of segments.value) {
    if (segment.kind === 'user') {
      addLayer(getSegmentMood(segment));
    }
  }
  addLayer(activeUserMood.value);

  return Array.from(layers.values());
});

const npcPortraitLayers = computed(() => {
  const layers = new Map<string, PortraitLayer>();

  function addLayer(speakerName: string, mood: DialogueMood, contextText: string) {
    if (isUserRoleSpeakerName(speakerName)) {
      return;
    }

    const src = resolveNpcPortraitUrl(speakerName, mood, contextText);
    if (src === null) {
      return;
    }

    layers.set(src, createPortraitLayer(`npc:${src}`, src, createNpcFallbackUrls(speakerName, mood, contextText)));
  }

  for (const characterName of npcKnownCharacters.value) {
    addLayer(characterName, 'neutral', '');
  }

  if (isStreaming.value) {
    if (portraitNpcLabel.value !== null) {
      addLayer(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value);
    }
    return Array.from(layers.values());
  }

  for (const segment of segments.value) {
    if (segment.kind !== 'npc') {
      if (
        segment.focusSpeaker !== null &&
        segment.focusSpeaker !== undefined &&
        !isUserRoleSpeakerName(segment.focusSpeaker)
      ) {
        addLayer(segment.focusSpeaker, getSegmentMood(segment), segment.text);
      }
      continue;
    }

    const speakerName = segment.speaker;
    if (speakerName === null) {
      continue;
    }

    addLayer(speakerName, 'neutral', segment.text);
    addLayer(speakerName, getSegmentMood(segment), segment.text);
  }

  if (portraitNpcLabel.value !== null) {
    addLayer(portraitNpcLabel.value, activeNpcMood.value, npcPortraitContext.value);
  }

  return Array.from(layers.values());
});

watch(
  () => splitResult.value.sourceContentHash,
  () => {
    currentIndex.value = Math.min(currentIndex.value, Math.max(segments.value.length - 1, 0));
  },
);

watch(
  [userPortraitLayers, npcPortraitLayers],
  ([userLayers, npcLayers]) => {
    preloadPortraitUrls([...userLayers, ...npcLayers].flatMap(layer => [layer.src, ...layer.fallbackUrls]));
  },
  { immediate: true },
);

watch(
  stageLocationLabel,
  locationLabel => {
    context.set_variable_refresh_needed(locationLabel === '地点未同步');
  },
  { immediate: true },
);

watch(portraitPreview, (preview, previous) => {
  if (preview === null && previous !== null) {
    restoreFocus(portraitPreviewReturnFocus.value);
    portraitPreviewReturnFocus.value = null;
  }
});

onBeforeUnmount(() => {
  context.set_original_content_visible(false);
  context.set_variable_refresh_needed(false);
});

function minimizeNarrative() {
  functionPageOpenedFromMinimized.value = false;
  portraitPreview.value = null;
  isFunctionPageOpen.value = false;
  isThinkingPageOpen.value = false;
  selectedRelationshipContact.value = null;
  isNarrativeMinimized.value = true;
  context.set_original_content_visible(true);
}

function restoreNarrative() {
  functionPageOpenedFromMinimized.value = false;
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
}

function resolveOverlayTrigger(event: Event) {
  const target = event.currentTarget as HTMLElement | null;
  return typeof target?.focus === 'function' ? target : captureFocusedElement();
}

function openFunctionPage(event: MouseEvent) {
  functionPageOpenedFromMinimized.value = false;
  functionPageReturnFocus.value = resolveOverlayTrigger(event);
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  portraitPreview.value = null;
  isThinkingPageOpen.value = false;
  isFunctionPageOpen.value = true;
}

function openCampusMap(event: MouseEvent) {
  campusMapReturnFocus.value = resolveOverlayTrigger(event);
  isCampusMapOpen.value = true;
}

function closeCampusMap(focusInput = false) {
  isCampusMapOpen.value = false;
  if (focusInput) nextTick(focusTavernInput);
  else restoreFocus(campusMapReturnFocus.value);
  campusMapReturnFocus.value = null;
}

function openTalentStar(event: MouseEvent) {
  talentReturnFocus.value = resolveOverlayTrigger(event);
  isTalentOpen.value = true;
}

function closeTalentStar() {
  isTalentOpen.value = false;
  restoreFocus(talentReturnFocus.value);
  talentReturnFocus.value = null;
}

function openManualBattlePage(event: MouseEvent) {
  const openedFromMinimized = isNarrativeMinimized.value;
  openFunctionPage(event);
  functionPageOpenedFromMinimized.value = openedFromMinimized;
  portraitPreview.value = null;
  isThinkingPageOpen.value = false;
  selectedRelationshipContact.value = null;
  isFunctionPageOpen.value = true;
}

function restoreMinimizedAfterFunctionPage() {
  if (!functionPageOpenedFromMinimized.value) {
    return false;
  }

  const returnFocus = functionPageReturnFocus.value;
  functionPageOpenedFromMinimized.value = false;
  isNarrativeMinimized.value = true;
  context.set_original_content_visible(true);
  void nextTick(() => {
    restoreFocus(returnFocus);
    functionPageReturnFocus.value = null;
  });
  return true;
}

function closeFunctionPage() {
  isFunctionPageOpen.value = false;
  selectedRelationshipContact.value = null;
  if (restoreMinimizedAfterFunctionPage()) {
    return;
  }
  restoreFocus(functionPageReturnFocus.value);
  functionPageReturnFocus.value = null;
}

function openThinkingPage(event: MouseEvent) {
  functionPageOpenedFromMinimized.value = false;
  thinkingPageReturnFocus.value = resolveOverlayTrigger(event);
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  portraitPreview.value = null;
  selectedRelationshipContact.value = null;
  isFunctionPageOpen.value = false;
  isThinkingPageOpen.value = true;
}

function closeThinkingPage() {
  isThinkingPageOpen.value = false;
  restoreFocus(thinkingPageReturnFocus.value);
  thinkingPageReturnFocus.value = null;
}

function toggleParallelEvents() {
  isParallelEventsCollapsed.value = !isParallelEventsCollapsed.value;
}

function openRelationshipContactPage(contact: RelationshipContact) {
  selectedRelationshipContact.value = contact;
}

function closeRelationshipContactPage() {
  selectedRelationshipContact.value = null;
}

async function startRelationshipSexBattle() {
  const contact = selectedRelationshipContact.value;
  if (contact === null) return;

  isStartingBattle.value = true;
  try {
    const enemyName = await startManualSexBattle(context.message_id, contact.name);

    selectedRelationshipContact.value = null;
    isFunctionPageOpen.value = false;
    resumeBattle();
    showTavernNotice(`已向 ${enemyName} 发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端] 发起性斗失败:', error);
    showTavernNotice(error instanceof Error ? error.message : '未能打开战斗页面。', '发起性斗失败', 'error');
  } finally {
    isStartingBattle.value = false;
  }
}

function resumeBattle() {
  functionPageOpenedFromMinimized.value = false;
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  isFunctionPageOpen.value = false;
  selectedRelationshipContact.value = null;
  isThinkingPageOpen.value = false;
  isCampusMapOpen.value = false;
  isTalentOpen.value = false;
  showInlineCombat(context.message_id);
}

function openPortraitPreview(side: PortraitPreviewSide, event: Event) {
  const src = side === 'user' ? userPortraitUrl.value : npcPortraitUrl.value;
  const label = side === 'user' ? userStatus.value.alias : (portraitNpcLabel.value ?? '角色');
  if (src === null || src.length === 0) {
    return;
  }

  portraitPreviewReturnFocus.value = resolveOverlayTrigger(event);
  portraitPreview.value = { src, label };
}

function closePortraitPreview() {
  portraitPreview.value = null;
}

function resolveParallelEventAffiliation(characterName: string) {
  const profile = resolveRelationshipProfile(characterName);
  return (
    resolveRelationshipBattleStats(characterName, profile)?.faction ?? profile?.affiliation?.trim() ?? '未登记归属'
  );
}

function resolveParallelEventAvatarUrl(characterName: string) {
  return resolveRelationshipProfile(characterName)?.portraitUrl ?? null;
}

function handleChoiceOptionClick(entry: ChoiceOptionEntry) {
  const { option } = entry;
  const optionText = option.text.trim();
  if (optionText.length === 0) {
    return;
  }

  selectedChoiceOptionKey.value = entry.key;
  const didWrite = writeTextToTavernInput(optionText);
  if (!didWrite) {
    showTavernNotice('未找到酒馆输入框，无法填入选项。', '选项填入失败', 'warning');
  }
}

async function handleSexBattleChoiceClick(entry: ChoiceOptionEntry) {
  selectedChoiceOptionKey.value = entry.key;

  try {
    const enemyName = await startConfiguredSexBattle(context.message_id);
    resumeBattle();
    showTavernNotice(`已向 ${enemyName} 发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端] 启动已配置性斗失败:', error);
    showTavernNotice(error instanceof Error ? error.message : '未能打开战斗页面。', '发起性斗失败', 'error');
  }
}

function uniqueUrls(urls: Array<string | null>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const url of urls) {
    if (url === null || seen.has(url)) {
      continue;
    }

    seen.add(url);
    result.push(url);
  }

  return result;
}

function getSegmentMood(segment: DialogueSegment) {
  return segment.moodConfidence >= 0.55 ? segment.mood : 'neutral';
}

function resolveChatSpeakerName(segment: DialogueSegment) {
  if (segment.kind === 'user') {
    return userStatus.value.alias;
  }

  const speakerName = segment.speaker?.trim() || getNpcPortraitSpeakerFromSegment(segment) || fallbackNpcLabel.value;
  return resolveFullbodyPortraitDisplayName(speakerName);
}

function resolveChatAffiliation(segment: DialogueSegment) {
  if (segment.kind === 'user') {
    return userCharacterProfile.value?.affiliation?.trim() || null;
  }

  const speakerName = resolveChatSpeakerName(segment);
  return resolveCharacterProfileBySpeakerName(speakerName)?.affiliation?.trim() || null;
}

function resolveChatAvatarCandidates(segment: DialogueSegment): NarrativeChatAvatarCandidate[] {
  if (segment.presentation === 'cameo') return resolveCameoAvatarCandidates();
  const speakerName = resolveChatSpeakerName(segment);
  const qAvatarUrl =
    segment.kind === 'user'
      ? getRelationshipAvatarUrl(userCharacterProfile.value)
      : resolveRelationshipAvatarUrl(speakerName);
  const portraitUrl =
    segment.kind === 'user'
      ? (userCharacterProfile.value?.portraitUrl ?? fallbackUserPortraitUrl.value)
      : resolveNpcNeutralPortraitUrl(speakerName);

  return [
    ...(qAvatarUrl === null ? [] : [{ url: qAvatarUrl, kind: 'avatar' as const }]),
    ...(portraitUrl === null || portraitUrl.length === 0 ? [] : [{ url: portraitUrl, kind: 'portrait' as const }]),
  ];
}

function isExplicitSpeechSegment(segment: DialogueSegment) {
  if (segment.speakerSource === 'map') {
    return segment.mapKind === 'speech' && segment.speaker !== null;
  }

  return segment.id.includes('-quote-') || segment.id.includes('-colon-');
}

function segmentSpeakerLabel(segment: DialogueSegment) {
  if (segment.speaker === null) {
    return '旁白';
  }

  if (segment.kind === 'user' && isExplicitSpeechSegment(segment)) {
    return userStatus.value.alias;
  }

  if (segment.kind === 'npc' && !isUserRoleSpeakerName(segment.speaker)) {
    return resolveFullbodyPortraitDisplayName(segment.speaker);
  }

  return isExplicitSpeechSegment(segment) ? resolveFullbodyPortraitDisplayName(segment.speaker) : '旁白';
}

function findStagedSegment(
  visibleSegments: DialogueSegment[],
  index: number,
  kind: 'user' | 'npc',
  options: { allowLookahead?: boolean } = {},
) {
  const allowLookahead = options.allowLookahead ?? true;
  const activeSegment = visibleSegments[index];
  if (activeSegment?.kind === kind && activeSegment.presentation !== 'cameo') {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind && segment.presentation !== 'cameo') {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind && segment.presentation !== 'cameo') {
      return segment;
    }
  }

  return null;
}

function findMoodSegment(
  visibleSegments: DialogueSegment[],
  index: number,
  kind: 'user' | 'npc',
  options: { allowLookahead?: boolean } = {},
) {
  const allowLookahead = options.allowLookahead ?? true;
  const activeSegment = visibleSegments[index];
  if (activeSegment?.kind === kind && activeSegment.presentation !== 'cameo') {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind && segment.presentation !== 'cameo') {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= Math.max(0, index - MOOD_HOLD_SEGMENTS); segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind && segment.presentation !== 'cameo') {
      return segment;
    }
  }

  return null;
}

function getNpcPortraitSpeakerFromSegment(segment: DialogueSegment | null | undefined) {
  if (segment === null || segment === undefined || segment.presentation === 'cameo') {
    return null;
  }

  if (
    segment.focusSpeaker !== null &&
    segment.focusSpeaker !== undefined &&
    !isUserRoleSpeakerName(segment.focusSpeaker)
  ) {
    return resolveFullbodyPortraitDisplayName(segment.focusSpeaker);
  }

  if (segment.kind === 'npc' && segment.speaker !== null && !isUserRoleSpeakerName(segment.speaker)) {
    return resolveFullbodyPortraitDisplayName(segment.speaker);
  }

  return null;
}

function findPreviousNpcPortraitSpeaker(visibleSegments: DialogueSegment[], index: number) {
  for (let segmentIndex = index - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const portraitSpeaker = getNpcPortraitSpeakerFromSegment(visibleSegments[segmentIndex]);
    if (portraitSpeaker !== null) {
      return portraitSpeaker;
    }
  }

  return null;
}

function createPortraitLayer(id: string, src: string, fallbackUrls: string[]): PortraitLayer {
  return {
    id,
    src,
    fallbackUrls: uniqueUrls([src, ...fallbackUrls]),
  };
}

function preloadPortraitUrls(urls: string[]) {
  if (typeof Image === 'undefined') {
    return;
  }

  for (const url of urls) {
    if (url.length === 0 || preloadedPortraitUrls.has(url)) {
      continue;
    }

    preloadedPortraitUrls.add(url);
    const image = new Image();
    image.decoding = 'sync';
    image.loading = 'eager';
    image.src = url;

    if (typeof image.decode === 'function') {
      void image.decode().catch(() => undefined);
    }
  }
}

function resolveUserPortraitUrl(_mood: DialogueMood) {
  return userCharacterProfile.value?.portraitUrl ?? fallbackUserPortraitUrl.value;
}

function createUserFallbackUrls(_mood: DialogueMood) {
  return uniqueUrls([userCharacterProfile.value?.portraitUrl ?? null, fallbackUserPortraitUrl.value]);
}

function isUserRoleSpeakerName(speakerName: string | null | undefined) {
  const normalizedSpeakerName = speakerName?.trim() ?? '';
  if (normalizedSpeakerName.length === 0) {
    return false;
  }

  return (
    ['{{user}}', '你', '我'].includes(normalizedSpeakerName) ||
    matchesUserIdentityName(normalizedSpeakerName, userStatus.value.alias)
  );
}

function resolveCharacterProfileBySpeakerName(speakerName: string) {
  return resolveFullbodyPortraitProfile(speakerName);
}

function resolveSpecialNpcPortraitUrl(speakerName: string) {
  const profile = resolveCharacterProfileBySpeakerName(speakerName);
  if (profile !== null) {
    return profile.portraitUrl;
  }

  const normalizedSpeakerName = speakerName.replace(/[{}]/g, '').trim();
  return AMANE_NAME_PATTERN.test(normalizedSpeakerName) ? getFullbodyPortraitUrl('响木天音.png') : null;
}

function resolveNpcNeutralPortraitUrl(speakerName: string) {
  return resolveSpecialNpcPortraitUrl(speakerName);
}

function resolveNpcPortraitUrl(speakerName: string, _mood: DialogueMood, _contextText = '') {
  const specialPortraitUrl = resolveSpecialNpcPortraitUrl(speakerName);
  if (specialPortraitUrl !== null) {
    return specialPortraitUrl;
  }

  return resolveNpcNeutralPortraitUrl(speakerName);
}

function createNpcFallbackUrls(speakerName: string, _mood: DialogueMood, _contextText = '') {
  return uniqueUrls([resolveNpcNeutralPortraitUrl(speakerName)]);
}

function handlePortraitLayerError(event: Event, fallbackUrls: string[]) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (image === null) {
    return;
  }

  const currentFallbackIndex = fallbackUrls.indexOf(image.src);
  const nextFallbackUrl =
    currentFallbackIndex >= 0 ? fallbackUrls[currentFallbackIndex + 1] : fallbackUrls.find(url => url !== image.src);

  if (nextFallbackUrl === undefined || nextFallbackUrl === image.src) {
    return;
  }

  image.src = nextFallbackUrl;
}

function handleParallelEventAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  image?.closest('.bp-parallel-event-avatar')?.classList.add('is-fallback');
}

function jumpToSegment(segmentId: string) {
  const index = segments.value.findIndex(segment => segment.id === segmentId);
  if (index >= 0) {
    currentIndex.value = index;
  }
}

function advanceNarrative() {
  if (isAtEnd.value || segments.value.length === 0) {
    return;
  }

  currentIndex.value += 1;
}

function retreatNarrative() {
  if (currentIndex.value <= 0 || segments.value.length === 0) {
    return;
  }

  currentIndex.value -= 1;
}

function reverseNarrative() {
  currentIndex.value = 0;
}
</script>
