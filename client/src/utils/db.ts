// HTTP Database Utility for POS - all data lives on the live server (MongoDB via /api).

const BASE = '/api';

class Database {
  private async req(path: string, init?: RequestInit): Promise<Response> {
    const res = await fetch(BASE + path, init);
    if (!res.ok) throw new Error(`db ${init?.method || "GET"} ${path} ${res.status}`);
    return res;
  }

  async get<T>(store: string, key: string): Promise<T | null> {
    try {
      const all = await this.getAll<any>(store);
      const doc = (all || []).find((d: any) => (d.id ?? d.key) === key);
      if (doc && doc.value !== undefined) return doc.value as T;
      return doc as T;
    } catch (e) { console.error('db.get failed', e); return null; }
  }

  async getAll<T>(store: string): Promise<T[]> {
    try {
      const res = await this.req(`/${encodeURIComponent(store)}`);
      return (await res.json()) as T[];
    } catch (e) { console.error('db.getAll failed', e); return []; }
  }

  async put(store: string, key: string, value: any): Promise<void> {
    try {
      const body = (value && typeof value === 'object') ? { ...value, id: key } : { id: key, value };
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
    } catch (e) { console.error('db.put failed', e); throw e; }
  }

  async delete(store: string, key: string): Promise<void> {
    try {
      await this.req(`/${encodeURIComponent(store)}/${encodeURIComponent(key)}`, { method: 'DELETE' });
    } catch (e) { console.error('db.delete failed', e); throw e; }
  }

  async clear(store: string): Promise<void> {
    try {
      await this.req(`/${encodeURIComponent(store)}/clear`, { method: 'POST' });
    } catch (e) { console.error('db.clear failed', e); throw e; }
  }
}

export const db = new Database();
