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
  supplier: string;
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0F766E', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ width: 60, height: 60, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>POS সিস্টেম</h3>
      <p style={{ marginTop: 8, opacity: 0.8 }}>লোড হচ্ছে...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// Login Screen
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const businessName = 'আমার দোকান';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if ((username === 'admin' || username === 'admin@konok.io') && password === 'admin123') {
      localStorage.setItem('pos_user', JSON.stringify(DEFAULT_ADMIN));
      onLogin();
    } else {
      setError('ব্যবহারকারীর নাম বা পাসওয়ার্ড ভুল!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F766E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative Circle */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        background: 'rgba(20, 184, 166, 0.3)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-150px',
        left: '-150px',
        width: '500px',
        height: '500px',
        background: 'rgba(94, 234, 212, 0.2)',
        borderRadius: '50%',
      }} />

      <div style={{ width: '100%', maxWidth: 560, position: 'relative', zIndex: 1 }}>
        {/* Header - Icon left, text right */}
        <div style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '24px 28px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%' }}>
            <div style={{
              width: 60, height: 60,
              background: 'linear-gradient(135deg, #0F766E, #14B8A6)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(15,118,110,0.3)',
            }}>🏪</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0F766E' }}>
                {businessName}
              </h1>
              <div style={{
                fontSize: 18,
                color: '#0F766E',
                fontWeight: 600,
                marginTop: 4,
              }}>
                💼 POS ম্যানেজমেন্ট সিস্টেম
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div style={{
          background: '#fff',
          borderRadius: '0 0 20px 20px',
          padding: '24px 28px 28px',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            {/* Username */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                👤 ইউজার নাম
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 16,
                  border: '2px solid #E5E7EB',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Password */}
            <div style={{ width: 160 }}>
              <label style={{ fontSize: 15, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                🔐 পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                required
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  fontSize: 16,
                  border: '2px solid #E5E7EB',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0F766E'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '14px 24px',
                background: loading ? '#9CA3AF' : '#0F766E',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '⏳' : 'লগইন'}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              background: '#FEF2F2',
              borderRadius: 10,
              color: '#DC2626',
              fontSize: 15,
              fontWeight: 500,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 18, paddingTop: 14, borderTop: '1px dashed #E5E7EB', fontSize: 14, color: '#9CA3AF' }}>
            © {currentYear} {businessName}
          </div>
        </div>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '4px 12px', background: 'rgba(15,118,110,0.05)', borderRadius: 10, border: '1px solid #E5E7EB' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#0F766E' }}>
        {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
        {time.toLocaleDateString('bn-BD', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('pos');

  // Tabs configuration - matching old design
  const otherTabs = [
    { id: 'products', icon: '📦', label: 'সকল পণ্য' },
    { id: 'newproduct', icon: '➕', label: 'নতুন পণ্য' },
    { id: 'barcode', icon: '📊', label: 'বারকোড' },
    { id: 'suppliers', icon: '🏢', label: 'সরবরাহকারী' },
    { id: 'customers', icon: '👥', label: 'কাস্টমার' },
    { id: 'inventory', icon: '🏭', label: 'স্টক' },
    { id: 'lowstock', icon: '⚠️', label: 'স্টক কম' },
    { id: 'income', icon: '💰', label: 'আয়/ব্যয়' },
    { id: 'reports', icon: '📊', label: 'রিপোর্ট' },
    { id: 'settings', icon: '⚙️', label: 'সেটিংস' },
  ];

  // Menu scroll ref
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollMenu = (direction: 'left' | 'right') => {
    if (menuRef.current) {
      const scrollAmount = 150;
      menuRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [heldSales, setHeldSales] = useState<CartItem[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);
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
      { id: 'p1', name: 'সাদা ভাত', code: 'RICE001', costPrice: 80, sellPrice: 120, stock: 50, unit: 'প্লেট', categoryId: 'cat-food', supplier: 'খাবার সরবরাহকারী', image: '🍚' },
      { id: 'p2', name: 'পোলাও', code: 'RICE002', costPrice: 100, sellPrice: 150, stock: 30, unit: 'প্লেট', categoryId: 'cat-food', supplier: 'খাবার সরবরাহকারী', image: '🍛' },
      { id: 'p3', name: 'চিকেন কর্ন', code: 'CHK001', costPrice: 130, sellPrice: 200, stock: 25, unit: 'পিস', categoryId: 'cat-food', supplier: 'খাবার সরবরাহকারী', image: '🍗' },
      { id: 'p4', name: 'কোকা কোলা', code: 'COKE001', costPrice: 20, sellPrice: 30, stock: 100, unit: 'বোতল', categoryId: 'cat-drinks', supplier: 'পানীয় সরবরাহকারী', image: '🥤' },
      { id: 'p5', name: 'পেপসি', code: 'PEP001', costPrice: 15, sellPrice: 25, stock: 80, unit: 'বোতল', categoryId: 'cat-drinks', supplier: 'পানীয় সরবরাহকারী', image: '🥤' },
      { id: 'p6', name: 'চা', code: 'TEA001', costPrice: 8, sellPrice: 15, stock: 200, unit: 'কাপ', categoryId: 'cat-drinks', supplier: 'চা সরবরাহকারী', image: '☕' },
      { id: 'p7', name: 'সাবান', code: 'SOAP001', costPrice: 30, sellPrice: 45, stock: 50, unit: 'পিস', categoryId: 'cat-essentials', supplier: 'পণ্য সরবরাহকারী', image: '🧼' },
      { id: 'p8', name: 'শ্যাম্পু', code: 'SHAM001', costPrice: 100, sellPrice: 150, stock: 30, unit: 'বোতল', categoryId: 'cat-essentials', supplier: 'পণ্য সরবরাহকারী', image: '🧴' },
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
    const matchSupplier = selectedSupplier === 'all' || (p.supplier || '') === selectedSupplier;
    const matchSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const hasStock = p.stock > 0;
    return matchCategory && matchSupplier && matchSearch && hasStock;
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
      {/* Header - Modern Minimal Design */}
      <div style={{ background: '#FFFFFF', padding: '0 24px', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderBottom: '2px solid #0F766E' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,118,110,0.3)' }}>🏪</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 22, color: '#111827', lineHeight: 1.2 }}>POS সিস্টেম</div>
              <div style={{ fontSize: 14, color: '#9CA3AF' }}>POS ম্যানেজমেন্ট সিস্টেম</div>
            </div>
          </div>
          
          {/* Dynamic Menu - Scrollable */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 30, marginRight: 22, minWidth: 0, flex: 1 }}>
            {/* Fixed First Item (বিক্রয়) - Separate container */}
            <div style={{ flexShrink: 0, padding: '4px 6px 4px 4px', background: 'rgba(15,118,110,0.03)', borderRadius: 12, border: '1px solid #E5E7EB', marginRight: 4, boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
              <button onClick={() => setCurrentTab('pos')} style={{
                padding: '7px 12px',
                border: 'none',
                background: currentTab === 'pos' ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' : 'transparent',
                cursor: 'pointer',
                color: currentTab === 'pos' ? '#FFFFFF' : '#4B5563',
                fontWeight: currentTab === 'pos' ? 600 : 500,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
                borderRadius: 6,
                boxShadow: currentTab === 'pos' ? '0 2px 8px rgba(15,118,110,0.3)' : 'none',
              }}>
                <span style={{ fontSize: 16 }}>🛒</span>
                <span>বিক্রয়</span>
              </button>
            </div>

            {/* Scrollable Menu Container */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
              {/* Left Arrow */}
              <button onClick={() => scrollMenu('left')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', marginRight: 4, flexShrink: 0 }}>◀</button>

              {/* Scrollable Menu */}
              <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', gap: 2, padding: '4px 8px', background: 'rgba(15,118,110,0.03)', borderRadius: 12, border: '1px solid #E5E7EB', scrollbarWidth: 'none', msOverflowStyle: 'none', flex: 1, minWidth: 0 }}>
                {otherTabs.map((t) => (
                  <button key={t.id} onClick={() => setCurrentTab(t.id)} style={{
                    padding: '7px 12px',
                    border: 'none',
                    background: currentTab === t.id ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' : 'transparent',
                    cursor: 'pointer',
                    color: currentTab === t.id ? '#FFFFFF' : '#4B5563',
                    fontWeight: currentTab === t.id ? 600 : 500,
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    borderRadius: 6,
                    boxShadow: currentTab === t.id ? '0 2px 8px rgba(15,118,110,0.3)' : 'none',
                  }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button onClick={() => scrollMenu('right')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', marginLeft: 4, flexShrink: 0 }}>▶</button>
            </div>
          </div>

          {/* Actions Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0, marginLeft: 24 }}>
            {/* Refresh Button */}
            <button onClick={handleHardRefresh} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#4B5563' }} title="🔄 হার্ড রিফ্রেশ">🔄</button>
            
            {/* Fullscreen Button */}
            <button onClick={handleFullscreen} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title="⛶ ফুল স্ক্রিন">⛶</button>
            
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title="লগআউট">↩️</button>

            {/* Date & Time */}
            <TimeDisplay />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
        {currentTab === 'pos' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden', width: '100%', background: '#F9FAFB' }}>
            {/* -- LEFT: Products -- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {/* Search Row - with Category & Supplier */}
              <div style={{ padding: '8px 14px', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Barcode Scan */}
                <div style={{ position: 'relative', flex: '0 0 120px' }}>
                  <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 13 }}>📊</span>
                  <input
                    placeholder="বারকোড"
                    style={{ width: '100%', paddingLeft: 28, height: 34, fontSize: 13, borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                
                {/* Product Name Search */}
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 150 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', fontSize: 15 }}>🔍</span>
                  <input
                    value={showHeldSales ? '' : searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={showHeldSales ? 'হোল্ড সেল...' : 'পণ্যের নাম লিখুন...'}
                    disabled={showHeldSales}
                    style={{ width: '100%', paddingLeft: 32, height: 34, fontSize: 13, borderRadius: 7, border: '1.5px solid #E5E7EB', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Category */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={showHeldSales}
                  style={{ borderRadius: 7, padding: '6px 10px', fontSize: 13, height: 34, border: '1px solid #E5E7EB', background: '#FFFFFF', outline: 'none', minWidth: 100, cursor: 'pointer' }}
                >
                  <option value="all">📁 ক্যাটাগরি</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                
                {/* Supplier */}
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  disabled={showHeldSales}
                  style={{ borderRadius: 7, padding: '6px 10px', fontSize: 13, height: 34, border: '1px solid #E5E7EB', background: '#FFFFFF', outline: 'none', minWidth: 100, cursor: 'pointer' }}
                >
                  <option value="all">🏢 সরবরাহকারী</option>
                  {[...new Set(products.map(p => p.supplier || 'অন্যান্য'))].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Stock Summary Row */}
              <div style={{ padding: '6px 14px', background: '#FFFFFF', borderBottom: '1px solid #E5E7EB', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ borderRadius: 8, whiteSpace: 'nowrap', background: '#F0FDFA', color: '#0F766E', border: '1.5px solid rgba(15,118,110,0.3)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                  📦 স্টক আছে <span style={{ fontWeight: 700, marginLeft: 4 }}>({products.filter(p => p.stock > 0).length})</span>
                </div>
                <div style={{ borderRadius: 8, whiteSpace: 'nowrap', background: '#FFF7ED', color: '#EA580C', border: '1.5px solid rgba(234,88,12,0.3)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                  ⚠️ স্টক কম <span style={{ fontWeight: 700, marginLeft: 4 }}>({products.filter(p => p.stock > 0 && p.stock <= 10).length})</span>
                </div>
                <div style={{ borderRadius: 8, whiteSpace: 'nowrap', background: '#FEF2F2', color: '#DC2626', border: '1.5px solid rgba(220,38,38,0.3)', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
                  ⚠️ স্টক শেষ <span style={{ fontWeight: 700, marginLeft: 4 }}>({products.filter(p => p.stock <= 0).length})</span>
                </div>
              </div>

              {/* Product grid */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#F9FAFB' }}>
                {/* Show Held Sales */}
                {showHeldSales && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <h4 style={{ margin: 0, color: '#0F766E', fontSize: 15, fontWeight: 600 }}>📋 হোল্ড সেল ({heldSales.length})</h4>
                      <button onClick={() => setShowHeldSales(false)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: 12, color: '#6B7280' }}>
                        ✕ বন্ধ করুন
                      </button>
                    </div>
                    {heldSales.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12 }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
                        <div style={{ color: '#9CA3AF', fontSize: 14 }}>কোনো হোল্ড সেল নেই</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {heldSales.map((sale, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              // Add held sale items to cart
                              sale.items.forEach(item => {
                                addToCart(products.find(p => p.id === item.productId));
                              });
                              setShowHeldSales(false);
                            }}
                            style={{
                              background: '#fff',
                              border: '1.5px solid #E5E7EB',
                              borderRadius: 12,
                              padding: 12,
                              textAlign: 'left',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                          >
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', marginBottom: 8 }}>📋 হোল্ড #{idx + 1}</div>
                            <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>
                              {sale.items.length} টি আইটেম
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F766E' }}>
                              মোট: {fmt(sale.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0))}
                            </div>
                            <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
                              ক্লিক করে কার্টে যোগ করুন
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Show Products when NOT showing held sales */}
                {!showHeldSales && (
                  filteredProducts.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#FFFFFF', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#0F766E', marginBottom: 8 }}>🏪 আমার দোকান</div>
                        <div style={{ fontSize: 14, color: '#9CA3AF' }}>📞 ০১৭০০-০০০০০০</div>
                      </div>
                      <svg width="200" height="120" viewBox="0 0 280 180" style={{ marginBottom: 16 }}>
                        <rect x="20" y="50" width="240" height="110" rx="8" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2"/>
                        <rect x="50" y="70" width="60" height="60" rx="4" fill="#0F766E"/>
                        <text x="80" y="105" textAnchor="middle" fill="white" fontSize="24">🏪</text>
                        <rect x="130" y="65" width="100" height="50" rx="6" fill="#115E59"/>
                        <circle cx="220" cy="90" r="25" fill="#22C55E"/>
                        <path d="M208 90 L216 98 L232 82" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
                      </svg>
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, color: '#6B7280', fontWeight: 600 }}>পণ্যের নাম বা বারকোড দিয়ে খুঁজুন</div>
                        <div style={{ fontSize: 14, marginTop: 8, color: '#9CA3AF' }}>অথবা ক্যাটাগরি/সরবরাহকারী সিলেক্ট করুন</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {filteredProducts.map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          style={{
                            background: product.stock <= 0 ? '#FEF2F2' : product.stock <= 10 ? '#FFF7ED' : '#FFFFFF',
                            border: `1.5px solid ${product.stock <= 0 ? '#DC2626' : product.stock <= 10 ? '#EA580C' : '#E5E7EB'}`,
                            borderRadius: 12,
                            padding: 12,
                            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            textAlign: 'left',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            outline: 'none',
                            display: 'flex',
                            gap: 12,
                            opacity: product.stock <= 0 ? 0.7 : 1,
                          }}
                        >
                          {/* Product Image */}
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: 10,
                            background: product.stock <= 0 ? '#fecaca' : product.stock <= 10 ? '#fed7aa' : '#F0FDFA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: `2px solid ${product.stock <= 0 ? '#fca5a5' : product.stock <= 10 ? '#fdba74' : '#99f6e4'}`,
                          }}>
                            {product.image && product.image.startsWith('http') ? (
                              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: 36 }}>
                                {/* Auto detect icon based on product name */}
                                {product.name.includes('চা') ? '☕' :
                                 product.name.includes('কফি') || product.name.includes('কোকা') || product.name.includes('কোলা') ? '🥤' :
                                 product.name.includes('পানীয়') || product.name.includes('জুস') || product.name.includes('সফট') ? '🧃' :
                                 product.name.includes('ভাত') || product.name.includes('খাবার') || product.name.includes('খাওয়া') ? '🍚' :
                                 product.name.includes('পোলাও') || product.name.includes('বিরিয়ানি') || product.name.includes('খিচুড়ি') ? '🍛' :
                                 product.name.includes('চিকেন') || product.name.includes('মাংস') || product.name.includes('কারি') ? '🍗' :
                                 product.name.includes('ফল') || product.name.includes('আম') || product.name.includes('কলা') || product.name.includes('আঙ্গুর') ? '🍎' :
                                 product.name.includes('সবজি') || product.name.includes('আলু') || product.name.includes('পটল') ? '🥬' :
                                 product.name.includes('মাছ') || product.name.includes('ভাত') ? '🐟' :
                                 product.name.includes('রুটি') || product.name.includes('ব্রেড') || product.name.includes('পরোটা') ? '🫓' :
                                 product.name.includes('সাবান') ? '🧼' :
                                 product.name.includes('শ্যাম্পু') || product.name.includes('তেল') || product.name.includes('শ্যাম্পু') ? '🧴' :
                                 product.name.includes('টুথ') || product.name.includes('পেস্ট') ? '🪥' :
                                 product.name.includes('পাউডার') || product.name.includes('ক্রিম') ? '🧴' :
                                 product.name.includes('ওষুধ') || product.name.includes('ঔষধ') || product.name.includes('ট্যাবলেট') ? '💊' :
                                 product.name.includes('বিস্কুট') || product.name.includes('কুকি') || product.name.includes('চকলেট') ? '🍪' :
                                 product.name.includes('চিপস') || product.name.includes('নাস্তা') ? '🍿' :
                                 product.name.includes('আইসক্রিম') || product.name.includes('আইস') ? '🍦' :
                                 product.name.includes('সিগারেট') || product.name.includes('সিগারেট') ? '🚬' :
                                 product.name.includes('বই') || product.name.includes('কাগজ') ? '📚' :
                                 product.name.includes('কলম') || product.name.includes('পেন') ? '🖊️' :
                                 product.name.includes('ব্যাগ') ? '👜' :
                                 product.name.includes('জুতা') || product.name.includes('স্যান্ডেল') ? '👟' :
                                 product.name.includes('গেম') || product.name.includes('খেলনা') ? '🎮' :
                                 product.name.includes('ফোন') || product.name.includes('মোবাইল') ? '📱' :
                                 product.name.includes('ল্যাপটপ') || product.name.includes('কম্পিউটার') ? '💻' :
                                 product.name.includes('টাকা') || product.name.includes('কয়েন') ? '💰' :
                                 product.name.includes('স্ট্যাম্প') || product.name.includes('মার্ক') ? '📮' :
                                 product.image ? product.image : '📦'}
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            {/* Top: Name */}
                            <div style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                                {product.name}
                              </div>
                            </div>

                            {/* Middle: Barcode & Unit */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📊 {product.code || 'N/A'}
                              </div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                /{product.unit}
                              </div>
                            </div>

                            {/* Bottom: Price & Stock */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: product.stock <= 0 ? '#DC2626' : product.stock <= 10 ? '#EA580C' : '#0F766E', lineHeight: 1 }}>
                                {fmt(product.sellPrice)}
                              </div>
                              <div style={{ 
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: product.stock <= 0 ? '#DC2626' : product.stock <= 10 ? '#EA580C' : '#0F766E',
                                color: '#fff'
                              }}>
                                স্টক: {product.stock}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
              </div>
            </div>

            {/* -- RIGHT: Cart -- */}
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', background: '#fafbfc', borderLeft: '1px solid #e5e7eb' }}>
              {/* Cart Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#FFFFFF', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>🛒 কার্ট</h3>
                  <span style={{ background: '#111827', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>{cart.length}</span>
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflow: 'auto', background: '#fafbfc' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', background: '#FFFFFF', margin: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>কার্ট খালি</div>
                    <div style={{ fontSize: 15, color: '#9CA3AF' }}>বাম দিক থেকে পণ্য যোগ করুন</div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 16px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', background: '#FFFFFF', borderBottom: '1px dashed #e5e7eb', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name}</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F766E', flexShrink: 0 }}>{fmt(item.sellPrice * item.quantity)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                            <span style={{ fontSize: 14, color: '#6B7280' }}>{item.quantity} × {fmt(item.sellPrice)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => updateQuantity(item.productId, -1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>−</button>
                              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.productId, 1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>+</button>
                              <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#FEF2F2', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginLeft: 4 }}>✕</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div style={{ padding: '10px 12px', background: '#FFFFFF', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
                <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ background: '#F3F4F6', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db' }}>
                    <span style={{ fontSize: 15, color: '#4B5563', fontWeight: 600 }}>সাবটোটাল ({cart.reduce((s, i) => s + i.quantity, 0)} আইটেম)</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>{fmt(subtotal)}</span>
                  </div>
                  {(parseFloat(discount) || 0) > 0 && (
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', background: '#F0FDF4' }}>
                      <span style={{ fontSize: 15, color: '#16A34A' }}>ছাড়</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#16A34A' }}>−{fmt(parseFloat(discount) || 0)}</span>
                    </div>
                  )}
                  {vatAmount > 0 && (
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', background: '#FFFBEB' }}>
                      <span style={{ fontSize: 15, color: '#D97706' }}>ভ্যাট ({vatPercent}%)</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#D97706' }}>+{fmt(vatAmount)}</span>
                    </div>
                  )}
                  <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827' }}>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>মোট দেনা</span>
                    <span style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Discount & VAT Inputs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0"
                    placeholder="ছাড়"
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 14, outline: 'none', background: '#fafbfc', boxSizing: 'border-box', color: '#16A34A' }}/>
                  <input value={vatPercent} onChange={(e) => setVatPercent(parseFloat(e.target.value) || 0)} type="number" min="0" max="100"
                    placeholder="ভ্যাট"
                    style={{ width: 55, border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 6px', fontSize: 14, outline: 'none', background: '#fafbfc', boxSizing: 'border-box', color: '#D97706', textAlign: 'center' }}/>
                </div>

                {/* Payment Input */}
                <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} type="number" min="0"
                  placeholder="পরিশোধ (৳)"
                  style={{ padding: '10px 14px', fontSize: 16, fontWeight: 700, borderRadius: 8, marginBottom: 6, border: '2px solid #e5e7eb', background: '#fff', boxSizing: 'border-box', width: '100%', textAlign: 'center', color: '#111827', outline: 'none' }}
                />

                {/* Due/Change Alert */}
                {due > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>
                    ⚠️ বাকি: {fmt(due)}
                  </div>
                )}
                {change > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#F0FDF4', color: '#16A34A', fontWeight: 600, textAlign: 'center' }}>
                    💵 ফেরত: {fmt(change)}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 6 }}>
                  <button onClick={() => { setCart([]); setDiscount(''); setPaidAmount(''); }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', color: '#4B5563', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                    🗑️
                  </button>
                  <button onClick={() => {
                    if (cart.length > 0) {
                      setHeldSales([...heldSales, { id: `hold-${Date.now()}`, items: [...cart], sellPrice: 0, costPrice: 0, quantity: 0, unit: '', maxStock: 0, productId: '' }]);
                      setCart([]);
                      setDiscount('');
                      setPaidAmount('');
                    }
                  }}
                    disabled={cart.length === 0}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: 'none',
                      background: cart.length > 0 ? '#0F766E' : '#e5e7eb',
                      color: '#fff', fontWeight: 600, fontSize: 13,
                      cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    }}>
                    📋 হোল্ড {heldSales.length > 0 && `(${heldSales.length})`}
                  </button>
                  <button onClick={handleCheckout}
                    disabled={cart.length === 0}
                    style={{
                      padding: '12px 16px', borderRadius: 10, border: 'none',
                      background: cart.length > 0 ? '#EA580C' : '#e5e7eb',
                      color: '#fff', fontWeight: 700, fontSize: 15,
                      cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                      boxShadow: cart.length > 0 ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                    }}>
                    ✓ বিক্রয় সম্পন্ন
                  </button>
                </div>
              </div>
            </div>
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

        {currentTab === 'newproduct' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>➕ নতুন পণ্য যোগ করুন</h2>
            <div className="card" style={{ maxWidth: 600 }}>
              <div className="form-group">
                <label className="label">পণ্যের নাম</label>
                <input type="text" className="input" placeholder="পণ্যের নাম লিখুন" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="label">ক্রয়মূল্য</label>
                  <input type="number" className="input" placeholder="০" />
                </div>
                <div className="form-group">
                  <label className="label">বিক্রয়মূল্য</label>
                  <input type="number" className="input" placeholder="০" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">স্টক</label>
                <input type="number" className="input" placeholder="০" />
              </div>
              <button className="btn btn-primary">পণ্য যোগ করুন</button>
            </div>
          </div>
        )}

        {currentTab === 'barcode' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>📊 বারকোড জেনারেটর</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="label">পণ্য কোড</label>
                <input type="text" className="input" placeholder="কোড লিখুন" />
              </div>
              <button className="btn btn-primary">বারকোড তৈরি করুন</button>
              <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#F9FAFB', borderRadius: 8 }}>
                <div style={{ fontSize: 48 }}>📊</div>
                <p style={{ color: '#9CA3AF', marginTop: 8 }}>বারকোড এখানে দেখা যাবে</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'suppliers' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🏢 সরবরাহকারী</h2>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ color: '#6B7280' }}>মোট: ০ জন</span>
                <button className="btn btn-primary">➕ নতুন যোগ করুন</button>
              </div>
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>কোনো সরবরাহকারী নেই</p>
            </div>
          </div>
        )}

        {currentTab === 'inventory' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>🏭 ইনভেন্টরি</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>মোট পণ্য</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>স্টক কম</div>
              </div>
              <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>স্টক আছে</div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'lowstock' && (
          <div>
            <h2 style={{ marginBottom: 16, color: '#DC2626' }}>⚠️ স্টক কম আছে</h2>
            <div className="card">
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 40 }}>কোনো পণ্য স্টক কম নেই</p>
            </div>
          </div>
        )}

        {currentTab === 'income' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💰 আয়/ব্যয়</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>মোট আয়</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📉</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>মোট ব্যয়</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>➕ নতুন লেনদেন</h3>
              <div className="form-group">
                <label className="label">বিবরণ</label>
                <input type="text" className="input" placeholder="লেনদেনের বিবরণ" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="label">টাকা</label>
                  <input type="number" className="input" placeholder="০" />
                </div>
                <div className="form-group">
                  <label className="label">ধরন</label>
                  <select className="input">
                    <option value="income">আয়</option>
                    <option value="expense">ব্যয়</option>
                  </select>
                </div>
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
