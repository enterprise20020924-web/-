<template>
  <div class="archive-assessment animate-slide-up space-y-6">
    <div
      :class="[
        'sk-assessment-console flex justify-between items-center p-4 rounded-xl border',
        cheatMode
          ? 'is-cheat bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-yellow-500/30'
          : 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-white/10',
      ]"
    >
      <div class="sk-assessment-summary text-sm text-gray-300">
        <p>
          当前难度: <span class="text-white font-bold">{{ data.difficulty }}</span>
          <span v-if="identity?.startingAttributePoints !== undefined" class="sk-assessment-badge ml-2 text-xs text-pink-300"
            >[{{ identity.name }}特典]</span
          >
          <span v-else-if="cheatMode" class="sk-assessment-badge is-cheat ml-2 text-xs text-yellow-400">[作弊模式]</span>
        </p>
        <p class="text-xs text-gray-500 mt-1">
          初始点数: {{ totalPointsAvailable }}
          <span v-if="timelineTalentBonus > 0" class="ml-1 text-secondary"
            >({{ data.mainlineTimeline }} +{{ timelineTalentBonus }})</span
          >
          <span v-if="pointsUsed > 0" class="sk-assessment-used ml-2">已分配 {{ pointsUsed }}</span>
        </p>
      </div>
      <div class="sk-assessment-controls flex items-center gap-4">
        <button
          v-if="pointsUsed > 0"
          type="button"
          class="sk-assessment-reset"
          :disabled="isUpdating"
          title="将本页可分配属性恢复为初始值"
          @click="handleResetStats"
        >
          <i class="fas fa-rotate-left" aria-hidden="true"></i>
          <span>重置</span>
        </button>
        <!-- x10 切换按钮 -->
        <button
          type="button"
          @click="x10Mode = !x10Mode"
          :class="[
            'sk-assessment-step-toggle px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border-2',
            x10Mode
              ? 'is-x10 bg-secondary/20 border-secondary text-secondary shadow-lg shadow-pink-500/30'
              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20',
          ]"
          title="点击切换x10模式"
        >
          <i :class="['fas', x10Mode ? 'fa-check-circle' : 'fa-times-circle', 'mr-2']"></i>
          <span class="font-mono">{{ x10Mode ? 'x10' : 'x1' }}</span>
        </button>
        <div class="sk-assessment-points text-right">
          <span class="block text-xs text-gray-400 uppercase tracking-wider">剩余点数</span>
          <span :class="['text-3xl font-bold', remaining === 0 ? 'is-depleted text-gray-500' : 'text-secondary animate-pulse']">
            {{ remaining }}
          </span>
        </div>
      </div>
    </div>

    <p v-if="fixedStart" class="sk-assessment-fixed-note text-secondary text-sm">
      身份固定开局：{{ fixedStart.level }} 级 · {{ fixedStart.rank }}-rank ·
      {{ fixedStart.potential }} 潜力，不消耗加点额度。
    </p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.path"
        :class="[
          'sk-stat-card flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors',
          {
            'is-locked': isStatLocked(stat.path),
            'is-raised': getCurrentValue(stat.path) > getInitialValue(stat.path),
          },
        ]"
        :style="getStatMeterStyle(stat.path)"
      >
        <div class="flex items-center gap-3">
          <div :class="['sk-stat-icon p-2 rounded-lg bg-black/20', stat.color]">
            <i :class="['fas', stat.icon]"></i>
          </div>
          <div>
            <span class="sk-stat-label block text-sm font-medium text-gray-200">
              {{ stat.label }}
              <em v-if="isStatLocked(stat.path)" class="sk-stat-lock-tag">FIXED</em>
              <em v-else-if="getStatDeltaLabel(stat.path)" class="sk-stat-delta-tag">{{ getStatDeltaLabel(stat.path) }}</em>
            </span>
            <span class="sk-stat-cost text-xs text-gray-500">{{
              isStatLocked(stat.path) ? '身份固定 · 不可调整' : stat.costText
            }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="handleStatChange(stat.path, -1)"
            :disabled="
              isStatLocked(stat.path) || getCurrentValue(stat.path) <= getInitialValue(stat.path) || isUpdating
            "
            :class="[
              'sk-stat-btn is-minus w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all',
              x10Mode ? 'is-x10 bg-white/10 hover:bg-white/20 border border-orange-500/30' : 'bg-white/5 hover:bg-white/10',
            ]"
            :title="x10Mode ? 'x10模式：点击一次减少10点' : '点击减少1点'"
          >
            <span v-if="x10Mode" class="text-xs font-bold">-10</span>
            <i v-else class="fas fa-minus text-sm"></i>
          </button>

          <span class="w-12 text-center font-mono font-bold text-lg text-white">
            {{ getCurrentValue(stat.path) }}
          </span>

          <button
            type="button"
            @click="handleStatChange(stat.path, 1)"
            :disabled="isStatLocked(stat.path) || remaining <= 0 || isUpdating"
            :class="[
              'sk-stat-btn is-plus w-8 h-8 flex items-center justify-center rounded-full text-white shadow-lg hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none transition-all',
              x10Mode
                ? 'is-x10 bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30'
                : 'bg-secondary shadow-pink-500/20',
            ]"
            :title="x10Mode ? 'x10模式：点击一次增加10点' : '点击增加1点'"
          >
            <span v-if="x10Mode" class="text-xs font-bold">+10</span>
            <i v-else class="fas fa-plus text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DIFFICULTY_POINTS, MAINLINE_TIMELINE_TALENT_BONUS, MAX_STATS } from '../constants';
