<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import ChatPanel from '../chat/ChatPanel.vue';
import ActivityPanel from '../activity/ActivityPanel.vue';
import BabyWizard from './BabyWizard.vue';
import BabyAssistantPanel from './BabyAssistantPanel.vue';
import PlanModePanel from './PlanModePanel.vue';
import qiuqingziChibi from '../../assets/qiuqingzi-chibi.png?url';
import { useWorkshopStore, type TaskDefinition, type WorkshopMode, type WorkshopWriteOperation } from '../../stores/workshop';
import { usePresetStore } from '../../stores/preset';
import { useChatStore } from '../../stores/chat';
import { useActivityStore } from '../../stores/activity';
import { usePlanStore } from '../../stores/plan';
import { applyWorkshopPlan, dryrunWorkshopPlan } from '../../utils/workshop-executor';
import { getBabyFieldGuide } from '../../utils/baby-assistant';

const props = defineProps<{
  currentCharName?: string | null;
  streamingContent?: string;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  openExpert: [];
  sendStart: [];
  sendFailed: [];
}>();

const workshopStore = useWorkshopStore();
const presetStore = usePresetStore();
const chatStore = useChatStore();
const activityStore = useActivityStore();
const planStore = usePlanStore();

const modeOrder: WorkshopMode[] = ['baby', 'standard', 'pro'];
const isBabyMode = computed(() => workshopStore.mode === 'baby');
const showTargetInput = computed(() => !isBabyMode.value);
type MobileFoldSection = 'mode' | 'tasks' | 'brief' | 'next';
type WorkshopViewportSize = { width: number; height: number };
const WORKSHOP_MOBILE_LAYOUT_MAX_WIDTH = 768;
const WORKSHOP_PORTRAIT_LAYOUT_MAX_WIDTH = 1200;
const WORKSHOP_PORTRAIT_LAYOUT_RATIO = 1.5;
const mobileFoldOpen = ref<Record<MobileFoldSection, boolean>>({
  mode: true,
  tasks: true,
  brief: false,
  next: false,
});
const workshopViewportSize = ref<WorkshopViewportSize>(readWorkshopViewportSize());
const effectiveIsMobile = computed(
  () => props.isMobile === true || isWorkshopMobileViewport(workshopViewportSize.value),
);
const isBabyAssistantFloating = computed(() => isBabyMode.value && effectiveIsMobile.value);
const rightFloatingExpanded = ref(false);
const rightFloatingShellRef = ref<HTMLElement | null>(null);
const rightFloatingSuppressClick = ref(false);
const rightFloatingPosition = ref({ x: 0, y: 0 });
const rightFloatingDrag = ref<{
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  captureTarget: HTMLElement | null;
  frameWindow: Window;
  hostWindow: Window;
  frameDocument: Document;
  hostDocument: Document | null;
  previousFrameUserSelect: string;
  previousHostUserSelect: string | null;
} | null>(null);
let rightFloatingAnchorTimer: ReturnType<typeof window.setTimeout> | null = null;
const showMobileBabyChatPanel = computed(() => isBabyMode.value && isBabyAssistantFloating.value);
const showMobileStandardChatPanel = computed(() => effectiveIsMobile.value && !isBabyMode.value);
const showWorkshopRightPanel = computed(() => !effectiveIsMobile.value || isBabyMode.value);

function readWorkshopViewportSize(): WorkshopViewportSize {
  const visualWidth = window.visualViewport?.width;
  const visualHeight = window.visualViewport?.height;
  const docWidth = document.documentElement.clientWidth;
  const docHeight = document.documentElement.clientHeight;
  let parentWidth = window.innerWidth;
  let parentHeight = window.innerHeight;
  try {
    const parentWindow = window.parent || window;
    parentWidth = parentWindow.innerWidth;
    parentHeight = parentWindow.innerHeight;
  } catch {
    /* keep frame viewport fallback */
  }
  const width = visualWidth && visualWidth > 0 ? visualWidth : docWidth || window.innerWidth;
  const height = visualHeight && visualHeight > 0 ? visualHeight : docHeight || window.innerHeight;
  return {
    width: width > 0 ? width : parentWidth,
    height: height > 0 ? height : parentHeight,
  };
}

function isWorkshopMobileViewport({ width, height }: WorkshopViewportSize) {
  return (
    width <= WORKSHOP_MOBILE_LAYOUT_MAX_WIDTH ||
    (width <= WORKSHOP_PORTRAIT_LAYOUT_MAX_WIDTH && height >= width * WORKSHOP_PORTRAIT_LAYOUT_RATIO)
  );
}

const rightFloatingStyle = computed(() =>
  isBabyAssistantFloating.value
    ? {
        transform: `translate3d(${rightFloatingPosition.value.x}px, ${rightFloatingPosition.value.y}px, 0)`,
      }
    : {},
);

function getRightFloatingViewportWindow() {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent;
    }
  } catch {
    /* ignore cross-window access failures */
  }
  return rightFloatingShellRef.value?.ownerDocument?.defaultView ?? window;
}

function getRightFloatingViewportSize() {
  const hostWindow = getRightFloatingViewportWindow();
  const frameWindow = rightFloatingShellRef.value?.ownerDocument?.defaultView ?? window;
  const hostWidth = hostWindow.visualViewport?.width ?? hostWindow.innerWidth;
  const hostHeight = hostWindow.visualViewport?.height ?? hostWindow.innerHeight;
  const frameWidth = frameWindow.visualViewport?.width ?? frameWindow.innerWidth;
  const frameHeight = frameWindow.visualViewport?.height ?? frameWindow.innerHeight;
  return {
    width: Math.max(320, Math.round(Math.max(hostWidth || 0, frameWidth || 0))),
    height: Math.max(320, Math.round(Math.max(hostHeight || 0, frameHeight || 0))),
  };
}

function getRightFloatingShellSize() {
  if (!rightFloatingExpanded.value) {
    return { width: 76, height: 92 };
  }
  const viewport = getRightFloatingViewportSize();
  const maxHeight = showMobileBabyChatPanel.value ? 560 : 760;
  return {
    width: Math.min(380, Math.max(300, viewport.width - 24)),
    height: Math.min(maxHeight, Math.max(360, viewport.height - 36)),
  };
}

function clampRightFloatingPosition(next = rightFloatingPosition.value) {
  if (!isBabyAssistantFloating.value) return;
  const safe = 12;
  const rect = rightFloatingShellRef.value?.getBoundingClientRect();
  const fallback = getRightFloatingShellSize();
  const width = rect?.width || fallback.width;
  const height = rect?.height || fallback.height;
  const viewport = getRightFloatingViewportSize();
  const maxX = Math.max(safe, viewport.width - width - safe);
  const maxY = Math.max(72, viewport.height - height - safe);
  rightFloatingPosition.value = {
    x: Math.min(Math.max(safe, next.x), maxX),
    y: Math.min(Math.max(72, next.y), maxY),
  };
}

function resetRightFloatingPosition() {
  if (!isBabyAssistantFloating.value) return;
  const size = getRightFloatingShellSize();
  const viewport = getRightFloatingViewportSize();
  rightFloatingPosition.value = {
    x: Math.max(12, viewport.width - size.width - 12),
    y: Math.max(72, Math.min(viewport.height - size.height - 12, Math.round(viewport.height * 0.14))),
  };
  nextTick(() => clampRightFloatingPosition());
}

function scheduleRightFloatingAnchorRefresh() {
  if (rightFloatingAnchorTimer) {
    window.clearTimeout(rightFloatingAnchorTimer);
  }
  rightFloatingAnchorTimer = window.setTimeout(() => {
    rightFloatingAnchorTimer = null;
    if (!isBabyAssistantFloating.value || rightFloatingDrag.value) return;
    if (rightFloatingPosition.value.x <= 12 && rightFloatingPosition.value.y <= 72) {
      resetRightFloatingPosition();
      return;
    }
    clampRightFloatingPosition();
  }, 80);
}

