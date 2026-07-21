import type { CSSProperties } from 'vue';

type DesktopAssetFit = 'contain' | 'cover';

type DesktopAssetMetadata = {
  fileName: string;
  width: number;
  height: number;
  fit: DesktopAssetFit;
  anchor: string;
};

export const desktopAssetMetadata = {
  stageFrame: {
    fileName: '背景备选.png',
    width: 2048,
    height: 1312,
    fit: 'contain',
    anchor: 'center',
  },
  functionUi: {
    fileName: '功能UI.png',
    width: 501,
    height: 1961,
    fit: 'contain',
    anchor: 'left top',
  },
  characterUi: {
    fileName: '角色UI.png',
    width: 1672,
    height: 941,
    fit: 'contain',
    anchor: 'center',
  },
  aronaChoice: {
    fileName: '阿洛娜选项.png',
    width: 1637,
    height: 356,
    fit: 'contain',
    anchor: 'center',
  },
  planaChoice: {
    fileName: '普拉娜选项.png',
    width: 1637,
    height: 356,
    fit: 'contain',
    anchor: 'center',
  },
  fallbackScene: {
    fileName: '新学校入口.png',
    width: 1672,
    height: 941,
    fit: 'cover',
    anchor: 'center',
  },
} as const satisfies Record<string, DesktopAssetMetadata>;

export const desktopAssetCssVariables = {
  '--bp-stage-frame-ratio': assetRatio('stageFrame'),
  '--bp-function-ui-ratio': assetRatio('functionUi'),
  '--bp-character-ui-ratio': assetRatio('characterUi'),
  '--bp-choice-frame-ratio': assetRatio('aronaChoice'),
  '--bp-scene-ratio': assetRatio('fallbackScene'),
} as CSSProperties;

function assetRatio(assetKey: keyof typeof desktopAssetMetadata) {
  const asset = desktopAssetMetadata[assetKey];
  return `${asset.width} / ${asset.height}`;
}
