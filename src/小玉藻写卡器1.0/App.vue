<template>
  <main class="writer-shell tamamo-app app-shell" :class="{ 'is-work-complete': isWorkComplete }">
    <div class="ambient-layer" aria-hidden="true">
      <span class="ambient-orb orb-sakura" />
      <span class="ambient-orb orb-foxfire" />
      <span class="ambient-tail tail-one" />
      <span class="ambient-tail tail-two" />
      <span class="ambient-grain" />
    </div>

    <AppSidebar
      :step="step"
      :work-started="workStarted"
      :editor-available="step === 'beginner' || step === 'editor' || step === 'opening' || workStarted"
      :is-busy="isBusy"
      :working-image-src="workingImageSrc"
      :draft-status="draftStatusLabel"
      :task-title="sidebarTaskTitle"
      :task-detail="sidebarTaskDetail"
      @home="goHome"
      @editor="openEditorFromSidebar"
      @persona="openPersonaGenerator"
    />

    <section class="app-main">
      <AppHeader
        :section-label="pageSectionLabel"
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :current-character="currentCharacter"
        :worldbook-name="worldbookName"
        :show-worldbook="step !== 'persona'"
        :draft-status="draftStatusLabel"
        :format-issue-count="formatIssueCount"
        :format-result-count="formatResultCount"
        :is-busy="isBusy"
        @exit="closeWriter"
        @format-review="openFormatReview()"
      />

      <div class="app-content">
        <SetupView
          v-if="step === 'setup'"
          v-model:worldbook-name="worldbookName"
          v-model:generation-mode="generationMode"
          :current-character="currentCharacter"
          :has-current-character="hasCurrentCharacter"
          :avatar-file="avatarFile"
          :is-busy="isBusy"
          :can-enter-editor="canEnterEditor"
          :draft-status="draftStatusLabel"
          :entry-issue="setupEntryIssue"
          :current-model-name="currentModelName"
          :current-api-source="currentApiSource"
          :current-connection-status="currentConnectionStatus"
          @avatar-change="onAvatarChange"
          @create-character="openCreateCharacterDialog"
          @clear-draft="clearDraftAndReset"
          @enter-beginner="enterBeginner"
          @enter-editor="enterEditor"
          @open-persona="openPersonaGenerator"
        />

        <BeginnerWorkspace
          v-else-if="step === 'beginner' && !workStarted"
          v-model:concept="beginnerConcept"
          v-model:relationship="beginnerRelationship"
          v-model:experience="beginnerExperience"
          v-model:world-mode="beginnerWorldMode"
          v-model:world-hint="beginnerWorldHint"
          :current-character="currentCharacter"
          :worldbook-name="worldbookName"
          :is-busy="isBusy"
          :can-run="canRunBeginner"
          :validation-issue="beginnerValidationIssue"
          :draft-status="draftStatusLabel"
          @back="goHome"
          @open-advanced="openAdvancedFromBeginner"
          @request-run="requestBeginnerRun"
        />

        <PersonaView
          v-else-if="step === 'persona'"
          v-model:persona-mode="personaMode"
          v-model:persona-seed="personaSeed"
          :persona-mode-label="personaModeLabel"
          :persona-result="personaResult"
          :generation-warnings="generationWarnings"
          :logs="logs"
          :is-busy="isBusy"
          :can-run-persona="canRunPersona"
          @back="goHome"
          @generate="runPersonaOnly"
          @clear="clearPersonaResult"
          @copy-result="copyPersonaResult"
        />

        <OpeningWorkspace
          v-else-if="step === 'opening' && !workStarted"
          v-model:opening-style="openingStyle"
          v-model:opening-outline="openingOutline"
          :worldbook-name="worldbookName"
          :role-count="plannedRoleCount"
          :is-busy="isBusy"
          :can-continue="canRun"
          :validation-issue="openingValidationIssue"
          :draft-status="draftStatusLabel"
          @back="returnFromOpening"
          @request-run="requestRunWriter"
        />

        <CompletionView
          v-else-if="workStarted && isWorkComplete"
          :working-image-src="workingImageSrc"
          :worldbook-name="worldbookName"
          :role-count="pipelineState?.activeRoles.length ?? plannedRoleCount"
          :format-issue-count="formatIssueCount"
          :has-recovery="Boolean(recoverySnapshot)"
          @finish="confirmCompletion"
          @editor="returnEditor"
          @format-review="openFormatReview()"
          @rerun="requestRunWriter"
          @restore="showRestoreConfirm = true"
        />

        <WorkView
          v-else-if="workStarted"
          :working-image-src="workingImageSrc"
          :current-work-text="currentWorkText"
          :completed-stage-count="completedStageCount"
          :completed-generation-call-count="completedGenerationCallCount"
          :generation-call-count="generationCallCount"
          :work-stages="workStages"
          :work-percent="workPercent"
          :generation-warnings="generationWarnings"
          :has-recovery="Boolean(recoverySnapshot)"
          :is-busy="isBusy"
          :failed-stage-index="failedStageIndex"
          :paused-stage-index="pausedStageIndex"
          :stop-requested="stopRequested"
          :heartbeat-text="heartbeatText"
          :preview-text="previewText"
          :can-reroll-stage="canRerollStage"
          @retry="retryFailedStage"
          @resume="resumePipeline"
          @request-stop="requestStopAfterStage"
          @stop-now="stopActiveGeneration"
          @return-editor="returnEditor"
          @rerun="requestRunWriter"
          @reroll="rerollStage"
          @restore="showRestoreConfirm = true"
          @copy-preview="copyPreviewText"
          @format-review="openFormatReview()"
        />

        <WriterWorkspace
          v-else
          v-model:worldview-seed="worldviewSeed"
          :worldbook-name="worldbookName"
          :avatar-file-name="avatarFile?.name ?? ''"
          :roles="roles"
          :logs="logs"
          :generation-warnings="generationWarnings"
          :preview-text="previewText"
          :is-busy="isBusy"
          :can-run="canEnterOpening"
          :validation-issues="writerValidationIssues"
          :completion-percent="draftCompletionPercent"
          :draft-status="draftStatusLabel"
          @add-role="addRole"
          @remove-role="removeRole"
          @move-role="moveRole"
          @duplicate-role="duplicateRole"
          @update-role="updateRole"
          @back="goHome"
          @request-run="requestRunWriter"
          @clear-logs="logs = []"
          @copy-preview="copyPreviewText"
        />
      </div>

      <footer class="app-statusbar">
        <span><i class="status-light" />内置预设已加载</span>
        <span>角色：{{ currentCharacter }}</span>
        <button
          v-if="formatResultCount"
          :class="['format-status-button', { invalid: formatIssueCount > 0 }]"
          @click="openFormatReview()"
        >
          {{ formatIssueCount ? `格式提醒 ${formatIssueCount}` : '格式校验通过' }}
        </button>
        <span>{{ activityStatusText }}</span>
      </footer>
      <button
        v-if="formatResultCount"
        :class="['format-floating-button', { invalid: formatIssueCount > 0 }]"
        @click="openFormatReview()"
      >
        {{ formatIssueCount ? `格式提醒 ${formatIssueCount}` : '格式已通过' }}
      </button>
    </section>

    <PreflightDialog
      :open="showPreflight"
      :current-character="currentCharacter"
      :worldbook-name="worldbookName"
      :role-count="plannedRoleCount"
      :has-avatar="Boolean(avatarFile)"
      :is-busy="isBusy"
      :generation-mode="generationMode"
      @close="showPreflight = false"
      @confirm="confirmRunWriter"
    />

    <ContinuationDialog
      :open="Boolean(continuationApproval)"
      :generated-tail="continuationApproval?.generated.slice(-6000) ?? ''"
      @continue="resolveContinuation(true)"
      @stop="resolveContinuation(false)"
    />

    <CreateCharacterDialog
      v-model:name="newCharacterName"
      :open="showCreateCharacter"
      :is-busy="isBusy"
      :validation-issue="newCharacterNameIssue"
      @close="showCreateCharacter = false"
      @confirm="createNewCharacter"
    />

    <FormatReviewDialog
      :open="showFormatReview"
      :items="formatReviewItems"
      :active-item="activeFormatItem"
      :is-busy="isBusy"
      @close="showFormatReview = false"
      @select="selectedFormatTargetId = $event"
      @copy-raw="copyActiveFormatRaw"
      @repair="repairActiveFormat"
    />

    <RestoreConfirmDialog
      :open="showRestoreConfirm"
      :is-busy="isBusy"
      :created-at-label="recoveryCreatedAtLabel"
      @close="showRestoreConfirm = false"
      @confirm="restorePreviousVersion"
    />
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import AppSidebar from './components/AppSidebar.vue';
import BeginnerWorkspace from './components/BeginnerWorkspace.vue';
import CompletionView from './components/CompletionView.vue';
import ContinuationDialog from './components/ContinuationDialog.vue';
import CreateCharacterDialog from './components/CreateCharacterDialog.vue';
import FormatReviewDialog from './components/FormatReviewDialog.vue';
import OpeningWorkspace from './components/OpeningWorkspace.vue';
import PersonaView from './components/PersonaView.vue';
import PreflightDialog from './components/PreflightDialog.vue';
import RestoreConfirmDialog from './components/RestoreConfirmDialog.vue';
import SetupView from './components/SetupView.vue';
import WorkView from './components/WorkView.vue';
import WriterWorkspace from './components/WriterWorkspace.vue';
import type {
  BeginnerWorldMode,
  FormatReviewItem,
  FormatTargetKind,
  GenerationMode,
  WorkStage,
  WorkStatus,
  WriterStep,
} from './ui-types';
import workingImage from './玉藻前打尻.webp?url';
import type {
  OpeningResult,
  PersonaOnlyMode,
  PersonaOnlyResult,
  RoleDraft,
  RoleResult,
  WriterArtifacts,
  WriterLog,
  WorldviewResult,
} from './types';
import {
  buildArtifacts,
  buildFixedMvuEntries,
  buildRoleEntries,
  buildRoleOverviewEntries,
  buildWorldviewEntries,
} from './utils/artifacts';
import {
  ensureTargetCharacter,
  installMvuRuntimeScript,
  installMvuSchemaScript,
  isReservedCharacterName,
  openTargetCharacterCard,
  updateFirstMessage,
  updateTargetAvatar,
} from './utils/character';
import { clearWriterDraft, loadWriterDraft, saveWriterDraft, type WriterDraft } from './utils/draft';
import {
  assertWriterGenerationActive,
  generateOpening,
  generatePersonaOnly,
  generateRole,
  generateWorldview,
  parsePersonaOnlyResult,
  parseOpeningResult,
  parseRoleResult,
  parseWorldviewResult,
  requestWriterGenerationStop,
  resetWriterGenerationStop,
  type ContinuationApprovalRequest,
  type GenerationHeartbeat,
  type GenerationProgress,
} from './utils/generation';
import { repairGeneratedFormat, validateGeneratedFormat } from './utils/formatValidation';
import {
  createWriterRecoverySnapshot,
  restoreWriterRecoverySnapshot,
  type WriterRecoverySnapshot,
} from './utils/recovery';
import { installMvuRegexes } from './utils/regex';
import { clearWriterEntries, ensureWorldbookBound, replaceWriterEntries, upsertWriterEntries } from './utils/worldbook';

