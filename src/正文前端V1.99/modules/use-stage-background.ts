import { computed, ref, watch } from 'vue';
import type { ComputedRef } from 'vue';
import type { MobileStageSceneView } from '../mobile/scene-runtime';
import { defaultStageBackgroundUrl } from '../engine/stage-backgrounds';

/** Desktop GAL, mobile GAL and the chat backdrop share one loading/fallback path. */
export function useStageBackground(sceneView: ComputedRef<MobileStageSceneView>) {
  const urls = ref<string[]>([]);
  const fallbackIndex = ref(0);

  watch(
    () => JSON.stringify([sceneView.value.locationLabel, sceneView.value.backgroundUrls]),
    () => {
      urls.value = sceneView.value.backgroundUrls;
      fallbackIndex.value = 0;
    },
    { immediate: true, flush: 'sync' },
  );

  const stageSceneBackgroundUrl = computed(() => urls.value[fallbackIndex.value] ?? defaultStageBackgroundUrl);
  function handleSceneBackgroundError() {
    if (fallbackIndex.value < urls.value.length - 1) fallbackIndex.value += 1;
  }
  return { stageSceneBackgroundUrl, handleSceneBackgroundError };
}
