<template>
  <section :class="['bp-chat-thread', `is-${layout}`, { 'is-midnight': isMidnightMode }]" aria-label="气泡聊天记录">
    <div
      v-if="sceneBackgroundUrl.length > 0 && !sceneBackdropUnavailable"
      class="bp-chat-scene-backdrop"
      aria-hidden="true"
    >
      <img
        class="bp-chat-scene-backdrop-image"
        :src="sceneBackgroundUrl"
        alt=""
        decoding="async"
        @error="handleSceneBackdropError"
      />
    </div>
    <LogStageBackdrop />

    <header class="bp-chat-thread-header">
      <div class="bp-chat-thread-meta">
        <span v-if="isStreaming" class="bp-chat-thread-sync">
          <svg viewBox="0 0 14 16" aria-hidden="true"><path d="m1 10 5-8h3L4 10Zm5 4 5-8h3l-5 8Z" /></svg>SYNC
        </span>
        <button
          type="button"
          class="bp-chat-midnight-toggle"
          role="switch"
          aria-label="午夜模式"
          :aria-checked="isMidnightMode"
          :title="isMidnightMode ? '关闭午夜模式，恢复日间配色' : '开启午夜模式，切换深色模式'"
          @click="toggleMidnightMode"
        >
          <svg class="bp-chat-midnight-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20.6 14.2A8.8 8.8 0 0 1 9.8 3.4 9 9 0 1 0 20.6 14.2Z" />
            <path d="m17 2 1.3 3.7L22 7l-3.7 1.3L17 12l-1.3-3.7L12 7l3.7-1.3Z" />
          </svg>
          <span>午夜模式</span>
        </button>
        <span class="bp-chat-count" :aria-label="`${rows.length}段正文`" :title="`${rows.length} 段正文`">
          <b>{{ folio(rows.length) }}</b>
        </span>
      </div>
    </header>

    <div ref="scrollViewport" class="bp-chat-thread-viewport" @scroll.passive="handleScroll">
      <ol v-if="rows.length > 0" class="bp-chat-thread-list" aria-live="polite">
        <li
          v-for="(row, rowIndex) in rows"
          :key="row.id"
          :data-segment-id="row.segmentId"
          :class="[
            'bp-chat-row',
            `is-${row.kind}`,
            {
              'is-active': row.segmentId === activeSegmentId,
              'is-player': row.kind === 'dialogue' && row.side === 'right',
              'is-odd-tilt': rowIndex % 2 === 1,
            },
          ]"
        >
          <div v-if="row.kind === 'narration'" class="bp-chat-narration">
            <p><NarrativeRgbText :text="row.text" :rgb-spans="row.rgbSpans" dark /></p>
          </div>

          <article
            v-else
            :class="[
              'bp-chat-dialogue',
              `is-${row.side}`,
              {
                'starts-group': row.startsGroup,
                'ends-group': row.endsGroup,
              },
            ]"
          >
            <div class="bp-chat-avatar-slot" :aria-hidden="row.startsGroup ? undefined : 'true'">
              <button
                v-if="row.startsGroup"
                type="button"
                class="bp-chat-avatar-trigger"
                :title="avatarStyle === 'portrait' ? '当前显示立绘头像，点击切换为Q版头像' : '当前显示Q版头像，点击切换为立绘头像'"
                :aria-label="`${row.speaker}头像，点击切换为${avatarStyle === 'portrait' ? 'Q版' : '立绘'}头像`"
                @click="toggleAvatarStyle"
              >
                <span class="bp-chat-cutin-frame">
                  <LogPortraitFrame layer="back" :mirrored="row.side === 'right'" />
                  <span class="bp-chat-cutin-clip" :class="{ 'is-mirrored': row.side === 'right' }">
                    <img
                      v-if="activeAvatarCandidate(row) !== null"
                      :key="activeAvatarCandidate(row)?.url"
                      :class="['bp-chat-avatar-image', `is-${activeAvatarCandidate(row)?.kind ?? 'avatar'}`]"
                      :src="activeAvatarCandidate(row)?.url"
                      :alt="`${row.speaker}${activeAvatarCandidate(row)?.kind === 'portrait' ? '立绘' : 'Q版'}头像`"
                      decoding="async"
                      @error="handleAvatarError"
                    />
                    <span v-else class="bp-chat-avatar-fallback">{{ speakerInitials(row.speaker) }}</span>
                  </span>
                  <LogPortraitFrame layer="front" :mirrored="row.side === 'right'" />
                </span>
              </button>
            </div>

            <div class="bp-chat-message-stack">
              <div v-if="row.startsGroup" class="bp-chat-speaker-line">
                <strong class="bp-chat-speaker-name">{{ row.speaker }}</strong>
                <span v-if="row.affiliation !== null" class="bp-chat-speaker-affiliation">{{ row.affiliation }}</span>
              </div>

              <div class="bp-chat-bubble-shell">
                <NarrativeBubbleSurface
                  :side="row.side"
                  :has-tail="row.startsGroup"
                  :active="row.segmentId === activeSegmentId"
                />
                <p class="bp-chat-bubble">
                  <NarrativeRgbText :text="row.text" :rgb-spans="row.rgbSpans" :dark="row.side !== 'right'" />
                </p>
              </div>
            </div>
          </article>
        </li>
      </ol>

      <div v-else class="bp-chat-empty-state">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <path d="m20 1 17 19-17 19L3 20Z M20 12l2.2 5.8L28 20l-5.8 2.2L20 28l-2.2-5.8L12 20l5.8-2.2Z" fill="none" stroke="currentColor" stroke-width="1.6" />
        </svg>
        <strong>对话记录待同步</strong>
        <p>当前楼层没有可显示的正文段落。</p>
      </div>
    </div>

    <button v-if="showLatestButton" type="button" class="bp-chat-latest-button" @click="scrollToLatest(true)">
      <svg class="bp-chat-latest-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m1 3 7 4 7-4-7 9Z" fill="#24e2f8" />
        <path d="m3 9 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" />
      </svg>
      <span>跳转最新</span>
    </button>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { resolveNarrativeChatAppendAction } from '../engine/narrative-chat';
