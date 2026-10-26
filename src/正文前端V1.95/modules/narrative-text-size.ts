import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { NarrativeModeStorage } from './narrative-view-mode';

export const NARRATIVE_TEXT_SIZE_KEY = 'amami-narrative-text-size:v1';
export const TEXT_SIZE_MIN = 80;
export const TEXT_SIZE_MAX = 160;
export const TEXT_SIZE_STEP = 5;
const CHANGE_EVENT = 'amami-narrative-text-size-change';

export function normalizeNarrativeTextSize(value: unknown): number {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value === 'string' && value.trim() === ''))
    return 100;
  const percent = Number(value);
  if (!Number.isFinite(percent)) return 100;
  return Math.max(TEXT_SIZE_MIN, Math.min(TEXT_SIZE_MAX, Math.round(percent / TEXT_SIZE_STEP) * TEXT_SIZE_STEP));
}

export function useNarrativeTextSize(targetWindow: Window | null = typeof window === 'undefined' ? null : window) {
  let storage: NarrativeModeStorage | null = null;
  let initialSize = 100;
  try {
    storage = targetWindow?.localStorage ?? null;
    initialSize = normalizeNarrativeTextSize(storage?.getItem(NARRATIVE_TEXT_SIZE_KEY));
  } catch {
    // Reading remains adjustable when an embedded page cannot access storage.
  }
  const textSizePercent = ref(initialSize);
  const textSizeStyle = computed(() => ({ '--bp-reading-scale': textSizePercent.value / 100 }));

  function setTextSize(value: unknown) {
    const next = normalizeNarrativeTextSize(value);
    textSizePercent.value = next;
    try {
      storage?.setItem(NARRATIVE_TEXT_SIZE_KEY, String(next));
    } catch {
      // Keep the live setting even if persistence is unavailable.
    }
    targetWindow?.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }
  function handleChange(event: Event) {
    textSizePercent.value = normalizeNarrativeTextSize((event as CustomEvent<unknown>).detail);
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== storage) return;
    if (event.key === NARRATIVE_TEXT_SIZE_KEY || event.key === null) {
      textSizePercent.value = normalizeNarrativeTextSize(event.newValue);
    }
  }
  onMounted(() => {
    targetWindow?.addEventListener(CHANGE_EVENT, handleChange);
    targetWindow?.addEventListener('storage', handleStorage);
  });
  onBeforeUnmount(() => {
    targetWindow?.removeEventListener(CHANGE_EVENT, handleChange);
    targetWindow?.removeEventListener('storage', handleStorage);
  });
  return { textSizePercent, textSizeStyle, setTextSize };
}
