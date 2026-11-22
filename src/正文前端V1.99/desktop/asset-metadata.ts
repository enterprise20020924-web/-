import type { CSSProperties } from 'vue';
import { stageLayoutCssVariables } from '../vector/stage-layout';

// Stage vectors and the original remote choice frames define their own aspect ratios.
export const desktopAssetCssVariables = {
  ...stageLayoutCssVariables,
  '--bp-stage-frame-ratio': '2048 / 1312',
  '--bp-function-ui-ratio': '58 / 272',
  '--bp-character-ui-ratio': '1200 / 700',
  '--bp-choice-frame-ratio': '1637 / 356',
  '--bp-scene-ratio': '16 / 9',
} as CSSProperties;
