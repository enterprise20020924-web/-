<template>
  <div class="status-bar-shell" :class="{ 'low-performance': isLiteVisuals }">
    <button
      v-show="!isVisible"
      ref="launcherRef"
      class="status-launcher"
      :class="{ dragging: isDragging }"
      :style="launcherStyle"
      type="button"
      :title="`${launcherPortrait.name} · 打开小手机`"
      :aria-label="`${launcherPortrait.name} · 打开小手机`"
      @keydown.enter.prevent="openLauncher"
      @keydown.space.prevent="openLauncher"
    >
      <img
        v-for="(portrait, theme) in PHONE_LAUNCHER_PORTRAITS"
        v-show="launcherTheme === theme"
        :key="theme"
        class="launcher-character"
        :src="portrait.url"
        alt=""
        draggable="false"
      />
    </button>

    <StatusBar :is-visible="isVisible" @close="close" @theme-change="launcherTheme = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { PHONE_LAUNCHER_PORTRAITS, type PhoneLauncherTheme } from '../../shared/launcher-portraits';
import StatusBar from './StatusBar.vue';

const LAUNCHER_SIZE = 256;
const MOBILE_LAUNCHER_SIZE = 120;
const VIEWPORT_PADDING = 12;
const DRAG_THRESHOLD = 6;
const POSITION_STORAGE_KEY = 'fatria-status-launcher-position-v2';
const LEGACY_POSITION_STORAGE_KEY = 'fatria-status-launcher-position';
const PHONE_PREFS_STORAGE_KEY = 'fatria-status-phone-preferences-v1';
const PHONE_PREFS_UPDATED_EVENT = 'fatria-status-phone-preferences-updated';

type LauncherPosition = {
  x: number;
  y: number;
};

type PhoneVisualMode = 'auto' | 'full' | 'lite';

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
  pointerId?: number;
} | null;

const launcherRef = ref<HTMLButtonElement | null>(null);
const launcherPosition = ref<LauncherPosition>({
  x: VIEWPORT_PADDING,
  y: VIEWPORT_PADDING,
});
const launcherTheme = ref<PhoneLauncherTheme>('aqua');
const launcherPortrait = computed(() => PHONE_LAUNCHER_PORTRAITS[launcherTheme.value]);
const isLiteVisuals = ref(false);
const dragState = ref<DragState>(null);
const isDragging = ref(false);
let lastDragEndedAt = 0;
let activeHostWindow: Window | null = null;
let activeHostDocument: Document | null = null;

// 全局状态管理，保留给旧按钮事件和其它脚本调用。
const globalAny = window as any;
if (!globalAny.__statusBarState) {
  const isVisibleRef = ref(false);
  globalAny.__statusBarState = {
    isVisible: isVisibleRef,
  };
}

const isVisible = globalAny.__statusBarState.isVisible;

globalAny.__statusBarState.open = () => {
  isVisible.value = true;
};
globalAny.__statusBarState.close = () => {
  isVisible.value = false;
};
globalAny.__statusBarState.toggle = () => {
  isVisible.value = !isVisible.value;
};

const launcherStyle = computed(() => ({
  left: `${launcherPosition.value.x}px`,
  top: `${launcherPosition.value.y}px`,
}));

function loadLauncherPosition(): LauncherPosition {
  try {
    const raw = getStorage()?.getItem(POSITION_STORAGE_KEY);
    if (!raw) return clampLauncherPosition(getDefaultPosition());

    const parsed = JSON.parse(raw);
    return clampLauncherPosition({
      x: Number(parsed?.x ?? getDefaultPosition().x),
      y: Number(parsed?.y ?? getDefaultPosition().y),
    });
  } catch {
    return clampLauncherPosition(getDefaultPosition());
  }
}

function saveLauncherPosition(position: LauncherPosition) {
  try {
    getStorage()?.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  } catch {
    // localStorage 不可用时只保留本次页面内位置。
  }
}

function getHostDocument(): Document {
  return activeHostDocument ?? launcherRef.value?.ownerDocument ?? document;
}

function getHostWindow(): Window {
  return activeHostWindow ?? getHostDocument().defaultView ?? window;
}

