<template>
  <div class="relationship-page">
    <SkylinkModuleHeader
      code="06"
      label="SOCIAL NETWORK"
      title="羁绊连接图"
      description="记录每一次相遇与关系变化。"
      icon="fas fa-diagram-project"
    />
    <!-- 在场人物 -->
    <div class="section" v-if="presentCharacters.length > 0">
      <div class="section-header">
        <i class="fas fa-users"></i>
        <span>在场人物</span>
        <span class="count-badge">{{ presentCharacters.length }}</span>
      </div>
      <div class="present-list">
        <div class="present-item" v-for="(name, index) in presentCharacters" :key="index">
          <div class="present-avatar" @click="showAvatarModal(name)">
            <img
              :src="getAvatarUrl(name)"
              :alt="name"
              @load="handleImageLoad($event)"
              @error="handleImageError($event, name)"
              class="avatar-img"
            />
          </div>
          <span class="present-name">{{ name }}</span>
        </div>
      </div>
    </div>

    <!-- 关系网络 -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-heart"></i>
        <span>关系网络</span>
        <span class="count-badge" v-if="Object.keys(relationships).length > 0">
          {{ Object.keys(relationships).length }}
        </span>
      </div>

      <div class="relationship-list" v-if="Object.keys(relationships).length > 0">
        <div class="relationship-card" v-for="(rel, name) in relationships" :key="name">
          <button class="discard-btn" @click.stop="forgetRelationship(String(name))" title="遗忘">
            <i class="fas fa-times"></i>
          </button>
          <div class="rel-header">
            <div class="rel-avatar" @click="showAvatarModal(String(name))">
              <img
                :src="getAvatarUrl(String(name))"
                :alt="String(name)"
                @load="handleImageLoad($event)"
                @error="handleImageError($event, String(name))"
                class="avatar-img"
              />
            </div>
            <div class="rel-info">
              <div class="rel-name">{{ name }}</div>
              <div class="rel-tags">
                <div v-if="rel.关系类型" class="rel-type" :class="getRelationTypeClass(rel.关系类型)">
                  <i :class="getRelationIcon(rel.关系类型)"></i>
                  {{ rel.关系类型 }}
                </div>
                <div v-else class="rel-type type-unknown">
                  <i class="fas fa-user-circle"></i>
                  未建立关系
                </div>
                <div class="rel-oath" :class="getOathClass(rel.誓约)">
                  <i :class="getOathIcon(rel.誓约)"></i>
                  {{ getOathLabel(rel.誓约) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 关系数值 -->
          <div class="rel-stats">
            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">好感度</span>
                <span class="stat-value" :class="getAffectionClass(rel.好感度)">
                  {{ rel.好感度 || 0 }}
                </span>
              </div>
              <div class="stat-bar">
                <div
                  class="stat-fill affection"
                  :class="getAffectionClass(rel.好感度)"
                  :style="{ width: `${rel.好感度 || 0}%` }"
                ></div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-header">
                <span class="stat-label">支配度</span>
                <span class="stat-value dominance-value" :class="getDominanceClass(rel.支配度)">
                  {{ formatDominance(rel.支配度) }} {{ getDominanceLabel(rel.支配度) }}
                </span>
              </div>
              <div class="dominance-bar">
                <div class="dominance-midline"></div>
                <div
                  class="dominance-fill"
                  :class="getDominanceClass(rel.支配度)"
                  :style="getDominanceStyle(rel.支配度)"
                ></div>
              </div>
            </div>

            <div class="stat-item" v-if="rel.调教进度 !== undefined">
              <div class="stat-header">
                <span class="stat-label">调教进度</span>
                <span class="stat-value training">{{ rel.调教进度 || 0 }}%</span>
              </div>
              <div class="stat-bar">
                <div class="stat-fill training" :style="{ width: `${rel.调教进度 || 0}%` }"></div>
              </div>
            </div>

            <div class="stat-item" v-if="rel.臣服度 !== undefined">
              <div class="stat-header">
                <span class="stat-label">臣服度</span>
                <span class="stat-value" :class="getSubmissionClass(rel.臣服度)">
                  {{ rel.臣服度 || 0 }}
                </span>
              </div>
              <div class="stat-bar">
                <div
                  class="stat-fill submission"
                  :class="getSubmissionClass(rel.臣服度)"
                  :style="{ width: `${rel.臣服度 || 0}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <i class="fas fa-heart-crack"></i>
        </div>
        <p class="empty-title">暂无关系数据</p>
        <p class="empty-desc">与学园中的人物互动来建立关系</p>
      </div>
    </div>

    <!-- 势力声望 -->
    <div class="section">
      <div class="section-header">
        <i class="fas fa-flag"></i>
        <span>势力声望</span>
      </div>

      <div class="reputation-list" v-if="Object.keys(reputations).length > 0">
        <div class="reputation-card" v-for="(value, name) in reputations" :key="name">
          <div class="rep-header">
            <div class="rep-icon">
              <i :class="getReputationIcon(String(name))"></i>
            </div>
            <div class="rep-info">
              <div class="rep-name">{{ name }}</div>
              <div class="rep-value" :class="getReputationClass(Number(value))">
                {{ Number(value) > 0 ? '+' : '' }}{{ Number(value) }}
              </div>
            </div>
          </div>
          <div class="rep-bar">
            <div
              class="rep-fill"
              :class="getReputationClass(Number(value))"
              :style="{ width: `${getReputationPercentage(Number(value))}%` }"
            ></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-else>
        <div class="empty-icon">
          <i class="fas fa-flag"></i>
        </div>
        <p class="empty-title">暂无声望数据</p>
        <p class="empty-desc">与各势力互动来建立声望</p>
      </div>
    </div>
  </div>

  <!-- 头像放大模态框 -->
  <div v-if="showModal" class="avatar-modal" @click="closeModal">
    <div class="modal-backdrop"></div>
    <div class="modal-content" @click.stop>
      <button class="modal-close" @click="closeModal">
        <i class="fas fa-times"></i>
      </button>
      <div class="modal-header">
        <h3>{{ modalCharacterName }}</h3>
      </div>
      <div class="modal-body avatar-carousel">
        <button
          v-if="modalAvatarSlides.length > 1"
          class="avatar-nav avatar-nav-prev"
          type="button"
          title="上一个头像"
          aria-label="上一个头像"
          @click="showPreviousAvatarVariation"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <img
          v-if="currentModalAvatarSlide.unlocked"
          :key="`${currentModalAvatarSlide.kind}:${currentModalAvatarSlide.variationKey || currentModalAvatarSlide.url}`"
          :src="currentModalAvatarSlide.url"
          :alt="modalCharacterName"
          @load="handleModalImageLoad($event)"
          @error="handleModalImageError"
          class="modal-avatar-img"
        />
        <div v-else class="avatar-locked-panel">
          <i class="fas fa-lock"></i>
          <span>{{ currentModalAvatarSlide.label }}</span>
        </div>
        <button
          v-if="modalAvatarSlides.length > 1"
          class="avatar-nav avatar-nav-next"
          type="button"
          title="下一个头像"
          aria-label="下一个头像"
          @click="showNextAvatarVariation"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
      <div v-if="modalAvatarSlides.length > 1" class="avatar-carousel-footer">
        <span class="avatar-slide-label" :class="{ locked: !currentModalAvatarSlide.unlocked }">
          <i v-if="!currentModalAvatarSlide.unlocked" class="fas fa-lock"></i>
          {{ currentModalAvatarSlide.label }}
        </span>
        <div class="avatar-slide-dots" aria-hidden="true">
          <span
            v-for="(slide, index) in modalAvatarSlides"
            :key="`${slide.label}-${index}`"
            :class="{ active: index === modalAvatarIndex, locked: !slide.unlocked }"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { getLatestMvuData, replaceLatestMvuData, runLatestMvuTransaction } from '../../../shared/mvuStore';
import {
  AVATAR_VARIATIONS_UPDATED_EVENT,
  getAvatarVariationConfigForCharacter,
  filterAvailableAvatarVariationOptions,
  getSelectedAvatarVariationKey,
  getSelectedAvatarVariationUrl,
  getUnlockedAvatarVariationOptions,
  selectAvatarVariation,
  type AvatarVariationKey,
  type AvatarVariationOption,
} from '../../../shared/avatarVariationStore';
import { ENEMY_DATABASE, NAME_ALIASES } from '../../../战斗界面/enemyDatabase';
import {
  BACKSTREET_CONTACT_AVATAR_STORAGE_KEY,
  getChibiAvatarName,
  getChibiAvatarUrl,
  getNormalAvatarUrl,
  loadContactAvatarModes,
  saveContactAvatarModes,
  type BackstreetAvatarMode,
} from '../../phone/backstreetAvatarSettings';

const props = defineProps<{
  characterData: any;
}>();

const presentCharacters = computed(() => {
  return props.characterData.关系系统?.在场人物 || [];
});

const relationships = computed(() => {
  const relSystem = props.characterData.关系系统 || {};
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(relSystem)) {
    if (key !== '在场人物' && typeof value === 'object' && value !== null) {
      result[key] = value;
    }
  }

  return result;
});

const reputations = computed(() => {
  return props.characterData.势力声望 || {};
});

// 头像放大模态框
const showModal = ref(false);
const modalAvatarUrl = ref('');
const modalCharacterName = ref('');
const selectedAvatarUrls = ref<Record<string, string>>({});
const selectedAvatarKeys = ref<Record<string, AvatarVariationKey | null>>({});
const avatarOptionsByCharacter = ref<Record<string, AvatarVariationOption[]>>({});
const allAvatarOptionsByCharacter = ref<Record<string, AvatarVariationOption[]>>({});
const contactAvatarModes = ref<Record<string, BackstreetAvatarMode>>(loadContactAvatarModes());
const modalAvatarIndex = ref(0);
let avatarRefreshToken = 0;

interface ModalAvatarSlide {
  kind: 'normal' | 'chibi' | 'variation';
  variationKey: AvatarVariationKey | null;
  label: string;
  url: string;
  unlocked: boolean;
}

/**
 * 解析头像全名（支持包含匹配）
 * @param rawName 关系系统中的名字（可能是全名、别名或包含别名的字符串）
 * @returns 匹配到的全名，用于拼接图片 URL
 */
function resolveAvatarFullName(rawName: string): string {
  if (!rawName) return rawName;

  // 1. 先尝试精确匹配（关系名刚好是某个敌人库全名）
  if (rawName in ENEMY_DATABASE) {
    return rawName;
  }

  // 2. 包含匹配：遍历别名表，只要关系名包含某个别名 key，就映射到对应全名
  //    如果包含多个别名（如"雪莉与爱丽丝"），优先返回第一个匹配到的
  for (const [alias, fullName] of Object.entries(NAME_ALIASES)) {
    if (rawName.includes(alias)) {
      console.info(`[关系页] 通过包含匹配 "${rawName}" 包含 "${alias}"，映射到角色: ${fullName}`);
      return fullName;
    }
  }

  // 3. 都没匹配到，返回原名（会尝试用原名拼接 URL，失败后降级为 icon）
  return rawName;
}

function getAvatarRecordKey(name: string): string {
  const fullName = resolveAvatarFullName(name);
  return getAvatarVariationConfigForCharacter(fullName)?.characterName || fullName;
}

function getDefaultAvatarUrl(name: string): string {
  const fullName = resolveAvatarFullName(name);
  const mode = contactAvatarModes.value[getAvatarRecordKey(name)] || 'normal';
  const chibiName = getChibiAvatarName(fullName);
  if (mode === 'chibi' && chibiName) {
    return getChibiAvatarUrl(chibiName);
  }

  return getNormalAvatarUrl(fullName);
}

// 生成头像 URL
function getAvatarUrl(name: string): string {
  return selectedAvatarUrls.value[getAvatarRecordKey(name)] || getDefaultAvatarUrl(name);
}

const modalUnlockedAvatarOptions = computed(() => {
  if (!modalCharacterName.value) return [];
  return avatarOptionsByCharacter.value[getAvatarRecordKey(modalCharacterName.value)] || [];
});

const modalSelectedAvatarKey = computed(() => {
  if (!modalCharacterName.value) return null;
  return selectedAvatarKeys.value[getAvatarRecordKey(modalCharacterName.value)] || null;
});

const modalAvatarSlides = computed<ModalAvatarSlide[]>(() => {
  if (!modalCharacterName.value) return [];

  const recordKey = getAvatarRecordKey(modalCharacterName.value);
  const config = getAvatarVariationConfigForCharacter(recordKey);
  const fullName = resolveAvatarFullName(modalCharacterName.value);
  const chibiName = getChibiAvatarName(fullName);
  const baseSlides: ModalAvatarSlide[] = [
    {
      kind: 'normal',
      variationKey: null,
      label: '正常头像',
      url: getNormalAvatarUrl(fullName),
      unlocked: true,
    },
  ];

  if (chibiName) {
    baseSlides.unshift({
      kind: 'chibi',
      variationKey: null,
      label: 'Q版头像',
      url: getChibiAvatarUrl(chibiName),
      unlocked: true,
    });
  }

  if (!config) {
    return baseSlides;
  }

  const unlockedKeys = new Set(modalUnlockedAvatarOptions.value.map(option => option.key));
  const variationSlides = (allAvatarOptionsByCharacter.value[config.characterName] || []).map(option => ({
    kind: 'variation' as const,
    variationKey: option.key,
    label: option.label,
    url: option.url,
    unlocked: unlockedKeys.has(option.key),
  }));

  return [...baseSlides, ...variationSlides];
});

const currentModalAvatarSlide = computed<ModalAvatarSlide>(() => {
  return (
    modalAvatarSlides.value[modalAvatarIndex.value] || {
      kind: 'normal',
      variationKey: null,
      label: '正常头像',
      url: modalAvatarUrl.value || getDefaultAvatarUrl(modalCharacterName.value),
      unlocked: true,
    }
  );
});

function findSlideIndex(slides: ModalAvatarSlide[], target: Pick<ModalAvatarSlide, 'kind' | 'variationKey'>): number {
  return slides.findIndex(slide => slide.kind === target.kind && slide.variationKey === target.variationKey);
}

function getCurrentPersistedAvatarSlide(): Pick<ModalAvatarSlide, 'kind' | 'variationKey'> {
  const selectedKey = modalSelectedAvatarKey.value;
  if (selectedKey) {
    return { kind: 'variation', variationKey: selectedKey };
  }

  return {
    kind: contactAvatarModes.value[getAvatarRecordKey(modalCharacterName.value)] === 'chibi' ? 'chibi' : 'normal',
    variationKey: null,
  };
}

async function refreshAvatarVariationState(preserveModalIndex = false) {
  const refreshToken = ++avatarRefreshToken;
  const previousSlide = preserveModalIndex ? currentModalAvatarSlide.value : null;
  const names = [...presentCharacters.value, ...Object.keys(relationships.value)];
  const recordKeys = [...new Set(names.map(name => getAvatarRecordKey(String(name))))];
  const nextUrls: Record<string, string> = {};
  const nextKeys: Record<string, AvatarVariationKey | null> = {};
  const nextOptions: Record<string, AvatarVariationOption[]> = {};
  const nextAllOptions: Record<string, AvatarVariationOption[]> = {};

  contactAvatarModes.value = loadContactAvatarModes();

  const metadata = await Promise.all(
    recordKeys.map(async recordKey => {
      const config = getAvatarVariationConfigForCharacter(recordKey);
      if (!config) return null;
      const [selectedUrl, selectedKey, options] = await Promise.all([
        getSelectedAvatarVariationUrl(config.characterName),
        getSelectedAvatarVariationKey(config.characterName),
        getUnlockedAvatarVariationOptions(config.characterName),
      ]);
      return { config, selectedUrl, selectedKey, options };
    }),
  );
  if (refreshToken !== avatarRefreshToken) return;

  // Apply persisted choices before any remote probing. This keeps the relationship
  // cards responsive and lets normal image loading handle the selected avatar.
  for (const item of metadata) {
    if (!item) continue;
    const isSelectedUnlocked = Boolean(
      item.selectedKey && item.options.some(option => option.key === item.selectedKey),
    );
    if (item.selectedUrl && item.selectedKey && isSelectedUnlocked) {
      nextUrls[item.config.characterName] = item.selectedUrl;
      nextKeys[item.config.characterName] = item.selectedKey;
    } else {
      nextKeys[item.config.characterName] = null;
    }
    nextOptions[item.config.characterName] = [];
    nextAllOptions[item.config.characterName] = [];
  }
  selectedAvatarUrls.value = nextUrls;
  selectedAvatarKeys.value = nextKeys;
  avatarOptionsByCharacter.value = nextOptions;
  allAvatarOptionsByCharacter.value = nextAllOptions;

  if (showModal.value && modalCharacterName.value) {
    const recordKey = getAvatarRecordKey(modalCharacterName.value);
    const modalData = metadata.find(item => item?.config.characterName === recordKey);
    if (modalData) {
      // Probing every potential difference is only necessary for the picker, never
      // for the relationship page itself. This prevents unrelated contacts from
      // delaying the first render.
      const availableOptions = await filterAvailableAvatarVariationOptions(modalData.options);
      if (refreshToken !== avatarRefreshToken) return;
      const availableKeys = new Set(availableOptions.map(option => option.key));
      nextOptions[recordKey] = modalData.options.filter(option => availableKeys.has(option.key));
      nextAllOptions[recordKey] = availableOptions;
      if (nextKeys[recordKey] && !availableKeys.has(nextKeys[recordKey])) {
        delete nextKeys[recordKey];
        delete nextUrls[recordKey];
      }
      selectedAvatarUrls.value = { ...nextUrls };
      selectedAvatarKeys.value = { ...nextKeys };
      avatarOptionsByCharacter.value = { ...nextOptions };
      allAvatarOptionsByCharacter.value = { ...nextAllOptions };
    }
    modalAvatarUrl.value = getAvatarUrl(modalCharacterName.value);
    if (previousSlide) {
      const preservedIndex = findSlideIndex(modalAvatarSlides.value, previousSlide);
      if (preservedIndex >= 0) {
        modalAvatarIndex.value = preservedIndex;
        return;
      }
    }
    syncModalAvatarIndexToSelection();
  }
}

function syncModalAvatarIndexToSelection() {
  const selectedIndex = findSlideIndex(modalAvatarSlides.value, getCurrentPersistedAvatarSlide());
  modalAvatarIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
}

async function selectModalAvatarVariation(slide: ModalAvatarSlide) {
  if (!modalCharacterName.value || !slide.unlocked) return;

  const recordKey = getAvatarRecordKey(modalCharacterName.value);
  if (slide.kind === 'normal' || slide.kind === 'chibi') {
    contactAvatarModes.value = {
      ...contactAvatarModes.value,
      [recordKey]: slide.kind,
    };
    saveContactAvatarModes(contactAvatarModes.value);
    await selectAvatarVariation(modalCharacterName.value, null);
  } else {
    await selectAvatarVariation(modalCharacterName.value, slide.variationKey);
  }

  await refreshAvatarVariationState(true);
  modalAvatarUrl.value = getAvatarUrl(modalCharacterName.value);
}

async function showAvatarVariationByOffset(offset: number) {
  const slides = modalAvatarSlides.value;
  if (slides.length <= 1) return;

  modalAvatarIndex.value = (modalAvatarIndex.value + offset + slides.length) % slides.length;
  const slide = currentModalAvatarSlide.value;
  if (slide.unlocked) {
    await selectModalAvatarVariation(slide);
  }
}

function showPreviousAvatarVariation() {
  showAvatarVariationByOffset(-1);
}

function showNextAvatarVariation() {
  showAvatarVariationByOffset(1);
}

function removeFallbackIcon(parent: HTMLElement | null) {
  parent?.querySelector('.fallback-icon')?.remove();
  parent?.querySelector('.modal-fallback')?.remove();
}

function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = '';
  removeFallbackIcon(img.parentElement);
}

