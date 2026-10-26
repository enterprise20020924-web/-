import { onBeforeUnmount, onMounted, ref } from 'vue';
import type { NarrativeModeStorage } from './narrative-view-mode';

export const NARRATIVE_CHAT_THEME_STORAGE_KEY = 'bp-narrative-chat-theme';
const THEME_CHANGE_EVENT = 'bp-narrative-chat-theme-change';

export function normalizeNarrativeChatTheme(value: unknown): boolean {
  return value === 'midnight';
}

export function readNarrativeChatTheme(storage: NarrativeModeStorage | null): boolean {
  try {
    return normalizeNarrativeChatTheme(storage?.getItem(NARRATIVE_CHAT_THEME_STORAGE_KEY));
  } catch {
    return false;
  }
}

export function writeNarrativeChatTheme(storage: NarrativeModeStorage | null, midnight: boolean): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(NARRATIVE_CHAT_THEME_STORAGE_KEY, midnight ? 'midnight' : 'day');
    return true;
  } catch {
    return false;
  }
}

export function useNarrativeChatTheme(targetWindow: Window | null = typeof window === 'undefined' ? null : window) {
  let storage: NarrativeModeStorage | null = null;
  try {
    storage = targetWindow?.localStorage ?? null;
  } catch {
    // Restricted embeds still support a session-only toggle.
  }
  const isMidnightMode = ref(readNarrativeChatTheme(storage));

  function toggleMidnightMode() {
    isMidnightMode.value = !isMidnightMode.value;
    writeNarrativeChatTheme(storage, isMidnightMode.value);
    // Native storage events do not notify other message floors in the same window.
    targetWindow?.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: isMidnightMode.value }));
  }

  function handleThemeChange(event: Event) {
    const value = (event as CustomEvent<unknown>).detail;
    if (typeof value === 'boolean') isMidnightMode.value = value;
  }

  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== storage) return;
    if (event.key === NARRATIVE_CHAT_THEME_STORAGE_KEY || event.key === null) {
      isMidnightMode.value = normalizeNarrativeChatTheme(event.newValue);
    }
  }

  onMounted(() => {
    targetWindow?.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    targetWindow?.addEventListener('storage', handleStorage);
  });
  onBeforeUnmount(() => {
    targetWindow?.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    targetWindow?.removeEventListener('storage', handleStorage);
  });

  return { isMidnightMode, toggleMidnightMode };
}
