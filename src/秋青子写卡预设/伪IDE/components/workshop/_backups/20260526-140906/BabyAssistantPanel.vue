<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useChatStore } from '../../stores/chat';
import { useWorkshopStore } from '../../stores/workshop';
import { usePresetStore } from '../../stores/preset';
import qiuqingziChibi from '../../assets/qiuqingzi-chibi.png?url';
import {
  BABY_KNOWLEDGE_WORLDBOOK,
  buildBabyAssistantPrompt,
  getBabyAssistantRefs,
  getBabyFieldGuide,
  type BabyAssistantIntent,
} from '../../utils/baby-assistant';
import {
  TOKEN_WARNING_LIMIT,
  archiveMessagesBeforeLatest,
  getChatArchiveSummary,
  getChatContextStats,
  type ChatContextStats,
} from '../../utils/chat-archive';

const props = defineProps<{
  currentCharName?: string | null;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  sendStart: [];
  sendFailed: [];
}>();

const chatStore = useChatStore();
const workshopStore = useWorkshopStore();
const presetStore = usePresetStore();

const currentGuide = computed(() => getBabyFieldGuide(workshopStore.babyFieldId));
const contextStats = ref<ChatContextStats>({
  lastMessageId: -1,
  unhiddenCount: 0,
  hiddenCount: 0,
  estimatedTokens: 0,
  archiveCount: 0,
  canArchive: false,
});
const assistantExpanded = ref(false);
const isFloatingViewport = ref(false);
const floatingPanelRef = ref<HTMLElement | null>(null);
const floatingPosition = ref({ x: 0, y: 0 });
const floatingDrag = ref<{
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
const suppressFloatingClick = ref(false);
let floatingAnchorTimer: ReturnType<typeof window.setTimeout> | null = null;

const quickActions: Array<{ intent: BabyAssistantIntent; label: string; icon: string }> = [
  { intent: 'explain', label: '这个框怎么填', icon: 'search' },
  { intent: 'example', label: '给我一个例子', icon: 'edit' },
  { intent: 'check', label: '检查这一项', icon: 'check' },
  { intent: 'question', label: '问我一个问题', icon: 'send' },
];

const contextWarning = computed(() => contextStats.value.estimatedTokens >= TOKEN_WARNING_LIMIT);
const contextTokenLabel = computed(() => {
  const tokens = contextStats.value.estimatedTokens;
  if (tokens >= 10_000) return `${(tokens / 10_000).toFixed(1)}万`;
  return String(tokens);
});
const floatingStyle = computed(() =>
  isFloatingViewport.value
    ? {
        transform: `translate3d(${floatingPosition.value.x}px, ${floatingPosition.value.y}px, 0)`,
      }
    : {},
);

function getFloatingHostWindow() {
  return floatingPanelRef.value?.ownerDocument?.defaultView ?? window;
}

function getFloatingViewportWindow() {
  try {
    if (window.parent && window.parent !== window) {
      return window.parent;
    }
  } catch {
    /* ignore cross-window access failures */
  }
  return getFloatingHostWindow();
}

function getFloatingViewportSize() {
  const frameWindow = getFloatingHostWindow();
  const viewportWindow = getFloatingViewportWindow();
  const frameWidth = frameWindow.visualViewport?.width ?? frameWindow.innerWidth;
  const frameHeight = frameWindow.visualViewport?.height ?? frameWindow.innerHeight;
  const viewportWidth = viewportWindow.visualViewport?.width ?? viewportWindow.innerWidth;
  const viewportHeight = viewportWindow.visualViewport?.height ?? viewportWindow.innerHeight;
  return {
    width: Math.max(320, Math.round(Math.max(frameWidth || 0, viewportWidth || 0))),
    height: Math.max(320, Math.round(Math.max(frameHeight || 0, viewportHeight || 0))),
  };
}

function getFloatingSize() {
  if (assistantExpanded.value) {
    return {
      width: Math.min(380, Math.max(280, getFloatingViewportSize().width - 24)),
      height: Math.min(560, Math.max(360, getFloatingViewportSize().height - 96)),
    };
  }
  return { width: 76, height: 92 };
}

function clampFloatingPosition(next = floatingPosition.value) {
  if (!isFloatingViewport.value) return;
  const safe = 12;
  const rect = floatingPanelRef.value?.getBoundingClientRect();
  const fallback = getFloatingSize();
  const width = rect?.width || fallback.width;
  const height = rect?.height || fallback.height;
  const viewport = getFloatingViewportSize();
  const maxX = Math.max(safe, viewport.width - width - safe);
  const maxY = Math.max(safe, viewport.height - height - safe);
  floatingPosition.value = {
    x: Math.min(Math.max(safe, next.x), maxX),
    y: Math.min(Math.max(safe, next.y), maxY),
  };
}

function resetFloatingPosition() {
  if (!isFloatingViewport.value) return;
  const size = getFloatingSize();
  const viewport = getFloatingViewportSize();
  floatingPosition.value = {
    x: Math.max(12, viewport.width - size.width - 18),
    y: Math.max(12, Math.round(viewport.height * 0.42)),
  };
  nextTick(() => clampFloatingPosition());
}

function scheduleFloatingAnchorRefresh() {
  if (floatingAnchorTimer) {
    window.clearTimeout(floatingAnchorTimer);
  }
  floatingAnchorTimer = window.setTimeout(() => {
    floatingAnchorTimer = null;
    if (!isFloatingViewport.value || floatingDrag.value) return;
    if (floatingPosition.value.x <= 12 && floatingPosition.value.y <= 12) {
      resetFloatingPosition();
      return;
    }
    clampFloatingPosition();
  }, 80);
}

function syncFloatingMode() {
  const shouldFloat = props.isMobile === true;
  if (shouldFloat && !isFloatingViewport.value) {
    isFloatingViewport.value = true;
    assistantExpanded.value = false;
    nextTick(() => {
      resetFloatingPosition();
      scheduleFloatingAnchorRefresh();
    });
    return;
  }
  isFloatingViewport.value = shouldFloat;
  if (shouldFloat) {
    nextTick(() => {
      clampFloatingPosition();
      scheduleFloatingAnchorRefresh();
    });
  }
}

function toggleFloatingPanel() {
  if (suppressFloatingClick.value) {
    suppressFloatingClick.value = false;
    return;
  }
  assistantExpanded.value = !assistantExpanded.value;
}

function cleanupFloatingDrag(drag: NonNullable<typeof floatingDrag.value>) {
  drag.frameWindow.removeEventListener('pointermove', moveFloatingDrag);
  drag.frameWindow.removeEventListener('pointerup', endFloatingDrag);
  drag.frameWindow.removeEventListener('pointercancel', endFloatingDrag);
  if (drag.hostWindow !== drag.frameWindow) {
    drag.hostWindow.removeEventListener('pointermove', moveFloatingDrag);
    drag.hostWindow.removeEventListener('pointerup', endFloatingDrag);
    drag.hostWindow.removeEventListener('pointercancel', endFloatingDrag);
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

function startFloatingDrag(event: PointerEvent) {
  if (!isFloatingViewport.value || event.button !== 0) return;
  const target = event.currentTarget as HTMLElement | null;
  if (!target) return;
  event.preventDefault();
  if (floatingDrag.value) {
    cleanupFloatingDrag(floatingDrag.value);
  }
  const frameWindow = getFloatingHostWindow();
  const hostWindow = getFloatingViewportWindow();
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
  floatingDrag.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: floatingPosition.value.x,
    originY: floatingPosition.value.y,
    moved: false,
    captureTarget: target,
    frameWindow,
    hostWindow,
    frameDocument,
    hostDocument,
    previousFrameUserSelect,
    previousHostUserSelect,
  };
  frameWindow.addEventListener('pointermove', moveFloatingDrag);
  frameWindow.addEventListener('pointerup', endFloatingDrag);
  frameWindow.addEventListener('pointercancel', endFloatingDrag);
  if (hostWindow !== frameWindow) {
    hostWindow.addEventListener('pointermove', moveFloatingDrag);
    hostWindow.addEventListener('pointerup', endFloatingDrag);
    hostWindow.addEventListener('pointercancel', endFloatingDrag);
  }
}

function moveFloatingDrag(event: PointerEvent) {
  const drag = floatingDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 4) {
    drag.moved = true;
    suppressFloatingClick.value = true;
  }
  clampFloatingPosition({
    x: drag.originX + dx,
    y: drag.originY + dy,
  });
}

function endFloatingDrag(event: PointerEvent) {
  const drag = floatingDrag.value;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const moved = drag.moved;
  if (!moved) {
    suppressFloatingClick.value = false;
  } else {
    window.setTimeout(() => {
      suppressFloatingClick.value = false;
    }, 120);
  }
  cleanupFloatingDrag(drag);
  floatingDrag.value = null;
}

function refreshContextStats() {
  try {
    contextStats.value = getChatContextStats();
  } catch (e) {
    console.warn('[IDE] context stats failed:', e);
  }
}

function buildPrompt(intent: BabyAssistantIntent): string {
  return buildBabyAssistantPrompt({
    intent,
    fieldId: currentGuide.value.id,
    task: workshopStore.selectedTask,
    targetName: workshopStore.draft.targetName,
    currentCharacterName: props.currentCharName,
    userNotes: workshopStore.draft.assistantNotes || workshopStore.draft.userNotes,
    currentValue: workshopStore.babyFieldValue,
    generatedSummary: workshopStore.generatedSummary,
  });
}

async function ask(intent: BabyAssistantIntent) {
  const refs = getBabyAssistantRefs(currentGuide.value.id, workshopStore.selectedTask.id);
  await presetStore.activateWriteMode(refs.presetRefs);
  chatStore.inputText = buildPrompt(intent);
  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  }
  setTimeout(refreshContextStats, 800);
}

