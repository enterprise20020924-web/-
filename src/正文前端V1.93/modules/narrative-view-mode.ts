import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { NarrativeViewMode } from '../types/narrative';

export const NARRATIVE_VIEW_MODE_STORAGE_KEY = 'bp-narrative-view-mode';

export interface NarrativeModeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function normalizeNarrativeViewMode(value: unknown): NarrativeViewMode {
  return value === 'chat' ? 'chat' : 'gal';
}

export function readNarrativeViewMode(storage: NarrativeModeStorage | null): NarrativeViewMode {
  if (storage === null) {
    return 'gal';
  }

  try {
    return normalizeNarrativeViewMode(storage.getItem(NARRATIVE_VIEW_MODE_STORAGE_KEY));
  } catch {
    return 'gal';
  }
}

export function writeNarrativeViewMode(storage: NarrativeModeStorage | null, mode: NarrativeViewMode) {
  if (storage === null) {
    return false;
  }

  try {
    storage.setItem(NARRATIVE_VIEW_MODE_STORAGE_KEY, mode);
    return true;
  } catch {
    return false;
  }
}

export function resolveNarrativeViewModeStorageEvent(
  currentMode: NarrativeViewMode,
  key: string | null,
  newValue: string | null,
) {
  return key === NARRATIVE_VIEW_MODE_STORAGE_KEY ? normalizeNarrativeViewMode(newValue) : currentMode;
}

export function useNarrativeViewMode(targetWindow: Window | null = typeof window === 'undefined' ? null : window) {
  const storage = resolveStorage(targetWindow);
  const narrativeViewMode = ref<NarrativeViewMode>(readNarrativeViewMode(storage));

  function setNarrativeViewMode(mode: NarrativeViewMode) {
    narrativeViewMode.value = mode;
    writeNarrativeViewMode(storage, mode);
  }

  function toggleNarrativeViewMode() {
    setNarrativeViewMode(narrativeViewMode.value === 'gal' ? 'chat' : 'gal');
  }

  function handleStorage(event: StorageEvent) {
    narrativeViewMode.value = resolveNarrativeViewModeStorageEvent(narrativeViewMode.value, event.key, event.newValue);
  }

  onMounted(() => targetWindow?.addEventListener('storage', handleStorage));
  onBeforeUnmount(() => targetWindow?.removeEventListener('storage', handleStorage));

  return {
    narrativeViewMode,
    setNarrativeViewMode,
    toggleNarrativeViewMode,
  };
}

function resolveStorage(targetWindow: Window | null): NarrativeModeStorage | null {
  if (targetWindow === null) {
    return null;
  }

  try {
    return targetWindow.localStorage;
  } catch {
    return null;
  }
}
