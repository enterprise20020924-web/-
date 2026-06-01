<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';
import { usePlanStore } from '../../stores/plan';
import { useWorkshopStore, type WorkshopArtifact } from '../../stores/workshop';

type DiffKind = 'same' | 'add' | 'remove' | 'info';
interface DiffRow {
  kind: DiffKind;
  oldLine?: number;
  newLine?: number;
  text: string;
}

const planStore = usePlanStore();
const workshopStore = useWorkshopStore();
const activeArtifactId = ref('');

const activePlan = computed(() => planStore.activePlan);
const activeArtifactTree = computed(() => activePlan.value?.artifacts ?? null);
const visibleArtifacts = computed(() =>
  workshopStore.generatedArtifacts.length
    ? workshopStore.generatedArtifacts
    : activeArtifactTree.value?.artifacts ?? [],
);
const visibleOperations = computed(() =>
  workshopStore.generatedWritePlan.length
    ? workshopStore.generatedWritePlan
    : activeArtifactTree.value?.operations ?? [],
);
const sourceLabel = computed(() => {
  if (workshopStore.generatedArtifacts.length) return '当前写入确认区';
  if (activeArtifactTree.value) return `计划产物 v${activeArtifactTree.value.version}`;
  return '暂无产物';
});
const activeArtifact = computed(() =>
  visibleArtifacts.value.find(artifact => artifact.id === activeArtifactId.value) ?? visibleArtifacts.value[0] ?? null,
);
const previousArtifact = computed(() => {
  const artifact = activeArtifact.value;
  if (!artifact || !activeArtifactTree.value) return null;
  return activeArtifactTree.value.previousArtifacts.find(
    item => item.id === artifact.id || item.targetPath === artifact.targetPath,
  ) ?? null;
});

function buildLineDiffRows(previous: string, current: string, maxRows = 260): DiffRow[] {
  if (previous === current) {
    return [{ kind: 'info', text: '无内容差异。' }];
  }

  const before = previous.split(/\r?\n/);
  const after = current.split(/\r?\n/);
  const max = Math.max(before.length, after.length);
  const rows: DiffRow[] = [];
  for (let index = 0; index < max; index += 1) {
    const oldText = before[index];
    const newText = after[index];
    if (oldText === newText) {
      rows.push({ kind: 'same', oldLine: index + 1, newLine: index + 1, text: oldText ?? '' });
    } else {
      if (oldText !== undefined) rows.push({ kind: 'remove', oldLine: index + 1, text: oldText });
      if (newText !== undefined) rows.push({ kind: 'add', newLine: index + 1, text: newText });
    }
    if (rows.length >= maxRows) {
      rows.push({ kind: 'info', text: `diff 已截断，仅显示前 ${maxRows} 行变化上下文。` });
      break;
    }
  }
  return rows;
}

const activeDiffRows = computed(() => {
  const artifact = activeArtifact.value;
  if (!artifact) return [];
  return buildLineDiffRows(previousArtifact.value?.content ?? '', artifact.content);
});
const diffStats = computed(() => ({
  added: activeDiffRows.value.filter(row => row.kind === 'add').length,
  removed: activeDiffRows.value.filter(row => row.kind === 'remove').length,
}));

watch(
  () => visibleArtifacts.value.map(artifact => artifact.id).join('|'),
  () => {
    if (!visibleArtifacts.value.some(artifact => artifact.id === activeArtifactId.value)) {
      activeArtifactId.value = visibleArtifacts.value[0]?.id ?? '';
    }
  },
  { immediate: true },
);

function selectArtifact(artifact: WorkshopArtifact) {
  activeArtifactId.value = artifact.id;
}
</script>

<template>
  <section class="artifact-workspace">
    <header class="aw-head">
      <div>
        <span>产物工作区</span>
        <strong>文件预览 / 写入动作 / Diff</strong>
      </div>
      <em>{{ sourceLabel }}</em>
    </header>

    <div v-if="!activeArtifact" class="aw-empty">
      <SvgIcons name="file-code" :size="34" />
      <p>还没有可展示的产物。</p>
      <small>计划模式收到 ArtifactDelta 后，这里会显示目标文件、写入动作和相对上一版本 diff。</small>
    </div>

    <div v-else class="aw-grid">
      <aside class="aw-list">
        <button
          v-for="artifact in visibleArtifacts"
          :key="artifact.id"
          type="button"
          class="aw-artifact-btn"
          :class="{ active: activeArtifact.id === artifact.id }"
          @click="selectArtifact(artifact)"
        >
          <span>{{ artifact.contentType }}</span>
          <strong>{{ artifact.title }}</strong>
          <small>{{ artifact.targetPath }}</small>
        </button>

        <div v-if="visibleOperations.length" class="aw-ops">
          <div class="aw-mini-title">写入动作</div>
          <div v-for="operation in visibleOperations" :key="operation.id" class="aw-op-row">
            <strong>{{ operation.tool }}</strong>
            <span>{{ operation.targetPath }}</span>
          </div>
        </div>
      </aside>

      <main class="aw-detail">
        <div class="aw-meta">
          <span>{{ activeArtifact.targetPath }}</span>
          <strong>{{ activeArtifact.riskLevel }}</strong>
        </div>

        <div class="aw-columns">
          <section class="aw-content">
            <div class="aw-mini-title">当前内容</div>
            <pre>{{ activeArtifact.content }}</pre>
          </section>

          <section class="aw-diff">
            <div class="aw-diff-head">
              <span>相对上一版本 diff</span>
              <strong>+{{ diffStats.added }} / -{{ diffStats.removed }}</strong>
            </div>
            <div class="aw-diff-list">
              <div
                v-for="(row, index) in activeDiffRows"
                :key="`${row.kind}-${index}`"
                class="aw-diff-row"
                :class="`is-${row.kind}`"
              >
                <span class="aw-diff-mark">{{ row.kind === 'add' ? '+' : row.kind === 'remove' ? '-' : row.kind === 'same' ? ' ' : 'i' }}</span>
                <span class="aw-diff-line">{{ row.oldLine ?? '' }}</span>
                <span class="aw-diff-line">{{ row.newLine ?? '' }}</span>
                <pre>{{ row.text || ' ' }}</pre>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.artifact-workspace {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  background: var(--ide-bg);
}

