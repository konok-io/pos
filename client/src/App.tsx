import { useState, useEffect, useRef } from 'react';
import './index.css';

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'admin@pos.test',
  password: 'admin123',
  role: 'admin',
  name: 'Admin',
};

// Helper functions
const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const fmt = (n: number) => `৳${(+n || 0).toLocaleString('en-IN')}`;
const now = () => new Date().toISOString();

// Types
interface Product {
  id: string;
  name: string;
  code: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  categoryId: string;
  image: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sellPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  maxStock: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  customerId: string | null;
  customerName: string;
  items: any[];
  subtotal: number;
  discount: number;
  vatPercent: number;
  vatAmount: number;
  total: number;
  paid: number;
  due: number;
  change: number;
}

// Loading Screen
function LoadingScreen() {
  return (
    <div className="loading">
      <div className="loading-spinner"></div>
      <h3>POS সিস্টেম</h3>
      <p>লোড হচ্ছে...</p>
    </div>
  );
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('admin@pos.test');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      localStorage.setItem('pos_user', JSON.stringify(DEFAULT_ADMIN));
      onLogin();
    } else {
      setError('ইমেইল বা পাসওয়ার্ড ভুল!');
    }
    setLoading(false);
  };

  return (
    <div className="loading">
      <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <h2 style={{ color: '#0F766E', margin: 0, fontSize: 24, fontWeight: 700 }}>POS ম্যানেজমেন্ট</h2>
          <p style={{ color: '#6B7280', margin: '8px 0 0' }}>আপনার অ্যাকাউন্টে লগইন করুন</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="label">👤 ইমেইল</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-lg"
              placeholder="admin@pos.test"
              required
            />
          </div>

          <div className="form-group">
            <label className="label">🔐 পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-lg"
              placeholder="******"
              required
            />
          </div>

          {error && (
            <div style={{ padding: '12px', background: '#FEF2F2', borderRadius: 10, color: '#DC2626', fontSize: 14 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary btn-lg btn-block">
            {loading ? '⏳ লোড হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9CA3AF' }}>
          ডেমো: admin@pos.test / admin123
        </p>
      </div>
    </div>
  );
}

// Time Display Component
function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="time-display">
      <div className="time">
        {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="date">
        {time.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pos');

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState(15);
  const [paidAmount, setPaidAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Check auth on mount
  useEffect(() => {
    const user = localStorage.getItem('pos_user');
    if (user) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  // Load demo data
  useEffect(() => {
    if (isLoggedIn) {
      loadDemoData();
    }
  }, [isLoggedIn]);

  const loadDemoData = () => {
    // Demo categories
    const demoCategories: Category[] = [
      { id: 'cat-food', name: 'খাবার', icon: '🍔' },
      { id: 'cat-drinks', name: 'পানীয়', icon: '🥤' },
      { id: 'cat-essentials', name: 'প্রয়োজনীয়', icon: '🛒' },
    ];
    setCategories(demoCategories);

    // Demo products
    const demoProducts: Product[] = [
      { id: 'p1', name: 'সাদা ভাত', code: 'RICE001', costPrice: 80, sellPrice: 120, stock: 50, unit: 'প্লেট', categoryId: 'cat-food', image: '🍚' },
      { id: 'p2', name: 'পোলাও', code: 'RICE002', costPrice: 100, sellPrice: 150, stock: 30, unit: 'প্লেট', categoryId: 'cat-food', image: '🍛' },
      { id: 'p3', name: 'চিকেন কর্ন', code: 'CHK001', costPrice: 130, sellPrice: 200, stock: 25, unit: 'পিস', categoryId: 'cat-food', image: '🍗' },
      { id: 'p4', name: 'কোকা কোলা', code: 'COKE001', costPrice: 20, sellPrice: 30, stock: 100, unit: 'বোতল', categoryId: 'cat-drinks', image: '🥤' },
      { id: 'p5', name: 'পেপসি', code: 'PEP001', costPrice: 15, sellPrice: 25, stock: 80, unit: 'বোতল', categoryId: 'cat-drinks', image: '🥤' },
      { id: 'p6', name: 'চা', code: 'TEA001', costPrice: 8, sellPrice: 15, stock: 200, unit: 'কাপ', categoryId: 'cat-drinks', image: '☕' },
      { id: 'p7', name: 'সাবান', code: 'SOAP001', costPrice: 30, sellPrice: 45, stock: 50, unit: 'পিস', categoryId: 'cat-essentials', image: '🧼' },
      { id: 'p8', name: 'শ্যাম্পু', code: 'SHAM001', costPrice: 100, sellPrice: 150, stock: 30, unit: 'বোতল', categoryId: 'cat-essentials', image: '🧴' },
    ];
    setProducts(demoProducts);

    // Demo customers
    const demoCustomers: Customer[] = [
      { id: 'c1', name: 'রহিম উদ্দিন', phone: '01712345678', address: 'ঢাকা', balance: 0 },
      { id: 'c2', name: 'করিম শেখ', phone: '01812345678', address: 'চট্টগ্রাম', balance: 500 },
    ];
    setCustomers(demoCustomers);
  };

  const handleLogin = () => setIsLoggedIn(true);

  const handleLogout = () => {
    localStorage.removeItem('pos_user');
    setIsLoggedIn(false);
    setCart([]);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleHardRefresh = () => {
    window.location.reload();
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const hasStock = p.stock > 0;
    return matchCategory && matchSearch && hasStock;
  });

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" এর স্টক শেষ!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`সর্বোচ্চ স্টক: ${product.stock} ${product.unit}`);
          return prev;
        }
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: genId(),
        productId: product.id,
        name: product.name,
        sellPrice: product.sellPrice,
        costPrice: product.costPrice,
        quantity: 1,
        unit: product.unit,
        maxStock: product.stock,
      }];
    });
  };

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        if (newQty > item.maxStock) {
          alert(`সর্বোচ্চ স্টক: ${item.maxStock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0);
  const discountAmount = parseFloat(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = parseFloat((afterDiscount * vatPercent / 100).toFixed(2));
  const total = afterDiscount + vatAmount;
  const paid = parseFloat(paidAmount) || 0;
  const due = total - paid;
  const change = paid > total ? paid - total : 0;

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('কার্টে কোনো পণ্য নেই!');
      return;
    }

    if (due > 0 && !selectedCustomer) {
      alert('⚠️ বাকি বিক্রয় করতে গ্রাহক সিলেক্ট করুন অথবা পূর্ণ পরিশোধ করুন!');
      return;
    }

    const sale: Sale = {
      id: genId(),
      invoiceNo: `INV${Date.now()}`,
      date: now(),
      customerId: selectedCustomer?.id || null,
      customerName: selectedCustomer?.name || 'সাধারণ ক্রেতা',
      items: cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.sellPrice,
        total: item.sellPrice * item.quantity,
      })),
      subtotal,
      discount: discountAmount,
      vatPercent,
      vatAmount,
      total,
      paid,
      due,
      change,
    };

    // Update stock
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.productId === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
    }));

    // Update customer balance if due
    if (selectedCustomer && due > 0) {
      setCustomers(prev => prev.map(c =>
        c.id === selectedCustomer.id ? { ...c, balance: c.balance + due } : c
      ));
    }

    setSales(prev => [...prev, sale]);
    setLastSale(sale);
    setShowReceiptModal(true);
    setCart([]);
    setDiscount('');
    setPaidAmount('');
    setSelectedCustomer(null);
  };

  if (isLoading) return <LoadingScreen />;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="header-logo">🏪</div>
          <div className="header-title">
            <h1>POS ম্যানেজমেন্ট সিস্টেম</h1>
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={handleHardRefresh} title="হার্ড রিফ্রেশ">🔄</button>
          <button className="header-btn" onClick={handleFullscreen} title="ফুল স্ক্রিন">⛶</button>
          <button className="header-btn" onClick={handleLogout} title="লগআউট">↩️</button>
          <TimeDisplay />
        </div>
      </header>

      {/* Menu Bar */}
      <nav className="menu-bar">
        <button className={`menu-btn ${currentTab === 'pos' ? 'active' : ''}`} onClick={() => setCurrentTab('pos')}>
          <span className="icon">🛒</span> POS
        </button>
        <button className={`menu-btn ${currentTab === 'products' ? 'active' : ''}`} onClick={() => setCurrentTab('products')}>
          <span className="icon">📦</span> পণ্য
        </button>
        <button className={`menu-btn ${currentTab === 'customers' ? 'active' : ''}`} onClick={() => setCurrentTab('customers')}>
          <span className="icon">👥</span> গ্রাহক
        </button>
        <button className={`menu-btn ${currentTab === 'sales' ? 'active' : ''}`} onClick={() => setCurrentTab('sales')}>
          <span className="icon">💰</span> বিক্রয়
        </button>
        <button className={`menu-btn ${currentTab === 'reports' ? 'active' : ''}`} onClick={() => setCurrentTab('reports')}>
          <span className="icon">📊</span> রিপোর্ট
        </button>
        <button className={`menu-btn ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}>
          <span className="icon">⚙️</span> সেটিংস
        </button>
      </nav>

      {/* Content */}
      <div className="content">
        {currentTab === 'pos' && (
          <div className="pos-layout">
            {/* Category Sidebar */}
            <aside className="pos-sidebar">
              <h4 style={{ marginBottom: 12, fontSize: 14, color: '#6B7280' }}>ক্যাটাগরি</h4>
              <ul className="category-list">
                <li
                  className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  <span>📦 সব পণ্য</span>
                  <span className="category-count">{products.length}</span>
                </li>
                {categories.map(cat => {
                  const count = products.filter(p => p.categoryId === cat.id).length;
                  return (
                    <li
                      key={cat.id}
                      className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      <span>{cat.icon} {cat.name}</span>
                      <span className="category-count">{count}</span>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Product Grid */}
            <main className="pos-main">
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="পণ্য খুঁজুন... (নাম বা কোড দিয়ে)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="product-grid">
                {filteredProducts.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-state-icon">📦</div>
                    <p>কোনো পণ্য পাওয়া যায়নি</p>
                  </div>
                ) : (
                  filteredProducts.map(product => (
                    <div
                      key={product.id}
                      className={`product-card ${product.stock <= 0 ? 'out-of-stock' : ''}`}
                      onClick={() => addToCart(product)}
                    >
                      <div className="product-card-image">{product.image}</div>
                      <div className="product-card-name">{product.name}</div>
                      <div className="product-card-price">{fmt(product.sellPrice)}</div>
                      <div className="product-card-stock">স্টক: {product.stock} {product.unit}</div>
                    </div>
                  ))
                )}
              </div>
            </main>

            {/* Cart */}
            <aside className="pos-cart">
              <div className="cart-header">
                <span>🛒 কার্ট ({cart.length})</span>
                {cart.length > 0 && (
                  <button className="btn btn-sm btn-secondary" onClick={() => setCart([])}>
                    খালি করুন
                  </button>
                )}
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🛒</div>
                    <p>কার্ট খালি</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{fmt(item.sellPrice)} × {item.quantity}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, -1)}>−</button>
                        <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQuantity(item.productId, 1)}>+</button>
                      </div>
                      <div className="cart-item-total">{fmt(item.sellPrice * item.quantity)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-footer">
                <div className="cart-summary">
                  <div className="cart-summary-row">
                    <span>সাবটোটাল:</span>
                    <span>{fmt(subtotal)}</span>
                  </div>
                  <div className="cart-summary-row">
                    <span>ডিসকাউন্ট:</span>
                    <span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        style={{ width: 80, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, textAlign: 'right' }}
                      />
                    </span>
                  </div>
                  <div className="cart-summary-row">
                    <span>ভ্যাট ({vatPercent}%):</span>
                    <span>{fmt(vatAmount)}</span>
                  </div>
                  <div className="cart-summary-row total">
                    <span>মোট:</span>
                    <span>{fmt(total)}</span>
                  </div>
                  <div className="cart-summary-row" style={{ marginTop: 12 }}>
                    <span>পরিশোধ:</span>
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder={total.toString()}
                      style={{ width: 100, padding: '4px 8px', border: '1px solid #E5E7EB', borderRadius: 6, textAlign: 'right' }}
                    />
                  </div>
                  {change > 0 && (
                    <div className="cart-summary-row">
                      <span>ফেরত:</span>
                      <span style={{ color: '#10B981' }}>{fmt(change)}</span>
                    </div>
                  )}
                  {due > 0 && (
                    <div className="cart-summary-row">
                      <span>বাকি:</span>
                      <span style={{ color: '#EF4444' }}>{fmt(due)}</span>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-success btn-lg btn-block"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  💰 পেমেন্ট করুন
                </button>
              </div>
            </aside>
          </div>
        )}

        {currentTab === 'products' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>📦 পণ্য তালিকা</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>নাম</th>
                    <th>কোড</th>
                    <th>ক্রয়মূল্য</th>
                    <th>বিক্রয়মূল্য</th>
                    <th>স্টক</th>
                    <th>ক্যাটাগরি</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>{p.image} {p.name}</td>
                      <td>{p.code}</td>
                      <td>{fmt(p.costPrice)}</td>
                      <td>{fmt(p.sellPrice)}</td>
                      <td>
                        <span className={`badge ${p.stock <= 10 ? 'badge-danger' : 'badge-success'}`}>
                          {p.stock} {p.unit}
                        </span>
                      </td>
                      <td>{categories.find(c => c.id === p.categoryId)?.name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'customers' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>👥 গ্রাহক তালিকা</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>নাম</th>
                    <th>ফোন</th>
                    <th>ঠিকানা</th>
                    <th>বাকি</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.phone}</td>
                      <td>{c.address}</td>
                      <td>
                        <span className={`badge ${c.balance > 0 ? 'badge-danger' : 'badge-success'}`}>
                          {fmt(c.balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'sales' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💰 বিক্রয় তালিকা</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>তারিখ</th>
                    <th>গ্রাহক</th>
                    <th>মোট</th>
                    <th>পরিশোধ</th>
                    <th>বাকি</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>কোনো বিক্রয় নেই</td></tr>
                  ) : (
                    sales.map(s => (
                      <tr key={s.id}>
                        <td>{s.invoiceNo}</td>
                        <td>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                        <td>{s.customerName}</td>
                        <td>{fmt(s.total)}</td>
                        <td>{fmt(s.paid)}</td>
                        <td>
                          <span className={`badge ${s.due > 0 ? 'badge-danger' : 'badge-success'}`}>
                            {fmt(s.due)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentTab === 'reports' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>📊 রিপোর্ট</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="label">মোট পণ্য</div>
                <div className="value">{products.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">মোট গ্রাহক</div>
                <div className="value">{customers.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">মোট বিক্রয়</div>
                <div className="value">{fmt(sales.reduce((sum, s) => sum + s.total, 0))}</div>
              </div>
              <div className="stat-card">
                <div className="label">আজকের বিক্রয়</div>
                <div className="value">
                  {fmt(sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0))}
                </div>
              </div>
              <div className="stat-card">
                <div className="label">মোট বাকি</div>
                <div className="value" style={{ color: '#EF4444' }}>
                  {fmt(sales.reduce((sum, s) => sum + s.due, 0))}
                </div>
              </div>
              <div className="stat-card">
                <div className="label">কম স্টক পণ্য</div>
                <div className="value" style={{ color: '#F59E0B' }}>
                  {products.filter(p => p.stock <= 10).length}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'settings' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>⚙️ সেটিংস</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="label">ভ্যাট শতাংশ (%)</label>
                <input
                  type="number"
                  className="input"
                  value={vatPercent}
                  onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label className="label">ব্যবসায়ের নাম</label>
                <input type="text" className="input" defaultValue="আমার দোকান" />
              </div>
              <button className="btn btn-primary">সেভ করুন</button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ বিক্রয় সম্পন্ন!</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48 }}>✅</div>
                <p style={{ fontSize: 14, color: '#6B7280' }}>Invoice: {lastSale.invoiceNo}</p>
              </div>
              <div style={{ borderBottom: '1px dashed #E5E7EB', paddingBottom: 12, marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>গ্রাহক: {lastSale.customerName}</p>
              </div>
              {lastSale.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{fmt(item.total)}</span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>সাবটোটাল:</span>
                  <span>{fmt(lastSale.subtotal)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ডিসকাউন্ট:</span>
                    <span>-{fmt(lastSale.discount)}</span>
                  </div>
                )}
                {lastSale.vatAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>ভ্যাট ({lastSale.vatPercent}%):</span>
                    <span>{fmt(lastSale.vatAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                  <span>মোট:</span>
                  <span style={{ color: '#0F766E' }}>{fmt(lastSale.total)}</span>
                </div>
                {lastSale.paid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>পরিশোধ:</span>
                    <span>{fmt(lastSale.paid)}</span>
                  </div>
                )}
                {lastSale.change > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>ফেরত:</span>
                    <span>{fmt(lastSale.change)}</span>
                  </div>
                )}
                {lastSale.due > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
                    <span>বাকি:</span>
                    <span>{fmt(lastSale.due)}</span>
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} onClick={() => setShowReceiptModal(false)}>
                ✓ সম্পন্ন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
