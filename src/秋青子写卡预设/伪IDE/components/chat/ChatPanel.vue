<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useChatStore } from '../../stores/chat';
import { extractPlanProtocolDisplayBlocks } from '../../utils/plan-protocol';

const props = defineProps<{
  streamingContent?: string;
  showWorkspaceToggle?: boolean;
  mobileInputMode?: boolean;
}>();

const emit = defineEmits<{
  sendStart: [];
  sendFailed: [];
  openWorkspace: [];
  exitIde: [];
}>();

const chatStore = useChatStore();
const chatBodyRef = ref<HTMLElement | null>(null);
const editingId = ref<number | null>(null);
const editText = ref('');
const expandedMobileMessageId = ref<number | null>(null);
const MOBILE_COLLAPSED_MESSAGE_LIMIT = 2;

const visibleChatMessages = computed(() => {
  if (!props.mobileInputMode) return chatStore.messages;
  if (expandedMobileMessageId.value !== null) {
    const expanded = chatStore.messages.find(message => message.messageId === expandedMobileMessageId.value);
    if (expanded) return [expanded];
  }
  return chatStore.messages.slice(-MOBILE_COLLAPSED_MESSAGE_LIMIT);
});

const hiddenMobileMessageCount = computed(() => {
  if (!props.mobileInputMode || expandedMobileMessageId.value !== null) return 0;
  return Math.max(0, chatStore.messages.length - MOBILE_COLLAPSED_MESSAGE_LIMIT);
});

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
watch(() => chatStore.messages.map(message => message.messageId).join(','), () => {
  if (
    expandedMobileMessageId.value !== null
    && !chatStore.messages.some(message => message.messageId === expandedMobileMessageId.value)
  ) {
    expandedMobileMessageId.value = null;
  }
});

async function requestSendMessage() {
  if (chatStore.isSending || !chatStore.inputText.trim()) return;

  emit('sendStart');
  const ok = await chatStore.sendMessage();
  if (!ok) {
    emit('sendFailed');
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (!props.mobileInputMode && e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void requestSendMessage();
  }
}

function isMobileMessageExpanded(messageId: number) {
  return props.mobileInputMode && expandedMobileMessageId.value === messageId;
}

function isMobileMessageCollapsed(messageId: number) {
  return props.mobileInputMode && editingId.value !== messageId && !isMobileMessageExpanded(messageId);
}

function toggleMobileMessage(messageId: number) {
  if (!props.mobileInputMode) return;
  expandedMobileMessageId.value = expandedMobileMessageId.value === messageId ? null : messageId;
  nextTick(() => {
    if (!chatBodyRef.value) return;
    chatBodyRef.value.scrollTop = expandedMobileMessageId.value === null
      ? chatBodyRef.value.scrollHeight
      : 0;
  });
}

function mobileMessagePreview(content: string) {
  return content
    .replace(/<details>[\s\S]*?<\/details>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, match => match.replace(/```[^\n]*\n?|\n?```/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150) || '这一层暂无可预览正文';
}

interface MessageSection {
  type: 'thinking' | 'content' | 'toolcall' | 'protocol' | 'code' | 'text';
  text: string;
  defaultOpen: boolean;
  label?: string;
  preview?: string;
  kind?: 'protocol' | 'write' | 'variables' | 'config' | 'body' | 'code';
  language?: string;
}

interface FencedBlock {
  index: number;
  raw: string;
  language: string;
  body: string;
}

function classifyStructuredBlock(text: string, language: string): NonNullable<MessageSection['kind']> {
  const lang = language.trim().toLowerCase();
  const normalized = text.trim();
  const hasExplicitCodeLanguage = ['js', 'javascript', 'ts', 'typescript', 'html', 'css', 'scss', 'vue', 'python', 'bash', 'sh'].includes(lang);
  if (/"schema"\s*:\s*"mingyue\.(?:plan_(?:draft|checkpoint|update|artifact_delta)|write_plan)\.v2"/i.test(normalized)) {
    return 'protocol';
  }
  if (
    /"tool"\s*:\s*"(?:Write|SetAttribute|CreateLorebook|Edit)"/i.test(normalized)
    || /"targetPath"\s*:/i.test(normalized)
    || /"target_path"\s*:/i.test(normalized)
    || /^\s*-\s*(?:tool|targetPath|target_path|summary|riskLevel|risk_level)\s*:/im.test(normalized)
  ) {
    return 'write';
  }
  if (
    /(?:变量更新规则|变量输出格式|变量列表|初始变量|initvar|stat_data|status_current_variables|mvu)/i.test(normalized)
    || /^\s*(?:变量[\u4e00-\u9fa5\w-]*|好感度|心情|阶段|关系|位置|状态)\s*[:：]/m.test(normalized)
  ) {
    return 'variables';
  }
  if (lang === 'yaml' || lang === 'yml' || lang === 'json') return 'config';
  if (!hasExplicitCodeLanguage && isBodyLikeBlock(normalized)) return 'body';
  return 'code';
}

function codeSectionLabel(language: string, kind: NonNullable<MessageSection['kind']>) {
  if (kind === 'protocol') return '计划协议原文';
  if (kind === 'write') return '写入动作 / 属性';
  if (kind === 'variables') return '变量 / MVU 配置';
  if (kind === 'body') return '正文内容';
  const lang = language.trim().toLowerCase();
  if (lang === 'yaml' || lang === 'yml') return 'YAML 内容';
  if (lang === 'json') return 'JSON 内容';
  if (lang === 'ts' || lang === 'typescript') return 'TypeScript 代码';
  if (lang === 'html') return 'HTML 内容';
  if (lang === 'css' || lang === 'scss') return '样式内容';
  return lang ? `${lang.toUpperCase()} 内容` : '代码块';
}

function isBodyLikeBlock(text: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0;
  const hasCustomBodyTag = /^<{1,2}[\u4e00-\u9fa5\w-]+(?:_[\u4e00-\u9fa5\w-]+)*>{1,2}[\s\S]*<\/[\u4e00-\u9fa5\w-]+>/m.test(text);
  const hasNarrativeMarkers = /(?:世界观|角色|国家|规则|背景|剧情|正文|条目|设定|开场白|片段|摘要)[:：]/.test(text);
  const looksLikeSourceCode = /^\s*(?:import|export|const|let|var|function|class|interface|type|return|if|for|while|<\/?[a-z][\w-]*(?:\s|>|\/>))/im.test(text);
  return !looksLikeSourceCode && (hasCustomBodyTag || hasNarrativeMarkers || (lines.length >= 3 && chineseChars >= 24));
}

function findNextFencedBlock(text: string): FencedBlock | null {
  const open = text.match(/```([^\s`]*)[ \t]*(?:\r?\n|$)/);
  if (!open || open.index === undefined) return null;
  const bodyStart = open.index + open[0].length;
  const closeIndex = text.indexOf('```', bodyStart);
  const bodyEnd = closeIndex >= 0 ? closeIndex : text.length;
  const rawEnd = closeIndex >= 0 ? closeIndex + 3 : text.length;
  return {
    index: open.index,
    raw: text.slice(open.index, rawEnd),
    language: open[1] ?? '',
    body: text.slice(bodyStart, bodyEnd),
  };
}

