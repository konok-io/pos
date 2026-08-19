import { openDB, IDBPDatabase } from 'idb';
import type { Product, Category, Customer, Sale } from '../types';

// Use the same database as localDb for consistency
const DB_NAME = 'pos-offline-db';
const DB_VERSION = 6;

interface PendingSale {
  id: string;
  sale: Sale;
  createdAt: string;
}

class OfflineSyncService {
  private db: IDBPDatabase | null = null;

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Products store
        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id' });
        }
        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }
        // Customers store
        if (!db.objectStoreNames.contains('customers')) {
          db.createObjectStore('customers', { keyPath: 'id' });
        }
        // Pending sales store
        if (!db.objectStoreNames.contains('pendingSales')) {
          db.createObjectStore('pendingSales', { keyPath: 'id' });
        }
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        // Transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
      },
    });

    // Load cached data
    return this.db;
  }

  // Products
  async saveProducts(products: Product[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('products', 'readwrite');
    await Promise.all([
      ...products.map(p => tx.store.put(p)),
      tx.done,
    ]);
  }

  async getProducts(): Promise<Product[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('products');
  }

  // Categories
  async saveCategories(categories: Category[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('categories', 'readwrite');
    await Promise.all([
      ...categories.map(c => tx.store.put(c)),
      tx.done,
    ]);
  }

  async getCategories(): Promise<Category[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('categories');
  }

  // Customers
  async saveCustomers(customers: Customer[]) {
    if (!this.db) await this.init();
    const tx = this.db!.transaction('customers', 'readwrite');
    await Promise.all([
      ...customers.map(c => tx.store.put(c)),
      tx.done,
    ]);
  }

  async getCustomers(): Promise<Customer[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('customers');
  }

  // Pending Sales
  async savePendingSale(sale: Sale) {
    if (!this.db) await this.init();
    const pendingSale: PendingSale = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sale: { ...sale, offlineId: `offline_${Date.now()}` },
      createdAt: new Date().toISOString(),
    };
    await this.db!.put('pendingSales', pendingSale);
    return pendingSale;
  }

  async getPendingSales(): Promise<PendingSale[]> {
    if (!this.db) await this.init();
    return this.db!.getAll('pendingSales');
  }

  async deletePendingSale(id: string) {
    if (!this.db) await this.init();
    await this.db!.delete('pendingSales', id);
  }

  async getPendingSaleCount(): Promise<number> {
    if (!this.db) await this.init();
    return this.db!.count('pendingSales');
  }

  // Settings
  async saveSetting(key: string, value: any) {
    if (!this.db) await this.init();
    await this.db!.put('settings', { key, value });
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    if (!this.db) await this.init();
    const setting = await this.db!.get('settings', key);
    return setting?.value;
  }

  async getLastSyncTime(): Promise<string | null> {
    const result = await this.getSetting<string>('lastSyncTime');
    return result ?? null;
  }

  async setLastSyncTime(time: string) {
    await this.saveSetting('lastSyncTime', time);
  }

  // Device ID
  async getDeviceId(): Promise<string> {
    let deviceId = await this.getSetting<string>('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await this.saveSetting('deviceId', deviceId);
    }
    return deviceId;
  }
}

export const offlineSync = new OfflineSyncService();
