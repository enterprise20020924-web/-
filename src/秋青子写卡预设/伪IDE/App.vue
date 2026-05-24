<script setup lang="ts">
import SvgIcons from './components/SvgIcons.vue';
import FileTree from './components/file-tree/FileTree.vue';
import EditorPanel from './components/editor/EditorPanel.vue';
import ActivityPanel from './components/activity/ActivityPanel.vue';
import ChatPanel from './components/chat/ChatPanel.vue';
import WorkshopHome from './components/workshop/WorkshopHome.vue';
import { usePresetStore } from './stores/preset';
import { useCharacterStore } from './stores/character';
import { useActivityStore } from './stores/activity';
import { useChatStore } from './stores/chat';
import { useFileSystemStore } from './stores/fileSystem';
import { usePlanStore } from './stores/plan';
import { useWorkshopStore } from './stores/workshop';
import { registerPlanContextInjection } from './utils/plan-context';
import { parsePlanProtocolFromText } from './utils/plan-protocol';

const emit = defineEmits<{ exit: [] }>();

const presetStore = usePresetStore();
const charStore = useCharacterStore();
const activityStore = useActivityStore();
const chatStore = useChatStore();
const fsStore = useFileSystemStore();
const planStore = usePlanStore();
const workshopStore = useWorkshopStore();

const parentWin = window.parent || window;
const MOBILE_LAYOUT_MAX_WIDTH = 768;
const PORTRAIT_LAYOUT_MAX_WIDTH = 1200;
const PORTRAIT_LAYOUT_RATIO = 1.5;
const viewportSize = ref({ width: window.innerWidth, height: window.innerHeight });
function readViewportSize() {
  const visualWidth = window.visualViewport?.width;
  const visualHeight = window.visualViewport?.height;
  const docWidth = document.documentElement.clientWidth;
  const docHeight = document.documentElement.clientHeight;
  const parentWidth = parentWin.innerWidth;
  const parentHeight = parentWin.innerHeight;
  const width = visualWidth && visualWidth > 0 ? visualWidth : docWidth || window.innerWidth;
  const height = visualHeight && visualHeight > 0 ? visualHeight : docHeight || window.innerHeight;
  return {
    width: width > 0 ? width : parentWidth,
    height: height > 0 ? height : parentHeight,
  };
}
const isMobile = computed(() => {
  const { width, height } = viewportSize.value;
  return width <= MOBILE_LAYOUT_MAX_WIDTH || (width <= PORTRAIT_LAYOUT_MAX_WIDTH && height >= width * PORTRAIT_LAYOUT_RATIO);
});
const onResize = () => {
  viewportSize.value = readViewportSize();
};
function syncViewportAfterFrame() {
  requestAnimationFrame(() => {
    onResize();
    requestAnimationFrame(onResize);
  });
}

onMounted(() => {
  onResize();
  syncViewportAfterFrame();
  window.setTimeout(onResize, 50);
  window.setTimeout(onResize, 250);
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  parentWin.addEventListener('resize', onResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', onResize);
  window.visualViewport?.removeEventListener('resize', onResize);
  parentWin.removeEventListener('resize', onResize);
});

type MobileTab = 'files' | 'editor' | 'chat';
type MobileWorkspaceTab = 'files' | 'editor';
type AppArea = 'workshop' | 'expert';

const mobileTab = ref<MobileTab>('chat');
const mobileWorkspaceTab = ref<MobileWorkspaceTab>('files');
const activeArea = ref<AppArea>('workshop');
const mobileTabLabel = computed(() => {
  if (activeArea.value === 'workshop') return '明月秋青';
  switch (mobileTab.value) {
    case 'files':
      return '文件';
    case 'editor':
      return '编辑';
    case 'chat':
      return '聊天';
  }
});
const mobileExpertToggleLabel = computed(() => (activeArea.value === 'expert' ? '普通' : '专家'));
const mobileExpertToggleTitle = computed(() => (
  activeArea.value === 'expert' ? '返回明月秋青' : '进入专家工作区'
));
const activeAreaLabel = computed(() => (activeArea.value === 'workshop' ? '明月秋青' : '专家工作区'));

type IdeTheme = 'dark' | 'light';
const THEME_STORAGE_KEY = 'qz-ide-theme';
const COMPLETION_AUDIO_MUTED_STORAGE_KEY = 'qz-ide-completion-audio-muted';
const COMPLETION_AUDIO_VOLUME = 0.18;
const COMPLETION_AUDIO_COOLDOWN_MS = 1200;

const theme = ref<IdeTheme>('dark');
const completionAudioMuted = ref(false);
const isLightTheme = computed(() => theme.value === 'light');
const themeLabel = computed(() => (isLightTheme.value ? '白天模式' : '夜间模式'));
const nextThemeLabel = computed(() => (isLightTheme.value ? '夜间模式' : '白天模式'));
const completionAudioTitle = computed(() =>
  completionAudioMuted.value ? '启用曼波提示音' : '禁用曼波提示音',
);

let appearanceSettingsHydrated = false;

function toggleTheme() {
  theme.value = isLightTheme.value ? 'dark' : 'light';
}

function toggleCompletionAudioMuted() {
  completionAudioMuted.value = !completionAudioMuted.value;
}

onMounted(() => {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme.value = savedTheme;
    }

    const savedCompletionAudioMuted = window.localStorage.getItem(COMPLETION_AUDIO_MUTED_STORAGE_KEY);
    if (savedCompletionAudioMuted === 'true' || savedCompletionAudioMuted === 'false') {
      completionAudioMuted.value = savedCompletionAudioMuted === 'true';
    }
  } catch {
    /* ignore storage failures */
  }

  appearanceSettingsHydrated = true;
});

watch(
  theme,
  nextTheme => {
    document.documentElement.style.colorScheme = nextTheme;
    if (!appearanceSettingsHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      /* ignore storage failures */
    }
  },
  { immediate: true },
);

const streamingContent = ref('');
const streamPayloadMode = ref<'unknown' | 'cumulative' | 'delta'>('unknown');

function resetStreamingContent() {
  streamingContent.value = '';
  streamPayloadMode.value = 'unknown';
}

function applyStreamingPayload(payload: string) {
  if (!payload) return;

  const current = streamingContent.value;
  if (!current) {
    streamingContent.value = payload;
    return;
  }

  // SillyTavern emits cumulative text here; keep a delta fallback for adapters that differ.
  if (streamPayloadMode.value === 'cumulative' || payload === current || (payload.length > current.length && payload.startsWith(current))) {
    streamPayloadMode.value = 'cumulative';
    streamingContent.value = payload;
    return;
  }

  streamPayloadMode.value = 'delta';
  streamingContent.value = current + payload;
}

type WorkToastKind = 'working' | 'done';

interface WorkToastItem {
  id: number;
  text: string;
  kind: WorkToastKind;
}

interface ProtocolNoticeBatch {
  text: string;
  needsPanelConfirmation: boolean;
  count: number;
}

const COMPLETION_AUDIO_URL =
  'https://testingcf.jsdelivr.net/gh/enterprise20020924-web/-@main/llm1/曼波.mp3';
