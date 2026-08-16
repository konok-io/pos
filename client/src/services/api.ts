const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
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

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    fetchApi<{ user: any; store: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Stores
export const storeApi = {
  list: () => fetchApi<any[]>('/stores'),
  get: (id: string) => fetchApi<any>(`/stores/${id}`),
};

// Currencies
export const currencyApi = {
  list: () => fetchApi<any[]>('/currencies'),
  getStoreCurrencies: (storeId: string) => fetchApi<any[]>(`/currencies/store/${storeId}`),
  convert: (amount: number, fromId: string, toId: string) =>
    fetchApi<{ original: number; converted: number; from: any; to: any }>('/currencies/convert', {
      method: 'POST',
      body: JSON.stringify({ amount, fromCurrencyId: fromId, toCurrencyId: toId }),
    }),
};

// Products
export const productApi = {
  list: (params?: { storeId?: string; categoryId?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/products${query ? '?' + query : ''}`);
  },
  get: (id: string) => fetchApi<any>(`/products/${id}`),
  getByBarcode: (barcode: string) => fetchApi<any>(`/products/barcode/${barcode}`),
};

// Categories
export const categoryApi = {
  list: (storeId?: string) =>
    fetchApi<any[]>(`/categories${storeId ? '?storeId=' + storeId : ''}`),
};

// Customers
export const customerApi = {
  list: (storeId?: string) =>
    fetchApi<any[]>(`/customers${storeId ? '?storeId=' + storeId : ''}`),
};

// Sales
export const saleApi = {
  list: (params?: { storeId?: string; startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/sales${query ? '?' + query : ''}`);
  },
  create: (data: any) => fetchApi<any>('/sales', { method: 'POST', body: JSON.stringify(data) }),
  dailyReport: (storeId: string, date?: string) =>
    fetchApi<any>(`/sales/report/daily?storeId=${storeId}${date ? '&date=' + date : ''}`),
};

// Sync
export const syncApi = {
  pull: (storeId: string, since?: string) => {
    const query = since ? `?since=${since}` : '';
    return fetchApi<any>(`/sync/pull/${storeId}${query}`);
  },
  push: (storeId: string, data: { sales?: any[]; deviceId?: string }) =>
    fetchApi<any>(`/sync/push/${storeId}`, { method: 'POST', body: JSON.stringify(data) }),
  status: (storeId: string) => fetchApi<any>(`/sync/status/${storeId}`),
};

// Reports
export const reportApi = {
  dashboard: (storeId: string, date?: string) =>
    fetchApi<any>(`/reports/dashboard?storeId=${storeId}${date ? '&date=' + date : ''}`),
  profitLoss: (storeId: string, startDate: string, endDate: string) =>
    fetchApi<any>(`/reports/profit-loss?storeId=${storeId}&startDate=${startDate}&endDate=${endDate}`),
  stock: (storeId: string, lowStock?: boolean) =>
    fetchApi<any>(`/reports/stock?storeId=${storeId}${lowStock ? '&lowStock=true' : ''}`),
};
