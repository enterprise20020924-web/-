<template>
  <div class="archive-abilities animate-slide-up space-y-8 pb-4">
    <!-- Active Skills Section (hidden in Life Sim Mode) -->
    <div v-if="!isLifeSimMode" class="sk-ability-section bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
      <div class="sk-ability-header bg-white/5 border-b border-white/5 p-4 flex justify-between items-center backdrop-blur-md">
        <div class="flex items-center gap-2">
          <div class="sk-ability-head-icon is-active p-1.5 bg-red-500/20 rounded text-red-400">
            <i class="fas fa-hand-fist"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">主动技能</h3>
            <p class="text-xs text-gray-400">选择 {{ MAX_ACTIVE_SKILLS }} 个性斗手段</p>
          </div>
        </div>
        <div class="sk-ability-counter text-right bg-white/5 px-3 py-1 rounded-full border border-white/5">
          <span
            :class="[
              'font-bold',
              data.initialActiveSkills.length === MAX_ACTIVE_SKILLS ? 'is-full text-secondary' : 'text-white',
            ]"
          >
            {{ data.initialActiveSkills.length }}
          </span>
          <span class="text-gray-500 text-sm">/{{ MAX_ACTIVE_SKILLS }}</span>
        </div>
      </div>

      <div class="sk-loadout-bar" aria-label="已装备主动技能槽位">
        <template v-for="slotIndex in MAX_ACTIVE_SKILLS" :key="`active-slot-${slotIndex}`">
          <button
            v-if="selectedActiveSkillObjects[slotIndex - 1]"
            type="button"
            class="sk-loadout-slot is-filled"
            :title="`点击卸下：${selectedActiveSkillObjects[slotIndex - 1].name}`"
            @click="toggleActiveSkill(selectedActiveSkillObjects[slotIndex - 1].id)"
          >
            <span class="sk-loadout-idx">0{{ slotIndex }}</span>
            <strong>{{ selectedActiveSkillObjects[slotIndex - 1].name }}</strong>
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
          <span v-else class="sk-loadout-slot is-empty" aria-hidden="true">
            <span class="sk-loadout-idx">0{{ slotIndex }}</span>
            <small>EMPTY</small>
          </span>
        </template>
      </div>

      <div class="sk-ability-scroll p-4 h-[350px] overflow-y-auto custom-scrollbar">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="skill in starterSkills"
            :key="skill.id"
            type="button"
            @click="toggleActiveSkill(skill.id)"
            :disabled="
              !data.initialActiveSkills.includes(skill.id) && data.initialActiveSkills.length >= MAX_ACTIVE_SKILLS
            "
            :class="[
              'sk-ability-card relative group p-3 rounded-xl border transition-all duration-300 text-left flex flex-col gap-2',
              data.initialActiveSkills.includes(skill.id)
                ? 'is-selected bg-secondary/20 border-secondary ring-1 ring-secondary'
                : data.initialActiveSkills.length >= MAX_ACTIVE_SKILLS
                  ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30',
            ]"
          >
            <!-- 技能头部 -->
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'sk-ability-card-icon p-2.5 rounded-lg transition-colors shrink-0',
                  data.initialActiveSkills.includes(skill.id)
                    ? 'bg-secondary text-white'
                    : 'bg-black/30 text-gray-400 group-hover:text-gray-200',
                ]"
              >
                <i :class="['fas', getIconClass(skill.icon)]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <h4
                    :class="[
                      'font-bold text-sm truncate pr-2 transition-colors',
                      data.initialActiveSkills.includes(skill.id) ? 'text-white' : 'text-gray-200',
                    ]"
                  >
                    {{ skill.name }}
                  </h4>
                  <span :class="['sk-rarity-badge text-xs px-1.5 py-0.5 rounded', getRarityClass(skill.rarity)]">
                    {{ skill.rarity }}
                  </span>
                </div>
                <p class="sk-ability-desc text-xs text-secondary mt-1 font-medium">
                  {{ skill.effectDescription }}
                </p>
              </div>
            </div>

            <!-- 技能数值 -->
            <div class="sk-ability-chips flex flex-wrap gap-1.5 mt-1">
              <span class="sk-metric-chip is-cost text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                <i class="fas fa-bolt-lightning mr-1"></i>{{ skill.staminaCost }}耐力
              </span>
              <span
                v-if="skill.cooldown > 0"
                class="sk-metric-chip is-cd text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30"
              >
                <i class="fas fa-clock mr-1"></i>{{ skill.cooldown }}回合
              </span>
              <span class="sk-metric-chip is-acc text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                <i class="fas fa-crosshairs mr-1"></i>{{ skill.accuracy }}%
              </span>
            </div>

            <!-- 伤害公式 -->
            <div v-if="skill.damageFormula && skill.damageFormula.length > 0" class="sk-ability-formula text-xs text-gray-400">
              <span class="text-gray-500">伤害:</span>
              <span v-for="(dmg, idx) in skill.damageFormula" :key="idx" class="sk-formula-term text-orange-400">
                {{ idx > 0 ? ' + ' : '' }}{{ Math.round(dmg.coefficient * 100) }}%{{ getDamageSourceName(dmg.source) }}
                <span v-if="(dmg.baseValue ?? 0) > 0">+{{ dmg.baseValue ?? 0 }}</span>
              </span>
            </div>

            <!-- 选中标记 -->
            <div v-if="data.initialActiveSkills.includes(skill.id)" class="sk-equipped-mark absolute top-2 right-2">
              <i class="fas fa-check-circle text-secondary"></i>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Constitution Skills Section -->
    <div class="sk-ability-section bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
      <div class="sk-ability-header bg-white/5 border-b border-white/5 p-4 flex justify-between items-center backdrop-blur-md">
        <div class="flex items-center gap-2">
          <div class="sk-ability-head-icon is-passive p-1.5 bg-blue-500/20 rounded text-blue-400">
            <i class="fas fa-dna"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">特殊体质</h3>
            <p class="text-xs text-gray-400">选择 {{ MAX_PASSIVE_SKILLS }} 个永久体质</p>
          </div>
        </div>
        <div class="sk-ability-counter text-right bg-white/5 px-3 py-1 rounded-full border border-white/5">
          <span
            :class="[
              'font-bold',
              data.initialPassiveSkills.length === MAX_PASSIVE_SKILLS ? 'is-full text-secondary' : 'text-white',
            ]"
          >
            {{ data.initialPassiveSkills.length }}
          </span>
          <span class="text-gray-500 text-sm">/{{ MAX_PASSIVE_SKILLS }}</span>
        </div>
      </div>

      <div class="sk-loadout-bar is-passive" aria-label="已选择特殊体质槽位">
        <template v-for="slotIndex in MAX_PASSIVE_SKILLS" :key="`passive-slot-${slotIndex}`">
          <button
            v-if="selectedConstitutionObjects[slotIndex - 1]"
            type="button"
            class="sk-loadout-slot is-filled"
            :title="`点击卸下：${selectedConstitutionObjects[slotIndex - 1].name}`"
            @click="toggleConstitution(selectedConstitutionObjects[slotIndex - 1].id)"
          >
            <span class="sk-loadout-idx">0{{ slotIndex }}</span>
            <strong>{{ selectedConstitutionObjects[slotIndex - 1].name }}</strong>
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
          <span v-else class="sk-loadout-slot is-empty" aria-hidden="true">
            <span class="sk-loadout-idx">0{{ slotIndex }}</span>
            <small>EMPTY</small>
          </span>
        </template>
      </div>

      <div class="sk-ability-scroll p-4 h-[350px] overflow-y-auto custom-scrollbar">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            v-for="constitution in currentConstitutions"
            :key="constitution.id"
            type="button"
            @click="toggleConstitution(constitution.id)"
            :disabled="
              !data.initialPassiveSkills.includes(constitution.id) &&
              data.initialPassiveSkills.length >= MAX_PASSIVE_SKILLS
            "
            :class="[
              'sk-ability-card relative group p-3 rounded-xl border transition-all duration-300 text-left flex flex-col gap-2',
              data.initialPassiveSkills.includes(constitution.id)
                ? 'is-selected bg-secondary/20 border-secondary ring-1 ring-secondary'
                : data.initialPassiveSkills.length >= MAX_PASSIVE_SKILLS
                  ? 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30',
            ]"
          >
            <!-- 体质头部 -->
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'sk-ability-card-icon p-2.5 rounded-lg transition-colors shrink-0',
                  data.initialPassiveSkills.includes(constitution.id)
                    ? 'bg-secondary text-white'
                    : 'bg-black/30 text-gray-400 group-hover:text-gray-200',
                ]"
              >
                <i :class="['fas', getIconClass(constitution.icon)]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <h4
                    :class="[
                      'font-bold text-sm truncate pr-2 transition-colors',
                      data.initialPassiveSkills.includes(constitution.id) ? 'text-white' : 'text-gray-200',
                    ]"
                  >
                    {{ constitution.name }}
                  </h4>
                  <span :class="['sk-rarity-badge text-xs px-1.5 py-0.5 rounded', getConstitutionRarityClass(constitution.rarity)]">
                    {{ constitution.rarity }}
                  </span>
                </div>
                <p class="sk-ability-desc text-xs text-secondary mt-1 font-medium">
                  {{ constitution.effectDescription }}
                </p>
              </div>
            </div>

            <!-- 属性加成 -->
            <div v-if="getConstitutionDisplayModifiers(constitution).length > 0" class="sk-ability-chips flex flex-wrap gap-1.5">
              <span
                v-for="(mod, idx) in getConstitutionDisplayModifiers(constitution)"
                :key="idx"
                :class="[
                  'sk-metric-chip text-xs px-2 py-0.5 rounded border',
                  mod.value > 0
                    ? 'is-pos bg-green-500/20 text-green-400 border-green-500/30'
                    : 'is-neg bg-red-500/20 text-red-400 border-red-500/30',
                ]"
              >
                {{ getModifierLabel(mod.stat) }} {{ mod.value > 0 ? '+' : '' }}{{ mod.value
                }}{{ mod.isPercent ? '%' : '' }}
              </span>
            </div>

            <!-- 敏感度修正 -->
            <div v-if="constitution.sensitivityModifiers.length > 0" class="sk-ability-chips flex flex-wrap gap-1.5">
              <span
                v-for="(sens, idx) in constitution.sensitivityModifiers"
                :key="idx"
                class="sk-metric-chip is-sens text-xs px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30"
              >
                {{ sens.bodyPart === 'all' ? '全身' : sens.bodyPart }}敏感度 {{ sens.modifier > 0 ? '+' : ''
                }}{{ sens.modifier }}%
              </span>
            </div>

            <!-- 选中标记 -->
            <div v-if="data.initialPassiveSkills.includes(constitution.id)" class="sk-equipped-mark absolute top-2 right-2">
              <i class="fas fa-check-circle text-secondary"></i>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="sk-preset-manager rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-inner shadow-white/5 backdrop-blur-sm">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div class="sk-preset-title flex items-center gap-2 text-sm font-semibold text-white">
              <i class="fas fa-id-card text-secondary"></i>
              人物预设
            </div>
            <div class="sk-preset-desc mt-1 text-xs text-gray-400">保存当前完整开局配置，或修改已保存的人物预设。</div>
          </div>
          <div class="flex shrink-0 flex-col gap-2 sm:flex-row">
            <input
              v-model="presetName"
              type="text"
              class="sk-preset-input focus:ring-secondary/40 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white placeholder-gray-400 shadow-inner shadow-white/5 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15 focus:ring-2 focus:outline-none"
              placeholder="新预设名称"
            />
            <button
              type="button"
              class="sk-preset-btn is-save rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-white/10 transition-all hover:scale-[1.02] hover:shadow-white/20 active:scale-95"
              @click="emit('save-player-preset', normalizedPresetName)"
            >
              <i class="fas fa-save mr-1"></i> 保存当前人设
            </button>
          </div>
        </div>

        <div class="sk-preset-divider grid gap-3 border-t border-white/10 pt-4">
          <div class="flex flex-col gap-2 md:flex-row md:items-center">
            <div class="relative min-w-0 md:w-56">
              <select
                :value="selectedPlayerPresetName"
                :disabled="playerPresets.length === 0"
                class="sk-preset-select focus:ring-secondary/40 w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 pr-9 text-sm font-semibold text-white shadow-inner shadow-white/5 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                @change="e => emit('update-selected-player-preset', (e.target as HTMLSelectElement).value)"
              >
                <option v-if="playerPresets.length === 0" value="">暂无预设</option>
                <option v-for="preset in playerPresets" :key="preset.name" :value="preset.name">
                  {{ preset.name }}
                </option>
              </select>
              <i
                class="fas fa-chevron-down pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-300"
              ></i>
            </div>
            <div class="sk-preset-desc text-xs text-gray-400">选择已有预设后可改名、用当前表单覆盖，或删除。</div>
          </div>

          <div v-if="playerPresets.length > 0" class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div class="relative">
                <i
                  class="fas fa-pen pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-gray-400"
                ></i>
                <input
                  v-model="editingPresetName"
                  type="text"
                  class="sk-preset-input focus:ring-secondary/40 w-full rounded-xl border border-white/15 bg-white/10 px-9 py-2.5 text-sm font-semibold text-white placeholder-gray-400 shadow-inner shadow-white/5 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/15 focus:ring-2 focus:outline-none"
                  placeholder="选中预设的新名称"
                />
              </div>
              <button
                type="button"
                class="sk-preset-btn is-rename rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-white/25 hover:bg-white/15 active:scale-95"
                @click="emit('rename-player-preset', normalizedEditingPresetName)"
              >
                <i class="fas fa-i-cursor mr-1"></i> 改名
              </button>
            </div>
            <div class="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                class="sk-preset-btn is-overwrite rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-all hover:bg-emerald-400/20 active:scale-95"
                @click="emit('update-player-preset')"
              >
                <i class="fas fa-save mr-1"></i> 覆盖信息
              </button>
              <button
                type="button"
                class="sk-preset-btn is-delete rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition-all hover:bg-red-400/20 active:scale-95"
                @click="emit('delete-player-preset')"
              >
                <i class="fas fa-trash mr-1"></i> 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { PlayerPresetSummary } from '../../shared/playerPresetStore';