function syncRightFloatingExpanded(next: boolean) {
  rightFloatingExpanded.value = next;
  nextTick(() => {
    clampRightFloatingPosition();
    scheduleRightFloatingAnchorRefresh();
  });
}

function expandRightFloatingShell() {
  if (rightFloatingSuppressClick.value) {
    rightFloatingSuppressClick.value = false;
    return;
  }
  syncRightFloatingExpanded(true);
}

function collapseRightFloatingShell() {
  syncRightFloatingExpanded(false);
}

function cleanupRightFloatingDrag(drag: NonNullable<typeof rightFloatingDrag.value>) {
  drag.frameWindow.removeEventListener('pointermove', moveRightFloatingDrag);
  drag.frameWindow.removeEventListener('pointerup', endRightFloatingDrag);
  drag.frameWindow.removeEventListener('pointercancel', endRightFloatingDrag);
  if (drag.hostWindow !== drag.frameWindow) {
    drag.hostWindow.removeEventListener('pointermove', moveRightFloatingDrag);
    drag.hostWindow.removeEventListener('pointerup', endRightFloatingDrag);
    drag.hostWindow.removeEventListener('pointercancel', endRightFloatingDrag);
  }
  drag.frameDocument.body.style.userSelect = drag.previousFrameUserSelect;
  if (drag.hostDocument?.body && drag.previousHostUserSelect !== null) {
    drag.hostDocument.body.style.userSelect = drag.previousHostUserSelect;
  }
  try {
    drag.captureTarget?.releasePointerCapture?.(drag.pointerId);
  } catch {
    /* embedded iframe environments may reject pointer capture release */
  }
}

function startRightFloatingDrag(event: PointerEvent) {
  if (!isBabyAssistantFloating.value || event.button !== 0) return;
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  if (target.tagName !== 'BUTTON' && event.target instanceof Element && event.target.closest('button')) return;
  event.preventDefault();
  if (rightFloatingDrag.value) {
    cleanupRightFloatingDrag(rightFloatingDrag.value);
  }
  const frameWindow = target.ownerDocument.defaultView ?? window;
  const hostWindow = getRightFloatingViewportWindow();
  const frameDocument = frameWindow.document;
  const hostDocument = hostWindow.document ?? null;
  const previousFrameUserSelect = frameDocument.body.style.userSelect;
  const previousHostUserSelect = hostDocument?.body?.style?.userSelect ?? null;
  frameDocument.body.style.userSelect = 'none';
  if (hostDocument?.body) {
    hostDocument.body.style.userSelect = 'none';
  }
  try {
    target.setPointerCapture?.(event.pointerId);
  } catch {
    /* embedded iframe environments may reject pointer capture */
  }
  rightFloatingDrag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: rightFloatingPosition.value.x,
    originY: rightFloatingPosition.value.y,
    moved: false,
    captureTarget: target,
    frameWindow,
    hostWindow,
    frameDocument,
    hostDocument,
    previousFrameUserSelect,
    previousHostUserSelect,
  };
  frameWindow.addEventListener('pointermove', moveRightFloatingDrag);
  frameWindow.addEventListener('pointerup', endRightFloatingDrag);
  frameWindow.addEventListener('pointercancel', endRightFloatingDrag);
  if (hostWindow !== frameWindow) {
    hostWindow.addEventListener('pointermove', moveRightFloatingDrag);
    hostWindow.addEventListener('pointerup', endRightFloatingDrag);
    hostWindow.addEventListener('pointercancel', endRightFloatingDrag);
  }
}

function moveRightFloatingDrag(event: PointerEvent) {
  const drag = rightFloatingDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) {
    drag.moved = true;
    rightFloatingSuppressClick.value = true;
  }
  clampRightFloatingPosition({
    x: drag.originX + dx,
    y: drag.originY + dy,
  });
}

function endRightFloatingDrag(event: PointerEvent) {
  const drag = rightFloatingDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const moved = drag.moved;
  if (!moved) {
    rightFloatingSuppressClick.value = false;
  } else {
    window.setTimeout(() => {
      rightFloatingSuppressClick.value = false;
    }, 120);
  }
  cleanupRightFloatingDrag(drag);
  rightFloatingDrag.value = null;
}

function handleRightFloatingResize() {
  workshopViewportSize.value = readWorkshopViewportSize();
  if (!isBabyAssistantFloating.value) return;
  nextTick(() => {
    clampRightFloatingPosition();
    scheduleRightFloatingAnchorRefresh();
  });
}

function syncRightFloatingViewportListeners(shouldAttach: boolean) {
  const frameWindow = rightFloatingShellRef.value?.ownerDocument?.defaultView ?? window;
  const hostWindow = getRightFloatingViewportWindow();
  if (shouldAttach) {
    frameWindow.addEventListener('resize', handleRightFloatingResize);
    frameWindow.visualViewport?.addEventListener('resize', handleRightFloatingResize);
    if (hostWindow !== frameWindow) {
      hostWindow.addEventListener('resize', handleRightFloatingResize);
      hostWindow.visualViewport?.addEventListener('resize', handleRightFloatingResize);
    }
    return;
  }
  frameWindow.removeEventListener('resize', handleRightFloatingResize);
  frameWindow.visualViewport?.removeEventListener('resize', handleRightFloatingResize);
  if (hostWindow !== frameWindow) {
    hostWindow.removeEventListener('resize', handleRightFloatingResize);
    hostWindow.visualViewport?.removeEventListener('resize', handleRightFloatingResize);
  }
}

const targetGuide = getBabyFieldGuide('target.worldbook');
const notesGuide = getBabyFieldGuide('notes.freeform');

const babyTargetIsCharacter = computed(() => isBabyMode.value && workshopStore.selectedTask.category === '前端');
const babyTargetFieldId = computed(() => (babyTargetIsCharacter.value ? 'target.character' : 'target.worldbook'));
const targetInputLabel = computed(() => {
  if (!isBabyMode.value) return '目标角色或世界书';
  return babyTargetIsCharacter.value ? '目标角色名' : '目标世界书';
});
const targetInputPlaceholder = computed(() =>
  isBabyMode.value
    ? babyTargetIsCharacter.value
      ? getBabyFieldGuide('target.character').placeholder
      : targetGuide.placeholder
    : props.currentCharName || '例如：秋明月 / 秋明月世界书',
);
const notesInputLabel = computed(() => (isBabyMode.value ? '临时素材' : '用户补充素材'));
const notesInputPlaceholder = computed(() =>
  isBabyMode.value
    ? notesGuide.placeholder
    : '把用户手写的人设、世界观、变量需求或参考路径放在这里。调色盘类内容会保留原味，不让 AI 自查改写。',
);

const modeTone = computed(() => {
  switch (workshopStore.mode) {
    case 'baby':
      return '稳稳喂到嘴边';
    case 'standard':
      return '协作但有边界';
    case 'pro':
      return '明确指挥工具';
  }
});

const categoryCounts = computed(() => {
  return workshopStore.availableTasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.category] = (acc[task.category] ?? 0) + 1;
    return acc;
  }, {});
});

const writeRiskLabel = computed(() => {
  switch (workshopStore.selectedTask.category) {
    case 'MVU':
    case 'EJS':
    case '前端':
      return '代码类：必须通过模板和检查';
    case '世界书':
      return '配置类：必须 dryrun 后确认';
    default:
      return '文字类：保留作者主权';
  }
});

