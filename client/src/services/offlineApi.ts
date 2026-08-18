import { localDb, Store, Currency, Category, Product, Customer, Sale, SaleItem, User, generateId, generateInvoiceNo } from './localDb';

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// API Base URL - can be configured
const getApiBase = () => {
  // Try to use configured server URL, fallback to localhost
  return localStorage.getItem('API_BASE_URL') || 'http://localhost:3000';
};

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  if (!isOnline()) {
    return { success: false, error: 'Offline' };
  }

  try {
    const response = await fetch(`${getApiBase()}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Auth Service
export const authService = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; store: Store; token: string }>> {
    // Try online first
    if (isOnline()) {
      const response = await fetchApi<{ user: any; store: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        // Save user and store locally
        const { user, store, token } = response.data;
        await localDb.saveUser({ ...user, password });
        await localDb.saveStore(store);
        await localDb.saveSetting('authToken', token);
        await localDb.saveSetting('currentUser', user);
        await localDb.saveSetting('currentStore', store);
        return { success: true, data: { user, store, token } };
      }
    }

    // Try offline login
    const user = await localDb.getUserByEmail(email);
    if (user && user.password === password && user.isActive) {
      const store = user.storeId ? await localDb.getStore(user.storeId) : await localDb.getStores().then(s => s[0]);
      if (store) {
        const token = `offline_${user.id}`;
        await localDb.saveSetting('authToken', token);
        await localDb.saveSetting('currentUser', user);
        await localDb.saveSetting('currentStore', store);
        return { success: true, data: { user, store, token } };
      }
    }

    // If no user exists, create demo user
    if (!user && email) {
      const stores = await localDb.getStores();
      if (stores.length > 0) {
        const newUser: User = {
          id: generateId(),
          name: 'Admin',
          email,
          password,
          role: 'admin',
          storeId: stores[0].id,
          isActive: true,
        };
        await localDb.saveUser(newUser);
        await localDb.saveSetting('authToken', `offline_${newUser.id}`);
        await localDb.saveSetting('currentUser', newUser);
        await localDb.saveSetting('currentStore', stores[0]);
        return { success: true, data: { user: newUser, store: stores[0], token: `offline_${newUser.id}` } };
      }
    }

    return { success: false, error: 'Invalid credentials' };
  },

  async logout(): Promise<void> {
    await localDb.saveSetting('authToken', null);
    await localDb.saveSetting('currentUser', null);
    await localDb.saveSetting('currentStore', null);
  },

  async getCurrentUser(): Promise<User | null> {
    const user = await localDb.getSetting<User>('currentUser');
    return user ?? null;
  },

  async getCurrentStore(): Promise<Store | null> {
    const store = await localDb.getSetting<Store>('currentStore');
    return store ?? null;
  },

  async getAuthToken(): Promise<string | null> {
    const token = await localDb.getSetting<string>('authToken');
    return token ?? null;
  },
};

// Store Service
export const storeService = {
  async getAll(): Promise<Store[]> {
    if (isOnline()) {
      const response = await fetchApi<Store[]>('/api/stores');
      if (response.success && response.data) {
        await localDb.saveStores(response.data);
        return response.data;
      }
    }
    return localDb.getStores();
  },

  async getById(id: string): Promise<Store | undefined> {
    if (isOnline()) {
      const response = await fetchApi<Store>(`/api/stores/${id}`);
      if (response.success && response.data) {
        await localDb.saveStore(response.data);
        return response.data;
      }
    }
    return localDb.getStore(id);
  },
};

// Currency Service
export const currencyService = {
  async getAll(): Promise<Currency[]> {
    if (isOnline()) {
      const response = await fetchApi<Currency[]>('/api/currencies');
      if (response.success && response.data) {
        await localDb.saveCurrencies(response.data);
        return response.data;
      }
    }
    return localDb.getCurrencies();
  },

  async getStoreCurrencies(storeId: string): Promise<Currency[]> {
    if (isOnline()) {
      const response = await fetchApi<Currency[]>(`/api/currencies/store/${storeId}`);
      if (response.success && response.data) {
        return response.data;
      }
    }
    const storeCurrencies = await localDb.getStoreCurrencies(storeId);
    const currencies = await localDb.getCurrencies();
    return storeCurrencies.map(sc => currencies.find(c => c.id === sc.currencyId)).filter(Boolean) as Currency[];
  },
};

// Category Service
export const categoryService = {
  async getAll(storeId?: string): Promise<Category[]> {
    if (isOnline()) {
      const url = storeId ? `/api/categories?storeId=${storeId}` : '/api/categories';
      const response = await fetchApi<Category[]>(url);
      if (response.success && response.data) {
        await localDb.saveCategories(response.data);
        return response.data;
      }
    }
    return localDb.getCategories(storeId);
  },
};

// Product Service
export const productService = {
  async getAll(storeId?: string): Promise<Product[]> {
    if (isOnline()) {
      const url = storeId ? `/api/products?storeId=${storeId}` : '/api/products';
      const response = await fetchApi<Product[]>(url);
      if (response.success && response.data) {
        await localDb.saveProducts(response.data);
        return response.data;
      }
    }
    return localDb.getProducts(storeId);
  },

  async getByBarcode(barcode: string): Promise<Product | undefined> {
    if (isOnline()) {
      const response = await fetchApi<Product>(`/api/products/barcode/${barcode}`);
      if (response.success && response.data) {
        await localDb.saveProduct(response.data);
        return response.data;
      }
    }
    const products = await localDb.getProducts();
    return products.find(p => p.barcode === barcode);
  },

  async getByCode(code: string): Promise<Product | undefined> {
    return localDb.getProductByCode(code);
  },

  async updateStock(productId: string, newStock: number): Promise<void> {
    await localDb.updateProductStock(productId, newStock);
  },
};

// Customer Service
export const customerService = {
  async getAll(storeId?: string): Promise<Customer[]> {
    if (isOnline()) {
      const url = storeId ? `/api/customers?storeId=${storeId}` : '/api/customers';
      const response = await fetchApi<Customer[]>(url);
      if (response.success && response.data) {
        for (const customer of response.data) {
          await localDb.saveCustomer(customer);
        }
        return response.data;
      }
    }
    return localDb.getCustomers(storeId);
  },
};

// Sale Service
export const saleService = {
  async create(saleData: {
    storeId: string;
    userId?: string;
    customerId?: string;
    currencyId?: string;
    items: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }>;
    subtotal: number;
    discount: number;
    vat: number;
    total: number;
    paid: number;
    change: number;
    paymentMethod: string;
  }): Promise<Sale> {
    const store = await localDb.getStore(saleData.storeId);
    const invoicePrefix = store?.invoicePrefix || 'INV';
    
    const sale: Sale = {
      id: generateId(),
      invoiceNo: generateInvoiceNo(invoicePrefix),
      storeId: saleData.storeId,
      userId: saleData.userId,
      customerId: saleData.customerId,
      currencyId: saleData.currencyId,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      vat: saleData.vat,
      total: saleData.total,
      paid: saleData.paid,
      change: saleData.change,
      paymentMethod: saleData.paymentMethod,
      status: 'COMPLETED',
      offlineId: generateId(),
      deviceId: await localDb.getSetting<string>('deviceId') || generateId(),
      createdAt: new Date().toISOString(),
      synced: false,
    };

    const items: SaleItem[] = saleData.items.map(item => ({
      id: generateId(),
      saleId: sale.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    }));

    await localDb.saveSaleWithItems(sale, items);

    // Try to sync immediately if online
    if (isOnline()) {
      await this.syncSale(sale, items);
    }

    return sale;
  },

  async getAll(storeId?: string): Promise<Sale[]> {
    if (isOnline()) {
      const url = storeId ? `/api/sales?storeId=${storeId}` : '/api/sales';
      const response = await fetchApi<Sale[]>(url);
      if (response.success && response.data) {
        for (const sale of response.data) {
          await localDb.saveSale({ ...sale, synced: true });
        }
        return response.data;
      }
    }
    return localDb.getSales(storeId);
  },

  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return localDb.getSaleItems(saleId);
  },

  async syncSale(sale: Sale, items: SaleItem[]): Promise<boolean> {
    if (!isOnline()) return false;

    const response = await fetchApi<Sale>('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        ...sale,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
      }),
    });

    if (response.success) {
      await localDb.markSaleSynced(sale.id);
      return true;
    }
    return false;
  },

  async syncAllUnsynced(): Promise<{ synced: number; failed: number }> {
    if (!isOnline()) return { synced: 0, failed: 0 };

    const unsyncedSales = await localDb.getUnsyncedSales();
    let synced = 0;
    let failed = 0;

    for (const sale of unsyncedSales) {
      const items = await localDb.getSaleItems(sale.id);
      const success = await this.syncSale(sale, items);
      if (success) {
        synced++;
      } else {
        failed++;
      }
    }

    return { synced, failed };
  },

  async getDailyReport(storeId: string, date?: string): Promise<{
    totalSales: number;
    totalItems: number;
    totalDiscount: number;
    salesCount: number;
  }> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    const sales = await this.getAll(storeId);
    
    const todaySales = sales.filter(s => s.createdAt.startsWith(targetDate));
    
    let totalItems = 0;
    for (const sale of todaySales) {
      const items = await localDb.getSaleItems(sale.id);
      totalItems += items.length;
    }
    
    return {
      totalSales: todaySales.reduce((sum, s) => sum + s.total, 0),
      totalItems,
      totalDiscount: todaySales.reduce((sum, s) => sum + s.discount, 0),
      salesCount: todaySales.length,
    };
  },
};

// Sync Service
export const syncService = {
  async pullAll(storeId: string): Promise<boolean> {
    if (!isOnline()) return false;

    try {
      // Sync stores
      const storesResponse = await fetchApi<Store[]>('/api/stores');
      if (storesResponse.success && storesResponse.data) {
        await localDb.saveStores(storesResponse.data);
      }

      // Sync currencies
      const currenciesResponse = await fetchApi<Currency[]>('/api/currencies');
      if (currenciesResponse.success && currenciesResponse.data) {
        await localDb.saveCurrencies(currenciesResponse.data);
      }

      // Sync categories
      const categoriesResponse = await fetchApi<Category[]>(`/api/categories?storeId=${storeId}`);
      if (categoriesResponse.success && categoriesResponse.data) {
        await localDb.saveCategories(categoriesResponse.data);
      }

      // Sync products
      const productsResponse = await fetchApi<Product[]>(`/api/products?storeId=${storeId}`);
      if (productsResponse.success && productsResponse.data) {
        await localDb.saveProducts(productsResponse.data);
      }

      // Sync customers
      const customersResponse = await fetchApi<Customer[]>(`/api/customers?storeId=${storeId}`);
      if (customersResponse.success && customersResponse.data) {
        for (const customer of customersResponse.data) {
          await localDb.saveCustomer(customer);
        }
      }

      // Sync users
      const usersResponse = await fetchApi<User[]>('/api/users');
      if (usersResponse.success && usersResponse.data) {
        await localDb.saveUsers(usersResponse.data);
      }

      await localDb.saveSetting('lastSync', new Date().toISOString());
      return true;
    } catch (error) {
      console.error('Sync pull error:', error);
      return false;
    }
  },

  async pushAll(_storeId: string): Promise<{ synced: number; failed: number }> {
    return saleService.syncAllUnsynced();
  },

  async getLastSyncTime(): Promise<string | null> {
    const time = await localDb.getSetting<string>('lastSync');
    return time ?? null;
  },
};

// Initialize with seed data if empty
export async function initializeLocalData(): Promise<void> {
  const products = await localDb.getProducts();
  
  if (products.length === 0) {
    // Add demo store
    const demoStore: Store = {
      id: 'store-001',
      name: 'মূল শাখা',
      code: 'MAIN001',
      address: 'ঢাকা, বাংলাদেশ',
      phone: '+880 1XXX-XXXXXX',
      email: 'main@pos.test',
      isActive: true,
      invoicePrefix: 'INV',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await localDb.saveStore(demoStore);

    // Add demo currencies
    const currencies: Currency[] = [
      { id: 'curr-bdt', code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', exchangeRate: 1, isBase: true, isActive: true, decimalPlaces: 0 },
      { id: 'curr-usd', code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 110, isBase: false, isActive: true, decimalPlaces: 2 },
    ];
    await localDb.saveCurrencies(currencies);

    // Add demo categories
    const categories: Category[] = [
      { id: 'cat-food', name: 'খাবার', icon: '🍔', storeId: demoStore.id, isActive: true },
      { id: 'cat-drinks', name: 'পানীয়', icon: '🥤', storeId: demoStore.id, isActive: true },
      { id: 'cat-essentials', name: 'প্রয়োজনীয়', icon: '🛒', storeId: demoStore.id, isActive: true },
    ];
    await localDb.saveCategories(categories);

    // Add demo products
    const products: Product[] = [
      { id: 'prod-1', name: 'সাদা ভাত', code: 'RICE001', sellPrice: 120, costPrice: 80, stock: 50, categoryId: 'cat-food', storeId: demoStore.id, isActive: true },
      { id: 'prod-2', name: 'পোলাও', code: 'RICE002', sellPrice: 150, costPrice: 100, stock: 30, categoryId: 'cat-food', storeId: demoStore.id, isActive: true },
      { id: 'prod-3', name: 'ফ্রাইড রাইস', code: 'FR001', sellPrice: 130, costPrice: 85, stock: 40, categoryId: 'cat-food', storeId: demoStore.id, isActive: true },
      { id: 'prod-4', name: 'কোকা কোলা', code: 'COKE001', sellPrice: 30, costPrice: 20, stock: 100, categoryId: 'cat-drinks', storeId: demoStore.id, isActive: true },
      { id: 'prod-5', name: 'পেপসি', code: 'PEP001', sellPrice: 25, costPrice: 15, stock: 80, categoryId: 'cat-drinks', storeId: demoStore.id, isActive: true },
      { id: 'prod-6', name: 'চা', code: 'TEA001', sellPrice: 15, costPrice: 8, stock: 200, categoryId: 'cat-drinks', storeId: demoStore.id, isActive: true },
      { id: 'prod-7', name: 'সাবান', code: 'SOAP001', sellPrice: 45, costPrice: 30, stock: 50, categoryId: 'cat-essentials', storeId: demoStore.id, isActive: true },
      { id: 'prod-8', name: 'শ্যাম্পু', code: 'SHAM001', sellPrice: 150, costPrice: 100, stock: 30, categoryId: 'cat-essentials', storeId: demoStore.id, isActive: true },
    ];
    await localDb.saveProducts(products);

    // Add demo admin user
    const adminUser: User = {
      id: 'user-admin',
      name: 'Admin',
      email: 'admin@pos.test',
      password: 'admin123',
      role: 'admin',
      storeId: demoStore.id,
      isActive: true,
    };
    await localDb.saveUser(adminUser);

    // Set default store and user
    await localDb.saveSetting('currentStore', demoStore);
    await localDb.saveSetting('currentUser', adminUser);
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('🟢 Back online - syncing...');
    // Auto sync when back online
    localDb.getSetting<Store>('currentStore').then(store => {
      if (store?.id) {
        syncService.pullAll(store.id);
        syncService.pushAll(store.id);
      }
    });
  });

  window.addEventListener('offline', () => {
    console.log('🔴 Gone offline - working locally');
  });
}
