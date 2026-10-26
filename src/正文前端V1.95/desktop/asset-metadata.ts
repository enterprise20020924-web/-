import type { CSSProperties } from 'vue';
import { stageLayoutCssVariables } from '../vector/stage-layout';

// Vector view boxes define layout; no raster dimensions or remote UI assets.
export const desktopAssetCssVariables = {
  ...stageLayoutCssVariables,
  '--bp-stage-frame-ratio': '2048 / 1312',
  '--bp-function-ui-ratio': '58 / 272',
  '--bp-character-ui-ratio': '1200 / 700',
  '--bp-choice-frame-ratio': '1000 / 180',
  '--bp-scene-ratio': '16 / 9',
} as CSSProperties;