async function completeTaskAndArchive() {
  refreshContextStats();
  if (!contextStats.value.canArchive) {
    toastr.info('现在没有需要收起的旧聊天。');
    return;
  }

  const confirmed = window.confirm(
    [
      '要把旧聊天收起来吗？',
      '',
      '这不会删除聊天记录，只会把最新楼层之前的可见楼层隐藏起来，并把快照保存到当前聊天变量。',
      '隐藏后的楼层通常不会继续塞进 AI 上下文，可以减少 token。',
      '',
      '如果有还没复制到工作台、还没写进世界书、还想继续让秋青子参考的内容，请先取消，把重要内容保存好。',
    ].join('\n'),
  );
  if (!confirmed) return;

  try {
    const batch = await archiveMessagesBeforeLatest({
      id: workshopStore.selectedTask.id,
      title: workshopStore.selectedTask.title,
      targetName: workshopStore.draft.targetName,
    });
    chatStore.refreshMessages();
    refreshContextStats();
    if (!batch) {
      toastr.info('没有找到可以收起的旧聊天。');
      return;
    }
    toastr.success(`已收起 ${batch.messageCount} 条旧楼层，保留最新楼层。`);
  } catch (e) {
    toastr.error(`收起失败: ${e}`);
  }
}

function showArchiveInfo() {
  window.alert(getChatArchiveSummary());
  refreshContextStats();
}

