<template>
  <div class="cg-page">
    <SkylinkModuleHeader
      code="10"
      label="MEMORY ARCHIVE"
      title="记忆档案馆"
      description="把学园里的特别瞬间，逐一珍藏。"
      icon="fas fa-layer-group"
    />
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.key"
        class="category-tab"
        :class="{ active: currentCategory === category.key }"
        @click="currentCategory = category.key"
      >
        <i :class="category.icon"></i>
        <span>{{ category.label }}</span>
        <span class="count-badge">{{ getCategoryCount(category.key) }}</span>
      </button>
    </div>
    <div v-if="!modalCG" class="cg-content">
      <div class="character-selector" v-if="currentCategory !== 'all'">
        <div class="section-header">
          <i class="fas fa-user"></i>
          <span>选择角色</span>
        </div>
        <div class="character-list">
          <button
            v-for="char in availableCharacters"
            :key="char"
            class="character-btn"
            :class="{ active: selectedCharacter === char }"
            @click="selectedCharacter = char"
          >
            <div class="char-avatar">
              <img :src="getAvatarUrl(char)" :alt="char" @error="handleImageError($event)" class="avatar-img" />
            </div>
            <span class="char-name">{{ char }}</span>
            <span class="unlock-badge" v-if="getCharacterUnlockCount(char) > 0">
              {{ getCharacterUnlockCount(char) }}
            </span>
          </button>
        </div>
      </div>
      <template v-if="currentCategory === 'all'">
        <div class="section-header main-header">
          <i class="fas fa-images"></i>
          <span>全部CG</span>
          <span class="count-badge">{{ getTotalUnlockedCount }} / {{ getTotalCGCount }}</span>
        </div>
        <label class="unlock-filter-checkbox">
          <input type="checkbox" v-model="showOnlyUnlocked" />
          <span class="checkbox-custom"></span>
          <span class="checkbox-label">仅显示已解锁</span>
        </label>

        <div v-for="char in filteredCharactersWithCGs" :key="char" class="character-section">
          <div class="character-section-header" @click="toggleCharacterCollapse(char)">
            <div class="char-avatar-small">
              <img :src="getAvatarUrl(char)" :alt="char" @error="handleImageError($event)" class="avatar-img" />
            </div>
            <span class="char-section-name">{{ char }}</span>
            <span class="count-badge">{{ getCharacterUnlockCount(char) }} / {{ getCharacterCGCount(char) }}</span>
            <i class="fas collapse-icon" :class="isCharacterCollapsed(char) ? 'fa-chevron-down' : 'fa-chevron-up'"></i>
          </div>
          <div class="cg-grid" v-show="!isCharacterCollapsed(char)">
            <div
              v-for="cg in getCharacterCGs(char)"
              :key="cg.id + '-' + cg.imageIndex"
              class="cg-item"
              :class="{
                locked: !isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
                unlocked: isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
              }"
              @click="handleCGImageClick(cg)"
            >
              <div class="cg-thumbnail">
                <img
                  v-if="isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex)"
                  :src="getCGImageUrl(cg)"
                  :alt="cg.name"
                  @error="handleCGImageError($event)"
                  class="cg-img"
                />
                <div v-else class="locked-overlay">
                  <i class="fas fa-lock"></i>
                </div>
              </div>
              <div class="cg-info">
                <span class="cg-name">{{
                  isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex) ? cg.name : '???'
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="section-header">
          <i class="fas fa-images"></i>
          <span>{{ getCategoryLabel(currentCategory) }}</span>
          <span class="count-badge">{{ getFilteredUnlockedCount }} / {{ getCategoryTotalCount }}</span>
        </div>
        <label class="unlock-filter-checkbox">
          <input type="checkbox" v-model="showOnlyUnlocked" />
          <span class="checkbox-custom"></span>
          <span class="checkbox-label">仅显示已解锁</span>
        </label>

        <div class="section" v-if="filteredCGImages.length > 0">
          <div class="cg-grid">
            <div
              v-for="cg in filteredCGImages"
              :key="cg.id + '-' + cg.imageIndex"
              class="cg-item"
              :class="{
                locked: !isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
                unlocked: isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
              }"
              @click="handleCGImageClick(cg)"
            >
              <div class="cg-thumbnail">
                <img
                  v-if="isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex)"
                  :src="getCGImageUrl(cg)"
                  :alt="cg.name"
                  @error="handleCGImageError($event)"
                  class="cg-img"
                />
                <div v-else class="locked-overlay">
                  <i class="fas fa-lock"></i>
                </div>
              </div>
              <div class="cg-info">
                <span class="cg-name">{{
                  isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex) ? cg.name : '???'
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="empty-state" v-else-if="getCategoryTotalCount > 0">
          <div class="empty-icon">
            <i class="fas fa-images"></i>
          </div>
          <p class="empty-title">暂无CG数据</p>
          <p class="empty-desc">
            {{ selectedCharacter ? `${selectedCharacter}的CG尚未解锁` : '请选择一个角色查看CG' }}
          </p>
        </div>
      </template>
    </div>

    <div v-else class="cg-detail-view">
      <div class="detail-page-header">
        <button class="detail-back-btn" @click="closeModal">
          <i class="fas fa-arrow-left"></i>
          <span>返回图库</span>
        </button>
        <span class="detail-counter">{{ detailCGIndex + 1 }} / {{ detailCGList.length }}</span>
      </div>

      <div class="modal-content cg-detail-card">
        <div class="modal-header">
          <h3>{{ modalCG?.name }}</h3>
          <span class="modal-character">{{ modalCG?.characterName }}</span>
        </div>
        <div class="modal-body">
          <div class="image-container">
            <img class="modal-cg-img" :src="getModalImageUrl()" :alt="modalCG?.name" @error="handleModalImageError" />
          </div>
          <div class="modal-description" v-if="modalCG">
            <p>{{ modalCG.description }}</p>
          </div>
        </div>
        <div class="cg-detail-footer">
          <button class="detail-nav-btn" :disabled="!canShowPreviousCG" @click="showPreviousCG">
            <i class="fas fa-chevron-left"></i>
            上一张
          </button>
          <button class="detail-nav-btn primary" :disabled="!canShowNextCG" @click="showNextCG">
            下一张
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkylinkModuleHeader from '../../../shared/SkylinkModuleHeader.vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import {
  getAllUnlockedCGKeysByCharacter,
  getCGCharacterName,
  getCGImageKey,
  unlockCharacterCGKey,
} from '../../../shared/cgUnlockStore';
import { CG_CONFIGS, type CGEvent } from '../../../战斗界面/data/cgConfig';
import { getNormalAvatarUrl } from '../../phone/backstreetAvatarSettings';

