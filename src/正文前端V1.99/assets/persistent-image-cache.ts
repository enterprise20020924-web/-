import type { PreloadImageAsset } from './image-preload-types';
import type { PersistentImageStore } from './persistent-image-store';

/** CDN and raw fallbacks for the same repository file share one saved image. */
export function canonicalImageSource(source: string) {
  const url = new URL(source);
  const match = url.pathname.match(/^\/gh\/enterprise20020924-web\/-@main\/(.+)$/);
  if (url.hostname.endsWith('jsdelivr.net') && match) {
    return `https://raw.githubusercontent.com/enterprise20020924-web/-/main/${match[1]}${url.search}`;
  }
  return url.href;
}

export function persistentImageKey(source: string) {
  const canonical = canonicalImageSource(source);
  // Stable 64-bit filename hash. No WebCrypto/secure-context requirement on LAN ST.
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(canonical)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n);
  }
  const extension = new URL(canonical).pathname.match(/\.(png|jpe?g|webp|gif|svg|avif)$/i)?.[1].toLowerCase() ?? 'png';
  return `image-${hash.toString(16).padStart(16, '0')}.${extension}`;
}

export interface ImageAssetResolver {
  handles(source: string): boolean;
  resolve(source: string): Promise<string>;
  peek(source: string): string | undefined;
}

export interface PersistentImageCache extends ImageAssetResolver {
  ready: Promise<void>;
  cachedSources(): Promise<Set<string>>;
  preload(source: string, signal: AbortSignal): Promise<void>;
  dispose(): void;
}

interface CacheDependencies {
  store: Promise<PersistentImageStore>;
  fetchImage(source: string, signal: AbortSignal): Promise<Blob>;
  validateImage(blob: Blob, signal: AbortSignal): Promise<void>;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

export function createPersistentImageCache(assets: PreloadImageAsset[], deps: CacheDependencies): PersistentImageCache {
  const sources = new Map(assets.map(asset => [new URL(asset.url).href, persistentImageKey(asset.url)]));
  const aliases = new Map<string, string[]>();
  for (const [source, key] of sources) aliases.set(key, [...(aliases.get(key) ?? []), source]);
  const saved = new Set<string>();
  const downloads = new Map<string, Promise<void>>();
  const displayed = new Map<string, Promise<string>>();
  const objectUrls = new Map<string, string>();
  const abort = new AbortController();
  let disposed = false;
  const ready = deps.store.then(async store => {
    for (const key of await store.keys()) saved.add(key);
  });
  // A closed opening can leave the shared cache alive; failures are consumed by callers.
  void ready.catch(() => undefined);

  const keyFor = (source: string) => sources.get(new URL(source).href);
  const ensureSaved = async (source: string) => {
    await ready;
    if (disposed) throw new Error('图片缓存已关闭');
    const key = keyFor(source);
    if (!key) throw new Error('图片未在预载清单中');
    if (saved.has(key)) return;
    const existing = downloads.get(key);
    if (existing) return existing;
    const pending = (async () => {
      let image: Blob | undefined;
      let downloadError: unknown;
      for (const candidate of [source, ...aliases.get(key)!.filter(url => url !== source)]) {
        try {
          const downloaded = await deps.fetchImage(candidate, abort.signal);
          if (!downloaded.size) throw new Error('图片内容为空');
          await deps.validateImage(downloaded, abort.signal);
          image = downloaded;
          break;
        } catch (error) {
          downloadError = error;
          if (disposed || abort.signal.aborted) throw error;
        }
      }
      if (!image) throw downloadError;
      if (disposed) throw new Error('图片缓存已关闭');
      await (await deps.store).write(key, image);
      // Only a completed file/transaction makes an image ready.
      saved.add(key);
    })();
    downloads.set(key, pending);
    try {
      await pending;
    } finally {
      downloads.delete(key);
    }
  };
  return {
    ready,
    handles(source) {
      if (!/^https?:\/\//i.test(source)) return false;
      try {
        return sources.has(new URL(source).href);
      } catch {
        return false;
      }
    },
    peek(source) {
      try {
        const key = keyFor(source);
        return key ? objectUrls.get(key) : undefined;
      } catch {
        return undefined;
      }
    },
    async cachedSources() {
      await ready;
      return new Set([...sources].filter(([, key]) => saved.has(key)).map(([source]) => source));
    },
    async preload(source, signal) {
      if (signal.aborted) throw new Error('预载已停止');
      await ensureSaved(source);
    },
    resolve(source) {
      const key = keyFor(source);
      if (!key) return Promise.resolve(source);
      const existing = displayed.get(key);
      if (existing) return existing;
      const pending = (async () => {
        await ensureSaved(source);
        const image = await (await deps.store).read(key);
        if (!image?.size) throw new Error('本地图片文件无法读取');
        if (disposed) throw new Error('图片缓存已关闭');
        const url = deps.createObjectUrl(image);
        objectUrls.set(key, url);
        return url;
      })();
      displayed.set(key, pending);
      void pending.catch(() => displayed.delete(key));
      return pending;
    },
    dispose() {
      disposed = true;
      abort.abort();
      objectUrls.forEach(url => deps.revokeObjectUrl(url));
      objectUrls.clear();
      displayed.clear();
    },
  };
}