onMounted(() => {
  refreshContextStats();
  syncFloatingMode();
  window.addEventListener('resize', syncFloatingMode);
  window.visualViewport?.addEventListener('resize', syncFloatingMode);
  const viewportWindow = getFloatingViewportWindow();
  if (viewportWindow !== window) {
    viewportWindow.addEventListener('resize', syncFloatingMode);
    viewportWindow.visualViewport?.addEventListener('resize', syncFloatingMode);
  }
});
onUnmounted(() => {
  if (floatingAnchorTimer) {
    window.clearTimeout(floatingAnchorTimer);
    floatingAnchorTimer = null;
  }
  window.removeEventListener('resize', syncFloatingMode);
  window.visualViewport?.removeEventListener('resize', syncFloatingMode);
  const viewportWindow = getFloatingViewportWindow();
  if (viewportWindow !== window) {
    viewportWindow.removeEventListener('resize', syncFloatingMode);
    viewportWindow.visualViewport?.removeEventListener('resize', syncFloatingMode);
  }
  if (floatingDrag.value) {
    cleanupFloatingDrag(floatingDrag.value);
    floatingDrag.value = null;
  } else {
    window.removeEventListener('pointermove', moveFloatingDrag);
    window.removeEventListener('pointerup', endFloatingDrag);
    window.removeEventListener('pointercancel', endFloatingDrag);
  }
});
watch(assistantExpanded, () => nextTick(() => clampFloatingPosition()));
watch(() => props.isMobile, syncFloatingMode);
watch(() => chatStore.messages.length, refreshContextStats);
</script>