const unlockedCGsByCharacter = ref<Record<string, Set<string>>>({});

const collapsedCharacters = ref<Set<string>>(new Set());

const showOnlyUnlocked = ref(false);

function isCharacterCollapsed(characterName: string): boolean {
  return collapsedCharacters.value.has(characterName);
}

function toggleCharacterCollapse(characterName: string) {
  if (collapsedCharacters.value.has(characterName)) {
    collapsedCharacters.value.delete(characterName);
  } else {
    collapsedCharacters.value.add(characterName);
  }
}

const categories = [
  { key: 'all', label: '全部', icon: 'fas fa-th' },
  { key: 'male_defeat', label: '男U战败', icon: 'fas fa-mars' },
  { key: 'male_victory', label: '男U战胜', icon: 'fas fa-trophy' },
  { key: 'female_defeat', label: '女U战败', icon: 'fas fa-venus' },
  { key: 'female_victory', label: '女U战胜', icon: 'fas fa-crown' },
];

const currentCategory = ref('all');
const selectedCharacter = ref<string | null>(null);
const modalCG = ref<FlattenedCGImage | null>(null);

interface FlattenedCGImage {
  id: string;
  name: string;
  description: string;
  imageName: string;
  imageIndex: number;
  characterName: string;
  genderKey: 'male' | 'female';
  resultKey: 'defeat' | 'victory';
}