const activeArtifactId = ref('');
const writePanelRef = ref<HTMLElement | null>(null);
const activeArtifact = computed(
  () =>
    workshopStore.generatedArtifacts.find(artifact => artifact.id === activeArtifactId.value) ??
    workshopStore.generatedArtifacts[0] ??
    null,
);
const activeArtifactPrevious = computed(() => {
  const artifact = activeArtifact.value;
  const tree = planStore.activePlan?.artifacts;
  if (!artifact || !tree) return null;
  return tree.previousArtifacts.find(item => item.id === artifact.id || item.targetPath === artifact.targetPath) ?? null;
});
const activeArtifactDiff = computed(() => {
  const artifact = activeArtifact.value;
  if (!artifact) return '';
  const previous = activeArtifactPrevious.value?.content ?? '';
  if (!previous) return `+ ${artifact.content.slice(0, 2400)}`;
  return buildLineDiff(previous, artifact.content, 80);
});
const babyTaskIntros: Record<string, string> = {
  'character.base': '填写姓名、年龄、身份、关系和外貌这些安全基础信息。',
  'worldview.write': '先和秋青子聊清楚世界观，再把最终整理稿贴回工作台。',
  'character.palette': '贴上你手写的性格核心，秋青子只帮你整理格式。',
  'character.wardrobe_prompt': '写角色常穿什么、喜欢什么风格、讨厌什么风格。',
  'mvu.schema': '填写开局状态和变化要求，固定格式由前端自动补齐。',
  'ejs.stage_palette': '让不同阶段自动使用不同的手写人设。',
  'frontend.mvu_status_bar': '把已做好的 MVU 变量显示成聊天里的状态栏。',
  'frontend.beautify': '把正文或资料变成好看的小页面。',
};
const displayedTaskSummary = computed(() =>
  isBabyMode.value
    ? workshopStore.selectedTask.babySummary ?? babyTaskIntros[workshopStore.selectedTask.id] ?? workshopStore.selectedTask.summary
    : workshopStore.selectedTask.summary,
);
const displayedFirstAction = computed(() =>
  isBabyMode.value
    ? workshopStore.selectedTask.babyFirstAction ?? workshopStore.selectedTask.firstAction
    : workshopStore.selectedTask.firstAction,
);
const displayedOutputs = computed(() =>
  isBabyMode.value ? workshopStore.selectedTask.babyOutputs ?? workshopStore.selectedTask.outputs : workshopStore.selectedTask.outputs,
);
const babyHasGeneratedOutput = computed(() => isBabyMode.value && workshopStore.generatedArtifacts.length > 0);
const hasUnfinishedPlan = computed(() => Boolean(planStore.activePlan && planStore.activePlan.status !== 'ready_to_complete'));
const babyPreviewArtifact = computed(() =>
  isBabyMode.value
    ? workshopStore.generatedArtifacts.find(artifact => artifact.riskLevel === 'code' && artifact.content.includes('<!DOCTYPE html>')) ?? null
    : null,
);
const babyPreviewSrcdoc = computed(() => {
  if (!babyPreviewArtifact.value) return '';
  const raw = babyPreviewArtifact.value.content;
  const body = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)?.[1] ?? raw;
  const scriptClose = '</' + 'script>';
  const mock = [
    '<script>',
    'window.getCurrentMessageId = function() { return 0; };',
    'window.getChatMessages = function() { return [{ message: "<story>这里是预览用的正文第一段。\\\\n\\\\n这里是第二段，用来检查排版会不会拥挤。</story>\\\\n<status_current_variables>好感度: 42\\\\n心情: 安静\\\\n阶段: 熟悉</status_current_variables>" }]; };',
    'window.$ = function(fn) { if (typeof fn === "function") { if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", fn); } else { fn(); } } };',
    scriptClose,
  ].join('');
  return body.replace('</head>', `${mock}</head>`);
});
const babyPlanTitle = computed(() => {
  if (babyHasGeneratedOutput.value) return '先检查，再写入';
  if (workshopStore.selectedTask.id === 'worldview.write') return '先聊天，再整理';
  return '先填表，再生成';
});
const babyPlanCopy = computed(() => {
  if (babyHasGeneratedOutput.value) {
    return '我已经把内容准备好了。先点检查，通过后再写入酒馆；路径和代码细节会由前端自己处理。';
  }
  if (workshopStore.selectedTask.id === 'worldview.write') {
    return '世界观可以先聊出来。右边问秋青子，聊到满意后把最终稿放回工作台整理。';
  }
  return '先按左侧任务和中间表单填写。遇到不会写的地方，直接问右边的秋青子。';
});

function isMobileFoldOpen(section: MobileFoldSection) {
  return !effectiveIsMobile.value || mobileFoldOpen.value[section];
}

function toggleMobileFold(section: MobileFoldSection) {
  if (!effectiveIsMobile.value) return;
  mobileFoldOpen.value[section] = !mobileFoldOpen.value[section];
}

watch(
  () => workshopStore.generatedArtifacts.map(artifact => artifact.id).join('|'),
  () => {
    activeArtifactId.value = workshopStore.generatedArtifacts[0]?.id ?? '';
  },
);

watch(isBabyAssistantFloating, next => {
  if (!next) {
    if (rightFloatingAnchorTimer) {
      window.clearTimeout(rightFloatingAnchorTimer);
      rightFloatingAnchorTimer = null;
    }
    if (rightFloatingDrag.value) {
      cleanupRightFloatingDrag(rightFloatingDrag.value);
      rightFloatingDrag.value = null;
    }
    rightFloatingSuppressClick.value = false;
    return;
  }
  rightFloatingExpanded.value = false;
  nextTick(() => {
    resetRightFloatingPosition();
    scheduleRightFloatingAnchorRefresh();
  });
});

onMounted(() => {
  nextTick(() => {
    syncRightFloatingViewportListeners(false);
    syncRightFloatingViewportListeners(true);
    handleRightFloatingResize();
  });
});

onUnmounted(() => {
  syncRightFloatingViewportListeners(false);
  if (rightFloatingAnchorTimer) {
    window.clearTimeout(rightFloatingAnchorTimer);
    rightFloatingAnchorTimer = null;
  }
  if (rightFloatingDrag.value) {
    cleanupRightFloatingDrag(rightFloatingDrag.value);
    rightFloatingDrag.value = null;
  }
});

async function activateSelectedTaskPrompt(showToast = false) {
  const activatedNames = await presetStore.activateWriteMode(workshopStore.selectedTaskPresetRefs);
  if (!showToast) return;

  if (activatedNames.length) {
    toastr.success(`已切换预设条目：${activatedNames.map(name => name.replace(/^[^\p{L}\p{N}]+/u, '').trim() || name).join('、')}`);
  } else {
    toastr.warning('没有找到对应的任务条目，已保留核心预设不变');
  }
}

async function selectMode(mode: WorkshopMode) {
  workshopStore.selectMode(mode);
  if (effectiveIsMobile.value) {
    mobileFoldOpen.value = { mode: true, tasks: true, brief: false, next: false };
  }
  await activateSelectedTaskPrompt();
}

async function selectTask(taskId: string) {
  workshopStore.selectTask(taskId);
  await activateSelectedTaskPrompt(true);
}

function selectArtifact(id: string) {
  activeArtifactId.value = id;
}

function taskIntro(task: TaskDefinition) {
  return isBabyMode.value ? task.babySummary ?? babyTaskIntros[task.id] ?? task.summary : task.summary;
}

function buildLineDiff(previous: string, current: string, maxLines: number) {
  const before = previous.split(/\r?\n/);
  const after = current.split(/\r?\n/);
  const max = Math.max(before.length, after.length);
  const lines: string[] = [];
  for (let index = 0; index < max; index += 1) {
    if (before[index] === after[index]) continue;
    if (before[index] !== undefined) lines.push(`- ${before[index]}`);
    if (after[index] !== undefined) lines.push(`+ ${after[index]}`);
    if (lines.length >= maxLines) {
      lines.push(`... diff 已截断，剩余约 ${Math.max(0, max - index - 1)} 行`);
      break;
    }
  }
  return lines.length ? lines.join('\n') : '无内容差异';
}

