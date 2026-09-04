// HTTP Database Utility for POS - all data lives on the live server (MongoDB via /api).
// getAll/get go through an in-memory promise cache, so sequential reads on
// one collection share ONE HTTP request; put/delete/clear invalidate it.

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

  private evict(store: string) { this.cache.delete(store); }

  async put(store: string, key: string, value: any): Promise<void> {
    try {
      const body = (value && typeof value === 'object') ? { ...value, id: key } : { id: key, value };
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }).then(() => this.evict(store));
    } catch (e) { console.error('db.put failed', e); throw e; }
  }

  async delete(store: string, key: string): Promise<void> {
    try {
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, { method: 'DELETE' })
        .then(() => this.evict(store));
    } catch (e) { console.error('db.delete failed', e); throw e; }
  }

  async clear(store: string): Promise<void> {
    try {
      await this.req(`/${encodeURIComponent(store)}/clear`, { method: 'POST' })
        .then(() => this.evict(store));
    } catch (e) { console.error('db.clear failed', e); throw e; }
  }
}

export const db = new Database();
