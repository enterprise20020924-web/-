<template>
  <article
    :class="['ContentChatRenderer', { 'is-narrative-minimized': isNarrativeMinimized }]"
    :style="desktopAssetCssVariables"
  >
    <section
      id="bp-narrative-panel"
      :class="['bp-panel', 'bp-narrative-panel', { 'is-minimized': isNarrativeMinimized }]"
      aria-labelledby="bp-narrative-title"
    >
      <h2 id="bp-narrative-title" class="bp-visually-hidden">剧情舞台</h2>

      <DesktopNarrativeStage
        :background-inert="isBackgroundInert"
        :is-narrative-minimized="isNarrativeMinimized"
        :minimized-arona-url="minimizedAronaUrl"
        :stage-location-label="stageLocationLabel"
        :active-speaker-name="activeSpeakerName"
        :frame-background-url="frameBackgroundUrl"
        :function-ui-url="functionUiUrl"
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
        @restore="restoreNarrative"
        @minimize="minimizeNarrative"
        @open-function="openFunctionPage"
        @open-thinking="openThinkingPage"
        @scene-error="handleSceneBackgroundError"
        @preview-portrait="openPortraitPreview"
        @portrait-error="handlePortraitLayerError"
        @jump-segment="jumpToSegment"
        @previous="retreatNarrative"
        @next="advanceNarrative"
        @reverse="reverseNarrative"
      />
      <DesktopOverlays
        :is-function-page-open="isFunctionPageOpen"
        :is-thinking-page-open="isThinkingPageOpen"
        :thinking-content="thinkingContent"
        :has-thinking-content="hasThinkingContent"
        :present-relationship-contacts="presentRelationshipContacts"
        :contact-factions="contactFactions"
        :selected-relationship-contact="selectedRelationshipContact"
        :character-detail-ui-url="characterDetailUiUrl"
        :selected-relationship-portrait-url="selectedRelationshipPortraitUrl"
        :selected-relationship-display-name="selectedRelationshipDisplayName"
        :selected-relationship-affiliation="selectedRelationshipAffiliation"
        :selected-relationship-level-items="selectedRelationshipLevelItems"
        :selected-relationship-stat-blocks="selectedRelationshipStatBlocks"
        :selected-relationship-skills="selectedRelationshipSkills"
        :portrait-preview="portraitPreview"
        @close-function="closeFunctionPage"
        @close-thinking="closeThinkingPage"
        @open-contact="openRelationshipContactPage"
        @close-contact="closeRelationshipContactPage"
        @relationship-avatar-error="handleRelationshipAvatarError"
        @show-coming-soon="showCharacterDetailComingSoon"
        @start-sex-battle="startRelationshipSexBattle"
        @close-portrait="closePortraitPreview"
      />
    </section>
    <DesktopSupportPanels
      :background-inert="isBackgroundInert"
      :parallel-events="parallelEvents"
      :is-parallel-events-collapsed="isParallelEventsCollapsed"
      :choice-options="choiceOptions"
      :sex-battle-choice-entry="sexBattleChoiceEntry"
      :selected-choice-option-key="selectedChoiceOptionKey"
      :arona-option-frame-url="aronaOptionFrameUrl"
      :plana-option-frame-url="planaOptionFrameUrl"
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
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue';
import DesktopSupportPanels from './desktop/components/DesktopSupportPanels.vue';
import DesktopNarrativeStage from './desktop/components/DesktopNarrativeStage.vue';
import DesktopOverlays from './desktop/components/DesktopOverlays.vue';
import { desktopAssetCssVariables, desktopAssetMetadata } from './desktop/asset-metadata';
import { resolveSexBattleChoiceEnemyName } from './desktop/choice-runtime';
import {
  isJsonPatchDeltaOperation,
  parseJsonPatchPanel,
  partitionChoiceOptions,
  resolveJsonPatchOperationTone,
} from './desktop/panel-runtime';
import type { ChoiceOptionEntry } from './desktop/panel-runtime';
import { captureFocusedElement, restoreFocus } from './desktop/overlay-focus';
import { useJsonPatchAudit } from './desktop/use-jsonpatch-audit';
import type {
  CharacterDetailStatBlock,
  CharacterDetailStatItem,
  PortraitLayer,
  PortraitPreview,
  PortraitPreviewSide,
} from './desktop/types';
import {
  formatVisibleAffiliation,
  matchesSpeakerNameAlias,
  normalizeCharacterLookupText,
  safeSubstituteMacros,
  stripHiddenBlocks,
  uniqueNonEmpty,
} from './desktop/text-runtime';
import { readFirstPathValue, readPath, readVariableSnapshots, unwrapMvuValue } from './desktop/tavern-variable-runtime';
import { splitDialogueSource } from './engine/dialogue-splitter';
import { deriveKnownCharactersForContent } from './engine/known-characters';
import type { DialogueMood, DialogueSegment, DialogueSource } from './types/narrative';
import { fullbodyPortraitProfiles, getFullbodyPortraitUrl, resolveFullbodyAssetUrl } from './portrait-registry';
import type { FullbodyPortraitProfile } from './portrait-registry';
import { characterBattleStats } from './character-stats';
import type { CharacterBattleStats } from './character-stats';
import { resolveCharacterSkillEntries } from './character-skills';
import type { CharacterSkillEntry } from './character-skills';
import {
  createRelationshipContact,
  findRelationshipContact,
  groupContactsByFaction,
  readRelationshipSystemView,
  resolveRelationshipBattleStats,
  resolveRelationshipProfile,
  showTavernNotice,
  startRelationshipSexBattle as startRuntimeSexBattle,
  writeTextToTavernInput,
} from './mobile/relationship-runtime';
import type { RelationshipContact } from './mobile/relationship-runtime';
import { readMobileStageSceneView } from './mobile/scene-runtime';
import type { ContentRendererContext } from './types/content-renderer';

