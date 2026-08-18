import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types
export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  invoicePrefix: string;
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  isActive: boolean;
  decimalPlaces: number;
}

export interface StoreCurrency {
  id: string;
  storeId: string;
  currencyId: string;
  rate: number;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  storeId: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  storeId: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit?: string;
  image?: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  storeId: string;
  isActive: boolean;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  storeId: string;
  userId?: string;
  customerId?: string;
  currencyId?: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paid: number;
  change: number;
  paymentMethod: string;
  status: string;
  offlineId?: string;
  deviceId?: string;
  createdAt: string;
  synced: boolean;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: string;
  storeId?: string;
  isActive: boolean;
}

export interface SyncQueue {
  id: string;
  type: 'sale' | 'purchase' | 'sync';
  data: any;
  timestamp: string;
  retries: number;
}

// Database Schema
interface POSDatabase extends DBSchema {
  stores: {
    key: string;
    value: Store;
    indexes: { 'by-code': string };
  };
  currencies: {
    key: string;
    value: Currency;
    indexes: { 'by-code': string };
  };
  storeCurrencies: {
    key: string;
    value: StoreCurrency;
    indexes: { 'by-store': string };
  };
  categories: {
    key: string;
    value: Category;
    indexes: { 'by-store': string };
  };
  products: {
    key: string;
    value: Product;
    indexes: { 'by-store': string; 'by-code': string; 'by-category': string };
  };
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-store': string };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-store': string; 'by-date': string; 'by-synced': number };
  };
  saleItems: {
    key: string;
    value: SaleItem;
    indexes: { 'by-sale': string };
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-email': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueue;
    indexes: { 'by-timestamp': string };
  };
  settings: {
    key: string;
    value: { key: string; value: any };
  };
}

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 4;

let db: IDBPDatabase<POSDatabase> | null = null;

export async function initDatabase(): Promise<IDBPDatabase<POSDatabase>> {
  if (db) return db;

  db = await openDB<POSDatabase>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Stores
      if (!database.objectStoreNames.contains('stores')) {
        const store = database.createObjectStore('stores', { keyPath: 'id' });
        store.createIndex('by-code', 'code');
      }

      // Currencies
      if (!database.objectStoreNames.contains('currencies')) {
        const store = database.createObjectStore('currencies', { keyPath: 'id' });
        store.createIndex('by-code', 'code');
      }

      // Store Currencies
      if (!database.objectStoreNames.contains('storeCurrencies')) {
        const store = database.createObjectStore('storeCurrencies', { keyPath: 'id' });
        store.createIndex('by-store', 'storeId');
      }

      // Categories
      if (!database.objectStoreNames.contains('categories')) {
        const store = database.createObjectStore('categories', { keyPath: 'id' });
        store.createIndex('by-store', 'storeId');
      }

      // Products
      if (!database.objectStoreNames.contains('products')) {
        const store = database.createObjectStore('products', { keyPath: 'id' });
        store.createIndex('by-store', 'storeId');
        store.createIndex('by-code', 'code');
        store.createIndex('by-category', 'categoryId');
      }

      // Customers
      if (!database.objectStoreNames.contains('customers')) {
        const store = database.createObjectStore('customers', { keyPath: 'id' });
        store.createIndex('by-store', 'storeId');
      }

      // Sales
      if (!database.objectStoreNames.contains('sales')) {
        const store = database.createObjectStore('sales', { keyPath: 'id' });
        store.createIndex('by-store', 'storeId');
        store.createIndex('by-date', 'createdAt');
        store.createIndex('by-synced', 'synced');
      }

      // Sale Items
      if (!database.objectStoreNames.contains('saleItems')) {
        const store = database.createObjectStore('saleItems', { keyPath: 'id' });
        store.createIndex('by-sale', 'saleId');
      }

      // Users
      if (!database.objectStoreNames.contains('users')) {
        const store = database.createObjectStore('users', { keyPath: 'id' });
        store.createIndex('by-email', 'email');
      }

      // Sync Queue
      if (!database.objectStoreNames.contains('syncQueue')) {
        const store = database.createObjectStore('syncQueue', { keyPath: 'id' });
        store.createIndex('by-timestamp', 'timestamp');
      }

      // Settings
      if (!database.objectStoreNames.contains('settings')) {
        database.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });

  return db;
}

