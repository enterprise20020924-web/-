<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useChatStore } from '../../stores/chat';

const props = defineProps<{
  streamingContent?: string;
}>();

const chatStore = useChatStore();
const chatBodyRef = ref<HTMLElement | null>(null);
const editingId = ref<number | null>(null);
const editText = ref('');

function scrollToBottom() {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
    }
  });
}

onMounted(() => {
  chatStore.refreshMessages();
  scrollToBottom();
});

watch(() => chatStore.messages.length, scrollToBottom);
watch(() => props.streamingContent, scrollToBottom);

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatStore.sendMessage();
  }
}

interface MessageSection {
  type: 'thinking' | 'content' | 'toolcall' | 'text';
  text: string;
  defaultOpen: boolean;
}

function parseMessageSections(content: string): MessageSection[] {
  const sections: MessageSection[] = [];
  if (!content) return sections;

  let remaining = content;

  while (remaining.length > 0) {
    const thinkRe = /\[(?:metacognition|love_qkll)\]([\s\S]*?)(?:\n<\/thinking>|(?=<content>))/;
    const toolRe = /<details>\s*<summary>Tool calls:[\s\S]*?<\/details>/;
    const contentRe = /<content>([\s\S]*?)<\/content>/;

    const thinkMatch = remaining.match(thinkRe);
    const toolMatch = remaining.match(toolRe);
    const contentMatch = remaining.match(contentRe);

    type EarliestInfo = {
      type: MessageSection['type'];
      match: RegExpMatchArray;
      defaultOpen: boolean;
    };

    let earliest: EarliestInfo | null = null;

    if (thinkMatch && thinkMatch.index !== undefined) {
      earliest = { type: 'thinking', match: thinkMatch, defaultOpen: false };
    }
    if (toolMatch && toolMatch.index !== undefined) {
      if (!earliest || toolMatch.index < earliest.match.index!) {
        earliest = { type: 'toolcall', match: toolMatch, defaultOpen: false };
      }
    }
    if (contentMatch && contentMatch.index !== undefined) {
      if (!earliest || contentMatch.index < earliest.match.index!) {
        earliest = { type: 'content', match: contentMatch, defaultOpen: true };
      }
    }

    if (!earliest) {
      const trimmed = remaining.trim();
      if (trimmed) {
        sections.push({ type: 'text', text: trimmed, defaultOpen: true });
      }
      break;
    }

    const beforeText = remaining.slice(0, earliest.match.index!).trim();
    if (beforeText) {
      sections.push({ type: 'text', text: beforeText, defaultOpen: true });
    }

    let sectionText = '';
    if (earliest.type === 'thinking') {
      sectionText = earliest.match[1]?.trim() || earliest.match[0].trim();
    } else if (earliest.type === 'content') {
      sectionText = earliest.match[1]?.trim() || '';
    } else {
      sectionText = earliest.match[0];
    }

    if (sectionText) {
      sections.push({
        type: earliest.type,
        text: sectionText,
        defaultOpen: earliest.defaultOpen,
      });
    }

    remaining = remaining.slice(earliest.match.index! + earliest.match[0].length);
  }

  if (sections.length === 0 && content.trim()) {
    sections.push({ type: 'text', text: content.trim(), defaultOpen: true });
  }

  return sections;
}

function sectionIcon(type: MessageSection['type']): string {
  switch (type) {
    case 'thinking':
      return '思';
    case 'content':
      return '答';
    case 'toolcall':
      return '工';
    default:
      return '文';
  }
}

function sectionLabel(type: MessageSection['type']): string {
  switch (type) {
    case 'thinking':
      return '思维链';
    case 'content':
      return '正文';
    case 'toolcall':
      return '工具调用';
    default:
      return '内容';
  }
}

const sectionStates: Record<string, boolean> = reactive({});

function getSectionKey(msgId: number, idx: number): string {
  return `${msgId}-${idx}`;
}

function isSectionOpen(msgId: number, idx: number, defaultOpen: boolean): boolean {
  const key = getSectionKey(msgId, idx);
  if (key in sectionStates) return sectionStates[key];
  return defaultOpen;
}