const PROTOCOL_NOTICE_DEBOUNCE_MS = 1200;
const PROTOCOL_CAPTURE_DEDUPE_MS = 45_000;
const PROTOCOL_NOTICE_SUPPRESS_MS = 20_000;
const TOAST_GUARD_SUPPRESS_MS = 6_000;
const TOAST_GUARD_MAX_VISIBLE = 3;

const workToasts = ref<WorkToastItem[]>([]);
const completionAudio = shallowRef<HTMLAudioElement | null>(null);
const hasPendingWork = ref(false);
const hasIncomingStream = ref(false);
const eventStops: Array<() => void> = [];
const chatRefreshTimers: Array<ReturnType<typeof setTimeout>> = [];
let workToastSeed = 0;
let completionAudioPrimed = false;
let lastCompletionAudioAt = 0;
let lastCapturedPlanProtocolKey = '';
let protocolNoticeTimer: ReturnType<typeof setTimeout> | null = null;
let protocolNoticeBatch: ProtocolNoticeBatch | null = null;
const recentProtocolCaptures = new Map<string, number>();
const recentProtocolNotices = new Map<string, number>();

type ToastrLevel = 'info' | 'success' | 'warning' | 'error';

function installToastrGuard() {
  const guardedWindow = window as typeof window & { __mingyueToastrGuardInstalled?: boolean };
  if (guardedWindow.__mingyueToastrGuardInstalled || typeof toastr === 'undefined') return;
  guardedWindow.__mingyueToastrGuardInstalled = true;

  toastr.options = {
    ...(toastr.options ?? {}),
    preventDuplicates: true,
    newestOnTop: true,
  };

  const recentToasts = new Map<string, number>();
  const levels: ToastrLevel[] = ['info', 'success', 'warning', 'error'];

  for (const level of levels) {
    const original = toastr[level]?.bind(toastr);
    if (!original) continue;

    toastr[level] = ((message?: string, title?: string, optionsOverride?: unknown) => {
      const now = Date.now();
      for (const [key, noticedAt] of recentToasts) {
        if (now - noticedAt > TOAST_GUARD_SUPPRESS_MS) recentToasts.delete(key);
      }

      const key = `${level}:${title ?? ''}:${message ?? ''}`;
      const noticedAt = recentToasts.get(key);
      if (noticedAt && now - noticedAt <= TOAST_GUARD_SUPPRESS_MS) return undefined;

      recentToasts.set(key, now);
      const result = original(message, title, optionsOverride);
      window.setTimeout(() => {
        const visibleToasts = Array.from(document.querySelectorAll('#toast-container .toast'));
        const overflow = visibleToasts.length - TOAST_GUARD_MAX_VISIBLE;
        if (overflow > 0) visibleToasts.slice(0, overflow).forEach(item => item.remove());
      }, 0);
      return result;
    }) as typeof toastr[typeof level];
  }
}

watch(
  completionAudioMuted,
  muted => {
    if (completionAudio.value) {
      completionAudio.value.muted = muted;
      completionAudio.value.volume = muted ? 0 : COMPLETION_AUDIO_VOLUME;

      if (muted) {
        completionAudio.value.pause();
        completionAudio.value.currentTime = 0;
      }
    }

    if (!appearanceSettingsHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(COMPLETION_AUDIO_MUTED_STORAGE_KEY, String(muted));
    } catch {
      /* ignore storage failures */
    }
  },
  { immediate: true },
);

function ensureCompletionAudio() {
  if (!completionAudio.value) {
    const audio = new Audio(COMPLETION_AUDIO_URL);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = completionAudioMuted.value ? 0 : COMPLETION_AUDIO_VOLUME;
    audio.muted = completionAudioMuted.value;
    completionAudio.value = audio;
  }

  return completionAudio.value;
}

function removeWorkToast(id: number) {
  workToasts.value = workToasts.value.filter(toast => toast.id !== id);
}

function clearWorkToasts(kind?: WorkToastKind) {
  workToasts.value = workToasts.value.filter(toast => (kind ? toast.kind !== kind : false));
}

function pushWorkToast(text: string, kind: WorkToastKind) {
  const id = ++workToastSeed;
  workToasts.value.push({ id, text, kind });
  window.setTimeout(() => removeWorkToast(id), 3000);
}

async function primeCompletionAudio() {
  if (completionAudioPrimed) {
    return;
  }

  const audio = ensureCompletionAudio();

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = true;
    audio.volume = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    completionAudioPrimed = true;
  } catch (error) {
    console.warn('[IDE] primeCompletionAudio failed:', error);
  } finally {
    audio.muted = completionAudioMuted.value;
    audio.volume = completionAudioMuted.value ? 0 : COMPLETION_AUDIO_VOLUME;
  }
}

async function playCompletionAudio() {
  if (completionAudioMuted.value) {
    return;
  }

  const now = Date.now();
  if (now - lastCompletionAudioAt < COMPLETION_AUDIO_COOLDOWN_MS) {
    return;
  }

  lastCompletionAudioAt = now;
  const audio = ensureCompletionAudio();

  try {
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = COMPLETION_AUDIO_VOLUME;
    await audio.play();
  } catch (error) {
    lastCompletionAudioAt = 0;
    console.warn('[IDE] playCompletionAudio failed:', error);
  }
}

async function handleWorkStart() {
  hasPendingWork.value = true;
  hasIncomingStream.value = false;
  clearWorkToasts('working');
  pushWorkToast('开始工作', 'working');
  await primeCompletionAudio();
}

function handleWorkFailed() {
  hasPendingWork.value = false;
  hasIncomingStream.value = false;
  clearWorkToasts('working');
}

function handleWorkDone() {
  clearWorkToasts('working');
  pushWorkToast('完成工作', 'done');
  void playCompletionAudio();
}

function clearChatRefreshTimers() {
  chatRefreshTimers.splice(0).forEach(timer => clearTimeout(timer));
}

function refreshChatMessagesSettled(delays = [0, 180, 650, 1600]) {
  clearChatRefreshTimers();

  for (const delay of delays) {
    const timer = setTimeout(() => {
      chatStore.refreshMessages();
    }, delay);
    chatRefreshTimers.push(timer);
  }
}

function flushProtocolNotice() {
  if (!protocolNoticeBatch) return;

  const batch = protocolNoticeBatch;
  const countText = batch.count > 1 ? `（合并 ${batch.count} 次识别）` : '';
  toastr.info(`已识别 ${batch.text}${countText}${batch.needsPanelConfirmation ? '，请在计划面板确认' : ''}`);
  recentProtocolNotices.set(batch.text, Date.now());
  protocolNoticeBatch = null;
  protocolNoticeTimer = null;
}

function clearProtocolNoticeTimer() {
  if (!protocolNoticeTimer) return;

  clearTimeout(protocolNoticeTimer);
  protocolNoticeTimer = null;
}

