<template>
  <div
    ref="root"
    class="bp-reading-settings"
    :class="{ 'is-mobile': mobile, 'is-open': open }"
    @keydown.stop="handleKeydown"
    @touchstart.stop
    @touchend.stop
  >
    <button
      ref="trigger"
      type="button"
      class="bp-reading-settings-trigger"
      aria-label="字号与立绘设置"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="panelId"
      title="调整字号与立绘大小"
      @click="toggle"
    >
      <StageControlPlate v-if="!mobile" :active="open" />
      <span class="bp-reading-settings-trigger-inner">
        <svg v-if="!mobile" class="bp-reading-settings-glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4.5 18 9.2 6h1.6L15.5 18M6.5 14h7" />
          <path d="M16.5 12.2c.6-.8 1.5-1.2 2.5-1.2 1.5 0 2.5.9 2.5 2.4V18M21.5 14.8c-.5-.3-1.2-.5-2-.5-1.6 0-2.8.8-2.8 2s1 1.9 2.4 1.9c1.1 0 1.9-.5 2.4-1.3" />
        </svg>
        <span v-else class="bp-reading-settings-mark" aria-hidden="true">A<span>a</span></span>
        <span class="bp-reading-settings-label">字号</span>
      </span>
    </button>
    <Transition name="bp-reading-popover">
      <section v-if="open" :id="panelId" class="bp-reading-settings-panel" role="dialog" aria-label="字号与立绘设置">
        <header>
          <strong>正文字号</strong>
          <button type="button" class="bp-reading-close" aria-label="关闭显示设置" @click="close(true)">
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" /></svg>
          </button>
        </header>
        <div class="bp-reading-size-stepper">
          <button
            type="button"
            aria-label="缩小字号"
            :disabled="textSizePercent <= TEXT_SIZE_MIN"
            @click="setTextSize(textSizePercent - TEXT_SIZE_STEP)"
          >
            A−
          </button>
          <output :for="sliderId" aria-live="polite">{{ textSizePercent }}<span>%</span></output>
          <button
            type="button"
            aria-label="放大字号"
            :disabled="textSizePercent >= TEXT_SIZE_MAX"
            @click="setTextSize(textSizePercent + TEXT_SIZE_STEP)"
          >
            A+
          </button>
        </div>
        <input
          :id="sliderId"
          ref="slider"
          class="bp-reading-size-slider"
          type="range"
          aria-label="正文字号比例"
          :aria-valuetext="`${textSizePercent}%`"
          :min="TEXT_SIZE_MIN"
          :max="TEXT_SIZE_MAX"
          :step="TEXT_SIZE_STEP"
          :value="textSizePercent"
          :style="{
            '--reading-progress': `${((textSizePercent - TEXT_SIZE_MIN) / (TEXT_SIZE_MAX - TEXT_SIZE_MIN)) * 100}%`,
          }"
          @input="setTextSize(($event.target as HTMLInputElement).value)"
        />
        <div class="bp-reading-size-presets" role="group" aria-label="字号档位">
          <button
            v-for="preset in presets"
            :key="preset.value"
            type="button"
            :aria-label="preset.value === 100 ? '恢复默认字号' : `${preset.label}字号，${preset.value}%`"
            :aria-pressed="textSizePercent === preset.value"
            @click="setTextSize(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
        <div class="bp-reading-portrait-section">
          <div class="bp-reading-portrait-heading"><strong>立绘大小</strong><small>GAL 模式</small></div>
          <div class="bp-reading-size-presets bp-reading-portrait-presets" role="group" aria-label="立绘大小档位">
            <button
              type="button"
              aria-label="经典立绘大小，1.2倍"
              :aria-pressed="portraitSizePercent === 120"
              @click="setPortraitSize(120)"
            >
              经典
            </button>
            <button
              type="button"
              aria-label="ADV 立绘大小，1.6倍"
              :aria-pressed="portraitSizePercent === 160"
              @click="setPortraitSize(160)"
            >
              ADV 1.6×
            </button>
          </div>
        </div>
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import StageControlPlate from '../vector/StageControlPlate.vue';
import { TEXT_SIZE_MAX, TEXT_SIZE_MIN, TEXT_SIZE_STEP, useNarrativeTextSize } from './narrative-text-size';
import { useNarrativePortraitSize } from './narrative-portrait-size';

