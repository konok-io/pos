// HTTP-backed data service (replaces IndexedDB localDb).
export interface Store { id: string; name: string; code: string; address?: string; phone?: string; email?: string; isActive: boolean; invoicePrefix: string; }
export interface Currency { id: string; name: string; code: string; symbol: string; exchangeRate: number; isBase: boolean; decimalPlaces: number; }
export interface StoreCurrency { id: string; _storeId: string; currencyId: string; rate: number; isDefault?: boolean; }
export interface Category { id: string; name: string; _storeId?: string; }
export interface Product { id: string; name: string; sku?: string; code?: string; barcode?: string; categoryId?: string; _storeId: string; costPrice: number; sellPrice: number; stock: number; unit?: string; image?: string; isActive: boolean; }
export interface Customer { id: string; name: string; phone?: string; email?: string; address?: string; balance: number; _storeId: string; isActive: boolean; isSystem?: boolean; }
export interface Sale { id: string; invoiceNo: string; _storeId: string; userId?: string; _customerId?: string; currencyId?: string; subtotal: number; discount: number; vat: number; total: number; paid: number; change: number; paymentMethod: string; status: string; offlineId?: string; deviceId?: string; createdAt: string; synced: boolean; }
export interface SaleItem { id: string; saleId: string; productId: string; productName: string; quantity: number; unitPrice: number; total: number; }
export interface User { id: string; name: string; email: string; password?: string; phone?: string; role: string; _storeId?: string; isActive: boolean; }
export interface SyncQueue { id: string; type: string; data: any; timestamp: string; retries: number; }

export function generateId(): string {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
export function generateInvoiceNo(sequence: number): string {
  return `INV-${sequence.toString().padStart(4, '0')}`;
}

const BASE = '/api';

class LocalDb {
  private async req(path: string, init?: RequestInit) {
    const res = await fetch(BASE + path, init);
    if (!res.ok) throw new Error(`localDb ${init?.method || 'GET'} ${path} ${res.status}`);
    return res;
  }
  private async list(col: string): Promise<any[]> {
    const res = await this.req(`/${col}`);
    return res.json();
  }
  private async save(col: string, doc: any): Promise<void> {
    await this.req(`/${col}/${encodeURIComponent(doc.id)}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(doc)
    });
  }

  async getStores() { return this.list('settings') as Promise<Store[]>; }
  async getStore(id: string) { return (await this.list('settings')).find((s: any) => s.id === id); }
  async saveStore(store: Store) { await this.save('settings', store); }
  async getStoreByCode(code: string) { return (await this.list('settings')).find((s: any) => s.code === code); }
  async saveStores(stores: Store[]) { for (const s of stores) await this.save('settings', s); }

  async getCurrencies() { return this.list('settings') as Promise<Currency[]>; }
  async getCurrency(id: string) { return (await this.list('settings')).find((c: any) => c.id === id); }
  async saveCurrency(c: Currency) { await this.save('settings', c); }
  async saveCurrencies(currencies: Currency[]) { for (const c of currencies) await this.save('settings', c); }

  async getStoreCurrencies(_storeId: string) { return this.list('settings') as Promise<StoreCurrency[]>; }
  async saveStoreCurrency(sc: StoreCurrency) { await this.save('settings', sc); }

  async getCategories(_storeId?: string) { return this.list('categories') as Promise<Category[]>; }
  async saveCategory(c: Category) { await this.save('categories', c); }
  async saveCategories(cats: Category[]) { for (const c of cats) await this.save('categories', c); }

  async getProducts(_storeId?: string) { return this.list('products') as Promise<Product[]>; }
  async getProduct(id: string) { return (await this.list('products')).find((p: any) => p.id === id); }
  async getProductByCode(code: string) { return (await this.list('products')).find((p: any) => p.sku === code || p.code === code); }
  async getProductsByCategory(categoryId: string) { return (await this.list('products')).filter((p: any) => p.categoryId === categoryId); }
  async saveProduct(p: Product) { await this.save('products', p); }
  async saveProducts(ps: Product[]) { for (const p of ps) await this.save('products', p); }
  async updateProductStock(productId: string, newStock: number) {
    const p = await this.getProduct(productId);
    if (p) { p.stock = newStock; await this.save('products', p); }
  }

  async getCustomers(_storeId?: string) { return this.list('customers') as Promise<Customer[]>; }
  async getCustomer(id: string) { return (await this.list('customers')).find((c: any) => c.id === id); }
  async saveCustomer(c: Customer) { await this.save('customers', c); }

  async getSales(_storeId?: string) { return this.list('sales') as Promise<Sale[]>; }
  async getUnsyncedSales() { return (await this.list('sales')).filter((s: any) => !s.synced); }
  async getSale(id: string) { return (await this.list('sales')).find((s: any) => s.id === id); }
  async getSaleItems(saleId: string) { return (await this.list('sales')).filter((s: any) => s.saleId === saleId); }
  async saveSale(s: Sale) { await this.save('sales', s); }
  async saveSaleWithItems(s: Sale, _items: SaleItem[]) { await this.save('sales', s); }
  async markSaleSynced(id: string) { const s = await this.getSale(id); if (s) { s.synced = true; await this.save('sales', s); } }

  async getUsers() { return this.list('users') as Promise<User[]>; }
  async getUser(id: string) { return (await this.list('users')).find((u: any) => u.id === id); }
  async getUserByEmail(email: string) { return (await this.list('users')).find((u: any) => u.email === email); }
  async saveUser(u: User) { await this.save('users', u); }
  async saveUsers(users: User[]) { for (const u of users) await this.save('users', u); }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const all = await this.list('settings');
    const doc = all.find((d: any) => (d.key ?? d.id) === key);
    return doc?.value as T;
  }
  async saveSetting<T>(key: string, value: T): Promise<void> {
    await this.save('settings', { key, id: key, value });
  }
  async deleteSetting(key: string): Promise<void> {
    await this.req(`/settings/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }

  async clearAll(): Promise<void> {
    const cols = ['products','categories','customers','sales','suppliers','purchases','productHistory','settings','users','income','expenses','transactions','cart','heldSales','translations','sync'];
    for (const c of cols) await this.req(`/${c}/clear`, { method: 'POST' });
  }

  async getTransactions(__customerId?: string) { return this.list('transactions') as Promise<any[]>; }
  async saveTransaction(t: any) { await this.save('transactions', t); }
}

export const localDb = new LocalDb();
export async function initDatabase(): Promise<null> { return null; }
