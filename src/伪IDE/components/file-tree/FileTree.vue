<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import TreeNode from './TreeNode.vue';
import { useFileSystemStore } from '../../stores/fileSystem';

const fsStore = useFileSystemStore();
const isLoading = ref(false);

async function doRefresh() {
  isLoading.value = true;
  await fsStore.refresh();
  isLoading.value = false;
}

onMounted(doRefresh);
</script>

<template>
  <div class="file-tree">
    <div class="ft-toolbar">
      <div class="ft-search">
        <SvgIcons name="search" :size="12" />
        <input
          v-model="fsStore.searchQuery"
          class="ft-search-input"
          placeholder="搜索文件..."
          spellcheck="false"
        />
        <button v-if="fsStore.searchQuery" class="ft-clear" @click="fsStore.searchQuery = ''">
          <SvgIcons name="x" :size="10" />
        </button>
      </div>

      <button class="ft-btn" :class="{ spinning: isLoading }" @click="doRefresh" title="刷新">
        <SvgIcons name="refresh" :size="14" />
      </button>
    </div>

    <div class="ft-content">
      <div v-if="isLoading && fsStore.filteredTree.length === 0" class="ft-empty">加载中...</div>
      <div v-else-if="fsStore.filteredTree.length === 0" class="ft-empty">未找到文件</div>
      <template v-else>
        <TreeNode
          v-for="node in fsStore.filteredTree"
          :key="node.path"
          :node="node"
          :depth="0"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.file-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ft-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ide-border);
  flex-shrink: 0;
}

.ft-search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--ide-surface);
  border: 1px solid var(--ide-border-soft);
  border-radius: 4px;
  padding: 3px 6px;
  color: var(--ide-dim-2);
}

.ft-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--ide-text);
  font-size: 13px;
  padding: 0;
  min-width: 0;
}

.ft-search-input::placeholder { color: var(--ide-dim-3); }

.ft-clear {
  background: transparent;
  border: none;
  color: var(--ide-dim-2);
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
}

.ft-clear:hover { color: var(--ide-text); }

.ft-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--ide-dim-2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.ft-btn:hover {
  background: var(--ide-surface-3);
  color: var(--ide-text);
}

.ft-btn.spinning svg {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ft-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
}

.ft-content::-webkit-scrollbar { width: 3px; }

.ft-content::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar-soft);
  border-radius: 2px;
}

.ft-empty {
  text-align: center;
  color: var(--ide-dim-3);
  font-size: 11px;
  padding: 24px 12px;
}
</style>
