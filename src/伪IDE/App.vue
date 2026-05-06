<script setup lang="ts">
import SvgIcons from './components/SvgIcons.vue';
import FileTree from './components/file-tree/FileTree.vue';
import EditorPanel from './components/editor/EditorPanel.vue';
import ActivityPanel from './components/activity/ActivityPanel.vue';
import ChatPanel from './components/chat/ChatPanel.vue';
import { usePresetStore } from './stores/preset';
import { useCharacterStore } from './stores/character';
import { useActivityStore } from './stores/activity';
import { useChatStore } from './stores/chat';
import { useFileSystemStore } from './stores/fileSystem';

const emit = defineEmits<{ exit: [] }>();

const presetStore = usePresetStore();
const charStore = useCharacterStore();
const activityStore = useActivityStore();
const chatStore = useChatStore();
const fsStore = useFileSystemStore();

const parentWin = window.parent || window;
const windowWidth = ref(parentWin.innerWidth);
const isMobile = computed(() => windowWidth.value <= 768);
const onResize = () => {
  windowWidth.value = parentWin.innerWidth;
};

onMounted(() => parentWin.addEventListener('resize', onResize));
onUnmounted(() => parentWin.removeEventListener('resize', onResize));

type MobileTab = 'files' | 'editor' | 'chat';
const mobileTab = ref<MobileTab>('files');

type IdeTheme = 'dark' | 'light';
const THEME_STORAGE_KEY = 'qz-ide-theme';
const theme = ref<IdeTheme>('dark');
const isLightTheme = computed(() => theme.value === 'light');
const themeLabel = computed(() => (isLightTheme.value ? '白天模式' : '夜间模式'));
const nextThemeLabel = computed(() => (isLightTheme.value ? '夜间模式' : '白天模式'));

function toggleTheme() {
  theme.value = isLightTheme.value ? 'dark' : 'light';
}

onMounted(() => {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      theme.value = savedTheme;
    }
  } catch {
    /* ignore storage failures */
  }
});

watch(
  theme,
  nextTheme => {
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      /* ignore storage failures */
    }
  },
  { immediate: true },
);

const streamingContent = ref('');

onMounted(() => {
  presetStore.refresh();
  charStore.refresh();
  chatStore.refreshMessages();

  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, () => {
    chatStore.refreshMessages();
    activityStore.captureFromLatestMessage();
    setTimeout(() => fsStore.refresh(), 500);
    setTimeout(() => fsStore.refresh(), 2000);
    streamingContent.value = '';
  });

  eventOn(tavern_events.USER_MESSAGE_RENDERED, () => {
    chatStore.refreshMessages();
  });

  eventOn(tavern_events.STREAM_TOKEN_RECEIVED, (token: string) => {
    streamingContent.value += token;
  });
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
});

const showPresetDropdown = ref(false);
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
    <header class="ide-topbar">
      <span class="ide-brand">秋青写卡 IDE</span>

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

      <span class="ide-spacer" />

      <button v-if="!isMobile" class="ide-btn ide-exit" @click="emit('exit')" title="退出 IDE">
        <SvgIcons name="x" :size="16" />
        <span>退出</span>
      </button>
    </header>

    <div class="ide-body">
      <template v-if="!isMobile">
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
            <ChatPanel :streaming-content="streamingContent" />
          </div>
        </aside>
      </template>

      <template v-else>
        <div class="ide-mobile-content">
          <FileTree v-if="mobileTab === 'files'" />
          <EditorPanel v-else-if="mobileTab === 'editor'" />
          <ChatPanel v-else-if="mobileTab === 'chat'" />
        </div>
      </template>
    </div>

    <footer v-if="isMobile" class="ide-mobile-footer">
      <nav class="ide-mobile-tabs">
        <button :class="{ active: mobileTab === 'files' }" @click="mobileTab = 'files'">
          <SvgIcons name="folder" :size="20" />
          <span>文件</span>
        </button>
        <button :class="{ active: mobileTab === 'editor' }" @click="mobileTab = 'editor'">
          <SvgIcons name="edit" :size="20" />
          <span>编辑</span>
        </button>
        <button :class="{ active: mobileTab === 'chat' }" @click="mobileTab = 'chat'">
          <SvgIcons name="message" :size="20" />
          <span>聊天</span>
        </button>
      </nav>

      <button class="ide-mobile-exit" @click="emit('exit')">
        <SvgIcons name="minimize" :size="14" />
        <span>退出 IDE</span>
      </button>
    </footer>
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

.ide-brand {
  font-size: 15px;
  font-weight: 700;
  color: var(--ide-accent);
  margin-right: 8px;
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
}

.ide-mobile-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--ide-border);
  background: var(--ide-bg2);
}

.ide-mobile-tabs {
  display: flex;
}

.ide-mobile-tabs button {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--ide-dim-2);
  font-size: 11px;
  cursor: pointer;
}

.ide-mobile-tabs button.active {
  color: var(--ide-accent);
}

.ide-mobile-exit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
  border: none;
  border-top: 1px solid var(--ide-border);
  background: var(--ide-danger-soft);
  color: var(--ide-danger-text);
  font-size: 13px;
  cursor: pointer;
}

.ide-mobile-exit:active {
  background: var(--ide-danger-soft-strong);
}
</style>
