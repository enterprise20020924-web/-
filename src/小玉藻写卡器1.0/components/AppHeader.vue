<template>
  <header class="writer-header">
    <div class="toolbar-title">
      <span class="toolbar-section">{{ sectionLabel }}</span>
      <div>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>
    </div>

    <div class="header-context" aria-label="当前写卡环境">
      <span class="context-pill character-pill">
        <span class="status-light" />
        <span class="context-label">当前角色</span>
        <strong>{{ currentCharacter }}</strong>
      </span>
      <span v-if="showWorldbook" class="context-pill worldbook-pill">
        <span class="context-label">世界书</span>
        <strong>{{ worldbookName.trim() || '尚未命名' }}</strong>
      </span>
      <button
        v-if="formatResultCount"
        :class="['context-pill', 'format-context-pill', { invalid: formatIssueCount > 0 }]"
        @click="emit('format-review')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5h16v14H4z" />
          <path d="m8 10 2 2 5-5M8 16h8" />
        </svg>
        <strong>{{ formatIssueCount ? `格式提醒 ${formatIssueCount}` : '格式已通过' }}</strong>
      </button>
      <span v-if="draftStatus" class="context-pill save-pill">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v6h8V4M8 16h8" />
        </svg>
        <strong>{{ draftStatus }}</strong>
      </span>
    </div>

    <button
      class="icon-button close-button"
      :title="isBusy ? '请先等待当前步骤完成或安全停止' : '关闭'"
      :aria-label="isBusy ? '生成中，暂时不能关闭写卡器' : '关闭写卡器'"
      :disabled="isBusy"
      @click="emit('exit')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  sectionLabel: string;
  title: string;
  subtitle: string;
  currentCharacter: string;
  worldbookName: string;
  showWorldbook: boolean;
  draftStatus: string;
  formatIssueCount: number;
  formatResultCount: number;
  isBusy: boolean;
}>();

const emit = defineEmits<{
  exit: [];
  'format-review': [];
}>();
</script>