function queueProtocolNotice(protocolNotices: string[], needsPanelConfirmation: boolean) {
  if (!protocolNotices.length) return;

  const text = protocolNotices.join('、');
  const now = Date.now();
  for (const [cachedText, noticedAt] of recentProtocolNotices) {
    if (now - noticedAt > PROTOCOL_NOTICE_SUPPRESS_MS) {
      recentProtocolNotices.delete(cachedText);
    }
  }
  const recentlyNoticedAt = recentProtocolNotices.get(text);
  if (!protocolNoticeBatch && recentlyNoticedAt && now - recentlyNoticedAt <= PROTOCOL_NOTICE_SUPPRESS_MS) {
    return;
  }

  if (protocolNoticeBatch && protocolNoticeBatch.text !== text) {
    clearProtocolNoticeTimer();
    flushProtocolNotice();
  }

  if (!protocolNoticeBatch) {
    protocolNoticeBatch = {
      text,
      needsPanelConfirmation,
      count: 0,
    };
  }

  protocolNoticeBatch.count += 1;
  protocolNoticeBatch.needsPanelConfirmation = protocolNoticeBatch.needsPanelConfirmation || needsPanelConfirmation;
  clearProtocolNoticeTimer();
  protocolNoticeTimer = setTimeout(flushProtocolNotice, PROTOCOL_NOTICE_DEBOUNCE_MS);
}

function makeProtocolCaptureKey(kind: 'draft' | 'checkpoint' | 'update' | 'artifact_delta', payload: unknown) {
  return `${kind}:${JSON.stringify(payload)}`;
}

function makeDraftCaptureKey(draft: NonNullable<ReturnType<typeof parsePlanProtocolFromText>['draft']>) {
  return makeProtocolCaptureKey('draft', {
    title: draft.title,
  });
}

function makeCheckpointCaptureKey(checkpoint: NonNullable<ReturnType<typeof parsePlanProtocolFromText>['checkpoint']>) {
  return makeProtocolCaptureKey('checkpoint', {
    planId: checkpoint.planId,
    checkpointId: checkpoint.checkpointId,
    status: checkpoint.status,
    summary: checkpoint.summary,
  });
}

function makeUpdateCaptureKey(update: NonNullable<ReturnType<typeof parsePlanProtocolFromText>['update']>) {
  return makeProtocolCaptureKey('update', {
    planId: update.planId,
    checkpointId: update.checkpointId,
    statusSuggestion: update.statusSuggestion,
    ops: update.ops.map(operation => {
      switch (operation.op) {
        case 'set_todo_status':
          return { op: operation.op, todoId: operation.todoId, status: operation.status };
        case 'set_active_todo':
          return { op: operation.op, todoId: operation.todoId };
        case 'add_blocker':
        case 'remove_blocker':
          return { op: operation.op, blocker: operation.blocker };
        case 'set_prompt_notes':
          return { op: operation.op };
        case 'add_todo':
          return { op: operation.op, title: operation.todo.title };
        case 'update_todo':
        case 'remove_todo':
          return { op: operation.op, todoId: operation.todoId };
        default:
          return { op: operation.op };
      }
    }),
  });
}

function claimProtocolCapture(key: string) {
  const now = Date.now();

  for (const [cachedKey, capturedAt] of recentProtocolCaptures) {
    if (now - capturedAt > PROTOCOL_CAPTURE_DEDUPE_MS) {
      recentProtocolCaptures.delete(cachedKey);
    }
  }

  const capturedAt = recentProtocolCaptures.get(key);
  if (capturedAt && now - capturedAt <= PROTOCOL_CAPTURE_DEDUPE_MS) {
    return false;
  }

  recentProtocolCaptures.set(key, now);
  return true;
}

function capturePlanProtocolFromLatestMessage() {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return;
    const latest = getChatMessages(`${lastId}`, { hide_state: 'all' })?.[0];
    if (!latest?.message || latest.role !== 'assistant') return;
    const { draft, checkpoint, update, artifactDelta } = parsePlanProtocolFromText(latest.message);
    if (!draft && !checkpoint && !update && !artifactDelta) return;

    const protocolKey = JSON.stringify({ messageId: latest.message_id, draft, checkpoint, update, artifactDelta });
    if (protocolKey === lastCapturedPlanProtocolKey) return;
    lastCapturedPlanProtocolKey = protocolKey;

    const protocolNotices: string[] = [];
    let needsPanelConfirmation = false;
    const hasActivePlan = Boolean(planStore.activePlan);
    if (draft) {
      if (hasActivePlan) {
        protocolNotices.push(`已忽略新 PlanDraft「${draft.title}」`);
        needsPanelConfirmation = true;
      } else {
        const shouldNotifyDraft = claimProtocolCapture(makeDraftCaptureKey(draft));
        planStore.setPendingDraft(draft);
        if (shouldNotifyDraft) {
          protocolNotices.push(`PlanDraft「${draft.title}」`);
          needsPanelConfirmation = true;
        }
      }
    }
    if (!hasActivePlan && (checkpoint || update || artifactDelta)) {
      protocolNotices.push('草拟阶段执行协议已忽略');
      needsPanelConfirmation = true;
      if (protocolNotices.length) {
        queueProtocolNotice(protocolNotices, needsPanelConfirmation);
      }
      return;
    }
    if (artifactDelta && claimProtocolCapture(makeProtocolCaptureKey('artifact_delta', {
      planId: artifactDelta.planId,
      summary: artifactDelta.summary,
      operations: artifactDelta.operations,
    }))) {
      const tree = planStore.applyArtifactDelta(artifactDelta);
      if (tree) {
        workshopStore.setGeneratedOutput(tree.artifacts, tree.operations);
        protocolNotices.push(`产物工作区「${artifactDelta.summary}」`);
        needsPanelConfirmation = true;
      }
    }
    if (checkpoint || update) {
      const hasNewCheckpoint = checkpoint ? claimProtocolCapture(makeCheckpointCaptureKey(checkpoint)) : false;
      const hasNewUpdate = update ? claimProtocolCapture(makeUpdateCaptureKey(update)) : false;
      if (checkpoint && update && (hasNewCheckpoint || hasNewUpdate)) {
        if (planStore.setCheckpointPair(checkpoint, update)) {
          protocolNotices.push(`Checkpoint「${checkpoint.summary}」`);
          needsPanelConfirmation = true;
        }
      } else if (!checkpoint && update) {
        planStore.setProtocolBlocker('收到 PlanUpdate，但缺少同轮 PlanCheckpoint；继续入口已暂停。');
        protocolNotices.push('PlanUpdate 缺少 Checkpoint');
        needsPanelConfirmation = true;
      } else if (checkpoint && !update) {
        if (planStore.setCheckpointWithFallbackUpdate(checkpoint)) {
          protocolNotices.push('Checkpoint 已自动补全 PlanUpdate');
          needsPanelConfirmation = true;
        }
      }
    }
    if (protocolNotices.length) {
      queueProtocolNotice(protocolNotices, needsPanelConfirmation);
    }
  } catch (error) {
    console.warn('[IDE] capture plan protocol failed:', error);
  }
}