const allCGImages = computed<FlattenedCGImage[]>(() => {
  const result: FlattenedCGImage[] = [];

  for (const config of CG_CONFIGS) {
    const processEvents = (events: CGEvent[], genderKey: 'male' | 'female', resultKey: 'defeat' | 'victory') => {
      for (const event of events) {
        for (let i = 0; i < event.images.length; i++) {
          result.push({
            id: event.id,
            name: event.name,
            description: event.description,
            imageName: event.images[i],
            imageIndex: i,
            characterName: config.characterName,
            genderKey,
            resultKey,
          });
        }
      }
    };

    processEvents(config.male.defeat, 'male', 'defeat');
    processEvents(config.male.victory, 'male', 'victory');
    processEvents(config.female.defeat, 'female', 'defeat');
    processEvents(config.female.victory, 'female', 'victory');
  }

  return result;
});

const availableCharacters = computed(() => {
  const chars = new Set<string>();
  for (const cg of allCGImages.value) {
    chars.add(cg.characterName);
  }
  return Array.from(chars).sort();
});

const filteredCharactersWithCGs = computed(() => {
  if (!showOnlyUnlocked.value) {
    return availableCharacters.value;
  }
  return availableCharacters.value.filter(char => {
    return allCGImages.value.some(
      cg => cg.characterName === char && isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
    );
  });
});

function getCharacterCGs(characterName: string): FlattenedCGImage[] {
  let cgs = allCGImages.value.filter(cg => cg.characterName === characterName);
  if (showOnlyUnlocked.value) {
    cgs = cgs.filter(cg => isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex));
  }
  return cgs;
}

function getCharacterCGCount(characterName: string): number {
  return getCharacterCGs(characterName).length;
}

const getCategoryTotalCount = computed(() => {
  let result = allCGImages.value;

  if (currentCategory.value !== 'all') {
    const [gender, outcome] = currentCategory.value.split('_');
    result = result.filter(cg => cg.genderKey === gender && cg.resultKey === outcome);
  }

  if (selectedCharacter.value) {
    result = result.filter(cg => cg.characterName === selectedCharacter.value);
  }

  return result.length;
});

const getTotalCGCount = computed(() => allCGImages.value.length);

const getTotalUnlockedCount = computed(() => {
  return allCGImages.value.filter(cg => isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex)).length;
});

const filteredCGImages = computed(() => {
  let result = allCGImages.value;

  if (currentCategory.value !== 'all') {
    const [gender, outcome] = currentCategory.value.split('_');
    result = result.filter(cg => cg.genderKey === gender && cg.resultKey === outcome);
  }

  if (selectedCharacter.value) {
    result = result.filter(cg => cg.characterName === selectedCharacter.value);
  }

  if (showOnlyUnlocked.value) {
    result = result.filter(cg => isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex));
  }

  return result;
});

const getFilteredUnlockedCount = computed(() => {
  return filteredCGImages.value.filter(cg => isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex)).length;
});

const detailCGList = computed<FlattenedCGImage[]>(() => {
  if (!modalCG.value) return [];

  const sourceList =
    currentCategory.value === 'all'
      ? allCGImages.value.filter(cg => cg.characterName === modalCG.value?.characterName)
      : filteredCGImages.value;

  return sourceList.filter(cg => isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex));
});

const detailCGIndex = computed(() => {
  if (!modalCG.value) return -1;
  return detailCGList.value.findIndex(cg => cg.id === modalCG.value?.id && cg.imageIndex === modalCG.value?.imageIndex);
});

const canShowPreviousCG = computed(() => detailCGIndex.value > 0);
const canShowNextCG = computed(() => detailCGIndex.value >= 0 && detailCGIndex.value < detailCGList.value.length - 1);