function toggleSection(msgId: number, idx: number, defaultOpen: boolean) {
  const key = getSectionKey(msgId, idx);
  const current = key in sectionStates ? sectionStates[key] : defaultOpen;
  sectionStates[key] = !current;
}

function startEdit(msgId: number, content: string) {
  editingId.value = msgId;
  editText.value = content;
}

async function saveEdit(msgId: number) {
  if (!editText.value.trim()) return;
  try {
    await setChatMessages([{ message_id: msgId, message: editText.value }]);
    editingId.value = null;
    chatStore.refreshMessages();
    toastr.success('消息已修改');
  } catch (e) {
    toastr.error(`修改失败: ${e}`);
  }
}

function cancelEdit() {
  editingId.value = null;
}

async function deleteMsg(msgId: number) {
  try {
    await deleteChatMessages([msgId]);
    chatStore.refreshMessages();
    toastr.success('消息已删除');
  } catch (e) {
    toastr.error(`删除失败: ${e}`);
  }
}

async function regenerate() {
  try {
    await triggerSlash('/continue');
    chatStore.refreshMessages();
  } catch (e) {
    toastr.error(`继续生成失败: ${e}`);
  }
}

async function triggerGenerate() {
  try {
    await triggerSlash('/trigger');
    setTimeout(() => chatStore.refreshMessages(), 1000);
  } catch (e) {
    toastr.error(`触发回复失败: ${e}`);
  }
}

function attachFile() {
  try {
    const parentDoc = window.parent?.document;
    if (!parentDoc) {
      toastr.warning('无法访问酒馆主页');
      return;
    }

    const fileInput =
      parentDoc.querySelector('#file_form_input')
      || parentDoc.querySelector('input[type="file"][id*="file"]')
      || parentDoc.querySelector('.file_form input[type="file"]');

    if (fileInput) {
      (fileInput as HTMLInputElement).click();
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.txt,.json,.yaml,.yml,.md,.csv';
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.type.startsWith('image/')) {
        toastr.info(`已选择图片: ${file.name}`);
      } else {
        const text = await file.text();
        chatStore.inputText += `\n[附加文件: ${file.name}]\n${text}`;
        toastr.success(`已附加文件内容: ${file.name}`);
      }

      input.remove();
    });

    document.body.appendChild(input);
    input.click();
  } catch (e) {
    toastr.error(`附加文件失败: ${e}`);
  }
}
</script>

