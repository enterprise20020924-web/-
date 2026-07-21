<template>
  <section :class="['bp-chat-thread', `is-${layout}`]" aria-label="气泡聊天记录">
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
      <span class="bp-chat-scene-backdrop-shade"></span>
    </div>

    <header class="bp-chat-thread-header">
      <span class="bp-chat-thread-header-rail" aria-hidden="true"></span>
      <div class="bp-chat-thread-brand" aria-hidden="true">
        <span class="bp-chat-thread-brand-mark">
          <i></i>
        </span>
        <span>
          <small>AMAMI TALK</small>
          <strong>会话记录</strong>
        </span>
      </div>

      <div class="bp-chat-thread-meta">
        <span v-if="isStreaming" class="bp-chat-thread-sync"><i></i>SYNC</span>
        <b :aria-label="`${rows.length}条记录`">{{ rows.length }}</b>
      </div>
    </header>

    <div ref="scrollViewport" class="bp-chat-thread-viewport" @scroll.passive="handleScroll">
      <ol v-if="rows.length > 0" class="bp-chat-thread-list" aria-live="polite">
        <li
          v-for="row in rows"
          :key="row.id"
          :data-segment-id="row.segmentId"
          :class="['bp-chat-row', `is-${row.kind}`]"
        >
          <div v-if="row.kind === 'narration'" class="bp-chat-narration">
            <span aria-hidden="true"></span>
            <p>{{ row.text }}</p>
            <span aria-hidden="true"></span>
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
              <div v-if="row.startsGroup" class="bp-chat-avatar-frame">
                <img
                  v-if="activeAvatarCandidate(row) !== null"
                  :key="activeAvatarCandidate(row)?.url"
                  :class="['bp-chat-avatar-image', `is-${activeAvatarCandidate(row)?.kind ?? 'avatar'}`]"
                  :src="activeAvatarCandidate(row)?.url"
                  :alt="`${row.speaker}头像`"
                  decoding="async"
                  @error="advanceAvatarFallback(row)"
                />
                <span v-else class="bp-chat-avatar-fallback">{{ speakerInitials(row.speaker) }}</span>
              </div>
            </div>

            <div class="bp-chat-message-stack">
              <div v-if="row.startsGroup" class="bp-chat-speaker-line">
                <strong>{{ row.speaker }}</strong>
                <span v-if="row.affiliation !== null">{{ row.affiliation }}</span>
              </div>
              <p class="bp-chat-bubble">{{ row.text }}</p>
            </div>
          </article>
        </li>
      </ol>

      <div v-else class="bp-chat-empty-state">
        <span class="bp-chat-empty-mark" aria-hidden="true"><i></i></span>
        <strong>聊天记录待同步</strong>
        <p>当前楼层没有可显示的正文段落。</p>
      </div>

      <button v-if="showLatestButton" type="button" class="bp-chat-latest-button" @click="scrollToLatest(true)">
        <span aria-hidden="true">↓</span>
        查看最新
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { resolveNarrativeChatAppendAction } from '../engine/narrative-chat';
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

const scrollViewport = ref<HTMLElement | null>(null);
const avatarCandidateIndexes = reactive<Record<string, number>>({});
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
  return row.avatarCandidates[avatarCandidateIndexes[row.id] ?? 0] ?? null;
}

function advanceAvatarFallback(row: NarrativeChatDialogueRow) {
  avatarCandidateIndexes[row.id] = (avatarCandidateIndexes[row.id] ?? 0) + 1;
}

function handleSceneBackdropError() {
  sceneBackdropUnavailable.value = true;
  emit('scene-error');
}

function speakerInitials(speaker: string) {
  const normalized = speaker.replace(/[{}【】[\]（）()\s]/g, '');
  return Array.from(normalized).slice(0, 2).join('') || '?';
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
  --bp-chat-paper: rgba(255, 247, 230, 0.72);
  --bp-chat-paper-strong: rgba(255, 253, 246, 0.82);
  --bp-chat-paper-line: rgba(165, 127, 71, 0.13);
  --bp-chat-ink: #133650;
  --bp-chat-muted: #668197;
  --bp-chat-npc: #52728a;
  --bp-chat-npc-deep: #3f5d75;
  --bp-chat-user: #19a7df;
  --bp-chat-user-deep: #087fbd;
  --bp-chat-cyan: #49d1f7;

  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  inline-size: 100%;
  block-size: 100%;
  min-block-size: 0;
  overflow: hidden;
  color: var(--bp-chat-ink);
  background:
    radial-gradient(circle at 12% 11%, rgba(255, 255, 255, 0.72) 0 4%, transparent 14%),
    linear-gradient(135deg, transparent 0 48%, rgba(59, 184, 233, 0.05) 49% 51%, transparent 52%) 0 0 / 38px 38px,
    linear-gradient(180deg, var(--bp-chat-paper-strong), var(--bp-chat-paper));
  border: 1.5px solid rgba(83, 198, 241, 0.62);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.72),
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    0 20px 46px rgba(20, 78, 112, 0.2),
    0 0 24px rgba(73, 200, 243, 0.13);
  clip-path: polygon(0 16px, 16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%);
}

