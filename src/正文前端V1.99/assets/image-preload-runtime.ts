import { collectForkImageAssets } from './image-preload-manifest';
import { createBrowserImageLoader, createImagePreloader } from './image-preloader';
import type { ImagePreloadController } from './image-preload-types';
import { createPersistentImageCache, type PersistentImageCache } from './persistent-image-cache';
import { selectPersistentImageStore, type ImageCacheHost } from './persistent-image-store';
import { bindCachedImages } from './image-cache-bindings';

let controller: ImagePreloadController | undefined;
let cache: PersistentImageCache | undefined;
let cacheHost: ImageCacheHost | undefined;
const bindings = new Map<Window, { document: Document; stop: () => void }>();

function getForkImageCache(host?: Window): PersistentImageCache {
  if (cache) return cache;
  const owner = (host ?? cacheHost ?? window) as ImageCacheHost;
  cacheHost = owner;
  const store = selectPersistentImageStore(owner);
  const validate = createBrowserImageLoader(owner);
  cache = createPersistentImageCache(collectForkImageAssets(), {
    store,
    async fetchImage(source, signal) {
      const request = new AbortController();
      const onAbort = () => request.abort();
      signal.addEventListener('abort', onAbort, { once: true });
      const timer = owner.setTimeout(onAbort, 45_000);
      try {
        if (signal.aborted) request.abort();
        const response = await owner.fetch(source, { signal: request.signal, cache: 'force-cache' });
        if (!response.ok) throw new Error(`图片下载失败：HTTP ${response.status}`);
        return await response.blob();
      } finally {
        owner.clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
      }
    },
    async validateImage(image, signal) {
      const url = owner.URL.createObjectURL(image);
      try {
        await validate(url, signal);
      } finally {
        owner.URL.revokeObjectURL(url);
      }
    },
    createObjectUrl: image => owner.URL.createObjectURL(image),
    revokeObjectUrl: url => owner.URL.revokeObjectURL(url),
  });
  void store.then(value => console.info(`[图片缓存] ${value.kind}: ${value.location}`)).catch(() => undefined);
  return cache;
}

export function bindForkImageCache(target: Window, host?: Window): () => void {
  const current = bindings.get(target);
  if (current?.document === target.document) return current.stop;
  current?.stop();
  const stopImages = bindCachedImages(target, getForkImageCache(host));
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    target.removeEventListener('pagehide', stop);
    stopImages();
    bindings.delete(target);
  };
  bindings.set(target, { document: target.document, stop });
  target.addEventListener('pagehide', stop, { once: true });
  return stop;
}

/** Owned by the script, so changing admission steps or unmounting its frame does not stop a run. */
export function getForkImagePreloader(host: Window): ImagePreloadController {
  const images = getForkImageCache(host);
  controller ??= createImagePreloader(collectForkImageAssets(), images.preload, 6, images.cachedSources);
  return controller;
}

export function disposeForkImagePreloader() {
  controller?.dispose();
  controller = undefined;
  bindings.forEach(binding => binding.stop());
  cache?.dispose();
  cache = undefined;
  cacheHost = undefined;
}
