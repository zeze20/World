/**
 * Controlled client-side cache for search results and layer metadata.
 * Imagery tiles are primarily handled by the browser HTTP cache + Cesium;
 * this module adds an IndexedDB layer for durable offline-friendly data
 * with LRU eviction and size limits.
 */

const DB_NAME = "aetherglobe-cache";
const DB_VERSION = 1;
const STORE = "entries";
const MAX_ENTRIES = 200;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  size: number;
  createdAt: number;
  lastAccess: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("lastAccess", "lastAccess");
      }
    };
  });
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) {
          resolve(null);
          return;
        }
        if (Date.now() - entry.createdAt > MAX_AGE_MS) {
          store.delete(key);
          resolve(null);
          return;
        }
        entry.lastAccess = Date.now();
        store.put(entry);
        resolve(entry.value);
      };
    });
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    const size = JSON.stringify(value).length;
    const entry: CacheEntry<T> = {
      key,
      value,
      size,
      createdAt: Date.now(),
      lastAccess: Date.now(),
    };
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await evictIfNeeded(db);
  } catch {
    // private mode / quota – ignore
  }
}

async function evictIfNeeded(db: IDBDatabase): Promise<void> {
  const all = await new Promise<CacheEntry[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as CacheEntry[]);
    req.onerror = () => reject(req.error);
  });
  if (all.length <= MAX_ENTRIES) return;

  all.sort((a, b) => a.lastAccess - b.lastAccess);
  const toRemove = all.slice(0, all.length - MAX_ENTRIES);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const e of toRemove) store.delete(e.key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function cacheClear(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // ignore
  }
}

export async function cacheStats(): Promise<{ count: number }> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).count();
      req.onsuccess = () => resolve({ count: req.result });
      req.onerror = () => reject(req.error);
    });
  } catch {
    return { count: 0 };
  }
}
