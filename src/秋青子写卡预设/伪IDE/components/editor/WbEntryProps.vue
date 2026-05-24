<script setup lang="ts">
import SvgIcons from '../SvgIcons.vue';

const props = defineProps<{
  worldbook: string;
  uid: number;
  wbEntry: Record<string, any>;
}>();

const emit = defineEmits<{ saved: [] }>();

const isSaving = ref(false);
const enabled = ref(false);
const strategyType = ref('constant');
const keys = ref('');
const positionType = ref('after_character_definition');
const positionRole = ref('system');
const positionDepth = ref(0);
const positionOrder = ref(100);
const probability = ref(100);
const preventIncoming = ref(false);
const preventOutgoing = ref(false);
const sticky = ref(0);
const cooldown = ref(0);
const delay = ref(0);

function syncFromProps() {
  const entry = props.wbEntry || {};
  enabled.value = !!entry.enabled;
  strategyType.value = entry.strategy?.type || 'constant';
  keys.value = (entry.strategy?.keys || []).map((key: any) => typeof key === 'string' ? key : key.toString()).join(',');
  positionType.value = entry.position?.type || 'after_character_definition';
  positionRole.value = entry.position?.role || 'system';
  positionDepth.value = entry.position?.depth ?? 0;
  positionOrder.value = entry.position?.order ?? 100;
  probability.value = entry.probability ?? 100;
  preventIncoming.value = !!entry.recursion?.prevent_incoming;
  preventOutgoing.value = !!entry.recursion?.prevent_outgoing;
  sticky.value = entry.effect?.sticky ?? 0;
  cooldown.value = entry.effect?.cooldown ?? 0;
  delay.value = entry.effect?.delay ?? 0;
}

syncFromProps();
watch(() => [props.uid, props.worldbook], () => syncFromProps());
watch(() => props.wbEntry, () => syncFromProps(), { deep: true });

async function saveProps() {
  isSaving.value = true;
  try {
    const keysList = keys.value.split(',').map(key => key.trim()).filter(Boolean);
    await updateWorldbookWith(props.worldbook, entries => {
      const entry = entries.find(item => item.uid === props.uid);
      if (entry) {
        entry.enabled = enabled.value;
        entry.strategy = {
          ...entry.strategy,
          type: strategyType.value as any,
          keys: keysList,
        };
        entry.position = {
          ...entry.position,
          type: positionType.value as any,
          role: positionRole.value as any,
          depth: positionDepth.value,
          order: positionOrder.value,
        };
        entry.probability = probability.value;
        entry.recursion = {
          ...entry.recursion,
          prevent_incoming: preventIncoming.value,
          prevent_outgoing: preventOutgoing.value,
        };
        entry.effect = {
          sticky: sticky.value || null,
          cooldown: cooldown.value || null,
          delay: delay.value || null,
        };
      }
      return entries;
    });
    toastr.success('条目属性已保存');
    emit('saved');
  } catch (error) {
    toastr.error(`保存属性失败: ${error}`);
  } finally {
    isSaving.value = false;
  }
}

const positionOptions = [
  { value: 'before_character_definition', label: '角色定义之前' },
  { value: 'after_character_definition', label: '角色定义之后' },
  { value: 'before_example_messages', label: '示例消息之前' },
  { value: 'after_example_messages', label: '示例消息之后' },
  { value: 'before_author_note', label: '作者注释之前' },
  { value: 'after_author_note', label: '作者注释之后' },
  { value: 'at_depth', label: '插入到指定深度' },
];

const strategyOptions = [
  { value: 'constant', label: '常驻' },
  { value: 'selective', label: '关键词触发' },
  { value: 'vectorized', label: '向量化' },
];
</script>

