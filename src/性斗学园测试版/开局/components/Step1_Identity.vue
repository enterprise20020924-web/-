<template>
  <div
    class="opening-step opening-step-identity sk-enrollment-form sk-character-dossier animate-slide-up"
    :class="{ 'is-life-sim': isLifeSimMode }"
  >
    <div class="sk-enrollment-form-meta sk-dossier-toolbar">
      <button v-if="!isLifeSimMode" type="button" class="sk-admission-return" @click="emit('choose-character')">
        <i class="fas fa-chevron-left" aria-hidden="true"></i> 返回角色选择
      </button>
      <span v-else><i class="fas fa-file-lines" aria-hidden="true"></i> 个人资料登记表</span>
      <span class="sk-dossier-toolbar-rule" aria-hidden="true"><i></i><i></i><i></i></span>
      <button
        type="button"
        class="sk-dossier-mode"
        :class="{ 'is-active': isLifeSimMode }"
        :title="isLifeSimMode ? '切换到正常模式' : '切换到生活模拟模式'"
        @click="toggleLifeSimMode"
      >
        <i :class="['fas', isLifeSimMode ? 'fa-user-secret' : 'fa-user']"></i>
        <span v-if="isLifeSimMode">生活模拟</span>
        <span v-else>正常模式</span>
      </button>
    </div>

    <!-- 正常模式：角色创建 -->
    <template v-if="!isLifeSimMode">
      <AdmissionDossierBasics
        :data="data"
        :difficulties="availableDifficulties"
        :difficulty-label="getDifficultyDisplayName"
        @update-data="updateData"
        @change-gender="handleGenderChange"
      />

      <section v-if="showUserProfile" class="sk-dossier-folio" aria-labelledby="admission-notes-title">
        <div class="sk-dossier-section-bar">
          <h3 id="admission-notes-title" class="sk-dossier-section-heading"><span>02</span> 用户设定</h3>
          <span class="sk-dossier-section-meta" aria-hidden="true">PROFILE // 04</span>
        </div>
        <p v-if="hasPresetProfile" class="sk-dossier-profile-warning">过于偏离预设的人设可能导致剧情的bug，请注意</p>
        <div v-for="(section, index) in USER_PROFILE_SECTIONS" :key="section.key" class="sk-dossier-note">
          <span class="sk-dossier-note-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <div class="sk-dossier-note-head">
            <label :for="`admission-profile-${section.key}`">
              <i class="fas fa-file-lines" aria-hidden="true"></i> {{ section.title }}
            </label>
            <span class="sk-dossier-char-count" aria-hidden="true">
              {{ personalizeUserInfo(userProfile[section.key], data.name, data).trim().length }} 字
            </span>
          </div>
          <p :id="`admission-profile-${section.key}-hint`" class="sk-dossier-note-hint">{{ section.hint }}</p>
          <textarea
            :id="`admission-profile-${section.key}`"
            :aria-describedby="`admission-profile-${section.key}-hint`"
            :rows="userProfile[section.key].length > 260 ? 8 : 4"
            :value="personalizeUserInfo(userProfile[section.key], data.name, data)"
            :placeholder="`填写${section.title}`"
            @input="e => updateUserProfile(section.key, (e.target as HTMLTextAreaElement).value)"
          />
        </div>
      </section>

      <div v-if="showUserProfile" class="sk-dossier-generator">
        <template v-if="isCustomIdentity">
          <div class="sk-dossier-gen-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="min-w-0">
              <div class="sk-dossier-gen-title flex items-center gap-2 text-sm font-semibold text-white">
                <i class="fas fa-wand-magic-sparkles text-secondary"></i>
                一键生成用户信息
              </div>
            </div>
            <div class="sk-dossier-gen-actions flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="sk-dossier-gen-btn is-primary flex items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-secondary/20 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/10 transition-all hover:scale-[1.02] hover:bg-secondary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isGeneratingPalettePersona"
                @click="handleGeneratePalettePersona('ai_reads_user')"
              >
                <i
                  :class="[
                    'fas',
                    isGeneratingPalettePersona && generatingUserInfoMode === 'ai_reads_user'
                      ? 'fa-spinner fa-spin'
                      : 'fa-user-shield',
                  ]"
                ></i>
                {{
                  isGeneratingPalettePersona && generatingUserInfoMode === 'ai_reads_user' ? '生成中...' : '生成不抢话'
                }}
              </button>
              <button
                type="button"
                class="sk-dossier-gen-btn is-secondary flex items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-amber-400/15 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/10 transition-all hover:scale-[1.02] hover:bg-amber-400/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="isGeneratingPalettePersona"
                @click="handleGeneratePalettePersona('ai_plays_user')"
              >
                <i
                  :class="[
                    'fas',
                    isGeneratingPalettePersona && generatingUserInfoMode === 'ai_plays_user'
                      ? 'fa-spinner fa-spin'
                      : 'fa-comments',
                  ]"
                ></i>
                {{
                  isGeneratingPalettePersona && generatingUserInfoMode === 'ai_plays_user' ? '生成中...' : '生成抢话'
                }}
              </button>
            </div>
          </div>
          <details class="sk-dossier-help">
            <summary>生成说明</summary>
            <p>
              两种生成方式均按基础信息、生活结构、人物性情、场景表达整理。不抢话由玩家写自己的话和动作；抢话会补充需要明确的场景反应。
            </p>
          </details>
          <p
            v-if="palettePersonaMessage"
            :class="[
              'sk-dossier-feedback mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed',
              palettePersonaMessageType === 'error'
                ? 'is-error border-red-400/30 bg-red-500/10 text-red-200'
                : 'is-success border-green-400/30 bg-green-500/10 text-green-200',
            ]"
          >
            {{ palettePersonaMessage }}
          </p>
        </template>
        <div v-if="isGeneratingPalettePersona || palettePersonaDisplayText.trim()" class="sk-dossier-preview-wrap mt-4">
          <label class="sk-dossier-preview-label mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
            <i class="fas fa-file-lines text-secondary"></i> 用户设定预览
          </label>
          <div
            ref="palettePersonaPreviewRef"
            class="sk-dossier-preview-box max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-gray-100 shadow-inner shadow-white/5 backdrop-blur-sm"
          >
            {{ palettePersonaDisplayText }}
          </div>
          <div class="sk-dossier-persona-bar mt-4 rounded-xl border border-white/10 bg-black/15 px-4 py-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <div class="sk-dossier-persona-title flex items-center gap-2 text-sm font-semibold text-white">
                  <i class="fas fa-user-gear text-secondary"></i>
                  创建酒馆用户人设
                </div>
                <p class="sk-dossier-persona-desc mt-1 text-xs leading-relaxed text-gray-400">将当前姓名和四项设定写入酒馆用户人设。</p>
              </div>
              <button
                type="button"
                class="sk-dossier-persona-btn flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition-all hover:scale-[1.02] hover:bg-cyan-400/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="
                  isGeneratingPalettePersona || isCreatingUserPersona || !data.name.trim() || !userInfoContent.trim()
                "
                @click="emit('create-user-persona')"
              >
                <i :class="['fas', isCreatingUserPersona ? 'fa-spinner fa-spin' : 'fa-user-plus']"></i>
                {{
                  isCreatingUserPersona
                    ? '写入中...'
                    : pendingUserPersonaOverwriteName
                      ? '确认覆盖用户人设'
                      : isUsingTavernUserPersona
                        ? '重新写入用户人设'
                        : '创建用户人设'
                }}
              </button>
            </div>
            <p
              v-if="userPersonaMessage"
              :class="[
                'sk-dossier-feedback mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed',
                userPersonaMessageType === 'error'
                  ? 'is-error border-red-400/30 bg-red-500/10 text-red-200'
                  : userPersonaMessageType === 'warning'
                    ? 'is-warning border-yellow-400/30 bg-yellow-500/10 text-yellow-100'
                    : 'is-success border-green-400/30 bg-green-500/10 text-green-200',
              ]"
            >
              {{ userPersonaMessage }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- 生活模拟模式：NPC选择 -->
    <template v-else>
      <NpcCharacterSelect ref="npcSelectRef" @select="handleNpcSelect" />

      <!-- 难度选择（生活模拟模式） -->
      <div v-if="localSelectedNpc" class="mt-4">
        <label class="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">
          <i class="fas fa-exclamation-circle text-red-400"></i> 游戏难度
        </label>
        <select
          :value="data.difficulty"
          :disabled="data.difficulty === Difficulty.CHEATER"
          :class="[
            'w-full appearance-none rounded-xl border bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:ring-2 focus:ring-purple-500/50 focus:outline-none',
            data.difficulty === Difficulty.CHEATER
              ? 'cursor-not-allowed border-yellow-500/50 bg-yellow-500/10 opacity-75'
              : 'cursor-pointer border-purple-500/30',
          ]"
          @change="e => updateData({ difficulty: (e.target as HTMLSelectElement).value as Difficulty })"
        >
          <option
            v-for="d in availableDifficulties"
            :key="d"
            :value="d"
            :class="[
              'bg-slate-900',
              d === Difficulty.MASOCHIST && data.difficulty !== Difficulty.MASOCHIST
                ? 'text-gray-500 opacity-40'
                : 'text-white',
            ]"
          >
            {{ getDifficultyDisplayName(d) }}
          </option>
        </select>
        <p v-if="data.difficulty === Difficulty.CHEATER" class="mt-2 flex items-center gap-1 text-xs text-yellow-400">
          <i class="fas fa-lock"></i> 作弊模式已激活，难度已锁定
        </p>
      </div>
    </template>

    <section class="sk-dossier-arrival" aria-labelledby="admission-arrival-title">
      <h3 id="admission-arrival-title" class="sk-dossier-section-heading">
        <span>{{ !isLifeSimMode && !isCustomIdentity ? '02' : '03' }}</span> 入学安排
      </h3>
      <div v-if="isLifeSimMode ? localSelectedNpc : isCustomIdentity" class="sk-dossier-note">
        <label for="admission-opening"><i class="fas fa-map-marker-alt" aria-hidden="true"></i> 开局情景大纲</label>
        <textarea
          id="admission-opening"
          :rows="(data.openingSceneOutline || '').length > 220 ? 6 : 3"
          :value="data.openingSceneOutline || ''"
          :placeholder="
            isLifeSimMode
              ? '描述你的开局场景，例如：正在教室备课/刚从体育馆训练结束...'
              : '描述开局时你会处在什么场景：例如刚到学园门口、深夜留在训练馆、被老师叫去办公室...'
          "
          @input="e => updateData({ openingSceneOutline: (e.target as HTMLTextAreaElement).value })"
        />
        <p v-if="!isLifeSimMode" class="sk-dossier-caption">
          可选。这里只决定开局时的场景大纲，不会阻拦下一步，也不会写进用户信息。
        </p>
      </div>
      <div class="sk-dossier-timeline">
        <label for="admission-timeline" class="sk-dossier-field-label">
          <i class="fas fa-calendar-alt text-secondary"></i> 主线时间线
        </label>
        <select
          id="admission-timeline"
          :value="data.mainlineTimeline"
          @change="e => updateData({ mainlineTimeline: (e.target as HTMLSelectElement).value as MainlineTimeline })"
        >
          <option v-for="timeline in Object.values(MainlineTimeline)" :key="timeline" :value="timeline">
            {{ timeline }}
          </option>
        </select>
        <div
          class="sk-timeline-summary mt-3 flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm transition-colors"
          :class="selectedTimelineConfig.accentClass"
        >
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-black/15">
            <i class="fas" :class="selectedTimelineConfig.icon"></i>
          </span>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-white">{{ data.mainlineTimeline }}</p>
            <p class="mt-0.5 text-xs/5 text-white/75">{{ selectedTimelineConfig.summary }}</p>
          </div>
        </div>
        <p class="sk-dossier-caption">
          选择“无”时不改动日期；选择主线后会把开局日期设置为该主线触发日前两天。注：会导致之前的剧情无法触发，慎选。
        </p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { getIdentityById } from '../data/identityDatabase';
