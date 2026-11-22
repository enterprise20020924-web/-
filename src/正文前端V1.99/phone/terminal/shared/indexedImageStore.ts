const DB_NAME = 'fatria-image-store';
const DB_VERSION = 1;
const STORE_NAME = 'images';
const INDEXED_IMAGE_REF_PREFIX = 'idb://fatria-image/';

interface StoredImageRecord {
  key: string;
  blob: Blob;
  contentType: string;
  updatedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getIndexedDb(): IDBFactory {
  const factory = globalThis.indexedDB;
  if (!factory) {
    throw new Error('IndexedDB is not available');
  }
  return factory;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'));
  });
}

function openImageDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = getIndexedDb().open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('IndexedDB open failed'));
    };
    request.onblocked = () => {
      dbPromise = null;
      reject(new Error('IndexedDB open was blocked'));
    };
  });

  return dbPromise;
}

async function withImageStore<T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openImageDb();
  const transaction = db.transaction(STORE_NAME, mode);
  return requestToPromise(callback(transaction.objectStore(STORE_NAME)));
}

function imageRefToKey(ref: string): string {
  if (!isIndexedImageRef(ref)) {
    throw new Error('Invalid IndexedDB image reference');
  }
  return decodeURIComponent(ref.slice(INDEXED_IMAGE_REF_PREFIX.length));
}

export function makeIndexedImageRef(key: string): string {
  return `${INDEXED_IMAGE_REF_PREFIX}${encodeURIComponent(key)}`;
}

export function isIndexedImageRef(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith(INDEXED_IMAGE_REF_PREFIX);
}

export function isDataImageUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^data:image\//i.test(value.trim());
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  if (!response.ok) {
    throw new Error('Failed to convert data URL to Blob');
  }
  return response.blob();
}

export async function saveIndexedImageBlob(ref: string, blob: Blob): Promise<void> {
  const key = imageRefToKey(ref);
  const record: StoredImageRecord = {
    key,
    blob,
    contentType: blob.type || 'application/octet-stream',
    updatedAt: Date.now(),
  };
  await withImageStore('readwrite', store => store.put(record));
}

export async function saveIndexedImageDataUrl(ref: string, dataUrl: string): Promise<void> {
  await saveIndexedImageBlob(ref, await dataUrlToBlob(dataUrl));
}

export async function getIndexedImageBlob(ref: string): Promise<Blob | null> {
  const key = imageRefToKey(ref);
  const record = await withImageStore<StoredImageRecord | undefined>('readonly', store => store.get(key));
  return record?.blob ?? null;
}

export async function getIndexedImageObjectUrl(ref: string): Promise<string | null> {
  const blob = await getIndexedImageBlob(ref);
  return blob ? URL.createObjectURL(blob) : null;
}

export async function deleteIndexedImage(ref: string): Promise<void> {
  if (!isIndexedImageRef(ref)) return;
  const key = imageRefToKey(ref);
  await withImageStore('readwrite', store => store.delete(key));
}

export function revokeIndexedImageObjectUrl(url: string | null | undefined): void {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
