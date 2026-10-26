<template>
  <Teleport v-if="portalTarget" :to="portalTarget">
    <section class="amami-talent-view" aria-label="天赋星盘" @keydown.esc.stop.prevent="requestClose">
      <iframe
        :key="frameRevision"
        ref="starFrame"
        class="amami-talent-frame"
        title="天赋星盘内容"
        :srcdoc="astrolabeDocument"
        :aria-busy="phase === 'loading'"
        @load="onFrameLoad"
        @error="showError"
      ></iframe>
      <div v-if="phase !== 'ready'" class="amami-talent-loading" :class="{ 'is-error': phase === 'error' }">
        <svg class="amami-talent-loading-star" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          <circle cx="40" cy="40" r="31" stroke="currentColor" stroke-width=".7" stroke-dasharray="2 5" />
          <path d="M40 10 46 33 70 40 46 46 40 70 34 46 10 40 34 33Z" stroke="currentColor" stroke-width="1.3" />
          <path d="m40 27 13 13-13 13-13-13Z" stroke="currentColor" stroke-width=".7" />
        </svg>
        <p :role="phase === 'error' ? 'alert' : 'status'">
          {{ phase === 'error' ? '星盘暂时未能展开' : '正在展开星轨' }}
        </p>
        <div class="amami-talent-loading-actions">
          <button v-if="phase === 'error'" type="button" class="is-primary" @click="retry">重新展开</button>
          <button type="button" @click="requestClose">返回正文</button>
        </div>
      </div>
      <i
        v-for="corner in ['nw', 'ne', 'sw', 'se']"
        :key="corner"
        class="amami-talent-corner"
        :class="corner"
        aria-hidden="true"
      ></i>
    </section>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import astrolabeTemplate from './astrolabe-document.html?raw';
import { AMAMI_VECTOR_DATA_GZIP } from '../vector/generated/amami-vector-data';
import viewStyles from './talent-view.css?raw';

const props = defineProps<{ frameElement: HTMLElement | null }>();
const emit = defineEmits<{ close: [] }>();
const astrolabeDocument = astrolabeTemplate.replace(
  '<!--amami-vector-data-->',
  '<script>globalThis.__AMAMI_VECTOR_DATA_GZIP__=' + JSON.stringify(AMAMI_VECTOR_DATA_GZIP) + ';<' + '/script>',
);
const portalTarget = ref<HTMLElement | null>(null);
const starFrame = ref<HTMLIFrameElement | null>(null);
const frameRevision = ref(0);
const phase = ref<'loading' | 'ready' | 'error'>('loading');
let portalHost: HTMLElement | null = null;
let targetWindow: Window | null = null;
let loadTimer: ReturnType<typeof setTimeout> | undefined;
let disposed = false;
let closeRequested = false;

function requestClose() {
  if (disposed || closeRequested) return;
  closeRequested = true;
  emit('close');
}
function markReady() {
  if (disposed) return;
  clearTimeout(loadTimer);
  phase.value = 'ready';
  starFrame.value?.contentWindow?.focus();
}
function showError() {
  if (disposed) return;
  clearTimeout(loadTimer);
  phase.value = 'error';
}
function armLoadTimer() {
  clearTimeout(loadTimer);
  loadTimer = setTimeout(showError, 12000);
}
function onFrameLoad() {
  if (disposed || phase.value !== 'loading') return;
  // The embedded entry also sends ready; the DOM fallback covers older packaged builds.
  try {
    if (starFrame.value?.contentDocument?.querySelector('.astro-app .star-viewport')) markReady();
  } catch {
    showError();
  }
}
function onMessage(event: MessageEvent) {
  if (disposed || event.source !== starFrame.value?.contentWindow || !event.data || typeof event.data !== 'object')
    return;
  if (event.data.type === 'amami:talent-close') requestClose();
  else if (event.data.type === 'amami:talent-ready') markReady();
  else if (event.data.type === 'amami:talent-error') showError();
}
function retry() {
  phase.value = 'loading';
  frameRevision.value += 1;
  armLoadTimer();
}
onMounted(() => {
  const frame = props.frameElement;
  if (!frame) return;
  // Stay inside the narrative frame: this view replaces that region only.
  // The Tavern composer and the surrounding document keep their normal focus and scrolling.
  const targetDocument = frame.ownerDocument;
  targetWindow = targetDocument.defaultView;
  portalHost = targetDocument.createElement('div');
  portalHost.className = 'amami-talent-portal';
  const shadow = portalHost.attachShadow({ mode: 'open' });
  const style = targetDocument.createElement('style');
  style.textContent = viewStyles;
  const mount = targetDocument.createElement('div');
  shadow.append(style, mount);
  frame.append(portalHost);
  targetWindow?.addEventListener('message', onMessage);
  armLoadTimer();
  portalTarget.value = mount;
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(loadTimer);
  targetWindow?.removeEventListener('message', onMessage);
  // Removing the browsing context stops the embedded WebGL and animation loops.
  starFrame.value?.remove();
  portalHost?.remove();
});
</script>