async function loadUnlockedCGs() {
  const unlockMap = await getAllUnlockedCGKeysByCharacter();
  unlockedCGsByCharacter.value = Object.fromEntries(
    Object.entries(unlockMap).map(([characterName, cgKeys]) => [characterName, new Set(cgKeys)]),
  );
  console.info('[CG页面] 加载已解锁CG数量:', getTotalUnlockedCount.value);
}

async function unlockCGImage(characterName: string, cgId: string, imageIndex: number) {
  const key = getCGImageKey(cgId, imageIndex);
  const currentKeys = new Set(unlockedCGsByCharacter.value[characterName] ?? []);

  if (!currentKeys.has(key)) {
    currentKeys.add(key);
    unlockedCGsByCharacter.value = {
      ...unlockedCGsByCharacter.value,
      [characterName]: currentKeys,
    };
  }

  const unlockedNew = await unlockCharacterCGKey(characterName, key);
  if (unlockedNew) {
    console.info('[CG页面] 解锁CG图片:', characterName, key);
  }
}

function isCGImageUnlocked(characterName: string, cgId: string, imageIndex: number): boolean {
  const key = getCGImageKey(cgId, imageIndex);
  return unlockedCGsByCharacter.value[characterName]?.has(key) ?? false;
}

function getCategoryCount(category: string): number {
  if (category === 'all') {
    return allCGImages.value.length;
  }
  const [gender, outcome] = category.split('_');
  return allCGImages.value.filter(cg => cg.genderKey === gender && cg.resultKey === outcome).length;
}

function getCategoryLabel(category: string): string {
  const cat = categories.find(c => c.key === category);
  return cat?.label || category;
}

function getCharacterUnlockCount(characterName: string): number {
  return allCGImages.value.filter(
    cg => cg.characterName === characterName && isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex),
  ).length;
}

function getAvatarUrl(name: string): string {
  return getNormalAvatarUrl(name);
}

function getCGImageUrl(cg: FlattenedCGImage): string {
  const genderFolder = cg.genderKey === 'male' ? '男u' : '女u';
  const resultFolder = cg.resultKey === 'victory' ? '战胜事件' : '战败事件';
  return `https://img.vinsimage.org/性斗学园/cg/${cg.characterName}/${genderFolder}/${resultFolder}/${cg.imageName}`;
}

function getModalImageUrl(): string {
  if (!modalCG.value) return '';
  return getCGImageUrl(modalCG.value);
}

function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.fallback-icon')) {
    const icon = document.createElement('i');
    icon.className = 'fas fa-user fallback-icon';
    parent.appendChild(icon);
  }
}

function handleCGImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.fallback-icon')) {
    const icon = document.createElement('i');
    icon.className = 'fas fa-image fallback-icon';
    parent.appendChild(icon);
  }
}

function handleModalImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.modal-fallback')) {
    const fallback = document.createElement('div');
    fallback.className = 'modal-fallback';
    fallback.innerHTML = '<i class="fas fa-image"></i><p>图片加载失败</p>';
    parent.appendChild(fallback);
  }
}

function handleCGImageClick(cg: FlattenedCGImage) {
  if (!isCGImageUnlocked(cg.characterName, cg.id, cg.imageIndex)) {
    if (typeof toastr !== 'undefined') {
      toastr.info('该 CG 尚未解锁，请先在战斗中触发对应事件。');
    }
    return;
  }

  modalCG.value = cg;
}

function showPreviousCG() {
  if (!canShowPreviousCG.value) return;
  modalCG.value = detailCGList.value[detailCGIndex.value - 1] ?? modalCG.value;
}

function showNextCG() {
  if (!canShowNextCG.value) return;
  modalCG.value = detailCGList.value[detailCGIndex.value + 1] ?? modalCG.value;
}

function closeModal() {
  modalCG.value = null;
}