import type { NpcCharacter } from '../data/npcCharacters';
import { CharacterData, Difficulty, Gender, MainlineTimeline, type UserProfile } from '../types';
import { MAINLINE_TIMELINE_CONFIG } from '../mainlineTimeline';
import { generatePalettePersona, type UserInfoGenerationMode } from '../utils/palettePersonaGenerator';
import {
  USER_PROFILE_SECTIONS,
  getUserInfoContent,
  personalizeUserInfo,
  readUserProfile,
  updatePersonalizedUserInfo,
} from '../utils/userProfile';
import NpcCharacterSelect from './NpcCharacterSelect.vue';
import AdmissionDossierBasics from './AdmissionDossierBasics.vue';

const props = defineProps<{
  data: CharacterData;
  isLifeSimUnlocked?: boolean;
  isLifeSimMode?: boolean;
  isCreatingUserPersona?: boolean;
  userPersonaMessage?: string;
  userPersonaMessageType?: 'success' | 'warning' | 'error';
  isUsingTavernUserPersona?: boolean;
  pendingUserPersonaOverwriteName?: string;
}>();

const emit = defineEmits<{
  (e: 'update-data', fields: Partial<CharacterData>): void;
  (e: 'update-life-sim-mode', isActive: boolean): void;
  (e: 'select-npc', npc: NpcCharacter | null): void;
  (e: 'request-life-sim-confirm'): void;
  (e: 'choose-character'): void;
  (e: 'create-user-persona'): void;
}>();