import { useNarrativeChatTheme } from './narrative-chat-theme';
import { chooseChatAvatar, useChatAvatarStyle } from './narrative-chat-avatar';
import NarrativeBubbleSurface from './NarrativeBubbleSurface.vue';
import NarrativeRgbText from './NarrativeRgbText.vue';
import LogStageBackdrop from '../vector/LogStageBackdrop.vue';
import LogPortraitFrame from '../vector/LogPortraitFrame.vue';
import type {
  NarrativeChatAvatarCandidate,
  NarrativeChatDialogueRow,
  NarrativeChatRow,
} from '../engine/narrative-chat';

const props = defineProps<{
  rows: NarrativeChatRow[];
  activeSegmentId: string | null;
  isStreaming: boolean;
  sceneBackgroundUrl: string;
  layout: 'desktop' | 'mobile';
}>();

const emit = defineEmits<{
  'scene-error': [];
}>();

const { isMidnightMode, toggleMidnightMode } = useNarrativeChatTheme();
const { avatarStyle, setAvatarStyle } = useChatAvatarStyle();
const scrollViewport = ref<HTMLElement | null>(null);
const failedAvatarUrls = reactive(new Set<string>());
const isNearLatest = ref(true);
const showLatestButton = ref(false);
const sceneBackdropUnavailable = ref(false);

onMounted(async () => {
  await nextTick();
  scrollToActiveSegment();
  updateNearLatestState();
});

watch(
  () => props.activeSegmentId,
  async () => {
    await nextTick();
    scrollToActiveSegment();
  },
);

watch(
  () => props.sceneBackgroundUrl,
  () => {
    sceneBackdropUnavailable.value = false;
  },
);

watch(
  () => props.rows.length,
  async (rowCount, previousRowCount) => {
    const appendAction = resolveNarrativeChatAppendAction({
      isStreaming: props.isStreaming,
      isNearLatest: isNearLatest.value,
      previousRowCount,
      rowCount,
    });
    await nextTick();

    if (appendAction === 'none') {
      updateNearLatestState();
      return;
    }

    if (appendAction === 'follow') {
      scrollToLatest(false);
    } else {
      showLatestButton.value = true;
    }
  },
);

