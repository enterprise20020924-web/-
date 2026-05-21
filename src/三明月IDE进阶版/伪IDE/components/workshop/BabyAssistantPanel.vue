<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useChatStore } from '../../stores/chat';
import { useWorkshopStore } from '../../stores/workshop';
import { usePresetStore } from '../../stores/preset';
import qiuqingziChibi from '../../assets/qiuqingzi-chibi.png?url';
import {
  BABY_KNOWLEDGE_WORLDBOOK,
  buildBabyAssistantPrompt,
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
  await presetStore.activateWriteMode(workshopStore.selectedTaskPresetRefs);
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

onMounted(refreshContextStats);
watch(() => chatStore.messages.length, refreshContextStats);
</script>

<template>
  <section class="baby-assistant-panel">
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
</style>