// 处理图片加载失败
function handleImageError(event: Event, name: string) {
  const img = event.target as HTMLImageElement;
  const fallbackUrl = getNormalAvatarUrl(resolveAvatarFullName(name));
  if (img.src !== fallbackUrl && !img.dataset.fallbackAttempted) {
    img.dataset.fallbackAttempted = 'true';
    img.src = fallbackUrl;
    return;
  }
  // 降级为默认头像（使用 icon）
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.fallback-icon')) {
    const icon = document.createElement('i');
    icon.className = 'fas fa-user fallback-icon';
    parent.appendChild(icon);
  }
}

// 显示头像放大模态框
function showAvatarModal(name: string) {
  modalCharacterName.value = name;
  modalAvatarUrl.value = getAvatarUrl(name);
  syncModalAvatarIndexToSelection();
  showModal.value = true;
  void refreshAvatarVariationState(true);
}

// 关闭模态框
function closeModal() {
  showModal.value = false;
}

async function forgetRelationship(name: string) {
  const ok = confirm(`确认遗忘与「${name}」的关系吗？`);
  if (!ok) return;

  try {
    await runLatestMvuTransaction('遗忘关系', async () => {
      const mvuData = await getLatestMvuData();
      if (!mvuData || !mvuData.stat_data) {
        console.error('[关系界面] 无法获取 MVU 数据');
        return;
      }

      const statData = mvuData.stat_data;
      if (!statData.关系系统 || !statData.关系系统[name]) {
        return;
      }

      delete statData.关系系统[name];

      await replaceLatestMvuData(mvuData);

      if (typeof toastr !== 'undefined') {
        toastr.success(`已遗忘与 ${name} 的关系`);
      }

      window.dispatchEvent(new CustomEvent('mvu-data-updated'));
    });
  } catch (error) {
    console.error('[关系界面] 遗忘失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('遗忘失败，请重试');
    }
  }
}