onMounted(() => {
  installToastrGuard();
  presetStore.refresh();
  charStore.refresh();
  planStore.loadFromChat();
  refreshChatMessagesSettled([0, 300, 1000]);

  eventStops.push(registerPlanContextInjection());

  eventStops.push(
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
      refreshChatMessagesSettled();
      activityStore.captureFromLatestMessage();
      capturePlanProtocolFromLatestMessage();
      setTimeout(() => fsStore.refresh(), 500);
      setTimeout(() => fsStore.refresh(), 2000);
      const shouldNotifyDone = hasPendingWork.value || hasIncomingStream.value;
      hasPendingWork.value = false;
      hasIncomingStream.value = false;
      resetStreamingContent();
      if (shouldNotifyDone) {
        handleWorkDone();
      }
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.USER_MESSAGE_RENDERED, () => {
      refreshChatMessagesSettled([0, 120, 500]);
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.MESSAGE_RECEIVED, () => {
      refreshChatMessagesSettled();
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.GENERATION_ENDED, () => {
      refreshChatMessagesSettled([0, 250, 900, 2200]);
      setTimeout(() => activityStore.captureFromLatestMessage(), 500);
      setTimeout(() => capturePlanProtocolFromLatestMessage(), 550);
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      refreshChatMessagesSettled([0, 180, 650]);
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.CHAT_CHANGED, () => {
      planStore.loadFromChat();
      refreshChatMessagesSettled([0, 300, 1000]);
    }).stop,
  );

  eventStops.push(
    eventOn(tavern_events.STREAM_TOKEN_RECEIVED, (token: string) => {
      if (token) {
        hasIncomingStream.value = true;
      }
      applyStreamingPayload(token);
    }).stop,
  );
});

let fsTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fsTimer = setInterval(() => fsStore.refresh(), 30000);
});

onUnmounted(() => {
  if (fsTimer) {
    clearInterval(fsTimer);
    fsTimer = null;
  }

  eventStops.splice(0).forEach(stop => stop());
  clearChatRefreshTimers();
  clearProtocolNoticeTimer();
  protocolNoticeBatch = null;
  lastCompletionAudioAt = 0;
  completionAudioPrimed = false;

  if (completionAudio.value) {
    completionAudio.value.pause();
    completionAudio.value.currentTime = 0;
    completionAudio.value = null;
  }
});

const showPresetDropdown = ref(false);
const showMobileMenu = ref(false);
const showMobileWorkspace = ref(false);

function closeDesktopMenus() {
  showPresetDropdown.value = false;
  showCharDropdown.value = false;
}

function toggleMobileMenu() {
  if (!showMobileMenu.value) {
    showMobileWorkspace.value = false;
  }
  showMobileMenu.value = !showMobileMenu.value;
}

function openMobileWorkspace(tab: MobileWorkspaceTab = 'files') {
  showMobileMenu.value = false;
  mobileWorkspaceTab.value = tab;
  showMobileWorkspace.value = true;
}

function closeMobileWorkspace() {
  showMobileWorkspace.value = false;
}

function openWorkshop() {
  activeArea.value = 'workshop';
  showMobileMenu.value = false;
  showMobileWorkspace.value = false;
}

function openExpert() {
  activeArea.value = 'expert';
  showMobileMenu.value = false;
  showMobileWorkspace.value = false;
}

function toggleMobileExpertMode() {
  if (activeArea.value === 'expert') {
    openWorkshop();
    return;
  }
  openExpert();
}

watch(isMobile, mobile => {
  if (mobile) {
    closeDesktopMenus();
  } else {
    showMobileMenu.value = false;
    showMobileWorkspace.value = false;
  }
});

watch(mobileTab, () => {
  if (isMobile.value) {
    showMobileMenu.value = false;
  }
});

watch(activeArea, area => {
  if (area === 'expert') {
    fsStore.refresh();
  }
});

function togglePresetEntry(name: string) {
  presetStore.togglePrompt(name);
}

const showCharDropdown = ref(false);

async function onCharClick(name: string) {
  if (name === charStore.currentCharName) {
    toastr.info(`已经是当前角色: ${name}`);
    return;
  }

  try {
    showCharDropdown.value = false;
    toastr.info(`正在切换到 ${name}...`);
    await triggerSlash(`/char ${name}`);

    setTimeout(() => {
      charStore.refresh();
      chatStore.refreshMessages();
      fsStore.refresh();
      toastr.success(`已切换到角色: ${name}`);
    }, 1000);
  } catch (error) {
    toastr.error(`切换角色失败: ${error}`);
    console.error('[IDE] switchChar failed:', error);
  }
}
</script>