import { getIdentityById } from '../data/identityDatabase';
import { CharacterAttributes, CharacterData } from '../types';
import {
  getIdentityFixedStart,
  getIdentityInitialAttributes,
  isIdentityAttributeLocked,
} from '../utils/identityStartingAttributes';
import { updateLatestStatData } from '../../shared/mvuStore';

const props = defineProps<{
  data: CharacterData;
  cheatMode?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update-data', fields: Partial<CharacterData>): void;
}>();

const isUpdating = ref(false);
const x10Mode = ref(false);
const identity = computed(() => getIdentityById(props.data.archetypeId));
const fixedStart = computed(() => getIdentityFixedStart(props.data));
const initialAttributes = computed(() => getIdentityInitialAttributes(props.data));
const isStatLocked = (path: string) => isIdentityAttributeLocked(props.data, path);

const timelineTalentBonus = computed(() => MAINLINE_TIMELINE_TALENT_BONUS[props.data.mainlineTimeline] ?? 0);

const totalPointsAvailable = computed(() => {
  const basePoints =
    identity.value?.startingAttributePoints ?? (props.cheatMode ? 999 : DIFFICULTY_POINTS[props.data.difficulty]);
  return basePoints + timelineTalentBonus.value;
});

// 根据路径获取当前值
const getCurrentValue = (path: string): number => {
  const [category, key] = path.split('.');
  return (props.data.attributes[category as keyof CharacterAttributes] as any)?.[key] || 0;
};

// 根据路径获取初始值
const getInitialValue = (path: string): number => {
  const [category, key] = path.split('.');
  return (initialAttributes.value[category as keyof CharacterAttributes] as any)?.[key] || 0;
};

// 计算已使用的点数（只计算可分配的6个属性）
const pointsUsed = computed(() => {
  let used = 0;
  const attrs = props.data.attributes;
  const init = initialAttributes.value;

  // 确保所有值都存在，否则使用0
  const getVal = (obj: any, path: string[], fallback: number) => {
    let val = obj;
    for (const key of path) {
      val = val?.[key];
      if (val === undefined) return fallback;
    }
    return val ?? fallback;
  };

  // 角色基础 - 等级
  used += (getVal(attrs, ['角色基础', '_等级'], 1) - getVal(init, ['角色基础', '_等级'], 1)) * 1;
  // 核心状态 - 潜力（使用 Math.round 避免浮点数精度问题）
  const potentialDiff = getVal(attrs, ['核心状态', '_潜力'], 5.0) - getVal(init, ['核心状态', '_潜力'], 5.0);
  used += Math.round(potentialDiff * 10) * 2; // 0.1潜力 = 2点，先乘10取整再乘2避免浮点误差
  // 基础属性 - 魅力
  used += (getVal(attrs, ['基础属性', '_魅力'], 10) - getVal(init, ['基础属性', '_魅力'], 10)) * 1;
  // 基础属性 - 幸运
  used += (getVal(attrs, ['基础属性', '_幸运'], 10) - getVal(init, ['基础属性', '_幸运'], 10)) * 1;
  // 核心状态 - 最大耐力和最大快感
  used += (getVal(attrs, ['核心状态', '$最大耐力'], 100) - getVal(init, ['核心状态', '$最大耐力'], 100)) / 5;
  used += (getVal(attrs, ['核心状态', '$最大快感'], 100) - getVal(init, ['核心状态', '$最大快感'], 100)) / 5;

  return Math.max(0, Math.ceil(used));
});

const remaining = computed(() => totalPointsAvailable.value - pointsUsed.value);
defineExpose({ remaining });

// 可分配的属性列表（只有6个可分配属性）
const stats = [
  {
    path: '角色基础._等级',
    label: '初始等级',
    icon: 'fa-arrow-trend-up',
    color: 'text-yellow-400',
    costText: '1点 = 1级',
  },
  { path: '核心状态._潜力', label: '潜力资质', icon: 'fa-star', color: 'text-purple-400', costText: '2点 = 0.1潜力' },
  {
    path: '核心状态.$最大耐力',
    label: '最大耐力',
    icon: 'fa-shield-halved',
    color: 'text-green-400',
    costText: '1点 = 5耐力',
  },
  { path: '核心状态.$最大快感', label: '最大快感', icon: 'fa-heart', color: 'text-pink-400', costText: '1点 = 5快感' },
  {
    path: '基础属性._魅力',
    label: '基础魅力',
    icon: 'fa-face-grin-hearts',
    color: 'text-rose-400',
    costText: '1点 = 1魅力',
  },
  { path: '基础属性._幸运', label: '基础幸运', icon: 'fa-clover', color: 'text-cyan-400', costText: '1点 = 1幸运' },
];