function markBabyField(fieldId: string, value = '') {
  if (!isBabyMode.value) return;
  workshopStore.setBabyField(fieldId, value);
}

function clearGeneratedOutput() {
  workshopStore.clearGeneratedOutput();
  toastr.info('已清空前端生成预览');
}

function materializeWritePlanFromArtifacts() {
  if (workshopStore.generatedWritePlan.length || !workshopStore.generatedArtifacts.length) return false;
  const operations: WorkshopWriteOperation[] = workshopStore.generatedArtifacts.map((artifact, index) => ({
    id: `plan-write-${Date.now()}-${index}`,
    tool: 'Write',
    summary: `写入「${artifact.title}」`,
    targetPath: artifact.targetPath,
    riskLevel: artifact.riskLevel,
    artifactId: artifact.id,
  }));
  workshopStore.setGeneratedOutput([...workshopStore.generatedArtifacts], operations);
  return true;
}

async function openWritePanel() {
  const filled = materializeWritePlanFromArtifacts();
  if (!workshopStore.generatedArtifacts.length && !workshopStore.generatedWritePlan.length) {
    toastr.warning('当前还没有可写入产物，请先让计划节点输出 ArtifactDelta');
  } else if (filled) {
    toastr.info('已根据产物路径补全写入动作，请先 Dryrun 预检');
  }
  await nextTick();
  writePanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function planErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function dryrunGeneratedPlan() {
  if (!workshopStore.generatedWritePlan.length) {
    toastr.warning('请先生成待确认写入动作');
    return;
  }
  if (hasUnfinishedPlan.value) {
    toastr.info('计划尚未完成；本次仅对当前产物工作区做预检。');
  }
  workshopStore.setExecutionState('dryrun', []);
  try {
    const records = await dryrunWorkshopPlan(workshopStore.generatedArtifacts, workshopStore.generatedWritePlan);
    const blocked = records.filter(record => record.status === 'blocked').length;
    workshopStore.setExecutionState(blocked ? 'failed' : 'ready', records);
    if (blocked) {
      toastr.error(`预检发现 ${blocked} 个阻塞点`);
    } else {
      toastr.success('预检通过，可以确认执行');
    }
  } catch (error) {
    workshopStore.setExecutionState('failed', []);
    toastr.error(`预检失败：${planErrorMessage(error)}`);
  }
}

async function applyGeneratedPlan() {
  if (!workshopStore.canApplyGeneratedPlan) {
    toastr.warning('请先通过 dryrun 预检');
    return;
  }
  if (hasUnfinishedPlan.value) {
    toastr.info('计划尚未完成；仍会按当前产物工作区执行写入。');
  }
  workshopStore.setExecutionState('applying', workshopStore.executionRecords);
  try {
    const records = await applyWorkshopPlan(workshopStore.generatedArtifacts, workshopStore.generatedWritePlan);
    const failed = records.some(record => record.status === 'failed' || record.status === 'blocked');
    workshopStore.setExecutionState(failed ? 'failed' : 'applied', records);
    if (failed) {
      toastr.error('执行中断，请查看失败项');
    } else {
      toastr.success('写入计划执行完成');
    }
  } catch (error) {
    workshopStore.setExecutionState('failed', workshopStore.executionRecords);
    toastr.error(`执行失败：${planErrorMessage(error)}`);
  }
}

async function preparePrompt() {
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildTaskPrompt(props.currentCharName);
  toastr.success('任务指令已放入聊天框');
}

async function sendPrompt() {
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildTaskPrompt(props.currentCharName);
  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  }
}

async function draftPlan() {
  if (workshopStore.mode === 'baby') return;
  await activateSelectedTaskPrompt(true);
  chatStore.inputText = workshopStore.buildPlanDraftPrompt(props.currentCharName);
  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  } else {
    toastr.info('等待秋青子返回计划草稿 v2');
  }
}

</script>