<template>
  <div class="chat-panel">
    <div ref="chatBodyRef" class="cp-messages">
      <div v-if="chatStore.messages.length === 0" class="cp-empty">暂无消息</div>

      <div
        v-for="msg in chatStore.messages"
        :key="msg.messageId"
        class="cp-msg"
        :class="[`cp-msg-${msg.role}`]"
      >
        <div class="cp-msg-header">
          <SvgIcons :name="msg.role === 'assistant' ? 'bot' : msg.role === 'user' ? 'user' : 'settings'" :size="12" />
          <span class="cp-msg-name">{{ msg.name || msg.role }}</span>
          <span class="cp-msg-id">#{{ msg.messageId }}</span>
          <div class="cp-msg-actions">
            <button class="cp-action-btn" title="编辑消息" @click="startEdit(msg.messageId, msg.content)">
              <SvgIcons name="edit" :size="11" />
            </button>
            <button class="cp-action-btn" title="删除消息" @click="deleteMsg(msg.messageId)">
              <SvgIcons name="trash" :size="11" />
            </button>
          </div>
        </div>

        <template v-if="editingId === msg.messageId">
          <textarea v-model="editText" class="cp-edit-area" rows="5" />
          <div class="cp-edit-btns">
            <button class="cp-edit-save" @click="saveEdit(msg.messageId)">保存</button>
            <button class="cp-edit-cancel" @click="cancelEdit">取消</button>
          </div>
        </template>

        <template v-else>
          <div
            v-for="(section, idx) in parseMessageSections(msg.content)"
            :key="idx"
            class="cp-section"
            :class="[`cp-section-${section.type}`]"
          >
            <div class="cp-section-header" @click="toggleSection(msg.messageId, idx, section.defaultOpen)">
              <span class="cp-section-icon">{{ sectionIcon(section.type) }}</span>
              <span class="cp-section-label">{{ sectionLabel(section.type) }}</span>
              <span v-if="!isSectionOpen(msg.messageId, idx, section.defaultOpen)" class="cp-section-preview">
                {{ section.text.slice(0, 80) }}{{ section.text.length > 80 ? '...' : '' }}
              </span>
              <span class="cp-section-toggle">
                {{ isSectionOpen(msg.messageId, idx, section.defaultOpen) ? '收起' : '展开' }}
              </span>
            </div>
            <div
              v-if="isSectionOpen(msg.messageId, idx, section.defaultOpen)"
              class="cp-section-body"
              :class="{ 'cp-section-body-tool': section.type === 'toolcall' }"
            >{{ section.text }}</div>
          </div>
        </template>
      </div>

      <div v-if="props.streamingContent" class="cp-msg cp-msg-assistant cp-msg-streaming">
        <div class="cp-msg-header">
          <SvgIcons name="bot" :size="12" />
          <span class="cp-msg-name">AI 生成中...</span>
        </div>
        <div class="cp-msg-body">{{ props.streamingContent }}</div>
      </div>
    </div>

    <div class="cp-bottom-bar">
      <div class="cp-quick-actions">
        <button class="cp-quick-btn" title="继续生成" @click="regenerate">
          <SvgIcons name="refresh" :size="12" />
          <span>继续</span>
        </button>
        <button class="cp-quick-btn" title="触发 AI 回复" @click="triggerGenerate">
          <SvgIcons name="send" :size="12" />
          <span>触发回复</span>
        </button>
      </div>

      <div class="cp-input-bar">
        <button class="cp-attach" title="附加文件" @click="attachFile">
          <SvgIcons name="upload" :size="14" />
        </button>
        <textarea
          v-model="chatStore.inputText"
          class="cp-input"
          placeholder="输入消息..."
          spellcheck="false"
          @keydown="handleKeydown"
        />
        <button
          class="cp-send"
          :disabled="chatStore.isSending || !chatStore.inputText.trim()"
          @click="chatStore.sendMessage"
        >
          <SvgIcons name="send" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--ide-bg);
}

.cp-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cp-messages::-webkit-scrollbar {
  width: 4px;
}

.cp-messages::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar-soft);
  border-radius: 2px;
}

.cp-empty {
  text-align: center;
  color: var(--ide-dim-3);
  font-size: 13px;
  padding: 20px;
}

.cp-msg {
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 1.6;
}

.cp-msg-user {
  background: var(--ide-accent-soft);
  border: 1px solid var(--ide-accent-border);
}

.cp-msg-assistant {
  background: var(--ide-success-soft);
  border: 1px solid var(--ide-success-border);
}

.cp-msg-system {
  background: var(--ide-surface);
  border: 1px solid var(--ide-border);
}

.cp-msg-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
  color: var(--ide-dim-2);
}

.cp-msg-name {
  font-size: 12px;
  font-weight: 600;
}

.cp-msg-id {
  font-size: 10px;
  color: var(--ide-dim-3);
}

.cp-msg-actions {
  margin-left: auto;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.cp-msg:hover .cp-msg-actions {
  opacity: 1;
}

.cp-action-btn {
  background: transparent;
  border: none;
  color: var(--ide-dim-3);
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  display: flex;
  align-items: center;
}

.cp-action-btn:hover {
  color: var(--ide-text);
  background: var(--ide-hover);
}

.cp-msg-body {
  color: var(--ide-text);
  white-space: pre-wrap;
  word-break: break-word;
}

.cp-section {
  margin-top: 2px;
  border-radius: 6px;
  overflow: hidden;
}

.cp-section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
  transition: background 0.15s;
}

.cp-section-header:hover {
  background: var(--ide-hover);
}

.cp-section-icon {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  background: var(--ide-surface-2);
  color: var(--ide-dim);
}