.bp-chat-scene-backdrop {
  position: absolute;
  z-index: 0;
  inset: -18px;
  overflow: hidden;
  pointer-events: none;
}

.bp-chat-scene-backdrop-image {
  display: block;
  inline-size: 100%;
  block-size: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.62;
  filter: blur(10px) saturate(0.82) contrast(0.94) brightness(1.06);
  transform: scale(1.08);
}

.bp-chat-scene-backdrop-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 78% 18%, rgba(98, 214, 255, 0.2), transparent 38%),
    linear-gradient(180deg, rgba(236, 249, 255, 0.68), rgba(255, 249, 235, 0.74) 68%, rgba(246, 252, 255, 0.82));
}

.bp-chat-thread::before,
.bp-chat-thread::after {
  content: '';
  position: absolute;
  z-index: 0;
  pointer-events: none;
}

.bp-chat-thread::before {
  z-index: 1;
  inset: 0;
  opacity: 0.44;
  background:
    radial-gradient(circle, rgba(32, 151, 205, 0.2) 0 1.2px, transparent 1.7px) 22px 24px / 34px 34px,
    linear-gradient(90deg, transparent 0 49%, rgba(61, 172, 219, 0.08) 50%, transparent 51%) 0 0 / 74px 74px,
    linear-gradient(135deg, transparent 0 74%, rgba(50, 184, 230, 0.055) 74% 75%, transparent 75%);
  mask-image: linear-gradient(180deg, black, transparent 68%);
}

.bp-chat-thread::after {
  z-index: 1;
  inset-block-start: 0;
  inset-inline-end: 0;
  inline-size: 112px;
  block-size: 112px;
  background: linear-gradient(135deg, transparent 49%, rgba(49, 186, 234, 0.17) 50% 51%, transparent 52%);
}

.bp-chat-thread-header {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-block-size: 70px;
  padding: 12px clamp(18px, 2.2cqi, 32px);
  overflow: hidden;
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.92), rgba(233, 248, 255, 0.78)),
    repeating-linear-gradient(135deg, transparent 0 10px, rgba(24, 151, 208, 0.04) 10px 11px);
  border-block-end: 1px solid rgba(37, 156, 211, 0.35);
  box-shadow:
    inset 0 -1px 0 rgba(255, 255, 255, 0.68),
    0 10px 26px rgba(28, 97, 135, 0.11);
  backdrop-filter: blur(18px) saturate(145%);
}

.bp-chat-thread-header-rail {
  position: absolute;
  inset-inline: 0;
  inset-block-start: 0;
  block-size: 4px;
  background: linear-gradient(90deg, #21b7e8 0 22%, rgba(33, 183, 232, 0.12) 22% 66%, #ffd46a 66% 71%, transparent 71%);
  clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 100%, 7px 100%);
}

.bp-chat-thread-brand,
.bp-chat-thread-meta {
  display: flex;
  align-items: center;
}

.bp-chat-thread-brand {
  min-inline-size: 0;
  gap: 12px;
}

.bp-chat-thread.is-desktop .bp-chat-thread-brand {
  margin-inline-start: clamp(44px, 4.8cqi, 70px);
}

.bp-chat-thread-brand-mark {
  position: relative;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  inline-size: 42px;
  block-size: 42px;
  color: #fff;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.34), transparent 42%), linear-gradient(145deg, #55d8f8, #1189c5);
  border: 1px solid rgba(255, 255, 255, 0.82);
  box-shadow:
    0 0 0 2px rgba(51, 190, 235, 0.16),
    0 9px 20px rgba(24, 142, 199, 0.28);
  clip-path: polygon(0 10px, 10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);
}

