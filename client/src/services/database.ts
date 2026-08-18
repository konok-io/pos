/**
 * POS Management System - Database Service
 * PouchDB + CouchDB for offline-first data storage
 */

import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

// Add find plugin
PouchDB.plugin(PouchDBFind);

// Types
export interface Product {
  _id?: string;
  _rev?: string;
  type: 'product';
  name: string;
  categoryId: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  unit: string;
  barcode?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id?: string;
  _rev?: string;
  type: 'category';
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  _id?: string;
  _rev?: string;
  type: 'customer';
  name: string;
  phone: string;
  email?: string;
  address?: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  _id?: string;
  _rev?: string;
  type: 'sale';
  invoiceNo: string;
  date: string;
  customerId?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paid: number;
  due: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  total: number;
}

export interface Setting {
  _id?: string;
  _rev?: string;
  type: 'setting';
  key: string;
  value: string;
}

export type DocType = Product | Category | Customer | Sale | Setting;

// Database instances
const DB_NAME = 'pos_management';
let localDB: PouchDB.Database | null = null;
let remoteDB: PouchDB.Database | null = null;
let syncHandler: PouchDB.Replication.Sync<object> | null = null;

// Server URL - User should set this
let COUCHDB_URL = '';

// Initialize database
export async function initDatabase(): Promise<PouchDB.Database> {
  if (localDB) return localDB;

  localDB = new PouchDB(DB_NAME);

  // Create indexes for better performance
  try {
    await localDB.createIndex({
      index: { fields: ['type'] }
    });
    await localDB.createIndex({
      index: { fields: ['type', 'createdAt'] }
    });
    await localDB.createIndex({
      index: { fields: ['type', 'name'] }
    });
  } catch (e) {
    // Indexes might already exist
  }

  return localDB;
}

// Connect to remote CouchDB server
export async function connectToServer(url: string): Promise<boolean> {
  COUCHDB_URL = url;
  
  try {
    await initDatabase();
    
    remoteDB = new PouchDB(url);
    
    // Test connection
    await remoteDB.info();
    
    // Start live sync
    startSync();
    
    return true;
  } catch (error) {
    console.error('Failed to connect to server:', error);
    return false;
  }
}

// Start synchronization
export function startSync(): void {
  if (!localDB || !remoteDB) return;
  
  if (syncHandler) {
    syncHandler.cancel();
  }
  
  syncHandler = localDB.sync(remoteDB, {
    live: true,
    retry: true
  });
  
  syncHandler.on('change', (info) => {
    console.log('Sync change:', info);
  });
  
  syncHandler.on('paused', (err) => {
    if (err) {
      console.log('Sync paused:', err);
    } else {
      console.log('Sync paused (up to date)');
    }
  });
  
  syncHandler.on('error', (err) => {
    console.error('Sync error:', err);
  });
}

// Stop synchronization
export function stopSync(): void {
  if (syncHandler) {
    syncHandler.cancel();
    syncHandler = null;
  }
}

// Disconnect from server
export function disconnectFromServer(): void {
  stopSync();
  remoteDB = null;
  COUCHDB_URL = '';
}

// Get connection status
export function getConnectionStatus(): { connected: boolean; url: string } {
  return {
    connected: !!remoteDB,
    url: COUCHDB_URL
  };
}

// CRUD Operations