function activeAvatarCandidate(row: NarrativeChatDialogueRow): NarrativeChatAvatarCandidate | null {
  return chooseChatAvatar(row.avatarCandidates, avatarStyle.value, failedAvatarUrls);
}

function toggleAvatarStyle() {
  setAvatarStyle(avatarStyle.value === 'portrait' ? 'avatar' : 'portrait');
}

function handleAvatarError(event: Event) {
  const image = event.currentTarget as HTMLImageElement;
  failedAvatarUrls.add(image.currentSrc || image.src);
}

function handleSceneBackdropError() {
  sceneBackdropUnavailable.value = true;
  emit('scene-error');
}

function speakerInitials(speaker: string) {
  const normalized = speaker.replace(/[{}【】[\]（）()\s]/g, '');
  return Array.from(normalized).slice(0, 2).join('') || '?';
}

function folio(value: number) {
  return String(value).padStart(2, '0');
}

function handleScroll() {
  updateNearLatestState();
}

function updateNearLatestState() {
  const viewport = scrollViewport.value;
  if (viewport === null) {
    return;
  }

  isNearLatest.value = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight <= 84;
  if (isNearLatest.value) {
    showLatestButton.value = false;
  }
}

function scrollToActiveSegment() {
  const viewport = scrollViewport.value;
  const segmentId = props.activeSegmentId;
  if (viewport === null || segmentId === null) {
    return;
  }

  const target = Array.from(viewport.querySelectorAll<HTMLElement>('[data-segment-id]')).find(
    element => element.dataset.segmentId === segmentId,
  );
  if (target === undefined) {
    return;
  }

  const viewportRect = viewport.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const centeredTop =
    viewport.scrollTop + targetRect.top - viewportRect.top - (viewport.clientHeight - targetRect.height) / 2;
  viewport.scrollTo({ top: Math.max(0, centeredTop), behavior: 'auto' });
}

function scrollToLatest(smooth: boolean) {
  const viewport = scrollViewport.value;
  if (viewport === null) {
    return;
  }

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  viewport.scrollTo({
    top: viewport.scrollHeight,
    behavior: smooth && !reduceMotion ? 'smooth' : 'auto',
  });
  showLatestButton.value = false;
  isNearLatest.value = true;
}
</script>

<style scoped>
.bp-chat-thread {
  --p5-paper: linear-gradient(142deg, #eef4fc 0%, #f5f9ff 46%, #e3edf9 100%);
  --p5-plane-a: rgba(9, 22, 74, 0.045);
  --p5-plane-b: rgba(9, 22, 74, 0.065);
  --p5-sweep-0: rgba(22, 62, 232, 0.075);
  --p5-sweep-1: rgba(36, 226, 248, 0.045);
  --p5-sweep-2: rgba(9, 22, 74, 0);
  --p5-spine-top: rgba(9, 22, 74, 0.04);
  --p5-spine-mid: rgba(9, 22, 74, 0.13);
  --p5-spine-line: rgba(36, 226, 248, 0.55);
  --p5-hairline-a: rgba(36, 226, 248, 0.52);
  --p5-hairline-b: rgba(244, 50, 82, 0.42);
  --p5-dot-color: rgba(9, 22, 74, 0.085);
  --p5-ink: #08144a;
  --p5-scene-opacity: 0.085;
  --p5-gutter: clamp(16px, 3.4%, 46px);
  --p5-portrait-w: clamp(176px, 20cqi, 248px);
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: grid;
  grid-template: auto minmax(0, 1fr) / minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--p5-ink);
  background: var(--p5-paper);
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}

.bp-chat-scene-backdrop {
  position: absolute;
  inset: -12px;
  z-index: 0;
  pointer-events: none;
  opacity: var(--p5-scene-opacity, 0.09);
  filter: saturate(0.6) blur(10px);
}