<template>
  <div class="ide-root" :class="[`theme-${theme}`, { mobile: isMobile }]">
    <header v-if="!isMobile" class="ide-topbar">
      <span class="ide-brand">明月秋青</span>

      <nav class="ide-area-tabs" aria-label="工作区切换">
        <button :class="{ active: activeArea === 'workshop' }" @click="openWorkshop">
          <SvgIcons name="message" :size="14" />
          <span>明月秋青</span>
        </button>
        <button :class="{ active: activeArea === 'expert' }" @click="openExpert">
          <SvgIcons name="sidebar" :size="14" />
          <span>专家工作区</span>
        </button>
      </nav>

      <div class="ide-dropdown-wrap">
        <button class="ide-dropdown-btn" @click="showCharDropdown = !showCharDropdown">
          <SvgIcons name="user" :size="14" />
          <span>{{ charStore.currentCharName || '未选择角色' }}</span>
          <SvgIcons name="chevron-down" :size="10" />
        </button>

        <div v-if="showCharDropdown" class="ide-dropdown" @mouseleave="showCharDropdown = false">
          <div
            v-for="character in charStore.characters"
            :key="character.name"
            class="ide-dropdown-item"
            :class="{ active: character.isCurrent }"
            @click="onCharClick(character.name)"
          >
            {{ character.name }}
            <span v-if="character.isCurrent" class="ide-tag-current">当前</span>
          </div>

          <div class="ide-dropdown-divider" />

          <div class="ide-dropdown-item" @click="charStore.triggerImport(); showCharDropdown = false">
            <SvgIcons name="upload" :size="12" />
            导入角色卡
          </div>

          <div
            v-if="charStore.currentCharName"
            class="ide-dropdown-item"
            @click="charStore.exportChar(charStore.currentCharName!); showCharDropdown = false"
          >
            <SvgIcons name="download" :size="12" />
            导出角色卡
          </div>
        </div>
      </div>

      <div class="ide-dropdown-wrap">
        <button class="ide-dropdown-btn" @click="showPresetDropdown = !showPresetDropdown">
          <SvgIcons name="settings" :size="14" />
          <span>预设条目</span>
          <SvgIcons name="chevron-down" :size="10" />
        </button>

        <div v-if="showPresetDropdown" class="ide-dropdown ide-dropdown-wide">
          <div class="ide-dropdown-header">
            <span>条目开关</span>
            <button class="ide-dropdown-close" @click="showPresetDropdown = false">
              <SvgIcons name="x" :size="12" />
            </button>
          </div>

          <div class="ide-dropdown-section">通用条目</div>
          <div
            v-for="promptItem in presetStore.generalPrompts"
            :key="promptItem.name"
            class="ide-dropdown-item"
            @click="togglePresetEntry(promptItem.name)"
          >
            <span :class="promptItem.enabled ? 'ide-toggle-on' : 'ide-toggle-off'">
              <SvgIcons :name="promptItem.enabled ? 'toggle-on' : 'toggle-off'" :size="16" />
            </span>
            <span :style="{ color: promptItem.enabled ? 'var(--ide-success-text)' : 'var(--ide-dim-3)' }">
              {{ promptItem.displayName }}
            </span>
          </div>

          <div class="ide-dropdown-section">MVU / EJS</div>
          <div
            v-for="promptItem in presetStore.mvuPrompts"
            :key="promptItem.name"
            class="ide-dropdown-item"
            @click="togglePresetEntry(promptItem.name)"
          >
            <span :class="promptItem.enabled ? 'ide-toggle-on' : 'ide-toggle-off'">
              <SvgIcons :name="promptItem.enabled ? 'toggle-on' : 'toggle-off'" :size="16" />
            </span>
            <span :style="{ color: promptItem.enabled ? 'var(--ide-success-text)' : 'var(--ide-dim-3)' }">
              {{ promptItem.displayName }}
            </span>
          </div>
        </div>
      </div>

      <button
        class="ide-btn"
        :class="{ 'ide-ejs-on': presetStore.templateAndMacroEnabled }"
        @click="presetStore.toggleTemplateAndMacro()"
        :title="presetStore.templateAndMacroEnabled ? '禁用模板和宏' : '启用模板和宏'"
      >
        <SvgIcons :name="presetStore.templateAndMacroEnabled ? 'toggle-on' : 'toggle-off'" :size="16" />
        <span class="ide-btn-label">模板+宏</span>
      </button>

      <button
        class="ide-btn ide-theme-btn"
        :class="{ 'is-light': isLightTheme }"
        @click="toggleTheme"
        :title="`切换到${nextThemeLabel}`"
      >
        <SvgIcons :name="isLightTheme ? 'sun' : 'moon'" :size="16" />
        <span class="ide-btn-label">{{ themeLabel }}</span>
      </button>

      <button
        class="ide-btn ide-audio-btn"
        :class="{ 'is-muted': completionAudioMuted }"
        @click="toggleCompletionAudioMuted"
        :title="completionAudioTitle"
      >
        <SvgIcons :name="completionAudioMuted ? 'volume-x' : 'volume-2'" :size="16" />
        <span class="ide-btn-label">静音</span>
      </button>

      <span class="ide-spacer" />

      <button class="ide-btn ide-exit" @click="emit('exit')" title="退出明月秋青">
        <SvgIcons name="x" :size="16" />
        <span>退出</span>
      </button>
    </header>

    <header v-else class="ide-mobile-topbar">
      <button class="ide-mobile-icon-btn" @click="toggleMobileMenu" title="打开菜单">
        <SvgIcons name="menu" :size="18" />
      </button>

      <div class="ide-mobile-title">
        <span class="ide-brand">明月秋青</span>
        <span class="ide-mobile-subtitle">{{ activeAreaLabel }} · {{ mobileTabLabel }}</span>
      </div>

      <div class="ide-mobile-actions">
        <button
          class="ide-mobile-expert-btn"
          :class="{ active: activeArea === 'expert' }"
          @click="toggleMobileExpertMode"
          :title="mobileExpertToggleTitle"
        >
          <SvgIcons :name="activeArea === 'expert' ? 'message' : 'sidebar'" :size="15" />
          <span>{{ mobileExpertToggleLabel }}</span>
        </button>

        <button
          class="ide-mobile-icon-btn ide-theme-btn"
          :class="{ 'is-light': isLightTheme }"
          @click="toggleTheme"
          :title="`切换到${nextThemeLabel}`"
        >
          <SvgIcons :name="isLightTheme ? 'sun' : 'moon'" :size="16" />
        </button>
      </div>
    </header>

    <Transition name="mobile-menu">
      <div
        v-if="isMobile && showMobileMenu"
        class="ide-mobile-menu-backdrop"
        @click="showMobileMenu = false"
      >
        <aside class="ide-mobile-menu-panel" @click.stop>
          <div class="ide-mobile-menu-header">
            <div>
              <div class="ide-mobile-menu-title">工作区菜单</div>
              <div class="ide-mobile-menu-subtitle">{{ charStore.currentCharName || '未选择角色' }}</div>
            </div>
            <button class="ide-mobile-icon-btn" @click="showMobileMenu = false" title="关闭菜单">
              <SvgIcons name="x" :size="16" />
            </button>
          </div>

          <section class="ide-mobile-menu-section">
            <div class="ide-mobile-section-label">工作区</div>
            <div class="ide-mobile-action-grid">
              <button
                class="ide-mobile-action-card"
                :class="{ active: activeArea === 'workshop' }"
                @click="openWorkshop"
              >
                <SvgIcons name="message" :size="14" />
                <span>明月秋青</span>
              </button>
              <button
                class="ide-mobile-action-card"
                :class="{ active: activeArea === 'expert' }"
                @click="openExpert"
              >
                <SvgIcons name="sidebar" :size="14" />
                <span>专家工作区</span>
              </button>
            </div>
          </section>

          <section class="ide-mobile-menu-section">
            <div class="ide-mobile-section-label">角色</div>
            <div class="ide-mobile-chip-list">
              <button
                v-for="character in charStore.characters"
                :key="character.name"
                class="ide-mobile-chip"
                :class="{ active: character.isCurrent }"
                @click="onCharClick(character.name); showMobileMenu = false"
              >
                <SvgIcons name="user" :size="12" />
                <span>{{ character.name }}</span>
              </button>
            </div>

            <div class="ide-mobile-action-grid">
              <button class="ide-mobile-action-card" @click="charStore.triggerImport(); showMobileMenu = false">
                <SvgIcons name="upload" :size="14" />
                <span>导入角色卡</span>
              </button>
              <button
                v-if="charStore.currentCharName"
                class="ide-mobile-action-card"
                @click="charStore.exportChar(charStore.currentCharName!); showMobileMenu = false"
              >
                <SvgIcons name="download" :size="14" />
                <span>导出当前角色</span>
              </button>
            </div>
          </section>

          <section class="ide-mobile-menu-section">
            <div class="ide-mobile-section-label">开关</div>
            <div class="ide-mobile-action-grid">
              <button
                class="ide-mobile-action-card"
                :class="{ active: presetStore.templateAndMacroEnabled }"
                @click="presetStore.toggleTemplateAndMacro()"
              >
                <SvgIcons :name="presetStore.templateAndMacroEnabled ? 'toggle-on' : 'toggle-off'" :size="14" />
                <span>模板 + 宏</span>
              </button>
              <button
                class="ide-mobile-action-card"
                :class="{ active: isLightTheme }"
                @click="toggleTheme"
              >
                <SvgIcons :name="isLightTheme ? 'sun' : 'moon'" :size="14" />
                <span>{{ themeLabel }}</span>
              </button>
              <button
                class="ide-mobile-action-card"
                :class="{ active: completionAudioMuted }"
                @click="toggleCompletionAudioMuted"
              >
                <SvgIcons :name="completionAudioMuted ? 'volume-x' : 'volume-2'" :size="14" />
                <span>静音</span>
              </button>
            </div>
          </section>

          <section class="ide-mobile-menu-section">
            <div class="ide-mobile-section-label">预设条目</div>
            <div class="ide-mobile-menu-list">
              <button
                v-for="promptItem in presetStore.generalPrompts"
                :key="promptItem.name"
                class="ide-mobile-list-item"
                @click="togglePresetEntry(promptItem.name)"
              >
                <span class="ide-mobile-list-main">{{ promptItem.displayName }}</span>
                <SvgIcons :name="promptItem.enabled ? 'toggle-on' : 'toggle-off'" :size="16" />
              </button>
            </div>
          </section>

          <section class="ide-mobile-menu-section">
            <div class="ide-mobile-section-label">MVU / EJS</div>
            <div class="ide-mobile-menu-list">
              <button
                v-for="promptItem in presetStore.mvuPrompts"
                :key="promptItem.name"
                class="ide-mobile-list-item"
                @click="togglePresetEntry(promptItem.name)"
              >
                <span class="ide-mobile-list-main">{{ promptItem.displayName }}</span>
                <SvgIcons :name="promptItem.enabled ? 'toggle-on' : 'toggle-off'" :size="16" />
              </button>
            </div>
          </section>
        </aside>
      </div>
    </Transition>

    <Transition name="mobile-workspace">
      <div
        v-if="isMobile && showMobileWorkspace"
        class="ide-mobile-workspace-backdrop"
        @click="closeMobileWorkspace"
      >
        <aside class="ide-mobile-workspace-panel" @click.stop>
          <div class="ide-mobile-workspace-header">
            <div>
              <div class="ide-mobile-workspace-title">工作区</div>
              <div class="ide-mobile-workspace-subtitle">文件和编辑在这里切换</div>
            </div>
            <button class="ide-mobile-icon-btn" @click="closeMobileWorkspace" title="Close workspace">
              <SvgIcons name="x" :size="16" />
            </button>
          </div>

          <nav class="ide-mobile-workspace-tabs">
            <button
              :class="{ active: mobileWorkspaceTab === 'files' }"
              @click="mobileWorkspaceTab = 'files'"
            >
              <SvgIcons name="folder" :size="18" />
              <span>文件</span>
            </button>
            <button
              :class="{ active: mobileWorkspaceTab === 'editor' }"
              @click="mobileWorkspaceTab = 'editor'"
            >
              <SvgIcons name="edit" :size="18" />
              <span>编辑</span>
            </button>
          </nav>

          <div class="ide-mobile-workspace-body">
            <div v-if="mobileWorkspaceTab === 'files'" class="ide-mobile-workspace-pane">
              <FileTree />
            </div>
            <div v-else class="ide-mobile-workspace-pane">
              <EditorPanel />
            </div>
          </div>
        </aside>
      </div>
    </Transition>

    <TransitionGroup name="work-toast" tag="div" class="ide-work-toast-layer">
      <div
        v-for="toast in workToasts"
        :key="toast.id"
        class="ide-work-toast"
        :class="[`is-${toast.kind}`]"
      >
        <SvgIcons :name="toast.kind === 'working' ? 'refresh' : 'bot'" :size="16" />
        <span>{{ toast.text }}</span>
      </div>
    </TransitionGroup>

    <div class="ide-body">
      <template v-if="activeArea === 'workshop'">
        <WorkshopHome
          :current-char-name="charStore.currentCharName"
          :streaming-content="streamingContent"
          :is-mobile="isMobile"
          @open-expert="openExpert"
          @send-start="handleWorkStart"
          @send-failed="handleWorkFailed"
        />
      </template>

      <template v-else-if="!isMobile">
        <aside class="ide-sidebar">
          <FileTree />
        </aside>
        <div class="ide-divider-v" />

        <main class="ide-editor">
          <EditorPanel />
        </main>
        <div class="ide-divider-v" />

        <aside class="ide-right">
          <div class="ide-activity-section">
            <ActivityPanel />
          </div>
          <div class="ide-divider-h" />
          <div class="ide-chat-section">
            <ChatPanel
              :streaming-content="streamingContent"
              @send-start="handleWorkStart"
              @send-failed="handleWorkFailed"
            />
          </div>
        </aside>
      </template>

      <template v-else>
        <div class="ide-mobile-content">
          <ChatPanel
            :streaming-content="streamingContent"
            :show-workspace-toggle="true"
            :mobile-input-mode="isMobile"
            @send-start="handleWorkStart"
            @send-failed="handleWorkFailed"
            @open-workspace="openMobileWorkspace"
            @exit-ide="emit('exit')"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ide-root {
  --ide-bg: #0a0e1a;
  --ide-bg2: #0f1525;
  --ide-border: rgba(255, 255, 255, 0.08);
  --ide-border-soft: rgba(255, 255, 255, 0.04);
  --ide-text: rgba(255, 255, 255, 0.88);
  --ide-dim: rgba(255, 255, 255, 0.6);
  --ide-dim-2: rgba(255, 255, 255, 0.45);
  --ide-dim-3: rgba(255, 255, 255, 0.25);
  --ide-dim-4: rgba(255, 255, 255, 0.12);
  --ide-accent: #6366f1;
  --ide-accent-soft: rgba(99, 102, 241, 0.1);
  --ide-accent-soft-strong: rgba(99, 102, 241, 0.15);
  --ide-accent-border: rgba(99, 102, 241, 0.3);
  --ide-accent-border-strong: rgba(99, 102, 241, 0.7);
  --ide-accent-text: #a5b4fc;
  --ide-info-soft: rgba(96, 165, 250, 0.08);
  --ide-info-text: #60a5fa;
  --ide-success-soft: rgba(52, 211, 153, 0.1);
  --ide-success-soft-strong: rgba(52, 211, 153, 0.2);
  --ide-success-border: rgba(52, 211, 153, 0.35);
  --ide-success-border-strong: rgba(52, 211, 153, 0.6);
  --ide-success-text: rgba(52, 211, 153, 0.95);
  --ide-warning-soft: rgba(251, 191, 36, 0.1);
  --ide-warning-soft-strong: rgba(251, 191, 36, 0.2);
  --ide-warning-border: rgba(251, 191, 36, 0.35);
  --ide-warning-border-strong: rgba(251, 191, 36, 0.5);
  --ide-warning-text: rgba(251, 191, 36, 0.9);
  --ide-danger-soft: rgba(248, 113, 113, 0.1);
  --ide-danger-soft-strong: rgba(248, 113, 113, 0.14);
  --ide-danger-text: #f87171;
  --ide-hover: rgba(255, 255, 255, 0.06);
  --ide-hover-strong: rgba(255, 255, 255, 0.1);
  --ide-surface: rgba(255, 255, 255, 0.04);
  --ide-surface-2: rgba(255, 255, 255, 0.06);
  --ide-surface-3: rgba(255, 255, 255, 0.08);
  --ide-code-bg: rgba(0, 0, 0, 0.15);
  --ide-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  --ide-scrollbar: rgba(255, 255, 255, 0.1);
  --ide-scrollbar-soft: rgba(255, 255, 255, 0.08);
  --ide-input-bg: rgba(255, 255, 255, 0.04);
  --ide-input-border: rgba(255, 255, 255, 0.08);
  --ide-preview-bg: #ffffff;
  --ide-tag-bg: rgba(99, 102, 241, 0.15);
  --ide-tag-text: rgba(99, 102, 241, 0.8);
  --ide-tool-read: #60a5fa;
  --ide-tool-write: #34d399;
  --ide-tool-edit: #fbbf24;
  --ide-tool-delete: #f87171;
  --ide-tool-glob: #a78bfa;
  --ide-tool-grep: #c084fc;
  --ide-tool-setattr: #fb923c;
  --ide-tool-getattr: #38bdf8;
  --ide-tool-lore: #2dd4bf;
  --ide-tool-default: #94a3b8;

  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--ide-bg);
  color: var(--ide-text);
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  overflow: hidden;
}