import {
  XIAOYEYUE_LIGHT_DARK_CONSTITUTION_ID,
  calculateXiaoyeyueLightDarkBonus,
} from '../../shared/xiaoyeyueMagicGirl';
import { ConstitutionRarity, getConstitutionsForCharacter } from '../data/constitutions';
import { DamageSource, SkillRarity, STARTER_SKILLS } from '../data/skills';
import { getIconClass } from '../icon-helper';
import { CharacterData } from '../types';

interface DisplayModifier {
  stat: string;
  value: number;
  isPercent: boolean;
}

const props = defineProps<{
  data: CharacterData;
  isLifeSimMode?: boolean;
  playerPresets: PlayerPresetSummary[];
  selectedPlayerPresetName?: string;
}>();

const emit = defineEmits<{
  (e: 'update-data', fields: Partial<CharacterData>): void;
  (e: 'save-player-preset', name: string): void;
  (e: 'update-selected-player-preset', name: string): void;
  (e: 'update-player-preset'): void;
  (e: 'rename-player-preset', name: string): void;
  (e: 'delete-player-preset'): void;
}>();

const MAX_ACTIVE_SKILLS = 5;
const MAX_PASSIVE_SKILLS = 2;
const presetName = ref('');
const editingPresetName = ref('');

const normalizedPresetName = computed(() => presetName.value.trim() || props.data.name.trim() || '默认预设');
const normalizedEditingPresetName = computed(
  () => editingPresetName.value.trim() || props.selectedPlayerPresetName || '默认预设',
);