function getRelationTypeClass(type: string | undefined): string {
  if (!type) return 'type-unknown';
  const map: Record<string, string> = {
    陌生人: 'type-stranger',
    同学: 'type-classmate',
    朋友: 'type-friend',
    恋人: 'type-lover',
    主仆: 'type-master',
    完全臣服: 'type-submissive',
    仇敌: 'type-enemy',
  };
  return map[type] || 'type-unknown';
}

function getRelationIcon(type: string | undefined): string {
  if (!type) return 'fas fa-user-circle';
  const map: Record<string, string> = {
    陌生人: 'fas fa-question',
    同学: 'fas fa-graduation-cap',
    朋友: 'fas fa-handshake',
    恋人: 'fas fa-heart',
    主仆: 'fas fa-crown',
    完全臣服: 'fas fa-link',
    仇敌: 'fas fa-skull',
  };
  return map[type] || 'fas fa-user-circle';
}

function getAffectionClass(value: number): string {
  if (value >= 80) return 'very-high';
  if (value >= 60) return 'high';
  if (value >= 40) return 'medium';
  if (value >= 20) return 'low';
  return 'very-low';
}

function getDominanceValue(value: unknown): number {
  const dominance = Number(value ?? 0);
  if (!Number.isFinite(dominance)) return 0;
  return Math.max(-100, Math.min(100, Math.round(dominance)));
}