// 本地状态
const localSelectedNpc = ref<NpcCharacter | null>(null);
const isGeneratingPalettePersona = ref(false);
const generatingUserInfoMode = ref<UserInfoGenerationMode | null>(null);
const palettePersonaMessage = ref('');
const palettePersonaMessageType = ref<'success' | 'error'>('success');
const streamingPalettePersonaPreview = ref('');
const palettePersonaPreviewRef = ref<HTMLElement | null>(null);
const isCustomIdentity = computed(() => !props.data.archetypeId);
const hasPresetProfile = computed(() => Boolean(getIdentityById(props.data.archetypeId)?.userProfile));
const showUserProfile = computed(() => isCustomIdentity.value || hasPresetProfile.value);
const userProfile = computed(() => readUserProfile(props.data));
const userInfoContent = computed(() => getUserInfoContent(props.data));

const updateUserProfile = (key: keyof UserProfile, value: string) => {
  const template = updatePersonalizedUserInfo(userProfile.value[key], value, props.data.name, props.data);
  updateData({ userProfile: { ...userProfile.value, [key]: template }, palettePersona: '' });
};

const palettePersonaDisplayText = computed(() => {
  if (isGeneratingPalettePersona.value) {
    return (
      personalizeUserInfo(streamingPalettePersonaPreview.value, props.data.name, props.data) ||
      '等待主 API 返回用户信息正文...'
    );
  }
  return userInfoContent.value;
});