const props = defineProps<{ onExit: () => void }>();

type FullWorkspaceMode = 'beginner' | 'editor';

interface PipelineState {
  targetCharacter: string;
  targetWorldbook: string;
  worldviewSeed: string;
  activeRoles: RoleDraft[];
  isMultiRole: boolean;
  roleResults: RoleResult[];
  retryAvoidTerms: Record<string, string[]>;
  openingStyle: string;
  openingOutline: string;
  worldview?: WorldviewResult;
  opening?: OpeningResult;
  artifacts?: WriterArtifacts;
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRole(index: number): RoleDraft {
  return {
    id: newId('role'),
    label: `角色${index + 1}`,
    name: '',
    seed: '',
    statusAvatarUrl: '',
    statusBackgroundUrl: '',
  };
}

const detectedCharacterName = getCurrentCharacterName();
const currentCharacter = ref(
  detectedCharacterName && !isReservedCharacterName(detectedCharacterName) ? detectedCharacterName : '未打开角色卡',
);
const worldbookName = ref(
  currentCharacter.value === '未打开角色卡' ? '一键角色卡世界书' : `${currentCharacter.value}世界书`,
);
const worldviewSeed = ref('');
const openingStyle = ref('');
const openingOutline = ref('');
const generationMode = ref<GenerationMode>('nonstream');
const roles = reactive<RoleDraft[]>([createRole(0)]);
const personaSeed = ref('');
const personaMode = ref<PersonaOnlyMode>('normal');
const personaResult = ref<PersonaOnlyResult | null>(null);
const beginnerConcept = ref('');
const beginnerRelationship = ref('');
const beginnerExperience = ref('');
const beginnerWorldMode = ref<BeginnerWorldMode>('auto');
const beginnerWorldHint = ref('');
const fullWorkspaceMode = ref<FullWorkspaceMode>('beginner');
const avatarFile = ref<File | null>(null);
const logs = ref<WriterLog[]>([]);
const generationWarnings = ref<string[]>([]);
const previewText = ref('');
const isBusy = ref(false);
const step = ref<WriterStep>('setup');
const workStarted = ref(false);
const workStages = ref<WorkStage[]>([]);
const failedStageIndex = ref<number | null>(null);
const pausedStageIndex = ref<number | null>(null);
const stopRequested = ref(false);
const generationHeartbeat = ref<GenerationHeartbeat | null>(null);
const continuationApproval = ref<ContinuationApprovalRequest | null>(null);
const pipelineState = ref<PipelineState | null>(null);
const showPreflight = ref(false);
const showCreateCharacter = ref(false);
const showFormatReview = ref(false);
const showRestoreConfirm = ref(false);
const selectedFormatTargetId = ref('');
const newCharacterName = ref('');
const formatOriginalOutputs = reactive<Record<string, string>>({});
const recoverySnapshot = ref<WriterRecoverySnapshot | null>(null);
const draftSavedAt = ref<number | string | null>(null);
const draftHydrating = ref(true);
const currentModelName = ref('正在读取...');
const currentApiSource = ref('');
const currentConnectionStatus = ref('');
const workingImageSrc = workingImage;

const DRAFT_STORAGE_PREFIX = 'tamamo-card-writer:draft:v1:';
let draftSaveTimer: number | null = null;
let pendingDraftSave: Promise<void> | null = null;
let resolveContinuationApproval: ((value: boolean) => void) | null = null;
let draftIsPristineAfterClear = false;

function hasEmoji(value: string): boolean {
  return /\p{Extended_Pictographic}/u.test(value);
}

function validAssetUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:', 'data:'].includes(url.protocol);
  } catch {
    return false;
  }
}

function refreshCurrentModelInfo() {
  const context = SillyTavern as typeof SillyTavern & { getChatCompletionModel?: () => string };
  try {
    currentModelName.value = context.getChatCompletionModel?.() || context.getTokenizerModel() || '无法识别当前模型';
    currentApiSource.value = String(context.mainApi || '未知 API');
    currentConnectionStatus.value = String(context.onlineStatus || '未知状态');
  } catch {
    currentModelName.value = '读取当前模型失败';
    currentApiSource.value = '未知 API';
    currentConnectionStatus.value = '无法读取';
  }
}

const hasCurrentCharacter = computed(
  () => currentCharacter.value !== '未打开角色卡' && !isReservedCharacterName(currentCharacter.value),
);

const setupEntryIssue = computed(() => {
  if (!hasCurrentCharacter.value) return '请先创建或打开目标角色卡。';
  if (!worldbookName.value.trim()) return '世界书名称不能为空。';
  if (hasEmoji(worldbookName.value)) return '世界书名称不能包含 emoji。';
  return '';
});

const activeRoleCount = computed(() => roles.filter(role => role.seed.trim()).length);
const plannedRoleCount = computed(() =>
  step.value === 'beginner' ? (beginnerConcept.value.trim() ? 1 : 0) : activeRoleCount.value,
);

const writerValidationIssues = computed(() => {
  const issues: string[] = [];
  if (setupEntryIssue.value) issues.push(setupEntryIssue.value);
  if (!worldviewSeed.value.trim()) issues.push('请填写世界观素材。');
  if (activeRoleCount.value === 0) issues.push('至少需要填写一个角色的素材。');
  roles.forEach((role, index) => {
    if (!validAssetUrl(role.statusAvatarUrl)) issues.push(`${role.label}的状态栏头像 URL 无效。`);
    if (!validAssetUrl(role.statusBackgroundUrl)) issues.push(`${role.label}的状态栏背景 URL 无效。`);
    const duplicateName =
      role.name.trim() &&
      roles.some((other, otherIndex) => otherIndex !== index && other.name.trim() === role.name.trim());
    if (duplicateName) issues.push(`${role.label}与其他角色使用了相同名称。`);
  });
  return Array.from(new Set(issues));
});

const draftCompletionPercent = computed(() => {
  let score = 0;
  if (currentCharacter.value !== '未打开角色卡') score += 15;
  if (worldbookName.value.trim() && !hasEmoji(worldbookName.value)) score += 15;
  if (worldviewSeed.value.trim()) score += 30;
  if (activeRoleCount.value > 0) score += 40;
  return score;
});

