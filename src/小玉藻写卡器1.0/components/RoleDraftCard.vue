<template>
  <article class="role-card">
    <div class="role-title">
      <div class="role-identity">
        <span class="role-index">{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <strong>{{ role.label }}</strong>
          <small>{{ role.name.trim() || '等待命名' }} · 完成度 {{ completion }}%</small>
        </div>
      </div>
      <div class="role-actions">
        <button
          class="icon-text-button"
          :disabled="isBusy || index === 0"
          title="上移"
          @click="emit('move', index, -1)"
        >
          ↑
        </button>
        <button
          class="icon-text-button"
          :disabled="isBusy || index === total - 1"
          title="下移"
          @click="emit('move', index, 1)"
        >
          ↓
        </button>
        <button class="icon-text-button" :disabled="isBusy" title="复制角色" @click="emit('duplicate', index)">
          复制
        </button>
        <button class="icon-text-button" :disabled="isBusy" @click="collapsed = !collapsed">
          {{ collapsed ? '展开' : '收起' }}
        </button>
        <button
          v-if="total > 1"
          class="icon-text-button danger-action"
          :disabled="isBusy"
          @click="emit('remove', index)"
        >
          删除
        </button>
      </div>
    </div>

    <div v-show="!collapsed" class="role-card-body">
      <label class="field compact">
        <span>角色名（可空）</span>
        <input :value="role.name" placeholder="留空则由 AI 命名" @input="updateField('name', $event)" />
      </label>

      <label class="field compact role-seed-field">
        <span>角色素材</span>
        <textarea
          :value="role.seed"
          class="role-textarea"
          placeholder="用大白话写即可：身份、关系、外貌、经历、能力、禁忌、性格底色、矛盾感、行为逻辑，以及初识期、熟悉期、亲近期的变化。"
          @input="updateField('seed', $event)"
        />
        <small class="field-counter">{{ role.seed.trim().length }} 字</small>
      </label>

      <div class="asset-grid">
        <label class="field compact">
          <span>状态栏头像 URL（可空）</span>
          <input
            :value="role.statusAvatarUrl"
            placeholder="建议 1:1 方图，主体居中"
            @input="updateField('statusAvatarUrl', $event)"
          />
        </label>
        <label class="field compact">
          <span>状态栏背景 URL（可空）</span>
          <input
            :value="role.statusBackgroundUrl"
            placeholder="建议横版壁纸，主体别贴边"
            @input="updateField('statusBackgroundUrl', $event)"
          />
        </label>
      </div>
      <p class="asset-tip">头像建议 1:1；横版背景建议 16:9、21:9 或更宽，关键人物放中间安全区。</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { RoleDraft } from '../types';

const props = defineProps<{
  role: RoleDraft;
  index: number;
  total: number;
  isBusy: boolean;
}>();

const emit = defineEmits<{
  update: [index: number, patch: Partial<RoleDraft>];
  remove: [index: number];
  move: [index: number, direction: -1 | 1];
  duplicate: [index: number];
}>();

const collapsed = ref(false);

const completion = computed(() => {
  let value = props.role.seed.trim() ? 70 : 0;
  if (props.role.name.trim()) value += 10;
  if (props.role.statusAvatarUrl.trim()) value += 10;
  if (props.role.statusBackgroundUrl.trim()) value += 10;
  return value;
});

function updateField(
  key: keyof Pick<RoleDraft, 'name' | 'seed' | 'statusAvatarUrl' | 'statusBackgroundUrl'>,
  event: Event,
) {
  emit('update', props.index, { [key]: (event.target as HTMLInputElement | HTMLTextAreaElement).value });
}
</script>