watch(streamingPalettePersonaPreview, async () => {
  if (!isGeneratingPalettePersona.value) return;
  await nextTick();
  if (palettePersonaPreviewRef.value) {
    palettePersonaPreviewRef.value.scrollTop = palettePersonaPreviewRef.value.scrollHeight;
  }
});

// 切换模式
const toggleLifeSimMode = () => {
  if (!props.isLifeSimMode) {
    // 切换到生活模拟模式时显示确认弹窗
    emit('request-life-sim-confirm');
  } else {
    // 从生活模拟模式切换回普通模式，直接切换
    emit('update-life-sim-mode', false);
  }
};

// 处理NPC选择
const handleNpcSelect = (npc: NpcCharacter | null) => {
  localSelectedNpc.value = npc;
  emit('select-npc', npc);
  if (npc) {
    // 自动设置角色名为NPC名
    emit('update-data', { name: npc.name });
  }
};

// 过滤难度选项：隐藏"作弊者"，除非当前已经是"作弊者"
const availableDifficulties = computed(() => {
  const allDifficulties = Object.values(Difficulty);
  // 如果当前难度是"作弊者"，则显示所有选项（包括作弊者）
  if (props.data.difficulty === Difficulty.CHEATER) {
    return allDifficulties;
  }
  // 否则隐藏"作弊者"选项
  return allDifficulties.filter(d => d !== Difficulty.CHEATER);
});