const handleStatChange = async (path: string, delta: number) => {
  if (isUpdating.value || isStatLocked(path)) return;

  const [category, key] = path.split('.');

  // 计算实际的变化倍数
  const multiplier = x10Mode.value ? 10 : 1;
  const actualDelta = delta * multiplier;

  let cost = 1;
  let valueChange = actualDelta;

  // 根据属性类型计算成本和变化值
  if (path === '核心状态.$最大耐力' || path === '核心状态.$最大快感') {
    cost = 1;
    valueChange = actualDelta * 5;
  } else if (path === '核心状态._潜力') {
    cost = 2;
    valueChange = actualDelta * 0.1;
  }

  // 计算总成本
  const totalCost = cost * multiplier;

  // 检查剩余点数是否足够
  if (delta > 0 && remaining.value < totalCost) return;

  const currentVal = getCurrentValue(path);
  const maxVal = MAX_STATS[path as keyof typeof MAX_STATS] || 9999;
  const minVal = getInitialValue(path);

  // 计算新值
  let newVal = currentVal + valueChange;

  // 如果超过上限，调整到上限
  if (newVal > maxVal) {
    newVal = maxVal;
    // 重新计算实际使用的点数
    const actualValueChange = newVal - currentVal;
    if (path === '核心状态.$最大耐力' || path === '核心状态.$最大快感') {
      valueChange = actualValueChange;
    } else if (path === '核心状态._潜力') {
      valueChange = actualValueChange;
    } else {
      valueChange = actualValueChange;
    }
  }

  // 如果低于下限，调整到下限
  if (newVal < minVal) {
    newVal = minVal;
    valueChange = newVal - currentVal;
  }

  if (path === '核心状态._潜力') newVal = parseFloat(newVal.toFixed(1));

  if (newVal <= maxVal && newVal >= minVal) {
    isUpdating.value = true;

    try {
      // 更新本地状态
      const newAttributes = { ...props.data.attributes };
      const categoryObj = { ...newAttributes[category as keyof CharacterAttributes] } as any;
      categoryObj[key] = newVal;
      newAttributes[category as keyof CharacterAttributes] = categoryObj as any;

      // 先更新本地状态（立即反馈）
      emit('update-data', {
        attributes: newAttributes,
      });

      // 然后实时更新 MVU 变量
      await updateLatestStatData({ [path]: newVal });
    } catch (error) {
      console.error('更新失败:', error);
    } finally {
      isUpdating.value = false;
    }
  }
};

const statMeterVisualCeiling: Record<string, number> = {
  '角色基础._等级': 40,
  '核心状态._潜力': 10,
  '核心状态.$最大耐力': 400,
  '核心状态.$最大快感': 400,
  '基础属性._魅力': 60,
  '基础属性._幸运': 60,
};

const getStatMeterStyle = (path: string) => {
  const cur = getCurrentValue(path);
  const base = getInitialValue(path);
  const ceiling = Math.max(statMeterVisualCeiling[path] ?? 100, cur, base + 1);
  const basePct = Math.max(4, Math.min(100, Math.round((base / ceiling) * 100)));
  const curPct = Math.max(basePct, Math.min(100, Math.round((cur / ceiling) * 100)));
  return {
    '--stat-base-pct': `${basePct}%`,
    '--stat-cur-pct': `${curPct}%`,
  };
};

const getStatDeltaLabel = (path: string): string => {
  const diff = getCurrentValue(path) - getInitialValue(path);
  if (diff <= 0) return '';
  if (path === '核心状态._潜力') return `+${diff.toFixed(1)}`;
  return `+${Math.round(diff)}`;
};

const handleResetStats = async () => {
  if (isUpdating.value || pointsUsed.value <= 0) return;
  isUpdating.value = true;
  try {
    const init = initialAttributes.value;
    const newAttributes: CharacterAttributes = {
      ...props.data.attributes,
      角色基础: { ...props.data.attributes.角色基础 },
      核心状态: { ...props.data.attributes.核心状态 },
      基础属性: { ...props.data.attributes.基础属性 },
    };
    const updates: Record<string, number> = {};
    for (const stat of stats) {
      if (isStatLocked(stat.path)) continue;
      const [category, key] = stat.path.split('.');
      const initVal = (init[category as keyof CharacterAttributes] as any)?.[key];
      if (initVal !== undefined) {
        (newAttributes[category as keyof CharacterAttributes] as any)[key] = initVal;
        updates[stat.path] = initVal;
      }
    }
    emit('update-data', { attributes: newAttributes });
    if (Object.keys(updates).length > 0) {
      await updateLatestStatData(updates);
    }
  } catch (error) {
    console.error('重置属性失败:', error);
  } finally {
    isUpdating.value = false;
  }
};
</script>

<style lang="scss" scoped></style>