.bp-chat-scene-backdrop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bp-chat-thread-header {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px var(--p5-gutter) 4px;
  min-height: 44px;
  box-sizing: border-box;
}

.bp-chat-thread-meta {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px 10px;
}

.bp-chat-thread-sync {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  background: #08144a;
  color: #24e2f8;
  border: 1.5px solid #24e2f8;
  transform: skewX(-10deg);
  font: 900 italic 11px/1.2 'Bahnschrift', monospace;
  letter-spacing: 0.1em;
}

.bp-chat-thread-sync svg {
  width: 13px;
  height: 13px;
  fill: currentColor;
  animation: bp-p5-sync 1.2s ease-in-out infinite alternate;
}

@keyframes bp-p5-sync {
  to {
    opacity: 0.45;
  }
}

.bp-chat-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 38px;
  height: 30px;
  padding: 0 10px;
  background: #08144a;
  color: #24e2f8;
  border: 2px solid #ffffff;
  box-shadow: 3px 3px 0 #163ee8;
  transform: rotate(1.5deg) skewX(-8deg);
  font: 900 italic 13.5px/1 'Bahnschrift', 'Impact', sans-serif;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.bp-chat-thread-viewport {
  position: relative;
  z-index: 2;
  min-height: 0;
  overflow: hidden auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(12, 34, 128, 0.42) transparent;
  padding: 24px var(--p5-gutter) 44px;
}

.bp-chat-thread-list {
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 1080px;
  list-style: none;
  margin: 0 auto;
  padding: 0;
}

.bp-chat-latest-button {
  position: absolute;
  z-index: 6;
  inset: auto var(--p5-gutter) 14px auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  min-height: 38px;
  border: 2.5px solid #ffffff;
  border-radius: 0;
  background: #08144a;
  color: #ffffff;
  box-shadow: 5px 5px 0 #f43252;
  transform: rotate(-1.5deg) skewX(-8deg);
  font-family: var(--bp-title-font, sans-serif);
  font-size: 13px;
  font-weight: 950;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition:
    transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background 150ms ease,
    box-shadow 150ms ease;
}

.bp-chat-latest-icon {
  width: 15px;
  height: 15px;
  flex: none;
}

.bp-chat-latest-button:is(:hover, :focus-visible) {
  background: #163ee8;
  transform: rotate(-1.5deg) skewX(-8deg) translate(-2px, -2px);
  box-shadow: 7px 7px 0 #24e2f8;
}

.bp-chat-empty-state {
  display: grid;
  place-content: center;
  justify-items: center;
  min-height: 100%;
  gap: 8px;
  color: #3d5278;
  text-align: center;
}

.bp-chat-empty-state svg {
  width: 44px;
  height: 44px;
  color: #163ee8;
}

.bp-chat-empty-state strong {
  color: var(--p5-ink);
  font-size: 18px;
  font-weight: 900;
}

.bp-chat-empty-state p {
  margin: 0;
  font-size: 13px;
}

.bp-chat-thread.is-mobile {
  --p5-gutter: 12px;
  --p5-portrait-w: 118px;
}

.bp-chat-thread.is-mobile .bp-chat-thread-header {
  min-height: 42px;
  padding: 6px 12px 2px;
}

.bp-chat-thread.is-mobile .bp-chat-thread-viewport {
  padding: 18px 12px 30px;
}

@container bp-host (max-width: 560px) {
  .bp-chat-thread {
    --p5-gutter: 12px;
    --p5-portrait-w: clamp(104px, 27cqi, 132px);
  }
  .bp-chat-thread .bp-chat-thread-header {
    min-height: 42px;
    padding: 6px 12px 2px;
  }
  .bp-chat-thread .bp-chat-thread-meta {
    gap: 6px;
  }
  .bp-chat-thread .bp-chat-thread-viewport {
    padding: 18px 12px 30px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bp-chat-thread-sync svg,
  .bp-chat-latest-button {
    animation: none;
    transition: none;
  }
}
</style>

<style scoped src="./narrative-chat-dialogue.css"></style>
<style scoped src="./narrative-chat-midnight.css"></style>