function getStorage(): Storage | null {
  try {
    return getHostWindow().localStorage ?? window.localStorage ?? null;
  } catch {
    try {
      return window.localStorage ?? null;
    } catch {
      return null;
    }
  }
}

function isPhoneVisualMode(value: unknown): value is PhoneVisualMode {
  return value === 'auto' || value === 'full' || value === 'lite';
}

function shouldUseLiteVisuals(mode: PhoneVisualMode): boolean {
  if (mode === 'lite') return true;
  if (mode === 'full') return false;

  const hostWindow = getHostWindow();
  const navigatorWithMemory = hostWindow.navigator as Navigator & { deviceMemory?: number };
  const prefersReducedMotion = hostWindow.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const coarsePointer = hostWindow.matchMedia?.('(pointer: coarse)').matches ?? false;
  const lowMemory = typeof navigatorWithMemory.deviceMemory === 'number' && navigatorWithMemory.deviceMemory <= 4;
  const lowConcurrency =
    typeof navigatorWithMemory.hardwareConcurrency === 'number' && navigatorWithMemory.hardwareConcurrency <= 4;

  return prefersReducedMotion || coarsePointer || lowMemory || lowConcurrency;
}

function readVisualModeFromStorage(): PhoneVisualMode {
  try {
    const raw = getStorage()?.getItem(PHONE_PREFS_STORAGE_KEY);
    if (!raw) return 'auto';

    const parsed = JSON.parse(raw);
    return isPhoneVisualMode(parsed?.visualMode) ? parsed.visualMode : 'auto';
  } catch {
    return 'auto';
  }
}

function syncLauncherVisualsFromStorage() {
  isLiteVisuals.value = shouldUseLiteVisuals(readVisualModeFromStorage());
}

function handlePhonePreferencesUpdated(event: Event) {
  const detail = (event as CustomEvent).detail;
  if (isPhoneVisualMode(detail?.visualMode)) {
    isLiteVisuals.value = shouldUseLiteVisuals(detail.visualMode);
  } else {
    syncLauncherVisualsFromStorage();
  }
}

function handlePhonePreferencesStorage(event: StorageEvent) {
  if (event.key && event.key !== PHONE_PREFS_STORAGE_KEY) return;
  syncLauncherVisualsFromStorage();
}

function getLauncherSize(): number {
  return getHostWindow().matchMedia('(max-width: 480px)').matches ? MOBILE_LAUNCHER_SIZE : LAUNCHER_SIZE;
}

function clampLauncherPosition(position: LauncherPosition): LauncherPosition {
  const viewport = getViewportSize();
  const launcherSize = getLauncherSize();
  const maxX = Math.max(VIEWPORT_PADDING, viewport.width - launcherSize - VIEWPORT_PADDING);
  const maxY = Math.max(VIEWPORT_PADDING, viewport.height - launcherSize - VIEWPORT_PADDING);
  return {
    x: Math.min(Math.max(position.x, VIEWPORT_PADDING), maxX),
    y: Math.min(Math.max(position.y, VIEWPORT_PADDING), maxY),
  };
}

function getDefaultPosition(): LauncherPosition {
  const viewport = getViewportSize();
  const launcherSize = getLauncherSize();
  return {
    x: Math.max(VIEWPORT_PADDING, viewport.width - launcherSize - 18),
    y: Math.max(VIEWPORT_PADDING, viewport.height - launcherSize - 88),
  };
}

function getViewportSize() {
  const hostDocument = getHostDocument();
  const hostWindow = getHostWindow();
  const root = hostDocument.documentElement;
  const body = hostDocument.body;
  const visualViewport = hostWindow.visualViewport;
  const containerRect = launcherRef.value?.closest<HTMLElement>('[script_id]')?.getBoundingClientRect();
  const width = Math.max(
    Number(hostWindow.innerWidth) || 0,
    Number(root?.clientWidth) || 0,
    Number(body?.clientWidth) || 0,
    Number(visualViewport?.width) || 0,
    Number(containerRect?.width) || 0,
  );
  const height = Math.max(
    Number(hostWindow.innerHeight) || 0,
    Number(root?.clientHeight) || 0,
    Number(body?.clientHeight) || 0,
    Number(visualViewport?.height) || 0,
    Number(containerRect?.height) || 0,
  );

  return {
    width: Math.max(width, getLauncherSize() + VIEWPORT_PADDING * 2),
    height: Math.max(height, getLauncherSize() + VIEWPORT_PADDING * 2),
  };
}

