<template>
  <div class="archive-archetypes animate-slide-up space-y-8">
    <!-- Archetype Selection -->
    <div v-if="allowIdentitySelection" class="sk-archetype-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="sk-archetype-list-shell lg:col-span-2 space-y-4">
        <!-- Header Panel -->
        <div
          class="sk-archetype-list-head bg-black/20 border border-white/5 rounded-t-2xl p-4 flex flex-wrap justify-between items-center gap-3 backdrop-blur-md"
        >
          <div class="flex items-center gap-2">
            <div class="sk-archetype-head-icon p-1.5 bg-secondary/20 rounded text-secondary">
              <i class="fas fa-user"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-white">校园身份</h3>
              <p class="text-xs text-gray-400">选择 1 个核心身份（{{ filteredArchetypes.length }}/{{ currentArchetypes.length }}）</p>
            </div>
          </div>
          <div v-if="currentArchetypes.length > 4" class="sk-archetype-search">
            <i class="fas fa-magnifying-glass" aria-hidden="true"></i>
            <input
              v-model.trim="archetypeQuery"
              type="search"
              aria-label="筛选校园身份"
              placeholder="筛选身份…"
            />
          </div>
        </div>

        <!-- Scrollable List -->
        <div
          class="sk-archetype-scroll bg-black/20 border-x border-b border-white/5 rounded-b-2xl p-4 h-[450px] overflow-y-auto custom-scrollbar"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              v-for="archetype in filteredArchetypes"
              :key="archetype.id"
              type="button"
              @click="handleArchetypeSelect(archetype.id)"
              :disabled="isUpdating"
              :class="[
                'sk-archetype-card relative group p-4 rounded-xl border transition-all duration-300 text-left flex items-start gap-3',
                data.archetypeId === archetype.id
                  ? 'is-selected bg-secondary/20 border-secondary ring-1 ring-secondary'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20',
                isUpdating ? 'opacity-50 cursor-wait' : '',
              ]"
            >
              <div
                :class="[
                  'sk-archetype-card-icon p-2.5 rounded-lg transition-colors shrink-0',
                  data.archetypeId === archetype.id
                    ? 'bg-secondary text-white'
                    : 'bg-black/30 text-gray-400 group-hover:text-gray-200',
                ]"
              >
                <i :class="['fas', getIconClass(archetype.icon)]"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <h4
                    :class="[
                      'font-bold text-base transition-colors',
                      data.archetypeId === archetype.id ? 'text-white' : 'text-gray-200',
                    ]"
                  >
                    {{ archetype.name }}
                  </h4>
                  <span v-if="data.archetypeId === archetype.id" class="sk-archetype-selected-tag">ACTIVE</span>
                </div>
                <p class="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  {{ archetype.description }}
                </p>
              </div>
            </button>
          </div>
          <p v-if="filteredArchetypes.length === 0" class="sk-archetype-empty">没有匹配的校园身份</p>
        </div>
      </div>

      <!-- Selected Archetype Detail Panel -->
      <div class="lg:col-span-1">
        <div
          :class="[
            'sk-archetype-detail h-full rounded-2xl border border-white/10 p-6 flex flex-col items-center text-center transition-all duration-500',
            selectedArchetype ? 'is-populated bg-gradient-to-b from-secondary/10 to-transparent' : 'bg-white/5 grayscale opacity-50',
          ]"
        >
          <template v-if="selectedArchetype">
            <div class="sk-archetype-detail-head">
              <div
                class="sk-archetype-detail-icon w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4 text-secondary shadow-[0_0_20px_rgba(236,72,153,0.3)]"
              >
                <i :class="['fas', getIconClass(selectedArchetype.passiveSkill.icon)]"></i>
              </div>
              <h4 class="sk-archetype-detail-kicker text-sm uppercase tracking-widest text-secondary font-bold mb-1">身份效果</h4>
              <h3 class="sk-archetype-detail-name text-xl font-bold text-white mb-4">{{ selectedArchetype.passiveSkill.name }}</h3>
            </div>
            <p v-for="mechanism in selectedArchetype.mechanisms" :key="mechanism.id" class="sk-archetype-mech text-secondary mb-4 text-sm">
              {{ mechanism.description }}
            </p>
            <p v-if="selectedArchetype.fixedStart" class="sk-archetype-fixed text-secondary mb-4 text-sm">
              固定以 {{ selectedArchetype.fixedStart.level }} 级、{{ selectedArchetype.fixedStart.rank }}-rank、
              {{ selectedArchetype.fixedStart.potential }} 潜力开局，等级与潜力不可调整，不消耗加点额度。
            </p>

            <div class="sk-archetype-bonuses w-full pt-4 border-t border-white/10">
              <h4 class="sk-archetype-bonus-title text-xs uppercase tracking-widest text-gray-500 mb-3">永久状态</h4>
              <div class="sk-archetype-bonus-name mb-3">
                <span class="text-sm font-bold text-secondary">{{ selectedArchetype.passiveSkill.name }}</span>
              </div>
              <div class="sk-archetype-bonus-grid flex flex-wrap gap-2 justify-center">
                <template v-for="[key, value] in Object.entries(selectedArchetype.permanentState.bonus)" :key="key">
                  <span
                    v-if="value !== 0"
                    :class="[
                      'sk-archetype-bonus-chip text-xs px-2 py-1 rounded-md bg-black/40 text-gray-200 border border-white/10',
                      (value as number) > 0 ? 'is-positive' : 'is-negative',
                    ]"
                  >
                    {{ getBonusLabel(key) }}
                    <span :class="(value as number) > 0 ? 'text-green-400' : 'text-red-400'">
                      {{ (value as number) > 0 ? '+' : '' }}{{ value }}{{ getBonusUnit(key) }}
                    </span>
                  </span>
                </template>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex flex-col items-center justify-center h-full text-gray-500">
              <i class="fas fa-sparkles text-5xl mb-4 opacity-20"></i>
              <p>请选择一个身份以查看详情</p>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Body Stats Customization -->
    <div class="sk-body-panel bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 class="sk-body-panel-title text-lg text-white font-medium mb-6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <i class="fas fa-chart-line text-secondary"></i>
          身体数据定制
        </div>
        <span v-if="isOther" class="text-xs text-gray-500 flex items-center gap-1">
          <i class="fas fa-gear"></i> 非二元自由配置
        </span>
      </h3>

      <!-- Non-binary Config Toggles -->
      <div v-if="isOther" class="mb-8 bg-black/20 p-4 rounded-xl border border-white/5">
        <label class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 block">生理构造设置</label>
        <div class="space-y-3">
          <!-- 扶她选项 -->
          <button
            @click="setFuta"
            :class="[
              'w-full px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
              data.configFeatures.hasBreasts && data.configFeatures.hasPenis
                ? 'bg-secondary/20 border-secondary text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white',
            ]"
          >
            <i class="fas fa-venus-mars mr-2"></i> 扶她 (双性特征)
          </button>

          <!-- 自定义选项 -->
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer group">
              <div
                :class="[
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  data.configFeatures.hasBreasts ? 'bg-secondary border-secondary' : 'border-gray-500 bg-transparent',
                ]"
              >
                <i v-if="data.configFeatures.hasBreasts" class="fas fa-check text-white text-xs"></i>
              </div>
              <input
                type="checkbox"
                class="hidden"
                :checked="data.configFeatures.hasBreasts"
                @change="toggleFeature('hasBreasts')"
              />
              <span
                :class="[
                  'text-sm group-hover:text-white transition-colors',
                  data.configFeatures.hasBreasts ? 'text-white' : 'text-gray-400',
                ]"
              >
                女性性征 (乳房/臀部)
              </span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer group">
              <div
                :class="[
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  data.configFeatures.hasPenis ? 'bg-secondary border-secondary' : 'border-gray-500 bg-transparent',
                ]"
              >
                <i v-if="data.configFeatures.hasPenis" class="fas fa-check text-white text-xs"></i>
              </div>
              <input
                type="checkbox"
                class="hidden"
                :checked="data.configFeatures.hasPenis"
                @change="toggleFeature('hasPenis')"
              />
              <span
                :class="[
                  'text-sm group-hover:text-white transition-colors',
                  data.configFeatures.hasPenis ? 'text-white' : 'text-gray-400',
                ]"
              >
                男性性征 (阴茎)
              </span>
            </label>
          </div>

          <!-- 无性提示 -->
          <div
            v-if="!data.configFeatures.hasBreasts && !data.configFeatures.hasPenis"
            class="text-xs text-gray-500 italic"
          >
            <i class="fas fa-info-circle mr-1"></i> 当前为无性特征
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Height Slider -->
        <!-- Height Slider -->
        <div class="sk-range-card">
          <label class="sk-range-head flex justify-between text-sm font-medium text-gray-300 mb-4">
            <span class="flex items-center gap-2"> <i class="fas fa-ruler"></i> 身高 (Height) </span>
            <span class="sk-range-value text-secondary font-bold">{{ data.height }} cm</span>
          </label>
          <div
            class="sk-range-control relative flex items-center h-6"
            :style="{ '--range-pct': `${((data.height - 135) / (195 - 135)) * 100}%` }"
          >
            <input
              type="range"
              min="135"
              max="195"
              step="1"
              :value="data.height"
              aria-label="身高"
              @input="e => updateData({ height: parseInt((e.target as HTMLInputElement).value) })"
              class="sk-range-input absolute w-full h-6 bg-white/20 rounded-lg appearance-none cursor-pointer focus:outline-none accent-secondary z-20 opacity-0"
            />
            <div class="sk-range-track w-full h-2 bg-slate-700 rounded-full overflow-hidden absolute z-10">
              <div
                class="sk-range-fill h-full bg-gradient-to-r from-indigo-500 to-pink-500"
                :style="{ width: `${((data.height - 135) / (195 - 135)) * 100}%` }"
              />
            </div>
            <span class="sk-range-thumb" aria-hidden="true"></span>
          </div>
          <div class="sk-range-ticks flex justify-between text-xs text-gray-500 mt-2">
            <span>135cm</span>
            <span>165cm</span>
            <span>195cm</span>
          </div>
        </div>

        <!-- Hips Slider -->
        <div v-if="showBreasts" class="sk-range-card">
          <label class="sk-range-head flex justify-between text-sm font-medium text-gray-300 mb-4">
            <span class="flex items-center gap-2"> <i class="fas fa-circle"></i> 臀围 (Hips) </span>
            <span class="sk-range-value text-secondary font-bold">{{ data.hips }} cm</span>
          </label>
          <div
            class="sk-range-control relative flex items-center h-6"
            :style="{ '--range-pct': `${((data.hips - 75) / (120 - 75)) * 100}%` }"
          >
            <input
              type="range"
              min="75"
              max="120"
              step="1"
              :value="data.hips"
              aria-label="臀围"
              @input="e => updateData({ hips: parseInt((e.target as HTMLInputElement).value) })"
              class="sk-range-input absolute w-full h-6 bg-white/20 rounded-lg appearance-none cursor-pointer focus:outline-none accent-secondary z-20 opacity-0"
            />
            <div class="sk-range-track w-full h-2 bg-slate-700 rounded-full overflow-hidden absolute z-10">
              <div
                class="sk-range-fill h-full bg-gradient-to-r from-pink-500 to-rose-500"
                :style="{ width: `${((data.hips - 75) / (120 - 75)) * 100}%` }"
              />
            </div>
            <span class="sk-range-thumb" aria-hidden="true"></span>
          </div>
          <div class="sk-range-ticks flex justify-between text-xs text-gray-500 mt-2">
            <span>75cm (骨感)</span>
            <span>95cm (丰满)</span>
            <span>120cm (安产)</span>
          </div>
        </div>

        <!-- Cock Length Slider -->
        <div v-if="showPenis" class="sk-range-card">
          <label class="sk-range-head flex justify-between text-sm font-medium text-gray-300 mb-4">
            <span class="flex items-center gap-2"> <i class="fas fa-bolt"></i> 阴茎长度 (Length) </span>
            <span class="sk-range-value text-secondary font-bold">{{ data.cockLength }} cm</span>
          </label>
          <div
            class="sk-range-control relative flex items-center h-6"
            :style="{ '--range-pct': `${((data.cockLength - 5) / (30 - 5)) * 100}%` }"
          >
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              :value="data.cockLength"
              aria-label="阴茎长度"
              @input="e => updateData({ cockLength: parseInt((e.target as HTMLInputElement).value) })"
              class="sk-range-input absolute w-full h-6 bg-white/20 rounded-lg appearance-none cursor-pointer focus:outline-none accent-secondary z-20 opacity-0"
            />
            <div class="sk-range-track w-full h-2 bg-slate-700 rounded-full overflow-hidden absolute z-10">
              <div
                class="sk-range-fill h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                :style="{ width: `${((data.cockLength - 5) / (30 - 5)) * 100}%` }"
              />
            </div>
            <span class="sk-range-thumb" aria-hidden="true"></span>
          </div>
          <div class="sk-range-ticks flex justify-between text-xs text-gray-500 mt-2">
            <span>5cm</span>
            <span>15cm (平均)</span>
            <span>30cm (巨根)</span>
          </div>
        </div>

        <!-- Cup Size Selector -->
        <div v-if="showBreasts" class="sk-body-choice-group col-span-1 md:col-span-2">
          <label class="flex text-sm font-medium text-gray-300 mb-4 items-center gap-2">
            <i class="fas fa-heart"></i> 罩杯 (Cup Size)
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="size in CUP_SIZES"
              :key="size"
              type="button"
              @click="updateData({ cupSize: size })"
              :class="[
                'sk-choice-chip is-square w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200',
                data.cupSize === size
                  ? 'is-selected bg-secondary text-white shadow-lg scale-110 border-transparent'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/30 hover:text-white',
              ]"
            >
              {{ size }}
            </button>
          </div>
        </div>

        <!-- Female Genital Type Selector -->
        <div v-if="showBreasts" class="sk-body-choice-group col-span-1 md:col-span-2">
          <label class="flex text-sm font-medium text-gray-300 mb-4 items-center gap-2">
            <i class="fas fa-venus text-pink-400"></i> 女性性器特征
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in GENITAL_TYPES[Gender.FEMALE as keyof typeof GENITAL_TYPES]"
              :key="type"
              type="button"
              @click="updateData({ femaleGenitalType: type })"
              :class="[
                'sk-choice-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                data.femaleGenitalType === type
                  ? 'is-selected bg-secondary/20 border-secondary text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white',
              ]"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <!-- Male Genital Type Selector -->
        <div v-if="showPenis" class="sk-body-choice-group col-span-1 md:col-span-2">
          <label class="flex text-sm font-medium text-gray-300 mb-4 items-center gap-2">
            <i class="fas fa-mars text-blue-400"></i> 男性性器特征
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="type in GENITAL_TYPES[Gender.MALE as keyof typeof GENITAL_TYPES]"
              :key="type"
              type="button"
              @click="updateData({ maleGenitalType: type })"
              :class="[
                'sk-choice-chip px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                data.maleGenitalType === type
                  ? 'is-selected bg-secondary/20 border-secondary text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white',
              ]"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <!-- 无性提示 -->
        <div
          v-if="isOther && !data.configFeatures.hasBreasts && !data.configFeatures.hasPenis"
          class="col-span-1 md:col-span-2"
        >
          <div class="text-sm text-gray-400 italic flex items-center gap-2">
            <i class="fas fa-info-circle"></i> 当前为无性特征，无需选择性器类型
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CharacterData, Gender } from '../types';
import { CUP_SIZES, GENITAL_TYPES, getAvailableArchetypes } from '../constants';
import { getIconClass } from '../icon-helper';
import { updateLatestStatData } from '../../shared/mvuStore';