async function unlockCGImagesByLookup(cgId: string, imageIndex?: number, characterName?: string) {
  const targetCharacterName = characterName ? (getCGCharacterName(characterName) ?? characterName) : undefined;
  const eventCGs = allCGImages.value.filter(cg => {
    if (cg.id !== cgId) {
      return false;
    }
    if (imageIndex !== undefined && cg.imageIndex !== imageIndex) {
      return false;
    }
    if (targetCharacterName && cg.characterName !== targetCharacterName) {
      return false;
    }
    return true;
  });

  for (const cg of eventCGs) {
    await unlockCGImage(cg.characterName, cg.id, cg.imageIndex);
  }
}

async function handleCGUnlockEvent(event: CustomEvent) {
  const cgId = event.detail?.cgId;
  const imageIndex = event.detail?.imageIndex;
  const characterName = event.detail?.characterName;

  if (cgId !== undefined) {
    await unlockCGImagesByLookup(cgId, imageIndex, characterName);
  }
}

function handleCGUnlockRecordsUpdated() {
  void loadUnlockedCGs();
}

watch(
  availableCharacters,
  chars => {
    if (chars.length > 0 && !selectedCharacter.value) {
      selectedCharacter.value = chars[0];
    }
    if (chars.length > 0 && collapsedCharacters.value.size === 0) {
      chars.forEach(char => collapsedCharacters.value.add(char));
    }
  },
  { immediate: true },
);

onMounted(() => {
  void loadUnlockedCGs();

  window.addEventListener('cg-unlocked', handleCGUnlockEvent as unknown as EventListener);
  window.addEventListener('cg-unlock-records-updated', handleCGUnlockRecordsUpdated);

  const globalAny = window as any;
  globalAny.__cgUnlockImage = (cgId: string, imageIndex?: number, characterName?: string) =>
    unlockCGImagesByLookup(cgId, imageIndex, characterName);
});

onUnmounted(() => {
  window.removeEventListener('cg-unlocked', handleCGUnlockEvent as unknown as EventListener);
  window.removeEventListener('cg-unlock-records-updated', handleCGUnlockRecordsUpdated);
});
</script>

<style scoped lang="scss">
.cg-page {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
  position: relative;
  padding-bottom: 80px; // 为底部导航栏留出空间
}

.category-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--sk-soft);
    border-radius: 2px;
  }
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: var(--sk-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: var(--sk-soft);
    color: var(--sk-ink);
  }

  &.active {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3));
    border-color: rgba(236, 72, 153, 0.5);
    color: var(--sk-ink);
  }

  i {
    font-size: 11px;
  }

  .count-badge {
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    font-size: 10px;
  }
}

.character-selector {
  margin-bottom: 16px;
}

.character-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--sk-soft);
    border-radius: 2px;
  }
}

.character-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  position: relative;

  &:hover {
    background: var(--sk-soft);
    transform: translateY(-2px);
  }

  &.active {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(102, 126, 234, 0.1));
    border-color: rgba(102, 126, 234, 0.4);
  }

  .char-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .fallback-icon {
      font-size: 16px;
      color: var(--sk-violet);
    }
  }

  .char-name {
    font-size: 10px;
    color: var(--sk-ink);
    text-align: center;
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .unlock-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px 5px;
    background: linear-gradient(135deg, #ec4899, #a855f7);
    border-radius: 8px;
    font-size: 9px;
    color: var(--sk-ink);
    font-weight: 600;
  }
}

.cg-content {
  flex: 1;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sk-ink);
  margin-bottom: 12px;

  i:first-child {
    color: var(--sk-pink);
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

.main-header {
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.character-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.character-section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--sk-soft);
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--sk-soft);
  }

  &:active {
    background: var(--sk-soft);
  }

  .char-avatar-small {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    flex-shrink: 0;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .char-section-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--sk-ink);
  }

  .count-badge {
    margin-left: auto;
    padding: 3px 10px;
    background: rgba(236, 72, 153, 0.2);
    border-radius: 12px;
    font-size: 11px;
    color: var(--sk-ink);
  }

  .collapse-icon {
    color: var(--sk-muted);
    font-size: 12px;
    margin-left: 8px;
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }
}

