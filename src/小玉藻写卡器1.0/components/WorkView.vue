<template>
  <section class="work-screen">
    <div class="work-visual">
      <img :src="workingImageSrc" alt="" />
      <div class="work-visual-caption">
        <span>WRITING RITUAL</span>
        <strong>{{ currentWorkText }}</strong>
      </div>
    </div>

    <div class="work-board">
      <div class="work-head">
        <div>
          <p class="panel-kicker">TASK CENTER</p>
          <h2>生成进度</h2>
          <p aria-live="polite">{{ currentWorkText }}</p>
        </div>
        <div class="work-head-stats">
          <span>生成次数 {{ completedGenerationCallCount }}/{{ generationCallCount }}</span>
          <strong>{{ completedStageCount }}/{{ workStages.length }}</strong>
        </div>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        aria-label="生成进度"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="workPercent"
      >
        <span :style="{ width: `${workPercent}%` }" />
      </div>
      <p v-if="heartbeatText" class="generation-heartbeat" aria-live="polite"><i />{{ heartbeatText }}</p>

      <div v-if="generationWarnings.length" class="warning-panel">
        <div class="warning-panel-head">
          <strong>生成提醒</strong>
          <button type="button" class="ghost mini-action" @click="emit('format-review')">查看原始输出</button>
        </div>
        <p v-for="(warning, index) in visibleWarnings" :key="`${index}-${warning}`">{{ warning }}</p>
        <p v-if="hiddenWarningCount" class="warning-more">另有 {{ hiddenWarningCount }} 项提醒，可在原始输出中查看。</p>
      </div>

      <div v-if="failedStageIndex !== null" class="warning-panel error-recovery-panel" role="alert">
        <strong>这一阶段没有完成</strong>
        <p>已经完成的内容仍然保留。可以重试当前阶段，或撤销本次生成并回到开始前。</p>
      </div>

      <ol class="work-steps">
        <li
          v-for="stageItem in workStages"
          :key="stageItem.key"
          :class="['work-step', stageItem.status]"
          :aria-current="stageItem.status === 'running' ? 'step' : undefined"
        >
          <span class="stage-dot">{{ stageMark(stageItem.status) }}</span>
          <div>
            <strong>{{ stageItem.title }}</strong>
            <p>{{ stageItem.error || stageItem.detail }}</p>
            <span v-if="stageItem.status === 'running' && stageItem.progress" class="stage-progress-track">
              <i :style="{ width: `${stageItem.progress}%` }" />
            </span>
            <button
              v-if="canRerollStage(stageItem)"
              class="mini-action"
              :disabled="isBusy"
              @click="emit('reroll', stageItem)"
            >
              重新生成此阶段
            </button>
          </div>
        </li>
      </ol>

      <div class="work-actions">
        <button v-if="isBusy" class="ghost danger-action" @click="emit('stop-now')">立即停止当前请求</button>
        <button v-if="isBusy" class="ghost" :disabled="stopRequested" @click="emit('request-stop')">
          {{ stopRequested ? '将在当前步骤后停止' : '完成当前步骤后停止' }}
        </button>
        <button v-if="pausedStageIndex !== null && !isBusy" class="primary" @click="emit('resume')">继续生成</button>
        <button v-if="failedStageIndex !== null" class="primary" :disabled="isBusy" @click="emit('retry')">
          重新开始此阶段
        </button>
        <button v-if="!isBusy" class="ghost" @click="emit('return-editor')">
          {{ hasRecovery ? '保留当前进度并返回修改' : '返回修改' }}
        </button>
        <button v-if="!isBusy && failedStageIndex === null" class="ghost" @click="emit('rerun')">重新生成全部</button>
        <button v-if="!isBusy && hasRecovery" class="ghost danger-action" @click="emit('restore')">撤销本次生成</button>
      </div>

      <div v-if="previewText" class="preview work-preview">
        <div class="preview-head">
          <strong>最近生成</strong>
          <button class="ghost mini-copy" @click="emit('copy-preview')">复制</button>
        </div>
        <pre>{{ previewText }}</pre>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WorkStage, WorkStatus } from '../ui-types';

const props = defineProps<{
  workingImageSrc: string;
  currentWorkText: string;
  completedStageCount: number;
  completedGenerationCallCount: number;
  generationCallCount: number;
  workStages: WorkStage[];
  workPercent: number;
  generationWarnings: string[];
  hasRecovery: boolean;
  isBusy: boolean;
  failedStageIndex: number | null;
  pausedStageIndex: number | null;
  previewText: string;
  stopRequested: boolean;
  heartbeatText: string;
  canRerollStage: (stage: WorkStage) => boolean;
}>();

const emit = defineEmits<{
  retry: [];
  resume: [];
  'request-stop': [];
  'stop-now': [];
  'return-editor': [];
  rerun: [];
  reroll: [stage: WorkStage];
  restore: [];
  'copy-preview': [];
  'format-review': [];
}>();

const visibleWarnings = computed(() => props.generationWarnings.slice(0, 4));
const hiddenWarningCount = computed(() => Math.max(0, props.generationWarnings.length - visibleWarnings.value.length));

function stageMark(status: WorkStatus): string {
  if (status === 'done') return '✓';
  if (status === 'running') return '…';
  if (status === 'error') return '!';
  return '';
}
</script>
