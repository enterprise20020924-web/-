<template>
  <div class="amami-map-travel-layer" @pointerdown.stop @wheel.stop @click.self="cancel" @keydown="handleKeydown">
    <section
      ref="panel"
      class="amami-map-travel"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-busy="busy"
      tabindex="-1"
    >
      <header class="amami-map-travel-hero">
        <img v-if="picture && !imageFailed" :src="picture" alt="" @error="imageFailed = true" />
        <div class="amami-map-travel-destination">
          <span><MapIcon name="pin" />前往目的地</span>
          <h3 :id="titleId">{{ destination.name }}</h3>
        </div>
        <button
          ref="closeButton"
          class="amami-map-travel-close"
          type="button"
          aria-label="取消前往"
          :disabled="busy"
          @click="cancel"
        >
          <MapIcon name="close" />
        </button>
      </header>

      <div class="amami-map-travel-body">
        <h4>这次想见谁？</h4>
        <button
          type="button"
          class="amami-map-travel-random"
          :aria-pressed="selectedName === null"
          :disabled="busy"
          @click="selectedName = null"
        >
          <span class="amami-map-travel-random-icon"><MapIcon name="shuffle" /></span>
          <span><strong>随意逛逛</strong><small>不指定对象，随缘相遇</small></span>
          <span class="amami-map-travel-choice"><MapIcon v-if="selectedName === null" name="check" /></span>
        </button>

        <label v-if="candidates.length > 8" class="amami-map-travel-search">
          <MapIcon name="search" /><input
            v-model="query"
            type="search"
            placeholder="寻找想见的人"
            aria-label="寻找想见的人"
          />
        </label>
        <div v-if="visibleCandidates.length" class="amami-map-travel-people" role="group" aria-label="选择想见的人">
          <button
            v-for="entry in visibleCandidates"
            :key="entry.person.name"
            type="button"
            class="amami-map-travel-person"
            :aria-label="`专程去见${entry.person.name}`"
            :aria-pressed="selectedName === entry.person.name"
            :disabled="busy"
            @click="selectedName = selectedName === entry.person.name ? null : entry.person.name"
          >
            <span class="amami-map-travel-choice"
              ><MapIcon v-if="selectedName === entry.person.name" name="check"
            /></span>
            <CampusPersonAvatar :person="entry.person" />
            <strong>{{ entry.person.name }}</strong>
            <span class="amami-map-travel-affiliation">{{ entry.person.affiliation }}</span>
            <MapIcon v-if="followedNames.includes(entry.person.name)" class="amami-map-travel-heart" name="heart" />
          </button>
        </div>
        <p v-else class="amami-map-travel-empty">
          {{ candidates.length ? '没有找到这个人。' : '此时没有可选人物，仍可前往。' }}
        </p>
      </div>

      <footer class="amami-map-travel-footer">
        <p v-if="error || notice" class="amami-map-travel-notice" role="status">{{ error || notice }}</p>
        <div class="amami-map-travel-summary">
          <MapIcon :name="selectedName ? 'heart' : 'shuffle'" />
          <span>{{ selectedName ? `去见 ${selectedName}` : '随意逛逛' }}</span>
        </div>
        <div class="amami-map-travel-actions">
          <button type="button" class="amami-map-travel-back" :disabled="busy" @click="cancel">再想想</button>
          <button type="button" class="amami-map-travel-confirm" :disabled="busy" @click="confirm">
            {{ busy ? '正在填入…' : '确认前往' }}<MapIcon name="chevron" />
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import CampusPersonAvatar from './CampusPersonAvatar.vue';
import { createCampusTravelDraft, getCampusTravelCandidates } from './campus-travel';
import type { CampusTravelDestination, CampusTravelDraft } from './campus-travel';
import type { CampusSchedulePeriod } from './campus-character-schedule';

const props = defineProps<{
  destination: CampusTravelDestination;
  period: CampusSchedulePeriod;
  picture?: string;
  followedNames: readonly string[];
  busy: boolean;
  error: string;
}>();
const emit = defineEmits<{ cancel: []; confirm: [draft: CampusTravelDraft]; change: [] }>();
const titleId = `campus-travel-${useId()}`;
const panel = ref<HTMLElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const selectedName = ref<string | null>(null);
const query = ref('');
const notice = ref('');
const imageFailed = ref(false);
const candidates = computed(() => getCampusTravelCandidates(props.destination, props.period));
const visibleCandidates = computed(() => {
  const text = query.value.trim().toLowerCase();
  return candidates.value
    .filter(entry => !text || `${entry.person.name}${entry.person.affiliation}`.toLowerCase().includes(text))
    .sort(
      (a, b) =>
        Number(props.followedNames.includes(b.person.name)) - Number(props.followedNames.includes(a.person.name)),
    );
});
let draft: CampusTravelDraft | null = null;
watch(
  [selectedName, () => props.period],
  () => {
    draft = null;
    notice.value = '';
    emit('change');
  },
  { flush: 'sync' },
);
watch(
  candidates,
  list => {
    if (selectedName.value !== null && !list.some(entry => entry.person.name === selectedName.value)) {
      selectedName.value = null;
      notice.value = '对方已换到别处，可以重新选择。';
    }
  },
  { immediate: true },
);
function cancel() {
  if (!props.busy) emit('cancel');
}
function confirm() {
  if (props.busy) return;
  try {
    draft ??= createCampusTravelDraft(props.destination, props.period, selectedName.value);
    emit('confirm', draft);
  } catch (error) {
    notice.value = error instanceof Error ? error.message : '请重新选择想见的人。';
  }
}
function handleKeydown(event: KeyboardEvent) {
  event.stopPropagation();
  if (event.key === 'Escape') {
    event.preventDefault();
    cancel();
  } else if (event.key === 'Tab') {
    const controls = Array.from(
      panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)') ?? [],
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
      panel.value?.focus();
      return;
    }
    if (event.shiftKey && (event.target === first || event.target === panel.value)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
onMounted(() => nextTick(() => closeButton.value?.focus({ preventScroll: true })));
</script>