function formatDominance(value: unknown): string {
  const dominance = getDominanceValue(value);
  return dominance > 0 ? `+${dominance}` : String(dominance);
}

function getDominanceLabel(value: unknown): string {
  const dominance = getDominanceValue(value);
  if (dominance >= 80) return '完全支配';
  if (dominance >= 50) return '支配';
  if (dominance <= -80) return '完全被支配';
  if (dominance <= -50) return '被支配';
  return '平等';
}

function getDominanceClass(value: unknown): string {
  const dominance = getDominanceValue(value);
  if (dominance >= 80) return 'dominance-user-strong';
  if (dominance >= 50) return 'dominance-user';
  if (dominance <= -80) return 'dominance-npc-strong';
  if (dominance <= -50) return 'dominance-npc';
  return 'dominance-neutral';
}

function getDominanceStyle(value: unknown): Record<string, string> {
  const dominance = getDominanceValue(value);
  const width = Math.abs(dominance) / 2;

  if (dominance >= 0) {
    return { left: '50%', width: `${width}%` };
  }

  return { left: `${50 - width}%`, width: `${width}%` };
}

function getOathValue(value: unknown): string {
  const oath = String(value || '无');
  return ['支配型', '平等型', '被支配型'].includes(oath) ? oath : '无';
}

