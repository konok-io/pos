import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useCurrencyStore } from '../store/authStore';
import { productApi, categoryApi, customerApi } from '../services/api';
import { offlineSync } from '../services/offlineSync';
import type { Product, Category, Customer } from '../types';

interface POSProps {
  onNavigate: (page: 'pos' | 'dashboard') => void;
}

export default function POS({ onNavigate }: POSProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  const { items, addItem, removeItem, updateQuantity, clearCart, getSubtotal, getTotal } = useCartStore();
  const { currentCurrency } = useCurrencyStore();

  useEffect(() => {
    loadData();
    setupOnlineStatus();
  }, []);

  async function loadData() {
    // Try online first, fallback to offline
    try {
      const [productsRes, categoriesRes, customersRes] = await Promise.all([
        productApi.list(),
        categoryApi.list(),
        customerApi.list(),
      ]);

      if (productsRes.success) setProducts(productsRes.data || []);
      if (categoriesRes.success) setCategories(categoriesRes.data || []);
      if (customersRes.success) setCustomers(customersRes.data || []);

      // Cache for offline
      if (productsRes.data) await offlineSync.saveProducts(productsRes.data);
      if (categoriesRes.data) await offlineSync.saveCategories(categoriesRes.data);
      if (customersRes.data) await offlineSync.saveCustomers(customersRes.data);
    } catch (error) {
      // Load from cache
      const [cachedProducts, cachedCategories, cachedCustomers] = await Promise.all([
        offlineSync.getProducts(),
        offlineSync.getCategories(),
        offlineSync.getCustomers(),
      ]);
      setProducts(cachedProducts);
      setCategories(cachedCategories);
      setCustomers(cachedCustomers);
    }

    // Update pending count
    const count = await offlineSync.getPendingSaleCount();
    setPendingCount(count);
  }

  function setupOnlineStatus() {
    window.addEventListener('online', () => {
      setIsOnline(true);
      syncPendingSales();
    });
    window.addEventListener('offline', () => setIsOnline(false));
  }

  async function syncPendingSales() {
    const pending = await offlineSync.getPendingSales();
    if (pending.length === 0) return;

    const deviceId = await offlineSync.getDeviceId();
    const response = await fetch('/api/sync/push/demo-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sales: pending.map(p => p.sale),
        deviceId,
      }),
    });

    if (response.ok) {
      for (const sale of pending) {
        await offlineSync.deletePendingSale(sale.id);
      }
      setPendingCount(0);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchCategory = currentCategory === 'all' || p.categoryId === currentCategory;
    const matchSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  async function handleCheckout() {
    if (items.length === 0) return;

    const { subtotal, discount, vat, total } = getTotal();
    const saleData = {
      invoiceNo: `INV${Date.now()}`,
      storeId: 'demo-store',
      subtotal,
      discount,
      vat,
      total,
      paid: total,
      change: 0,
      paymentMethod: 'CASH',
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    };

    if (isOnline) {
      try {
        await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData),
        });
      } catch (error) {
        await offlineSync.savePendingSale(saleData as any);
        setPendingCount(prev => prev + 1);
      }
    } else {
      await offlineSync.savePendingSale(saleData as any);
      setPendingCount(prev => prev + 1);
    }

    setLastSale({ ...saleData, change: 0 });
    setShowReceipt(true);
    clearCart();
  }

  const symbol = currentCurrency?.symbol || '৳';

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold text-pink-500">💼 POS</div>
          
          {/* Currency Selector */}
          <CurrencySelector />
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="পণ্য খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-full px-4 py-2 w-64 text-sm focus:outline-none focus:border-pink-500"
          />

          {/* Online Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs">{isOnline ? 'অনলাইন' : 'অফলাইন'}</span>
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm"
          >
            📊 ড্যাশবোর্ড
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories Sidebar */}
        <aside className="w-48 bg-slate-800 p-4 border-r border-slate-700 overflow-y-auto">
          <h3 className="text-sm text-slate-400 mb-3">ক্যাটাগরি</h3>
          <button
            onClick={() => setCurrentCategory('all')}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${currentCategory === 'all' ? 'bg-pink-500' : 'hover:bg-slate-700'}`}
          >
            📦 সব পণ্য
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCurrentCategory(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg mb-1 ${currentCategory === cat.id ? 'bg-pink-500' : 'hover:bg-slate-700'}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </aside>

        {/* Products Grid */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                onClick={() => addItem(product)}
                className={`product-card ${product.stock <= 10 ? 'border-2 border-red-500' : ''}`}
              >
                <div className="text-4xl mb-2">{product.image || '📦'}</div>
                <div className="font-medium text-sm truncate">{product.name}</div>
                <div className="text-pink-400 font-bold">{symbol}{product.sellPrice}</div>
                <div className="text-xs text-slate-400">স্টক: {product.stock}</div>
              </div>
            ))}
          </div>
        </main>

        {/* Cart Sidebar */}
        <aside className="w-80 bg-slate-800 flex flex-col border-l border-slate-700">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="font-bold">🛒 কার্ট ({items.length})</h3>
            {items.length > 0 && (
              <button onClick={clearCart} className="text-red-400 text-sm hover:underline">
                খালি করুন
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <div className="text-4xl mb-2">🛒</div>
                <p>কার্ট খালি</p>
              </div>
            ) : (
              items.map(item => (
                <div key={item.productId} className="cart-item mb-2">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.productName}</div>
                    <div className="text-xs text-slate-400">{symbol}{item.unitPrice}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, -1)}
                      className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, 1)}
                      className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="w-16 text-right font-medium">{symbol}{item.total}</div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary */}
          <div className="p-4 border-t border-slate-700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>সাবটোটাল:</span>
                <span>{symbol}{getSubtotal()}</span>
              </div>
              <div className="flex justify-between text-pink-400 font-bold text-lg border-t border-slate-600 pt-2">
                <span>মোট:</span>
                <span>{symbol}{getTotal().total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={items.length === 0}
              className="w-full mt-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-bold"
            >
              💰 পেমেন্ট করুন
            </button>
          </div>
        </aside>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastSale && (
        <div className="modal-overlay" onClick={() => setShowReceipt(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">✅ বিক্রয় সম্পন্ন!</h2>
              <p className="text-slate-400">Invoice: {lastSale.invoiceNo}</p>
            </div>
            <div className="space-y-2 mb-4">
              {lastSale.items.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{symbol}{item.total}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-600 pt-2 font-bold flex justify-between">
              <span>মোট:</span>
              <span>{symbol}{lastSale.total}</span>
            </div>
            <button
              onClick={() => setShowReceipt(false)}
              className="w-full mt-4 py-2 bg-pink-500 rounded-lg font-medium"
            >
              ✓ সম্পন্ন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CurrencySelector() {
  const { currencies, currentCurrency, setCurrentCurrency } = useCurrencyStore();

  if (currencies.length === 0) return null;

  return (
    <div className="flex gap-1">
      {currencies.slice(0, 3).map(c => (
        <button
          key={c.id}
          onClick={() => setCurrentCurrency(c)}
          className={`currency-btn ${currentCurrency?.id === c.id ? 'active' : ''}`}
        >
          {c.symbol} {c.code}
        </button>
      ))}
    </div>
  );
}