<template>
  <div class="workshop-root" :class="{ mobile: effectiveIsMobile }">
    <section class="workshop-command">
      <div class="workshop-command-main">
        <div class="workshop-kicker">明月秋青</div>
        <h1>{{ isBabyMode ? '宝宝辅食写卡页' : '三模式写卡工作台' }}</h1>
        <p v-if="!isBabyMode">
          预设负责判断和陪写，前端负责硬约束，LTC/WTC 负责读写酒馆。
        </p>
        <p v-else>
          按格子慢慢填，不懂就问右边的秋青子；检查和写入交给工具处理。
        </p>
      </div>

      <div class="workshop-status">
        <div>
          <span>当前角色</span>
          <strong>{{ currentCharName || '未选择' }}</strong>
        </div>
        <div>
          <span>当前模式</span>
          <strong>{{ workshopStore.activeMode.shortTitle }}</strong>
        </div>
        <div>
          <span>工具记录</span>
          <strong>{{ activityStore.operations.length }}</strong>
        </div>
      </div>
    </section>

    <div class="workshop-grid">
      <aside class="workshop-left">
        <section class="workshop-section mobile-fold-section" :class="{ 'mobile-open': isMobileFoldOpen('mode') }">
          <button
            class="workshop-section-title mobile-fold-toggle"
            type="button"
            :aria-expanded="isMobileFoldOpen('mode')"
            @click="toggleMobileFold('mode')"
          >
            <span>
              <strong>模式</strong>
              <small>{{ workshopStore.activeMode.shortTitle }}</small>
            </span>
            <SvgIcons name="chevron-down" :size="14" />
          </button>

          <div v-show="isMobileFoldOpen('mode')" class="mobile-fold-body">
            <button
              v-for="mode in modeOrder"
              :key="mode"
              class="mode-row"
              :class="{ active: workshopStore.mode === mode }"
              @click="selectMode(mode)"
            >
              <span class="mode-dot" />
              <span>
                <strong>{{ workshopStore.modes.find(item => item.id === mode)?.shortTitle }}</strong>
                <small>{{ workshopStore.modes.find(item => item.id === mode)?.summary }}</small>
              </span>
            </button>
          </div>
        </section>

        <section
          class="workshop-section task-list-section mobile-fold-section"
          :class="{ 'mobile-open': isMobileFoldOpen('tasks') }"
        >
          <button
            class="workshop-section-title mobile-fold-toggle"
            type="button"
            :aria-expanded="isMobileFoldOpen('tasks')"
            @click="toggleMobileFold('tasks')"
          >
            <span>
              <strong>任务</strong>
              <small>{{ workshopStore.selectedTask.title }}</small>
            </span>
            <SvgIcons name="chevron-down" :size="14" />
          </button>

          <div v-show="isMobileFoldOpen('tasks')" class="mobile-fold-body">
            <button
              v-for="task in workshopStore.availableTasks"
              :key="task.id"
              class="task-row"
              :class="{ active: workshopStore.selectedTask.id === task.id }"
              @click="selectTask(task.id)"
            >
              <span class="task-category">{{ task.category }}</span>
              <strong>{{ task.title }}</strong>
              <small>{{ taskIntro(task) }}</small>
            </button>
          </div>
        </section>
      </aside>

      <main class="workshop-main">
        <section class="task-brief mobile-fold-section" :class="{ 'mobile-open': isMobileFoldOpen('brief') }">
          <button
            class="workshop-section-title mobile-fold-toggle task-brief-toggle"
            type="button"
            :aria-expanded="isMobileFoldOpen('brief')"
            @click="toggleMobileFold('brief')"
          >
            <span>
              <strong>{{ workshopStore.selectedTask.category }} / {{ modeTone }}</strong>
              <small>{{ workshopStore.selectedTask.title }}</small>
            </span>
            <SvgIcons name="chevron-down" :size="14" />
          </button>

          <div v-show="isMobileFoldOpen('brief')" class="mobile-fold-body task-brief-body">
            <div class="task-brief-head">
              <div>
                <div class="workshop-kicker">{{ workshopStore.selectedTask.category }} / {{ modeTone }}</div>
                <h2>{{ workshopStore.selectedTask.title }}</h2>
              </div>
              <button class="expert-link" @click="emit('openExpert')">
                <SvgIcons name="sidebar" :size="15" />
                专家工作区
              </button>
            </div>

          <p class="task-summary">{{ displayedTaskSummary }}</p>

          <div class="task-inputs">
            <label v-if="showTargetInput">
              <span>{{ targetInputLabel }}</span>
              <input
                v-model="workshopStore.draft.targetName"
                type="text"
                :placeholder="targetInputPlaceholder"
                @focus="markBabyField(babyTargetFieldId, workshopStore.draft.targetName)"
                @input="markBabyField(babyTargetFieldId, workshopStore.draft.targetName)"
              >
            </label>
            <label>
              <span>{{ notesInputLabel }}</span>
              <textarea
                v-model="workshopStore.draft.userNotes"
                rows="5"
                :placeholder="notesInputPlaceholder"
                @focus="markBabyField('notes.freeform', workshopStore.draft.userNotes)"
                @input="markBabyField('notes.freeform', workshopStore.draft.userNotes)"
              />
            </label>
          </div>

          <BabyWizard v-if="workshopStore.mode === 'baby'" />

          <PlanModePanel
            v-if="workshopStore.mode !== 'baby'"
            :task="workshopStore.selectedTask"
            :target-name="workshopStore.draft.targetName || currentCharName || ''"
            :user-goal="workshopStore.draft.userNotes"
            :can-draft="Boolean(workshopStore.draft.userNotes.trim() || workshopStore.draft.targetName.trim() || currentCharName)"
            @draft="draftPlan"
            @open-write-panel="openWritePanel"
          />

          <section v-if="activeArtifact && !isBabyMode" class="artifact-panel">
            <div class="artifact-head">
              <div>
                <div class="mini-title">生成产物预览</div>
                <h3>{{ workshopStore.generatedSummary }}</h3>
              </div>
              <button class="secondary-action compact" @click="clearGeneratedOutput">
                <SvgIcons name="trash" :size="13" />
                清空
              </button>
            </div>

            <div class="artifact-tabs">
              <button
                v-for="artifact in workshopStore.generatedArtifacts"
                :key="artifact.id"
                :class="{ active: activeArtifact?.id === artifact.id }"
                @click="selectArtifact(artifact.id)"
              >
                <span>{{ artifact.contentType }}</span>
                {{ artifact.title }}
              </button>
            </div>

            <div class="artifact-meta">
              <span>{{ activeArtifact.targetPath }}</span>
              <strong>{{ activeArtifact.riskLevel }}</strong>
            </div>
            <pre>{{ activeArtifact.content }}</pre>
            <div class="artifact-diff">
              <div class="mini-title">相对上一版本 diff</div>
              <pre>{{ activeArtifactDiff }}</pre>
            </div>
          </section>

          <section v-if="babyHasGeneratedOutput" class="baby-result-panel">
            <div class="mini-title">已经整理好</div>
            <ul>
              <li v-for="artifact in workshopStore.generatedArtifacts" :key="artifact.id">
                <SvgIcons name="check" :size="13" />
                <span>{{ artifact.title }}</span>
              </li>
            </ul>
          </section>

          <section v-if="babyPreviewSrcdoc" class="baby-preview-panel">
            <div class="mini-title">页面预览</div>
            <iframe title="前端预览" :srcdoc="babyPreviewSrcdoc" />
          </section>

          <div v-if="!isBabyMode" class="task-columns">
            <section>
              <div class="mini-title">第一步</div>
              <p>{{ displayedFirstAction }}</p>
            </section>
            <section>
              <div class="mini-title">产物</div>
              <ul>
                <li v-for="output in displayedOutputs" :key="output">{{ output }}</li>
              </ul>
            </section>
          </div>

          <div v-if="!isBabyMode" class="knowledge-band">
            <div class="mini-title">知识引用</div>
            <div class="ref-list">
              <span v-for="ref in workshopStore.selectedTask.knowledgeRefs" :key="ref">{{ ref }}</span>
            </div>
          </div>

          <div v-if="!isBabyMode" class="guardrail-band">
            <div class="mini-title">硬边界</div>
            <ul>
              <li v-for="item in workshopStore.selectedTask.guardrails" :key="item">{{ item }}</li>
            </ul>
          </div>
          </div>
        </section>

        <section
          v-if="!isBabyMode"
          ref="writePanelRef"
          class="plan-panel mobile-fold-section"
          :class="{ 'mobile-open': isMobileFoldOpen('next') }"
        >
          <button
            class="workshop-section-title mobile-fold-toggle"
            type="button"
            :aria-expanded="isMobileFoldOpen('next')"
            @click="toggleMobileFold('next')"
          >
            <span>
              <strong>写入计划</strong>
              <small>{{ writeRiskLabel }}</small>
            </span>
            <SvgIcons name="chevron-down" :size="14" />
          </button>

          <div v-show="isMobileFoldOpen('next')" class="mobile-fold-body plan-fold-body">
            <div class="plan-head">
              <div>
                <div class="workshop-kicker">写入计划预览</div>
                <h3>{{ writeRiskLabel }}</h3>
              </div>
              <span>{{ workshopStore.selectedTask.writePlan.length }} 步</span>
            </div>

          <ol>
            <li v-for="step in workshopStore.selectedTask.writePlan" :key="step">{{ step }}</li>
          </ol>

          <div v-if="workshopStore.generatedWritePlan.length" class="generated-plan">
            <div class="mini-title">待确认写入动作</div>
            <ul>
              <li v-for="operation in workshopStore.generatedWritePlan" :key="operation.id">
                <strong>{{ operation.tool }}</strong>
                <span>{{ operation.targetPath }}</span>
                <small>{{ operation.summary }}</small>
              </li>
            </ul>
          </div>

          <div v-if="workshopStore.generatedWritePlan.length" class="execution-actions">
            <button
              class="secondary-action"
              :disabled="workshopStore.executionPhase === 'dryrun' || workshopStore.executionPhase === 'applying'"
              @click="dryrunGeneratedPlan"
            >
              <SvgIcons name="search" :size="14" />
              {{ workshopStore.executionPhase === 'dryrun' ? '预检中' : 'Dryrun 预检' }}
            </button>
            <button
              class="primary-action"
              :disabled="!workshopStore.canApplyGeneratedPlan || workshopStore.executionPhase === 'applying'"
              @click="applyGeneratedPlan"
            >
              <SvgIcons name="check" :size="14" />
              {{ workshopStore.executionPhase === 'applying' ? '执行中' : '确认执行' }}
            </button>
          </div>

          <p v-if="workshopStore.generatedWritePlan.length && hasUnfinishedPlan" class="plan-unfinished-note">
            计划尚未完成：可以手动 Dryrun / 确认执行当前工作区，但建议在计划收尾后再正式写入。
          </p>

          <div v-if="workshopStore.executionRecords.length" class="execution-records">
            <div class="mini-title">执行检查</div>
            <ul>
              <li
                v-for="record in workshopStore.executionRecords"
                :key="record.id"
                :class="`status-${record.status}`"
              >
                <strong>{{ record.status }}</strong>
                <span>{{ record.title }}</span>
                <small>{{ record.targetPath || record.detail }}</small>
                <em v-if="record.targetPath">{{ record.detail }}</em>
              </li>
            </ul>
          </div>

          <div class="plan-actions">
            <button class="secondary-action" @click="preparePrompt">
              <SvgIcons name="edit" :size="14" />
              放入聊天框
            </button>
            <button class="primary-action" :disabled="chatStore.isSending" @click="sendPrompt">
              <SvgIcons name="send" :size="14" />
              {{ chatStore.isSending ? '发送中' : '发送给秋青子' }}
            </button>
          </div>
          </div>
        </section>

        <section
          v-else
          class="plan-panel baby-plan-panel mobile-fold-section"
          :class="{ 'mobile-open': isMobileFoldOpen('next') }"
        >
          <button
            class="workshop-section-title mobile-fold-toggle"
            type="button"
            :aria-expanded="isMobileFoldOpen('next')"
            @click="toggleMobileFold('next')"
          >
            <span>
              <strong>下一步</strong>
              <small>{{ babyPlanTitle }}</small>
            </span>
            <SvgIcons name="chevron-down" :size="14" />
          </button>

          <div v-show="isMobileFoldOpen('next')" class="mobile-fold-body plan-fold-body">
            <div class="plan-head">
              <div>
                <div class="workshop-kicker">下一步</div>
                <h3>{{ babyPlanTitle }}</h3>
              </div>
              <span>{{ babyHasGeneratedOutput ? `${workshopStore.generatedArtifacts.length} 项` : '待生成' }}</span>
            </div>

          <p class="baby-plan-copy">{{ babyPlanCopy }}</p>

          <ul v-if="babyHasGeneratedOutput" class="baby-ready-list">
            <li v-for="artifact in workshopStore.generatedArtifacts" :key="artifact.id">
              <SvgIcons name="check" :size="13" />
              <span>{{ artifact.title }}</span>
            </li>
          </ul>

          <div v-if="workshopStore.generatedWritePlan.length" class="execution-actions">
            <button
              class="secondary-action"
              :disabled="workshopStore.executionPhase === 'dryrun' || workshopStore.executionPhase === 'applying'"
              @click="dryrunGeneratedPlan"
            >
              <SvgIcons name="search" :size="14" />
              {{ workshopStore.executionPhase === 'dryrun' ? '检查中' : '先帮我检查' }}
            </button>
            <button
              class="primary-action"
              :disabled="!workshopStore.canApplyGeneratedPlan || workshopStore.executionPhase === 'applying'"
              @click="applyGeneratedPlan"
            >
              <SvgIcons name="check" :size="14" />
              {{ workshopStore.executionPhase === 'applying' ? '写入中' : '写入酒馆' }}
            </button>
          </div>

          <div v-if="workshopStore.executionRecords.length" class="execution-records baby-records">
            <div class="mini-title">检查结果</div>
            <ul>
              <li
                v-for="record in workshopStore.executionRecords"
                :key="record.id"
                :class="`status-${record.status}`"
              >
                <strong>{{ record.status }}</strong>
                <span>{{ record.title }}</span>
                <small>{{ record.status === 'blocked' || record.status === 'failed' ? '这一项需要先修一下' : '这一项可以继续' }}</small>
              </li>
            </ul>
          </div>

          <div class="plan-actions">
            <button class="secondary-action" @click="preparePrompt">
              <SvgIcons name="edit" :size="14" />
              放到聊天框
            </button>
            <button class="primary-action" :disabled="chatStore.isSending" @click="sendPrompt">
              <SvgIcons name="send" :size="14" />
              {{ chatStore.isSending ? '发送中' : '问秋青子下一步' }}
            </button>
          </div>
          </div>
        </section>

        <section v-if="showMobileBabyChatPanel" class="mobile-baby-chat-panel">
          <ChatPanel
            :streaming-content="streamingContent"
            :mobile-input-mode="effectiveIsMobile"
            @send-start="emit('sendStart')"
            @send-failed="emit('sendFailed')"
          />
        </section>
      </main>

      <aside
        v-if="showWorkshopRightPanel"
        ref="rightFloatingShellRef"
        class="workshop-right"
        :class="{
          'baby-right': isBabyMode,
          'is-floating-shell': isBabyAssistantFloating,
          'is-collapsed-shell': isBabyAssistantFloating && !rightFloatingExpanded,
          'is-dragging-shell': Boolean(rightFloatingDrag),
        }"
        :style="rightFloatingStyle"
      >
        <button
          v-if="isBabyAssistantFloating && !rightFloatingExpanded"
          class="workshop-right-float-button"
          type="button"
          aria-label="展开秋青子助手"
          :aria-expanded="rightFloatingExpanded"
          @click="expandRightFloatingShell"
          @pointerdown="startRightFloatingDrag"
        >
          <img :src="qiuqingziChibi" alt="" />
          <span>秋青子</span>
        </button>

        <template v-else>
          <div
            v-if="isBabyAssistantFloating"
            class="workshop-right-float-head"
            @pointerdown="startRightFloatingDrag"
          >
            <div class="workshop-right-float-title">
              <img :src="qiuqingziChibi" alt="" />
              <span>
                <strong>秋青子</strong>
                <small>拖动整块助手窗</small>
              </span>
            </div>
            <button type="button" aria-label="收起秋青子助手" @click="collapseRightFloatingShell">
              <SvgIcons name="x" :size="14" />
            </button>
          </div>
          <BabyAssistantPanel
            v-if="isBabyMode"
            :current-char-name="currentCharName"
            :is-mobile="isBabyAssistantFloating ? false : effectiveIsMobile"
            @send-start="emit('sendStart')"
            @send-failed="emit('sendFailed')"
          />
          <div v-if="!showMobileBabyChatPanel" class="chat-wrap" :class="{ 'baby-chat-wrap': isBabyMode }">
            <ChatPanel
              :streaming-content="streamingContent"
              :mobile-input-mode="effectiveIsMobile"
              @send-start="emit('sendStart')"
              @send-failed="emit('sendFailed')"
            />
          </div>
          <div v-if="!isBabyMode" class="activity-wrap">
            <ActivityPanel />
          </div>
        </template>
      </aside>
    </div>

    <section v-if="showMobileStandardChatPanel" class="chat-wrap mobile-standard-chat-panel">
      <ChatPanel
        :streaming-content="streamingContent"
        :mobile-input-mode="effectiveIsMobile"
        @send-start="emit('sendStart')"
        @send-failed="emit('sendFailed')"
      />
    </section>

    <section class="workshop-bottom">
      <div v-for="(count, category) in categoryCounts" :key="category">
        <span>{{ category }}</span>
        <strong>{{ count }}</strong>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workshop-root {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  overflow: hidden;
  background: var(--ide-bg);
}