const selectedTimelineConfig = computed(() => MAINLINE_TIMELINE_CONFIG[props.data.mainlineTimeline]);

// 获取难度的显示名称
const getDifficultyDisplayName = (difficulty: Difficulty): string => {
  if (difficulty === Difficulty.MASOCHIST) {
    // 如果当前已选中"抖M"，显示"抖M特化"
    if (props.data.difficulty === Difficulty.MASOCHIST) {
      return '抖M特化';
    }
    // 否则显示"（隐藏条目）"
    return '（隐藏条目）';
  }
  return difficulty;
};

const updateData = (fields: Partial<CharacterData>) => {
  emit('update-data', fields);
};

const handleGeneratePalettePersona = async (mode: UserInfoGenerationMode) => {
  if (isGeneratingPalettePersona.value) return;
  isGeneratingPalettePersona.value = true;
  generatingUserInfoMode.value = mode;
  palettePersonaMessage.value = '';
  palettePersonaMessageType.value = 'success';
  streamingPalettePersonaPreview.value = '';

  try {
    const generatedPersona = await generatePalettePersona(props.data, {
      mode,
      onStream: fullText => {
        if (fullText.trim()) {
          streamingPalettePersonaPreview.value = fullText;
        }
      },
    });
    streamingPalettePersonaPreview.value = generatedPersona.palette;
    updateData({
      palettePersona: generatedPersona.palette,
      userProfile: generatedPersona.userProfile,
    });
    await nextTick();
    palettePersonaMessage.value = mode === 'ai_plays_user' ? '抢话用户信息已生成。' : '不抢话用户信息已生成。';
  } catch (error) {
    console.error('[性斗学园开局] 一键生成用户信息失败:', error);
    palettePersonaMessageType.value = 'error';
    palettePersonaMessage.value = error instanceof Error ? error.message : '生成失败，请稍后重试。';
  } finally {
    isGeneratingPalettePersona.value = false;
    generatingUserInfoMode.value = null;
  }
};

const handleGenderChange = (gender: Gender) => {
  if (gender === props.data.gender) return;
  if (gender === Gender.MALE && getIdentityById(props.data.archetypeId)?.gender === Gender.FEMALE) return;

  // 切换性别时，同时更新默认的身体配置
  let configFeatures: CharacterData['configFeatures'];

  if (gender === Gender.MALE) {
    // 男性：默认只有男性性征
    configFeatures = {
      hasBreasts: false,
      hasPenis: true,
    };
  } else if (gender === Gender.FEMALE) {
    // 女性：默认只有女性性征
    configFeatures = {
      hasBreasts: true,
      hasPenis: false,
    };
  } else {
    // 非二元：默认两种性征都可用，之后在角色类型页中自行勾选
    configFeatures = {
      hasBreasts: true,
      hasPenis: true,
    };
  }

  updateData({
    gender,
    archetypeId: null,
    configFeatures,
    // 清除性器特征（因为性别改变了）
    maleGenitalType: undefined,
    femaleGenitalType: undefined,
  });
};

// 暴露给父组件
defineExpose({
  localSelectedNpc,
});
</script>

<style lang="scss" scoped>
// 让隐藏条目更不起眼
select option.text-gray-500 {
  color: rgba(156, 163, 175, 0.3) !important;
  font-size: 0.85em;
  font-style: italic;
}
</style>
