export type ImageAssetGroup = 'portraits' | 'avatars' | 'scenes' | 'cg';

export interface PreloadImageAsset {
  url: string;
  label: string;
  group: ImageAssetGroup;
}

export type ImagePreloadStatus = 'idle' | 'restoring' | 'running' | 'paused' | 'complete' | 'partial';

export interface ImagePreloadProgress {
  status: ImagePreloadStatus;
  total: number;
  loaded: number;
  failed: number;
  active: number;
  groups: Array<{ id: ImageAssetGroup; label: string; total: number; loaded: number }>;
  failures: Array<PreloadImageAsset & { reason: string }>;
}

/** A plain subscription bridge: the opening iframe has its own Vue runtime. */
export interface ImagePreloadController {
  snapshot(): ImagePreloadProgress;
  subscribe(listener: (progress: ImagePreloadProgress) => void): () => void;
  start(): Promise<void>;
  pause(): void;
  dispose(): void;
}
