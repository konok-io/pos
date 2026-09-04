// HTTP Database Utility for POS - all data lives on the live server (MongoDB via /api).
// getAll/get share ONE in-flight request per collection. put/delete/clear update the
// cache OPTIMISTICALLY (instant UI) and sync to server in the background.

const BASE = '/api';

class Database {
  private cache = new Map<string, Promise<any[]>>();

  private async req(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(BASE + path, init);
    if (!res.ok) throw new Error(`db ${init?.method || "GET"} ${path} ${res.status}`);
    return res;
  }

  getAll<T>(store: string): Promise<T[]> {
    if (!this.cache.has(store)) {
      this.cache.set(store, this.req(`/${encodeURIComponent(store)}`)
        .then(res => res.json())
        .catch(e => { console.error('db.getAll failed', e); return []; }));
    }
    return this.cache.get(store) as Promise<T[]>;
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    try {
      const all = await this.getAll<any>(store);
      const doc = (all || []).find((d: any) => (d.id ?? d.key) === key);
      if (doc && doc.value !== undefined) return doc.value as T;
      return doc as T;
    } catch (e) { console.error('db.get failed', e); return null; }
  }

  // Update cached list without network (called after successful server op)
  private patchCache(store: string, key: string, value: any, remove = false) {
    const prev = this.cache.get(store);
    if (!prev) return;
    const apply = (list: any[]) => {
      const body = remove ? null : ((value && typeof value === 'object') ? { ...value, id: key } : { id: key, value });
      const filterOut = list.filter((d: any) => (d.id ?? d.key) !== key);
      return body ? [...filterOut, body] : filterOut;
    };
    this.cache.set(store, prev.then(apply));
  }

  async put(store: string, key: string, value: any): Promise<void> {
    // Optimistically update cache so UI instant
    this.patchCache(store, key, value, false);
    // Save to server in the background
    try {
      const body = (value && typeof value === 'object') ? { ...value, id: key } : { id: key, value };
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
    } catch (e) {
      console.error('db.put failed', e);
      this.cache.delete(store); // drop optimistic cache on failure
    }
  }

  async delete(store: string, key: string): Promise<void> {
    this.patchCache(store, key, null, true);
    try {
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch (e) {
      console.error('db.delete failed', e);
      this.cache.delete(store);
    }
  }

  async clear(store: string): Promise<void> {
    this.cache.set(store, Promise.resolve([]));
    try {
      await this.req(`/${encodeURIComponent(store)}/clear`, { method: 'POST' });
    } catch (e) {
      console.error('db.clear failed', e);
      this.cache.delete(store);
    }
  }
}

export const db = new Database();
