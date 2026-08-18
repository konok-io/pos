export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  invoicePrefix: string;
  currencies?: StoreCurrency[];
}

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  decimalPlaces: number;
}

export interface StoreCurrency {
  id: string;
  storeId: string;
  currencyId: string;
  rate: number;
  isDefault: boolean;
  currency: Currency;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  storeId: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  code: string;
  barcode?: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  storeId: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit?: string;
  image?: string;
  // Extended fields for New Product form
  company?: string;
  cat?: string;
  buyP?: number;
  minStock?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  balance: number;
  storeId: string;
}

export interface SaleItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  storeId: string;
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
  items: SaleItem[];
  customer?: Customer;
  currency?: Currency;
  createdAt: string;
}

export interface CartItem extends SaleItem {
  product?: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  store: Store | null;
  token: string | null;
}

export interface DashboardData {
  date: string;
  todaySales: { count: number; total: number };
  todayExpenses: number;
  lowStockCount: number;
  recentSales: Sale[];
  topProducts: { productId: string; productName: string; _sum: { quantity: number; total: number } }[];
  stats: { totalProducts: number; totalCustomers: number; totalCategories: number };
}

export interface SyncData {
  categories: Category[];
  products: Product[];
  customers: Customer[];
  currencies: StoreCurrency[];
  sales: Sale[];
  syncedAt: string;
  storeId: string;
}
