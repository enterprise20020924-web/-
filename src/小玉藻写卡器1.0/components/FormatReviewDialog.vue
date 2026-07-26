<template>
  <div v-if="open" class="dialog-backdrop format-dialog-backdrop" role="presentation" @click.self="emit('close')">
    <section class="format-review-dialog" role="dialog" aria-modal="true" aria-labelledby="format-review-title">
      <div class="dialog-head">
        <div>
          <span class="view-kicker">FORMAT INSPECTOR</span>
          <h2 id="format-review-title">生成格式检查</h2>
          <p>原始输出会完整保留；矫正只整理标签结构，不重新生成正文。</p>
        </div>
        <button class="icon-button close-button" aria-label="关闭格式检查" :disabled="isBusy" @click="emit('close')">
          <svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
      </div>

      <div v-if="items.length" class="format-target-tabs" role="tablist" aria-label="生成结果">
        <button
          v-for="item in items"
          :key="item.id"
          :class="['format-target-tab', { active: item.id === activeItem?.id, invalid: !item.valid }]"
          role="tab"
          :aria-selected="item.id === activeItem?.id"
          @click="emit('select', item.id)"
        >
          <span>{{ item.title }}</span>
          <i>{{ item.valid ? '通过' : `${item.issues.length} 项` }}</i>
        </button>
      </div>

      <template v-if="activeItem">
        <div :class="['format-status-card', { valid: activeItem.valid }]">
          <div>
            <span class="status-light" />
            <strong>{{ activeItem.valid ? '标签结构已通过' : '检测到格式不匹配' }}</strong>
          </div>
          <p v-if="activeItem.valid">当前结果已经按标准标签解析。</p>
          <ul v-else class="format-issue-list">
            <li v-for="issue in activeItem.issues" :key="issue">{{ issue }}</li>
          </ul>
        </div>

        <label class="format-raw-field">
          <span>
            <strong>完整原始输出</strong>
            <small>首次输出 · {{ activeItem.originalRaw.length }} 字符</small>
          </span>
          <textarea :value="activeItem.originalRaw" readonly spellcheck="false" />
        </label>

        <div class="dialog-note format-dialog-note">
          <strong>矫正规则</strong>
          <p>支持双尖括号、全角尖括号、标签别名、缺失外层标签和未闭合标签；纯文本会完整保留并进入保底字段。</p>
        </div>

        <div class="dialog-actions format-dialog-actions">
          <button class="ghost" :disabled="isBusy" @click="emit('copy-raw')">复制原始输出</button>
          <button class="ghost" :disabled="isBusy" @click="emit('close')">关闭</button>
          <button class="primary" :disabled="isBusy" @click="emit('repair')">
            {{ isBusy ? '正在矫正...' : activeItem.valid ? '重新规范并解析' : '校验并矫正' }}
          </button>
        </div>
      </template>

      <div v-else class="format-empty-state">
        <strong>尚无生成结果</strong>
        <p>完成一次世界观、角色或独立人设生成后即可检查。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { FormatReviewItem } from '../ui-types';

defineProps<{
  activeItem: FormatReviewItem | null;
  isBusy: boolean;
  items: FormatReviewItem[];
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  'copy-raw': [];
  repair: [];
  select: [id: string];
}>();
</script>
