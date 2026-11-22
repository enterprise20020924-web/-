<template>
  <section class="admission-select" :data-motion="reducedMotion ? 'reduced' : 'full'" aria-label="入学角色选择">
    <svg class="admission-reload-scenery" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden="true">
      <path fill="#1028ef" d="M0 0h1200v800H0z" />
      <path fill="#071278" d="M0 292 1200 24v118L0 410zM0 686l1200-268v382H0z" />
      <path fill="#284eff" d="m0 640 1200-268v48L0 688z" />
      <path fill="none" stroke="#39ddff" stroke-opacity=".35" d="m0 298 1200-268M0 650l1200-268" />
      <path fill="#fff" fill-opacity=".1" d="m1020 0-60 198 50-11L1070 0z" />
    </svg>
    <header class="admission-select-heading">
      <span class="admission-select-eyebrow"><i></i> CHARACTER <b>SELECT</b><small>AMAMI ACADEMY</small></span>
      <span class="admission-select-counter"
        ><b>{{ number(currentIndex + 1) }}</b> / {{ number(deck.length) }}</span
      >
    </header>

    <div class="admission-select-stage">
      <div class="admission-select-art" :class="{ 'has-illustration': profile.battleUrl && !artFailed }">
        <svg class="admission-reload-orbit" viewBox="0 0 600 680" fill="none" aria-hidden="true">
          <circle cx="280" cy="302" r="210" stroke="currentColor" stroke-width="2" />
          <path
            d="M280 68a234 234 0 0 1 234 234M280 536A234 234 0 0 1 46 302"
            stroke="currentColor"
            stroke-width="11"
          />
          <path d="m0 600 600-134M0 626l600-134M80 94l40-9m-20-16 0 40m395 370 40-9m-20-16v40" stroke="currentColor" />
          <circle cx="280" cy="68" r="6" fill="currentColor" />
          <circle cx="280" cy="536" r="6" fill="currentColor" />
        </svg>
        <Transition name="admission-illustration">
          <img
            v-if="profile.battleUrl && !artFailed"
            :key="profile.battleUrl"
            class="admission-battle-illustration"
            :src="profile.battleUrl"
            :alt="`${profile.characterName}的战斗插图`"
            draggable="false"
            @load="artLoading = false"
            @error="artFailed = true"
          />
          <div v-else :key="current.key" class="admission-select-placeholder">
            <span class="admission-placeholder-number">{{ number(currentIndex + 1) }}</span>
            <i :class="['fas', profile.icon]" aria-hidden="true"></i>
            <span v-if="current.kind !== 'custom'">CHARACTER FILE</span>
            <strong :class="{ 'is-custom': current.kind === 'custom' }">
              {{ current.kind === 'custom' ? '出名或出丑' : '身份形象待定' }}
            </strong>
          </div>
        </Transition>
        <span v-if="profile.battleUrl && artLoading && !artFailed" class="admission-art-loading">插图载入中</span>
        <div class="admission-art-caption">
          <small>{{ profile.identityName }}</small
          ><strong>{{ profile.name }}</strong>
        </div>
        <span class="admission-art-corner" aria-hidden="true"></span>
      </div>

      <div class="admission-select-info" aria-live="polite">
        <div class="admission-profile-kicker">
          <span>人物档案</span><i></i><small>NO. {{ number(currentIndex + 1) }}</small>
        </div>
        <h3 v-if="profile.quote">{{ profile.quote }}</h3>
        <p class="admission-profile-description">{{ profile.description }}</p>

        <div v-if="profile.passiveName" class="admission-profile-trait">
          <div>
            <small>身份效果</small><strong>{{ profile.passiveName }}</strong>
          </div>
          <p v-if="profile.passiveDescription">{{ profile.passiveDescription }}</p>
          <p v-for="description in profile.mechanismDescriptions" :key="description">{{ description }}</p>
          <dl v-if="profile.bonuses.length" class="admission-profile-bonuses">
            <div v-for="bonus in profile.bonuses" :key="bonus.key">
              <dt>{{ bonus.label }}</dt>
              <dd>{{ bonus.value }}</dd>
            </div>
          </dl>
        </div>
        <div v-else class="admission-custom-note">
          <span>01</span>
          <p>先建立个人档案<br /><small>校园身份、能力与特长可在后续步骤选择。</small></p>
        </div>

        <Teleport to=".opening-workspace" :disabled="!compact">
          <div :class="compact ? 'opening-footer admission-selection-footer' : 'admission-selection-inline'">
            <strong v-if="compact" class="admission-selection-name">{{ profile.name }}</strong>
            <button
              type="button"
              class="admission-select-confirm"
              :class="{ 'opening-next': compact }"
              @click="confirmSelection"
            >
              <span>{{ current.kind === 'custom' ? '创建我的档案' : '选择此身份' }}</span>
              <svg viewBox="0 0 32 20" fill="none" aria-hidden="true"><path d="M1 10h27M20 2l8 8-8 8" /></svg>
            </button>
          </div>
        </Teleport>
      </div>
    </div>

    <div class="admission-roster-heading">
      <strong><em>SELECT</em> 选择身份</strong><span>浏览人物 · 确认后填写档案</span>
    </div>
    <nav class="admission-roster" aria-label="身份头像名册">
      <button
        class="admission-roster-arrow"
        type="button"
        aria-label="上一位身份"
        :disabled="currentIndex === 0"
        @click="move(-1)"
      >
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <div
        ref="rail"
        class="admission-roster-rail"
        @keydown.left.prevent="move(-1, true)"
        @keydown.right.prevent="move(1, true)"
        @keydown.home.prevent="focusIndex(0, true)"
        @keydown.end.prevent="focusIndex(deck.length - 1, true)"
      >
        <button
          v-for="(card, index) in deck"
          :key="card.key"
          type="button"
          class="admission-roster-card"
          :class="{ 'is-selected': current.key === card.key, 'is-custom': card.kind === 'custom' }"
          :aria-pressed="current.key === card.key"
          :aria-label="`预览身份：${profiles[index].name}`"
          :tabindex="current.key === card.key ? 0 : -1"
          :data-card-key="card.key"
          @click="focusIndex(index)"
          @pointerenter="previewOnHover($event, index)"
          @focus="focusIndex(index)"
        >
          <span class="admission-roster-number">{{ number(index + 1) }}</span>
          <span class="admission-roster-portrait">
            <img
              v-if="profiles[index].fullbodyUrl && !failedPortraits.has(profiles[index].fullbodyUrl)"
              class="admission-roster-head"
              :src="profiles[index].fullbodyUrl"
              alt=""
              loading="lazy"
              draggable="false"
              @error="failedPortraits.add(profiles[index].fullbodyUrl)"
            />
            <span v-else class="admission-roster-placeholder" aria-hidden="true"
              ><i :class="['fas', profiles[index].icon]"></i
              ><b>{{ card.kind === 'custom' ? '+' : number(index + 1) }}</b></span
            >
          </span>
          <strong>{{ profiles[index].name }}</strong>
          <span class="admission-roster-selected" aria-hidden="true"></span>
        </button>
      </div>
      <button
        class="admission-roster-arrow"
        type="button"
        aria-label="下一位身份"
        :disabled="currentIndex === deck.length - 1"
        @click="move(1)"
      >
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
    </nav>
    <footer class="admission-roster-footer">
      <span>AMAMI ACADEMY</span><span>{{ number(deck.length) }} 个身份 <i></i> {{ selectedGender }}生档案</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useMediaQuery, useResizeObserver } from '@vueuse/core';
