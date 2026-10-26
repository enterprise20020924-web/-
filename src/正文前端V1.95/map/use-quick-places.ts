import { onBeforeUnmount, onMounted, ref } from 'vue';
import { campusLocations } from './campus-map-data';

export const CAMPUS_QUICK_PLACES_KEY = 'amami-campus-map:quick-places:v1';
const changeEvent = 'amami-campus-quick-places-change';
const validIds = new Set(campusLocations.map(place => place.id));
let sessionIds: number[] = [];

export function normalizeQuickPlaces(value: unknown): number[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((id): id is number => typeof id === 'number' && validIds.has(id)))]
    : [];
}

function parseQuickPlaces(value: string | null) {
  try {
    return normalizeQuickPlaces(value ? JSON.parse(value) : []);
  } catch {
    return [];
  }
}

// UI preferences belong to the browser, independently of story/message variables.
// Same-origin message frames share the host's storage and notification channel.
export function useQuickPlaces() {
  let targetWindow: Window | null = typeof window === 'undefined' ? null : window;
  let storage: Storage | null = null;
  try {
    const host = targetWindow?.parent;
    if (host?.localStorage) targetWindow = host;
  } catch {
    // Cross-origin frames use their own preference store.
  }
  try {
    storage = targetWindow?.localStorage ?? null;
  } catch {
    // Storage-restricted embeds keep an in-memory list for this session.
  }
  const persistent = ref(!!storage);
  const ids = ref<number[]>(read());

  function read() {
    if (storage) {
      try {
        sessionIds = parseQuickPlaces(storage.getItem(CAMPUS_QUICK_PLACES_KEY));
      } catch {
        storage = null;
        persistent.value = false;
      }
    }
    return [...sessionIds];
  }

  function save(next: number[]) {
    ids.value = normalizeQuickPlaces(next);
    sessionIds = [...ids.value];
    if (storage) {
      try {
        storage.setItem(CAMPUS_QUICK_PLACES_KEY, JSON.stringify(ids.value));
      } catch {
        storage = null;
        persistent.value = false;
      }
    }
    targetWindow?.dispatchEvent(new CustomEvent(changeEvent, { detail: [...ids.value] }));
  }

  function toggle(id: number) {
    if (!validIds.has(id)) return false;
    const current = read();
    const adding = !current.includes(id);
    save(adding ? [id, ...current] : current.filter(item => item !== id));
    return adding;
  }

  function remove(id: number) {
    save(read().filter(item => item !== id));
  }

  function handleChange(event: Event) {
    ids.value = normalizeQuickPlaces((event as CustomEvent<unknown>).detail);
    sessionIds = [...ids.value];
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== storage) return;
    if (event.key === CAMPUS_QUICK_PLACES_KEY || event.key === null) {
      ids.value = parseQuickPlaces(event.newValue);
      sessionIds = [...ids.value];
    }
  }
  onMounted(() => {
    ids.value = read();
    targetWindow?.addEventListener(changeEvent, handleChange);
    targetWindow?.addEventListener('storage', handleStorage);
  });
  onBeforeUnmount(() => {
    targetWindow?.removeEventListener(changeEvent, handleChange);
    targetWindow?.removeEventListener('storage', handleStorage);
  });

  return { ids, persistent, toggle, remove };
}