watch(
  () => props.data.name,
  name => {
    if (!presetName.value.trim()) {
      presetName.value = name.trim();
    }
  },
  { immediate: true },
);

watch(
  () => props.selectedPlayerPresetName,
  name => {
    editingPresetName.value = name || '';
  },
  { immediate: true },
);

// 使用新的数据结构
const starterSkills = computed(() => STARTER_SKILLS);

// 获取当前角色可用的体质
const currentConstitutions = computed(() => getConstitutionsForCharacter(props.data));

const selectedActiveSkillObjects = computed(() =>
  props.data.initialActiveSkills
    .map(id => starterSkills.value.find(skill => skill.id === id))
    .filter((skill): skill is (typeof STARTER_SKILLS)[number] => Boolean(skill)),
);

const selectedConstitutionObjects = computed(() =>
  props.data.initialPassiveSkills
    .map(id => currentConstitutions.value.find(item => item.id === id))
    .filter((item): item is (typeof currentConstitutions.value)[number] => Boolean(item)),
);
const getConstitutionDisplayModifiers = (constitution: { id: string; permanentModifiers: DisplayModifier[] }) => {
  if (constitution.id !== XIAOYEYUE_LIGHT_DARK_CONSTITUTION_ID) {
    return constitution.permanentModifiers;
  }

  const bonus = calculateXiaoyeyueLightDarkBonus(props.data.attributes?.核心状态?.堕落度 ?? 0);
  return Object.entries(bonus)
    .filter(([, value]) => Number(value) !== 0)
    .map(([stat, value]) => ({
      stat,
      value: Number(value),
      isPercent: stat.endsWith('成算'),
    }));
};