<template>
  <section
    ref="floatingPanelRef"
    class="baby-assistant-panel"
    :class="{
      'is-floating': isFloatingViewport,
      'is-expanded': assistantExpanded,
      'is-collapsed': isFloatingViewport && !assistantExpanded,
      'is-dragging': Boolean(floatingDrag),
    }"
    :style="floatingStyle"
  >
    <button
      v-if="isFloatingViewport && !assistantExpanded"
      class="assistant-float-button"
      type="button"
      aria-label="展开秋青子助手"
      :aria-expanded="assistantExpanded"
      @click="toggleFloatingPanel"
      @pointerdown="startFloatingDrag"
      @pointermove="moveFloatingDrag"
      @pointerup="endFloatingDrag"
      @pointercancel="endFloatingDrag"
    >
      <img :src="qiuqingziChibi" alt="" />
      <span>秋青子</span>
    </button>

    <template v-else>
      <div
        v-if="isFloatingViewport"
        class="assistant-float-head"
        @pointerdown="startFloatingDrag"
        @pointermove="moveFloatingDrag"
        @pointerup="endFloatingDrag"
        @pointercancel="endFloatingDrag"
      >
        <div class="assistant-float-title">
          <img :src="qiuqingziChibi" alt="" />
          <span>
            <strong>秋青子</strong>
            <small>拖动浮窗</small>
          </span>
        </div>
        <button type="button" aria-label="收起秋青子助手" @click="assistantExpanded = false">
          <SvgIcons name="x" :size="14" />
        </button>
      </div>

      <div class="assistant-main">
        <div class="qiuqinzi-avatar" aria-hidden="true">
          <img :src="qiuqingziChibi" alt="" />
        </div>

        <div class="assistant-bubble">
          <div class="bubble-title">
            <strong>秋青子</strong>
            <span>陪写中</span>
          </div>
          <p>{{ currentGuide.guide }}</p>
        </div>
      </div>

      <div class="assistant-source">
        <div>
          <span>知识库</span>
          <strong>{{ BABY_KNOWLEDGE_WORLDBOOK }}</strong>
        </div>
        <div>
          <span>当前字段</span>
          <strong>{{ currentGuide.label }}</strong>
        </div>
      </div>

      <div class="assistant-hint">
        <SvgIcons name="file" :size="14" />
        <span>不懂就问我，我会只看写卡知识库和当前预设条目。</span>
      </div>

      <div class="context-guard" :class="{ warning: contextWarning }">
        <div class="context-head">
          <span>上下文体检</span>
          <strong>约 {{ contextTokenLabel }} token</strong>
        </div>
        <p>
          {{
            contextWarning
              ? '聊天内容已经偏多，建议先把重要内容放进工作台或写入世界书，再收起旧楼层。'
              : '完成一个任务后，可以收起旧聊天；内容会存到当前聊天变量，不会删除。'
          }}
        </p>
        <div class="context-actions">
          <button :disabled="!contextStats.canArchive" @click="completeTaskAndArchive">
            <SvgIcons name="check" :size="14" />
            完成本任务并收起到最新楼层
          </button>
          <button @click="refreshContextStats">
            <SvgIcons name="search" :size="14" />
            重新检测
          </button>
          <button @click="showArchiveInfo">
            <SvgIcons name="file" :size="14" />
            查看收纳
          </button>
        </div>
        <small>已收纳 {{ contextStats.archiveCount }} 批；已隐藏 {{ contextStats.hiddenCount }} 层。</small>
      </div>

      <div class="assistant-actions">
        <button
          v-for="action in quickActions"
          :key="action.intent"
          :disabled="chatStore.isSending"
          @click="ask(action.intent)"
        >
          <SvgIcons :name="action.icon" :size="14" />
          {{ action.label }}
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.baby-assistant-panel {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid color-mix(in srgb, var(--ide-accent) 36%, var(--ide-border));
  border-radius: 8px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--ide-accent) 9%, transparent), transparent 70%),
    var(--ide-bg2);
}

.baby-assistant-panel.is-floating {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: min(380px, calc(100vw - 24px));
  max-height: min(560px, calc(100vh - 24px));
  box-sizing: border-box;
  border-radius: 18px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.24);
  overflow: hidden auto;
  will-change: transform;
}

.baby-assistant-panel.is-floating.is-collapsed {
  width: 76px;
  height: 92px;
  padding: 0;
  border: 0;
  border-radius: 24px;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.baby-assistant-panel.is-floating.is-expanded {
  padding: 10px;
}

.baby-assistant-panel.is-dragging {
  user-select: none;
}

.assistant-float-button {
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

.assistant-float-button:active {
  cursor: grabbing;
}

.assistant-float-button img {
  display: block;
  width: 58px;
  height: 74px;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.28));
}

.assistant-float-button span {
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

.assistant-float-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: -2px -2px 2px;
  padding: 6px 6px 8px;
  border-bottom: 1px solid var(--ide-border);
  cursor: grab;
  touch-action: none;
}

