export interface PortraitLayer {
  id: string;
  src: string;
  fallbackUrls: string[];
}

export type PortraitPreviewSide = 'user' | 'npc';

export interface PortraitPreview {
  src: string;
  label: string;
}

export interface CharacterDetailStatItem {
  label: string;
  value: string;
}

export interface CharacterDetailStatBlock {
  id: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  stats: CharacterDetailStatItem[];
}
