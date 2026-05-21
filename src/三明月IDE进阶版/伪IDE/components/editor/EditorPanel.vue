<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import WbEntryProps from './WbEntryProps.vue';
import { useEditorStore } from '../../stores/editor';
import { writeVfsFile } from '../../utils/vfs-adapter';
import { useFileSystemStore } from '../../stores/fileSystem';

const editorStore = useEditorStore();
const fsStore = useFileSystemStore();
const isSaving = ref(false);

async function saveCurrentFile() {
  const tab = editorStore.activeTab;
  if (!tab || !tab.dirty) return;

  isSaving.value = true;
  try {
    const ok = await writeVfsFile(tab.path, tab.content, tab.source!, tab.meta);
    if (ok) {
      editorStore.markClean(tab.path);
      toastr.success(`已保存 ${tab.label}`);
    } else {
      toastr.warning('保存失败，文件可能是只读状态');
    }
  } catch (e) {
    toastr.error(`保存出错: ${e}`);
  } finally {
    isSaving.value = false;
  }
}

function revertFile() {
  const tab = editorStore.activeTab;
  if (!tab || !tab.dirty) return;
  editorStore.revertContent(tab.path);
  toastr.info(`已恢复 ${tab.label}`);
}

const isWbEntry = computed(() => {
  const tab = editorStore.activeTab;
  if (!tab) return false;
  return tab.source === 'worldbook' && tab.meta?.uid !== undefined && !tab.meta?.isEmpty;
});

function onWbPropsSaved() {
  fsStore.refresh();
}

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement;
  if (editorStore.activeTabPath) {
    editorStore.updateContent(editorStore.activeTabPath, target.value);
  }
}

function sourceLabel(source: string | undefined): string {
  switch (source) {
    case 'worldbook':
      return '世界书';
    case 'character':
      return '角色卡';
    case 'preset':
      return '预设';
    default:
      return '';
  }
}

type ViewMode = 'edit' | 'preview';
const viewMode = ref<ViewMode>('edit');

const isHtmlContent = computed(() => {
  const content = editorStore.activeTab?.content || '';
  return /<(?:html|!doctype|body|head|div|style|script)\b/i.test(content);
});

watch(
  () => editorStore.activeTabPath,
  () => {
    viewMode.value = 'edit';
  },
);
</script>

<template>
  <div class="editor-panel">
    <div v-if="editorStore.tabs.length > 0" class="ep-tabs">
      <div
        v-for="tab in editorStore.tabs"
        :key="tab.path"
        class="ep-tab"
        :class="{ active: editorStore.activeTabPath === tab.path }"
        :title="tab.path"
        @click="editorStore.setActive(tab.path)"
      >
        <SvgIcons name="file" :size="12" />
        <span class="ep-tab-label">{{ tab.label }}</span>
        <span v-if="tab.dirty" class="ep-tab-dirty">*</span>
        <button class="ep-tab-close" @click.stop="editorStore.closeTab(tab.path)">
          <SvgIcons name="x" :size="10" />
        </button>
      </div>
    </div>

    <div class="ep-content">
      <template v-if="editorStore.activeTab">
        <div class="ep-toolbar">
          <span class="ep-path">{{ editorStore.activeTab.path }}</span>
          <span class="ep-source-tag">{{ sourceLabel(editorStore.activeTab.source) }}</span>
          <span v-if="editorStore.activeTab.dirty" class="ep-unsaved-badge">未保存</span>

          <template v-if="isHtmlContent">
            <div class="ep-view-toggle">
              <button class="ep-view-btn" :class="{ active: viewMode === 'edit' }" @click="viewMode = 'edit'">
                编辑
              </button>
              <button class="ep-view-btn" :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'">
                预览
              </button>
            </div>
          </template>

          <span class="ep-spacer" />
          <button
            class="ep-revert-btn"
            :disabled="!editorStore.activeTab.dirty"
            title="恢复到上次保存的版本"
            @click="revertFile"
          >
            <SvgIcons name="refresh" :size="12" />
            <span>恢复</span>
          </button>
          <button
            class="ep-save-btn"
            :disabled="!editorStore.activeTab.dirty || isSaving"
            @click="saveCurrentFile"
          >
            <SvgIcons name="download" :size="12" />
            <span>{{ isSaving ? '保存中...' : '保存' }}</span>
          </button>
        </div>

        <textarea
          v-if="viewMode === 'edit'"
          class="ep-textarea"
          :value="editorStore.activeTab.content"
          spellcheck="false"
          placeholder="文件内容为空"
          @input="onInput"
        />

        <div v-else-if="viewMode === 'preview' && isHtmlContent" class="ep-preview-wrap">
          <div class="ep-preview-hint">纯静态预览，酒馆助手 API 调用不会在这里生效。</div>
          <iframe
            class="ep-preview-iframe"
            :srcdoc="editorStore.activeTab.content"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>

        <WbEntryProps
          v-if="isWbEntry"
          :worldbook="editorStore.activeTab.meta?.worldbook"
          :uid="editorStore.activeTab.meta?.uid"
          :wb-entry="editorStore.activeTab.meta?.wbEntry || {}"
          @saved="onWbPropsSaved"
        />
      </template>

      <template v-else>
        <div class="ep-empty">
          <SvgIcons name="file-code" :size="48" />
          <p>从左侧文件树中选择文件</p>
          <p class="ep-hint">点击文件即可在此处查看和编辑内容</p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--ide-bg);
}

