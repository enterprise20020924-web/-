import type { VfsFileContent } from '../utils/vfs-adapter';
import type { VfsNode } from '../utils/path-utils';
import { basename } from '../utils/path-utils';

export interface EditorTab {
  path: string;
  label: string;
  source: VfsNode['source'];
  meta?: Record<string, any>;
  content: string;
  originalContent: string;
  dirty: boolean;
}

export const useEditorStore = defineStore('editor', () => {
  const tabs = ref<EditorTab[]>([]);
  const activeTabPath = ref<string | null>(null);

  const activeTab = computed(() => {
    if (!activeTabPath.value) return null;
    return tabs.value.find(t => t.path === activeTabPath.value) || null;
  });

  function openFile(file: VfsFileContent) {
    const existing = tabs.value.find(t => t.path === file.path);
    if (existing) {
      activeTabPath.value = existing.path;
      return;
    }
    tabs.value.push({
      path: file.path,
      label: basename(file.path),
      source: file.source as VfsNode['source'],
      meta: file.meta,
      content: file.content,
      originalContent: file.content,
      dirty: false,
    });
    activeTabPath.value = file.path;
  }

  function closeTab(path: string) {
    const idx = tabs.value.findIndex(t => t.path === path);
    if (idx < 0) return;
    tabs.value.splice(idx, 1);
    if (activeTabPath.value === path) {
      activeTabPath.value = tabs.value.length > 0
        ? tabs.value[Math.min(idx, tabs.value.length - 1)].path
        : null;
    }
  }

  function setActive(path: string) {
    if (tabs.value.some(t => t.path === path)) {
      activeTabPath.value = path;
    }
  }

  function updateContent(path: string, content: string) {
    const tab = tabs.value.find(t => t.path === path);
    if (tab) {
      tab.content = content;
      tab.dirty = true;
    }
  }

  function markClean(path: string) {
    const tab = tabs.value.find(t => t.path === path);
    if (tab) {
      tab.dirty = false;
      tab.originalContent = tab.content;
    }
  }

  function revertContent(path: string) {
    const tab = tabs.value.find(t => t.path === path);
    if (tab) {
      tab.content = tab.originalContent;
      tab.dirty = false;
    }
  }

  return {
    tabs,
    activeTabPath,
    activeTab,
    openFile,
    closeTab,
    setActive,
    updateContent,
    markClean,
    revertContent,
  };
});