.bp-chat-thread-brand-mark::before,
.bp-chat-thread-brand-mark::after,
.bp-chat-thread-brand-mark i::before,
.bp-chat-thread-brand-mark i::after {
  content: '';
  position: absolute;
  background: currentColor;
  border-radius: 999px;
}

.bp-chat-thread-brand-mark::before {
  inline-size: 22px;
  block-size: 4px;
}

.bp-chat-thread-brand-mark::after {
  inline-size: 4px;
  block-size: 22px;
}

.bp-chat-thread-brand-mark i::before,
.bp-chat-thread-brand-mark i::after {
  inline-size: 4px;
  block-size: 4px;
}

.bp-chat-thread-brand-mark i::before {
  transform: translate(-13px, -13px);
}

.bp-chat-thread-brand-mark i::after {
  transform: translate(13px, 13px);
}

.bp-chat-thread-brand > span:last-child {
  display: grid;
  min-inline-size: 0;
}

.bp-chat-thread-brand small {
  color: #169ed7;
  font-family: var(--bp-title-font, 'Bahnschrift SemiCondensed', sans-serif);
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
}

.bp-chat-thread-brand strong {
  overflow: hidden;
  color: var(--bp-chat-ink);
  font-size: clamp(1rem, 1.35cqi, 1.3rem);
  font-weight: 950;
  letter-spacing: 0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bp-chat-thread-meta {
  flex: 0 0 auto;
  gap: 10px;
  color: var(--bp-chat-muted);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.06em;
}

.bp-chat-thread-meta > span:not(.bp-chat-thread-sync) {
  max-inline-size: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bp-chat-thread-meta b {
  display: grid;
  place-items: center;
  min-inline-size: 34px;
  block-size: 28px;
  padding-inline: 8px;
  color: #fff;
  background: linear-gradient(145deg, #35c5ed, #138fc9);
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 7px 14px 7px 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 7px 16px rgba(28, 159, 216, 0.24);
}

.bp-chat-thread-sync {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #158fbd;
}

.bp-chat-thread-sync i {
  inline-size: 7px;
  block-size: 7px;
  background: #3ac983;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(58, 201, 131, 0.13);
  animation: bp-chat-sync-pulse 1.6s ease-in-out infinite;
}

.bp-chat-thread-viewport {
  position: relative;
  z-index: 2;
  min-block-size: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scroll-behavior: smooth;
  padding: clamp(20px, 2.1cqi, 34px) clamp(16px, 3.2cqi, 48px) clamp(30px, 3cqi, 46px);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 248, 233, 0.3));
}

.bp-chat-thread-viewport::-webkit-scrollbar {
  inline-size: 8px;
}

.bp-chat-thread-viewport::-webkit-scrollbar-thumb {
  background: rgba(55, 155, 199, 0.32);
  border: 2px solid transparent;
  border-radius: 999px;
  background-clip: padding-box;
}

.bp-chat-thread-list {
  display: grid;
  gap: 8px;
  inline-size: min(100%, 980px);
  margin: 0 auto;
  padding: 0;
  list-style: none;
}

.bp-chat-row {
  min-inline-size: 0;
  animation: bp-chat-row-in 220ms cubic-bezier(0.2, 0.72, 0.24, 1) both;
}

.bp-chat-row.is-narration {
  margin-block: 14px 18px;
}

.bp-chat-narration {
  display: grid;
  grid-template-columns: minmax(26px, 1fr) minmax(0, 680px) minmax(26px, 1fr);
  align-items: center;
  gap: 15px;
  color: #3e617a;
  text-align: center;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.92);
}

.bp-chat-narration span {
  block-size: 1px;
  background: linear-gradient(90deg, transparent, rgba(30, 155, 207, 0.54));
}

.bp-chat-narration span:last-child {
  background: linear-gradient(90deg, rgba(30, 155, 207, 0.54), transparent);
}

.bp-chat-narration p {
  margin: 0;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.42);
  border-block: 1px solid rgba(255, 255, 255, 0.55);
  font-size: clamp(0.94rem, 1.05cqi, 1.08rem);
  font-weight: 650;
  line-height: 1.8;
  text-wrap: pretty;
}

.bp-chat-dialogue {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  inline-size: 100%;
  min-inline-size: 0;
  margin-block: 2px;
}

.bp-chat-dialogue.starts-group {
  margin-block-start: 15px;
}

.bp-chat-dialogue.ends-group {
  margin-block-end: 12px;
}

.bp-chat-dialogue.is-right {
  flex-direction: row-reverse;
}

