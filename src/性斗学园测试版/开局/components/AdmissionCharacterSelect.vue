<template>
  <section ref="selectionElement" class="sk-character-selection" aria-label="入学角色选择">
    <div
      ref="bookElement"
      class="sk-character-book"
      :class="{ 'is-turning': turning, 'is-dragging': dragging }"
      :style="{ '--sk-character-columns': cardsPerPage, ...bookStyle }"
      tabindex="0"
      role="region"
      aria-label="可拖拽翻页的身份卡册"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @lostpointercapture="onPointerCancel"
      @click.capture="onClickCapture"
      @dragstart.prevent
      @keydown.left.prevent="turn(-1)"
      @keydown.right.prevent="turn(1)"
    >
      <div
        :key="`${selectedGender}-${page.index}-${cardsPerPage}`"
        class="sk-character-card-grid sk-book-base"
        :inert="turning"
        :aria-hidden="turning || undefined"
      >
        <AdmissionCharacterCard
          v-for="card in page.cards"
          :key="card.key"
          :card="card"
          :gender="selectedGender"
          @select-custom="emit('select-custom', $event)"
          @select-identity="emit('select-identity', $event)"
        />
      </div>
      <template v-if="turning">
        <div class="sk-character-card-grid sk-book-under" inert aria-hidden="true">
          <AdmissionCharacterCard
            v-for="card in underPage.cards"
            :key="card.key"
            :card="card"
            :gender="selectedGender"
          />
        </div>
        <div class="sk-book-under-shade" aria-hidden="true"></div>
        <div class="sk-book-leaf" inert aria-hidden="true">
          <div class="sk-character-card-grid sk-book-front">
            <AdmissionCharacterCard
              v-for="card in leafPage.cards"
              :key="card.key"
              :card="card"
              :gender="selectedGender"
            />
          </div>
          <div class="sk-book-back"></div>
        </div>
      </template>
    </div>

    <nav class="sk-character-pagination" aria-label="角色卡片分页">
      <button
        type="button"
        aria-label="上一页角色"
        :disabled="page.index === 0 || turning || dragging"
        @click="turn(-1)"
      >
        <i class="fas fa-chevron-left" aria-hidden="true"></i>
      </button>
      <span
        class="sk-character-page-status"
        role="status"
        :aria-label="`第 ${page.index + 1} 页，共 ${page.pageCount} 页`"
      >
        <span aria-hidden="true"
          ><strong>{{ String(page.index + 1).padStart(2, '0') }}</strong
          ><small>/ {{ String(page.pageCount).padStart(2, '0') }}</small></span
        >
        <span class="sk-character-page-marks" aria-hidden="true">
          <i v-for="number in page.pageCount" :key="number" :class="{ 'is-current': number === page.index + 1 }"></i>
        </span>
      </span>
      <button
        type="button"
        aria-label="下一页角色"
        :disabled="page.index === page.pageCount - 1 || turning || dragging"
        @click="turn(1)"
      >
        <i class="fas fa-chevron-right" aria-hidden="true"></i>
      </button>
    </nav>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { PlayerPresetSummary } from '../../shared/playerPresetStore';
import AdmissionCharacterCard from './AdmissionCharacterCard.vue';
import { useAdmissionBookTurn } from '../utils/admissionBookTurn';
import {
  createAdmissionCharacterDeck,
  getAdmissionCharacterPage,
  type AdmissionGender,
  type AdmissionIdentityChoice,
} from '../utils/admissionCharacterSelection';

const props = defineProps<{
  presets: PlayerPresetSummary[];
  selectedGender: AdmissionGender;
  reducedMotion: boolean;
}>();
const emit = defineEmits<{
  (e: 'select-custom', gender: AdmissionGender): void;
  (e: 'select-identity', choice: AdmissionIdentityChoice): void;
}>();
const selectionElement = ref<HTMLElement | null>(null);
const bookElement = ref<HTMLElement | null>(null);
const cardsPerPage = ref(3);
const requestedPage = ref(0);
const deck = computed(() => createAdmissionCharacterDeck(props.presets, props.selectedGender));
const page = computed(() => getAdmissionCharacterPage(deck.value, requestedPage.value, cardsPerPage.value));
const {
  direction,
  dragging,
  turning,
  bookStyle,
  turn,
  reset,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onClickCapture,
} = useAdmissionBookTurn({
  element: bookElement,
  pageIndex: computed(() => page.value.index),
  pageCount: computed(() => page.value.pageCount),
  reducedMotion: () => props.reducedMotion,
  commit: offset => {
    requestedPage.value = page.value.index + offset;
  },
});
const targetPage = computed(() =>
  getAdmissionCharacterPage(deck.value, page.value.index + direction.value, cardsPerPage.value),
);
const underPage = computed(() => (direction.value < 0 ? page.value : targetPage.value));
const leafPage = computed(() => (direction.value < 0 ? targetPage.value : page.value));
let sizeObserver: ResizeObserver | undefined;

watch([() => props.selectedGender, cardsPerPage], () => {
  reset();
  requestedPage.value = 0;
});

onMounted(() => {
  const element = selectionElement.value;
  if (!element) return;
  const fitCards = () => {
    cardsPerPage.value = element.clientWidth <= 600 ? 2 : 3;
  };
  sizeObserver = new ResizeObserver(fitCards);
  sizeObserver.observe(element);
  fitCards();
});
onBeforeUnmount(() => sizeObserver?.disconnect());
</script>