// 获取技能稀有度样式
const getRarityClass = (rarity: SkillRarity): string => {
  switch (rarity) {
    case SkillRarity.COMMON:
      return 'bg-gray-500/20 text-gray-400';
    case SkillRarity.RARE:
      return 'bg-blue-500/20 text-blue-400';
    case SkillRarity.EPIC:
      return 'bg-purple-500/20 text-purple-400';
    case SkillRarity.LEGENDARY:
      return 'bg-orange-500/20 text-orange-400';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

// 获取体质稀有度样式
const getConstitutionRarityClass = (rarity: ConstitutionRarity): string => {
  switch (rarity) {
    case ConstitutionRarity.COMMON:
      return 'bg-gray-500/20 text-gray-400';
    case ConstitutionRarity.RARE:
      return 'bg-blue-500/20 text-blue-400';
    case ConstitutionRarity.EPIC:
      return 'bg-purple-500/20 text-purple-400';
    case ConstitutionRarity.LEGENDARY:
      return 'bg-orange-500/20 text-orange-400';
    case ConstitutionRarity.MYTHIC:
      return 'bg-pink-500/20 text-pink-400';
    case ConstitutionRarity.EX:
      return 'bg-cyan-300/20 text-cyan-200';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
};

// 获取属性修正标签
const getModifierLabel = (stat: string): string => {
  const map: Record<string, string> = {
    魅力加成: '魅力',
    幸运加成: '幸运',
    基础性斗力加成: '性斗力',
    基础性斗力成算: '性斗力乘算',
    基础忍耐力加成: '忍耐力',
    基础忍耐力成算: '忍耐力乘算',
    闪避率加成: '闪避率',
    暴击率加成: '暴击率',
    最大耐力加成: '最大耐力',
    最大快感加成: '最大快感',
  };
  return map[stat] || stat;
};

// 获取伤害来源名称
const getDamageSourceName = (source: DamageSource): string => {
  switch (source) {
    case DamageSource.SEX_POWER:
      return '性斗力';
    case DamageSource.CHARM:
      return '魅力';
    case DamageSource.LEVEL:
      return '等级';
    case DamageSource.TARGET_LUST:
      return '目标快感';
    case DamageSource.TARGET_MISSING_STAMINA:
      return '目标已损耐力';
    case DamageSource.LUCK:
      return '幸运';
    case DamageSource.POTENTIAL:
      return '潜力';
    case DamageSource.SELF_LUST:
      return '自身快感';
    default:
      return '未知';
  }
};

const toggleActiveSkill = (skillId: string) => {
  const current = [...props.data.initialActiveSkills];
  const index = current.indexOf(skillId);
  if (index >= 0) {
    current.splice(index, 1);
  } else if (current.length < MAX_ACTIVE_SKILLS) {
    current.push(skillId);
  }
  emit('update-data', { initialActiveSkills: current });
};

const toggleConstitution = (constitutionId: string) => {
  if (!currentConstitutions.value.some(constitution => constitution.id === constitutionId)) {
    return;
  }

  const current = [...props.data.initialPassiveSkills];
  const index = current.indexOf(constitutionId);
  if (index >= 0) {
    current.splice(index, 1);
  } else if (current.length < MAX_PASSIVE_SKILLS) {
    current.push(constitutionId);
  }
  emit('update-data', { initialPassiveSkills: current });
};
</script>

<style lang="scss" scoped></style>