.bp-chat-avatar-slot {
  flex: 0 0 84px;
  inline-size: 84px;
  min-block-size: 1px;
}

.bp-chat-avatar-frame {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 84px;
  block-size: 84px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 36%, rgba(255, 255, 255, 0.94), rgba(219, 244, 255, 0.86) 64%, #86d7f3), #eaf8ff;
  border: 3px solid rgba(255, 255, 255, 0.98);
  border-radius: 50%;
  box-shadow:
    0 0 0 2px rgba(43, 174, 225, 0.58),
    0 0 0 6px rgba(255, 255, 255, 0.52),
    0 11px 26px rgba(20, 91, 132, 0.24),
    0 0 22px rgba(76, 201, 241, 0.16);
}

.bp-chat-avatar-frame::before {
  content: '';
  position: absolute;
  z-index: 2;
  inset: 0;
  background: conic-gradient(
    from 20deg,
    transparent 0 16%,
    rgba(68, 203, 244, 0.5) 16% 18%,
    transparent 18% 66%,
    rgba(68, 203, 244, 0.38) 66% 68%,
    transparent 68%
  );
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
  mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
  border-radius: inherit;
  pointer-events: none;
}

.bp-chat-avatar-frame::after {
  content: '';
  position: absolute;
  inset: 3px;
  z-index: 3;
  border: 1px solid rgba(58, 177, 223, 0.28);
  border-radius: inherit;
  pointer-events: none;
}

.bp-chat-avatar-image {
  position: relative;
  z-index: 1;
  display: block;
  inline-size: 100%;
  block-size: 100%;
  background: #eefaff;
}

.bp-chat-avatar-image.is-avatar {
  object-fit: cover;
  object-position: center 12%;
  transform: scale(1.7);
  transform-origin: center 12%;
}

.bp-chat-avatar-image.is-portrait {
  object-fit: cover;
  object-position: center 8%;
  transform: scale(2.55);
  transform-origin: center 8%;
}

.bp-chat-avatar-fallback {
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
  color: #fff;
  background: linear-gradient(145deg, #77d9f4, #268fc4);
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: -0.04em;
}

.bp-chat-message-stack {
  position: relative;
  isolation: isolate;
  display: grid;
  justify-items: start;
  min-inline-size: 0;
  max-inline-size: min(calc(100% - 102px), 760px);
}

.bp-chat-dialogue.is-right .bp-chat-message-stack {
  justify-items: end;
  margin-inline-start: auto;
}

.bp-chat-speaker-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 4px 6px;
}

.bp-chat-speaker-line::before {
  content: '';
  flex: 0 0 auto;
  inline-size: 7px;
  block-size: 7px;
  background: linear-gradient(145deg, #69ddf8, #178fc9);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.56);
  transform: rotate(45deg);
}

.bp-chat-dialogue.is-right .bp-chat-speaker-line {
  justify-content: flex-end;
  text-align: end;
}

.bp-chat-dialogue.is-right .bp-chat-speaker-line::before {
  order: 3;
}

.bp-chat-speaker-line strong {
  display: inline-flex;
  align-items: center;
  min-block-size: 26px;
  max-inline-size: 100%;
  padding: 3px 14px 4px 10px;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(110deg, #1b79ae, #20aee0);
  clip-path: polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%, 5px 50%);
  text-shadow: 0 1px 2px rgba(8, 62, 94, 0.38);
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 6px 14px rgba(20, 130, 184, 0.18);
  font-size: 0.94rem;
  font-weight: 900;
}

.bp-chat-dialogue.is-right .bp-chat-speaker-line strong {
  padding-inline: 14px 10px;
  clip-path: polygon(9px 0, 100% 0, calc(100% - 5px) 50%, 100% 100%, 9px 100%, 0 50%);
}

.bp-chat-speaker-line span {
  padding: 2px 7px;
  color: #148bc4;
  background: rgba(242, 251, 255, 0.84);
  border: 1px solid rgba(43, 172, 222, 0.3);
  border-radius: 999px;
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.bp-chat-bubble {
  position: relative;
  min-inline-size: 42px;
  margin: 0;
  padding: 11px 16px 12px;
  color: #fff;
  font-size: clamp(0.98rem, 1.08cqi, 1.14rem);
  font-weight: 650;
  line-height: 1.72;
  overflow-wrap: anywhere;
  text-align: start;
  text-wrap: pretty;
  white-space: pre-wrap;
  text-shadow: 0 1px 1px rgba(11, 50, 75, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.38);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(10, 68, 101, 0.12),
    0 9px 20px rgba(32, 72, 98, 0.2),
    0 0 0 1px rgba(43, 172, 222, 0.05);
}

.bp-chat-dialogue.is-left .bp-chat-bubble {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.13), transparent 42%),
    repeating-linear-gradient(135deg, transparent 0 15px, rgba(255, 255, 255, 0.018) 15px 16px),
    linear-gradient(145deg, var(--bp-chat-npc), var(--bp-chat-npc-deep));
  border-radius: 6px 17px 17px 17px;
}