type UserPortraitGender = 'male' | 'female';

const context = inject<ContentRendererContext>('content_renderer_context');
if (context === undefined) {
  throw Error('[content-chat-renderer] missing content renderer context');
}

const currentIndex = ref(0);
const portraitPreview = ref<PortraitPreview | null>(null);
const portraitPreviewReturnFocus = ref<HTMLElement | null>(null);
const functionPageReturnFocus = ref<HTMLElement | null>(null);
const thinkingPageReturnFocus = ref<HTMLElement | null>(null);
const isFunctionPageOpen = ref(false);
const isThinkingPageOpen = ref(false);
const isParallelEventsCollapsed = ref(true);
const isNarrativeMinimized = ref(false);
const selectedRelationshipContact = ref<RelationshipContact | null>(null);
const isBackgroundInert = computed(
  () =>
    isFunctionPageOpen.value ||
    isThinkingPageOpen.value ||
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

const ROOT_ASSET_BASE_URL = 'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/';
const frameBackgroundUrl = resolveFullbodyAssetUrl(desktopAssetMetadata.stageFrame.fileName);
const functionUiUrl = resolveFullbodyAssetUrl(desktopAssetMetadata.functionUi.fileName);
const characterDetailUiUrl = resolveRootAssetUrl(desktopAssetMetadata.characterUi.fileName);
const fallbackSceneBackgroundUrl = resolveFullbodyAssetUrl(desktopAssetMetadata.fallbackScene.fileName);
const minimizedAronaUrl = resolveFullbodyAssetUrl('阿洛娜.png');
const aronaOptionFrameUrl = resolveFullbodyAssetUrl(desktopAssetMetadata.aronaChoice.fileName);
const planaOptionFrameUrl = resolveFullbodyAssetUrl(desktopAssetMetadata.planaChoice.fileName);
const AMANE_NAME_PATTERN = /(?:响木)?天音/;
const USER_FULLBODY_PORTRAITS: Record<UserPortraitGender, string> = {
  male: getFullbodyPortraitUrl('男主_黑西装校服_普通学生.png') ?? '',
  female: getFullbodyPortraitUrl('女主.png') ?? '',
};

const contentText = computed(() => stripHiddenBlocks(safeSubstituteMacros(context.content)));
const variableRevision = computed(() => context.variable_revision);
const userAlias = computed(
  () => uniqueNonEmpty([safeSubstituteMacros('{{user}}'), SillyTavern.name1, '你'])[0] ?? '你',
);
const userRoleName = computed(() => readUserRoleName(context.message_id));
const userStatus = computed(() => ({ alias: userRoleName.value ?? userAlias.value }));
const userPortraitGender = computed(() => readUserPortraitGender(context.message_id));
const userCharacterProfile = computed(() =>
  userRoleName.value === null ? null : resolveCharacterProfileBySpeakerName(userRoleName.value),
);
const stageSceneView = computed(() => readMobileStageSceneView(context.message_id, variableRevision.value));
const stageTimeLabel = computed(() => stageSceneView.value.timeLabel);
const stageLocationLabel = computed(() => stageSceneView.value.locationLabel);
const sceneBackgroundFallbackIndex = ref(0);
const stageSceneBackgroundUrls = computed(() => stageSceneView.value.backgroundUrls);
const stageSceneBackgroundUrl = computed(
  () => stageSceneBackgroundUrls.value[sceneBackgroundFallbackIndex.value] ?? fallbackSceneBackgroundUrl,
);
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
  primaryUserName: userRoleName.value,
  secondaryUserNames: uniqueNonEmpty([SillyTavern.name1]),
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
const selectedRelationshipProfile = computed(() => {
  const contact = selectedRelationshipContact.value;
  return contact === null ? null : resolveRelationshipProfile(contact.name);
});
const selectedRelationshipStats = computed(() =>
  selectedRelationshipContact.value === null
    ? null
    : resolveRelationshipBattleStats(selectedRelationshipContact.value.name, selectedRelationshipProfile.value),
);
const selectedRelationshipDisplayName = computed(
  () =>
    selectedRelationshipStats.value?.name ??
    selectedRelationshipContact.value?.name ??
    selectedRelationshipProfile.value?.names[0] ??
    '未识别',
);
const selectedRelationshipPortraitUrl = computed(() => selectedRelationshipProfile.value?.portraitUrl ?? null);
const selectedRelationshipAffiliation = computed(() => {
  const candidates = uniqueNonEmpty([
    selectedRelationshipProfile.value?.affiliation,
    selectedRelationshipContact.value?.faction,
    selectedRelationshipStats.value?.faction,
  ]);

  for (const candidate of candidates) {
    const visibleAffiliation = formatCharacterDetailAffiliation(candidate);
    if (visibleAffiliation !== null) {
      return visibleAffiliation;
    }
  }

  return null;
});
const selectedRelationshipLevelItems = computed<CharacterDetailStatItem[]>(() => {
  const stats = selectedRelationshipStats.value;
  return [
    { label: '等级', value: stats === null ? '--' : String(stats.level) },
    { label: '潜力', value: stats === null ? '--' : inferPotentialRank(stats) },
    { label: '性斗力', value: formatDetailNumber(stats?.power) },
  ];
});
const selectedRelationshipStatBlocks = computed<CharacterDetailStatBlock[]>(() => {
  const stats = selectedRelationshipStats.value;
  return [
    {
      id: 'top-left',
      stats: [
        { label: '耐力', value: formatDetailNumber(stats?.endurance) },
        { label: '性斗力', value: formatDetailNumber(stats?.power) },
      ],
    },
    {
      id: 'top-right',
      stats: [
        { label: '快感', value: formatDetailNumber(stats?.pleasure) },
        { label: '忍耐力', value: formatDetailNumber(stats?.resilience) },
      ],
    },
    {
      id: 'bottom-left',
      stats: [
        { label: '魅力', value: formatDetailNumber(stats?.charm) },
        { label: '幸运', value: formatDetailNumber(stats?.luck) },
      ],
    },
    {
      id: 'bottom-right',
      stats: [
        { label: '闪避', value: formatDetailNumber(stats?.evasion) },
        { label: '暴击', value: formatDetailNumber(stats?.critical) },
      ],
    },
  ];
});
const selectedRelationshipSkills = computed<CharacterSkillEntry[]>(() => {
  const contact = selectedRelationshipContact.value;
  if (contact === null) {
    return [];
  }

  const profile = selectedRelationshipProfile.value;
  return resolveCharacterSkillEntries([
    contact.name,
    selectedRelationshipStats.value?.name,
    profile?.fileName.replace(/\.[^.]+$/, ''),
    ...(profile?.names ?? []),
  ]);
});
const currentSegment = computed(() => segments.value[currentIndex.value] ?? null);
const isAtEnd = computed(() => segments.value.length > 0 && currentIndex.value >= segments.value.length - 1);

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
  if (
    currentSegment.value?.kind === 'npc' &&
    currentSegment.value.speaker !== null &&
    !isUserRoleSpeakerName(currentSegment.value.speaker)
  ) {
    return currentSegment.value.speaker;
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
  if (currentSegment.value === null) {
    return null;
  }

  if (currentSegment.value?.kind === 'user' && currentSegment.value.speaker !== null) {
    return resolveVisibleUserSpeakerName(currentSegment.value.speaker);
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
    sceneBackgroundFallbackIndex.value = 0;
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
  portraitPreview.value = null;
  isFunctionPageOpen.value = false;
  isThinkingPageOpen.value = false;
  selectedRelationshipContact.value = null;
  isNarrativeMinimized.value = true;
  context.set_original_content_visible(true);
}

function restoreNarrative() {
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
}

function resolveOverlayTrigger(event: Event) {
  const target = event.currentTarget as HTMLElement | null;
  return typeof target?.focus === 'function' ? target : captureFocusedElement();
}

function openFunctionPage(event: MouseEvent) {
  functionPageReturnFocus.value = resolveOverlayTrigger(event);
  isNarrativeMinimized.value = false;
  context.set_original_content_visible(false);
  portraitPreview.value = null;
  isThinkingPageOpen.value = false;
  isFunctionPageOpen.value = true;
}

function closeFunctionPage() {
  isFunctionPageOpen.value = false;
  selectedRelationshipContact.value = null;
  restoreFocus(functionPageReturnFocus.value);
  functionPageReturnFocus.value = null;
}

function openThinkingPage(event: MouseEvent) {
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

function showCharacterDetailComingSoon(featureLabel: string) {
  showTavernNotice(`${featureLabel}功能敬请期待。`, '敬请期待', 'info');
}

async function startRelationshipSexBattle() {
  const enemyName = uniqueNonEmpty([
    selectedRelationshipStats.value?.name,
    selectedRelationshipContact.value?.name,
    selectedRelationshipDisplayName.value,
  ])[0];

  if (enemyName === undefined) {
    showTavernNotice('未读取到可作为对手的角色名称。', '发起性斗失败', 'warning');
    return;
  }

  try {
    const isSent = await startRuntimeSexBattle(enemyName, context.message_id, fallbackNpcLabel.value);
    if (!isSent) {
      showTavernNotice('已写入对手名称，但没有找到可用的发送入口。', '发起性斗失败', 'warning');
      return;
    }

    selectedRelationshipContact.value = null;
    isFunctionPageOpen.value = false;
    showTavernNotice(`已将对手设置为 ${enemyName}，正在发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端] 发起性斗失败:', error);
    showTavernNotice('无法写入性斗系统对手名称，请确认 MVU 已初始化。', '发起性斗失败', 'error');
  }
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

function isSameRelationshipName(left: string, right: string) {
  const normalizedLeft = normalizeCharacterLookupText(left);
  const normalizedRight = normalizeCharacterLookupText(right);
  if (normalizedLeft.length === 0 || normalizedRight.length === 0) {
    return false;
  }

  return (
    normalizedLeft === normalizedRight || matchesSpeakerNameAlias(left, right) || matchesSpeakerNameAlias(right, left)
  );
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
  const { option } = entry;
  const enemyName = resolveSexBattleChoiceEnemyName(option.text, npcKnownCharacters.value, [
    portraitNpcLabel.value,
    activeNpcLabel.value,
    focusNpcLabel.value,
    fallbackNpcLabel.value,
  ]);
  if (enemyName === undefined) {
    showTavernNotice('未读取到可作为对手的角色名称。', '发起性斗失败', 'warning');
    return;
  }

  selectedChoiceOptionKey.value = entry.key;

  try {
    const isSent = await startRuntimeSexBattle(enemyName, context.message_id, fallbackNpcLabel.value);
    if (!isSent) {
      showTavernNotice('已写入对手名称，但没有找到可用的发送入口。', '发起性斗失败', 'warning');
      return;
    }

    showTavernNotice(`已将对手设置为 ${enemyName}，正在发起性斗。`, '发起性斗', 'success');
  } catch (error) {
    console.error('[正文前端] 选项 E 发起性斗失败:', error);
    showTavernNotice('无法写入性斗系统对手名称，请确认 MVU 已初始化。', '发起性斗失败', 'error');
  }
}

function inferPotentialRank(stats: CharacterBattleStats) {
  const peakStat = Math.max(stats.power, stats.resilience, stats.charm, stats.luck);
  if (stats.level >= 95 || peakStat >= 950) {
    return 'SSS';
  }
  if (stats.level >= 85 || peakStat >= 850) {
    return 'SS';
  }
  if (stats.level >= 75 || peakStat >= 700) {
    return 'S';
  }
  if (stats.level >= 60 || peakStat >= 550) {
    return 'A';
  }
  if (stats.level >= 45 || peakStat >= 400) {
    return 'B';
  }
  if (stats.level >= 30 || peakStat >= 250) {
    return 'C';
  }
  return 'D';
}

function formatDetailNumber(value: number | null | undefined) {
  return value === null || value === undefined ? '--' : value.toLocaleString('zh-CN');
}

function formatCharacterDetailAffiliation(affiliation: string | null | undefined) {
  const normalizedAffiliation = affiliation?.trim() ?? '';
  if (
    normalizedAffiliation.length === 0 ||
    normalizedAffiliation === '未分组' ||
    normalizedAffiliation === '独立' ||
    normalizedAffiliation === '独立势力'
  ) {
    return null;
  }

  return normalizedAffiliation;
}

function resolveRootAssetUrl(fileName: string) {
  try {
    return new URL(fileName, ROOT_ASSET_BASE_URL).href;
  } catch {
    return `${ROOT_ASSET_BASE_URL}${encodeURIComponent(fileName)}`;
  }
}

function normalizeUserPortraitGender(value: unknown): UserPortraitGender | null {
  const normalizedValue = String(unwrapMvuValue(value) ?? '').trim();
  if (normalizedValue === '男') {
    return 'male';
  }

  if (normalizedValue === '女') {
    return 'female';
  }

  return null;
}

function readUserPortraitGender(messageId: number): UserPortraitGender {
  const snapshots = readVariableSnapshots(messageId, variableRevision.value);

  for (const snapshot of snapshots) {
    const gender =
      normalizeUserPortraitGender(readPath(snapshot, ['stat_data', '角色基础', '性别'])) ??
      normalizeUserPortraitGender(readPath(snapshot, ['角色基础', '性别']));
    if (gender !== null) {
      return gender;
    }
  }

  return 'female';
}

function readUserRoleName(messageId: number) {
  const roleName = readFirstPathValue(readVariableSnapshots(messageId, variableRevision.value), [
    ['stat_data', '角色基础', '_姓名'],
    ['stat_data', '角色基础', '姓名'],
    ['角色基础', '_姓名'],
    ['角色基础', '姓名'],
  ]);
  const normalizedRoleName = String(unwrapMvuValue(roleName) ?? '').trim();

  return normalizedRoleName.length > 0 ? normalizedRoleName : null;
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

function isExplicitSpeechSegment(segment: DialogueSegment) {
  if (segment.speakerSource === 'map' && segment.speaker !== null) {
    return true;
  }

  return segment.id.includes('-quote-') || segment.id.includes('-colon-');
}

function segmentSpeakerLabel(segment: DialogueSegment) {
  if (segment.speaker === null) {
    return '旁白';
  }

  if (segment.kind === 'user' && isExplicitSpeechSegment(segment)) {
    return resolveVisibleUserSpeakerName(segment.speaker);
  }

  if (segment.kind === 'npc' && !isUserRoleSpeakerName(segment.speaker)) {
    return segment.speaker;
  }

  return isExplicitSpeechSegment(segment) ? segment.speaker : '旁白';
}

function findStagedSegment(
  visibleSegments: DialogueSegment[],
  index: number,
  kind: 'user' | 'npc',
  options: { allowLookahead?: boolean } = {},
) {
  const allowLookahead = options.allowLookahead ?? true;
  const activeSegment = visibleSegments[index];
  if (activeSegment?.kind === kind) {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind) {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= 0; segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind) {
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
  if (activeSegment?.kind === kind) {
    return activeSegment;
  }

  if (allowLookahead && activeSegment?.kind === 'narration') {
    const lookaheadEnd = Math.min(visibleSegments.length - 1, index + STAGED_SEGMENT_LOOKAHEAD);
    for (let segmentIndex = index + 1; segmentIndex <= lookaheadEnd; segmentIndex += 1) {
      const segment = visibleSegments[segmentIndex];
      if (segment?.kind === kind) {
        return segment;
      }
    }
  }

  for (let segmentIndex = index - 1; segmentIndex >= Math.max(0, index - MOOD_HOLD_SEGMENTS); segmentIndex -= 1) {
    const segment = visibleSegments[segmentIndex];
    if (segment?.kind === kind) {
      return segment;
    }
  }

  return null;
}

function getNpcPortraitSpeakerFromSegment(segment: DialogueSegment | null | undefined) {
  if (segment === null || segment === undefined) {
    return null;
  }

  if (
    segment.focusSpeaker !== null &&
    segment.focusSpeaker !== undefined &&
    !isUserRoleSpeakerName(segment.focusSpeaker)
  ) {
    return segment.focusSpeaker;
  }

  if (segment.kind === 'npc' && segment.speaker !== null && !isUserRoleSpeakerName(segment.speaker)) {
    return segment.speaker;
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

function isMacroOrPronounUserSpeakerName(speakerName: string) {
  const normalizedSpeakerName = speakerName.trim();
  return normalizedSpeakerName === '{{user}}' || normalizedSpeakerName === '我' || normalizedSpeakerName === '你';
}

function resolveVisibleUserSpeakerName(speakerName: string) {
  const normalizedSpeakerName = speakerName.trim();
  if (normalizedSpeakerName.length === 0 || isMacroOrPronounUserSpeakerName(normalizedSpeakerName)) {
    return userStatus.value.alias;
  }

  return normalizedSpeakerName;
}

function isUserRoleSpeakerName(speakerName: string | null | undefined) {
  const normalizedSpeakerName = speakerName?.trim() ?? '';
  if (normalizedSpeakerName.length === 0) {
    return false;
  }

  if (userRoleName.value !== null && matchesSpeakerNameAlias(normalizedSpeakerName, userRoleName.value)) {
    return true;
  }

  return (
    userCharacterProfile.value?.names.some(alias => matchesSpeakerNameAlias(normalizedSpeakerName, alias)) ?? false
  );
}

function resolveCharacterProfileBySpeakerName(speakerName: string) {
  return (
    fullbodyPortraitProfiles.find(profile =>
      profile.names.some(alias => matchesSpeakerNameAlias(speakerName, alias)),
    ) ?? null
  );
}

function resolveSpecialNpcPortraitUrl(speakerName: string) {
  const profile = resolveCharacterProfileBySpeakerName(speakerName);
  if (profile !== null) {
    return profile.portraitUrl;
  }

  const normalizedSpeakerName = speakerName.replace(/[{}]/g, '').trim();
  return AMANE_NAME_PATTERN.test(normalizedSpeakerName) ? getFullbodyPortraitUrl('响木天音校服.png') : null;
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

function handleRelationshipAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  image?.closest('.bp-manual-battle-avatar')?.classList.add('is-fallback');
}

function handleParallelEventAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  image?.closest('.bp-parallel-event-avatar')?.classList.add('is-fallback');
}

function handleSceneBackgroundError() {
  if (sceneBackgroundFallbackIndex.value >= stageSceneBackgroundUrls.value.length - 1) {
    return;
  }

  sceneBackgroundFallbackIndex.value += 1;
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
