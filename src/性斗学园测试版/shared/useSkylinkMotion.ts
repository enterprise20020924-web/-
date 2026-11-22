import { computed, onMounted, onUnmounted, ref } from 'vue';

const STORAGE_KEY = 'academy-skylink-motion-v1';
const CHANGE_EVENT = 'academy-skylink-motion-change';

export function useSkylinkMotion() {
  const preference = ref<'auto' | 'full' | 'reduced'>('auto');
  const systemReduced = ref(false);
  const motionReduced = computed(
    () => preference.value === 'reduced' || (preference.value === 'auto' && systemReduced.value),
  );
  let host: Window = window;
  let media: MediaQueryList | undefined;

  function readPreference() {
    try {
      const value = host.localStorage.getItem(STORAGE_KEY);
      preference.value = value === 'full' || value === 'reduced' ? value : 'auto';
    } catch {
      // Preserve the current in-memory preference when storage is blocked.
    }
  }

  function receivePreference(event: Event) {
    const value = (event as CustomEvent).detail;
    if (value === 'full' || value === 'reduced') preference.value = value;
    else readPreference();
  }

  function syncSystem() {
    systemReduced.value = media?.matches ?? false;
  }

  function toggleMotion() {
    preference.value = motionReduced.value ? 'full' : 'reduced';
    try {
      host.localStorage.setItem(STORAGE_KEY, preference.value);
    } catch {
      // A blocked storage area should not prevent the in-memory control.
    }
    host.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: preference.value }));
  }

  onMounted(() => {
    try {
      if (window.parent && window.parent.document) host = window.parent;
    } catch {
      host = window;
    }
    media = host.matchMedia('(prefers-reduced-motion: reduce)');
    readPreference();
    syncSystem();
    media.addEventListener('change', syncSystem);
    host.addEventListener('storage', readPreference);
    host.addEventListener(CHANGE_EVENT, receivePreference);
  });

  onUnmounted(() => {
    media?.removeEventListener('change', syncSystem);
    host.removeEventListener('storage', readPreference);
    host.removeEventListener(CHANGE_EVENT, receivePreference);
  });

  return { motionReduced, toggleMotion };
}