.unlock-filter-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    display: none;
  }

  .checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(236, 72, 153, 0.5);
    border-radius: 4px;
    background: var(--sk-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &::after {
      content: '';
      width: 10px;
      height: 6px;
      border: 2px solid transparent;
      border-top: none;
      border-right: none;
      transform: rotate(-45deg) translateY(-1px);
      opacity: 0;
      transition: opacity 0.2s ease;
    }
  }

  input[type='checkbox']:checked + .checkbox-custom {
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.6), rgba(168, 85, 247, 0.6));
    border-color: rgba(236, 72, 153, 0.8);

    &::after {
      border-color: white;
      opacity: 1;
    }
  }

  .checkbox-label {
    font-size: 12px;
    color: var(--sk-ink);
  }

  &:hover {
    .checkbox-custom {
      border-color: rgba(236, 72, 153, 0.8);
      background: var(--sk-soft);
    }

    .checkbox-label {
      color: var(--sk-ink);
    }
  }
}

.cg-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.cg-item {
  background: var(--sk-soft);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &.unlocked {
    border-color: rgba(236, 72, 153, 0.3);

    &:hover {
      border-color: rgba(236, 72, 153, 0.5);
    }
  }

  &.locked {
    opacity: 0.6;

    &:hover {
      opacity: 0.8;
    }
  }

  .cg-thumbnail {
    width: 100%;
    aspect-ratio: 1;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    .cg-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .locked-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.6);

      i {
        font-size: 24px;
        color: var(--sk-muted);
      }
    }

    .fallback-icon {
      font-size: 24px;
      color: var(--sk-muted);
    }
  }

  .cg-info {
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .cg-name {
      font-size: 10px;
      color: var(--sk-ink);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cg-rarity {
      font-size: 9px;
      color: var(--sk-warning);
      display: flex;
      align-items: center;
      gap: 2px;

      i {
        font-size: 8px;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;

  .empty-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--sk-soft);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    i {
      font-size: 24px;
      color: var(--sk-muted);
    }
  }

  .empty-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--sk-muted);
    margin: 0 0 8px;
  }

  .empty-desc {
    font-size: 12px;
    color: var(--sk-muted);
    margin: 0;
  }
}

.cg-detail-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: var(--sk-soft);
  color: var(--sk-ink);
  cursor: pointer;
}

.detail-counter {
  font-size: 12px;
  color: var(--sk-muted);
}

.modal-content {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(20, 20, 30, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.cg-detail-card {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
}

.modal-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--sk-ink);
  }

  .modal-character {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--sk-muted);
  }
}

.modal-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px;
  overflow: hidden;

  .modal-cg-img {
    width: 100%;
    max-height: min(68vh, 720px);
    object-fit: contain;
  }

  .modal-fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 40px;
    color: var(--sk-muted);

    i {
      font-size: 32px;
    }

    p {
      margin: 0;
      font-size: 13px;
    }
  }
}

.modal-description {
  padding: 12px;
  background: var(--sk-soft);
  border-radius: 12px;

  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--sk-ink);
  }
}

.cg-detail-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 16px;
}

.detail-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 120px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: var(--sk-soft);
  color: var(--sk-ink);
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &.primary {
    margin-left: auto;
    background: linear-gradient(135deg, rgba(236, 72, 153, 0.28), rgba(168, 85, 247, 0.28));
    border-color: rgba(236, 72, 153, 0.32);
  }
}

@media (max-width: 640px) {
  .detail-page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-counter {
    text-align: right;
  }

  .cg-detail-footer {
    flex-direction: column;
  }

  .detail-nav-btn,
  .detail-nav-btn.primary {
    width: 100%;
    margin-left: 0;
  }
}
</style>
