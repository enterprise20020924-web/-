import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { NarrativeModeStorage } from './narrative-view-mode';

export const NARRATIVE_PORTRAIT_SIZE_KEY = 'amami-narrative-portrait-size:v1';
const CHANGE_EVENT = 'amami-narrative-portrait-size-change';

export function normalizeNarrativePortraitSize(value: unknown): 120 | 160 {
  // Only an explicit Classic choice opts out of the new ADV default.
  return value === 120 || value === '120' ? 120 : 160;
}

export function useNarrativePortraitSize(targetWindow: Window | null = typeof window === 'undefined' ? null : window) {
  let storage: NarrativeModeStorage | null = null;
  let initialSize: 120 | 160 = 160;
  try {
    storage = targetWindow?.localStorage ?? null;
    initialSize = normalizeNarrativePortraitSize(storage?.getItem(NARRATIVE_PORTRAIT_SIZE_KEY));
  } catch {
    // Match the text-size setting when the host does not expose storage.
  }
  const portraitSizePercent = ref(initialSize);
  const portraitSizeStyle = computed(() => ({
    '--bp-portrait-scale': portraitSizePercent.value / 100,
    '--bp-portrait-shift-y': '-14%',
    '--bp-portrait-side-inset': portraitSizePercent.value === 160 ? '0%' : undefined,
    '--bp-portrait-inward': portraitSizePercent.value === 120 ? '50px' : '0px',
  }));

  function setPortraitSize(value: unknown) {
    const next = normalizeNarrativePortraitSize(value);
    portraitSizePercent.value = next;
    try {
      storage?.setItem(NARRATIVE_PORTRAIT_SIZE_KEY, String(next));
    } catch {
      // The current view still updates when persistence is unavailable.
    }
    targetWindow?.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }
  function handleChange(event: Event) {
    portraitSizePercent.value = normalizeNarrativePortraitSize((event as CustomEvent<unknown>).detail);
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== storage) return;
    if (event.key === NARRATIVE_PORTRAIT_SIZE_KEY || event.key === null) {
      portraitSizePercent.value = normalizeNarrativePortraitSize(event.newValue);
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
  return { portraitSizePercent, portraitSizeStyle, setPortraitSize };
}