<template>
  <div class="wb-props">
    <div class="wb-props-header">
      <SvgIcons name="settings" :size="14" />
      <span>条目属性</span>
      <span class="wb-props-wb">{{ worldbook }}</span>
      <button class="wb-props-save" :disabled="isSaving" @click="saveProps">
        <SvgIcons name="download" :size="12" />
        {{ isSaving ? '保存中...' : '保存属性' }}
      </button>
    </div>

    <div class="wb-props-body">
      <div class="wb-row">
        <label class="wb-label">启用</label>
        <label class="wb-toggle">
          <input v-model="enabled" type="checkbox" />
          <span>{{ enabled ? '已启用' : '已禁用' }}</span>
        </label>
      </div>

      <div class="wb-row">
        <label class="wb-label">触发策略</label>
        <select v-model="strategyType" class="wb-select">
          <option v-for="option in strategyOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div v-if="strategyType === 'selective'" class="wb-row">
        <label class="wb-label">关键词</label>
        <input v-model="keys" class="wb-input" placeholder="英文逗号分隔，如: 角色名,昵称,外号" />
      </div>

      <div class="wb-row">
        <label class="wb-label">插入位置</label>
        <select v-model="positionType" class="wb-select">
          <option v-for="option in positionOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <template v-if="positionType === 'at_depth'">
        <div class="wb-row">
          <label class="wb-label">深度</label>
          <input v-model.number="positionDepth" type="number" min="0" class="wb-input wb-input-num" />
        </div>
        <div class="wb-row">
          <label class="wb-label">消息身份</label>
          <select v-model="positionRole" class="wb-select">
            <option value="system">system</option>
            <option value="assistant">assistant</option>
            <option value="user">user</option>
          </select>
        </div>
      </template>

      <div class="wb-row">
        <label class="wb-label">顺序</label>
        <input v-model.number="positionOrder" type="number" class="wb-input wb-input-num" />
      </div>

      <div class="wb-row">
        <label class="wb-label">触发概率%</label>
        <input v-model.number="probability" type="number" min="0" max="100" class="wb-input wb-input-num" />
      </div>

      <div class="wb-section">递归</div>
      <div class="wb-row">
        <label class="wb-toggle">
          <input v-model="preventIncoming" type="checkbox" />
          <span>防止进入递归</span>
        </label>
      </div>
      <div class="wb-row">
        <label class="wb-toggle">
          <input v-model="preventOutgoing" type="checkbox" />
          <span>防止回复触发</span>
        </label>
      </div>

      <div class="wb-section">效果</div>
      <div class="wb-row">
        <label class="wb-label">黏性</label>
        <input v-model.number="sticky" type="number" min="0" class="wb-input wb-input-num" placeholder="0=关闭" />
      </div>
      <div class="wb-row">
        <label class="wb-label">冷却</label>
        <input v-model.number="cooldown" type="number" min="0" class="wb-input wb-input-num" placeholder="0=关闭" />
      </div>
      <div class="wb-row">
        <label class="wb-label">延迟</label>
        <input v-model.number="delay" type="number" min="0" class="wb-input wb-input-num" placeholder="0=关闭" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.wb-props {
  border-top: 1px solid var(--ide-border);
  background: var(--ide-code-bg);
}

.wb-props-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--ide-border);
  color: var(--ide-dim);
  font-size: 13px;
  font-weight: 600;
}

.wb-props-wb {
  font-size: 11px;
  color: var(--ide-dim-3);
  margin-left: 4px;
}

.wb-props-save {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid var(--ide-success-border);
  background: var(--ide-success-soft);
  color: var(--ide-success-text);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.wb-props-save:hover:not(:disabled) {
  background: var(--ide-success-soft-strong);
}

.wb-props-save:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.wb-props-body {
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 280px;
  overflow-y: auto;
}

.wb-props-body::-webkit-scrollbar { width: 3px; }

.wb-props-body::-webkit-scrollbar-thumb {
  background: var(--ide-scrollbar);
  border-radius: 2px;
}

.wb-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wb-label {
  font-size: 12px;
  color: var(--ide-dim-2);
  min-width: 72px;
  flex-shrink: 0;
}

.wb-section {
  font-size: 11px;
  font-weight: 700;
  color: var(--ide-dim-3);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding-top: 6px;
  border-top: 1px solid var(--ide-border-soft);
  margin-top: 2px;
}

.wb-select {
  flex: 1;
  background: var(--ide-input-bg);
  border: 1px solid var(--ide-input-border);
  border-radius: 4px;
  color: var(--ide-text);
  font-size: 12px;
  padding: 4px 6px;
  outline: none;
}

.wb-select:focus { border-color: var(--ide-accent-border); }

.wb-select option {
  background: var(--ide-bg2);
  color: var(--ide-text);
}

.wb-input {
  flex: 1;
  background: var(--ide-input-bg);
  border: 1px solid var(--ide-input-border);
  border-radius: 4px;
  color: var(--ide-text);
  font-size: 12px;
  padding: 4px 8px;
  outline: none;
}

.wb-input:focus { border-color: var(--ide-accent-border); }
.wb-input::placeholder { color: var(--ide-dim-3); }
.wb-input-num { max-width: 80px; }

.wb-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ide-dim);
  cursor: pointer;
}

.wb-toggle input[type='checkbox'] {
  width: 14px;
  height: 14px;
  accent-color: var(--ide-accent);
  cursor: pointer;
}
</style>