.cp-section-label {
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.cp-section-preview {
  font-size: 12px;
  color: var(--ide-dim-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.cp-section-toggle {
  font-size: 11px;
  color: var(--ide-dim-3);
  flex-shrink: 0;
  margin-left: auto;
}

.cp-section-thinking .cp-section-header {
  background: var(--ide-info-soft);
}

.cp-section-thinking .cp-section-label,
.cp-section-thinking .cp-section-icon {
  color: var(--ide-info-text);
}

.cp-section-thinking .cp-section-body {
  color: var(--ide-dim);
  font-size: 13px;
  font-style: italic;
}

.cp-section-content .cp-section-header {
  background: var(--ide-success-soft);
}

.cp-section-content .cp-section-label,
.cp-section-content .cp-section-icon {
  color: var(--ide-success-text);
}

.cp-section-toolcall .cp-section-header {
  background: var(--ide-warning-soft);
}

.cp-section-toolcall .cp-section-label,
.cp-section-toolcall .cp-section-icon {
  color: var(--ide-warning-text);
}

.cp-section-text .cp-section-header {
  background: transparent;
}

.cp-section-text .cp-section-label {
  color: var(--ide-dim-2);
}

.cp-section-body {
  padding: 6px 8px 8px 28px;
  color: var(--ide-text);
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.7;
  max-height: 600px;
  overflow-y: auto;
}

.cp-section-body::-webkit-scrollbar {
  width: 3px;
}

.cp-section-body::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar);
  border-radius: 2px;
}

.cp-section-body-tool {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--ide-warning-text);
  background: var(--ide-code-bg);
  border-radius: 6px;
  margin: 4px 8px 4px 28px;
  padding: 8px 10px;
}

.cp-msg-streaming {
  border-color: var(--ide-warning-border);
  animation: streamPulse 1.5s ease-in-out infinite;
}

@keyframes streamPulse {
  0%,
  100% {
    border-color: var(--ide-warning-border);
  }

  50% {
    border-color: var(--ide-warning-border-strong);
  }
}

.cp-edit-area {
  width: 100%;
  padding: 6px 8px;
  background: var(--ide-input-bg);
  border: 1px solid var(--ide-accent-border);
  border-radius: 6px;
  color: var(--ide-text);
  font-size: 13px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.cp-edit-btns {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.cp-edit-save,
.cp-edit-cancel {
  padding: 3px 10px;
  border-radius: 4px;
  border: none;
  font-size: 12px;
  cursor: pointer;
}

.cp-edit-save {
  background: var(--ide-success-soft-strong);
  color: var(--ide-success-text);
}

.cp-edit-save:hover {
  background: var(--ide-success-soft);
}

.cp-edit-cancel {
  background: var(--ide-surface-2);
  color: var(--ide-dim);
}

.cp-edit-cancel:hover {
  background: var(--ide-hover-strong);
}

.cp-bottom-bar {
  flex-shrink: 0;
  border-top: 1px solid var(--ide-border);
  background: var(--ide-code-bg);
}

.cp-quick-actions {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--ide-border-soft);
}

.cp-quick-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 4px;
  border: none;
  background: var(--ide-surface);
  color: var(--ide-dim);
  font-size: 11px;
  cursor: pointer;
}

.cp-quick-btn:hover {
  background: var(--ide-surface-3);
  color: var(--ide-text);
}

.cp-input-bar {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 6px 8px;
}

.cp-input {
  flex: 1;
  background: var(--ide-input-bg);
  border: 1px solid var(--ide-input-border);
  border-radius: 6px;
  color: var(--ide-text);
  padding: 8px 10px;
  font-size: 14px;
  resize: none;
  outline: none;
  min-height: 36px;
  max-height: 140px;
  font-family: inherit;
  line-height: 1.5;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .cp-input {
    max-height: 80px;
  }
}

.cp-input::placeholder {
  color: var(--ide-dim-3);
}

.cp-input:focus {
  border-color: var(--ide-accent-border-strong);
}

.cp-send {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--ide-accent-border);
  background: var(--ide-accent-soft);
  color: var(--ide-accent-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.cp-attach {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--ide-input-border);
  background: var(--ide-surface);
  color: var(--ide-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}

.cp-attach:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
  border-color: var(--ide-border);
}

.cp-send:hover:not(:disabled) {
  background: var(--ide-accent-soft-strong);
  border-color: var(--ide-accent-border-strong);
}

.cp-send:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