function parsePlainMessageSections(content: string): MessageSection[] {
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
    const codeBlock = findNextFencedBlock(remaining);

    type EarliestInfo = {
      type: Exclude<MessageSection['type'], 'code'>;
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
    if (codeBlock && (!earliest || codeBlock.index < earliest.match.index!)) {
      const beforeText = remaining.slice(0, codeBlock.index).trim();
      if (beforeText) {
        sections.push({ type: 'text', text: beforeText, defaultOpen: true });
      }
      const sectionText = codeBlock.body.trim();
      if (sectionText) {
        const kind = classifyStructuredBlock(sectionText, codeBlock.language);
        sections.push({
          type: kind === 'protocol' ? 'protocol' : kind === 'body' ? 'content' : 'code',
          text: sectionText,
          defaultOpen: kind !== 'protocol',
          label: codeSectionLabel(codeBlock.language, kind),
          preview: sectionText.replace(/\s+/g, ' ').trim(),
          kind,
          language: codeBlock.language.trim().toLowerCase(),
        });
      }
      remaining = remaining.slice(codeBlock.index + codeBlock.raw.length);
      continue;
    }

    if (!earliest) {
      const trimmed = remaining.trim();
      if (trimmed) {
        const looseKind = classifyStructuredBlock(trimmed, '');
        const lineCount = trimmed.split(/\r?\n/).filter(Boolean).length;
        if (lineCount >= 2 && looseKind !== 'code') {
          sections.push({
            type: looseKind === 'protocol' ? 'protocol' : looseKind === 'body' ? 'content' : 'code',
            text: trimmed,
            defaultOpen: looseKind !== 'protocol',
            label: codeSectionLabel('', looseKind),
            preview: trimmed.replace(/\s+/g, ' '),
            kind: looseKind,
          });
        } else {
          sections.push({ type: 'text', text: trimmed, defaultOpen: true });
        }
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

function parseMessageSections(content: string): MessageSection[] {
  const protocolBlocks = extractPlanProtocolDisplayBlocks(content);
  if (!protocolBlocks.length) return parsePlainMessageSections(content);

  const sections: MessageSection[] = [];
  let cursor = 0;

  for (const block of protocolBlocks) {
    const beforeText = content.slice(cursor, block.start);
    sections.push(...parsePlainMessageSections(beforeText));
    sections.push({
      type: 'protocol',
      text: block.raw,
      defaultOpen: false,
      label: block.title,
      preview: block.preview,
    });
    cursor = block.end;
  }

  sections.push(...parsePlainMessageSections(content.slice(cursor)));
  return sections.length ? sections : parsePlainMessageSections(content);
}

function sectionIcon(type: MessageSection['type']): string {
  switch (type) {
    case 'thinking':
      return '思';
    case 'content':
      return '答';
    case 'toolcall':
      return '工';
    case 'protocol':
      return '计';
    case 'code':
      return '{}';
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
    case 'protocol':
      return '计划协议详情';
    case 'code':
      return '代码块';
    default:
      return '内容';
  }
}

const sectionStates: Record<string, boolean> = reactive({});

function getSectionKey(msgId: number, idx: number, section: MessageSection): string {
  return `${msgId}-${idx}-${section.type}-${section.label || sectionLabel(section.type)}`;
}

function isSectionOpen(msgId: number, idx: number, section: MessageSection): boolean {
  const key = getSectionKey(msgId, idx, section);
  if (key in sectionStates) return sectionStates[key];
  return section.defaultOpen;
}

function toggleSection(msgId: number, idx: number, section: MessageSection) {
  const key = getSectionKey(msgId, idx, section);
  const current = key in sectionStates ? sectionStates[key] : section.defaultOpen;
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
  <div class="chat-panel" :class="{ 'chat-panel-mobile': props.mobileInputMode }">
    <div ref="chatBodyRef" class="cp-messages">
      <div v-if="chatStore.messages.length === 0" class="cp-empty">暂无消息</div>
      <div
        v-else-if="hiddenMobileMessageCount > 0"
        class="cp-mobile-floor-note"
      >
        已收起前 {{ hiddenMobileMessageCount }} 层，当前显示最近 {{ MOBILE_COLLAPSED_MESSAGE_LIMIT }} 层
      </div>

      <div
        v-for="msg in visibleChatMessages"
        :key="msg.messageId"
        class="cp-msg"
        :class="[
          `cp-msg-${msg.role}`,
          {
            'cp-msg-mobile-collapsed': isMobileMessageCollapsed(msg.messageId),
            'cp-msg-mobile-expanded': isMobileMessageExpanded(msg.messageId),
          },
        ]"
      >
        <div class="cp-msg-header">
          <SvgIcons :name="msg.role === 'assistant' ? 'bot' : msg.role === 'user' ? 'user' : 'settings'" :size="12" />
          <span class="cp-msg-name">{{ msg.name || msg.role }}</span>
          <span class="cp-msg-id">#{{ msg.messageId }}</span>
          <button
            v-if="props.mobileInputMode"
            class="cp-mobile-floor-toggle"
            type="button"
            @click="toggleMobileMessage(msg.messageId)"
          >
            {{ isMobileMessageExpanded(msg.messageId) ? '收起' : '展开' }}
          </button>
          <div class="cp-msg-actions">
            <button class="cp-action-btn" title="编辑消息" @click="startEdit(msg.messageId, msg.content)">
              <SvgIcons name="edit" :size="11" />
            </button>
            <button class="cp-action-btn" title="删除消息" @click="deleteMsg(msg.messageId)">
              <SvgIcons name="trash" :size="11" />
            </button>
          </div>
        </div>

        <button
          v-if="isMobileMessageCollapsed(msg.messageId)"
          class="cp-mobile-floor-card"
          type="button"
          @click="toggleMobileMessage(msg.messageId)"
        >
          <span>点击展开完整楼层</span>
          <strong>{{ mobileMessagePreview(msg.content) }}</strong>
        </button>

        <template v-else-if="editingId === msg.messageId">
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
            :class="[`cp-section-${section.type}`, section.kind ? `cp-section-kind-${section.kind}` : '']"
          >
            <div class="cp-section-header" @click="toggleSection(msg.messageId, idx, section)">
              <span class="cp-section-icon">{{ sectionIcon(section.type) }}</span>
              <span class="cp-section-label">{{ section.label || sectionLabel(section.type) }}</span>
              <span v-if="!isSectionOpen(msg.messageId, idx, section)" class="cp-section-preview">
                {{ (section.preview || section.text).slice(0, 80) }}{{ (section.preview || section.text).length > 80 ? '...' : '' }}
              </span>
              <span class="cp-section-toggle">
                {{ isSectionOpen(msg.messageId, idx, section) ? '收起' : '展开' }}
              </span>
            </div>
            <div
              v-if="isSectionOpen(msg.messageId, idx, section)"
              class="cp-section-body"
              :class="{
                'cp-section-body-tool': section.type === 'toolcall',
                'cp-section-body-code': section.type === 'code',
                'cp-section-body-readable': section.type === 'text' || section.type === 'content' || section.kind === 'body',
                'cp-section-body-structured': section.kind === 'write' || section.kind === 'variables' || section.kind === 'config',
              }"
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
        <button
          v-if="props.showWorkspaceToggle"
          class="cp-quick-btn cp-workspace-toggle"
          title="Open workspace"
          @click="emit('openWorkspace')"
        >
          <SvgIcons name="menu" :size="12" />
        </button>
        <button class="cp-quick-btn" title="继续生成" @click="regenerate">
          <SvgIcons name="refresh" :size="12" />
          <span>继续</span>
        </button>
        <button class="cp-quick-btn" title="触发 AI 回复" @click="triggerGenerate">
          <SvgIcons name="send" :size="12" />
          <span>触发回复</span>
        </button>
        <button
          v-if="props.showWorkspaceToggle"
          class="cp-quick-btn cp-quick-btn-danger"
          title="退出 IDE"
          @click="emit('exitIde')"
        >
          <SvgIcons name="x" :size="12" />
          <span>退出IDE</span>
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
          aria-label="输入聊天消息"
          enterkeyhint="enter"
          spellcheck="false"
          @keydown="handleKeydown"
        />
        <button
          class="cp-send"
          :disabled="chatStore.isSending || !chatStore.inputText.trim()"
          @click="requestSendMessage"
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
  min-height: 0;
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

.cp-mobile-floor-note {
  padding: 7px 10px;
  border: 1px dashed var(--ide-border);
  border-radius: 10px;
  color: var(--ide-dim-2);
  background: color-mix(in srgb, var(--ide-surface) 80%, transparent);
  font-size: 12px;
  text-align: center;
}

.cp-mobile-floor-toggle {
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid var(--ide-border);
  border-radius: 999px;
  background: var(--ide-surface);
  color: var(--ide-dim);
  font-size: 11px;
  cursor: pointer;
}

.cp-mobile-floor-card {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 10px;
  background: color-mix(in srgb, var(--ide-bg2) 88%, transparent);
  color: var(--ide-text);
  text-align: left;
  cursor: pointer;
}

.cp-mobile-floor-card span {
  display: block;
  margin-bottom: 4px;
  color: var(--ide-accent-text);
  font-size: 11px;
  font-weight: 700;
}

.cp-mobile-floor-card strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  color: var(--ide-dim);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.55;
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

.cp-section-kind-body .cp-section-header {
  border: 1px solid var(--ide-success-border);
  background:
    linear-gradient(135deg, var(--ide-success-soft), transparent 70%),
    var(--ide-surface);
}

.cp-section-toolcall .cp-section-header {
  background: var(--ide-warning-soft);
}

.cp-section-toolcall .cp-section-label,
.cp-section-toolcall .cp-section-icon {
  color: var(--ide-warning-text);
}

.cp-section-protocol .cp-section-header {
  background: var(--ide-info-soft);
}

.cp-section-protocol .cp-section-label,
.cp-section-protocol .cp-section-icon {
  color: var(--ide-info-text);
}

.cp-section-code .cp-section-header {
  border: 1px solid var(--ide-border-soft);
  background:
    linear-gradient(135deg, var(--ide-success-soft), transparent 72%),
    var(--ide-surface);
}

.cp-section-code .cp-section-label,
.cp-section-code .cp-section-icon {
  color: var(--ide-success-text);
}

.cp-section-kind-write .cp-section-header {
  border-color: var(--ide-warning-border);
  background:
    linear-gradient(135deg, var(--ide-warning-soft), transparent 74%),
    var(--ide-surface);
}

.cp-section-kind-write .cp-section-label,
.cp-section-kind-write .cp-section-icon {
  color: var(--ide-warning-text);
}

.cp-section-kind-variables .cp-section-header {
  border-color: var(--ide-info-text);
  background:
    linear-gradient(135deg, var(--ide-info-soft), transparent 74%),
    var(--ide-surface);
}

.cp-section-kind-variables .cp-section-label,
.cp-section-kind-variables .cp-section-icon {
  color: var(--ide-info-text);
}

.cp-section-text .cp-section-header {
  background: transparent;
}

.cp-section-text .cp-section-label {
  color: var(--ide-dim-2);
}

.cp-section-text .cp-section-header,
.cp-section-kind-body .cp-section-header {
  margin-bottom: 4px;
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

.cp-section-body-readable {
  margin: 6px 4px 10px 28px;
  padding: 12px 14px;
  border: 1px solid var(--ide-border-soft);
  border-left: 3px solid var(--ide-success-border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--ide-bg2) 84%, transparent);
  max-height: none;
  overflow-x: auto;
  overflow-y: visible;
  line-height: 1.85;
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

.cp-section-protocol .cp-section-body {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--ide-info-text);
  background: var(--ide-code-bg);
  border-radius: 6px;
  margin: 4px 8px 4px 28px;
  padding: 8px 10px;
}

.cp-section-body-code {
  font-family: 'Cascadia Code', 'Fira Code', monospace;
  font-size: 12px;
  color: var(--ide-text);
  background:
    linear-gradient(180deg, var(--ide-surface), transparent 120px),
    var(--ide-code-bg);
  border: 1px solid var(--ide-border-soft);
  border-radius: 8px;
  margin: 6px 8px 8px 28px;
  padding: 10px 12px;
  tab-size: 2;
}

.cp-section-body-structured {
  box-shadow: inset 3px 0 0 var(--ide-success-border);
}

.cp-section-kind-write .cp-section-body-structured {
  box-shadow: inset 3px 0 0 var(--ide-warning-border);
}

.cp-section-kind-variables .cp-section-body-structured {
  box-shadow: inset 3px 0 0 var(--ide-info-text);
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

.cp-workspace-toggle {
  width: 28px;
  padding: 0;
  justify-content: center;
  flex-shrink: 0;
}

.cp-quick-btn-danger {
  margin-left: auto;
  background: var(--ide-danger-soft);
  color: var(--ide-danger-text);
}

.cp-quick-btn-danger:hover {
  background: var(--ide-danger-soft-strong);
  color: var(--ide-danger-text);
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
  .cp-quick-actions {
    padding-inline: 6px;
  }

  .cp-workspace-toggle {
    width: 30px;
    border-radius: 8px;
  }

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

@media (max-width: 768px) {
  .chat-panel,
  .cp-messages,
  .cp-section-body,
  .cp-bottom-bar {
    overscroll-behavior: contain;
  }

  .chat-panel-mobile {
    height: auto;
    min-height: 0;
    overflow: visible;
  }

  .chat-panel-mobile .cp-messages {
    flex: 0 0 auto;
    min-height: 0;
    padding-bottom: 10px;
    overflow: visible;
    overscroll-behavior: auto;
    scrollbar-gutter: auto;
  }

  .chat-panel-mobile .cp-section-body {
    max-height: none;
    overflow-y: visible;
  }

  .chat-panel-mobile .cp-msg-actions {
    opacity: 1;
  }

  .chat-panel-mobile .cp-msg-mobile-collapsed {
    padding: 8px;
  }

  .chat-panel-mobile .cp-msg-mobile-expanded {
    scroll-margin-top: 12px;
  }

  .cp-bottom-bar {
    position: relative;
    z-index: 2;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .cp-quick-actions {
    gap: 8px;
    padding: 8px 10px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }

  .cp-quick-actions::-webkit-scrollbar {
    display: none;
  }

  .cp-quick-btn {
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    flex-shrink: 0;
    touch-action: manipulation;
  }

  .cp-workspace-toggle {
    width: 44px;
    min-width: 44px;
    padding: 0;
  }

  .cp-input-bar {
    gap: 8px;
    padding: 8px 10px 10px;
  }

  .cp-input {
    min-height: 44px;
    max-height: min(32vh, 140px);
    border-radius: 14px;
    font-size: 16px;
    line-height: 1.45;
  }

  .cp-send,
  .cp-attach {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    touch-action: manipulation;
  }

  .cp-input:focus-visible,
  .cp-send:focus-visible,
  .cp-attach:focus-visible,
  .cp-quick-btn:focus-visible {
    outline: 2px solid var(--ide-accent-border-strong);
    outline-offset: 2px;
  }
}
</style>
