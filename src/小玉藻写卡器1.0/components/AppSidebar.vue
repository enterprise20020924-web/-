<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand">
      <span class="sidebar-brand-copy">
        <strong>玉藻写卡器</strong>
        <small>TAMAMO STUDIO</small>
      </span>
    </div>

    <nav class="sidebar-nav" aria-label="写卡器导航">
      <button
        :class="['sidebar-nav-item', { active: step === 'setup' }]"
        :disabled="isBusy || workStarted"
        @click="emit('home')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 10.5 12 4l8 6.5V20H4Z" />
          <path d="M9 20v-6h6v6" />
        </svg>
        <span>
          <strong>项目设置</strong>
          <small>角色与世界书</small>
        </span>
      </button>

      <button
        :class="[
          'sidebar-nav-item',
          { active: step === 'beginner' || step === 'editor' || step === 'opening' || workStarted },
        ]"
        :disabled="isBusy || workStarted || !editorAvailable"
        @click="emit('editor')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
        <span>
          <strong>完整角色卡</strong>
          <small>新手与高级编辑</small>
        </span>
      </button>

      <button
        :class="['sidebar-nav-item', { active: step === 'persona' }]"
        :disabled="isBusy || workStarted"
        @click="emit('persona')"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3h6m-5 0v5l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V3" />
          <path d="M7.5 15h9" />
        </svg>
        <span>
          <strong>只生成人设</strong>
          <small>独立调色盘工具</small>
        </span>
      </button>

      <button v-if="workStarted" class="sidebar-nav-item task-item active" disabled>
        <span :class="['task-pulse', { idle: !isBusy }]" />
        <span>
          <strong>{{ taskTitle }}</strong>
          <small>{{ taskDetail }}</small>
        </span>
      </button>
    </nav>

    <div class="sidebar-mascot" aria-hidden="true">
      <span class="mascot-glow" />
      <img :src="workingImageSrc" alt="" />
      <div class="mascot-status">
        <span class="status-light" />
        <span>{{ draftStatus || '写卡器已就绪' }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { WriterStep } from '../ui-types';

defineProps<{
  step: WriterStep;
  workStarted: boolean;
  editorAvailable: boolean;
  isBusy: boolean;
  taskDetail: string;
  taskTitle: string;
  workingImageSrc: string;
  draftStatus: string;
}>();

const emit = defineEmits<{
  home: [];
  editor: [];
  persona: [];
}>();
</script>
