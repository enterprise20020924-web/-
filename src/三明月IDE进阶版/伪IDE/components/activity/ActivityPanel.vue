<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { useActivityStore } from '../../stores/activity';
import { getOpSummary, isWriteOp } from '../../utils/ltc-capture';

const activityStore = useActivityStore();

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
}

function getToolColor(tool: string): string {
  switch (tool) {
    case 'Read': return 'var(--ide-tool-read)';
    case 'Write': return 'var(--ide-tool-write)';
    case 'Edit': return 'var(--ide-tool-edit)';
    case 'Delete': return 'var(--ide-tool-delete)';
    case 'Glob': return 'var(--ide-tool-glob)';
    case 'Grep': return 'var(--ide-tool-grep)';
    case 'SetAttribute': return 'var(--ide-tool-setattr)';
    case 'GetAttribute': return 'var(--ide-tool-getattr)';
    case 'CreateLorebook': return 'var(--ide-tool-lore)';
    default: return 'var(--ide-tool-default)';
  }
}
</script>

<template>
  <div class="activity-panel">
    <div class="ap-header">
      <SvgIcons name="terminal" :size="14" />
      <span class="ap-title">AI 活动</span>
      <span class="ap-count">{{ activityStore.operations.length }}</span>
      <button class="ap-clear" @click="activityStore.clear" title="清空">
        <SvgIcons name="trash" :size="12" />
      </button>
    </div>

    <div class="ap-log">
      <div v-if="activityStore.operations.length === 0" class="ap-empty">
        暂无操作记录
      </div>

      <div
        v-for="op in activityStore.operations"
        :key="op.id"
        class="ap-entry"
        :class="{ 'is-write': isWriteOp(op) }"
      >
        <span class="ap-time">{{ formatTime(op.timestamp) }}</span>
        <span class="ap-tool" :style="{ color: getToolColor(op.tool) }">{{ op.tool }}</span>
        <span class="ap-summary">{{ getOpSummary(op) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.activity-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ap-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--ide-border);
  color: var(--ide-dim);
  flex-shrink: 0;
}

.ap-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ap-count {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--ide-surface-2);
  color: var(--ide-dim-2);
  margin-left: auto;
}

.ap-clear {
  background: transparent;
  border: none;
  color: var(--ide-dim-3);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  border-radius: 3px;
}

.ap-clear:hover {
  color: var(--ide-dim);
  background: var(--ide-hover-strong);
}

.ap-log {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 4px 0;
  font-family: 'Cascadia Code', 'Fira Code', 'SF Mono', monospace;
}

.ap-log::-webkit-scrollbar { width: 3px; }

.ap-log::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar-soft);
  border-radius: 2px;
}

.ap-empty {
  text-align: center;
  color: var(--ide-dim-3);
  font-size: 11px;
  padding: 20px;
  font-family: inherit;
}

.ap-entry {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 2px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ide-dim);
}

.ap-entry:hover { background: var(--ide-surface); }

.ap-entry.is-write {
  border-left: 2px solid var(--ide-success-border);
}

.ap-time {
  color: var(--ide-dim-3);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}

.ap-tool {
  font-weight: 600;
  flex-shrink: 0;
  min-width: 50px;
}

.ap-summary {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