// Generic CRUD operations
export const localDb = {
  // Stores
  async getStores(): Promise<Store[]> {
    const database = await initDatabase();
    return database.getAll('stores');
  },
  async getStore(id: string): Promise<Store | undefined> {
    const database = await initDatabase();
    return database.get('stores', id);
  },
  async getStoreByCode(code: string): Promise<Store | undefined> {
    const database = await initDatabase();
    return database.getFromIndex('stores', 'by-code', code);
  },
  async saveStore(store: Store): Promise<void> {
    const database = await initDatabase();
    await database.put('stores', store);
  },
  async saveStores(stores: Store[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('stores', 'readwrite');
    await Promise.all([...stores.map(s => tx.store.put(s)), tx.done]);
  },

  // Currencies
  async getCurrencies(): Promise<Currency[]> {
    const database = await initDatabase();
    return database.getAll('currencies');
  },
  async getCurrency(id: string): Promise<Currency | undefined> {
    const database = await initDatabase();
    return database.get('currencies', id);
  },
  async saveCurrency(currency: Currency): Promise<void> {
    const database = await initDatabase();
    await database.put('currencies', currency);
  },
  async saveCurrencies(currencies: Currency[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('currencies', 'readwrite');
    await Promise.all([...currencies.map(c => tx.store.put(c)), tx.done]);
  },

  // Store Currencies
  async getStoreCurrencies(storeId: string): Promise<StoreCurrency[]> {
    const database = await initDatabase();
    return database.getAllFromIndex('storeCurrencies', 'by-store', storeId);
  },
  async saveStoreCurrency(sc: StoreCurrency): Promise<void> {
    const database = await initDatabase();
    await database.put('storeCurrencies', sc);
  },

  // Categories
  async getCategories(storeId?: string): Promise<Category[]> {
    const database = await initDatabase();
    if (storeId) {
      return database.getAllFromIndex('categories', 'by-store', storeId);
    }
    return database.getAll('categories');
  },
  async saveCategory(category: Category): Promise<void> {
    const database = await initDatabase();
    await database.put('categories', category);
  },
  async saveCategories(categories: Category[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('categories', 'readwrite');
    await Promise.all([...categories.map(c => tx.store.put(c)), tx.done]);
  },

  // Products
  async getProducts(storeId?: string): Promise<Product[]> {
    const database = await initDatabase();
    if (storeId) {
      return database.getAllFromIndex('products', 'by-store', storeId);
    }
    return database.getAll('products');
  },
  async getProduct(id: string): Promise<Product | undefined> {
    const database = await initDatabase();
    return database.get('products', id);
  },
  async getProductByCode(code: string): Promise<Product | undefined> {
    const database = await initDatabase();
    return database.getFromIndex('products', 'by-code', code);
  },
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const database = await initDatabase();
    return database.getAllFromIndex('products', 'by-category', categoryId);
  },
  async saveProduct(product: Product): Promise<void> {
    const database = await initDatabase();
    await database.put('products', product);
  },
  async saveProducts(products: Product[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('products', 'readwrite');
    await Promise.all([...products.map(p => tx.store.put(p)), tx.done]);
  },
  async updateProductStock(productId: string, newStock: number): Promise<void> {
    const database = await initDatabase();
    const product = await database.get('products', productId);
    if (product) {
      product.stock = newStock;
      await database.put('products', product);
    }
  },

  // Customers
  async getCustomers(storeId?: string): Promise<Customer[]> {
    const database = await initDatabase();
    if (storeId) {
      return database.getAllFromIndex('customers', 'by-store', storeId);
    }
    return database.getAll('customers');
  },
  async getCustomer(id: string): Promise<Customer | undefined> {
    const database = await initDatabase();
    return database.get('customers', id);
  },
  async saveCustomer(customer: Customer): Promise<void> {
    const database = await initDatabase();
    await database.put('customers', customer);
  },

  // Sales
  async getSales(storeId?: string): Promise<Sale[]> {
    const database = await initDatabase();
    if (storeId) {
      return database.getAllFromIndex('sales', 'by-store', storeId);
    }
    return database.getAll('sales');
  },
  async getUnsyncedSales(): Promise<Sale[]> {
    const database = await initDatabase();
    return database.getAllFromIndex('sales', 'by-synced', 0);
  },
  async getSale(id: string): Promise<Sale | undefined> {
    const database = await initDatabase();
    return database.get('sales', id);
  },
  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    const database = await initDatabase();
    return database.getAllFromIndex('saleItems', 'by-sale', saleId);
  },
  async saveSale(sale: Sale): Promise<void> {
    const database = await initDatabase();
    await database.put('sales', sale);
  },
  async saveSaleWithItems(sale: Sale, items: SaleItem[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction(['sales', 'saleItems', 'products'], 'readwrite');
    
    // Save sale
    await tx.objectStore('sales').put(sale);
    
    // Delete old items
    const oldItems = await tx.objectStore('saleItems').index('by-sale').getAllKeys(sale.id);
    for (const key of oldItems) {
      await tx.objectStore('saleItems').delete(key);
    }
    
    // Save new items and update stock
    for (const item of items) {
      await tx.objectStore('saleItems').put(item);
      
      // Update product stock
      const product = await tx.objectStore('products').get(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.quantity);
        await tx.objectStore('products').put(product);
      }
    }
    
    await tx.done;
  },
  async markSaleSynced(id: string): Promise<void> {
    const database = await initDatabase();
    const sale = await database.get('sales', id);
    if (sale) {
      sale.synced = true;
      await database.put('sales', sale);
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    const database = await initDatabase();
    return database.getAll('users');
  },
  async getUser(id: string): Promise<User | undefined> {
    const database = await initDatabase();
    return database.get('users', id);
  },
  async getUserByEmail(email: string): Promise<User | undefined> {
    const database = await initDatabase();
    return database.getFromIndex('users', 'by-email', email);
  },
  async saveUser(user: User): Promise<void> {
    const database = await initDatabase();
    await database.put('users', user);
  },
  async saveUsers(users: User[]): Promise<void> {
    const database = await initDatabase();
    const tx = database.transaction('users', 'readwrite');
    await Promise.all([...users.map(u => tx.store.put(u)), tx.done]);
  },

  // Settings
  async getSetting<T>(key: string): Promise<T | undefined> {
    const database = await initDatabase();
    const setting = await database.get('settings', key);
    return setting?.value as T | undefined;
  },
  async saveSetting<T>(key: string, value: T): Promise<void> {
    const database = await initDatabase();
    await database.put('settings', { key, value });
  },

  // Sync Queue
  async addToSyncQueue(item: SyncQueue): Promise<void> {
    const database = await initDatabase();
    await database.put('syncQueue', item);
  },
  async getSyncQueue(): Promise<SyncQueue[]> {
    const database = await initDatabase();
    return database.getAll('syncQueue');
  },
  async removeFromSyncQueue(id: string): Promise<void> {
    const database = await initDatabase();
    await database.delete('syncQueue', id);
  },
  async clearSyncQueue(): Promise<void> {
    const database = await initDatabase();
    await database.clear('syncQueue');
  },

  // Clear all data
  async clearAll(): Promise<void> {
    const database = await initDatabase();
    const stores = ['stores', 'currencies', 'storeCurrencies', 'categories', 
                     'products', 'customers', 'sales', 'saleItems', 'users', 
                     'syncQueue', 'settings'] as const;
    for (const storeName of stores) {
      await database.clear(storeName);
    }
  },
};

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// Generate invoice number
export function generateInvoiceNo(prefix: string = 'INV'): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${dateStr}-${random}`;
}