.ide-root.theme-dark {
  color-scheme: dark;
}

.ide-root.theme-light {
  color-scheme: light;
  --ide-bg: #f7f7f2;
  --ide-bg2: #ffffff;
  --ide-border: rgba(15, 23, 42, 0.1);
  --ide-border-soft: rgba(15, 23, 42, 0.06);
  --ide-text: #111827;
  --ide-dim: #475467;
  --ide-dim-2: #667085;
  --ide-dim-3: #98a2b3;
  --ide-dim-4: #cbd5e1;
  --ide-accent: #4f46e5;
  --ide-accent-soft: rgba(79, 70, 229, 0.08);
  --ide-accent-soft-strong: rgba(79, 70, 229, 0.12);
  --ide-accent-border: rgba(79, 70, 229, 0.22);
  --ide-accent-border-strong: rgba(79, 70, 229, 0.55);
  --ide-accent-text: #4338ca;
  --ide-info-soft: rgba(37, 99, 235, 0.08);
  --ide-info-text: #2563eb;
  --ide-success-soft: rgba(22, 163, 74, 0.08);
  --ide-success-soft-strong: rgba(22, 163, 74, 0.16);
  --ide-success-border: rgba(22, 163, 74, 0.2);
  --ide-success-border-strong: rgba(22, 163, 74, 0.4);
  --ide-success-text: #15803d;
  --ide-warning-soft: rgba(202, 138, 4, 0.09);
  --ide-warning-soft-strong: rgba(202, 138, 4, 0.16);
  --ide-warning-border: rgba(202, 138, 4, 0.22);
  --ide-warning-border-strong: rgba(202, 138, 4, 0.45);
  --ide-warning-text: #a16207;
  --ide-danger-soft: rgba(220, 38, 38, 0.08);
  --ide-danger-soft-strong: rgba(220, 38, 38, 0.14);
  --ide-danger-text: #dc2626;
  --ide-hover: rgba(15, 23, 42, 0.05);
  --ide-hover-strong: rgba(15, 23, 42, 0.08);
  --ide-surface: rgba(15, 23, 42, 0.03);
  --ide-surface-2: rgba(15, 23, 42, 0.05);
  --ide-surface-3: rgba(15, 23, 42, 0.08);
  --ide-code-bg: rgba(15, 23, 42, 0.04);
  --ide-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
  --ide-scrollbar: rgba(148, 163, 184, 0.55);
  --ide-scrollbar-soft: rgba(148, 163, 184, 0.4);
  --ide-input-bg: #ffffff;
  --ide-input-border: rgba(15, 23, 42, 0.12);
  --ide-preview-bg: #ffffff;
  --ide-tag-bg: rgba(79, 70, 229, 0.08);
  --ide-tag-text: #4338ca;
  --ide-tool-read: #2563eb;
  --ide-tool-write: #16a34a;
  --ide-tool-edit: #ca8a04;
  --ide-tool-delete: #dc2626;
  --ide-tool-glob: #7c3aed;
  --ide-tool-grep: #9333ea;
  --ide-tool-setattr: #ea580c;
  --ide-tool-getattr: #0284c7;
  --ide-tool-lore: #0d9488;
  --ide-tool-default: #64748b;
}