function applyLauncherPosition(position: LauncherPosition, shouldSave = false) {
  const nextPosition = clampLauncherPosition(position);
  launcherPosition.value = nextPosition;

  const launcher = launcherRef.value;
  if (launcher) {
    launcher.style.left = `${nextPosition.x}px`;
    launcher.style.top = `${nextPosition.y}px`;
  }

  if (shouldSave) {
    saveLauncherPosition(nextPosition);
  }
}

function beginDrag(clientX: number, clientY: number, pointerId?: number) {
  const rect = launcherRef.value?.getBoundingClientRect();
  dragState.value = {
    startX: clientX,
    startY: clientY,
    originX: rect?.left ?? launcherPosition.value.x,
    originY: rect?.top ?? launcherPosition.value.y,
    moved: false,
    pointerId,
  };
  isDragging.value = false;
}

function handlePointerDown(event: PointerEvent) {
  if (event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();
  beginDrag(event.clientX, event.clientY, event.pointerId);
  addPointerFallbackListeners();
  try {
    launcherRef.value?.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture may fail in some embedded webviews; pointermove still handles the common path.
  }
}

function moveLauncher(clientX: number, clientY: number) {
  if (!dragState.value) return;

  const dx = clientX - dragState.value.startX;
  const dy = clientY - dragState.value.startY;
  if (Math.abs(dx) + Math.abs(dy) > DRAG_THRESHOLD) {
    dragState.value.moved = true;
    isDragging.value = true;
  }

  applyLauncherPosition({
    x: dragState.value.originX + dx,
    y: dragState.value.originY + dy,
  });
}

function handlePointerMove(event: PointerEvent) {
  if (!dragState.value) return;
  if (dragState.value.pointerId !== undefined && dragState.value.pointerId !== event.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  moveLauncher(event.clientX, event.clientY);
}

function handlePointerUp(event: PointerEvent) {
  if (!dragState.value) return;
  if (dragState.value.pointerId !== undefined && dragState.value.pointerId !== event.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  releasePointerCapture(event.pointerId);
  removePointerFallbackListeners();
  finishDrag(true);
}

function handlePointerCancel(event: PointerEvent) {
  if (!dragState.value) return;
  if (dragState.value.pointerId !== undefined && dragState.value.pointerId !== event.pointerId) return;

  event.preventDefault();
  event.stopPropagation();
  releasePointerCapture(event.pointerId);
  removePointerFallbackListeners();
  finishDrag(false);
}

function releasePointerCapture(pointerId: number) {
  try {
    if (launcherRef.value?.hasPointerCapture(pointerId)) {
      launcherRef.value.releasePointerCapture(pointerId);
    }
  } catch {
    // Ignore release failures from browsers/webviews with partial PointerEvent support.
  }
}

function handleLauncherClick(event: MouseEvent) {
  event.preventDefault();
  if (Date.now() - lastDragEndedAt < 350) {
    return;
  }

  if (!dragState.value) {
    openLauncher();
  }
}

function finishDrag(shouldOpenWhenNotMoved: boolean) {
  if (!dragState.value) return;

  const shouldOpen = !dragState.value.moved;
  if (dragState.value.moved) {
    applyLauncherPosition(launcherPosition.value, true);
    lastDragEndedAt = Date.now();
  }

  dragState.value = null;
  isDragging.value = false;

  if (shouldOpenWhenNotMoved && shouldOpen) {
    openLauncher();
  }
}

function addPointerFallbackListeners() {
  const hostWindow = getHostWindow();
  const hostDocument = getHostDocument();
  hostWindow.addEventListener('pointermove', handlePointerMove, true);
  hostWindow.addEventListener('pointerup', handlePointerUp, true);
  hostWindow.addEventListener('pointercancel', handlePointerCancel, true);
  hostDocument.addEventListener('pointermove', handlePointerMove, true);
  hostDocument.addEventListener('pointerup', handlePointerUp, true);
  hostDocument.addEventListener('pointercancel', handlePointerCancel, true);
}

function removePointerFallbackListeners() {
  const hostWindow = getHostWindow();
  const hostDocument = getHostDocument();
  hostWindow.removeEventListener('pointermove', handlePointerMove, true);
  hostWindow.removeEventListener('pointerup', handlePointerUp, true);
  hostWindow.removeEventListener('pointercancel', handlePointerCancel, true);
  hostDocument.removeEventListener('pointermove', handlePointerMove, true);
  hostDocument.removeEventListener('pointerup', handlePointerUp, true);
  hostDocument.removeEventListener('pointercancel', handlePointerCancel, true);
}

function openLauncher() {
  globalAny.__statusBarState.open();
}

function close() {
  globalAny.__statusBarState.close();
}

function handleResize() {
  applyLauncherPosition(launcherPosition.value);
}

onMounted(() => {
  activeHostDocument = launcherRef.value?.ownerDocument ?? document;
  activeHostWindow = activeHostDocument.defaultView ?? window;
  (activeHostWindow as any).__statusBarState = globalAny.__statusBarState;

  try {
    getStorage()?.removeItem(LEGACY_POSITION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures.
  }

  applyLauncherPosition(loadLauncherPosition());
  syncLauncherVisualsFromStorage();
  launcherRef.value?.addEventListener('pointerdown', handlePointerDown);
  launcherRef.value?.addEventListener('pointermove', handlePointerMove);
  launcherRef.value?.addEventListener('pointerup', handlePointerUp);
  launcherRef.value?.addEventListener('pointercancel', handlePointerCancel);
  launcherRef.value?.addEventListener('click', handleLauncherClick);
  activeHostWindow.addEventListener('resize', handleResize);
  activeHostWindow.addEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
  activeHostWindow.addEventListener('storage', handlePhonePreferencesStorage);
  if (activeHostWindow !== window) {
    window.addEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
    window.addEventListener('storage', handlePhonePreferencesStorage);
  }
});

onUnmounted(() => {
  const hostWindow = getHostWindow();
  hostWindow.removeEventListener('resize', handleResize);
  hostWindow.removeEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
  hostWindow.removeEventListener('storage', handlePhonePreferencesStorage);
  if (hostWindow !== window) {
    window.removeEventListener(PHONE_PREFS_UPDATED_EVENT, handlePhonePreferencesUpdated);
    window.removeEventListener('storage', handlePhonePreferencesStorage);
  }
  launcherRef.value?.removeEventListener('pointerdown', handlePointerDown);
  launcherRef.value?.removeEventListener('pointermove', handlePointerMove);
  launcherRef.value?.removeEventListener('pointerup', handlePointerUp);
  launcherRef.value?.removeEventListener('pointercancel', handlePointerCancel);
  launcherRef.value?.removeEventListener('click', handleLauncherClick);
  removePointerFallbackListeners();
  if (dragState.value?.pointerId !== undefined) {
    releasePointerCapture(dragState.value.pointerId);
  }
  activeHostWindow = null;
  activeHostDocument = null;
});
</script>

<style scoped lang="scss">
.status-bar-shell {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99999;
}

.status-launcher {
  position: fixed;
  width: 256px;
  height: 256px;
  border: 0;
  border-radius: 10px;
  padding: 0;
  display: grid;
  place-items: center;
  background: transparent;
  box-shadow: none;
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  user-select: none;
  z-index: 100000;
  transition: transform 0.18s ease;

  &:hover {
    transform: translateY(-2px) scale(1.03);
  }

  &:focus-visible {
    outline: 2px solid #65b7ff;
    outline-offset: 3px;
  }

  &:active,
  &.dragging {
    cursor: grabbing;
    transform: scale(0.96);
  }
}

.launcher-character {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
  filter: drop-shadow(0 2px 2px rgba(8, 20, 42, 0.42));
}

.status-bar-shell.low-performance .status-launcher {
  transition: none;
}

@media (max-width: 480px) {
  .status-launcher {
    width: 120px;
    height: 120px;
  }
}
</style>