.ep-tabs {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  border-bottom: 1px solid var(--ide-border);
  background: var(--ide-code-bg);
  flex-shrink: 0;
}

.ep-tabs::-webkit-scrollbar {
  height: 2px;
}

.ep-tabs::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar);
}

.ep-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  font-size: 13px;
  color: var(--ide-dim);
  cursor: pointer;
  white-space: nowrap;
  border-right: 1px solid var(--ide-border-soft);
  flex-shrink: 0;
  user-select: none;
}

.ep-tab:hover {
  color: var(--ide-text);
  background: var(--ide-hover);
}

.ep-tab.active {
  color: var(--ide-text);
  background: var(--ide-accent-soft);
  box-shadow: inset 0 -2px 0 var(--ide-accent-border-strong);
}

.ep-tab-label {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ep-tab-dirty {
  color: var(--ide-warning-text);
  font-weight: 700;
  font-size: 16px;
}

.ep-tab-close {
  background: transparent;
  border: none;
  color: var(--ide-dim-3);
  cursor: pointer;
  padding: 1px;
  display: flex;
  align-items: center;
  border-radius: 3px;
}

.ep-tab-close:hover {
  color: var(--ide-text);
  background: var(--ide-hover-strong);
}

.ep-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ep-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-bottom: 1px solid var(--ide-border-soft);
  flex-shrink: 0;
  background: var(--ide-surface);
}

.ep-path {
  font-size: 12px;
  color: var(--ide-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ep-source-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ide-accent-soft-strong);
  color: var(--ide-accent-text);
  flex-shrink: 0;
}

.ep-spacer {
  flex: 1;
}

.ep-unsaved-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--ide-warning-soft);
  color: var(--ide-warning-text);
  font-weight: 700;
  animation: unsavedPulse 2s ease-in-out infinite;
}

@keyframes unsavedPulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }
}

.ep-revert-btn,
.ep-save-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.ep-revert-btn {
  border: 1px solid var(--ide-warning-border);
  background: var(--ide-warning-soft);
  color: var(--ide-warning-text);
}

.ep-revert-btn:hover:not(:disabled) {
  background: var(--ide-warning-soft-strong);
  border-color: var(--ide-warning-border-strong);
}

.ep-save-btn {
  border: 1px solid var(--ide-success-border);
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
  font-weight: 700;
}

.ep-save-btn:hover:not(:disabled) {
  background: var(--ide-success-soft-strong);
  border-color: var(--ide-success-border-strong);
  box-shadow: 0 0 12px color-mix(in srgb, var(--ide-success-text) 18%, transparent);
}

.ep-revert-btn:disabled,
.ep-save-btn:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}

.ep-view-toggle {
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--ide-border);
  margin-left: 4px;
}

.ep-view-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: var(--ide-surface);
  color: var(--ide-dim);
  cursor: pointer;
  transition: all 0.15s;
}

.ep-view-btn:first-child {
  border-right: 1px solid var(--ide-border-soft);
}

.ep-view-btn:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.ep-view-btn.active {
  background: var(--ide-accent-soft-strong);
  color: var(--ide-accent-text);
}

.ep-textarea {
  flex: 1;
  width: 100%;
  padding: 14px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ide-text);
  font-family: 'Cascadia Code', 'Fira Code', 'SF Mono', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.7;
  resize: none;
  tab-size: 2;
}

.ep-textarea::placeholder {
  color: var(--ide-dim-3);
}

.ep-textarea::-webkit-scrollbar {
  width: 6px;
}

.ep-textarea::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar);
  border-radius: 3px;
}

.ep-preview-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ep-preview-hint {
  padding: 4px 14px;
  font-size: 11px;
  color: var(--ide-warning-text);
  background: var(--ide-warning-soft);
  border-bottom: 1px solid var(--ide-warning-border);
  flex-shrink: 0;
}

.ep-preview-iframe {
  flex: 1;
  width: 100%;
  border: none;
  background: var(--ide-preview-bg);
  border-radius: 0;
}

.ep-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--ide-dim-3);
  gap: 12px;
}

.ep-empty p {
  font-size: 15px;
  margin: 0;
  color: var(--ide-dim);
}

.ep-hint {
  font-size: 13px;
  color: var(--ide-dim-3);
}
</style>