function getOathLabel(value: unknown): string {
  const oath = getOathValue(value);
  return oath === '无' ? '未誓约' : oath;
}

function getOathClass(value: unknown): string {
  const map: Record<string, string> = {
    无: 'oath-none',
    支配型: 'oath-dominant',
    平等型: 'oath-equal',
    被支配型: 'oath-submissive',
  };
  return map[getOathValue(value)] || 'oath-none';
}

function getOathIcon(value: unknown): string {
  const map: Record<string, string> = {
    无: 'fas fa-circle',
    支配型: 'fas fa-crown',
    平等型: 'fas fa-heart',
    被支配型: 'fas fa-link',
  };
  return map[getOathValue(value)] || 'fas fa-circle';
}

function getSubmissionClass(value: number): string {
  if (value >= 80) return 'very-high';
  if (value >= 60) return 'high';
  if (value >= 40) return 'medium';
  if (value >= 20) return 'low';
  return 'very-low';
}

function getReputationIcon(name: string): string {
  const map: Record<string, string> = {
    学生会: 'fas fa-crown',
    女权协会: 'fas fa-venus',
    BF社: 'fas fa-flask',
    体育联盟: 'fas fa-dumbbell',
    研究会: 'fas fa-book',
    地下联盟: 'fas fa-mask',
    男性自保联盟: 'fas fa-shield-alt',
    雌堕会: 'fas fa-feather',
  };
  return map[name] || 'fas fa-flag';
}