.ide-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 44px;
  background: var(--ide-bg2);
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;
  z-index: 10;
}

.ide-mobile-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 8px;
  background: var(--ide-bg2);
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;
  z-index: 12;
}

.ide-mobile-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ide-mobile-subtitle {
  font-size: 11px;
  color: var(--ide-dim-2);
}

.ide-mobile-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ide-mobile-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  touch-action: manipulation;
}

.ide-mobile-icon-btn:hover {
  background: var(--ide-hover);
}

.ide-mobile-expert-btn {
  min-width: 68px;
  height: 44px;
  padding: 0 11px;
  border-radius: 14px;
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  touch-action: manipulation;
  flex-shrink: 0;
}

.ide-mobile-expert-btn.active {
  border-color: var(--ide-accent-border-strong);
  background: var(--ide-accent-soft);
  color: var(--ide-accent-text);
}

.ide-mobile-icon-btn:focus-visible,
.ide-mobile-expert-btn:focus-visible,
.ide-mobile-workspace-tabs button:focus-visible {
  outline: 2px solid var(--ide-accent-border-strong);
  outline-offset: 2px;
}

.ide-mobile-menu-backdrop {
  position: absolute;
  inset: 0;
  z-index: 40;
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  overscroll-behavior: contain;
}

.ide-mobile-menu-panel {
  width: min(88vw, 340px);
  height: 100%;
  background: var(--ide-bg2);
  border-right: 1px solid var(--ide-border);
  box-shadow: var(--ide-shadow);
  padding: calc(14px + env(safe-area-inset-top, 0px)) 12px calc(16px + env(safe-area-inset-bottom, 0px));
  overflow-y: auto;
  overflow-x: hidden;
}

.ide-mobile-menu-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.ide-mobile-menu-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ide-text);
}

.ide-mobile-menu-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ide-dim);
}

.ide-mobile-menu-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ide-mobile-menu-section + .ide-mobile-menu-section {
  margin-top: 18px;
}

.ide-mobile-section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--ide-dim-3);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.ide-mobile-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ide-mobile-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-dim);
  font-size: 12px;
  cursor: pointer;
}

.ide-mobile-chip.active {
  border-color: var(--ide-accent-border-strong);
  background: var(--ide-accent-soft);
  color: var(--ide-accent-text);
}

.ide-mobile-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.ide-mobile-action-card {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-text);
  cursor: pointer;
  text-align: left;
}

.ide-mobile-action-card.active {
  border-color: var(--ide-accent-border-strong);
  background: var(--ide-accent-soft);
  color: var(--ide-accent-text);
}

.ide-mobile-menu-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ide-mobile-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--ide-border);
  background: var(--ide-surface);
  color: var(--ide-text);
  cursor: pointer;
}

.ide-mobile-list-main {
  min-width: 0;
  flex: 1;
  text-align: left;
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
  transition: opacity 0.22s ease;
}

.mobile-menu-enter-active .ide-mobile-menu-panel,
.mobile-menu-leave-active .ide-mobile-menu-panel {
  transition: transform 0.22s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
  opacity: 0;
}

.mobile-menu-enter-from .ide-mobile-menu-panel,
.mobile-menu-leave-to .ide-mobile-menu-panel {
  transform: translateX(-16px);
}

.ide-mobile-workspace-backdrop {
  position: absolute;
  inset: 0;
  z-index: 38;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  overscroll-behavior: contain;
}

.ide-mobile-workspace-panel {
  width: 100%;
  max-width: none;
  height: 100%;
  background: var(--ide-bg2);
  border-right: none;
  box-shadow: var(--ide-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: contain;
}

.ide-mobile-workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 12px 10px;
  border-bottom: 1px solid var(--ide-border);
}

.ide-mobile-workspace-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ide-text);
}

.ide-mobile-workspace-subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--ide-dim);
}