const props = withDefaults(
  defineProps<{
    data: CharacterData;
    allowIdentitySelection?: boolean;
  }>(),
  { allowIdentitySelection: true },
);

const emit = defineEmits<{
  (e: 'update-data', fields: Partial<CharacterData>): void;
}>();

const isUpdating = ref(false);
const archetypeQuery = ref('');

const currentArchetypes = computed(() => getAvailableArchetypes(props.data));
const filteredArchetypes = computed(() => {
  const q = archetypeQuery.value.toLowerCase();
  if (!q) return currentArchetypes.value;
  return currentArchetypes.value.filter(
    item => item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
  );
});
const isMale = computed(() => props.data.gender === Gender.MALE);
const isFemale = computed(() => props.data.gender === Gender.FEMALE);
const isOther = computed(() => props.data.gender === Gender.OTHER);

const showBreasts = computed(() => isFemale.value || (isOther.value && props.data.configFeatures.hasBreasts));
const showPenis = computed(() => isMale.value || (isOther.value && props.data.configFeatures.hasPenis));

const selectedArchetype = computed(() => currentArchetypes.value.find(a => a.id === props.data.archetypeId));

const getStatLabel = (path: string): string => {
  // 处理路径字符串，如 "角色基础._等级" 或 "基础属性._魅力"
  const parts = path.split('.');
  const key = parts[parts.length - 1];
  const map: Record<string, string> = {
    _等级: '等级',
    _潜力: '潜力',
    _魅力: '魅力',
    _幸运: '幸运',
    _闪避率: '闪避率',
    _暴击率: '暴击率',
    魅力: '魅力',
    幸运: '幸运',
    $最大耐力: '最大耐力',
    $最大快感: '最大快感',
    闪避率: '闪避率',
    暴击率: '暴击率',
  };
  return map[key] || key;
};