.workshop-command {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-height: 78px;
  padding: 14px clamp(174px, 26vw, 308px) 14px 16px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
  flex-shrink: 0;
}

.workshop-command-main {
  flex: 1;
  min-width: 0;
}

.workshop-kicker,
.mini-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ide-dim-3);
  text-transform: uppercase;
}

.workshop-command h1,
.task-brief h2,
.plan-head h3 {
  margin: 3px 0 0;
  font-size: 20px;
  line-height: 1.2;
  color: var(--ide-text);
}

.workshop-command p,
.task-summary {
  margin: 7px 0 0;
  color: var(--ide-dim);
  line-height: 1.55;
}

.workshop-status {
  position: absolute;
  top: 12px;
  right: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: clamp(150px, 24vw, 280px);
  min-width: 0;
  gap: 6px;
}

.workshop-status div,
.workshop-section,
.task-brief,
.plan-panel,
.chat-wrap,
.activity-wrap,
.workshop-bottom div {
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.workshop-status div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 0;
  gap: 2px;
  padding: 6px 8px;
}

.workshop-status div:nth-child(3) {
  display: none;
}

.workshop-status span,
.workshop-bottom span {
  color: var(--ide-dim-3);
  font-size: 10px;
}

.workshop-status strong,
.workshop-bottom strong {
  color: var(--ide-text);
  font-size: 12px;
}

