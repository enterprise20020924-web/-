import { ref } from 'vue';

export type BattleUiScale = 1 | 1.2;
const STORAGE_KEY = 'cross-distance-ui-scale:v1';
const uiScale = ref<BattleUiScale>(1);
let loaded = false;

export function useBattleUiScale() {
  if (!loaded) {
    loaded = true;
    try {
      uiScale.value = localStorage.getItem(STORAGE_KEY) === '1.2' ? 1.2 : 1;
    } catch {
      /* The selection remains usable in memory. */
    }
  }
  const setUiScale = (value: BattleUiScale) => {
    uiScale.value = value;
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* Keep the active preference for this page. */
    }
  };
  return { uiScale, setUiScale };
}
