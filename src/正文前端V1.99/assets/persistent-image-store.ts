export const IMAGE_CACHE_NAMESPACE = 'amami-image-cache';
export const IMAGE_CACHE_TABLE = 'images';
export const BROWSER_IMAGE_CACHE_DB = 'amami-image-cache-v1';

export interface PersistentImageStore {
  kind: 'browser' | 'tauritavern';
  location: string;
  keys(): Promise<string[]>;
  read(key: string): Promise<Blob | undefined>;
  write(key: string, image: Blob): Promise<void>;
}

export interface TauriImageBlobStore {
  listBlobKeys(options: { namespace: string; table: string }): Promise<string[]>;
  getBlob(options: { namespace: string; table: string; key: string }): Promise<Blob>;
  setBlob(options: { namespace: string; table: string; key: string; data: Uint8Array }): Promise<void>;
}

export type ImageCacheHost = Window &
  typeof globalThis & {
    __TAURI_RUNNING__?: boolean;
    __TAURI__?: unknown;
    __TAURITAVERN_MAIN_READY__?: Promise<void>;
    __TAURITAVERN__?: {
      ready?: Promise<void>;
      api?: { extension?: { store?: TauriImageBlobStore } };
    };
  };

/** Native files in TT's own data root, independent of the WebView's browser cache. */
export function createTauriImageStore(api: TauriImageBlobStore): PersistentImageStore {
  const options = { namespace: IMAGE_CACHE_NAMESPACE, table: IMAGE_CACHE_TABLE };
  return {
    kind: 'tauritavern',
    location: `data/_tauritavern/extension-store/${IMAGE_CACHE_NAMESPACE}/blobs/${IMAGE_CACHE_TABLE}/`,
    keys: () => api.listBlobKeys(options),
    read: key => api.getBlob({ ...options, key }),
    write: async (key, image) => {
      // A byte view works across the script/host realms; instanceof Blob does not.
      await api.setBlob({ ...options, key, data: new Uint8Array(await image.arrayBuffer()) });
    },
  };
}

/** ST keeps image bytes in the browser's persistent origin storage. */
export function createBrowserImageStore(factory: IDBFactory): PersistentImageStore {
  let database: Promise<IDBDatabase> | undefined;
  const open = () =>
    (database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(BROWSER_IMAGE_CACHE_DB, 1);
      request.onupgradeneeded = () => request.result.createObjectStore('images', { keyPath: 'key' });
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => {
        database = undefined;
        reject(request.error);
      };
    }));
  const run = async <T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('images', mode);
      const request = operation(transaction.objectStore('images'));
      let result: T;
      request.onsuccess = () => {
        result = request.result;
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error ?? request.error);
      transaction.onabort = () => reject(transaction.error ?? new Error('图片缓存写入中断'));
    });
  };
  return {
    kind: 'browser',
    location: `IndexedDB: ${BROWSER_IMAGE_CACHE_DB}/images`,
    keys: async () => (await run('readonly', store => store.getAllKeys())).map(String),
    read: async key => (await run('readonly', store => store.get(key)))?.blob,
    write: async (key, blob) => {
      await run('readwrite', store => store.put({ key, blob }));
    },
  };
}

export async function selectPersistentImageStore(host: ImageCacheHost): Promise<PersistentImageStore> {
  const native = host.__TAURITAVERN__;
  const isTauri = Boolean(
    native || host.__TAURI_RUNNING__ || host.__TAURI__ || host.location.hostname === 'tauri.localhost',
  );
  if (isTauri) {
    await (native?.ready ?? host.__TAURITAVERN_MAIN_READY__);
    const api = host.__TAURITAVERN__?.api?.extension?.store;
    if (!api?.listBlobKeys || !api.getBlob || !api.setBlob) throw new Error('TT 本地图片存储接口不可用');
    return createTauriImageStore(api);
  }
  return createBrowserImageStore(host.indexedDB);
}