.workshop-status strong {
  overflow: hidden;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workshop-grid {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: clamp(210px, 12vw, 260px) minmax(620px, 1fr) clamp(360px, 24vw, 520px);
  gap: 14px;
}

.workshop-left,
.workshop-main,
.workshop-right {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.workshop-section {
  min-height: 0;
  padding: 10px;
  overflow: hidden;
}

.task-list-section {
  flex: 1;
  overflow-y: auto;
}

.workshop-section-title {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ide-dim-2);
}

.mobile-fold-toggle {
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0;
  text-align: left;
  cursor: default;
  pointer-events: none;
}

.mobile-fold-toggle > span {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.mobile-fold-toggle small,
.mobile-fold-toggle svg {
  display: none;
}

.mobile-fold-body {
  min-width: 0;
}

.mode-row,
.task-row {
  width: 100%;
  display: flex;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ide-dim);
  cursor: pointer;
  text-align: left;
}

.mode-row {
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 8px;
}

.mode-row:hover,
.task-row:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.mode-row.active,
.task-row.active {
  border-color: var(--ide-accent-border);
  background: var(--ide-accent-soft);
  color: var(--ide-text);
}

.mode-dot {
  width: 9px;
  height: 9px;
  margin-top: 5px;
  border-radius: 999px;
  background: var(--ide-success-text);
  flex-shrink: 0;
}

.mode-row span:last-child,
.task-row {
  min-width: 0;
}

.mode-row strong,
.task-row strong {
  display: block;
  font-size: 13px;
  color: inherit;
}

.mode-row small,
.task-row small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--ide-dim-2);
}

.task-row {
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 8px;
}

.task-category {
  width: fit-content;
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--ide-info-text);
  background: var(--ide-info-soft);
  font-size: 11px;
  font-weight: 700;
}

.task-brief {
  min-height: 0;
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.task-brief-head,
.plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.expert-link,
.secondary-action,
.primary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.expert-link,
.secondary-action {
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-dim);
}

.expert-link:hover,
.secondary-action:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.expert-link {
  padding: 0 10px;
  flex-shrink: 0;
}

.task-inputs {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
}

.task-inputs label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 700;
}

.task-inputs input,
.task-inputs textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--ide-input-border);
  border-radius: 7px;
  background: var(--ide-input-bg);
  color: var(--ide-text);
  padding: 10px 11px;
  font: inherit;
  line-height: 1.5;
  outline: none;
}

.task-inputs textarea {
  min-height: 116px;
  resize: vertical;
}

.task-inputs input:focus,
.task-inputs textarea:focus {
  border-color: var(--ide-accent-border-strong);
}

.artifact-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-accent-border);
  border-radius: 8px;
  background: var(--ide-accent-soft);
}

.artifact-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.artifact-head h3 {
  margin: 3px 0 0;
  color: var(--ide-text);
  font-size: 15px;
}

.secondary-action.compact {
  min-height: 28px;
  padding: 0 8px;
  font-size: 12px;
}

.artifact-tabs {
  display: flex;
  gap: 7px;
  margin-top: 10px;
  overflow-x: auto;
}

.artifact-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 9px;
  border: 1px solid var(--ide-border);
  border-radius: 6px;
  background: var(--ide-bg2);
  color: var(--ide-dim);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.artifact-tabs button.active {
  border-color: var(--ide-success-border-strong);
  color: var(--ide-text);
  background: var(--ide-success-soft);
}

.artifact-tabs span {
  color: var(--ide-info-text);
  text-transform: uppercase;
}

.artifact-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  color: var(--ide-dim-2);
  font-size: 12px;
}

.artifact-meta span {
  overflow-wrap: anywhere;
}

.artifact-meta strong {
  flex-shrink: 0;
  color: var(--ide-success-text);
}

.artifact-panel pre {
  max-height: 300px;
  margin: 9px 0 0;
  padding: 11px;
  overflow: auto;
  border: 1px solid var(--ide-border);
  border-radius: 7px;
  background: var(--ide-input-bg);
  color: var(--ide-text);
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.artifact-diff {
  margin-top: 10px;
}

.artifact-diff pre {
  max-height: 220px;
  border-color: var(--ide-success-border);
  background: var(--ide-code-bg);
}

.baby-result-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-success-border);
  border-radius: 8px;
  background: var(--ide-success-soft);
}

.baby-result-panel ul,
.baby-ready-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin: 9px 0 0;
  padding: 0;
  list-style: none;
}

.baby-result-panel li,
.baby-ready-list li {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--ide-dim);
  font-size: 12px;
  line-height: 1.4;
}

.baby-result-panel svg,
.baby-ready-list svg {
  flex-shrink: 0;
  color: var(--ide-success-text);
}

.baby-preview-panel {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg2);
}

.baby-preview-panel iframe {
  display: block;
  width: 100%;
  min-height: 210px;
  margin-top: 9px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: #fff;
}

.task-columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  margin-top: 14px;
}

.task-columns section,
.knowledge-band,
.guardrail-band {
  padding: 12px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-surface);
}

.task-columns p {
  margin: 6px 0 0;
  color: var(--ide-dim);
  line-height: 1.55;
}

.task-columns ul,
.guardrail-band ul,
.plan-panel ol {
  margin: 8px 0 0;
  padding-left: 18px;
  color: var(--ide-dim);
  line-height: 1.55;
}

.knowledge-band,
.guardrail-band {
  margin-top: 12px;
}

.ref-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
}

.ref-list span {
  max-width: 100%;
  padding: 5px 7px;
  border-radius: 5px;
  background: var(--ide-tag-bg);
  color: var(--ide-tag-text);
  font-size: 12px;
  overflow-wrap: anywhere;
}

.plan-panel {
  padding: 14px;
  flex-shrink: 0;
}

.baby-plan-panel {
  border-color: var(--ide-success-border);
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ide-success-text) 7%, transparent), transparent 80%),
    var(--ide-bg2);
}

.baby-plan-copy {
  margin: 10px 0 0;
  color: var(--ide-dim);
  font-size: 13px;
  line-height: 1.55;
}

.plan-unfinished-note {
  margin: 9px 0 0;
  color: var(--ide-warning-text);
  font-size: 12px;
  line-height: 1.5;
}

.plan-head h3 {
  font-size: 15px;
}

.plan-head > span {
  padding: 3px 8px;
  border-radius: 5px;
  color: var(--ide-success-text);
  background: var(--ide-success-soft);
  font-size: 12px;
  font-weight: 700;
}

.generated-plan {
  margin-top: 11px;
  padding: 10px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-surface);
}

.generated-plan ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.generated-plan li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 4px 8px;
  color: var(--ide-dim);
  font-size: 12px;
}

.generated-plan strong {
  color: var(--ide-info-text);
}

.generated-plan span {
  overflow-wrap: anywhere;
}

.generated-plan small {
  grid-column: 2;
  color: var(--ide-dim-2);
  line-height: 1.4;
}

.execution-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.execution-records {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  background: var(--ide-bg);
}

.execution-records ul {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
}

.execution-records li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 3px 8px;
  padding: 7px 8px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 7px;
  color: var(--ide-dim);
  background: var(--ide-surface);
  font-size: 12px;
}

.execution-records strong {
  color: var(--ide-info-text);
  text-transform: uppercase;
}

.execution-records span,
.execution-records small,
.execution-records em {
  overflow-wrap: anywhere;
}

.execution-records small,
.execution-records em {
  grid-column: 2;
  color: var(--ide-dim-2);
  font-style: normal;
  line-height: 1.4;
}

.baby-records small {
  grid-column: 2;
}

.execution-records .status-ok strong,
.execution-records .status-applied strong {
  color: var(--ide-success-text);
}

.execution-records .status-warning strong {
  color: var(--ide-warning-text);
}

.execution-records .status-blocked strong,
.execution-records .status-failed strong {
  color: var(--ide-danger-text);
}

.execution-records .status-skipped strong {
  color: var(--ide-dim-3);
}

.plan-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.primary-action {
  border: 1px solid var(--ide-success-border);
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
}

.primary-action:hover:not(:disabled) {
  background: var(--ide-success-soft-strong);
}