.aw-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--ide-border);
  background: var(--ide-surface);
}

.aw-head div {
  display: grid;
  gap: 2px;
}

.aw-head span,
.aw-head em {
  color: var(--ide-dim);
  font-size: 12px;
  font-style: normal;
}

.aw-head strong {
  color: var(--ide-text);
  font-size: 14px;
}

.aw-empty {
  flex: 1;
  display: grid;
  place-content: center;
  gap: 8px;
  padding: 24px;
  text-align: center;
  color: var(--ide-dim);
}

.aw-empty p {
  margin: 0;
  color: var(--ide-text);
  font-weight: 700;
}

.aw-empty small {
  max-width: 340px;
}

.aw-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
}

.aw-list {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 10px;
  border-right: 1px solid var(--ide-border);
  background: var(--ide-bg2);
}

.aw-artifact-btn {
  width: 100%;
  display: grid;
  gap: 4px;
  padding: 10px;
  margin-bottom: 8px;
  border: 1px solid var(--ide-border-soft);
  border-radius: 10px;
  background: var(--ide-surface);
  color: var(--ide-dim);
  text-align: left;
  cursor: pointer;
}

.aw-artifact-btn:hover,
.aw-artifact-btn.active {
  border-color: var(--ide-accent-border-strong);
  background: var(--ide-accent-soft);
  color: var(--ide-text);
}

.aw-artifact-btn span {
  width: fit-content;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--ide-surface-2);
  color: var(--ide-accent-text);
  font-size: 10px;
  text-transform: uppercase;
}

.aw-artifact-btn strong {
  overflow: hidden;
  color: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-artifact-btn small {
  overflow: hidden;
  color: var(--ide-dim-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-ops {
  display: grid;
  gap: 6px;
  margin-top: 12px;
}

.aw-mini-title {
  color: var(--ide-dim-2);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.aw-op-row {
  display: grid;
  gap: 3px;
  padding: 8px;
  border-radius: 8px;
  background: var(--ide-surface);
  color: var(--ide-dim);
  font-size: 12px;
}

.aw-op-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-detail {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.aw-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--ide-border-soft);
  color: var(--ide-dim);
  font-size: 12px;
}

.aw-meta span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.aw-meta strong {
  flex-shrink: 0;
  color: var(--ide-warning-text);
}

.aw-columns {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
}

.aw-content,
.aw-diff {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.aw-content {
  border-right: 1px solid var(--ide-border);
}

.aw-content .aw-mini-title {
  padding: 9px 12px;
  border-bottom: 1px solid var(--ide-border-soft);
}

.aw-content pre {
  flex: 1;
  margin: 0;
  overflow: auto;
  padding: 12px;
  color: var(--ide-code-text);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.aw-diff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--ide-border-soft);
  color: var(--ide-dim);
  font-size: 12px;
}

.aw-diff-head strong {
  color: var(--ide-text);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.aw-diff-list {
  flex: 1;
  overflow: auto;
  padding: 8px 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.45;
}

.aw-diff-row {
  display: grid;
  grid-template-columns: 20px 38px 38px minmax(0, 1fr);
  gap: 6px;
  padding: 1px 10px;
  color: var(--ide-dim);
}

.aw-diff-row pre {
  margin: 0;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: inherit;
}

.aw-diff-mark,
.aw-diff-line {
  color: var(--ide-dim-3);
  text-align: right;
  user-select: none;
}

.aw-diff-row.is-add {
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
}

.aw-diff-row.is-remove {
  background: var(--ide-danger-soft);
  color: var(--ide-danger-text);
}

.aw-diff-row.is-info {
  grid-template-columns: 20px minmax(0, 1fr);
  color: var(--ide-dim-2);
}

.aw-diff-row.is-info .aw-diff-line {
  display: none;
}

@media (max-width: 860px) {
  .aw-grid,
  .aw-columns {
    grid-template-columns: 1fr;
  }

  .aw-list,
  .aw-content {
    border-right: none;
    border-bottom: 1px solid var(--ide-border);
  }

  .aw-list {
    max-height: 180px;
  }
}
</style>