function getReputationClass(value: number): string {
  if (value >= 50) return 'very-high';
  if (value >= 20) return 'high';
  if (value >= -20) return 'medium';
  if (value >= -50) return 'low';
  return 'very-low';
}

function getReputationPercentage(value: number): number {
  // 将 -100 到 100 的范围映射到 0 到 100
  return Math.max(0, Math.min(100, (value + 100) / 2));
}

// 处理模态框图片加载失败
function handleModalImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = '';
  removeFallbackIcon(img.parentElement);
}

function handleModalImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.modal-fallback')) {
    const fallback = document.createElement('div');
    fallback.className = 'modal-fallback';
    fallback.innerHTML = '<i class="fas fa-user"></i><p>暂无此图片</p>';
    parent.appendChild(fallback);
  }
}

function handleAvatarModeStorage(event: StorageEvent) {
  if (event.key && event.key !== BACKSTREET_CONTACT_AVATAR_STORAGE_KEY) return;
  void refreshAvatarVariationState(true);
}

function handleAvatarVariationsUpdated() {
  void refreshAvatarVariationState(true);
}

onMounted(() => {
  refreshAvatarVariationState();
  window.addEventListener(AVATAR_VARIATIONS_UPDATED_EVENT, handleAvatarVariationsUpdated);
  window.addEventListener('storage', handleAvatarModeStorage);
});