.assistant-float-head:active {
  cursor: grabbing;
}

.assistant-float-title {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.assistant-float-title img {
  width: 34px;
  height: 40px;
  object-fit: contain;
  filter: drop-shadow(0 5px 9px rgba(0, 0, 0, 0.24));
}

.assistant-float-title span {
  display: grid;
  min-width: 0;
  gap: 1px;
}

.assistant-float-title strong {
  color: var(--ide-text);
  font-size: 13px;
}

.assistant-float-title small {
  color: var(--ide-dim-2);
  font-size: 11px;
}

.assistant-float-head > button {
  width: 30px;
  height: 30px;
  border: 1px solid var(--ide-border);
  border-radius: 10px;
  background: var(--ide-surface);
  color: var(--ide-text);
  cursor: pointer;
}

.assistant-main {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 10px;
  align-items: end;
}

.qiuqinzi-avatar {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 72px;
  height: 92px;
  overflow: visible;
}

.qiuqinzi-avatar img {
  display: block;
  width: auto;
  max-width: 72px;
  height: 92px;
  object-fit: contain;
  object-position: center bottom;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.28));
}

.assistant-bubble {
  position: relative;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: var(--ide-bg);
}

.assistant-bubble::before {
  content: '';
  position: absolute;
  left: -7px;
  bottom: 18px;
  width: 12px;
  height: 12px;
  border-left: 1px solid var(--ide-border);
  border-bottom: 1px solid var(--ide-border);
  background: var(--ide-bg);
  transform: rotate(45deg);
}

.bubble-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}

.bubble-title strong {
  color: var(--ide-text);
  font-size: 13px;
}

.bubble-title span {
  color: var(--ide-accent-text);
  font-size: 11px;
  font-weight: 700;
}

.assistant-bubble p {
  margin: 0;
  color: var(--ide-dim);
  font-size: 12px;
  line-height: 1.55;
}

.assistant-source {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.assistant-source > div {
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid var(--ide-border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--ide-bg) 72%, transparent);
}

.assistant-source span,
.assistant-hint span {
  display: block;
  overflow: hidden;
  color: var(--ide-dim-3);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-source strong {
  display: block;
  overflow: hidden;
  margin-top: 2px;
  color: var(--ide-text);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  color: var(--ide-dim-3);
}

.assistant-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.context-guard {
  display: grid;
  gap: 7px;
  padding: 9px;
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--ide-bg) 78%, transparent);
}

.context-guard.warning {
  border-color: var(--ide-warning-border);
  background: var(--ide-warning-soft);
}

.context-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.context-head span,
.context-guard small {
  color: var(--ide-dim-3);
  font-size: 11px;
}

.context-head strong {
  color: var(--ide-text);
  font-size: 12px;
}

.context-guard.warning .context-head strong {
  color: var(--ide-warning-text);
}

.context-guard p {
  margin: 0;
  color: var(--ide-dim);
  font-size: 12px;
  line-height: 1.5;
}

.context-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 7px;
}

.assistant-actions button {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  border: 1px solid var(--ide-border);
  border-radius: 6px;
  color: var(--ide-text);
  background: var(--ide-bg);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.context-actions button {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 8px;
  border: 1px solid var(--ide-border);
  border-radius: 6px;
  color: var(--ide-text);
  background: var(--ide-bg);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.25;
  cursor: pointer;
  white-space: normal;
}

.assistant-actions button:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--ide-accent) 60%, var(--ide-border));
  background: color-mix(in srgb, var(--ide-accent) 10%, var(--ide-bg));
}

.context-actions button:hover:not(:disabled) {
  border-color: var(--ide-success-border);
  background: var(--ide-success-soft);
}

.assistant-actions button:disabled,
.context-actions button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.baby-assistant-panel.is-floating .assistant-main {
  grid-template-columns: 1fr;
}

.baby-assistant-panel.is-floating .qiuqinzi-avatar,
.baby-assistant-panel.is-floating .assistant-bubble::before {
  display: none;
}

.baby-assistant-panel.is-floating .assistant-source,
.baby-assistant-panel.is-floating .context-actions,
.baby-assistant-panel.is-floating .assistant-actions {
  grid-template-columns: 1fr;
}

.baby-assistant-panel.is-floating .assistant-hint {
  align-items: flex-start;
}

.baby-assistant-panel.is-floating .assistant-hint span {
  white-space: normal;
}
</style>
