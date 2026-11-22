import type { OpeningFrameElement } from './embedded-context';

// Install the Tavern APIs before evaluating the original opening's modules.
const context = (window.frameElement as OpeningFrameElement).__bpOpeningContext!;
try {
  Object.assign(window, context.initialize(window));
  const stopImages = context.bindImageCache?.(window);
  const { mountOpeningPage } = await import('./opening-page');
  const { root, unmount } = mountOpeningPage(context.imagePreloader);
  context.ready(root, () => {
    unmount();
    stopImages?.();
  });
} catch (error) {
  context.failed(error);
  throw error;
}