onUnmounted(() => {
  window.removeEventListener(AVATAR_VARIATIONS_UPDATED_EVENT, handleAvatarVariationsUpdated);
  window.removeEventListener('storage', handleAvatarModeStorage);
});

watch(
  () => props.characterData.关系系统,
  () => {
    refreshAvatarVariationState();
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.relationship-page {
  padding: 16px 20px;
  overflow-y: auto;
  flex: 1;
  position: relative;
}

.section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 14px;

  i:first-child {
    color: var(--sk-violet);
  }

  .count-badge {
    margin-left: auto;
    padding: 2px 8px;
    background: var(--sk-soft);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    color: var(--sk-muted);
  }
}

.present-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.present-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15), rgba(102, 126, 234, 0.05));
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;

  .present-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    i,
    .fallback-icon {
      font-size: 14px;
      color: var(--sk-violet);
    }
  }

  .present-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--sk-ink);
  }
}

.relationship-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.relationship-card {
  padding: 16px;
  background: var(--sk-soft);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
}

.discard-btn {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(248, 113, 113, 0.9);
  border: 1px solid rgba(248, 113, 113, 0.9);
  color: var(--sk-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;

  &:hover {
    transform: scale(1.08);
    background: rgba(248, 113, 113, 1);
  }

  &:active {
    transform: scale(1);
  }

  i {
    font-size: 10px;
    line-height: 1;
  }
}

.rel-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.rel-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  i,
  .fallback-icon {
    font-size: 20px;
    color: var(--sk-muted);
  }
}

.rel-info {
  flex: 1;
  min-width: 0;
}

.rel-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rel-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rel-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;

  i {
    font-size: 10px;
  }

  &.type-stranger {
    background: rgba(156, 163, 175, 0.15);
    color: var(--sk-muted);
  }

  &.type-classmate {
    background: rgba(96, 165, 250, 0.15);
    color: var(--sk-blue);
  }

  &.type-friend {
    background: rgba(52, 211, 153, 0.15);
    color: var(--sk-success);
  }

  &.type-lover {
    background: rgba(244, 114, 182, 0.15);
    color: var(--sk-pink);
  }

  &.type-master {
    background: rgba(251, 191, 36, 0.15);
    color: var(--sk-warning);
  }

  &.type-submissive {
    background: rgba(167, 139, 250, 0.15);
    color: var(--sk-violet);
  }

  &.type-enemy {
    background: rgba(248, 113, 113, 0.15);
    color: var(--sk-danger);
  }

  &.type-unknown {
    background: rgba(156, 163, 175, 0.1);
    color: var(--sk-muted);
  }
}

.rel-oath {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;

  i {
    font-size: 9px;
  }

  &.oath-none {
    background: rgba(156, 163, 175, 0.1);
    color: var(--sk-muted);
  }

  &.oath-dominant {
    background: rgba(251, 191, 36, 0.16);
    color: var(--sk-warning);
  }

  &.oath-equal {
    background: rgba(244, 114, 182, 0.16);
    color: var(--sk-pink);
  }

  &.oath-submissive {
    background: rgba(167, 139, 250, 0.16);
    color: var(--sk-violet);
  }
}

.rel-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 11px;
  color: var(--sk-muted);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;

  &.very-high {
    color: var(--sk-pink);
  }
  &.high {
    color: var(--sk-success);
  }
  &.medium {
    color: var(--sk-blue);
  }
  &.low {
    color: var(--sk-warning);
  }
  &.very-low {
    color: var(--sk-muted);
  }
  &.training {
    color: var(--sk-violet);
  }
  &.dominance-user-strong,
  &.dominance-user {
    color: var(--sk-success);
  }
  &.dominance-neutral {
    color: var(--sk-blue);
  }
  &.dominance-npc,
  &.dominance-npc-strong {
    color: var(--sk-pink);
  }
}

