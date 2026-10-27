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
      aria-label="字号设置"
      aria-haspopup="dialog"
      :aria-expanded="open"
      :aria-controls="panelId"
      title="调整正文字号"
      @click="toggle"
    >
      <span class="bp-reading-settings-mark" aria-hidden="true">A<span>a</span></span>
      <span class="bp-reading-settings-label">字号</span>
    </button>
    <Transition name="bp-reading-popover">
      <section v-if="open" :id="panelId" class="bp-reading-settings-panel" role="dialog" aria-label="正文字号">
        <header>
          <strong>正文字号</strong>
          <button type="button" class="bp-reading-close" aria-label="关闭字号设置" @click="close(true)">
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
      </section>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useId } from 'vue';
import { TEXT_SIZE_MAX, TEXT_SIZE_MIN, TEXT_SIZE_STEP, useNarrativeTextSize } from './narrative-text-size';

defineProps<{ mobile?: boolean }>();
const { textSizePercent, setTextSize } = useNarrativeTextSize();
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
  --reading-well: #edf7fc;
  --reading-ink: #174766;
  --reading-muted: #5988a2;
  --reading-line: #b6e0f3;
  --reading-accent: #079fd4;
  position: relative;
  min-inline-size: 0;
  pointer-events: auto;
  color: var(--reading-ink);
}
.bp-reading-settings-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  inline-size: 100%;
  block-size: 100%;
  padding: 2px 7px;
  border: 1px solid #83d6ff;
  border-radius: 999px;
  color: #078fcd;
  background: linear-gradient(180deg, #fff 5%, #f5fcff 52%, #def6ff);
  box-shadow:
    inset 0 1px 0 #fff,
    0 2px 8px #5cbdee26;
  cursor: pointer;
  transition:
    background 180ms,
    border-color 180ms,
    box-shadow 180ms;
}
.bp-reading-settings-trigger:hover,
.is-open .bp-reading-settings-trigger {
  border-color: #23b9ec;
  background: #e8f9ff;
  box-shadow: 0 0 0 2px #70d6fa24;
}
.bp-reading-settings-mark {
  font: 750 clamp(12px, 1.3cqi, 18px)/1 var(--bp-body-font, sans-serif);
  letter-spacing: -0.08em;
}
.bp-reading-settings-mark > span {
  font-size: 0.75em;
}
.bp-reading-settings-label {
  font-size: clamp(9px, 0.95cqi, 13px);
  font-weight: 800;
  white-space: nowrap;
}
.bp-reading-settings-panel {
  position: absolute;
  z-index: 20;
  inset-block-start: calc(100% + 10px);
  inset-inline-end: 0;
  inline-size: 252px;
  padding: 12px 16px 16px;
  color: var(--reading-ink);
  background: var(--reading-paper);
  border: 1px solid var(--reading-line);
  border-block-start: 3px solid var(--reading-accent);
  border-radius: 5px 5px 14px 5px;
  box-shadow:
    0 12px 32px #0c5f872b,
    0 2px 7px #0d64911a;
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
}
.bp-reading-settings-panel header > strong {
  font-size: 14px;
  font-weight: 800;
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
  border-radius: 5px;
  background: transparent;
}
.bp-reading-close svg {
  inline-size: 16px;
  block-size: 16px;
  stroke: currentColor;
  stroke-width: 1.5;
}
.bp-reading-close:hover {
  background: var(--reading-well);
}
.bp-reading-size-stepper {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 8px;
}
.bp-reading-size-stepper > button {
  block-size: 40px;
  border: 1px solid var(--reading-line);
  border-radius: 7px;
  background: var(--reading-well);
  color: var(--reading-ink);
  font-size: 17px;
  font-weight: 650;
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
  inline-size: 18px;
  block-size: 18px;
  margin-block-start: -7px;
  border: 3px solid var(--reading-paper);
  border-radius: 50%;
  background: var(--reading-accent);
  box-shadow:
    0 0 0 1px var(--reading-accent),
    0 2px 5px #0b6b8c35;
}
.bp-reading-size-slider::-moz-range-thumb {
  inline-size: 13px;
  block-size: 13px;
  border: 3px solid var(--reading-paper);
  border-radius: 50%;
  background: var(--reading-accent);
  box-shadow: 0 0 0 1px var(--reading-accent);
}
.bp-reading-size-presets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
}
.bp-reading-size-presets > button {
  min-block-size: 33px;
  padding: 5px 0;
  border: 1px solid transparent;
  border-radius: 4px;
  background: var(--reading-well);
  font-size: 12px;
  font-weight: 700;
}
.bp-reading-size-presets > button[aria-pressed='true'] {
  color: var(--reading-selected-ink, #fff);
  border-color: var(--reading-accent);
  background: var(--reading-accent);
}
.bp-reading-size-stepper > button:hover:not(:disabled),
.bp-reading-size-presets > button:hover:not([aria-pressed='true']) {
  color: var(--reading-accent);
  border-color: var(--reading-accent);
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
  padding: 6px;
  border-radius: 12px 4px 12px 12px;
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
  --reading-paper: #233a4b;
  --reading-well: #2d485a;
  --reading-ink: #e0edf5;
  --reading-muted: #b3cbd9;
  --reading-line: #52758a;
  --reading-accent: #6ccdec;
  --reading-selected-ink: #102d4f;
}
:global(
  :is(.ContentChatRenderer, .bpm-app-root).is-chat-mode:has(.bp-chat-thread.is-midnight) .bp-reading-settings-trigger
) {
  color: var(--reading-ink);
  background: var(--reading-paper);
  border-color: var(--reading-line);
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