// Products
export async function getProducts(): Promise<Product[]> {
  const db = await initDatabase();
  const result = await db.find({
    selector: { type: 'product' },
    sort: [{ createdAt: 'desc' }]
  });
  return result.docs as Product[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const db = await initDatabase();
  try {
    const doc = await db.get(id);
    return doc as Product;
  } catch {
    return null;
  }
}

export async function addProduct(product: Omit<Product, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const doc: Product = {
    ...product,
    type: 'product',
    createdAt: now,
    updatedAt: now
  };
  const result = await db.put(doc);
  return { ...doc, _id: result.id, _rev: result.rev };
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const db = await initDatabase();
  const doc = await db.get(id) as Product;
  const updated = {
    ...doc,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  const result = await db.put(updated);
  return { ...updated, _rev: result.rev };
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await initDatabase();
  const doc = await db.get(id);
  await db.remove(doc);
}

// Categories
export async function getCategories(): Promise<Category[]> {
  const db = await initDatabase();
  const result = await db.find({
    selector: { type: 'category' },
    sort: [{ createdAt: 'asc' }]
  });
  return result.docs as Category[];
}

export async function addCategory(category: Omit<Category, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const doc: Category = {
    ...category,
    type: 'category',
    createdAt: now,
    updatedAt: now
  };
  const result = await db.put(doc);
  return { ...doc, _id: result.id, _rev: result.rev };
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const db = await initDatabase();
  const doc = await db.get(id) as Category;
  const updated = {
    ...doc,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  const result = await db.put(updated);
  return { ...updated, _rev: result.rev };
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await initDatabase();
  const doc = await db.get(id);
  await db.remove(doc);
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const db = await initDatabase();
  const result = await db.find({
    selector: { type: 'customer' },
    sort: [{ createdAt: 'desc' }]
  });
  return result.docs as Customer[];
}

export async function addCustomer(customer: Omit<Customer, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const doc: Customer = {
    ...customer,
    type: 'customer',
    createdAt: now,
    updatedAt: now
  };
  const result = await db.put(doc);
  return { ...doc, _id: result.id, _rev: result.rev };
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const db = await initDatabase();
  const doc = await db.get(id) as Customer;
  const updated = {
    ...doc,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  const result = await db.put(updated);
  return { ...updated, _rev: result.rev };
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await initDatabase();
  const doc = await db.get(id);
  await db.remove(doc);
}

// Sales
export async function getSales(): Promise<Sale[]> {
  const db = await initDatabase();
  const result = await db.find({
    selector: { type: 'sale' },
    sort: [{ createdAt: 'desc' }]
  });
  return result.docs as Sale[];
}

export async function getSalesByDateRange(startDate: string, endDate: string): Promise<Sale[]> {
  const db = await initDatabase();
  const result = await db.find({
    selector: {
      type: 'sale',
      date: {
        $gte: startDate,
        $lte: endDate
      }
    },
    sort: [{ date: 'desc' }]
  });
  return result.docs as Sale[];
}

export async function addSale(sale: Omit<Sale, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<Sale> {
  const db = await initDatabase();
  const now = new Date().toISOString();
  const doc: Sale = {
    ...sale,
    type: 'sale',
    createdAt: now,
    updatedAt: now
  };
  const result = await db.put(doc);
  return { ...doc, _id: result.id, _rev: result.rev };
}

export async function deleteSale(id: string): Promise<void> {
  const db = await initDatabase();
  const doc = await db.get(id);
  await db.remove(doc);
}

// Settings
export async function getSetting(key: string): Promise<string | null> {
  const db = await initDatabase();
  try {
    const result = await db.find({
      selector: { type: 'setting', key }
    });
    if (result.docs.length > 0) {
      return (result.docs[0] as Setting).value;
    }
  } catch (e) {
    console.error('Error getting setting:', e);
  }
  return null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await initDatabase();
  const result = await db.find({
    selector: { type: 'setting', key }
  });
  
  if (result.docs.length > 0) {
    const doc = result.docs[0] as Setting;
    await db.put({ ...doc, value });
  } else {
    await db.put({ type: 'setting', key, value });
  }
}

// Export all data
export async function exportAllData(): Promise<string> {
  const db = await initDatabase();
  const result = await db.allDocs({ include_docs: true });
  
  const data = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    documents: result.rows
      .filter(row => row.doc && !row.id.startsWith('_'))
      .map(row => row.doc)
  };
  
  return JSON.stringify(data, null, 2);
}

// Import data
export async function importData(jsonString: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.documents || !Array.isArray(data.documents)) {
      return { success: false, message: 'Invalid data format' };
    }
    
    const db = await initDatabase();
    
    for (const doc of data.documents) {
      if (doc._id) {
        try {
          const existing = await db.get(doc._id);
          doc._rev = existing._rev;
        } catch {
          // Document doesn't exist, that's fine
        }
        await db.put(doc);
      }
    }
    
    return { success: true, message: `Imported ${data.documents.length} documents` };
  } catch (error) {
    return { success: false, message: `Import failed: ${error}` };
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  const db = await initDatabase();
  await db.destroy();
  localDB = null;
}

// Get database info
export async function getDatabaseInfo(): Promise<{ docCount: number; updateSeq: number | string }> {
  const db = await initDatabase();
  const info = await db.info();
  return { docCount: info.doc_count, updateSeq: info.update_seq };
}