defineProps<{ mobile?: boolean }>();
const { textSizePercent, setTextSize } = useNarrativeTextSize();
const { portraitSizePercent, setPortraitSize } = useNarrativePortraitSize();
const root = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);
const slider = ref<HTMLInputElement | null>(null);
const open = ref(false);
const panelId = `reading-settings-${useId()}`;
const sliderId = `${panelId}-size`;
const presets = [
  { label: '小', value: 90 },
  { label: '默认', value: 100 },
  { label: '大', value: 120 },
  { label: '特大', value: 140 },
];
let ownerDocument: Document | null = null;

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    await nextTick();
    slider.value?.focus({ preventScroll: true });
  }
}
function close(restoreFocus = false) {
  open.value = false;
  if (restoreFocus) trigger.value?.focus({ preventScroll: true });
}
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    event.preventDefault();
    close(true);
  }
}
function handleOutside(event: Event) {
  if (open.value && !event.composedPath().includes(root.value as HTMLElement)) close();
}
onMounted(() => {
  ownerDocument = root.value?.ownerDocument ?? null;
  ownerDocument?.addEventListener('pointerdown', handleOutside);
  ownerDocument?.addEventListener('focusin', handleOutside);
});
onBeforeUnmount(() => {
  ownerDocument?.removeEventListener('pointerdown', handleOutside);
  ownerDocument?.removeEventListener('focusin', handleOutside);
});
</script>