.stat-bar {
  height: 6px;
  background: var(--sk-soft);
  border-radius: 3px;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;

  &.affection {
    &.very-high {
      background: linear-gradient(90deg, #ec4899, #f472b6);
    }
    &.high {
      background: linear-gradient(90deg, #10b981, #34d399);
    }
    &.medium {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    &.low {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    &.very-low {
      background: var(--sk-soft);
    }
  }

  &.training {
    background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  }

  &.submission {
    &.very-high {
      background: linear-gradient(90deg, #ec4899, #f472b6);
    }
    &.high {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }
    &.medium {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }
    &.low {
      background: linear-gradient(90deg, #10b981, #34d399);
    }
    &.very-low {
      background: var(--sk-soft);
    }
  }
}

.dominance-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(244, 114, 182, 0.16), transparent 48%),
    linear-gradient(90deg, transparent 52%, rgba(52, 211, 153, 0.16)), rgba(255, 255, 255, 0.1);
}

.dominance-midline {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: var(--sk-soft);
}

.dominance-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  min-width: 2px;
  border-radius: 999px;
  transition:
    left 0.4s ease,
    width 0.4s ease;

  &.dominance-user-strong,
  &.dominance-user {
    background: linear-gradient(90deg, #10b981, #34d399);
  }

  &.dominance-neutral {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }

  &.dominance-npc,
  &.dominance-npc-strong {
    background: linear-gradient(90deg, #ec4899, #f472b6);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;

  .empty-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--sk-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;

    i {
      font-size: 32px;
      color: var(--sk-muted);
    }
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--sk-muted);
    margin-bottom: 6px;
  }

  .empty-desc {
    font-size: 13px;
    color: var(--sk-muted);
  }
}

.reputation-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reputation-card {
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.rep-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.rep-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;

  i {
    font-size: 16px;
    color: var(--sk-ink);
  }
}

.rep-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rep-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--sk-ink);
}

.rep-value {
  font-size: 14px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;

  &.very-high {
    color: var(--sk-success);
  }
  &.high {
    color: var(--sk-blue);
  }
  &.medium {
    color: var(--sk-muted);
  }
  &.low {
    color: var(--sk-warning);
  }
  &.very-low {
    color: var(--sk-danger);
  }
}

.rep-bar {
  height: 4px;
  background: var(--sk-soft);
  border-radius: 2px;
  overflow: hidden;
}

.rep-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;

  &.very-high {
    background: linear-gradient(90deg, #10b981, #34d399);
  }
  &.high {
    background: linear-gradient(90deg, #3b82f6, #60a5fa);
  }
  &.medium {
    background: var(--sk-soft);
  }
  &.low {
    background: linear-gradient(90deg, #f59e0b, #fbbf24);
  }
  &.very-low {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }
}

// 头像放大模态框样式
.avatar-modal {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
}

.modal-content {
  position: relative;
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.98), rgba(20, 20, 40, 0.98));
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  width: 360px;
  max-width: 95vw;
  max-height: 100%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  margin-top: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;

  @media (min-height: 600px) {
    margin-top: max(20px, 5vh);
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(248, 113, 113, 0.9);
  border: none;
  color: var(--sk-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: rgba(248, 113, 113, 1);
  }

  i {
    font-size: 14px;
  }
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--sk-ink);
  }
}

.modal-body {
  position: relative;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  flex: 1;
  min-height: 0;
}

.avatar-carousel {
  min-height: 420px;
}

.avatar-nav {
  position: absolute;
  top: 50%;
  z-index: 4;
  width: 38px;
  height: 48px;
  transform: translateY(-50%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--sk-ink);
  background: rgba(17, 24, 39, 0.62);
  backdrop-filter: blur(8px);
  cursor: pointer;
  transition:
    transform 0.16s ease,
    background 0.16s ease;

  &:hover {
    transform: translateY(-50%) scale(1.04);
    background: rgba(102, 126, 234, 0.72);
  }

  i {
    font-size: 16px;
  }
}

.avatar-nav-prev {
  left: 14px;
}

.avatar-nav-next {
  right: 14px;
}

.modal-avatar-img {
  width: 100%;
  max-height: 100%;
  border-radius: 12px;
  object-fit: contain;
}

.avatar-locked-panel {
  width: 100%;
  min-height: 360px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--sk-muted);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02)), rgba(255, 255, 255, 0.03);

  i {
    font-size: 42px;
  }

  span {
    font-size: 14px;
    font-weight: 700;
  }
}

.avatar-carousel-footer {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar-slide-label {
  min-height: 26px;
  padding: 0 12px;
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--sk-ink);
  background: rgba(102, 126, 234, 0.18);
  font-size: 12px;
  font-weight: 800;

  &.locked {
    border-color: rgba(255, 255, 255, 0.12);
    color: var(--sk-muted);
    background: var(--sk-soft);
  }
}

.avatar-slide-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;

  span {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--sk-soft);
    transition:
      transform 0.16s ease,
      background 0.16s ease;

    &.active {
      transform: scale(1.35);
      background: rgba(102, 126, 234, 0.95);
    }

    &.locked {
      background: var(--sk-soft);
    }
  }
}

.modal-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--sk-muted);

  i {
    font-size: 48px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}
</style>
