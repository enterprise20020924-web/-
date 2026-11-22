import type {
  ImageAssetGroup,
  ImagePreloadController,
  ImagePreloadProgress,
  ImagePreloadStatus,
  PreloadImageAsset,
} from './image-preload-types';

const GROUP_LABELS: Record<ImageAssetGroup, string> = {
  portraits: '角色立绘',
  avatars: '人物头像',
  scenes: '校园场景',
  cg: '战斗 CG',
};
type AssetState = { asset: PreloadImageAsset; status: 'pending' | 'loading' | 'loaded' | 'failed'; reason: string };
export type ImageAssetLoader = (url: string, signal: AbortSignal) => Promise<void>;

/** Warm normal <img> requests, so all existing frames reuse the HTTP image cache. */
export function createBrowserImageLoader(host: Window & typeof globalThis, timeoutMs = 45_000): ImageAssetLoader {
  // Keep a bounded decoded working set; the full collection remains in the HTTP cache.
  const decodedImages = new Map<string, HTMLImageElement>();
  const decodedBudget = 96 * 1024 * 1024;
  let decodedBytes = 0;

  return (url, signal) =>
    new Promise<void>((resolve, reject) => {
      const image = new host.Image();
      let settled = false;
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        host.clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        image.onload = null;
        image.onerror = null;
        if (error) {
          image.removeAttribute('src');
          reject(error);
          return;
        }
        decodedImages.set(url, image);
        decodedBytes += image.naturalWidth * image.naturalHeight * 4;
        while (decodedBytes > decodedBudget && decodedImages.size > 0) {
          const [key, oldest] = decodedImages.entries().next().value!;
          decodedBytes -= oldest.naturalWidth * oldest.naturalHeight * 4;
          decodedImages.delete(key);
        }
        resolve();
      };
      const abort = () => finish(new Error('预载已停止'));
      const timer = host.setTimeout(() => finish(new Error('加载超时')), timeoutMs);
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });
      image.decoding = 'async';
      image.loading = 'eager';
      image.onload = async () => {
        if (!image.naturalWidth) return finish(new Error('图片无法读取'));
        try {
          await image.decode();
          finish();
        } catch {
          finish(new Error('图片解码失败'));
        }
      };
      image.onerror = () => finish(new Error('图片地址暂时无法加载'));
      // Deliberately keep the consumer's exact URL and request mode: no cache-busting,
      // crossOrigin, isolated CacheStorage, or blob URL that the real <img> would miss.
      image.src = url;
    });
}

export function createImagePreloader(
  assets: PreloadImageAsset[],
  load: ImageAssetLoader,
  concurrency = 6,
  restore?: () => Promise<Set<string>>,
): ImagePreloadController {
  const states: AssetState[] = [...new Map(assets.map(asset => [new URL(asset.url).href, asset])).values()].map(
    asset => ({ asset, status: 'pending', reason: '' }),
  );
  const listeners = new Set<(progress: ImagePreloadProgress) => void>();
  const abort = new AbortController();
  let status: ImagePreloadStatus = 'idle';
  let runPromise: Promise<void> | undefined;
  let disposed = false;
  let restored = !restore;

  const snapshot = (): ImagePreloadProgress => ({
    status,
    total: states.length,
    loaded: states.filter(state => state.status === 'loaded').length,
    failed: states.filter(state => state.status === 'failed').length,
    active: states.filter(state => state.status === 'loading').length,
    groups: (Object.keys(GROUP_LABELS) as ImageAssetGroup[]).map(id => ({
      id,
      label: GROUP_LABELS[id],
      total: states.filter(state => state.asset.group === id).length,
      loaded: states.filter(state => state.asset.group === id && state.status === 'loaded').length,
    })),
    failures: states.filter(state => state.status === 'failed').map(({ asset, reason }) => ({ ...asset, reason })),
  });
  const emit = () => {
    const progress = snapshot();
    listeners.forEach(listener => listener(progress));
  };
  const worker = async () => {
    while (!disposed && status === 'running') {
      const next = states.find(state => state.status === 'pending');
      if (!next) return;
      next.status = 'loading';
      emit();
      try {
        await load(next.asset.url, abort.signal);
        next.status = 'loaded';
      } catch (error) {
        next.status = 'failed';
        next.reason = error instanceof Error ? error.message : String(error);
      }
      if (!disposed) emit();
    }
  };
  return {
    snapshot,
    subscribe(listener) {
      if (disposed) return () => {};
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    start() {
      if (disposed || status === 'complete') return Promise.resolve();
      if (status === 'running' || status === 'restoring') return runPromise!;
      states
        .filter(state => state.status === 'failed')
        .forEach(state => {
          state.status = 'pending';
          state.reason = '';
        });
      status = restored ? 'running' : 'restoring';
      emit();
      if (runPromise) return runPromise;
      runPromise = (async () => {
        if (!restored) {
          try {
            const cached = await restore!();
            if (disposed) return;
            for (const state of states) if (cached.has(new URL(state.asset.url).href)) state.status = 'loaded';
            restored = true;
          } catch (error) {
            if (disposed) return;
            for (const state of states) {
              if (state.status === 'pending') {
                state.status = 'failed';
                state.reason = error instanceof Error ? error.message : String(error);
              }
            }
            status = 'partial';
            emit();
            return;
          }
        }
        if (disposed) return;
        if (snapshot().status === 'paused') {
          emit();
          return;
        }
        status = 'running';
        emit();
        await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), states.length) }, worker));
        if (disposed) return;
        if (states.every(state => state.status === 'loaded')) status = 'complete';
        else if (status === 'running') status = 'partial';
        emit();
      })().finally(() => {
        runPromise = undefined;
      });
      return runPromise;
    },
    pause() {
      if (status !== 'running' && status !== 'restoring') return;
      status = 'paused';
      emit();
    },
    dispose() {
      disposed = true;
      status = 'paused';
      listeners.clear();
      abort.abort();
    },
  };
}