const getBonusLabel = (key: string): string => {
  const map: Record<string, string> = {
    魅力加成: '魅力加成',
    幸运加成: '幸运加成',
    基础性斗力加成: '基础性斗力加成',
    基础性斗力成算: '基础性斗力成算',
    基础忍耐力加成: '基础忍耐力加成',
    基础忍耐力成算: '基础忍耐力成算',
    闪避率加成: '闪避率加成',
    暴击率加成: '暴击率加成',
  };
  return map[key] || key;
};

const getBonusUnit = (key: string): string => {
  if (key.includes('成算')) {
    return '%';
  }
  if (key.includes('闪避率') || key.includes('暴击率')) {
    return '%';
  }
  return '';
};

const updateData = (fields: Partial<CharacterData>) => {
  emit('update-data', fields);
};

const handleArchetypeSelect = async (archetypeId: string) => {
  if (isUpdating.value) return;

  // 先更新本地状态
  updateData({ archetypeId });

  // 然后实时更新 MVU 变量（只更新永久状态）
  const archetype = currentArchetypes.value.find(a => a.id === archetypeId);
  if (archetype && archetype.permanentState) {
    isUpdating.value = true;
    try {
      const updates: Record<string, any> = {};

      // 只设置永久状态（永久状态是持续生效的加成）
      // 使用被动技能的名字作为永久状态名字，与UI显示一致
      updates['永久状态.状态列表'] = {
        [archetype.passiveSkill.name]: {
          加成: archetype.permanentState.bonus,
          描述: archetype.passiveSkill.effectDescription || archetype.passiveSkill.description,
        },
      };

      await updateLatestStatData(updates);
    } catch (error) {
      console.error('更新角色类型到 MVU 失败:', error);
    } finally {
      isUpdating.value = false;
    }
  }
};

const toggleFeature = (feature: 'hasBreasts' | 'hasPenis') => {
  updateData({
    configFeatures: {
      ...props.data.configFeatures,
      [feature]: !props.data.configFeatures[feature],
    },
  });
};

const setFuta = () => {
  updateData({
    configFeatures: {
      hasBreasts: true,
      hasPenis: true,
    },
  });
};
</script>

<style lang="scss" scoped></style>