.bp-chat-dialogue.is-right .bp-chat-bubble {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.16), transparent 44%),
    repeating-linear-gradient(135deg, transparent 0 14px, rgba(255, 255, 255, 0.025) 14px 15px),
    linear-gradient(145deg, var(--bp-chat-user), var(--bp-chat-user-deep));
  border-radius: 17px 6px 17px 17px;
}

.bp-chat-bubble::after {
  content: '';
  position: absolute;
  inset: 3px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: inherit;
  pointer-events: none;
}

.bp-chat-dialogue.starts-group .bp-chat-bubble::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset-block-start: 0;
  inline-size: 13px;
  block-size: 15px;
  background: inherit;
}

.bp-chat-dialogue.is-left.starts-group .bp-chat-bubble::before {
  inset-inline-start: -7px;
  clip-path: polygon(100% 0, 100% 100%, 0 0);
}

.bp-chat-dialogue.is-right.starts-group .bp-chat-bubble::before {
  inset-inline-end: -7px;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.bp-chat-latest-button {
  position: sticky;
  z-index: 5;
  inset-block-end: 8px;
  display: flex;
  align-items: center;
  gap: 7px;
  min-block-size: 42px;
  margin: 12px auto 0;
  padding: 0 17px;
  color: #fff;
  background: linear-gradient(145deg, #27ace1, #087fbd);
  border: 1px solid rgba(255, 255, 255, 0.75);
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(13, 115, 170, 0.25);
  cursor: pointer;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 900;
  transition:
    filter 180ms ease,
    transform 180ms ease;
}

.bp-chat-latest-button:hover {
  filter: brightness(1.05);
  transform: translateY(-1px);
}

.bp-chat-latest-button:focus-visible {
  outline: 3px solid rgba(73, 201, 244, 0.36);
  outline-offset: 3px;
}

.bp-chat-empty-state {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  min-block-size: 100%;
  color: #64798b;
  text-align: center;
}

.bp-chat-empty-state strong {
  color: #23455f;
  font-size: 1.05rem;
}

.bp-chat-empty-state p {
  margin: 0;
  font-size: 0.86rem;
}

.bp-chat-empty-mark {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 54px;
  block-size: 42px;
  margin-block-end: 5px;
  background: #fff;
  border: 2px solid rgba(48, 167, 215, 0.42);
  border-radius: 12px;
  box-shadow: 0 9px 20px rgba(33, 101, 139, 0.1);
}

.bp-chat-empty-mark::after {
  content: '';
  position: absolute;
  inset-block-end: -8px;
  inset-inline-start: 10px;
  inline-size: 12px;
  block-size: 10px;
  background: #fff;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.bp-chat-empty-mark i,
.bp-chat-empty-mark i::before,
.bp-chat-empty-mark i::after {
  display: block;
  inline-size: 5px;
  block-size: 5px;
  background: #38b9e7;
  border-radius: 50%;
}

.bp-chat-empty-mark i::before,
.bp-chat-empty-mark i::after {
  content: '';
  position: absolute;
}

.bp-chat-empty-mark i::before {
  transform: translateX(-11px);
}

.bp-chat-empty-mark i::after {
  transform: translateX(11px);
}

.bp-chat-thread.is-mobile .bp-chat-thread-header {
  min-block-size: 58px;
  padding: 8px 12px;
  backdrop-filter: blur(14px) saturate(135%);
}

.bp-chat-thread.is-mobile .bp-chat-thread-brand {
  gap: 9px;
}

.bp-chat-thread.is-mobile .bp-chat-thread-brand-mark {
  inline-size: 36px;
  block-size: 36px;
}

.bp-chat-thread.is-mobile .bp-chat-thread-brand strong {
  max-inline-size: 128px;
  font-size: 0.92rem;
}

.bp-chat-thread.is-mobile .bp-chat-thread-brand small {
  font-size: 0.58rem;
}

.bp-chat-thread.is-mobile .bp-chat-thread-meta {
  gap: 7px;
  font-size: 0.66rem;
}

.bp-chat-thread.is-mobile .bp-chat-thread-meta > span:not(.bp-chat-thread-sync) {
  display: none;
}

.bp-chat-thread.is-mobile .bp-chat-thread-meta b {
  min-inline-size: 29px;
  block-size: 25px;
  padding-inline: 6px;
}

.bp-chat-thread.is-mobile .bp-chat-thread-viewport {
  padding: 12px 10px 24px;
  scrollbar-gutter: auto;
}

.bp-chat-thread.is-mobile .bp-chat-scene-backdrop-image {
  opacity: 0.58;
  filter: blur(8px) saturate(0.84) contrast(0.94) brightness(1.05);
}

.bp-chat-thread.is-mobile .bp-chat-thread-list {
  gap: 5px;
}

.bp-chat-thread.is-mobile .bp-chat-row.is-narration {
  margin-block: 10px 13px;
}

.bp-chat-thread.is-mobile .bp-chat-narration {
  grid-template-columns: minmax(16px, 1fr) minmax(0, 82%) minmax(16px, 1fr);
  gap: 9px;
}

.bp-chat-thread.is-mobile .bp-chat-narration p {
  padding: 5px 8px;
  font-size: 0.84rem;
  line-height: 1.7;
}

.bp-chat-thread.is-mobile .bp-chat-dialogue {
  gap: 9px;
}

.bp-chat-thread.is-mobile .bp-chat-dialogue.starts-group {
  margin-block-start: 10px;
}

.bp-chat-thread.is-mobile .bp-chat-dialogue.ends-group {
  margin-block-end: 8px;
}

.bp-chat-thread.is-mobile .bp-chat-avatar-slot,
.bp-chat-thread.is-mobile .bp-chat-avatar-frame {
  flex-basis: 64px;
  inline-size: 64px;
}

.bp-chat-thread.is-mobile .bp-chat-avatar-frame {
  block-size: 64px;
  border-width: 2px;
  box-shadow:
    0 0 0 2px rgba(43, 174, 225, 0.52),
    0 0 0 4px rgba(255, 255, 255, 0.5),
    0 9px 20px rgba(20, 91, 132, 0.22);
}

.bp-chat-thread.is-mobile .bp-chat-avatar-frame::before {
  display: none;
}

.bp-chat-thread.is-mobile .bp-chat-avatar-fallback {
  font-size: 0.78rem;
}

.bp-chat-thread.is-mobile .bp-chat-message-stack {
  max-inline-size: calc(100% - 73px);
}

.bp-chat-thread.is-mobile .bp-chat-speaker-line {
  gap: 5px;
  margin-block-end: 4px;
}

.bp-chat-thread.is-mobile .bp-chat-speaker-line strong {
  min-block-size: 23px;
  padding: 2px 11px 3px 8px;
  font-size: 0.8rem;
}

.bp-chat-thread.is-mobile .bp-chat-dialogue.is-right .bp-chat-speaker-line strong {
  padding-inline: 11px 8px;
}

.bp-chat-thread.is-mobile .bp-chat-speaker-line span {
  font-size: 0.58rem;
}

.bp-chat-thread.is-mobile .bp-chat-bubble {
  padding: 9px 12px 10px;
  font-size: 0.86rem;
  line-height: 1.62;
}

.bp-chat-thread.is-mobile .bp-chat-latest-button {
  min-block-size: 44px;
}

@keyframes bp-chat-row-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bp-chat-sync-pulse {
  0%,
  100% {
    opacity: 0.68;
    transform: scale(0.88);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 350px) {
  .bp-chat-thread.is-mobile .bp-chat-thread-brand strong {
    max-inline-size: 102px;
  }

  .bp-chat-thread.is-mobile .bp-chat-thread-sync {
    font-size: 0;
  }

  .bp-chat-thread.is-mobile .bp-chat-thread-sync i {
    margin-inline: 3px;
  }

  .bp-chat-thread.is-mobile .bp-chat-message-stack {
    max-inline-size: calc(100% - 73px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bp-chat-row,
  .bp-chat-thread-sync i,
  .bp-chat-latest-button {
    animation: none !important;
    scroll-behavior: auto !important;
    transition: none !important;
  }

  .bp-chat-thread-viewport {
    scroll-behavior: auto;
  }

  .bp-chat-scene-backdrop-image {
    transform: scale(1.08);
  }
}
</style>
