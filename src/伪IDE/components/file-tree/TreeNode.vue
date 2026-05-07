<script setup lang="ts">
import type { VfsNode } from '../../utils/path-utils';
import SvgIcons from '../SvgIcons.vue';
import { useFileSystemStore } from '../../stores/fileSystem';
import { useEditorStore } from '../../stores/editor';

const props = defineProps<{ node: VfsNode; depth?: number }>();
const fsStore = useFileSystemStore();
const editorStore = useEditorStore();

const depth = props.depth ?? 0;
const isExpanded = computed(() => fsStore.isExpanded(props.node.path));
const hasChildren = computed(() => props.node.type === 'folder' && props.node.children && props.node.children.length > 0);
const isSelected = computed(() => fsStore.selectedPath === props.node.path);
const indent = computed(() => `${depth * 18 + 8}px`);

function handleClick() {
  fsStore.selectNode(props.node);

  if (props.node.type === 'folder') {
    fsStore.toggleExpand(props.node.path);
  } else {
    openInEditor();
  }
}

async function openInEditor() {
  const content = await fsStore.readFile(props.node);
  if (content) {
    editorStore.openFile(content);
  }
}

const isWorldbookFolder = computed(() => {
  return props.node.type === 'folder' && props.node.path.startsWith('/世界书/') && props.node.path.split('/').length === 3;
});

function getWorldbookName(): string | null {
  const parts = props.node.path.split('/');
  if (parts.length >= 3 && parts[1] === '世界书') return parts[2];
  return null;
}

async function createNewEntry() {
  const worldbookName = getWorldbookName();
  if (!worldbookName) return;

  const name = prompt('请输入新条目名称:');
  if (!name || !name.trim()) return;

  try {
    await createWorldbookEntries(worldbookName, [{ name: name.trim() }]);
    toastr.success(`已创建条目: ${name.trim()}`);
    fsStore.refresh();
  } catch (error) {
    toastr.error(`创建条目失败: ${error}`);
  }
}

const sourceLabel = computed(() => {
  if (!props.node.source) return '';
  switch (props.node.source) {
    case 'worldbook': return '世界书';
    case 'character': return '角色卡';
    case 'preset': return '预设';
    default: return '';
  }
});
</script>

<template>
  <div class="tree-node-wrap">
    <div
      class="tree-node"
      :class="{ selected: isSelected }"
      :style="{ paddingLeft: indent }"
      @click="handleClick"
    >
      <span v-if="hasChildren" class="tree-arrow">
        <SvgIcons :name="isExpanded ? 'chevron-down' : 'chevron-right'" :size="12" />
      </span>
      <span v-else class="tree-arrow-placeholder" />

      <span class="tree-icon">
        <SvgIcons
          :name="node.type === 'folder' ? (isExpanded ? 'folder-open' : 'folder') : 'file'"
          :size="14"
        />
      </span>

      <span class="tree-label" :title="node.path">{{ node.name }}</span>
      <span v-if="sourceLabel && node.type === 'file'" class="tree-source">{{ sourceLabel }}</span>
    </div>

    <div
      v-if="isSelected && fsStore.showActionMenu"
      class="tree-actions"
      :style="{ paddingLeft: indent }"
    >
      <button v-if="node.type === 'file'" class="tree-action-btn" @click.stop="openInEditor">
        <SvgIcons name="edit" :size="12" />
        <span>查看内容</span>
      </button>

      <button
        v-if="isWorldbookFolder"
        class="tree-action-btn tree-action-new"
        @click.stop="createNewEntry"
      >
        <SvgIcons name="plus" :size="12" />
        <span>新建条目</span>
      </button>

      <span class="tree-action-path">{{ node.path }}</span>

      <button class="tree-action-btn tree-action-close" @click.stop="fsStore.clearSelection">
        <SvgIcons name="x" :size="12" />
      </button>
    </div>

    <template v-if="isExpanded && node.children">
      <TreeNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
      />
    </template>
  </div>
</template>

<style scoped>
.tree-node {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 8px;
  cursor: pointer;
  color: var(--ide-dim);
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap;
  user-select: none;
  border-radius: 4px;
  margin: 1px 4px;
  transition: background 0.1s;
}

.tree-node:hover {
  background: var(--ide-hover);
  color: var(--ide-text);
}

.tree-node.selected {
  background: var(--ide-accent-soft-strong);
  color: var(--ide-text);
  border-left: 2px solid var(--ide-accent-border-strong);
}

.tree-arrow {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-arrow-placeholder {
  width: 14px;
  flex-shrink: 0;
}

.tree-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  color: var(--ide-dim-2);
}

.tree-node.selected .tree-icon { color: var(--ide-accent-text); }

.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tree-source {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--ide-surface-2);
  color: var(--ide-dim-2);
  flex-shrink: 0;
}

.tree-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  margin: 0 4px 2px;
  background: var(--ide-accent-soft);
  border-radius: 0 0 4px 4px;
  border-left: 2px solid var(--ide-accent-border);
}

.tree-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: none;
  border-radius: 3px;
  background: var(--ide-surface-2);
  color: var(--ide-dim);
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.tree-action-btn:hover {
  background: var(--ide-surface-3);
  color: var(--ide-text);
}

.tree-action-path {
  font-size: 10px;
  color: var(--ide-dim-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.tree-action-new {
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
  border: 1px solid var(--ide-success-border);
}

.tree-action-new:hover {
  background: var(--ide-success-soft-strong);
  color: var(--ide-success-text);
}

.tree-action-close {
  margin-left: auto;
  background: transparent;
  padding: 3px;
}

.tree-action-close:hover { color: var(--ide-danger-text); }
</style>