import type { PlayerPresetSummary } from '../../性斗学园测试版/shared/playerPresetStore';
import { MAGIC_GIRL_ARCHETYPE_ID } from '../../性斗学园测试版/开局/constants';
import {
  createAdmissionCharacterDeck,
  type AdmissionGender,
  type AdmissionIdentityChoice,
} from '../../性斗学园测试版/开局/utils/admissionCharacterSelection';
import { describeAdmissionCard } from './admission-character-profiles';
import { admissionIdentityArt } from './admission-identity-art';

const props = defineProps<{
  presets: PlayerPresetSummary[];
  selectedGender: AdmissionGender;
  selectedArchetypeId?: string | null;
  reducedMotion: boolean;
}>();
const emit = defineEmits<{
  (e: 'select-custom', gender: AdmissionGender): void;
  (e: 'select-identity', choice: AdmissionIdentityChoice): void;
}>();
const rail = ref<HTMLElement | null>(null);
const compact = useMediaQuery('(max-width: 600px)');
const deck = computed(() => createAdmissionCharacterDeck(props.presets, props.selectedGender));
const profiles = computed(() => deck.value.map(card => describeAdmissionCard(card, props.selectedGender)));
const activeKey = ref('custom');
const currentIndex = computed(() =>
  Math.max(
    0,
    deck.value.findIndex(card => card.key === activeKey.value),
  ),
);
const current = computed(() => deck.value[currentIndex.value]);
const profile = computed(() => profiles.value[currentIndex.value]);
const failedPortraits = reactive(new Set<string>());
const artLoading = ref(true);
const artFailed = ref(false);
const number = (value: number) => String(value).padStart(2, '0');

function resetPreview() {
  activeKey.value =
    deck.value.find(card => card.key === props.selectedArchetypeId)?.key ??
    deck.value.find(card => card.key === MAGIC_GIRL_ARCHETYPE_ID)?.key ??
    'custom';
  void keepPreviewVisible();
}
watch(() => props.selectedGender, resetPreview, { immediate: true });
watch(
  () => profile.value.battleUrl,
  () => {
    artLoading.value = true;
    artFailed.value = false;
  },
);

async function keepPreviewVisible(focus = false) {
  await nextTick();
  const element = rail.value;
  const button = element?.querySelector<HTMLButtonElement>(`[data-card-key="${current.value.key}"]`);
  if (!element || !button) return;
  if (focus) button.focus({ preventScroll: true });
  const cardBounds = button.getBoundingClientRect();
  const railBounds = element.getBoundingClientRect();
  if (cardBounds.left < railBounds.left + 4) element.scrollLeft += cardBounds.left - railBounds.left - 4;
  else if (cardBounds.right > railBounds.right - 4) element.scrollLeft += cardBounds.right - railBounds.right + 4;
}
function focusIndex(index: number, focus = false) {
  const card = deck.value[Math.max(0, Math.min(index, deck.value.length - 1))];
  activeKey.value = card.key;
  void keepPreviewVisible(focus);
}
function move(offset: number, focus = false) {
  focusIndex(currentIndex.value + offset, focus);
}
function previewOnHover(event: PointerEvent, index: number) {
  if (event.pointerType === 'mouse') activeKey.value = deck.value[index].key;
}
function confirmSelection() {
  const card = current.value;
  if (card.kind === 'custom') emit('select-custom', props.selectedGender);
  else if (card.kind === 'identity')
    emit('select-identity', {
      gender: props.selectedGender,
      archetypeId: card.archetypeId,
      presetName: card.preset?.name,
      characterName: admissionIdentityArt[card.archetypeId]?.name,
    });
}
useResizeObserver(rail, () => {
  void keepPreviewVisible();
});
</script>
