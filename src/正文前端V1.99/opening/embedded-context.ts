import type { ImagePreloadController } from '../assets/image-preload-types';

export interface EmbeddedOpeningContext {
  bindImageCache?: (target: Window) => () => void;
  imagePreloader: ImagePreloadController;
  initialize: (target: Window) => Record<string, unknown>;
  ready: (root: HTMLElement, unmount: () => void) => void;
  failed: (error: unknown) => void;
}

export type OpeningFrameElement = HTMLIFrameElement & { __bpOpeningContext?: EmbeddedOpeningContext };