const draftStatusLabel = computed(() => {
  if (!draftSavedAt.value) return '';
  const date =
    typeof draftSavedAt.value === 'number' ? new Date(draftSavedAt.value) : new Date(String(draftSavedAt.value));
  if (Number.isNaN(date.getTime())) return '草稿已保存';
  return `已自动保存 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
});

const recoveryCreatedAtLabel = computed(() => {
  if (!recoverySnapshot.value) return '尚未创建恢复点';
  const date = new Date(recoverySnapshot.value.createdAt);
  if (Number.isNaN(date.getTime())) return '生成开始前';
  return date.toLocaleString('zh-CN', { hour12: false });
});

const beginnerValidationIssue = computed(() => {
  if (setupEntryIssue.value) return setupEntryIssue.value;
  if (!beginnerConcept.value.trim()) return '先用一句话描述角色最核心的点子。';
  if (beginnerWorldMode.value === 'custom' && !beginnerWorldHint.value.trim()) return '请写下一句话世界设定。';
  return '';
});

const canRunBeginner = computed(() => beginnerValidationIssue.value.length === 0);

const newCharacterNameIssue = computed(() => {
  const name = newCharacterName.value.trim();
  if (!name) return '请输入角色卡名称。';
  if (name.toLowerCase() === 'current') return '不能使用保留名称 current。';
  if (hasEmoji(name)) return '角色卡名称不能包含 emoji。';
  const hasControlCharacter = Array.from(name).some(character => character.charCodeAt(0) < 32);
  if (hasControlCharacter || /[<>:"/\\|?*]/u.test(name) || /[. ]$/u.test(name)) {
    return '角色卡名称包含文件名不支持的字符。';
  }
  if (name.length > 80) return '角色卡名称不能超过 80 个字符。';
  try {
    if (getCharacterNames().some(existingName => existingName.trim().toLowerCase() === name.toLowerCase())) {
      return '已经存在同名角色卡，请换一个名称。';
    }
  } catch {
    return '暂时无法读取角色卡列表，请稍后重试。';
  }
  return '';
});

const pageSectionLabel = computed(() => {
  if (workStarted.value && isWorkComplete.value) return 'CARD READY';
  if (workStarted.value && failedStageIndex.value !== null) return 'NEEDS ATTENTION';
  if (workStarted.value && pausedStageIndex.value !== null) return 'SAFE PAUSE';
  if (workStarted.value) return 'TASK CENTER';
  if (step.value === 'persona') return 'PERSONA LAB';
  if (step.value === 'opening') return 'OPENING SCENE';
  if (step.value === 'beginner') return 'QUICK START';
  if (step.value === 'editor') return 'CARD WORKSPACE';
  return 'PROJECT SETUP';
});

const pageTitle = computed(() => {
  if (workStarted.value && isWorkComplete.value) return '角色卡生成完成';
  if (workStarted.value && failedStageIndex.value !== null) return '生成遇到问题';
  if (workStarted.value && pausedStageIndex.value !== null) return '任务已安全暂停';
  if (workStarted.value) return '生成任务中心';
  if (step.value === 'persona') return '只生成人设';
  if (step.value === 'opening') return '设置故事第一幕';
  if (step.value === 'beginner') return '一键生成完整角色卡';
  if (step.value === 'editor') return '完整写卡工作区';
  return '新建写卡工程';
});

const pageSubtitle = computed(() => {
  if (workStarted.value && isWorkComplete.value) return '检查结果并返回聊天';
  if (workStarted.value && failedStageIndex.value !== null) return '可以重试当前阶段或撤销本次生成';
  if (workStarted.value && pausedStageIndex.value !== null) return '可以继续生成或安全撤销';
  if (workStarted.value) return currentWorkText.value;
  if (step.value === 'persona') return '整理人设内容，不会修改当前角色卡';
  if (step.value === 'opening') return '选择文风并给出故事起点，生成前仍不会写入角色卡';
  if (step.value === 'beginner') return '回答三个问题，其余内容由玉藻自动完成';
  if (step.value === 'editor') return '编辑世界观、角色素材与状态栏资源';
  return '配置目标角色、世界书与写卡工作流';
});

const canEnterEditor = computed(() => {
  return setupEntryIssue.value.length === 0;
});

const canEnterOpening = computed(() => {
  return writerValidationIssues.value.length === 0;
});

const openingValidationIssue = computed(() => {
  if (!canEnterOpening.value) return writerValidationIssues.value[0] ?? '请先完成写卡素材。';
  if (!openingStyle.value.trim()) return '请选择或填写开场白文风。';
  if (!openingOutline.value.trim()) return '请填写开场白的故事起点。';
  return '';
});

const canRun = computed(() => openingValidationIssue.value.length === 0);

const canRunPersona = computed(() => personaSeed.value.trim().length > 0);

const personaModeLabel = computed(() => personaModeName(personaMode.value));

const formatReviewItems = computed<FormatReviewItem[]>(() => {
  const items: FormatReviewItem[] = [];
  const state = pipelineState.value;
  if (state?.worldview) {
    items.push(createFormatReviewItem('worldview', '世界观', 'worldview', state.worldview.raw));
  }
  state?.roleResults.forEach((result, index) => {
    if (!result) return;
    items.push(createFormatReviewItem(`role:${index}`, result.name || `角色${index + 1}`, 'role', result.raw));
  });
  if (state?.opening) {
    items.push(createFormatReviewItem('opening', '开场白', 'opening', state.opening.raw));
  }
  if (personaResult.value) {
    const kind: FormatTargetKind = personaResult.value.mode === 'multistage' ? 'persona-multistage' : 'persona-normal';
    items.push(
      createFormatReviewItem('persona', personaModeName(personaResult.value.mode), kind, personaResult.value.raw),
    );
  }
  return items;
});

const formatIssueCount = computed(() => formatReviewItems.value.reduce((count, item) => count + item.issues.length, 0));
const formatResultCount = computed(() => formatReviewItems.value.length);
const activeFormatItem = computed<FormatReviewItem | null>(() => {
  return (
    formatReviewItems.value.find(item => item.id === selectedFormatTargetId.value) ??
    formatReviewItems.value.find(item => !item.valid) ??
    formatReviewItems.value[0] ??
    null
  );
});

const completedStageCount = computed(() => workStages.value.filter(item => item.status === 'done').length);
const generationCallCount = computed(
  () =>
    workStages.value.filter(
      item =>
        item.key === 'generate-worldview' || item.key === 'generate-opening' || item.key.startsWith('generate-role-'),
    ).length,
);
const completedGenerationCallCount = computed(
  () =>
    workStages.value.filter(
      item =>
        item.status === 'done' &&
        (item.key === 'generate-worldview' || item.key === 'generate-opening' || item.key.startsWith('generate-role-')),
    ).length,
);

const workPercent = computed(() => {
  if (workStages.value.length === 0) return 0;
  const runningProgress = workStages.value
    .filter(item => item.status === 'running')
    .reduce((total, item) => total + (item.progress ?? 0) / 100, 0);
  return Math.round(((completedStageCount.value + runningProgress) / workStages.value.length) * 100);
});

const isWorkComplete = computed(() => {
  return workStages.value.length > 0 && completedStageCount.value === workStages.value.length && !isBusy.value;
});

const currentWorkText = computed(() => {
  const errorStage = workStages.value.find(item => item.status === 'error');
  if (errorStage) return `${errorStage.title}失败`;
  const runningStage = workStages.value.find(item => item.status === 'running');
  if (runningStage) return runningStage.title;
  if (pausedStageIndex.value !== null) return '已在安全位置停止';
  if (workStages.value.length > 0 && completedStageCount.value === workStages.value.length) return '全部完成';
  return '等待开始';
});

const activityStatusText = computed(() => {
  if (!isBusy.value) return '系统就绪';
  if (showCreateCharacter.value) return '正在创建角色卡';
  if (heartbeatText.value) return heartbeatText.value;
  return currentWorkText.value;
});

const heartbeatText = computed(() => {
  const heartbeat = generationHeartbeat.value;
  if (!heartbeat?.active) return '';
  const totalSeconds = Math.max(0, Math.floor(heartbeat.elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const elapsed = minutes > 0 ? `${minutes}分${seconds}秒` : `${totalSeconds}秒`;
  const modeLabel =
    generationMode.value === 'fake-stream'
      ? '截断续传连接中'
      : heartbeat.shouldStream
        ? '流式连接保活中'
        : '完整返回等待中';
  return `${modeLabel} · 已等待 ${elapsed} · 心跳 ${heartbeat.beat}`;
});

const sidebarTaskTitle = computed(() => {
  if (isWorkComplete.value) return '角色卡已完成';
  if (failedStageIndex.value !== null) return '任务需要处理';
  if (pausedStageIndex.value !== null) return '任务已暂停';
  return '任务执行中';
});

const sidebarTaskDetail = computed(() => {
  if (isWorkComplete.value) return '查看结果并返回聊天';
  if (failedStageIndex.value !== null) return '重试或撤销本次生成';
  if (pausedStageIndex.value !== null) return '继续生成或安全撤销';
  return '查看生成进度';
});

function draftStorageKey(): string {
  return `${DRAFT_STORAGE_PREFIX}${currentCharacter.value}`;
}

function createDraftSnapshot(): WriterDraft {
  return {
    version: 2,
    savedAt: Date.now(),
    step: step.value,
    generationMode: generationMode.value,
    targetCharacterName: hasCurrentCharacter.value ? currentCharacter.value : '',
    worldbookName: worldbookName.value,
    worldviewSeed: worldviewSeed.value,
    openingStyle: openingStyle.value,
    openingOutline: openingOutline.value,
    roles: roles.map(role => ({ ...role })),
    avatarFile: avatarFile.value,
    personaSeed: personaSeed.value,
    personaMode: personaMode.value,
    beginnerConcept: beginnerConcept.value,
    beginnerRelationship: beginnerRelationship.value,
    beginnerExperience: beginnerExperience.value,
    beginnerWorldMode: beginnerWorldMode.value,
    beginnerWorldHint: beginnerWorldHint.value,
    fullWorkspaceMode: fullWorkspaceMode.value,
  };
}

function saveDraftNow() {
  if (draftHydrating.value || draftIsPristineAfterClear) return;
  const payload = createDraftSnapshot();
  const saveRequest = saveWriterDraft(payload);
  pendingDraftSave = saveRequest;
  void saveRequest
    .then(() => {
      draftSavedAt.value = payload.savedAt;
    })
    .catch(() => {
      try {
        localStorage.setItem(draftStorageKey(), JSON.stringify({ ...payload, avatarFile: null }));
        draftSavedAt.value = payload.savedAt;
      } catch {
        // Hardened iframe environments may disable both stores; writing remains usable.
      }
    })
    .finally(() => {
      if (pendingDraftSave === saveRequest) pendingDraftSave = null;
    });
}

function scheduleDraftSave() {
  if (draftHydrating.value) return;
  draftIsPristineAfterClear = false;
  if (draftSaveTimer !== null) window.clearTimeout(draftSaveTimer);
  draftSaveTimer = window.setTimeout(() => {
    draftSaveTimer = null;
    saveDraftNow();
  }, 450);
}

function applyRestoredDraft(saved: Partial<WriterDraft> & { savedAt?: number | string }) {
  const targetMatches = !saved.targetCharacterName || saved.targetCharacterName === currentCharacter.value;
  if (typeof saved.worldbookName === 'string' && targetMatches) worldbookName.value = saved.worldbookName;
  if (typeof saved.worldviewSeed === 'string') worldviewSeed.value = saved.worldviewSeed;
  if (typeof saved.openingStyle === 'string') openingStyle.value = saved.openingStyle;
  if (typeof saved.openingOutline === 'string') openingOutline.value = saved.openingOutline;
  if (
    saved.generationMode === 'stream' ||
    saved.generationMode === 'fake-stream' ||
    saved.generationMode === 'nonstream'
  ) {
    generationMode.value = saved.generationMode;
  }
  if (typeof saved.personaSeed === 'string') personaSeed.value = saved.personaSeed;
  if (saved.personaMode === 'normal' || saved.personaMode === 'multistage') personaMode.value = saved.personaMode;
  if (typeof saved.beginnerConcept === 'string') beginnerConcept.value = saved.beginnerConcept;
  if (typeof saved.beginnerRelationship === 'string') beginnerRelationship.value = saved.beginnerRelationship;
  if (typeof saved.beginnerExperience === 'string') beginnerExperience.value = saved.beginnerExperience;
  if (
    saved.beginnerWorldMode === 'auto' ||
    saved.beginnerWorldMode === 'existing' ||
    saved.beginnerWorldMode === 'custom'
  ) {
    beginnerWorldMode.value = saved.beginnerWorldMode;
  }
  if (typeof saved.beginnerWorldHint === 'string') beginnerWorldHint.value = saved.beginnerWorldHint;
  if (saved.fullWorkspaceMode === 'beginner' || saved.fullWorkspaceMode === 'editor') {
    fullWorkspaceMode.value = saved.fullWorkspaceMode;
  }
  if (saved.avatarFile instanceof File) avatarFile.value = saved.avatarFile;
  else if (saved.avatarFile instanceof Blob) {
    avatarFile.value = new File([saved.avatarFile], '已缓存卡面.png', { type: saved.avatarFile.type || 'image/png' });
  }

  const restoredRoles = Array.isArray(saved.roles)
    ? saved.roles
        .filter(role => role && typeof role === 'object')
        .map((role, index) => ({
          id: typeof role.id === 'string' && role.id ? role.id : newId('role'),
          label: `角色${index + 1}`,
          name: typeof role.name === 'string' ? role.name : '',
          seed: typeof role.seed === 'string' ? role.seed : '',
          statusAvatarUrl: typeof role.statusAvatarUrl === 'string' ? role.statusAvatarUrl : '',
          statusBackgroundUrl: typeof role.statusBackgroundUrl === 'string' ? role.statusBackgroundUrl : '',
        }))
    : [];
  roles.splice(0, roles.length, ...(restoredRoles.length ? restoredRoles : [createRole(0)]));
  if (
    targetMatches &&
    (saved.step === 'setup' ||
      saved.step === 'beginner' ||
      saved.step === 'editor' ||
      saved.step === 'opening' ||
      saved.step === 'persona')
  ) {
    step.value = saved.step;
  }
  draftSavedAt.value = saved.savedAt ?? null;
}

async function restoreDraft() {
  try {
    const indexedDraft = await loadWriterDraft();
    if (indexedDraft) {
      applyRestoredDraft(indexedDraft);
      return;
    }
    const raw = localStorage.getItem(draftStorageKey());
    if (!raw) return;
    const legacy = JSON.parse(raw) as Partial<WriterDraft> & { version?: number; savedAt?: number | string };
    if (!Array.isArray(legacy.roles)) return;
    applyRestoredDraft(legacy);
    await saveWriterDraft(createDraftSnapshot());
  } catch {
    // Ignore malformed or inaccessible local drafts and continue with a clean form.
  }
}

async function clearDraftAndReset() {
  if (isBusy.value) return;
  if (!window.confirm('确定清空当前草稿并重新填写吗？角色卡中已经存在的内容不会被删除。')) return;
  if (draftSaveTimer !== null) {
    window.clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
  await pendingDraftSave?.catch(() => undefined);
  draftHydrating.value = true;
  try {
    worldviewSeed.value = '';
    openingStyle.value = '';
    openingOutline.value = '';
    beginnerConcept.value = '';
    beginnerRelationship.value = '';
    beginnerExperience.value = '';
    beginnerWorldMode.value = 'auto';
    beginnerWorldHint.value = '';
    personaSeed.value = '';
    personaResult.value = null;
    avatarFile.value = null;
    roles.splice(0, roles.length, createRole(0));
    logs.value = [];
    generationWarnings.value = [];
    previewText.value = '';
    workStages.value = [];
    pipelineState.value = null;
    recoverySnapshot.value = null;
    draftSavedAt.value = null;
    workStarted.value = false;
    step.value = 'setup';
    await nextTick();
    await clearWriterDraft();
    try {
      localStorage.removeItem(draftStorageKey());
    } catch {
      // Ignore unavailable local storage; IndexedDB has already been cleared.
    }
    draftIsPristineAfterClear = true;
    toastr.success('草稿已清空，可以重新开始');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toastr.error(message, '草稿清理失败');
  } finally {
    draftHydrating.value = false;
  }
}

watch(
  [
    worldbookName,
    worldviewSeed,
    openingStyle,
    openingOutline,
    generationMode,
    avatarFile,
    personaSeed,
    personaMode,
    beginnerConcept,
    beginnerRelationship,
    beginnerExperience,
    beginnerWorldMode,
    beginnerWorldHint,
    fullWorkspaceMode,
    step,
    () => roles.map(role => ({ ...role })),
  ],
  scheduleDraftSave,
  { deep: true },
);

onMounted(async () => {
  await restoreDraft();
  refreshCurrentModelInfo();
  draftHydrating.value = false;
});

onBeforeUnmount(() => {
  if (isBusy.value) requestWriterGenerationStop();
  if (continuationApproval.value) resolveContinuation(false);
  if (draftSaveTimer !== null) window.clearTimeout(draftSaveTimer);
  saveDraftNow();
});

function pushLog(level: WriterLog['level'], text: string) {
  logs.value.unshift({ id: newId('log'), level, text });
}

function noteGenerationWarnings(source: string, warnings: string[]) {
  const messages = Array.from(new Set(warnings.map(warning => warning.trim()).filter(Boolean))).map(
    warning => `${source}：${warning}`,
  );
  if (messages.length === 0) return;
  generationWarnings.value = Array.from(new Set([...messages, ...generationWarnings.value])).slice(0, 30);
  messages.forEach(message => pushLog('warning', message));
  toastr.warning(`${source}存在标签或内容提醒，已继续生成`, '一键角色卡写卡器');
}

function personaModeName(mode: PersonaOnlyMode): string {
  return mode === 'normal' ? '普通调色盘' : '多阶段调色盘';
}

function createFormatReviewItem(id: string, title: string, kind: FormatTargetKind, raw: string): FormatReviewItem {
  const validation = validateGeneratedFormat(kind, raw);
  return {
    id,
    issues: validation.issues.map(issue => issue.message),
    kind,
    originalRaw: formatOriginalOutputs[id] ?? raw,
    raw,
    title,
    valid: validation.valid,
  };
}

function openFormatReview(targetId = '') {
  if (!formatReviewItems.value.length) {
    toastr.info('完成一次生成后即可检查原始输出格式', '格式检查');
    return;
  }
  selectedFormatTargetId.value =
    targetId || formatReviewItems.value.find(item => !item.valid)?.id || formatReviewItems.value[0]?.id || '';
  showFormatReview.value = true;
}

function refreshGenerationWarnings() {
  const messages: string[] = [];
  const state = pipelineState.value;
  if (state?.worldview) {
    state.worldview.warnings.forEach(warning => messages.push(`世界观：${warning}`));
  }
  state?.roleResults.forEach(result => {
    if (!result) return;
    result.warnings.forEach(warning => messages.push(`${result.name}：${warning}`));
  });
  if (state?.opening) {
    state.opening.warnings.forEach(warning => messages.push(`开场白：${warning}`));
  }
  if (personaResult.value) {
    const source = personaModeName(personaResult.value.mode);
    personaResult.value.warnings.forEach(warning => messages.push(`${source}：${warning}`));
  }
  generationWarnings.value = Array.from(new Set(messages)).slice(0, 30);
}

async function syncCorrectedPipelineOutput(state: PipelineState) {
  const worldview = requireWorldview(state);
  const completedRoles = getCompletedRoles(state);
  if (completedRoles.length === state.activeRoles.length) {
    const artifacts = buildArtifacts(worldview, completedRoles);
    state.artifacts = artifacts;
    await replaceWriterEntries(state.targetWorldbook, artifacts.entries);
    await installMvuSchemaScript(state.targetCharacter, artifacts.mvuSchemaScript);
    await installMvuRegexes(state.targetCharacter, artifacts.statusRegexHtml);
    return;
  }

  const roleEntries = state.roleResults.flatMap((result, index) =>
    result ? buildRoleEntries(result, index, state.isMultiRole) : [],
  );
  await upsertWriterEntries(state.targetWorldbook, [
    ...buildWorldviewEntries(worldview),
    ...buildRoleOverviewEntries(completedRoles),
    ...roleEntries,
  ]);
}

async function repairActiveFormat() {
  const item = activeFormatItem.value;
  if (!item || isBusy.value) return;

  isBusy.value = true;
  try {
    if (!(item.id in formatOriginalOutputs)) formatOriginalOutputs[item.id] = item.raw;
    const state = pipelineState.value;
    const roleMatch = item.id.match(/^role:(\d+)$/u);
    const roleIndex = roleMatch ? Number(roleMatch[1]) : -1;
    const roleDraft = roleIndex >= 0 ? state?.activeRoles[roleIndex] : undefined;
    const repair = repairGeneratedFormat(item.kind, item.raw, {
      fallbackName: roleDraft?.name.trim() || roleDraft?.label || item.title,
    });
    if (!repair.after.valid) {
      throw new Error(repair.after.issues[0]?.message || '自动矫正后仍存在格式问题');
    }

    if (item.id === 'worldview') {
      if (!state) throw new Error('世界观生成状态已丢失，请重新生成');
      state.worldview = parseWorldviewResult(repair.raw, state.worldviewSeed);
      state.artifacts = undefined;
      previewText.value = state.worldview.content;
      await syncCorrectedPipelineOutput(state);
    } else if (roleMatch) {
      if (!state || !roleDraft) throw new Error('角色生成状态已丢失，请重新生成');
      const result = parseRoleResult(repair.raw, roleDraft, roleIndex);
      state.roleResults[roleIndex] = result;
      state.artifacts = undefined;
      previewText.value = result.basic;
      await syncCorrectedPipelineOutput(state);
    } else if (item.id === 'opening') {
      if (!state) throw new Error('开场白生成状态已丢失，请重新生成');
      state.opening = parseOpeningResult(repair.raw, state.openingOutline);
      previewText.value = state.opening.content;
      await updateFirstMessage(state.targetCharacter, state.opening.content);
    } else if (item.id === 'persona') {
      const mode: PersonaOnlyMode = item.kind === 'persona-multistage' ? 'multistage' : 'normal';
      personaResult.value = parsePersonaOnlyResult(repair.raw, mode, personaSeed.value);
      previewText.value = personaResult.value.content;
    }

    refreshGenerationWarnings();
    selectedFormatTargetId.value = item.id;
    if (repair.usedFallbackLayout) {
      pushLog('warning', `${item.title}已完成结构保底矫正，正文完整保留，请检查字段分区。`);
      toastr.warning('格式已矫正，纯文本内容已完整放入保底字段，请人工检查分区', item.title);
    } else {
      pushLog('success', `${item.title}格式已校验、矫正并重新解析。`);
      toastr.success('格式已矫正并刷新写入内容', item.title);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', `格式矫正失败：${message}`);
    toastr.error(message, '格式矫正失败');
  } finally {
    isBusy.value = false;
  }
}

function openPersonaGenerator() {
  showPreflight.value = false;
  workStarted.value = false;
  failedStageIndex.value = null;
  generationWarnings.value = [];
  logs.value = [];
  previewText.value = '';
  step.value = 'persona';
}

function suggestCharacterName(): string {
  let existingNames: string[] = [];
  try {
    existingNames = getCharacterNames().map(name => name.trim().toLowerCase());
  } catch {
    return '新角色';
  }

  const names = new Set(existingNames);
  if (!names.has('新角色')) return '新角色';
  let suffix = 2;
  while (names.has(`新角色 ${suffix}`.toLowerCase())) suffix += 1;
  return `新角色 ${suffix}`;
}

function openCreateCharacterDialog() {
  if (isBusy.value || hasCurrentCharacter.value) return;
  newCharacterName.value = suggestCharacterName();
  showCreateCharacter.value = true;
}

async function createNewCharacter() {
  if (isBusy.value || newCharacterNameIssue.value) return;
  const name = newCharacterName.value.trim();
  isBusy.value = true;
  try {
    await ensureTargetCharacter(name, null);
    await openTargetCharacterCard(name);
    showCreateCharacter.value = false;
    currentCharacter.value = name;
    worldbookName.value = `${name}世界书`;
    draftSavedAt.value = null;
    toastr.success(`已创建并打开“${name}”`, '可以开始写卡');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    toastr.error(message, '创建角色卡失败');
  } finally {
    isBusy.value = false;
  }
}

function enterBeginner() {
  if (!canEnterEditor.value || isBusy.value) return;
  fullWorkspaceMode.value = 'beginner';
  showPreflight.value = false;
  workStarted.value = false;
  step.value = 'beginner';
}

function prepareBeginnerDraft() {
  const role = roles[0] ?? createRole(0);
  if (!roles[0]) roles.push(role);
  role.seed = [
    '【角色核心点子】',
    beginnerConcept.value.trim(),
    '',
    '【与玩家的初始关系】',
    beginnerRelationship.value.trim() || '由系统设计一个适合展开故事的初始关系',
    '',
    '【期待的聊天体验与关系变化】',
    beginnerExperience.value.trim() || '由系统根据角色核心点子设计自然、可持续发展的关系变化',
  ].join('\n');

  const worldDirection =
    beginnerWorldMode.value === 'auto'
      ? '请根据角色核心点子自动构建一个适合长期互动、容易理解的世界背景。'
      : beginnerWorldMode.value === 'existing'
        ? `沿用或适配这个原作/已有世界：${beginnerWorldHint.value.trim() || '请从角色点子中推断'}。`
        : `使用这个自定义世界设定：${beginnerWorldHint.value.trim()}。`;
  worldviewSeed.value = [
    '【新手模式世界观要求】',
    worldDirection,
    '世界规则应服务角色关系和聊天体验，不要堆砌无关设定。',
    '',
    '【角色参考】',
    beginnerConcept.value.trim(),
  ].join('\n');
}

function requestBeginnerRun() {
  if (!canRunBeginner.value || isBusy.value) return;
  prepareBeginnerDraft();
  prepareBeginnerOpeningDefaults();
  step.value = 'opening';
}

function prepareBeginnerOpeningDefaults() {
  if (!openingStyle.value.trim()) {
    openingStyle.value =
      '自然细腻的中文叙事。动作、环境、对话与潜台词保持平衡；人物主动但不替玩家作出关键决定，结尾留下自然的回应空间。';
  }
  if (!openingOutline.value.trim()) {
    openingOutline.value = [
      '从角色与玩家第一次需要真正回应彼此的具体场面开始。',
      beginnerRelationship.value.trim() ? `初始关系：${beginnerRelationship.value.trim()}` : '',
      beginnerExperience.value.trim() ? `期待体验：${beginnerExperience.value.trim()}` : '',
      '明确时间、地点与当前局势，让角色先采取一个符合人设的行动，并把下一步选择自然交给玩家。',
    ]
      .filter(Boolean)
      .join('\n');
  }
}

function openAdvancedFromBeginner() {
  if (isBusy.value) return;
  prepareBeginnerDraft();
  fullWorkspaceMode.value = 'editor';
  step.value = 'editor';
}

function returnFromOpening() {
  if (isBusy.value) return;
  showPreflight.value = false;
  step.value = fullWorkspaceMode.value;
}

function clearPersonaResult() {
  personaResult.value = null;
  delete formatOriginalOutputs.persona;
  generationWarnings.value = [];
  logs.value = [];
}

function goHome() {
  if (isBusy.value) return;
  showPreflight.value = false;
  workStarted.value = false;
  step.value = 'setup';
}

function openEditorFromSidebar() {
  if (isBusy.value) return;
  showPreflight.value = false;
  workStarted.value = false;
  step.value = fullWorkspaceMode.value;
}

function normalizeRoleLabels() {
  roles.forEach((role, index) => {
    role.label = `角色${index + 1}`;
  });
}

function addRole() {
  roles.push(createRole(roles.length));
}

function removeRole(index: number) {
  roles.splice(index, 1);
  normalizeRoleLabels();
}

function updateRole(index: number, patch: Partial<RoleDraft>) {
  if (!roles[index]) return;
  Object.assign(roles[index], patch);
}

function moveRole(index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= roles.length) return;
  const [role] = roles.splice(index, 1);
  roles.splice(target, 0, role);
  normalizeRoleLabels();
}

function duplicateRole(index: number) {
  const source = roles[index];
  if (!source) return;
  roles.splice(index + 1, 0, {
    ...source,
    id: newId('role'),
    label: '',
    name: source.name ? `${source.name} 副本` : '',
  });
  normalizeRoleLabels();
}

function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  avatarFile.value = input.files?.[0] ?? null;
}

async function copyText(text: string, label: string) {
  if (!text.trim()) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  toastr.success(`${label}已复制`);
}

function copyPersonaResult() {
  if (personaResult.value) void copyText(personaResult.value.content, '人设结果');
}

function copyPreviewText() {
  void copyText(previewText.value, '生成内容');
}

function copyActiveFormatRaw() {
  if (activeFormatItem.value) {
    void copyText(activeFormatItem.value.originalRaw, `${activeFormatItem.value.title}原始输出`);
  }
}

function requestRunWriter() {
  if (isBusy.value) return;
  if (step.value === 'beginner') {
    if (!canRunBeginner.value) {
      toastr.warning(beginnerValidationIssue.value, '开始前还差一步');
      return;
    }
    prepareBeginnerDraft();
    prepareBeginnerOpeningDefaults();
    step.value = 'opening';
    return;
  }
  if (step.value === 'editor') {
    if (!canEnterOpening.value) {
      toastr.warning(writerValidationIssues.value[0] ?? '请先完成写卡素材', '执行检查');
      return;
    }
    step.value = 'opening';
    return;
  }
  if (!canRun.value) {
    toastr.warning(openingValidationIssue.value || '请先完成开场白设置', '执行检查');
    return;
  }
  showPreflight.value = true;
}

async function confirmRunWriter() {
  showPreflight.value = false;
  await runWriter();
}

function stageMark(status: WorkStatus): string {
  if (status === 'done') return '✓';
  if (status === 'running') return '…';
  if (status === 'error') return '!';
  return '';
}

function findStageIndex(stageKey: string): number {
  return workStages.value.findIndex(item => item.key === stageKey);
}

function canRerollStage(stageItem: WorkStage): boolean {
  return stageItem.status === 'done' && /^generate-(?:worldview|opening|role-\d+)$/u.test(stageItem.key);
}

function buildWorkStages(activeRoles: RoleDraft[], hasAvatar: boolean): WorkStage[] {
  return [
    { key: 'create-snapshot', title: '保存生成前版本', detail: '出现问题时可以一键恢复', status: 'pending' },
    { key: 'prepare-character', title: '确认目标角色卡', detail: '检查角色卡结构与兼容字段', status: 'pending' },
    { key: 'bind-worldbook', title: '准备保存位置', detail: '创建并连接角色专属世界书', status: 'pending' },
    { key: 'clear-old', title: '整理旧版本', detail: '只更新本写卡器以前生成的内容', status: 'pending' },
    { key: 'generate-worldview', title: '构建故事世界', detail: '根据角色点子补全背景和规则', status: 'pending' },
    { key: 'write-worldview', title: '保存世界背景', detail: '写入世界书并设置顺序', status: 'pending' },
    ...activeRoles.flatMap((role, index) => {
      const roleLabel = role.name.trim() || (activeRoles.length === 1 ? '角色' : role.label);
      return [
        {
          key: `generate-role-${index}`,
          title: `理解并扩写${roleLabel}`,
          detail: '补全身份、性格、关系变化和行为逻辑',
          status: 'pending' as WorkStatus,
        },
        {
          key: `write-role-${index}`,
          title: `保存${roleLabel}人设`,
          detail: '保存角色速览、完整人设和关系阶段',
          status: 'pending' as WorkStatus,
        },
      ];
    }),
    {
      key: 'generate-opening',
      title: '编写故事第一幕',
      detail: '按文风与大纲扩写，并留下可接话钩子',
      status: 'pending',
    },
    { key: 'write-opening', title: '保存故事第一幕', detail: '写入角色卡第一条消息并连接状态栏', status: 'pending' },
    { key: 'write-mvu', title: '创建互动状态', detail: '准备时间、地点、关系值和更新规则', status: 'pending' },
    { key: 'install-runtime', title: '安装互动能力', detail: '让角色能够持续记录和更新状态', status: 'pending' },
    { key: 'install-schema', title: '配置关系变量', detail: '按角色数量创建安全的数据结构', status: 'pending' },
    { key: 'install-regex', title: '连接状态栏显示', detail: '安装状态展示和内容整理规则', status: 'pending' },
    ...(hasAvatar
      ? [{ key: 'write-avatar', title: '写入卡面', detail: '把用户图片写成角色卡面', status: 'pending' as WorkStatus }]
      : []),
  ];
}

function updateStage(index: number, status: WorkStatus, error?: string) {
  workStages.value[index] = {
    ...workStages.value[index],
    status,
    error,
    progress: status === 'done' ? 100 : status === 'pending' ? undefined : (workStages.value[index].progress ?? 0),
  };
}

function updateGenerationProgress(stageKey: string, progress: GenerationProgress) {
  const stageIndex = findStageIndex(stageKey);
  if (stageIndex < 0) return;
  const ratio = progress.total > 0 ? progress.completed / progress.total : 0;
  const percent = progress.phase === 'segment' ? ratio * 55 : progress.phase === 'summary' ? 55 + ratio * 35 : 95;
  workStages.value[stageIndex] = {
    ...workStages.value[stageIndex],
    detail: progress.message,
    progress: Math.max(workStages.value[stageIndex].progress ?? 0, Math.round(percent)),
  };
}

function clearStagesFrom(index: number) {
  workStages.value = workStages.value.map((item, itemIndex) => {
    if (itemIndex < index) return item;
    return { ...item, status: 'pending', error: undefined, progress: undefined };
  });
}

function requirePipelineState(): PipelineState {
  if (!pipelineState.value) throw new Error('工作状态丢失，请重新生成全部');
  return pipelineState.value;
}

function requireWorldview(state: PipelineState): WorldviewResult {
  if (!state.worldview) throw new Error('世界观尚未生成，请从世界观阶段重新开始');
  return state.worldview;
}

function getCompletedRoles(state: PipelineState): RoleResult[] {
  return state.roleResults.filter(Boolean);
}

function extractAvoidTerms(message: string): string[] {
  const exactTerms = Array.from(message.matchAll(/（([^）]+)）/gu))
    .map(match => match[1]?.trim())
    .filter(Boolean);
  if (exactTerms.length > 0) return exactTerms;
  if (/工程词|占位内容|模板词|工程占位词/u.test(message)) {
    return ['模板', '提示词', '工程词', '占位符', 'placeholder'];
  }
  return [];
}

function friendlyStageError(stageKey: string, message: string): string {
  if (/401|403|unauthorized|api.?key|quota|余额|额度/iu.test(message)) {
    return '当前生成接口不可用，请检查模型或 API 设置后重试。';
  }
  if (/network|failed to fetch|timeout|timed out|网络|连接超时/iu.test(message)) {
    return '连接暂时不稳定，请稍后重试当前阶段。';
  }
  if (stageKey === 'create-snapshot') return '生成前版本保存失败。角色卡尚未被修改，请直接重试。';
  if (stageKey.startsWith('generate-')) {
    if (/工程词|占位内容|模板词|placeholder|内部标签/iu.test(message)) {
      return '本次生成混入了模板内容，已准备好重新生成这一阶段。';
    }
    return '本次生成没有得到可用内容，请重新生成这一阶段。';
  }
  if (stageKey === 'write-avatar') return '角色卡面写入失败，其他内容已经保留，可以单独重试。';
  if (stageKey === 'bind-worldbook' || stageKey === 'clear-old' || stageKey.startsWith('write-')) {
    return '保存角色卡内容时遇到问题，已完成内容仍然保留，请重试当前阶段。';
  }
  if (stageKey.startsWith('install-')) return '互动能力还没有安装完成，请重试当前阶段。';
  return message.length > 160 ? '这一阶段没有完成，请重试；详细信息已记录在活动日志中。' : message;
}

function rememberRetryAvoidTerms(state: PipelineState, stageKey: string, message: string) {
  const terms = extractAvoidTerms(message);
  if (terms.length === 0) return;
  state.retryAvoidTerms[stageKey] = Array.from(new Set([...(state.retryAvoidTerms[stageKey] ?? []), ...terms]));
  pushLog('warning', `下次重试会提醒 AI 避开：${state.retryAvoidTerms[stageKey].join('、')}`);
}

function requestContinuationApproval(request: ContinuationApprovalRequest): Promise<boolean> {
  continuationApproval.value = request;
  return new Promise<boolean>(resolve => {
    resolveContinuationApproval = resolve;
  });
}

function resolveContinuation(shouldContinue: boolean) {
  const resolve = resolveContinuationApproval;
  continuationApproval.value = null;
  resolveContinuationApproval = null;
  resolve?.(shouldContinue);
}

function retryOptionsFor(state: PipelineState, stageKey: string) {
  return {
    avoidTerms: state.retryAvoidTerms[stageKey] ?? [],
    shouldStream: generationMode.value !== 'nonstream',
    autoContinue: generationMode.value === 'fake-stream',
    onProgress: (progress: GenerationProgress) => {
      updateGenerationProgress(stageKey, progress);
      pushLog('info', progress.message);
    },
    onHeartbeat: (heartbeat: GenerationHeartbeat) => {
      generationHeartbeat.value = heartbeat.active ? heartbeat : null;
    },
    requestContinuation: requestContinuationApproval,
  };
}

function clearRetryAvoidTerms(state: PipelineState, stageKey: string) {
  delete state.retryAvoidTerms[stageKey];
}

function ensureArtifacts(state: PipelineState): WriterArtifacts {
  if (!state.artifacts) {
    state.artifacts = buildArtifacts(requireWorldview(state), getCompletedRoles(state));
  }
  return state.artifacts;
}

function returnEditor() {
  workStarted.value = false;
  failedStageIndex.value = null;
  isBusy.value = false;
  step.value = fullWorkspaceMode.value;
}

async function closeWriter() {
  if (isBusy.value) requestWriterGenerationStop();
  if (continuationApproval.value) resolveContinuation(false);
  saveDraftNow();
  await pendingDraftSave?.catch(() => undefined);
  props.onExit();
}

async function confirmCompletion() {
  if (isBusy.value) return;
  isBusy.value = true;
  try {
    const targetCharacter = pipelineState.value?.targetCharacter ?? currentCharacter.value;
    await updateTargetAvatar(targetCharacter, avatarFile.value);
    await openTargetCharacterCard(targetCharacter);
    await pendingDraftSave?.catch(() => undefined);
    await clearWriterDraft();
    try {
      localStorage.removeItem(draftStorageKey());
    } catch {
      // Local storage may be unavailable; IndexedDB is the primary store.
    }
    draftSavedAt.value = null;
    props.onExit();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', message);
    toastr.error(message, '打开角色卡失败');
  } finally {
    isBusy.value = false;
  }
}

async function restorePreviousVersion() {
  if (!recoverySnapshot.value || isBusy.value) return;
  isBusy.value = true;
  try {
    await restoreWriterRecoverySnapshot(recoverySnapshot.value);
    showRestoreConfirm.value = false;
    showFormatReview.value = false;
    workStarted.value = false;
    failedStageIndex.value = null;
    pausedStageIndex.value = null;
    stopRequested.value = false;
    pipelineState.value = null;
    workStages.value = [];
    previewText.value = '';
    generationWarnings.value = [];
    recoverySnapshot.value = null;
    step.value = fullWorkspaceMode.value;
    pushLog('success', '已恢复生成前版本，填写的草稿仍然保留');
    toastr.success('世界书、角色脚本和状态栏规则已恢复', '恢复完成');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', `恢复失败：${message}`);
    toastr.error(message, '恢复失败');
  } finally {
    isBusy.value = false;
  }
}

function enterEditor() {
  if (!canEnterEditor.value || isBusy.value) return;
  fullWorkspaceMode.value = 'editor';
  showPreflight.value = false;
  workStarted.value = false;
  step.value = 'editor';
}

async function executeStage(stageKey: string) {
  const state = requirePipelineState();

  if (stageKey === 'create-snapshot') {
    recoverySnapshot.value = await createWriterRecoverySnapshot(state.targetWorldbook, state.targetCharacter);
    pushLog('success', '已保存生成前版本，可在完成页一键恢复');
    return;
  }

  if (stageKey === 'prepare-character') {
    await ensureTargetCharacter(state.targetCharacter, null);
    return;
  }

  if (stageKey === 'bind-worldbook') {
    pushLog('info', `确认世界书：${state.targetWorldbook}`);
    await ensureWorldbookBound(state.targetWorldbook, state.targetCharacter);
    return;
  }

  if (stageKey === 'clear-old') {
    await clearWriterEntries(state.targetWorldbook);
    return;
  }

  if (stageKey === 'generate-worldview') {
    state.roleResults = [];
    state.opening = undefined;
    state.artifacts = undefined;
    const worldview = await generateWorldview(state.worldviewSeed, retryOptionsFor(state, stageKey));
    state.worldview = worldview;
    previewText.value = worldview.content;
    noteGenerationWarnings('世界观', worldview.warnings);
    pushLog('success', '世界观生成完成');
    return;
  }

  if (stageKey === 'write-worldview') {
    await upsertWriterEntries(state.targetWorldbook, buildWorldviewEntries(requireWorldview(state)));
    return;
  }

  const generateRoleMatch = stageKey.match(/^generate-role-(\d+)$/);
  if (generateRoleMatch) {
    const roleIndex = Number(generateRoleMatch[1]);
    const role = state.activeRoles[roleIndex];
    if (!role) throw new Error(`未找到角色${roleIndex + 1}素材`);
    const result = await generateRole(
      role,
      requireWorldview(state).content,
      roleIndex,
      retryOptionsFor(state, stageKey),
    );
    state.roleResults[roleIndex] = result;
    state.opening = undefined;
    state.artifacts = undefined;
    previewText.value = result.basic;
    noteGenerationWarnings(result.name, result.warnings);
    pushLog('success', `${result.name} 生成完成`);
    return;
  }

  if (stageKey === 'generate-opening') {
    const roleResults = getCompletedRoles(state);
    if (roleResults.length !== state.activeRoles.length) throw new Error('角色尚未全部生成，无法生成开场白');
    const opening = await generateOpening(
      state.openingStyle,
      state.openingOutline,
      requireWorldview(state).content,
      roleResults,
      retryOptionsFor(state, stageKey),
    );
    state.opening = opening;
    previewText.value = opening.content;
    noteGenerationWarnings('开场白', opening.warnings);
    pushLog('success', '开场白生成完成');
    return;
  }

  if (stageKey === 'write-opening') {
    if (!state.opening) throw new Error('开场白尚未生成，请先重新生成开场白');
    await updateFirstMessage(state.targetCharacter, state.opening.content);
    return;
  }

  const writeRoleMatch = stageKey.match(/^write-role-(\d+)$/);
  if (writeRoleMatch) {
    const roleIndex = Number(writeRoleMatch[1]);
    const result = state.roleResults[roleIndex];
    if (!result) throw new Error(`角色${roleIndex + 1}尚未生成，请先重新生成该角色`);
    await upsertWriterEntries(state.targetWorldbook, [
      ...buildRoleOverviewEntries(getCompletedRoles(state)),
      ...buildRoleEntries(result, roleIndex, state.isMultiRole),
    ]);
    return;
  }

  if (stageKey === 'write-mvu') {
    const roleResults = getCompletedRoles(state);
    if (roleResults.length === 0) throw new Error('至少需要一个已生成角色');
    await upsertWriterEntries(state.targetWorldbook, buildFixedMvuEntries(roleResults));
    return;
  }

  if (stageKey === 'install-runtime') {
    await installMvuRuntimeScript(state.targetCharacter);
    return;
  }

  if (stageKey === 'install-schema') {
    await installMvuSchemaScript(state.targetCharacter, ensureArtifacts(state).mvuSchemaScript);
    return;
  }

  if (stageKey === 'install-regex') {
    await installMvuRegexes(state.targetCharacter, ensureArtifacts(state).statusRegexHtml);
    return;
  }

  if (stageKey === 'write-avatar') {
    await updateTargetAvatar(state.targetCharacter, avatarFile.value);
  }
}

async function runPipeline(startIndex = 0) {
  if (isBusy.value) return;
  resetWriterGenerationStop();
  generationHeartbeat.value = null;
  isBusy.value = true;
  workStarted.value = true;
  failedStageIndex.value = null;
  pausedStageIndex.value = null;
  stopRequested.value = false;

  if (startIndex === 0) {
    previewText.value = '';
    generationWarnings.value = [];
    recoverySnapshot.value = null;
    Object.keys(formatOriginalOutputs)
      .filter(key => key === 'worldview' || key === 'opening' || key.startsWith('role:'))
      .forEach(key => delete formatOriginalOutputs[key]);
    const roleSource = fullWorkspaceMode.value === 'beginner' ? roles.slice(0, 1) : roles;
    const activeRoles = roleSource.filter(role => role.seed.trim()).map(role => ({ ...role }));
    if (activeRoles.length === 0) {
      isBusy.value = false;
      throw new Error('至少需要填写一个角色素材');
    }

    pipelineState.value = {
      targetCharacter: currentCharacter.value,
      targetWorldbook: worldbookName.value.trim(),
      worldviewSeed: worldviewSeed.value.trim(),
      activeRoles,
      isMultiRole: activeRoles.length > 1,
      roleResults: [],
      retryAvoidTerms: {},
      openingStyle: openingStyle.value.trim(),
      openingOutline: openingOutline.value.trim(),
    };
    workStages.value = buildWorkStages(activeRoles, Boolean(avatarFile.value));
  } else {
    clearStagesFrom(startIndex);
  }

  try {
    for (let index = startIndex; index < workStages.value.length; index += 1) {
      assertWriterGenerationActive();
      const stageItem = workStages.value[index];
      updateStage(index, 'running');
      pushLog('info', stageItem.title);
      await executeStage(stageItem.key);
      assertWriterGenerationActive();
      clearRetryAvoidTerms(requirePipelineState(), stageItem.key);
      updateStage(index, 'done');
      if (stopRequested.value && index + 1 < workStages.value.length) {
        pausedStageIndex.value = index + 1;
        pushLog('warning', '已在当前步骤完成后安全停止，可以在当前窗口继续');
        toastr.info('当前步骤已完成，任务已安全停止', '一键角色卡写卡器');
        return;
      }
    }

    pushLog('success', '完整角色卡生成并写入完成');
    toastr.success('完整角色卡已生成并写入');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failedStageIndex.value = workStages.value.findIndex(item => item.status === 'running');
    if (failedStageIndex.value < 0) failedStageIndex.value = startIndex;
    const failedStage = workStages.value[failedStageIndex.value];
    const displayMessage = friendlyStageError(failedStage?.key ?? '', message);
    updateStage(failedStageIndex.value, 'error', displayMessage);
    if (pipelineState.value && failedStage) rememberRetryAvoidTerms(pipelineState.value, failedStage.key, message);
    pushLog('error', displayMessage === message ? message : `${displayMessage}（详细信息：${message}）`);
    toastr.error(displayMessage, '一键角色卡写卡器');
  } finally {
    generationHeartbeat.value = null;
    isBusy.value = false;
  }
}

async function runWriter() {
  if (!canRun.value || isBusy.value) return;
  try {
    await runPipeline(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushLog('error', message);
    toastr.error(message, '一键角色卡写卡器');
  }
}

async function runPersonaOnly() {
  if (!canRunPersona.value || isBusy.value) return;
  resetWriterGenerationStop();
  generationHeartbeat.value = null;
  isBusy.value = true;
  personaResult.value = null;
  delete formatOriginalOutputs.persona;
  generationWarnings.value = [];
  previewText.value = '';
  logs.value = [];
  try {
    pushLog('info', `生成${personaModeLabel.value}`);
    const result = await generatePersonaOnly(personaSeed.value.trim(), personaMode.value, {
      shouldStream: generationMode.value !== 'nonstream',
      autoContinue: generationMode.value === 'fake-stream',
      onHeartbeat: heartbeat => {
        generationHeartbeat.value = heartbeat.active ? heartbeat : null;
      },
      requestContinuation: requestContinuationApproval,
    });
    personaResult.value = result;
    noteGenerationWarnings(personaModeLabel.value, result.warnings);
    pushLog('success', `${personaModeLabel.value}生成完成`);
    toastr.success(`${personaModeLabel.value}已生成`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const displayMessage = friendlyStageError('generate-persona', message);
    pushLog('error', displayMessage === message ? message : `${displayMessage}（详细信息：${message}）`);
    toastr.error(displayMessage, '一键角色卡写卡器');
  } finally {
    generationHeartbeat.value = null;
    isBusy.value = false;
  }
}

async function retryFailedStage() {
  if (failedStageIndex.value === null || isBusy.value) return;
  await runPipeline(failedStageIndex.value);
}

function requestStopAfterStage() {
  if (!isBusy.value || stopRequested.value) return;
  stopRequested.value = true;
  pushLog('info', '收到停止请求，将在当前步骤完成后安全停止');
}

function stopActiveGeneration() {
  if (!isBusy.value) return;
  const stopped = requestWriterGenerationStop();
  if (continuationApproval.value) resolveContinuation(false);
  pushLog('warning', stopped ? '已向当前模型发送停止信号' : '已标记立即停止当前生成请求');
  toastr.warning('正在停止当前生成请求…', '一键角色卡写卡器');
}

async function resumePipeline() {
  if (pausedStageIndex.value === null || isBusy.value) return;
  await runPipeline(pausedStageIndex.value);
}

async function rerollRoleStage(roleIndex: number, stageIndex: number) {
  const state = requirePipelineState();
  const role = state.activeRoles[roleIndex];
  if (!role) throw new Error(`未找到角色${roleIndex + 1}素材`);

  resetWriterGenerationStop();
  generationHeartbeat.value = null;
  isBusy.value = true;
  failedStageIndex.value = null;
  try {
    delete formatOriginalOutputs[`role:${roleIndex}`];
    updateStage(stageIndex, 'running');
    pushLog('info', `重新生成 ${role.label}`);
    const stageKey = `generate-role-${roleIndex}`;
    const result = await generateRole(
      role,
      requireWorldview(state).content,
      roleIndex,
      retryOptionsFor(state, stageKey),
    );
    state.roleResults[roleIndex] = result;
    state.artifacts = undefined;
    previewText.value = result.basic;
    noteGenerationWarnings(result.name, result.warnings);

    const rolesReady = getCompletedRoles(state);
    const artifacts = buildArtifacts(requireWorldview(state), rolesReady);
    state.artifacts = artifacts;
    await replaceWriterEntries(state.targetWorldbook, artifacts.entries);
    await installMvuSchemaScript(state.targetCharacter, artifacts.mvuSchemaScript);
    await installMvuRegexes(state.targetCharacter, artifacts.statusRegexHtml);
    if (rolesReady.length === state.activeRoles.length) {
      const opening = await generateOpening(
        state.openingStyle,
        state.openingOutline,
        requireWorldview(state).content,
        rolesReady,
        retryOptionsFor(state, 'generate-opening'),
      );
      state.opening = opening;
      await updateFirstMessage(state.targetCharacter, opening.content);
      noteGenerationWarnings('开场白', opening.warnings);
    }

    updateStage(stageIndex, 'done');
    clearRetryAvoidTerms(state, stageKey);
    const writeIndex = findStageIndex(`write-role-${roleIndex}`);
    if (writeIndex >= 0) updateStage(writeIndex, 'done');
    pushLog('success', `${result.name} 已重新生成并刷新世界书、互动变量和状态栏`);
    toastr.success(`${result.name} 已重新生成`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const displayMessage = friendlyStageError(`generate-role-${roleIndex}`, message);
    failedStageIndex.value = stageIndex;
    updateStage(stageIndex, 'error', displayMessage);
    rememberRetryAvoidTerms(state, `generate-role-${roleIndex}`, message);
    pushLog('error', displayMessage === message ? message : `${displayMessage}（详细信息：${message}）`);
    toastr.error(displayMessage, '一键角色卡写卡器');
  } finally {
    generationHeartbeat.value = null;
    isBusy.value = false;
  }
}

async function rerollStage(stageItem: WorkStage) {
  if (isBusy.value) return;
  const stageIndex = findStageIndex(stageItem.key);
  if (stageIndex < 0) return;

  if (stageItem.key === 'generate-worldview') {
    Object.keys(formatOriginalOutputs)
      .filter(key => key === 'worldview' || key === 'opening' || key.startsWith('role:'))
      .forEach(key => delete formatOriginalOutputs[key]);
    await runPipeline(Math.max(1, stageIndex - 1));
    return;
  }

  if (stageItem.key === 'generate-opening') {
    delete formatOriginalOutputs.opening;
    await runPipeline(stageIndex);
    return;
  }

  const roleMatch = stageItem.key.match(/^generate-role-(\d+)$/u);
  if (roleMatch) {
    await rerollRoleStage(Number(roleMatch[1]), stageIndex);
  }
}
</script>

<style src="./styles/writer-base.css"></style>

<style src="./styles/tamamo-app.css"></style>