<style scoped>
.bp-reading-settings {
  --reading-paper: #fafdff;
  --reading-well: #edf5ff;
  --reading-ink: #08144a;
  --reading-muted: #526e98;
  --reading-line: #b4d2ef;
  --reading-accent: #1638e8;
  --reading-cyan: #24e2f8;
  position: relative;
  min-inline-size: 0;
  pointer-events: auto;
  color: var(--reading-ink);
}
.bp-reading-settings-trigger {
  position: relative;
  display: grid;
  place-items: center;
  inline-size: 100%;
  block-size: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  clip-path: none;
  color: #08144a;
  background: none;
  box-shadow: none;
  cursor: pointer;
  --bp-ctrl-bg-top: #ffffff;
  --bp-ctrl-bg-mid: #f5fbff;
  --bp-ctrl-bg-bot: #e2f4ff;
  --bp-ctrl-rim: #7ec7f7;
  --bp-ctrl-accent: #38c5f8;
  --bp-ctrl-notch: #1638e8;
  transition:
    color 160ms ease,
    transform 160ms ease,
    filter 160ms ease;
}
.bp-reading-settings-trigger:hover,
.is-open .bp-reading-settings-trigger {
  color: #ffffff;
  --bp-ctrl-bg-top: #10257a;
  --bp-ctrl-bg-mid: #0b1b62;
  --bp-ctrl-bg-bot: #1638e8;
  --bp-ctrl-rim: #24e2f8;
  --bp-ctrl-accent: #24e2f8;
  --bp-ctrl-notch: #f43252;
  filter: drop-shadow(0 2px 6px rgba(22, 56, 232, 0.28));
}
.bp-reading-settings-trigger-inner {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3px, 0.45cqi, 6px);
  padding-inline: 10px 8px;
  line-height: 1;
  white-space: nowrap;
}
.bp-reading-settings-glyph {
  inline-size: clamp(13px, 1.35cqi, 18px);
  block-size: clamp(13px, 1.35cqi, 18px);
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}
.bp-reading-settings-mark {
  font: 850 clamp(12px, 1.3cqi, 18px)/1 var(--bp-title-font, sans-serif);
  letter-spacing: -0.06em;
}
.bp-reading-settings-mark > span {
  font-size: 0.75em;
}
.bp-reading-settings-label {
  font: 900 clamp(9px, 1.05cqi, 14px)/1 var(--bp-title-font, sans-serif);
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.bp-reading-settings-panel {
  position: absolute;
  z-index: 20;
  inset-block-start: calc(100% + 10px);
  inset-inline-end: 0;
  inline-size: 256px;
  padding: 12px 16px 16px;
  color: var(--reading-ink);
  background: var(--reading-paper);
  border: 1px solid var(--reading-line);
  border-block-start: 4px solid #08144a;
  border-block-end: 3px solid var(--reading-cyan);
  border-radius: 3px;
  box-shadow:
    5px 5px 0 #08144a24,
    0 14px 32px #08144a26;
  font-size: 14px;
  line-height: 1.4;
  text-shadow: none;
  letter-spacing: 0;
  transform-origin: top right;
}
.bp-reading-settings-panel > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #d5e6f8;
}
.bp-reading-settings-panel header > strong {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: 0.04em;
}
.bp-reading-settings-panel button {
  color: var(--reading-muted);
  font: inherit;
  cursor: pointer;
}
.bp-reading-close {
  display: grid;
  place-items: center;
  inline-size: 30px;
  block-size: 30px;
  margin-inline-end: -6px;
  padding: 6px;
  border: 0;
  border-radius: 3px;
  background: transparent;
}
.bp-reading-close svg {
  inline-size: 16px;
  block-size: 16px;
  stroke: currentColor;
  stroke-width: 1.7;
}
.bp-reading-close:hover {
  background: #08144a;
  color: var(--reading-cyan);
}
.bp-reading-size-stepper {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
}
.bp-reading-size-stepper > button {
  block-size: 38px;
  border: 1px solid var(--reading-line);
  border-radius: 2px;
  clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
  background: var(--reading-well);
  color: var(--reading-ink);
  font-size: 16px;
  font-weight: 850;
}
.bp-reading-size-stepper > button:hover:not(:disabled) {
  background: #08144a;
  border-color: #08144a;
  color: var(--reading-cyan);
}
.bp-reading-size-stepper output {
  color: var(--reading-accent);
  font-size: 27px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.bp-reading-size-stepper output > span {
  margin-inline-start: 3px;
  font-size: 13px;
}
.bp-reading-size-slider {
  display: block;
  appearance: none;
  inline-size: 100%;
  block-size: 36px;
  margin: 5px 0 8px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: linear-gradient(
      to right,
      var(--reading-accent) var(--reading-progress),
      var(--reading-line) var(--reading-progress)
    )
    center/100% 4px no-repeat;
  cursor: pointer;
  touch-action: pan-y;
}
.bp-reading-size-slider::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 4px;
}
.bp-reading-size-slider::-webkit-slider-thumb {
  appearance: none;
  inline-size: 16px;
  block-size: 18px;
  margin-block-start: -7px;
  border: 2px solid #08144a;
  border-radius: 1px;
  background: var(--reading-cyan, #24e2f8);
  box-shadow: 2px 2px 0 #08144a40;
}
.bp-reading-size-slider::-moz-range-thumb {
  inline-size: 14px;
  block-size: 16px;
  border: 2px solid #08144a;
  border-radius: 1px;
  background: var(--reading-cyan, #24e2f8);
  box-shadow: 2px 2px 0 #08144a40;
}
.bp-reading-size-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}
.bp-reading-portrait-section {
  margin-block-start: 14px;
  padding-block-start: 12px;
  border-block-start: 1px solid var(--reading-line);
}
.bp-reading-portrait-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-block-end: 9px;
}
.bp-reading-portrait-heading strong {
  font-size: 14px;
  font-weight: 800;
}
.bp-reading-portrait-heading small {
  color: var(--reading-muted);
  font-size: 11px;
}
.bp-reading-portrait-presets {
  grid-template-columns: repeat(2, 1fr);
}
.bp-reading-size-presets > button {
  min-block-size: 33px;
  padding: 5px 0;
  border: 1px solid var(--reading-line);
  border-radius: 2px;
  clip-path: polygon(5px 0, 100% 0, calc(100% - 5px) 100%, 0 100%);
  background: var(--reading-well);
  color: var(--reading-ink);
  font-size: 12px;
  font-weight: 800;
}
.bp-reading-size-presets > button[aria-pressed='true'] {
  color: var(--reading-selected-ink, #24e2f8);
  border-color: #08144a;
  background: #08144a;
}
.bp-reading-size-stepper > button:hover:not(:disabled),
.bp-reading-size-presets > button:hover:not([aria-pressed='true']) {
  color: #1638e8;
  border-color: #1638e8;
  background: #e1f1ff;
}
.bp-reading-settings-panel button:disabled {
  opacity: 0.35;
  cursor: default;
}
.bp-reading-settings :is(button, input):focus-visible {
  outline: 2px solid var(--reading-accent);
  outline-offset: 3px;
}
.is-mobile {
  flex: 0 0 44px;
  block-size: 44px;
}
.is-mobile .bp-reading-settings-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border: 1px solid #8ec4f0;
  border-radius: 3px;
  clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%);
  background: linear-gradient(180deg, #ffffff, #ebf6ff);
  box-shadow: 2px 2px 0 rgba(22, 56, 232, 0.14);
}
.is-mobile .bp-reading-settings-trigger:hover,
.is-mobile.is-open .bp-reading-settings-trigger {
  background: linear-gradient(125deg, #08144a, #1638e8);
  border-color: #24e2f8;
  color: #ffffff;
  filter: none;
}
.is-mobile .bp-reading-settings-trigger-inner {
  padding-inline: 0;
}
.is-mobile .bp-reading-settings-mark {
  font-size: 19px;
}
.is-mobile .bp-reading-settings-label {
  display: none;
}
.is-mobile .bp-reading-settings-panel {
  inline-size: 264px;
}
.is-mobile
  :is(
    .bp-reading-close,
    .bp-reading-size-stepper > button,
    .bp-reading-size-presets > button,
    .bp-reading-size-slider
  ) {
  min-block-size: 44px;
}
:global(:is(.ContentChatRenderer, .bpm-app-root).is-chat-mode:has(.bp-chat-thread.is-midnight) .bp-reading-settings) {
  --reading-paper: #0e1e4f;
  --reading-well: #152b6b;
  --reading-ink: #e4f2ff;
  --reading-muted: #98bee8;
  --reading-line: #3767c4;
  --reading-accent: #24e2f8;
  --reading-selected-ink: #050c34;
}
:global(
  :is(.ContentChatRenderer, .bpm-app-root).is-chat-mode:has(.bp-chat-thread.is-midnight) .bp-reading-settings-trigger
) {
  color: #cdeaff;
  --bp-ctrl-bg-top: #132869;
  --bp-ctrl-bg-mid: #0e2058;
  --bp-ctrl-bg-bot: #0a1742;
  --bp-ctrl-rim: #417ae0;
  --bp-ctrl-accent: #24e2f8;
  --bp-ctrl-notch: #24e2f8;
}
:global(
  .bpm-app-root.is-chat-mode:has(.bp-chat-thread.is-midnight) .bp-reading-settings-trigger
) {
  color: #b8e8ff;
  background: #10245e;
  border-color: #3f78d8;
  box-shadow: none;
}
.bp-reading-popover-enter-active,
.bp-reading-popover-leave-active {
  transition:
    opacity 150ms,
    transform 180ms;
}
.bp-reading-popover-enter-from,
.bp-reading-popover-leave-to {
  opacity: 0;
  transform: translateY(-5px) scale(0.98);
}
@media (prefers-reduced-motion: reduce) {
  .bp-reading-settings *,
  .bp-reading-popover-enter-active,
  .bp-reading-popover-leave-active {
    transition: none !important;
  }
}
</style>