.ide-mobile-workspace-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  padding: 8px 8px 0;
  border-bottom: 1px solid var(--ide-border);
  background: color-mix(in srgb, var(--ide-bg2) 84%, var(--ide-surface));
}

.ide-mobile-workspace-tabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  border: none;
  border-radius: 12px 12px 0 0;
  background: transparent;
  color: var(--ide-dim-2);
  font-size: 13px;
  cursor: pointer;
  touch-action: manipulation;
}

.ide-mobile-workspace-tabs button.active {
  background: var(--ide-bg);
  color: var(--ide-accent);
  box-shadow: inset 0 1px 0 var(--ide-border);
}

.ide-mobile-workspace-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--ide-bg);
}

.ide-mobile-workspace-pane {
  height: 100%;
}

.mobile-workspace-enter-active,
.mobile-workspace-leave-active {
  transition: opacity 0.22s ease;
}

.mobile-workspace-enter-active .ide-mobile-workspace-panel,
.mobile-workspace-leave-active .ide-mobile-workspace-panel {
  transition: transform 0.22s ease;
}

.mobile-workspace-enter-from,
.mobile-workspace-leave-to {
  opacity: 0;
}

.mobile-workspace-enter-from .ide-mobile-workspace-panel,
.mobile-workspace-leave-to .ide-mobile-workspace-panel {
  transform: translateX(-18px);
}

.ide-work-toast-layer {
  position: absolute;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, calc(100% - 32px));
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 30;
  pointer-events: none;
}

.ide-work-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--ide-border);
  background: var(--ide-bg2);
  color: var(--ide-text);
  box-shadow: var(--ide-shadow);
  backdrop-filter: blur(12px);
}

.ide-work-toast.is-working {
  border-color: var(--ide-accent-border);
  background: color-mix(in srgb, var(--ide-bg2) 84%, var(--ide-accent-soft));
  color: var(--ide-accent-text);
}

.ide-work-toast.is-done {
  border-color: var(--ide-success-border);
  background: color-mix(in srgb, var(--ide-bg2) 84%, var(--ide-success-soft));
  color: var(--ide-success-text);
}

.ide-work-toast :deep(svg) {
  flex-shrink: 0;
}

.work-toast-enter-active,
.work-toast-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.work-toast-enter-from,
.work-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.ide-brand {
  font-size: 15px;
  font-weight: 700;
  color: var(--ide-accent);
  margin-right: 8px;
}

.ide-area-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border: 1px solid var(--ide-border);
  border-radius: 7px;
  background: var(--ide-surface);
}

.ide-area-tabs button {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--ide-dim-2);
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
}

.ide-area-tabs button:hover {
  color: var(--ide-text);
  background: var(--ide-hover);
}

.ide-area-tabs button.active {
  color: var(--ide-success-text);
  background: var(--ide-success-soft);
}

.ide-btn {
  height: 32px;
  padding: 0 10px;
  border-radius: 5px;
  border: none;
  background: transparent;
  color: var(--ide-dim-2);
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  font-size: 13px;
}

.ide-btn:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.ide-exit {
  color: var(--ide-danger-text);
}

.ide-exit:hover {
  background: var(--ide-danger-soft);
  color: var(--ide-danger-text);
}

.ide-ejs-on {
  color: var(--ide-success-text);
}

.ide-ejs-on:hover {
  background: var(--ide-success-soft);
}

.ide-theme-btn {
  border: 1px solid var(--ide-accent-border);
  background: var(--ide-accent-soft);
  color: var(--ide-accent-text);
}

.ide-theme-btn:hover {
  background: var(--ide-accent-soft-strong);
  color: var(--ide-text);
}

.ide-theme-btn.is-light {
  border-color: var(--ide-warning-border);
  background: var(--ide-warning-soft);
  color: var(--ide-warning-text);
}

.ide-theme-btn.is-light:hover {
  background: var(--ide-warning-soft-strong);
}

.ide-audio-btn {
  border: 1px solid var(--ide-success-border);
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
}

.ide-audio-btn:hover {
  background: var(--ide-success-soft-strong);
  color: var(--ide-text);
}

.ide-audio-btn.is-muted {
  border-color: var(--ide-warning-border);
  background: var(--ide-warning-soft);
  color: var(--ide-warning-text);
}

.ide-audio-btn.is-muted:hover {
  background: var(--ide-warning-soft-strong);
}

.ide-btn-label {
  font-size: 12px;
  font-weight: 600;
}

.ide-spacer {
  flex: 1;
}

.ide-dropdown-wrap {
  position: relative;
}

.ide-dropdown-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid var(--ide-border);
  background: transparent;
  color: var(--ide-dim-2);
  font-size: 13px;
  cursor: pointer;
}

.ide-dropdown-btn:hover {
  background: var(--ide-surface);
  color: var(--ide-text);
}

.ide-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 4px;
  min-width: 200px;
  max-height: 500px;
  overflow-y: auto;
  background: var(--ide-bg2);
  border: 1px solid var(--ide-border);
  border-radius: 8px;
  box-shadow: var(--ide-shadow);
  z-index: 100;
  padding: 4px 0;
}

.ide-dropdown-wide {
  min-width: 280px;
}

.ide-dropdown::-webkit-scrollbar {
  width: 4px;
}

.ide-dropdown::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar);
  border-radius: 2px;
}

.ide-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ide-dim);
  border-bottom: 1px solid var(--ide-border);
}

.ide-dropdown-close {
  background: transparent;
  border: none;
  color: var(--ide-dim-2);
  cursor: pointer;
  padding: 2px;
  border-radius: 3px;
  display: flex;
}

.ide-dropdown-close:hover {
  color: var(--ide-text);
  background: var(--ide-hover-strong);
}

.ide-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  font-size: 13px;
  color: var(--ide-dim-2);
  cursor: pointer;
}

.ide-dropdown-item:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.ide-dropdown-item.active {
  color: var(--ide-accent);
}

.ide-toggle-on,
.ide-toggle-off {
  display: flex;
  align-items: center;
}

.ide-toggle-on {
  color: var(--ide-success-text);
}

.ide-toggle-off {
  color: var(--ide-dim-3);
}

.ide-tag-current {
  margin-left: auto;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  background: var(--ide-tag-bg);
  color: var(--ide-tag-text);
}

.ide-dropdown-section {
  padding: 8px 14px 4px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--ide-dim-3);
}

.ide-dropdown-divider {
  height: 1px;
  background: var(--ide-border);
  margin: 4px 0;
}

.ide-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.ide-sidebar {
  width: 260px;
  flex-shrink: 0;
  overflow: hidden;
  background: var(--ide-bg);
}

.ide-divider-v {
  width: 1px;
  background: var(--ide-border);
  flex-shrink: 0;
}

.ide-divider-h {
  height: 1px;
  background: var(--ide-border);
  flex-shrink: 0;
}

.ide-editor {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.ide-right {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ide-bg);
}

.ide-activity-section {
  height: 200px;
  flex-shrink: 0;
  overflow: hidden;
}

.ide-chat-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ide-mobile-content {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

@media (max-width: 768px) {
  .ide-brand {
    margin-right: 0;
    font-size: 14px;
  }

  .ide-work-toast-layer {
    top: calc(66px + env(safe-area-inset-top, 0px));
    width: min(320px, calc(100% - 24px));
  }
}
</style>
