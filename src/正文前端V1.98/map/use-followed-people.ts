import { onBeforeUnmount, onMounted, ref } from 'vue';
import { campusCharacterHabits } from './campus-character-encounters';

export const CAMPUS_FOLLOWED_PEOPLE_KEY = 'amami-campus-map:followed-people:v1';
const changeEvent = 'amami-campus-followed-people-change';
const validNames = new Set(campusCharacterHabits.map(person => person.name));
let sessionNames: string[] = [];

export function normalizeFollowedPeople(value: unknown): string[] {
  return Array.isArray(value)
    ? [...new Set(value.filter((name): name is string => typeof name === 'string' && validNames.has(name)))]
    : [];
}
function parseNames(value: string | null) {
  try {
    return normalizeFollowedPeople(value ? JSON.parse(value) : []);
  } catch {
    return [];
  }
}

// Personal UI preferences, independent of story variables or NPC presence.
export function useFollowedPeople() {
  let targetWindow: Window | null = typeof window === 'undefined' ? null : window;
  let storage: Storage | null = null;
  try {
    if (targetWindow?.parent?.localStorage) targetWindow = targetWindow.parent;
  } catch {
    /* Use the local frame. */
  }
  try {
    storage = targetWindow?.localStorage ?? null;
  } catch {
    /* Use the in-memory list. */
  }
  const persistent = ref(!!storage);
  const names = ref<string[]>(read());
  function read() {
    if (storage) {
      try {
        sessionNames = parseNames(storage.getItem(CAMPUS_FOLLOWED_PEOPLE_KEY));
      } catch {
        storage = null;
        persistent.value = false;
      }
    }
    return [...sessionNames];
  }
  function save(next: string[]) {
    names.value = normalizeFollowedPeople(next);
    sessionNames = [...names.value];
    if (storage) {
      try {
        storage.setItem(CAMPUS_FOLLOWED_PEOPLE_KEY, JSON.stringify(names.value));
      } catch {
        storage = null;
        persistent.value = false;
      }
    }
    targetWindow?.dispatchEvent(new CustomEvent(changeEvent, { detail: [...names.value] }));
  }
  function toggle(name: string) {
    if (!validNames.has(name)) return false;
    const current = read();
    const adding = !current.includes(name);
    save(adding ? [...current, name] : current.filter(item => item !== name));
    return adding;
  }
  function remove(name: string) {
    save(read().filter(item => item !== name));
  }
  function handleChange(event: Event) {
    names.value = normalizeFollowedPeople((event as CustomEvent<unknown>).detail);
    sessionNames = [...names.value];
  }
  function handleStorage(event: StorageEvent) {
    if (event.storageArea !== storage) return;
    if (event.key === CAMPUS_FOLLOWED_PEOPLE_KEY || event.key === null) {
      names.value = parseNames(event.newValue);
      sessionNames = [...names.value];
    }
  }
  onMounted(() => {
    names.value = read();
    targetWindow?.addEventListener(changeEvent, handleChange);
    targetWindow?.addEventListener('storage', handleStorage);
  });
  onBeforeUnmount(() => {
    targetWindow?.removeEventListener(changeEvent, handleChange);
    targetWindow?.removeEventListener('storage', handleStorage);
  });
  return { names, persistent, toggle, remove };
}