.primary-action:disabled {
  opacity: 0.6;
  cursor: wait;
}

.workshop-right {
  min-width: 0;
}

.workshop-right.baby-right {
  gap: 10px;
}

.workshop-right.is-floating-shell {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 68;
  width: min(380px, calc(100vw - 24px));
  max-height: min(760px, calc(100vh - 36px));
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--ide-accent) 24%, var(--ide-border));
  border-radius: 18px;
  background: color-mix(in srgb, var(--ide-bg2) 94%, white 6%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.24);
  overflow: hidden auto;
  will-change: transform;
}

.workshop-right.is-floating-shell.is-collapsed-shell {
  width: 76px;
  height: 92px;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.workshop-right.is-dragging-shell {
  user-select: none;
}

.workshop-right-float-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 76px;
  height: 92px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--ide-accent) 62%, var(--ide-border));
  border-radius: 24px;
  background:
    radial-gradient(circle at 58% 18%, rgba(255, 255, 255, 0.8), transparent 24px),
    color-mix(in srgb, var(--ide-bg2) 90%, var(--ide-accent));
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.28);
  cursor: grab;
  touch-action: none;
}

.workshop-right-float-button:active {
  cursor: grabbing;
}

.workshop-right-float-button img {
  display: block;
  width: 58px;
  height: 74px;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.28));
}

.workshop-right-float-button span {
  position: absolute;
  right: -4px;
  bottom: 6px;
  padding: 2px 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--ide-accent) 82%, var(--ide-bg2));
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.22);
}

.workshop-right-float-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
  margin: -2px -2px 2px;
  padding: 6px 6px 8px;
  border-bottom: 1px solid var(--ide-border);
  cursor: grab;
  touch-action: none;
}

.workshop-right-float-head:active {
  cursor: grabbing;
}

.workshop-right-float-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.workshop-right-float-title img {
  width: 32px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 5px 9px rgba(0, 0, 0, 0.24));
}

.workshop-right-float-title span {
  display: grid;
  gap: 2px;
}

.workshop-right-float-title strong {
  color: var(--ide-text);
  font-size: 13px;
}

.workshop-right-float-title small {
  color: var(--ide-dim-2);
  font-size: 11px;
}

.workshop-right-float-head > button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background: var(--ide-surface);
  color: var(--ide-text);
  cursor: pointer;
}

.chat-wrap {
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.mobile-baby-chat-panel {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mobile-baby-chat-panel .chat-panel,
.mobile-standard-chat-panel .chat-panel {
  min-height: 0;
  flex: 1;
}

.baby-chat-wrap {
  min-height: 260px;
}

.workshop-right.is-floating-shell .chat-wrap,
.workshop-right.is-floating-shell .baby-chat-wrap {
  min-height: 0;
}

.activity-wrap {
  height: 180px;
  overflow: hidden;
}

.workshop-bottom {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  overflow-x: auto;
}

.workshop-bottom div {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 74px;
  padding: 7px 10px;
}

.workshop-root.mobile {
  gap: 8px;
  padding: 8px 10px;
  overflow-y: auto;
}

@media (min-width: 1280px) {
  .task-inputs {
    grid-template-columns: minmax(220px, 0.4fr) minmax(0, 1fr);
    align-items: start;
  }

  .task-inputs textarea {
    min-height: 74px;
  }
}

@media (min-width: 1600px) {
  .workshop-root {
    padding: 16px 18px;
  }

  .workshop-grid {
    grid-template-columns: clamp(220px, 11vw, 250px) minmax(760px, 1fr) clamp(420px, 25vw, 560px);
  }

  .workshop-command {
    padding-inline: 18px;
  }
}

@media (max-width: 1279px) {
  .workshop-grid {
    grid-template-columns: 220px minmax(0, 1fr) 360px;
  }
}

.mobile .workshop-command,
.mobile .task-brief-head,
.mobile .plan-head,
.mobile .artifact-head {
  flex-direction: column;
}

.mobile .workshop-command {
  display: block;
  gap: 10px;
  min-height: 82px;
  padding: 9px clamp(122px, 34vw, 150px) 9px 11px;
}

.mobile .workshop-command-main {
  min-width: 0;
}

.mobile .workshop-command h1 {
  margin-top: 2px;
  font-size: 18px;
}

.mobile .workshop-command p {
  display: none;
}

.mobile .workshop-status,
.mobile .workshop-grid,
.mobile .task-columns,
.mobile .plan-actions,
.mobile .execution-actions {
  grid-template-columns: 1fr;
}

.mobile .workshop-status {
  display: grid;
  position: absolute;
  top: 9px;
  right: 10px;
  width: clamp(104px, 31vw, 132px);
  gap: 4px;
  min-width: 0;
}

.mobile .workshop-status div {
  min-height: 0;
  gap: 1px;
  padding: 5px 7px;
  border-radius: 7px;
}

.mobile .workshop-status div:nth-child(3) {
  display: none;
}

.mobile .workshop-status span {
  font-size: 9px;
}

.mobile .workshop-status strong {
  overflow: hidden;
  font-size: 11px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile .workshop-grid {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  width: 100%;
  overflow: visible;
}

.mobile .workshop-left {
  display: contents;
}

.mobile .workshop-left,
.mobile .workshop-main,
.mobile .workshop-right,
.mobile .task-brief {
  overflow: visible;
}

.mobile .workshop-right.is-floating-shell {
  max-height: min(560px, calc(100vh - 36px));
  overflow: hidden auto;
}

.mobile .workshop-section,
.mobile .task-brief,
.mobile .plan-panel {
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
}

.mobile .task-list-section {
  flex: 0 0 auto;
  overflow: visible;
}

.mobile .task-list-section > .mobile-fold-body {
  max-height: none;
  overflow: visible;
  padding-right: 4px;
}

.mobile .workshop-section-title {
  margin: 0;
}

.mobile .mobile-fold-toggle {
  min-height: 46px;
  pointer-events: auto;
  cursor: pointer;
  padding: 9px 11px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--ide-bg) 72%, transparent);
  color: var(--ide-text);
}

.mobile .mobile-fold-toggle strong {
  overflow: hidden;
  font-size: 13px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile .mobile-fold-toggle small {
  display: block;
  overflow: hidden;
  color: var(--ide-dim-2);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mobile .mobile-fold-toggle svg {
  display: block;
  flex-shrink: 0;
  color: var(--ide-dim-2);
  transition: transform 0.18s ease;
}

.mobile .mobile-open > .mobile-fold-toggle {
  border-color: var(--ide-accent-border);
  background: var(--ide-accent-soft);
}

.mobile .mobile-open > .mobile-fold-toggle svg {
  transform: rotate(180deg);
}

.mobile .mobile-fold-body {
  display: grid;
  gap: 8px;
  max-height: none;
  margin-top: 8px;
  overflow: visible;
  overscroll-behavior: auto;
  padding-right: 4px;
  scrollbar-gutter: auto;
}

.mobile .mobile-fold-section:not(.mobile-open) > .mobile-fold-body {
  display: none !important;
}

.mobile .task-brief-body,
.mobile .plan-fold-body {
  gap: 12px;
}

.mobile .task-brief-body {
  max-height: none;
}

.mobile .plan-fold-body {
  max-height: none;
}

.mobile .mode-row,
.mobile .task-row {
  padding: 8px;
}

.mobile .mode-row small,
.mobile .task-row small {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.mobile .chat-wrap {
  min-height: 520px;
}

.mobile .baby-chat-wrap {
  min-height: 420px;
}

.mobile .mobile-baby-chat-panel {
  min-height: 440px;
}

.mobile .mobile-standard-chat-panel {
  flex: 0 0 auto;
  width: 100%;
  min-height: 0;
  overflow: visible;
}

.mobile .workshop-bottom {
  display: none;
}
</style>
