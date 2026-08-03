import { useState, useEffect, useRef, useMemo, memo } from "react";

/* ─────────────── GLOBAL CSS RESET ─────────────── */
const GlobalStyle = () => {
  return null;
};

/* ─────────────── UTILITIES ─────────────── */
const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
const fmt = (n) => `৳${(+n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtN = (n) => (+n||0).toLocaleString('en-IN');
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

/* ─────────────── BANNER IMAGE UPLOAD ─────────────── */
function BannerImageUpload({ value, onChange }) {
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  // Sync preview with value prop
  useEffect(() => {
    if (value) {
      setPreview(value);
    } else {
      setPreview('');
    }
  }, [value]);

  const processFile = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('শুধুমাত্র ছবি ফাইল আপলোড করুন!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ 5MB এর বেশি হওয়া উচিত নয়!');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target.result;
      setPreview(data);
      if (onChange && typeof onChange === 'function') {
        onChange(data);
      }
    };
    reader.onerror = () => {
      console.error('FileReader error');
      alert('ছবি পড়তে সমস্যা হয়েছে!');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleRemove = () => {
    setPreview('');
    if (onChange && typeof onChange === 'function') {
      onChange('');
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  if (preview) {
    return (
      <div style={{ marginBottom: 16, position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 500 }}>
        <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
        <button 
          onClick={handleRemove}
          style={{
            position: 'absolute', top: 10, right: 10, padding: '8px 14px',
            background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: 8,
            cursor: 'pointer', fontSize: 13, fontWeight: 600
          }}
        >
          ✕ মুছুন
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        id="banner-upload"
        style={{ display: 'none' }}
      />
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          padding: '24px', border: `2px dashed ${isDragging ? '#0F766E' : '#d1d5db'}`,
          borderRadius: 12, background: isDragging ? '#F0FDFA' : '#f9fafb',
          cursor: 'pointer', fontSize: 14, color: '#6b7280', maxWidth: 500,
          transition: 'all 0.2s'
        }}
      >
        <span style={{ fontSize: 28 }}>📁</span>
        <span>ছবি আপলোড করুন (JPG, PNG - সর্বোচ্চ 5MB)</span>
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
        অথবা ছবিটি এখানে টেনে আনুন
      </p>
    </div>
  );
}

/* ─────────────── STORAGE KEYS ─────────────── */
const STORAGE_KEYS = {
  products: 'pos_products',
  customers: 'pos_customers',
  sales: 'pos_sales',
  settings: 'pos_settings',
  suppliers: 'pos_suppliers',
  categories: 'pos_categories',
  purchases: 'pos_purchases',
  users: 'pos_users',
  auth: 'pos_auth',
  productHistory: 'pos_product_history',
};

/* ─────────────── STORAGE ─────────────── */
const db = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.error(e); }
  },
  clear() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

/* ─────────────── DEFAULT SUPER ADMIN ─────────────── */
const DEFAULT_SUPER_ADMIN = {
  email: 'admin@konok.io',
  password: '@rsm@k@1A',
  role: 'super_admin',
  name: 'Super Admin',
};

/* ─────────────── DEMO DATA ─────────────── */
const DEMO = {
  products: [],
  customers: [],
  suppliers: [],
  categories: [],
};

/* ─────────────── DESIGN TOKENS ─────────────── */
const T = {
  teal:'#0F766E', tealDark:'#115E59', tealLight:'#F0FDFA', tealMid:'#CCFBF1',
  orange:'#EA580C', orangeLight:'#FFF7ED',
  green:'#16A34A', greenLight:'#F0FDF4',
  red:'#DC2626', redLight:'#FEF2F2',
  amber:'#D97706', amberLight:'#FFFBEB',
  gray50:'#F9FAFB', gray100:'#F3F4F6', gray200:'#E5E7EB',
  gray400:'#9CA3AF', gray600:'#4B5563', gray800:'#1F2937', gray900:'#111827',
  white:'#FFFFFF',
};

const btn = (type='default',size='md') => {
  const bg = {primary:T.teal,sell:T.orange,success:T.green,danger:T.red,ghost:'transparent',default:T.gray100}[type];
  const color = ['primary','sell','success','danger'].includes(type) ? T.white : type==='ghost' ? T.gray600 : T.gray800;
  const border = type==='ghost' ? `1px solid ${T.gray200}` : 'none';
  return {
    padding: size==='sm' ? '5px 10px' : size==='lg' ? '12px 24px' : '8px 14px',
    fontSize: size==='sm' ? 12 : size==='lg' ? 15 : 13,
    background: bg, color, border,
    borderRadius:7, cursor:'pointer', fontWeight:600,
    display:'inline-flex', alignItems:'center', gap:5,
    transition:'all 0.15s',
  };
};
const input = {
  padding:'8px 12px', border:`1px solid ${T.gray200}`, borderRadius:7,
  fontSize:14, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'inherit', background:T.white, color:T.gray900,
  transition:'border-color 0.15s',
};
const card = {
  background:T.white, borderRadius:10, padding:16,
  boxShadow:'0 1px 4px rgba(0,0,0,0.08)', border:`1px solid ${T.gray200}`,
};
const label = { fontSize:11, fontWeight:700, color:T.gray400, marginBottom:4, display:'block', textTransform:'uppercase', letterSpacing:'0.5px' };

/* ─────────────── MODAL WRAPPER ─────────────── */
function Modal({onClose, title, children, width=460}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{...card,width,maxWidth:'100%',maxHeight:'90vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{margin:0,fontSize:16,color:T.gray900}}>{title}</h3>
          <button onClick={onClose} style={{...btn('ghost','sm'),padding:'4px 8px',fontSize:16}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────── DYNAMIC MENU COMPONENT ─────────────── */
function DynamicMenu({tab, setTab, tabs}) {
  const menuRef = useRef(null);

  const scrollMenu = (direction) => {
    if (menuRef.current) {
      const scrollAmount = 150;
      menuRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Separate first item (বিক্রয়/POS) from the rest
  const firstItem = tabs.find(t => t.id === 'pos');
  const otherTabs = tabs.filter(t => t.id !== 'pos');

  // Menu groups for rest of the tabs
  const menuGroups = [
    { id: 'inventory', items: otherTabs.filter(t => ['products', 'newproduct'].includes(t.id)) },
    { id: 'management', items: otherTabs.filter(t => ['suppliers', 'customers'].includes(t.id)) },
    { id: 'tools', items: otherTabs.filter(t => ['barcode', 'inventory', 'income', 'reports', 'settings'].includes(t.id)) },
  ];

  const renderMenuButton = (t) => {
    const isActive = tab === t.id;
    return (
      <button key={t.id} onClick={() => setTab(t.id)} style={{
        padding: '6px 10px',
        border: 'none',
        background: isActive 
          ? 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)' 
          : 'transparent',
        cursor: 'pointer',
        color: isActive ? T.white : T.gray600,
        fontWeight: isActive ? 600 : 500,
        fontSize: 12,
        display: 'flex', 
        alignItems: 'center', 
        gap: 6,
        whiteSpace: 'nowrap', 
        fontFamily: 'inherit',
        transition: 'all 0.2s',
        borderRadius: 6,
        boxShadow: isActive ? '0 2px 8px rgba(15,118,110,0.3)' : 'none',
      }}
      onMouseOver={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(15,118,110,0.08)';
          e.currentTarget.style.color = T.teal;
        }
      }}
      onMouseOut={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = T.gray600;
        }
      }}>
        <span style={{fontSize: 15}}>{t.icon}</span>
        <span>{t.label}</span>
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 30,
      marginRight: 22,
      minWidth: 0,
    }}>
      {/* Fixed First Item (বিক্রয়/POS) */}
      {firstItem && (
        <div style={{
          flexShrink: 0,
          padding: '4px 6px 4px 4px',
          background: 'rgba(15,118,110,0.03)',
          borderRadius: 12,
          border: `1px solid ${T.gray200}`,
          marginRight: 4,
          position: 'relative',
          zIndex: 2,
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}>
          {renderMenuButton(firstItem)}
        </div>
      )}

      {/* Scrollable Menu Container with Left Arrow */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        minWidth: 0,
      }}>
        {/* Left Arrow */}
        <button onClick={() => scrollMenu('left')} style={{
          width: 28,
          height: 28,
          border: 'none',
          background: T.gray100,
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: T.gray600,
          marginRight: 4,
          flexShrink: 0,
          zIndex: 1,
        }}>◀</button>

        {/* Scrollable Menu */}
        <div ref={menuRef} style={{
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          gap: 2,
          padding: '4px 8px',
          background: 'rgba(15,118,110,0.03)',
          borderRadius: 12,
          border: `1px solid ${T.gray200}`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          flex: 1,
          minWidth: 0,
        }}>
        {/* Menu Groups with Dividers */}
        {menuGroups.map((group, groupIdx) => (
          <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {group.items.map(t => renderMenuButton(t))}
            {groupIdx < menuGroups.length - 1 && (
              <div style={{ width: 1, background: T.gray200, margin: '0 4px', borderRadius: 2, height: 20 }} />
            )}
          </div>
        ))}
        </div>

        {/* Right Arrow */}
        <button onClick={() => scrollMenu('right')} style={{
          width: 28,
          height: 28,
          border: 'none',
          background: T.gray100,
          borderRadius: 6,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: T.gray600,
          marginLeft: 4,
          flexShrink: 0,
        }}>▶</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGIN SCREEN
═══════════════════════════════════════════ */
function LoginScreen({ onLogin, settings }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const businessName = settings?.name || 'আপনার দোকান';
  const businessAddress = settings?.address || '';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));

    // Check credentials
    const users = db.get(STORAGE_KEYS.users) || [];
    const allUsers = [DEFAULT_SUPER_ADMIN, ...users];
    
    const user = allUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const authData = {
        email: user.email,
        name: user.name,
        role: user.role,
        loginTime: new Date().toISOString(),
      };
      db.set(STORAGE_KEYS.auth, authData);
      onLogin(authData);
    } else {
      setError('❌ ইমেইল বা পাসওয়ার্ড ভুল!');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F766E 0%, #115E59 50%, #134E4A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Floating Elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: 120,
        height: 120,
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: 200,
        height: 200,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        filter: 'blur(60px)',
      }} />

      {/* Login Card */}
      <div style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: '48px 44px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.2)',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          {/* Logo Icon */}
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(15,118,110,0.4)',
          }}>🏪</div>
          
          <h1 style={{ 
            margin: '0 0 6px', 
            fontSize: 24, 
            fontWeight: 700, 
            color: '#1E293B',
            letterSpacing: '-0.5px'
          }}>
            {businessName}
          </h1>
          
          {businessAddress && (
            <div style={{ 
              marginBottom: 14,
              fontSize: 13, 
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap'
            }}>
              {businessAddress}
            </div>
          )}
          
          {/* System Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 18px',
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            borderRadius: 25,
            marginTop: 6,
            boxShadow: '0 4px 12px rgba(15,118,110,0.3)',
          }}>
            <span style={{ fontSize: 16 }}>💼</span>
            <span style={{ 
              fontSize: 13, 
              color: '#FFFFFF',
              fontWeight: 600,
              letterSpacing: '0.3px'
            }}>
              POS ম্যানেজমেন্ট সিস্টেম
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, #E2E8F0, transparent)',
          marginBottom: 32,
        }} />

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          {/* Email Field */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ 
              display: 'block',
              marginBottom: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.2px'
            }}>
              📧 ইমেইল
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourbusiness.com"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: '2px solid #E2E8F0',
                borderRadius: 12,
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                color: '#1E293B',
                background: '#F8FAFC',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0F766E';
                e.target.style.boxShadow = '0 0 0 4px rgba(15,118,110,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ 
              display: 'block',
              marginBottom: 8,
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              letterSpacing: '0.2px'
            }}>
              🔐 পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 15,
                border: '2px solid #E2E8F0',
                borderRadius: 12,
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                color: '#1E293B',
                background: '#F8FAFC',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0F766E';
                e.target.style.boxShadow = '0 0 0 4px rgba(15,118,110,0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E2E8F0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '14px 16px',
              background: '#FEF2F2',
              borderRadius: 12,
              marginBottom: 24,
              color: '#DC2626',
              fontSize: 14,
              fontWeight: 500,
              border: '1px solid #FECACA',
            }}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '15px',
              background: loading ? '#94A3B8' : 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 8px 20px rgba(15,118,110,0.4)',
              letterSpacing: '0.3px',
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
          >
            {loading ? '⏳ লোড হচ্ছে...' : '🔓 লগইন করুন'}
          </button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 36, textAlign: 'center' }}>
          <p style={{ 
            margin: 0, 
            fontSize: 12, 
            color: '#94A3B8',
            letterSpacing: '0.2px'
          }}>
            © {currentYear} {businessName}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── MAIN APP ─────────────── */
const DEFAULT_SETTINGS = {name:'আমার দোকান',address:'',phone:'',vatEnabled:true,vatPercent:15};

function LoginPage({ onLogin }) {
  return <LoginScreen onLogin={onLogin} settings={DEFAULT_SETTINGS} />;
}

// Separate component for time display - prevents re-rendering entire MainApp
function TimeDisplay() {
  const [currentTime, setCurrentTime] = useState(null);
  
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div style={{textAlign:'right',paddingLeft:14}}>
      <div style={{fontSize:14,fontWeight:600,color:T.gray900}}>
        {currentTime ? currentTime.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--:--:--'}
      </div>
      <div style={{fontSize:11,color:T.gray400}}>
        {currentTime ? currentTime.toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}) : '------'}
      </div>
    </div>
  );
}

function MainApp({ currentUser, onLogout }) {
  const logoutRef = useRef(onLogout);
  logoutRef.current = onLogout;
  
  const [tab, setTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [productHistory, setProductHistory] = useState([]);
  const [ready, setReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // CSS Reset
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  }, []);

  // Initialize time and tab from localStorage on mount
  useEffect(() => {
    // Initialize tab from localStorage
    const savedTab = localStorage.getItem('pos_current_tab');
    if (savedTab) {
      setTab(savedTab);
    }
  }, []);

  // Save tab to localStorage when it changes
  useEffect(() => {
    if (tab) {
      localStorage.setItem('pos_current_tab', tab);
    }
  }, [tab]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-enter fullscreen on page load if it was requested before reload
  useEffect(() => {
    const wantFullscreen = localStorage.getItem('pos_want_fullscreen');
    if (wantFullscreen === 'true') {
      localStorage.removeItem('pos_want_fullscreen');
      // Wait for page to fully load, then try fullscreen
      const tryFullscreen = () => {
        try {
          document.documentElement.requestFullscreen().then(() => {
            setIsFullscreen(true);
          }).catch(() => {
            // Try again after a short delay
            setTimeout(() => {
              try {
                document.documentElement.requestFullscreen().catch(() => {});
              } catch(e) {}
            }, 500);
          });
        } catch(e) {}
      };
      // Delay to ensure page is ready
      if (document.readyState === 'complete') {
        setTimeout(tryFullscreen, 300);
      } else {
        window.addEventListener('load', () => setTimeout(tryFullscreen, 300));
      }
    }
  }, []);

  useEffect(() => {
    // Check if reset was done - flag stays forever to prevent DEMO loading
    const wasReset = db.get('pos_reset_done');
    
    // Load from localStorage
    const savedProducts = db.get(STORAGE_KEYS.products);
    const savedCustomers = db.get(STORAGE_KEYS.customers);
    const savedSales = db.get(STORAGE_KEYS.sales);
    const savedSettings = db.get(STORAGE_KEYS.settings);
    const savedSuppliers = db.get(STORAGE_KEYS.suppliers) || [];
    const savedPurchases = db.get(STORAGE_KEYS.purchases) || [];
    const savedCategories = db.get(STORAGE_KEYS.categories) || [];
    const savedProductHistory = db.get(STORAGE_KEYS.productHistory) || [];

    // If reset was done, always use empty data (never load DEMO)
    if (wasReset) {
      setProducts(savedProducts || []);
      setCustomers(savedCustomers || []);
      setCategories(savedCategories);
      setSuppliers(savedSuppliers);
      setSales(savedSales || []);
      setPurchases(savedPurchases);
      setProductHistory(savedProductHistory);
      setSettings(savedSettings ? {...{...DEFAULT_SETTINGS}, ...savedSettings} : {...DEFAULT_SETTINGS});
      setReady(true);
      return;
    }

    // If no data exists and not reset, load DEMO data
    if (!savedProducts || savedProducts.length === 0) {
      setProducts(DEMO.products);
      db.set(STORAGE_KEYS.products, DEMO.products);
    } else {
      setProducts(savedProducts);
    }

    if (!savedCustomers || savedCustomers.length === 0) {
      setCustomers(DEMO.customers);
      db.set(STORAGE_KEYS.customers, DEMO.customers);
    } else {
      setCustomers(savedCustomers);
    }

    setSales(savedSales || []);
    setSuppliers(savedSuppliers);
    setPurchases(savedPurchases);
    setProductHistory(savedProductHistory);

    // Migrate old category products to new categories state
    if (savedCategories && savedCategories.length > 0) {
      setCategories(savedCategories);
    } else if (savedProducts) {
      const oldCategories = savedProducts
        .filter(p => p.name?.includes('(ক্যাটাগরি)'))
        .map(p => ({ id: p.id, name: p.cat, company: p.company }));
      if (oldCategories.length > 0) {
        setCategories(oldCategories);
        db.set(STORAGE_KEYS.categories, oldCategories);
        // Remove old category products from products
        const realProducts = savedProducts.filter(p => !p.name?.includes('(ক্যাটাগরি)'));
        setProducts(realProducts);
        db.set(STORAGE_KEYS.products, realProducts);
      } else {
        setCategories([]);
      }
    } else {
      setCategories([]);
    }

    const defaultSettings = {...DEFAULT_SETTINGS};
    setSettings(savedSettings ? {...defaultSettings, ...savedSettings} : defaultSettings);

    setReady(true);
  }, []);

  // Auto-logout after 15 minutes of inactivity
  useEffect(() => {
    const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logoutRef.current();
      }, INACTIVITY_TIME);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    // Start the timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // Track product history when products are updated
  const trackProductHistory = (oldProducts, newProducts, user) => {
    const changes = [];
    
    newProducts.forEach(newP => {
      const oldP = oldProducts.find(p => p.id === newP.id);
      
      if (oldP) {
        // Check for price changes
        if (oldP.buyP !== newP.buyP) {
          changes.push({
            id: genId(),
            productId: newP.id,
            productName: newP.name,
            type: 'price_buy',
            oldValue: oldP.buyP,
            newValue: newP.buyP,
            user: user?.name || 'Unknown',
            userEmail: user?.email || '',
            timestamp: now(),
          });
        }
        
        if (oldP.sellP !== newP.sellP) {
          changes.push({
            id: genId(),
            productId: newP.id,
            productName: newP.name,
            type: 'price_sell',
            oldValue: oldP.sellP,
            newValue: newP.sellP,
            user: user?.name || 'Unknown',
            userEmail: user?.email || '',
            timestamp: now(),
          });
        }
        
        // Check for stock changes (increase or decrease)
        if (oldP.stock !== newP.stock) {
          changes.push({
            id: genId(),
            productId: newP.id,
            productName: newP.name,
            type: 'stock',
            oldValue: oldP.stock,
            newValue: newP.stock,
            user: user?.name || 'Unknown',
            userEmail: user?.email || '',
            timestamp: now(),
          });
        }
      } else {
        // New product being added - track initial stock if > 0
        if (newP.stock > 0) {
          changes.push({
            id: genId(),
            productId: newP.id,
            productName: newP.name,
            type: 'stock',
            oldValue: 0,
            newValue: newP.stock,
            user: user?.name || 'Unknown',
            userEmail: user?.email || '',
            timestamp: now(),
          });
        }
      }
    });
    
    if (changes.length > 0) {
      const newHistory = [...productHistory, ...changes];
      setProductHistory(newHistory);
      db.set(STORAGE_KEYS.productHistory, newHistory);
    }
  };

  const upd = {
    products: v => { 
      trackProductHistory(products, v, currentUser); 
      setProducts(v); 
      db.set(STORAGE_KEYS.products, v); 
      return Promise.resolve(); 
    },
    customers: v => { setCustomers(v); db.set(STORAGE_KEYS.customers, v); return Promise.resolve(); },
    sales: v => { setSales(v); db.set(STORAGE_KEYS.sales, v); return Promise.resolve(); },
    settings: v => { setSettings(v); db.set(STORAGE_KEYS.settings, v); return Promise.resolve(); },
    suppliers: v => { setSuppliers(v); db.set(STORAGE_KEYS.suppliers, v); return Promise.resolve(); },
    categories: v => { setCategories(v); db.set(STORAGE_KEYS.categories, v); return Promise.resolve(); },
    purchases: v => { setPurchases(v); db.set(STORAGE_KEYS.purchases, v); return Promise.resolve(); },
  };

  if (!ready) return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'#0F766E',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:20}}>
      <div style={{fontSize:64}}>🏪</div>
      <div style={{color:'white',fontSize:24,fontWeight:'bold'}}>POS সিস্টেম</div>
      <div style={{color:'rgba(255,255,255,0.8)',fontSize:16}}>লোড হচ্ছে...</div>
    </div>
  );

  const tabs = [
    {id:'pos',icon:'🛒',label:'বিক্রয়'},
    {id:'products',icon:'📦',label:'সকল পণ্য'},
    {id:'newproduct',icon:'➕',label:'নতুন পণ্য'},
    {id:'barcode',icon:'📊',label:'বারকোড'},
    {id:'suppliers',icon:'🏢',label:'ম্যানেজমেন্ট'},
    {id:'customers',icon:'👥',label:'কাস্টমার'},
    {id:'inventory',icon:'🏭',label:'স্টক'},
    {id:'lowstock',icon:'⚠️',label:'স্টক কম'},
    {id:'income',icon:'💰',label:'আয়/ব্যয়'},
    {id:'reports',icon:'📊',label:'রিপোর্ট'},
    {id:'settings',icon:'⚙️',label:'সেটিংস'},
  ];

  const props = {products, customers, sales, settings, suppliers, categories, purchases, productHistory, upd};

  // Refresh data from localStorage without reloading page
  const handleHardRefresh = () => {
    const wasReset = db.get('pos_reset_done');
    
    const savedProducts = db.get(STORAGE_KEYS.products);
    const savedCustomers = db.get(STORAGE_KEYS.customers);
    const savedSales = db.get(STORAGE_KEYS.sales);
    const savedSettings = db.get(STORAGE_KEYS.settings);
    const savedSuppliers = db.get(STORAGE_KEYS.suppliers) || [];
    const savedPurchases = db.get(STORAGE_KEYS.purchases) || [];
    const savedCategories = db.get(STORAGE_KEYS.categories) || [];

    if (wasReset) {
      setProducts([...savedProducts] || []);
      setCustomers([...savedCustomers] || []);
      setCategories([...savedCategories]);
      setSuppliers([...savedSuppliers]);
      setSales([...savedSales] || []);
      setPurchases([...savedPurchases]);
      setSettings({...savedSettings} || {...DEFAULT_SETTINGS});
    } else {
      setProducts([...savedProducts] || [...DEMO.products]);
      setCustomers([...savedCustomers] || [...DEMO.customers]);
      setSales([...savedSales] || []);
      setSuppliers([...savedSuppliers]);
      setPurchases([...savedPurchases]);
      setCategories([...savedCategories]);
      setSettings({...savedSettings} || {...DEFAULT_SETTINGS});
    }
  };

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      localStorage.setItem('pos_want_fullscreen', 'true');
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Fullscreen error:', err);
      });
    } else {
      localStorage.removeItem('pos_want_fullscreen');
      document.exitFullscreen();
    }
  };

  return (
    <>
      <GlobalStyle />
      <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100%',background:T.gray50,fontFamily:'BanglaFont, "Segoe UI", system-ui, sans-serif',color:T.gray900,overflow:'hidden'}}>
      {/* Header - Modern Minimal Design */}
      <div style={{background:T.white,padding:'0 24px',flexShrink:0,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',borderBottom:`2px solid ${T.teal}`}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
          {/* Logo Section */}
          <div style={{display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
            <div style={{width:44,height:44,background:'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,boxShadow:'0 4px 12px rgba(15,118,110,0.3)'}}>🏪</div>
            <div>
              <div style={{fontWeight:800,fontSize:17,color:T.gray900,lineHeight:1.2}}>{settings.name}</div>
              <div style={{fontSize:11,color:T.gray400}}>POS ম্যানেজমেন্ট সিস্টেম</div>
            </div>
          </div>
          
          {/* Dynamic Menu */}
          <DynamicMenu tab={tab} setTab={setTab} tabs={tabs} />
          
          {/* Actions Section */}
          <div style={{display:'flex',alignItems:'center',gap:14,flexShrink:0,marginLeft:24}}>
            {/* Refresh Button */}
            <button onClick={handleHardRefresh} style={{width:34,height:34,borderRadius:8,border:'1px solid #e5e7eb',background:T.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,transition:'all 0.2s',color:T.gray500}} title="রিফ্রেশ">
              🔄
            </button>
            
            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} style={{width:34,height:34,borderRadius:8,border:'1px solid #e5e7eb',background: isFullscreen ? T.white : T.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,transition:'all 0.2s',color: T.gray500}} title={isFullscreen?"ফুল স্ক্রিন বন্ধ":"ফুল স্ক্রিন"}>
              {isFullscreen ? '✕' : '⛶'}
            </button>
            
            {/* Logout Button */}
            <button onClick={onLogout} style={{width:34,height:34,borderRadius:8,border:'1px solid #e5e7eb',background:T.white,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,transition:'all 0.2s',color:T.gray500}} title="লগআউট">
              <span style={{fontSize:16}}>↩️</span>
            </button>

            {/* Date & Time - Rightmost (Separate component to prevent re-renders) */}
            <TimeDisplay />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:'hidden',width:'100%'}}>
        {tab==='pos'       && <POSScreen {...props} />}
        {tab==='products'  && <ProductsScreen {...props} />}
        {tab==='newproduct' && <NewProductScreen {...props} />}
        {tab==='barcode'   && <BarcodeScreen {...props} />}
        {tab==='suppliers' && <SuppliersScreen {...props} />}
        {tab==='customers' && <CustomersScreen {...props} />}
        {tab==='inventory' && <InventoryScreen {...props} />}
        {tab==='lowstock'  && <LowStockScreen {...props} />}
        {tab==='income'    && <IncomeScreen {...props} />}
        {tab==='reports'   && <ReportsScreen {...props} />}
        {tab==='settings'  && <SettingsScreen {...props} />}
      </div>
    </div>
    </>
  );
}

/* ─────────────── APP WRAPPER ─────────────── */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const auth = db.get(STORAGE_KEYS.auth);
    return !!auth;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return db.get(STORAGE_KEYS.auth) || null;
  });

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    db.set(STORAGE_KEYS.auth, null);
    localStorage.removeItem(STORAGE_KEYS.auth);
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} settings={DEFAULT_SETTINGS} />;
  }

  return <MainApp currentUser={currentUser} onLogout={handleLogout} />;
}

/* ═══════════════════════════════════════════
   POS SCREEN
═══════════════════════════════════════════ */
function POSScreen({products, customers, sales, settings, categories, upd}) {
  // Initialize cart from localStorage in useEffect to avoid hydration issues
  const [cart, setCart] = useState([]);
  const [selCust, setSelCust] = useState(null);
  const [custQ, setCustQ] = useState('');
  
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('pos_cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedCust = localStorage.getItem('pos_selCust');
      if (savedCust) {
        const c = JSON.parse(savedCust);
        setSelCust(c);
        setCustQ(c ? c.name : '');
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart]);
  
  useEffect(() => {
    localStorage.setItem('pos_selCust', JSON.stringify(selCust));
  }, [selCust]);
  
  const [search, setSearch] = useState('');
  const searchRef = useRef();
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState(settings.vatPercent || 15);
  const [paid, setPaid] = useState('');
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');
  const paidRef = useRef();
  const checkoutRef = useRef();
  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  // Auto focus search field on mount
  useEffect(() => { 
    searchRef.current?.focus(); 
  }, []);

  // Handle TAB key in search field to move to paid input
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Tab' && cart.length > 0) {
      e.preventDefault();
      if (paidRef.current) {
        paidRef.current.focus();
        paidRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('[data-cat-dropdown]')) {
        setShowCatDrop(false);
      }
      if (!e.target.closest('[data-comp-dropdown]')) {
        setShowCompDrop(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const [selCat, setSelCat] = useState('স্টক আছে');
  const [selComp, setSelComp] = useState('সব কোম্পানি');
  const [catSearch, setCatSearch] = useState('');
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [compSearch, setCompSearch] = useState('');
  const [showCompDrop, setShowCompDrop] = useState(false);
  
  // Calculate counts for each category (only products with stock > 0)
  const catCounts = {};
  products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && p.stock > 0 && p.cat).forEach(p => {
    catCounts[p.cat] = (catCounts[p.cat] || 0) + 1;
  });
  
  // Calculate counts for each company (only products with stock > 0)
  const compCounts = {};
  products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && p.stock > 0 && p.company).forEach(p => {
    compCounts[p.company] = (compCounts[p.company] || 0) + 1;
  });
  
  // Get all categories sorted by product count (highest first)
  const allCategories = [...new Set([
    ...products.filter(p=>!p.name?.includes('(ক্যাটাগরি)')).map(p=>p.cat).filter(Boolean),
    ...categories.map(c=>c.name).filter(Boolean)
  ])].sort((a, b) => (catCounts[b] || 0) - (catCounts[a] || 0));
  
  // Get all companies sorted by product count (highest first)
  const allCompanies = [...new Set([
    ...products.filter(p=>!p.name?.includes('(ক্যাটাগরি)')).map(p=>p.company).filter(Boolean)
  ])].sort((a, b) => (compCounts[b] || 0) - (compCounts[a] || 0));
  
  // Filter categories for dropdown
  const filteredCats = allCategories.filter(c => 
    !catSearch || (c||'').toLowerCase().includes((catSearch||'').toLowerCase())
  );
  
  // Filter companies for dropdown
  const filteredComps = allCompanies.filter(c => 
    !compSearch || (c||'').toLowerCase().includes((compSearch||'').toLowerCase())
  );
  
  const outOfStockCount = products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && p.stock <= 0).length;
  const allCount = products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && p.stock > 0).length;
  const lowStockCount = products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && p.stock > 0 && p.stock <= p.minStock).length;
  
  const filtered = products.filter(p => {
    const isCategory = p.name?.includes('(ক্যাটাগরি)');
    if (isCategory) return false;
    
    // Company filter
    const matchComp = selComp === 'সব কোম্পানি' || p.company === selComp;
    // Product name filter
    const matchName = !search || (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.barcode||'').includes(search);
    
    // স্টক আছে: only show products with stock > 0
    if (selCat === 'স্টক আছে') {
      return p.stock > 0 && matchComp && matchName;
    }
    // স্টক শেষ: only show out of stock
    if (selCat === 'স্টক শেষ') {
      return p.stock <= 0 && matchComp && matchName;
    }
    // স্টক কম: only show low stock products
    if (selCat === 'স্টক কম') {
      return p.stock > 0 && p.stock <= p.minStock && matchComp && matchName;
    }
    // Specific category: show products in that category with stock > 0
    return p.cat === selCat && p.stock > 0 && matchComp && matchName;
  }).sort((a, b) => a.stock - b.stock);

  const addToCart = (prod) => {
    if (prod.stock <= 0) { alert(`"${prod.name}" এর স্টক শেষ!`); return; }
    setCart(prev => {
      const ex = prev.find(i=>i.id===prod.id);
      if (ex) {
        if (ex.qty >= prod.stock) { alert(`সর্বোচ্চ স্টক: ${prod.stock} ${prod.unit}`); return prev; }
        return prev.map(i=>i.id===prod.id ? {...i,qty:i.qty+1} : i);
      }
      return [...prev, {id:prod.id,name:prod.name,sellP:prod.sellP,buyP:prod.buyP,qty:1,unit:prod.unit,maxQ:prod.stock}];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updQty = (id, q) => {
    const n = parseInt(q) || 0;
    if (n < 1) { setCart(prev=>prev.filter(i=>i.id!==id)); return; }
    const prod = products.find(p=>p.id===id);
    if (prod && n > prod.stock) { alert(`সর্বোচ্চ স্টক: ${prod.stock}`); return; }
    setCart(prev=>prev.map(i=>i.id===id ? {...i,qty:n} : i));
  };

  const subtotal = cart.reduce((s,i)=>s+i.sellP*i.qty,0);
  const disc = parseFloat(discount)||0;
  const afterDiscount = Math.max(0, subtotal-disc);
  const vatEnabled = settings.vatEnabled !== false;
  const vatRate = vatPercent || 0;
  const vatAmount = vatEnabled ? Math.round(afterDiscount * vatRate / 100) : 0;
  const total = afterDiscount + vatAmount;
  const paidAmt = paid === '' ? 0 : (parseFloat(paid) || 0);
  const due = total - paidAmt;
  const change = paidAmt > total ? paidAmt - total : 0;

  const checkout = () => {
    if (!cart.length) { alert('কার্টে কোনো পণ্য নেই!'); return; }
    if (due > 0 && !selCust) { alert('⚠️ বাকি বিক্রয় করতে গ্রাহক সিলেক্ট করুন অথবা পূর্ণ পরিশোধ করুন!'); return; }

    // Due sale confirmation
    if (due > 0 && selCust) {
      if (!confirm(`⚠️ আপনি কি সত্যিই বাকিতে বিক্রয় করতে চান?\nবাকি: ৳${due.toFixed(0)}\nগ্রাহক: ${selCust.name}\nএই বাকি ${selCust.name} এর হিসাবে যোগ হবে।`)) return;
    }

    // Confirmation dialog
    const dueText = due > 0 ? `\nবাকি: ৳${due.toFixed(0)}` : '';
    const dueCreditText = (selCust && due > 0) ? `\nবাকি ${selCust.name} এর হিসাবে যোগ হবে।` : '';
    const vatText = vatAmount > 0 ? `\nভ্যাট (${vatPercent}%): ৳${vatAmount.toFixed(0)}` : '';
    const paidText = paidAmt > 0 ? `\nপরিশোধ: ৳${paidAmt.toFixed(0)}` : '';
    const changeText = change > 0 ? `\nফেরত: ৳${change.toFixed(0)}` : '';
    const confirmMsg = `বিক্রয় নিশ্চিত করুন?\nমোট: ৳${total.toFixed(0)}${vatText}${dueText}${paidText}${changeText}${dueCreditText}`;

    if (!window.confirm(confirmMsg)) return;

    const sale = {
      id:genId(), date:now(),
      custId:selCust?.id||null, custName:selCust?.name||'সাধারণ ক্রেতা',
      items:cart.map(i=>({...i,total:i.sellP*i.qty,profit:(i.sellP-i.buyP)*i.qty})),
      subtotal, discount:disc, vatPercent, vatAmount, total,
      paid:paidAmt, due:Math.max(0,due), change,
    };

    const newProds = products.map(p => {
      const ci = cart.find(i=>i.id===p.id);
      return ci ? {...p,stock:p.stock-ci.qty} : p;
    });

    let newCusts = [...customers];
    if (selCust && due > 0) {
      newCusts = newCusts.map(c=>c.id===selCust.id ? {...c,credit:(c.credit||0)+due} : c);
    }

    const newSales = [...sales, sale];

    upd.products(newProds);
    upd.customers(newCusts);
    upd.sales(newSales);

    // Auto print receipt and return to sales page
    printReceipt({sale, settings});
    setCart([]); setDiscount(''); setPaid(''); setSelCust(null); setCustQ('');
    setTimeout(() => searchRef.current?.focus(), 100);
  };

  const printReceipt = (r) => {
    const s = r.settings || {};
    const headerText = s.receiptHeader || '🧾 বিক্রয় রিসিট';
    const footerText = s.receiptFooter || 'ধন্যবাদ';
    const fontSize = s.receiptFontSize || 11;
    const showLogo = s.receiptShowLogo !== false;
    const showAddress = s.receiptShowAddress !== false;
    const showPhone = s.receiptShowPhone !== false;
    const showCustomer = s.receiptShowCustomer !== false;
    const showVat = s.receiptShowVat !== false;
    const showQr = s.receiptShowQr !== false;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>বিক্রয় রিসিট</title>
<style>
@page {
  size: 80mm auto;
  margin: 0;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html {
  width: 80mm;
}
body {
  font-family: 'Tiro Bangla', 'Courier New', monospace;
  width: 80mm;
  margin: 0;
  padding: 2mm;
  font-size: ${fontSize}px;
  color: #000;
  background: #fff;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.center {
  text-align: center;
}
.border {
  border-bottom: 1px dashed #000;
  padding-bottom: 5px;
  margin-bottom: 5px;
}
.row {
  display: flex;
  justify-content: space-between;
  margin: 2px 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: ${fontSize - 1}px;
}
th {
  border-bottom: 1px dashed #000;
  padding: 3px 0;
  text-align: left;
}
td {
  padding: 3px 0;
}
td:nth-child(2) {
  text-align: center;
}
td:nth-child(3),
td:nth-child(4) {
  text-align: right;
}
.total {
  border-top: 1px dashed #000;
  margin-top: 5px;
  padding-top: 5px;
  font-weight: bold;
}
.footer {
  text-align: center;
  margin-top: 10px;
  border-top: 1px dashed #000;
  padding-top: 5px;
  font-size: ${fontSize - 2}px;
}
</style>
</head>
<body>
<div class="center border">
  ${showLogo ? '<div style="font-size:14px;font-weight:bold;">' + headerText + '</div>' : '<div style="font-weight:bold;">' + headerText.replace(/[^\w\s]/g, '') + '</div>'}
  ${showAddress && s.name ? '<div>' + s.name + '</div>' : ''}
  ${showAddress && s.address ? '<div>' + s.address + '</div>' : ''}
  ${showPhone && s.phone ? '<div>' + s.phone + '</div>' : ''}
  ${showPhone && s.taxId ? '<div>VAT: ' + s.taxId + '</div>' : ''}
  <div>#${r.sale.id.slice(-8).toUpperCase()}</div>
  <div>${new Date(r.sale.date).toLocaleDateString('bn-BD')}</div>
  ${showCustomer ? '<div>গ্রাহক: ' + r.sale.custName + '</div>' : ''}
  ${showCustomer && r.sale.phone ? '<div>ফোন: ' + r.sale.phone + '</div>' : ''}
</div>
<table>
  <thead>
    <tr>
      <th>পণ্য</th>
      <th>পরিমাণ</th>
      <th>দাম</th>
      <th>মোট</th>
    </tr>
  </thead>
  <tbody>
    ${r.sale.items.map(i => `<tr>
      <td>${i.name}<br><span style="font-size:9px;color:#666;">${i.company || ''}</span></td>
      <td>${i.qty} ${i.unit || 'পিস'}</td>
      <td>৳${i.sellP.toFixed(2)}</td>
      <td>৳${i.total.toFixed(2)}</td>
    </tr>`).join('')}
  </tbody>
</table>
<div class="total row"><span>সাবটোটাল:</span><span>৳${(r.sale.subtotal || r.sale.total).toFixed(2)}</span></div>
${showVat && r.sale.vatAmount > 0 ? `<div class="row"><span>ভ্যাট (${r.sale.vatPercent}%):</span><span>৳${r.sale.vatAmount.toFixed(2)}</span></div>` : ''}
${r.sale.discount > 0 ? `<div class="row"><span>ছাড়:</span><span>-৳${r.sale.discount.toFixed(2)}</span></div>` : ''}
<div class="total row"><span>মোট:</span><span>৳${r.sale.total.toFixed(2)}</span></div>
<div class="row"><span>পরিশোধ:</span><span>৳${r.sale.paid.toFixed(2)}</span></div>
${r.sale.change > 0 ? `<div class="row"><span>ফেরত:</span><span>৳${r.sale.change.toFixed(2)}</span></div>` : ''}
${r.sale.due > 0 ? `<div class="total row" style="color:#c00;"><span>বাকি:</span><span>৳${r.sale.due.toFixed(2)}</span></div>` : ''}
${showQr ? '<div style="text-align:center;margin-top:8px;"><div style="width:48px;height:48px;margin:0 auto 4px;padding:2px;border:2px solid #000;"><div style="width:100%;height:100%;background:repeating-linear-gradient(0deg,#000 0px,#000 2px,#fff 2px,#fff 4px),repeating-linear-gradient(90deg,#000 0px,#000 2px,#fff 2px,#fff 4px),repeating-linear-gradient(45deg,transparent 0px,transparent 2px,#fff 2px,#fff 4px),repeating-linear-gradient(-45deg,transparent 0px,transparent 2px,#fff 2px,#fff 4px);background-size:4px 4px,4px 4px,8px 8px,8px 8px;background-position:0 0,0 0,2px 2px,-2px 2px;"></div></div><div style="font-size:7px;color:#000;font-weight:bold;">🧾 ZATCA QR</div><div style="font-size:6px;color:#666;">ডেমো</div></div>' : ''}
<div class="footer">${footerText}<br>${new Date().toLocaleDateString('bn-BD')}</div>
</body>
</html>`;

    // Create iframe for silent printing (no new tab)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px;';
    document.body.appendChild(iframe);
    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    iframe.contentWindow.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 100);
    };
  };

  // Add Customer Popup
  if (showAddCust) return (
    <div style={{...overlay}}>
      <div style={{...card,width:360,padding:24}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:16,textAlign:'center'}}>👤 নতুন কাস্টমার যোগ করুন</div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>নাম *</label>
          <input value={newCustName} onChange={e=>setNewCustName(e.target.value)} 
            placeholder="কাস্টমারের নাম" style={{...input,height:42}} autoFocus />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>ফোন</label>
          <input value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value)} 
            placeholder="মোবাইল নম্বর" style={{...input,height:42}} />
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>ঠিকানা</label>
          <input value={newCustAddr} onChange={e=>setNewCustAddr(e.target.value)} 
            placeholder="ঠিকানা" style={{...input,height:42}} />
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>{setShowAddCust(false);setNewCustName('');setNewCustPhone('');setNewCustAddr('');}} 
            style={{...btn('ghost'),flex:1}}>বাতিল</button>
          <button onClick={()=>{
            if (!newCustName.trim()) { alert('নাম দিন!'); return; }
            const newC = {id:genId(),name:newCustName.trim(),phone:newCustPhone.trim(),address:newCustAddr.trim(),credit:0};
            upd.customers([...customers, newC]);
            setSelCust(newC);
            setShowAddCust(false);
            setNewCustName('');setNewCustPhone('');setNewCustAddr('');
          }} style={{...btn('primary'),flex:2}}>✓ কাস্টমার যোগ করুন</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',width:'100%',background:T.gray50}}>
      {/* ── LEFT: Products ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Product name search */}
        <div style={{padding:'8px 14px',background:T.white,borderBottom:`1px solid ${T.gray200}`,display:'flex',gap:8,alignItems:'center'}}>
          <div style={{position:'relative',flex:1}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400,fontSize:13}}>🔍</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearchKeyDown}
              placeholder="পণ্যের নাম বা বারকোড..."
              style={{...input,paddingLeft:32,height:34,fontSize:12,borderRadius:7,border:`1.5px solid ${T.gray200}`,background:'#fafbfc'}}
            />
          </div>
        </div>
        
        {/* Filter row */}
        {/* Combined row with stock summary left and dropdowns right */}
        <div style={{padding:'6px 14px',background:T.white,borderBottom:`1px solid ${T.gray200}`,display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',justifyContent:'space-between'}}>
          {/* Left: Stock summary (display only) with dividers */}
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            {/* স্টক আছে summary */}
            <div style={{
              borderRadius:8, whiteSpace:'nowrap',
              background:T.tealLight,
              color:T.teal,
              border:`1.5px solid ${T.teal}30`,
              padding:'6px 14px',
              fontSize:12,
              fontWeight:600,
              boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
            }}>📦 স্টক আছে <span style={{fontWeight:700,marginLeft:4}}>({allCount})</span></div>
            
            {/* স্টক কম summary */}
            <div style={{
              borderRadius:8, whiteSpace:'nowrap',
              background:T.orangeLight,
              color:T.orange,
              border:`1.5px solid ${T.orange}30`,
              padding:'6px 14px',
              fontSize:12,
              fontWeight:600,
              boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
            }}>⚠️ স্টক কম <span style={{fontWeight:700,marginLeft:4}}>({lowStockCount})</span></div>
            
            {/* স্টক শেষ summary */}
            <div style={{
              borderRadius:8, whiteSpace:'nowrap',
              background:T.redLight,
              color:T.red,
              border:`1.5px solid ${T.red}30`,
              padding:'6px 14px',
              fontSize:12,
              fontWeight:600,
              boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
            }}>⚠️ স্টক শেষ <span style={{fontWeight:700,marginLeft:4}}>({outOfStockCount})</span></div>
          </div>
          
          {/* Right: Dropdowns */}
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {/* Category dropdown */}
            <div style={{position:'relative',minWidth:130}} data-cat-dropdown>
              <input 
                value={selCat === 'স্টক আছে' || selCat === 'স্টক শেষ' || selCat === 'স্টক কম' ? catSearch : selCat} 
                onChange={e=>{setSelCat('স্টক আছে');setCatSearch(e.target.value);setShowCatDrop(true);}} 
                onFocus={()=>setShowCatDrop(true)}
                placeholder="ক্যাটাগরি..."
                style={{...input,borderRadius:7,padding:'6px 28px 6px 10px',fontSize:12,height:32}}
              />
              {selCat !== 'স্টক আছে' && selCat !== 'স্টক শেষ' && selCat !== 'স্টক কম' && (
                <button onClick={()=>{setSelCat('স্টক আছে');setCatSearch('');}} style={{
                  position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
                  background:'none',border:'none',cursor:'pointer',padding:4,
                  color:T.gray400,fontSize:11,lineHeight:1
                }}>✕</button>
              )}
              {showCatDrop && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:T.white,border:`1px solid ${T.teal}`,borderRadius:7,marginTop:4,maxHeight:200,overflowY:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                  {filteredCats.length === 0 ? (
                    <div style={{padding:'8px 12px',color:T.gray400,fontSize:12}}>কোনো ক্যাটাগরি পাওয়া যায়নি</div>
                  ) : filteredCats.map(c=>(
                    <div key={c} onClick={()=>{setSelCat(c);setCatSearch('');setShowCatDrop(false);}} style={{
                      padding:'6px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',
                      background:selCat===c?T.tealLight:'transparent',
                      borderBottom:`1px solid ${T.gray100}`,
                      fontSize:12,
                    }}>
                      <span style={{color:selCat===c?T.teal:T.gray900}}>{c}</span>
                      <span style={{color:T.gray400,fontSize:11}}>{catCounts[c] || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Company dropdown */}
            <div style={{position:'relative',minWidth:130}} data-comp-dropdown>
              <input 
                value={selComp === 'সব কোম্পানি' ? compSearch : selComp} 
                onChange={e=>{setSelComp('সব কোম্পানি');setCompSearch(e.target.value);setShowCompDrop(true);}} 
                onFocus={()=>setShowCompDrop(true)}
                placeholder="কোম্পানি..."
                style={{...input,borderRadius:7,padding:'6px 28px 6px 10px',fontSize:12,height:32}}
              />
              {selComp !== 'সব কোম্পানি' && (
                <button onClick={()=>{setSelComp('সব কোম্পানি');setCompSearch('');}} style={{
                  position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',
                  background:'none',border:'none',cursor:'pointer',padding:4,
                  color:T.gray400,fontSize:11,lineHeight:1
                }}>✕</button>
              )}
              {showCompDrop && (
                <div style={{position:'absolute',top:'100%',left:0,right:0,zIndex:50,background:T.white,border:`1px solid ${T.teal}`,borderRadius:7,marginTop:4,maxHeight:200,overflowY:'auto',boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}>
                  {filteredComps.length === 0 ? (
                    <div style={{padding:'8px 12px',color:T.gray400,fontSize:12}}>কোনো কোম্পানি পাওয়া যায়নি</div>
                  ) : filteredComps.map(c=>(
                    <div key={c} onClick={()=>{setSelComp(c);setCompSearch('');setShowCompDrop(false);}} style={{
                      padding:'6px 12px',cursor:'pointer',display:'flex',justifyContent:'space-between',
                      background:selComp===c?T.tealLight:'transparent',
                      borderBottom:`1px solid ${T.gray100}`,
                      fontSize:12,
                    }}>
                      <span style={{color:selComp===c?T.teal:T.gray900}}>{c}</span>
                      <span style={{color:T.gray400,fontSize:11}}>{compCounts[c] || 0}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product grid - Show products when company or category is selected */}
        <div style={{flex:1,overflow:'auto',padding:16,background:T.gray50}}>
          {selComp !== 'সব কোম্পানি' || (selCat !== 'স্টক আছে' && selCat !== 'স্টক শেষ' && selCat !== 'স্টক কম') ? (
            <div>
              <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:13,fontWeight:600,color:T.gray600}}>
                  {selComp !== 'সব কোম্পানি' && `🏢 ${selComp} (${filtered.length}টি পণ্য)`}
                  {selComp === 'সব কোম্পানি' && selCat !== 'স্টক আছে' && selCat !== 'স্টক শেষ' && selCat !== 'স্টক কম' && `📁 ${selCat} (${filtered.length}টি পণ্য)`}
                  {selComp !== 'সব কোম্পানি' && selCat !== 'স্টক আছে' && selCat !== 'স্টক শেষ' && selCat !== 'স্টক কম' && ' - ' + selCat}
                </span>
                <button onClick={()=>{setSelComp('সব কোম্পানি');setSelCat('স্টক আছে');setCompSearch('');setCatSearch('');}} style={{fontSize:11,padding:'4px 10px',border:'none',borderRadius:5,background:T.gray200,cursor:'pointer',color:T.gray600}}>✕ মুছুন</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
                {filtered.map(p => (
                  <button key={p.id} onClick={()=>addToCart(p)} style={{
                    background:p.stock<=0?T.redLight:p.stock<=p.minStock?T.amberLight:T.white, 
                    border:`1.5px solid ${p.stock<=0?T.red:p.stock<=p.minStock?T.amber:T.gray200}`,
                    borderRadius:10, padding:'12px 10px', cursor:p.stock>0?'pointer':'not-allowed',
                    textAlign:'left', transition:'all 0.15s',
                    boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                    outline:'none',
                  }}>
                    <div style={{fontSize:11,fontWeight:600,marginBottom:4,color:T.gray600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div>
                    <div style={{fontSize:16,fontWeight:800,color:p.stock<=0?T.red:p.stock<=p.minStock?T.amber:T.teal}}>{fmt(p.sellP)}</div>
                    <div style={{fontSize:10,color:T.gray400,marginTop:2}}>/{p.unit}</div>
                    <div style={{marginTop:6,padding:'2px 6px',borderRadius:8,fontSize:10,fontWeight:600,display:'inline-block',
                      background:p.stock<=0?T.red:p.stock<=p.minStock?T.amber:T.tealLight,
                      color:p.stock<=0?'#fff':p.stock<=p.minStock?'#fff':T.teal}}>
                      {p.stock}
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{gridColumn:'1/-1',textAlign:'center',padding:'40px',color:T.gray400}}>
                    <div style={{fontSize:36,marginBottom:8}}>📦</div>
                    <div>কোনো পণ্য পাওয়া যায়নি</div>
                  </div>
                )}
              </div>
            </div>
          ) : settings.bannerImage ? (
            <div style={{display:'flex',height:'100%',background:T.white,borderRadius:12,overflow:'hidden',position:'relative'}}>
              <img src={settings.bannerImage} alt="Welcome" style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}}/>
              {/* Business Info - Top Right */}
              <div style={{position:'absolute',top:30,right:30,textAlign:'center',padding:'28px 36px',background:'rgba(255,255,255,0.25)',borderRadius:20,backdropFilter:'blur(8px)',maxWidth:400}}>
                <div style={{fontSize:32,fontWeight:800,color:T.teal,marginBottom:12}}>{settings.name}</div>
                {settings.phone && <div style={{fontSize:18,color:'#1F2937',marginTop:8}}>📞 {settings.phone}</div>}
                {settings.address && <div style={{fontSize:17,color:'#4B5563',marginTop:8}}>📍 {settings.address}</div>}
              </div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',background:T.white,borderRadius:12,overflow:'hidden'}}>
              {/* Business Info from Settings */}
              <div style={{textAlign:'center',marginBottom:20}}>
                <div style={{fontSize:28,fontWeight:800,color:T.teal,marginBottom:8}}>{settings.name}</div>
                {settings.phone && <div style={{fontSize:14,color:T.gray600,marginTop:4}}>📞 {settings.phone}</div>}
                {settings.address && <div style={{fontSize:13,color:T.gray500,marginTop:4}}>📍 {settings.address}</div>}
              </div>
              {/* Demo Illustration */}
              <svg width="260" height="160" viewBox="0 0 280 180" style={{marginBottom:16}}>
                {/* Background */}
                <rect x="20" y="50" width="240" height="110" rx="8" fill="#F0FDFA" stroke="#0F766E" strokeWidth="2"/>
                {/* Store/Shop Icon */}
                <rect x="50" y="70" width="60" height="60" rx="4" fill="#0F766E"/>
                <text x="80" y="105" textAnchor="middle" fill="white" fontSize="24">🏪</text>
                {/* Barcode Scanner */}
                <rect x="130" y="65" width="100" height="50" rx="6" fill="#115E59"/>
                <rect x="140" y="75" width="80" height="30" rx="3" fill="#CCFBF1"/>
                <text x="180" y="95" textAnchor="middle" fill="#0F766E" fontSize="14" fontWeight="bold">||||||</text>
                {/* Shopping Items */}
                <rect x="50" y="135" width="30" height="20" rx="3" fill="#14B8A6"/>
                <rect x="85" y="135" width="30" height="20" rx="3" fill="#F59E0B"/>
                <rect x="120" y="135" width="30" height="20" rx="3" fill="#EF4444"/>
                {/* Checkmark/Success */}
                <circle cx="220" cy="90" r="25" fill="#22C55E"/>
                <path d="M208 90 L216 98 L232 82" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div style={{padding:'16px',textAlign:'center'}}>
                <div style={{fontSize:15,color:T.gray500,fontWeight:600}}>পণ্যের নাম বা বারকোড দিয়ে খুঁজুন</div>
                <div style={{fontSize:12,marginTop:8,color:T.gray400}}>অথবা কোম্পানি/ক্যাটাগরি সিলেক্ট করুন</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── Modern Minimal Design */}
      <div style={{width:360,display:'flex',flexDirection:'column',background:'#fafbfc',borderLeft:`1px solid #e5e7eb`}}>
        {/* Cart Header - Compact */}
        <div style={{padding:'12px 16px',borderBottom:`1px solid #e5e7eb`,background:T.white,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <h3 style={{fontSize:15,fontWeight:700,color:T.gray900,margin:0,display:'flex',alignItems:'center',gap:6}}>🛒 কার্ট</h3>
            <span style={{background:T.gray900,color:T.white,padding:'2px 10px',borderRadius:12,fontSize:12,fontWeight:600}}>{cart.length}</span>
          </div>
          
          {/* Customer Input - Compact */}
          <div style={{position:'relative'}}>
            <input value={custQ} onChange={e=>{setCustQ(e.target.value);setShowCustDrop(true);}}
              onFocus={()=>setShowCustDrop(true)}
              onMouseDown={() => { setShowCustDrop(true); }}
              placeholder="কাস্টমার খুঁজুন..."
              style={{...input,fontSize:12,borderRadius:8,padding:'8px 12px',border:'1.5px solid #e5e7eb',background:'#fafbfc'}}
            />
            {due > 0 && !selCust && cart.length > 0 && (
              <button onClick={()=>setShowAddCust(true)} style={{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',background:T.teal,border:'none',borderRadius:6,color:'white',cursor:'pointer',fontSize:11,padding:'4px 8px',display:'flex',alignItems:'center',gap:4,fontWeight:700}}>
                +
              </button>
            )}
          </div>
          
          {due > 0 && !selCust && cart.length > 0 && !custQ && (
            <div style={{fontSize:11,color:T.red,marginTop:6,textAlign:'center',padding:'4px 8px',background:T.redLight,borderRadius:6}}>⚠️ কাস্টমার যোগ করুন</div>
          )}
          
          {selCust && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8,padding:'8px 12px',background:'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',borderRadius:10,border:'1px solid #86efac'}}>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{color:T.green,fontSize:14}}>✓</span>
                <span style={{fontSize:12,color:T.green,fontWeight:600}}>{selCust.name}</span>
                {selCust.credit>0 && <span style={{color:T.red,fontSize:11,fontWeight:500}}>(বাকি: {fmt(selCust.credit)})</span>}
              </div>
              <button onClick={()=>{setSelCust(null);setCustQ('');}} style={{fontSize:11,background:'none',border:'none',color:T.gray400,cursor:'pointer',padding:2}}>✕</button>
            </div>
          )}
          
          {showCustDrop && !selCust && (
            <div 
              onMouseDown={(e) => e.preventDefault()}
              style={{position:'absolute',left:16,right:16,top:'100%',background:T.white,border:'1.5px solid #e5e7eb',borderRadius:10,boxShadow:'0 6px 20px rgba(0,0,0,0.1)',zIndex:50,maxHeight:180,overflow:'auto',marginTop:4}}>
              {customers.filter(c=>(c.name||'').includes(custQ)||(c.phone||'').includes(custQ)).map(c=>(
                <div key={c.id} onClick={()=>{setSelCust(c);setCustQ(c.name);setShowCustDrop(false);}}
                  style={{padding:'10px 14px',cursor:'pointer',fontSize:13,borderBottom:`1px solid #f0f0f0`,display:'flex',justifyContent:'space-between'}}>
                  <span><strong>{c.name}</strong>{c.phone?` · ${c.phone}`:''}</span>
                  {c.credit>0 && <span style={{color:T.red,fontSize:11,fontWeight:600}}>বাকি {fmt(c.credit)}</span>}
                </div>
              ))}
              {customers.filter(c=>(c.name||'').includes(custQ)||(c.phone||'').includes(custQ)).length===0 && (
                <div style={{padding:'10px 14px',fontSize:13,color:T.gray400}}>কাস্টমার পাওয়া যায়নি</div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{flex:1,overflow:'auto',background:'#fafbfc'}}>
          {cart.length===0 ? (
            <div style={{textAlign:'center',padding:'30px 16px',background:T.white,margin:8,borderRadius:8,border:'1px solid #e5e7eb'}}>
              <div style={{fontSize:36,marginBottom:8}}>🛒</div>
              <div style={{fontSize:14,fontWeight:600,color:T.gray500,marginBottom:4}}>কার্ট খালি</div>
              <div style={{fontSize:13,color:T.gray400}}>বাম দিক থেকে পণ্য যোগ করুন</div>
            </div>
          ) : (
            <div style={{padding:'8px 16px'}}>
              {cart.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',padding:'6px 8px',background:T.white,borderBottom:'1px dashed #e5e7eb',gap:8}}>
                  {/* Product Name & Qty */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8}}>
                      <span style={{fontSize:12,fontWeight:600,color:T.gray900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{item.name}</span>
                      <span style={{fontSize:12,fontWeight:700,color:T.teal,flexShrink:0}}>{fmt(item.sellP*item.qty)}</span>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:2}}>
                      <span style={{fontSize:12,color:T.gray500}}>{item.qty} × {fmt(item.sellP)}</span>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <button onClick={()=>updQty(item.id,item.qty-1)} style={{width:22,height:22,border:'none',borderRadius:4,background:T.gray100,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:T.gray600}}>−</button>
                        <span style={{fontSize:12,fontWeight:600,minWidth:18,textAlign:'center'}}>{item.qty}</span>
                        <button onClick={()=>updQty(item.id,item.qty+1)} style={{width:22,height:22,border:'none',borderRadius:4,background:T.gray100,cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center',color:T.gray600}}>+</button>
                        <button onClick={()=>setCart(p=>p.filter(i=>i.id!==item.id))} style={{width:22,height:22,border:'none',borderRadius:4,background:T.redLight,cursor:'pointer',fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',color:T.red,marginLeft:4}}>✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals - Thermal Receipt Style */}
        <div style={{padding:'10px 12px',background:T.white,borderTop:'1px solid #e5e7eb',flexShrink:0}}>
          {/* Receipt-style Summary */}
          <div style={{border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden',marginBottom:8}}>
            {/* Header */}
            <div style={{background:T.gray100,padding:'8px 12px',display:'flex',justifyContent:'space-between',borderBottom:'1px dashed #d1d5db'}}>
              <span style={{fontSize:13,color:T.gray600,fontWeight:600}}>সাবটোটাল ({cart.reduce((s,i)=>s+i.qty,0)} আইটেম)</span>
              <span style={{fontSize:13,fontWeight:600,color:T.gray700}}>{fmt(subtotal)}</span>
            </div>
            
            {/* Discount Row */}
            {(parseFloat(discount)||0) > 0 && (
              <div style={{padding:'6px 12px',display:'flex',justifyContent:'space-between',borderBottom:'1px dashed #d1d5db',background:T.greenLight}}>
                <span style={{fontSize:13,color:T.green}}>ছাড়</span>
                <span style={{fontSize:13,fontWeight:600,color:T.green}}>−{fmt(parseFloat(discount)||0)}</span>
              </div>
            )}
            
            {/* VAT Row */}
            {vatAmount > 0 && (
              <div style={{padding:'6px 12px',display:'flex',justifyContent:'space-between',borderBottom:'1px dashed #d1d5db',background:T.amberLight}}>
                <span style={{fontSize:13,color:T.amber}}>ভ্যাট ({vatPercent}%)</span>
                <span style={{fontSize:13,fontWeight:600,color:T.amber}}>+{fmt(vatAmount)}</span>
              </div>
            )}
            
            {/* Grand Total */}
            <div style={{padding:'8px 10px',display:'flex',justifyContent:'space-between',alignItems:'center',background:T.gray900}}>
              <span style={{fontSize:12,color:T.white,fontWeight:700}}>মোট দেনা</span>
              <span style={{fontSize:18,color:T.white,fontWeight:800}}>{fmt(total)}</span>
            </div>
          </div>
          
          {/* Discount & VAT Inputs */}
          <div style={{display:'flex',gap:6,marginBottom:8}}>
            <input value={discount} onChange={e=>setDiscount(e.target.value)} type="number" min="0"
              placeholder="ছাড়"
              style={{flex:1,border:'1px solid #e5e7eb',borderRadius:6,padding:'5px 8px',fontSize:11,outline:'none',background:'#fafbfc',width:'100%',boxSizing:'border-box',color:T.green}}/>
            <input value={vatPercent} onChange={e=>setVatPercent(e.target.value)} type="number" min="0" max="100"
              placeholder="ভ্যাট"
              style={{width:55,border:'1px solid #e5e7eb',borderRadius:6,padding:'5px 6px',fontSize:11,outline:'none',background:'#fafbfc',boxSizing:'border-box',color:T.amber,textAlign:'center'}}/>
          </div>
          
          {/* Payment Input */}
          <input ref={paidRef} value={paid} onChange={e=>setPaid(e.target.value)} type="number" min="0"
            placeholder="পরিশোধ (৳)" 
            style={{...input,padding:'10px 14px',fontSize:16,fontWeight:700,borderRadius:8,marginBottom:6,border:'2px solid #e5e7eb',background:'#fff',boxSizing:'border-box',width:'100%',textAlign:'center',color:T.gray900}}
            autoFocus={cart.length > 0}
            onKeyDown={e=>{
              if(e.key==='Enter'&&cart.length) checkout();
              if(e.key==='Tab'&&cart.length>0&&!(due>0&&!selCust)) {
                e.preventDefault();
                checkoutRef.current?.focus();
              }
            }}/>
          
          {/* Due/Change Alert */}
          {due > 0 && (
            <div style={{fontSize:11,marginBottom:6,padding:'5px 8px',borderRadius:6,
              background:T.redLight, color:T.red, fontWeight:600,textAlign:'center'}}>
              ⚠️ বাকি: {fmt(due)}{selCust ? '' : ' (কাস্টমার দরকার)'}
            </div>
          )}
          {paidAmt > total && (
            <div style={{fontSize:11,marginBottom:6,padding:'5px 8px',borderRadius:6,
              background:T.greenLight, color:T.green, fontWeight:600,textAlign:'center'}}>
              💵 ফেরত: {fmt(change)}
            </div>
          )}
          
          {/* Action Buttons */}
          <div style={{display:'grid',gridTemplateColumns:'auto 1fr',gap:6}}>
            <button onClick={()=>{setCart([]);setDiscount('');setPaid('');setSelCust(null);setCustQ('');}}
              style={{padding:'8px 10px',borderRadius:8,border:'1px solid #e5e7eb',background:T.white,color:T.gray600,fontWeight:600,fontSize:12,cursor:'pointer'}}>
              🗑️
            </button>
            <button ref={checkoutRef} onClick={checkout} 
              disabled={!cart.length || (due > 0 && !selCust)}
              style={{
                padding:'12px 16px',borderRadius:10,border:'none',
                background: cart.length && !(due > 0 && !selCust) ? T.orange : '#e5e7eb',
                color:T.white,fontWeight:700,fontSize:15,cursor: cart.length && !(due > 0 && !selCust) ? 'pointer' : 'not-allowed',
                boxShadow: cart.length && !(due > 0 && !selCust) ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
              }}>
              ✓ বিক্রয় সম্পন্ন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRODUCTS SCREEN
═══════════════════════════════════════════ */
function ProductsScreen({products, suppliers, categories, purchases, productHistory, upd}) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [supplierQ, setSupplierQ] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [barcodeVal, setBarcodeVal] = useState('');
  const [barcodeSuggestions, setBarcodeSuggestions] = useState([]);
  const [form, setForm] = useState({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
  const [viewPurchase, setViewPurchase] = useState(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [stockFilter, setStockFilter] = useState('স্টক আছে'); // স্টক আছে, স্টক শেষ
  const [loading, setLoading] = useState(true);
  const [productTab, setProductTab] = useState('list'); // list, history
  const [editProduct, setEditProduct] = useState(null);
  const [viewProduct, setViewProduct] = useState(null);

  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  // Initialize loading state once on mount
  useEffect(() => {
    setLoading(false);
  }, []);

  // Handle edit product price
  const handleEditProduct = () => {
    if (!editProduct) return;
    
    const updatedProducts = products.map(p => {
      if (p.id === editProduct.id) {
        return { ...p, buyP: editProduct.buyP, sellP: editProduct.sellP };
      }
      return p;
    });
    
    upd.products(updatedProducts);
    setEditProduct(null);
  };


  // Handle CSV Import
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = [];
      const errors = [];
      
      // Get existing companies and categories
      const existingCompanies = [
        ...suppliers.map(s => (s.name||'').toLowerCase()),
        ...products.map(p => (p.company||'').toLowerCase()).filter(Boolean)
      ];
      const existingCategories = [
        ...new Set([
          ...products.map(p => (p.cat||'').toLowerCase()).filter(Boolean),
          ...categories.map(c => (c.name||'').toLowerCase()).filter(Boolean)
        ])
      ];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        
        // Get company code, company name and category from CSV
        const csvCompanyCode = (row['কোম্পানি কোড'] || row['company code'] || '').trim();
        const csvCompany = (row['কোম্পানি'] || row['company'] || supplierQ || '').trim();
        const csvCategory = (row['ক্যাটাগরি'] || row['category'] || '').trim();
        
        // Validate company by name
        if (csvCompany && !existingCompanies.includes(csvCompany.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCompany}" কোম্পানি ডাটাবেজে নেই`);
          continue;
        }
        
        // Validate category
        if (csvCategory && !existingCategories.includes(csvCategory.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCategory}" ক্যাটাগরি ডাটাবেজে নেই`);
          continue;
        }
        
        // Map CSV columns to product fields
        const item = {
          id: genId(),
          name: row['পণ্যের নাম'] || row['নাম'] || row['name'] || '',
          barcode: row['বারকোড'] || row['barcode'] || '',
          company: csvCompany,
          cat: csvCategory,
          unit: row['একক'] || row['unit'] || 'পিস',
          buyP: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || row['buy'] || 0),
          sellP: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || row['sell'] || 0),
          stock: parseFloat(row['স্টক'] || row['stock'] || 0),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || 5)
        };
        
        if (item.name) {
          items.push(item);
        }
      }
      
      if (errors.length > 0) {
        alert('❌ আপলোড ব্যর্থ!\n\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...এবং আরও ' + (errors.length - 5) + 'টি ত্রুটি' : ''));
        return;
      }
      
      if (items.length > 0) {
        setPurchaseItems(prevItems => [...prevItems, ...items]);
        setCsvData(items);
        alert(`✅ ${items.length}টি পণ্য আপলোড হয়েছে!`);
      } else {
        alert('কোনো পণ্য পাওয়া যায়নি। CSV ফরম্যাট সঠিক নয়।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Get all unique companies from products and suppliers
  const allCompanies = [
    ...suppliers.map(s => s.name).filter(Boolean),
    ...products.map(p => p.company).filter(Boolean)
  ];
  const uniqueCompanies = [...new Set(allCompanies)].sort();

  // Get all unique categories from categories state (not from products)
  const uniqueCategories = [...new Set(categories.map(c => c.name).filter(Boolean))].sort();

  // Filter and sort products - low stock first
  const filtered = products
    .filter(p=> {
      // Stock filter
      if (stockFilter === 'স্টক আছে' && p.stock <= 0) return false;
      if (stockFilter === 'স্টক শেষ' && p.stock > 0) return false;
      // Search filter
      return !search || (p.name||'').toLowerCase().includes(search.toLowerCase()) || 
        (p.company||'').toLowerCase().includes(search.toLowerCase()) || 
        (p.barcode||'').includes(search);
    })
    .sort((a, b) => {
      // Out of stock first
      if (a.stock <= 0 && b.stock > 0) return -1;
      if (b.stock <= 0 && a.stock > 0) return 1;
      // Low stock second
      const aLow = a.stock > 0 && a.stock <= a.minStock;
      const bLow = b.stock > 0 && b.stock <= b.minStock;
      if (aLow && !bLow) return -1;
      if (bLow && !aLow) return 1;
      // Sort by stock ascending
      return a.stock - b.stock;
    });
  
  // Count stats
  const stockCount = products.filter(p => p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  // Handle barcode input
  const handleBarcode = (val) => {
    setBarcodeVal(val);
    setForm(f => ({...f, barcode: val}));
    
    // Only search when at least 3 characters typed
    if (val.length >= 3) {
      const trimmedVal = val.trim().toLowerCase();
      
      // Find exact match by barcode OR by name (case insensitive)
      const exactMatch = products.find(p => 
        !(p.name||'').includes('(ক্যাটাগরি)') && 
        (
          (p.barcode||'').toLowerCase().trim() === trimmedVal ||
          (p.name||'').toLowerCase().trim() === trimmedVal
        )
      );
      
      if (exactMatch) {
        selectProduct(exactMatch);
        setBarcodeSuggestions([]);
      } else {
        // Show suggestions if no exact match (but don't auto-fill)
        const matches = products.filter(p => 
          !(p.name||'').includes('(ক্যাটাগরি)') && (
            (p.barcode||'').toLowerCase().includes(trimmedVal) || 
            (p.name||'').toLowerCase().includes(trimmedVal)
          )
        ).slice(0, 5);
        setBarcodeSuggestions(matches);
      }
    } else {
      setBarcodeSuggestions([]);
    }
  };

  // Select product from suggestions
  const selectProduct = (p) => {
    setForm({
      name: p.name,
      barcode: p.barcode || '',
      company: p.company || '',
      cat: p.cat || '',
      unit: p.unit || 'পিস',
      buyP: p.buyP || '',
      sellP: p.sellP || '',
      stock: '',
      minStock: p.minStock || '5'
    });
    setSupplierQ(p.company || ''); // Also update supplierQ for the dropdown
    setBarcodeVal(p.barcode || '');
    setBarcodeSuggestions([]);
    setSelectedProduct(p);
    setShowProductDrop(false);
    setProductNameQ('');
  };

  // Add product to purchase list
  const addToPurchase = () => {
    if (!form.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    const item = {
      id: genId(),
      name: form.name,
      barcode: form.barcode || '',
      company: form.company,
      cat: form.cat || '',
      unit: form.unit || 'পিস',
      buyP: +form.buyP || 0,
      sellP: +form.sellP || 0,
      stock: +form.stock || 0,
      minStock: +form.minStock || 5
    };
    setPurchaseItems([...purchaseItems, item]);
    // Reset form
    setForm({name:'',barcode:'',company:form.company,cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setBarcodeVal('');
    setSelectedProduct(null);
  };

  // Remove item from purchase list
  const removeItem = (id) => {
    setPurchaseItems(purchaseItems.filter(i => i.id !== id));
  };

  // Save purchase with all items
  const savePurchase = async () => {
    if (purchaseItems.length === 0) { alert('কমপক্ষে একটি পণ্য যোগ করুন'); return; }
    
    const savedCount = purchaseItems.length;
    const purchaseId = `PO-${Date.now().toString().slice(-8)}`;
    
    const purchase = {
      id: purchaseId,
      date: now(),
      supplier: form.company || 'সাধারণ',
      items: purchaseItems,
      totalItems: purchaseItems.length,
      totalStock: purchaseItems.reduce((s,i) => s + i.stock, 0)
    };

    // Check for existing products and update stock, or create new ones
    const updatedProducts = [...products];
    const newProductsToAdd = [];
    
    for (const item of purchaseItems) {
      // Find existing product by company AND barcode
      const existingIndex = updatedProducts.findIndex(
        p => p.company === item.company && p.barcode === item.barcode && p.barcode !== ''
      );
      
      if (existingIndex !== -1) {
        // Update existing product stock
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          stock: (updatedProducts[existingIndex].stock || 0) + (item.stock || 0),
          buyP: item.buyP || updatedProducts[existingIndex].buyP,
          sellP: item.sellP || updatedProducts[existingIndex].sellP
        };
      } else {
        // Create new product
        newProductsToAdd.push({ ...item, id: genId() });
      }
    }
    
    // Prepare new supplier if needed
    let newSupplierArr = null;
    if (form.company && !suppliers.find(s => s.name === form.company)) {
      const newSupplier = { id: genId(), name: form.company, phone: '', address: '' };
      newSupplierArr = [...suppliers, newSupplier];
    }

    // Build promises array
    const promises = [];
    if (newSupplierArr) {
      promises.push(upd.suppliers(newSupplierArr));
    }
    promises.push(upd.products([...updatedProducts, ...newProductsToAdd]));
    promises.push(upd.purchases([...purchases, purchase]));

    // Execute all updates
    await Promise.all(promises);

    // Clear form after successful save
    setPurchaseItems([]);
    setCsvData([]);
    setForm({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setSupplierQ('');
    setShowAddForm(false);
    alert(`✅ ${savedCount}টি পণ্য সংরক্ষিত হয়েছে!\nপারচেজ আইডি: ${purchaseId}`);
  };

  // Delete product
  const del = async (id) => {
    if (!confirm('এই পণ্যটি মুছে ফেলবেন?')) return;
    await upd.products(products.filter(p=>p.id!==id));
  };

  // Purchase history view
  if (showPurchaseHistory) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setShowPurchaseHistory(false)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 পারচেজ হিস্ট্রি</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {purchases.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:T.gray400}}>কোনো পারচেজ রেকর্ড নেই</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...purchases].reverse().map(p => {
                const totalCost = p.items.reduce((s,i) => s + (i.stock || 0) * (i.buyP || 0), 0);
                return (
                  <div key={p.id} onClick={()=>setViewPurchase(p)} 
                    style={{padding:14,background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontWeight:700,color:T.teal,fontSize:14}}>{p.id}</div>
                      <div style={{fontSize:12,color:T.gray500,marginTop:2}}>{new Date(p.date).toLocaleDateString('bn-BD')} • {p.supplier}</div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontWeight:700,color:T.green}}>{fmt(totalCost)}</div>
                      <div style={{fontSize:12,color:T.gray500}}>{p.totalItems}টি পণ্য • {p.totalStock} একক</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {viewPurchase && (
          <div style={{...overlay}} onClick={()=>setViewPurchase(null)}>
            <div style={{...card,width:500,maxHeight:'80vh',overflow:'auto',padding:20}} onClick={e=>e.stopPropagation()}>
              <div style={{marginBottom:16,borderBottom:`2px solid ${T.gray200}`,paddingBottom:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{fontWeight:800,fontSize:18,color:T.teal}}>{viewPurchase.id}</div>
                    <div style={{fontSize:12,color:T.gray500,marginTop:4}}>📅 {new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
                    <div style={{fontSize:13,marginTop:4}}>🏢 সরবরাহকারী: {viewPurchase.supplier}</div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    <button onClick={()=>{
                      const grandTotal = viewPurchase.items.reduce((s,i) => s + (i.stock || 0) * (i.buyP || 0), 0);
                      let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>পারচেজ হিস্ট্রি</title>
<style>
@page { size: 80mm auto; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
html { width: 80mm; }
body { font-family:'Tiro Bangla','Courier New', monospace; width:80mm; margin:0; padding:2mm; font-size:11px; color:#000; background:#fff; }
.center { text-align:center; }
.border { border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px; }
.row { display:flex; justify-content:space-between; margin:2px 0; }
table { width:100%; border-collapse:collapse; font-size:10px; }
th { border-bottom:1px dashed #000; padding:3px 0; text-align:left; }
td { padding:3px 0; }
td:nth-child(2) { text-align:center; }
td:nth-child(3), td:nth-child(4) { text-align:right; }
.total { border-top:1px dashed #000; margin-top:5px; padding-top:5px; font-weight:bold; }
.footer { text-align:center; margin-top:10px; border-top:1px dashed #000; padding-top:5px; font-size:9px; }
</style>
</head>
<body>
<div class="center border">
  <div style="font-size:14px;font-weight:bold;">📦 পারচেজ হিস্ট্রি</div>
  <div>${viewPurchase.id}</div>
  <div>${new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
  <div>সরবরাহকারী: ${viewPurchase.supplier}</div>
</div>
<table>
  <thead><tr><th>পণ্য</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th></tr></thead>
  <tbody>`;
                      viewPurchase.items.forEach(item => {
                        const qty = item.stock||0;
                        const price = item.buyP||0;
                        html += `<tr><td>${item.name}<br><span style="font-size:9px;color:#666;">${item.company}</span></td><td>${qty} ${item.unit||'পিস'}</td><td>৳${price.toFixed(2)}</td><td>৳${(qty*price).toFixed(2)}</td></tr>`;
                      });
                      html += `</tbody>
</table>
<div class="total row"><span>সর্বমোট:</span><span>৳${grandTotal.toFixed(2)}</span></div>
<div class="footer">ধন্যবাদ<br>${new Date().toLocaleDateString('bn-BD')}</div>
</body>
</html>`;
                      const iframe = document.createElement('iframe');
                      iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px;';
                      document.body.appendChild(iframe);
                      iframe.contentWindow.document.open();
                      iframe.contentWindow.document.write(html);
                      iframe.contentWindow.document.close();
                      iframe.contentWindow.onload = function() {
                        setTimeout(() => {
                          iframe.contentWindow.print();
                          document.body.removeChild(iframe);
                        }, 100);
                      };
                    }} style={{...btn('primary'),padding:'6px 12px',fontSize:12}}>🖨️ প্রিন্ট</button>
                    <button onClick={()=>setViewPurchase(null)} style={{...btn(),padding:'6px 12px',fontSize:12}}>✕</button>
                  </div>
                </div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.gray50}}>
                    <th style={{padding:8,textAlign:'left',fontSize:11,color:T.gray600}}>পণ্যের নাম</th>
                    <th style={{padding:8,textAlign:'center',fontSize:11,color:T.gray600}}>পরিমাণ</th>
                    <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>দাম</th>
                    <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items.map((item,i) => {
                    const qty = item.stock || 0;
                    const price = item.buyP || 0;
                    const total = qty * price;
                    return (
                      <tr key={i} style={{borderBottom:`1px solid ${T.gray100}`}}>
                        <td style={{padding:10,fontSize:13}}>
                          <div style={{fontWeight:600}}>{item.name}</div>
                          <div style={{fontSize:11,color:T.gray400}}>{item.company} • {item.cat || '-'}</div>
                        </td>
                        <td style={{padding:10,textAlign:'center',fontWeight:600}}>{qty} {item.unit || 'পিস'}</td>
                        <td style={{padding:10,textAlign:'right',fontSize:13}}>{fmt(price)}</td>
                        <td style={{padding:10,textAlign:'right',fontWeight:700,color:T.green}}>{fmt(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{background:T.tealLight}}>
                    <td colSpan={3} style={{padding:10,fontWeight:700,fontSize:13}}>সর্বমোট</td>
                    <td style={{padding:10,textAlign:'right',fontWeight:800,fontSize:16,color:T.teal}}>
                      {fmt(viewPurchase.items.reduce((s,i) => s + (i.stock || 0) * (i.buyP || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <button onClick={()=>setViewPurchase(null)} style={{...btn(),marginTop:16,width:'100%'}}>বন্ধ করুন</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add product form
  if (showAddForm) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>{setShowAddForm(false);setPurchaseItems([]);setCsvData([]);}}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 নতুন পণ্য সংরক্ষণ</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:'auto'}}>{purchaseItems.length}টি পণ্য যোগ হয়েছে</span>
        </div>
        
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>
          {/* Left: Form */}
          <div style={{flex:1,padding:16,overflow:'auto',borderRight:`1px solid ${T.gray200}`}}>
            
            {/* CSV Import Section */}
            <div style={{...card,padding:16,marginBottom:16,background:T.tealLight,border:`1px dashed ${T.teal}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h3 style={{margin:0,fontSize:14,color:T.teal}}>📥 CSV আমদানি করুন</h3>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-start'}}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input type="file" accept=".csv" onChange={handleCsvImport} id="csvInput" style={{display:'none'}} />
                  <label htmlFor="csvInput" style={{...btn('primary'),cursor:'pointer',fontSize:13,padding:'10px 20px'}}>
                    📁 পণ্যের CSV আপলোড করুন
                  </label>
                  <button onClick={() => {
                    const csv = 'পণ্যের নাম,কোম্পানি কোড,কোম্পানি,ক্যাটাগরি,বারকোড,একক,ক্রয়মূল্য,বিক্রয়মূল্য,স্টক,মিনস্টক\nমিনিকেট চাল,M001,মিনিকেট,খাদ্যপণ্য,001,কেজি,55,65,100,10\nব্রিলিয়ান্ট চাল,B001,ব্রিলিয়ান্ট,খাদ্যপণ্য,002,কেজি,52,62,80,10\nসুজি চিপস,S001,সুজি,স্ন্যাকস,003,পিস,20,25,200,20\nপারফেক্ট সাবান,P001,পারফেক্ট,সৌন্দর্য,004,পিস,35,45,150,15';
                    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'পণ্যের_তালিকা.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }} style={{...btn('ghost'),fontSize:12,padding:'8px 16px'}}>
                    📥 ডেমো CSV ডাউনলোড
                  </button>
                </div>
                <div style={{fontSize:11,color:T.gray600}}>
                  💡 CSV ফাইলে কোম্পানি কোড, কোম্পানির নাম ও ক্যাটাগরি অবশ্যই ডাটাবেজে থাকতে হবে
                </div>
              </div>
              {csvData.length > 0 && (
                <div style={{marginTop:8,fontSize:12,color:T.teal,fontWeight:600}}>
                  ✓ {csvData.length}টি পণ্য আপলোড হয়েছে
                </div>
              )}
            </div>
            
            <div style={{...card,padding:16}}>
              <h3 style={{margin:'0 0 16px',fontSize:14,color:T.teal}}>পণ্য যোগ করুন</h3>
              
              {/* Supplier/Company */}
              <div style={{marginBottom:12, position:'relative'}}>
                <label style={label}>🏢 সরবরাহকারী/কোম্পানি *</label>
                <div style={{display:'flex',gap:4}}>
                  <input 
                    value={supplierQ} 
                    onChange={e=>{setSupplierQ(e.target.value);setForm(f=>({...f,company:e.target.value}));setShowCompanyList(true);}}
                    onClick={()=>setShowCompanyList(true)}
                    onBlur={()=>setTimeout(()=>setShowCompanyList(false),200)}
                    placeholder="কোম্পানির নাম লিখুন..."
                    style={{...input,fontSize:13,flex:1}} />
                  <button type="button" onClick={()=>setShowCompanyList(!showCompanyList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                </div>
                {showCompanyList && (
                  <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                    {uniqueCompanies.filter(c=>c && c.toLowerCase().includes((supplierQ||'').toLowerCase())).map((c,i)=>(
                      <div key={i} onClick={()=>{setSupplierQ(c);setForm(f=>({...f,company:c}));setShowCompanyList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                        {c}
                      </div>
                    ))}
                    {supplierQ && !uniqueCompanies.some(c=>c && c.toLowerCase()===(supplierQ||'').toLowerCase()) && (
                      <div onClick={()=>{setForm(f=>({...f,company:supplierQ}));setShowCompanyList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                        + নতুন কোম্পানি যুক্ত করুন: "{supplierQ}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{marginBottom:12, position:'relative'}}>
                <label style={label}>📂 ক্যাটাগরি</label>
                <div style={{display:'flex',gap:4}}>
                  <input 
                    value={form.cat} 
                    onChange={e=>{setForm(f=>({...f,cat:e.target.value}));setShowCategoryList(true);}}
                    onClick={()=>setShowCategoryList(true)}
                    onBlur={()=>setTimeout(()=>setShowCategoryList(false),200)}
                    placeholder="ক্যাটাগরি লিখুন..."
                    style={{...input,fontSize:13,flex:1}} />
                  <button type="button" onClick={()=>setShowCategoryList(!showCategoryList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                </div>
                {showCategoryList && (
                  <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                    {uniqueCategories.filter(c=>c && c.toLowerCase().includes((form.cat||'').toLowerCase())).map((c,i)=>(
                      <div key={i} onClick={()=>{setForm(f=>({...f,cat:c}));setShowCategoryList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                        {c}
                      </div>
                    ))}
                    {form.cat && !uniqueCategories.some(c=>c && c.toLowerCase()===(form.cat||'').toLowerCase()) && (
                      <div onClick={()=>{setShowCategoryList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                        + নতুন ক্যাটাগরি যুক্ত করুন: "{form.cat}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Barcode + Product Name */}
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <div style={{flex:1}}>
                  <label style={label}>④ বারকোড</label>
                  <input value={barcodeVal} onChange={e=>handleBarcode(e.target.value)} placeholder="বারকোড..."
                    style={{...input,fontSize:13}} />
                </div>
                <div style={{flex:2, position:'relative'}}>
                  <label style={label}>③ পণ্যের নাম *</label>
                  <div style={{display:'flex',gap:4}}>
                    <input value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setShowProductList(true);}} 
                      onClick={()=>setShowProductList(true)}
                      onBlur={()=>setTimeout(()=>setShowProductList(false),200)}
                      placeholder="পণ্যের নাম লিখুন..."
                      style={{...input,fontSize:13,flex:1}} />
                    <button type="button" onClick={()=>setShowProductList(!showProductList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                  </div>
                  {showProductList && (
                    <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                      {products.filter(p=>!(p.name||'').includes('(ক্যাটাগরি)') && (p.name||'').toLowerCase().includes((form.name||'').toLowerCase())).slice(0,20).map((p,i)=>(
                        <div key={i} onClick={()=>{selectProduct(p);setShowProductList(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                          <div style={{fontWeight:600}}>{p.name}</div>
                          <div style={{fontSize:11,color:T.gray400}}>{p.company} • {p.cat}</div>
                        </div>
                      ))}
                      {form.name && !products.some(p=>!(p.name||'').includes('(ক্যাটাগরি)') && (p.name||'').toLowerCase()===(form.name||'').toLowerCase()) && (
                        <div onClick={()=>{setShowProductList(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                          + নতুন পণ্য তৈরি করুন: "{form.name}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Fields: Unit, Stock, Prices, Min Stock */}
              <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                <div style={{flex:'1 1 100px',minWidth:80}}>
                  <label style={label}>📥 একক</label>
                  <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="পিস..."
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 80px',minWidth:70}}>
                  <label style={label}>📥 স্টক</label>
                  <input value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 90px',minWidth:80}}>
                  <label style={label}>💰 ক্রয়মূল্য</label>
                  <input value={form.buyP} onChange={e=>setForm(f=>({...f,buyP:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 90px',minWidth:80}}>
                  <label style={label}>💵 বিক্রয়মূল্য</label>
                  <input value={form.sellP} onChange={e=>setForm(f=>({...f,sellP:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 80px',minWidth:70}}>
                  <label style={label}>⚠️ মিন স্টক</label>
                  <input value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} type="number" placeholder="৫"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
              </div>

              {/* Profit Percentage Display */}
              {form.buyP > 0 && form.sellP > 0 && (
                <div style={{marginBottom:12,padding:'8px 12px',background:T.greenLight,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:T.gray600}}>📊 লাভ:</span>
                  <span style={{fontSize:16,fontWeight:700,color:T.green}}>
                    ৳{((+form.sellP || 0) - (+form.buyP || 0)).toFixed(2)} 
                    ({(((+form.sellP || 0) - (+form.buyP || 0)) / (+form.buyP || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}

              <button onClick={addToPurchase} style={{...btn('primary'),width:'100%',padding:'10px'}}>
                ➕ পণ্য তালিকায় যোগ করুন
              </button>
            </div>
          </div>

          {/* Right: Purchase Items List */}
          <div style={{width:360,display:'flex',flexDirection:'column',background:T.gray50,overflow:'hidden'}}>
            <div style={{padding:12,background:T.white,borderBottom:`1px solid ${T.gray200}`,fontWeight:700}}>
              📋 পণ্য তালিকা ({purchaseItems.length})
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {purchaseItems.length === 0 ? (
                <div style={{textAlign:'center',padding:40,color:T.gray400}}>
                  <div style={{fontSize:32,marginBottom:8}}>📦</div>
                  <div>কোনো পণ্য যোগ হয়নি</div>
                </div>
              ) : (
                purchaseItems.map((item,i)=>(
                  <div key={item.id} style={{padding:10,background:T.white,borderRadius:8,marginBottom:6,border:`1px solid ${T.gray200}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
                        <div style={{fontSize:11,color:T.gray500}}>{item.company} • {item.barcode}</div>
                        {item.cat && <div style={{fontSize:11,color:T.gray400,marginTop:2}}>📂 {item.cat}</div>}
                        <div style={{fontSize:12,marginTop:4}}>
                          <span style={{color:T.teal}}>৳{item.buyP || 0}</span> → <span style={{color:T.green}}>৳{item.sellP || 0}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700,fontSize:14}}>{item.stock || 0} {item.unit}</div>
                        <button onClick={()=>removeItem(item.id)} style={{fontSize:11,color:T.red,background:'none',border:'none',cursor:'pointer',marginTop:4}}>✕ মুছুন</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {purchaseItems.length > 0 && (
              <div style={{padding:12,background:T.white,borderTop:`1px solid ${T.gray200}`}}>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setPurchaseItems([])} style={{...btn('ghost'),flex:1}}>সব মুছুন</button>
                  <button onClick={savePurchase} style={{...btn('primary'),flex:2}}>💾 সংরক্ষণ করুন</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Sub-tabs: List / History */}
      <div style={{display:'flex',alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexShrink:0}}>
        <button onClick={()=>{setProductTab('list');setStockFilter('স্টক আছে');}} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:productTab==='list'?700:400,color:productTab==='list'?T.teal:T.gray500,borderBottom:productTab==='list'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📋 পণ্য তালিকা
        </button>
        <button onClick={()=>setProductTab('history')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:productTab==='history'?700:400,color:productTab==='history'?T.teal:T.gray500,borderBottom:productTab==='history'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📜 হিস্ট্রি ({productHistory.filter(h => h.type === 'price_buy' || h.type === 'price_sell').length})
        </button>
      </div>

      {/* History Tab Content */}
      {productTab === 'history' && (
        <div style={{flex:1,overflow:'auto',padding:12}}>
          <div style={{...card,overflow:'hidden'}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📜 পণ্যের দাম পরিবর্তনের ইতিহাস</div>
            {(() => {
              const priceHistory = productHistory.filter(h => h.type === 'price_buy' || h.type === 'price_sell');
              return priceHistory.length === 0 ? (
                <div style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো দাম পরিবর্তন নেই</div>
              ) : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:T.tealLight}}>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>তারিখ ও সময়</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পণ্যের নাম</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পরিবর্তনের ধরন</th>
                      <th style={{padding:'10px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>পুরাতন দাম</th>
                      <th style={{padding:'10px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>নতুন দাম</th>
                      <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>ব্যবহারকারী</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...priceHistory].reverse().map((h,i)=>(
                      <tr key={h.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                        <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>
                          {new Date(h.timestamp).toLocaleString('bn-BD')}
                        </td>
                        <td style={{padding:'10px 12px',fontWeight:600,fontSize:13}}>{h.productName}</td>
                        <td style={{padding:'10px 12px',fontSize:12}}>
                          {h.type === 'price_buy' && <span style={{background:T.orangeLight,color:T.orange,padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600}}>ক্রয়মূল্য</span>}
                          {h.type === 'price_sell' && <span style={{background:T.tealLight,color:T.teal,padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600}}>বিক্রয়মূল্য</span>}
                        </td>
                        <td style={{padding:'10px 12px',textAlign:'right',fontWeight:600,color:T.red}}>
                          {fmt(h.oldValue)}
                        </td>
                        <td style={{padding:'10px 12px',textAlign:'right',fontWeight:700,color:T.green}}>
                          {fmt(h.newValue)}
                        </td>
                        <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>
                          <div style={{fontWeight:600}}>{h.user}</div>
                          {h.userEmail && <div style={{fontSize:11,color:T.gray400}}>{h.userEmail}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      )}

      {/* List Tab Content */}
      {productTab === 'list' && (
      <>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        {/* স্টক আছে ট্যাব */}
        <button onClick={()=>setStockFilter('স্টক আছে')} style={{
          ...btn(stockFilter==='স্টক আছে'?'primary':'ghost','sm'),
          borderRadius:7, whiteSpace:'nowrap',
          background:stockFilter==='স্টক আছে'?T.teal:T.gray100,
          color:stockFilter==='স্টক আছে'?T.white:T.gray600,
          border:'none', padding:'8px 14px', fontSize:13,
        }}>📦 স্টক আছে ({stockCount})</button>
        
        {/* স্টক শেষ ট্যাব */}
        <button onClick={()=>setStockFilter('স্টক শেষ')} style={{
          ...btn(stockFilter==='স্টক শেষ'?'primary':'ghost','sm'),
          borderRadius:7, whiteSpace:'nowrap',
          background:stockFilter==='স্টক শেষ'?T.red:T.redLight,
          color:stockFilter==='স্টক শেষ'?T.white:T.red,
          border:'none', padding:'8px 14px', fontSize:13,
        }}>⚠️ স্টক শেষ ({outOfStockCount})</button>
        
        <div style={{position:'relative',flex:'1 1 200px',minWidth:150}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{...input,paddingLeft:32}}/>
        </div>
        <button style={btn('ghost')} onClick={()=>{
          const printFiltered = filtered.length > 0 ? filtered : products.filter(p=>!p.name?.includes('(ক্যাটাগরি)'));
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>পণ্যের তালিকা</title><style>
@page { size: A4 landscape; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Tiro Bangla',Arial,sans-serif; padding:10px; font-size:11px; }
.header { text-align:center; margin-bottom:15px; border-bottom:2px solid #00897b; padding-bottom:10px; }
.header h1 { color:#00897b; font-size:20px; margin-bottom:4px; }
.header p { color:#666; font-size:11px; }
table { width:100%; border-collapse:collapse; }
th { background:#e0f7f0; border:1px solid #b2dfdb; padding:6px 5px; text-align:left; font-size:10px; color:#00897b; font-weight:700; }
td { border:1px solid #e0e0e0; padding:6px 5px; font-size:11px; }
tr:nth-child(even) { background:#fafafa; }
.footer { margin-top:15px; text-align:center; color:#999; font-size:10px; }
</style></head><body>
<div class="header"><h1>📦 পণ্যের তালিকা</h1><p>${new Date().toLocaleDateString('bn-BD')} | ${printFiltered.length}টি পণ্য</p></div>
<table><thead><tr><th>কোম্পানি কোড</th><th>পণ্যের নাম</th><th>কোম্পানি</th><th>ক্যাটাগরি</th><th>ক্রয়মূল্য</th><th>বিক্রয়মূল্য</th><th>লাভ</th><th>স্টক</th><th>একক</th></tr></thead><tbody>
${printFiltered.map(p => {
  const profit = p.sellP - p.buyP;
  const profitPct = p.buyP > 0 ? Math.round((profit / p.buyP) * 100) : 0;
  const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'-';
  return `<tr><td>${supCode}</td><td>${p.name}</td><td>${p.company||'-'}</td><td>${p.cat||'-'}</td><td>৳${p.buyP.toLocaleString()}</td><td>৳${p.sellP.toLocaleString()}</td><td>৳${profit.toLocaleString()} (${profitPct}%)</td><td>${p.stock}</td><td>${p.unit}</td></tr>`;
}).join('')}
</tbody></table>
<div class="footer">প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')}</div>
</body></html>`;
          const win = window.open('', '_blank', 'width=1000,height=600,left=100,top=100');
          win.document.open();
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => { if (!win.closed) { win.print(); } }, 250);
        }}>🖨️ প্রিন্ট</button>
        <span style={{fontSize:12,color:T.gray400,marginLeft:'auto'}}>{filtered.length}টি পণ্য</span>
      </div>

      <div style={{flex:1,overflow:'auto',padding:12}}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:16}}>
            <div style={{
              width:48,height:48,border:'4px solid #E0E0E0',borderTop:'4px solid #00897b',
              borderRadius:'50%',animation:'spin 1s linear infinite'
            }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{fontSize:14,color:T.gray500}}>পণ্যের তালিকা লোড হচ্ছে...</div>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
            <thead>
              <tr style={{background:T.tealLight}}>
                {['কোম্পানি কোড','পণ্যের নাম','কোম্পানি','ক্যাটাগরি','ক্রয়মূল্য','বিক্রয়মূল্য','লাভ (%)','স্টক','একক',''].map((h,i)=>(
                  <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:T.gray400}}>পণ্য পাওয়া যায়নি</td></tr>
              ) : filtered.map((p,i)=>{
                const profitPct = p.buyP>0 ? Math.round((p.sellP-p.buyP)/p.buyP*100) : 0;
                const isLowStock = p.stock <= p.minStock;
                const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'';
                return (
                  <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{supCode||'-'}</td>
                    <td style={{padding:'10px 12px'}}>
                      <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                      {p.barcode && <div style={{fontSize:11,color:T.gray400,fontFamily:'monospace'}}>{p.barcode}</div>}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.company||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:T.gray600}}>{p.cat||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:13}}>{fmt(p.buyP)}</td>
                    <td style={{padding:'10px 12px',fontWeight:700,fontSize:14}}>{fmt(p.sellP)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{fontSize:12,fontWeight:600,color:profitPct>0?T.green:T.red}}>
                        {fmt(p.sellP-p.buyP)} ({profitPct}%)
                      </span>
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{fontWeight:700,fontSize:15,color:isLowStock?T.red:T.gray900}}>{fmtN(p.stock)}</span>
                      {isLowStock && <span style={{fontSize:10,color:T.red,marginLeft:4}}>⚠️ কম</span>}
                    </td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{p.unit}</td>
                    <td style={{padding:'10px 12px',display:'flex',gap:6}}>
                      <button style={{...btn('ghost','sm'),padding:'5px 8px',fontSize:14}} onClick={()=>setViewProduct(p)} title="দেখুন">👁️</button>
                      <button style={{...btn('primary','sm'),padding:'5px 8px',fontSize:14}} onClick={()=>setEditProduct({...p})} title="সম্পাদনা">✏️</button>
                      <button style={{...btn('danger','sm'),padding:'5px 8px',fontSize:14}} onClick={()=>del(p.id)} title="মুছুন">🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      </>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div style={overlay}>
          <div style={{background:T.white,borderRadius:12,padding:24,width:400,maxWidth:'90vw',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{margin:0,fontSize:16,color:T.teal}}>✏️ পণ্যের দাম সম্পাদনা</h3>
              <button onClick={()=>setEditProduct(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.gray400}}>✕</button>
            </div>
            
            <div style={{marginBottom:12}}>
              <div style={{fontWeight:600,fontSize:14,marginBottom:8}}>{editProduct.name}</div>
              <div style={{fontSize:12,color:T.gray400}}>{editProduct.company} • {editProduct.cat || '-'}</div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,fontWeight:600,color:T.gray600,marginBottom:6,display:'block'}}>ক্রয়মূল্য (৳)</label>
              <input 
                type="number" 
                value={editProduct.buyP}
                onChange={e=>setEditProduct({...editProduct, buyP: parseFloat(e.target.value)||0})}
                style={{...input,padding:'10px 12px',fontSize:14}}
              />
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,color:T.gray600,marginBottom:6,display:'block'}}>বিক্রয়মূল্য (৳)</label>
              <input 
                type="number" 
                value={editProduct.sellP}
                onChange={e=>setEditProduct({...editProduct, sellP: parseFloat(e.target.value)||0})}
                style={{...input,padding:'10px 12px',fontSize:14}}
              />
            </div>

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setEditProduct(null)} style={{...btn('ghost'),flex:1}}>বাতিল</button>
              <button onClick={handleEditProduct} style={{...btn('primary'),flex:2}}>💾 সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div style={overlay}>
          <div style={{background:T.white,borderRadius:12,padding:24,width:500,maxWidth:'90vw',boxShadow:'0 8px 32px rgba(0,0,0,0.2)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <h3 style={{margin:0,fontSize:16,color:T.teal}}>📋 পণ্যের বিবরণ</h3>
              <button onClick={()=>setViewProduct(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:T.gray400}}>✕</button>
            </div>
            
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>পণ্যের নাম</div>
                <div style={{fontWeight:600,fontSize:14}}>{viewProduct.name}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>বারকোড</div>
                <div style={{fontFamily:'monospace',fontSize:13}}>{viewProduct.barcode || '-'}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>কোম্পানি</div>
                <div style={{fontSize:13}}>{viewProduct.company || '-'}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>ক্যাটাগরি</div>
                <div style={{fontSize:13}}>{viewProduct.cat || '-'}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>ক্রয়মূল্য</div>
                <div style={{fontWeight:700,fontSize:16,color:T.orange}}>{fmt(viewProduct.buyP)}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>বিক্রয়মূল্য</div>
                <div style={{fontWeight:700,fontSize:16,color:T.teal}}>{fmt(viewProduct.sellP)}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>স্টক</div>
                <div style={{fontWeight:700,fontSize:16,color:viewProduct.stock <= viewProduct.minStock ? T.red : T.green}}>{viewProduct.stock} {viewProduct.unit}</div>
              </div>
              <div>
                <div style={{fontSize:11,color:T.gray400,marginBottom:4}}>মিনিমাম স্টক</div>
                <div style={{fontSize:14}}>{viewProduct.minStock} {viewProduct.unit}</div>
              </div>
            </div>

            <button onClick={()=>setViewProduct(null)} style={{...btn(),width:'100%'}}>বন্ধ করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BARCODE SCREEN
═══════════════════════════════════════════ */
function BarcodeScreen({purchases, products}) {
  const [purchaseId, setPurchaseId] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [barcodeCounts, setBarcodeCounts] = useState({});
  const [barcodeListItems, setBarcodeListItems] = useState([]); // Items added from barcode search
  
  // Find purchase by ID or barcode
  const findPurchase = () => {
    // First check if it's a purchase ID
    const foundById = purchases.find(p => (p.id||'').toLowerCase().includes(purchaseId.toLowerCase()));
    if (foundById) {
      setSelectedPurchase(foundById);
      setBarcodeListItems([]);
      // Initialize counts for each product
      const counts = {};
      foundById.items.forEach((item, idx) => {
        counts[idx] = item.stock || 1;
      });
      setBarcodeCounts(counts);
      return;
    }
    
    // Then check if it's a barcode number - search in all purchases
    const trimmedBarcode = purchaseId.trim();
    if (!trimmedBarcode) {
      alert('পারচেজ আইডি বা বারকোড নম্বর দিন!');
      return;
    }
    
    // Search in all purchases for matching barcode
    let foundItem = null;
    [...purchases].reverse().forEach(purchase => {
      if (foundItem) return;
      purchase.items.forEach(item => {
        if (foundItem) return;
        if (item.barcode === trimmedBarcode || (item.barcode && item.barcode.toLowerCase().includes(trimmedBarcode.toLowerCase()))) {
          foundItem = {
            ...item,
            purchaseId: purchase.id,
            purchaseDate: purchase.date
          };
        }
      });
    });
    
    if (foundItem) {
      setSelectedPurchase(null);
      // Add to barcode list (check if already exists)
      const exists = barcodeListItems.some(i => i.barcode === foundItem.barcode);
      if (exists) {
        alert('এই বারকোড ইতিমধ্যে তালিকায় আছে!');
        return;
      }
      setBarcodeListItems([...barcodeListItems, {
        ...foundItem,
        listIdx: Date.now()
      }]);
      setPurchaseId('');
    } else {
      alert('এই বারকোড নম্বরে কোনো পণ্য পাওয়া যায়নি!');
    }
  };
  
  // Update count for barcode list item
  const updateBarcodeListCount = (listIdx, count) => {
    const n = parseInt(count) || 0;
    setBarcodeListItems(items => items.map(i => 
      i.listIdx === listIdx ? {...i, count: n} : i
    ));
  };
  
  // Remove item from barcode list
  const removeBarcodeListItem = (listIdx) => {
    setBarcodeListItems(items => items.filter(i => i.listIdx !== listIdx));
  };
  
  // Print all barcodes from list
  const printBarcodeList = () => {
    if (barcodeListItems.length === 0) return;
    
    const barcodeData = [];
    barcodeListItems.forEach(item => {
      const count = item.count || 1;
      if (count <= 0) return;
      const barcodeValue = item.barcode;
      for (let i = 0; i < count; i++) {
        barcodeData.push({ value: barcodeValue, price: item.sellP || 0 });
      }
    });
    
    if (barcodeData.length === 0) {
      alert('কোনো বারকোড প্রিন্ট করার জন্য নেই!');
      return;
    }
    
    const escapeJS = (str) => String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
    
    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Barcode Labels</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
@page { size: A4; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 5mm; background: #fff; }
.barcode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.barcode-item { border: 1px solid #ddd; padding: 5px; text-align: center; page-break-inside: avoid; }
.barcode-price { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 0; }
.barcode-svg { display: block; margin: 0 auto; }
.barcode-number { font-size: 14px; font-family: monospace; color: #333; letter-spacing: 0.5px; }
</style>
</head>
<body>
<div class="barcode-grid">`;

    barcodeData.forEach((item, idx) => {
      html += `<div class="barcode-item">
  <div class="barcode-price">৳${item.price}</div>
  <svg id="bc${idx}" class="barcode-svg"></svg>
  <div class="barcode-number">${escapeJS(item.value)}</div>
</div>`;
    });

    const jsArray = barcodeData.map(item => `{"value":"${escapeJS(item.value)}","price":${item.price}}`).join(',');
    
    html += `</div>
<script>
  window.onload = function() {
    var barcodeData = [${jsArray}];
    barcodeData.forEach(function(item, idx) {
      try {
        JsBarcode("#bc" + idx, item.value, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false,
          margin: 5
        });
      } catch(e) {
        try {
          JsBarcode("#bc" + idx, item.value.replace(/[^a-zA-Z0-9]/g, 'X'), {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false,
            margin: 5
          });
        } catch(e2) {}
      }
    });
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</body></html>`;

    const win = window.open('', '', 'width=900,height=700');
    win.document.open();
    win.document.write(html);
    win.document.close();
  };
  
  // Print single barcode
  const printSingleBarcode = (item, count = 1) => {
    if (!item.barcode) {
      alert('এই পণ্যের বারকোড নেই! প্রথমে পণ্যে বারকোড যোগ করুন।');
      return;
    }
    const barcodeValue = item.barcode;
    const price = item.sellP || 0;
    const escapeJS = (str) => String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
    
    const barcodeData = [];
    for (let i = 0; i < count; i++) {
      barcodeData.push({ value: barcodeValue, price: price });
    }
    const jsArray = barcodeData.map(b => `{"value":"${escapeJS(b.value)}","price":${b.price}}`).join(',');
    
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Barcode Labels</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
@page { size: A4; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 5mm; background: #fff; }
.barcode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.barcode-item { border: 1px solid #ddd; padding: 5px; text-align: center; page-break-inside: avoid; }
.barcode-price { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 0; }
.barcode-svg { display: block; margin: 0 auto; }
.barcode-number { font-size: 14px; font-family: monospace; color: #333; letter-spacing: 0.5px; }
</style>
</head>
<body>
<div class="barcode-grid">
${barcodeData.map((b, i) => `<div class="barcode-item">
  <div class="barcode-price">৳${b.price}</div>
  <svg id="bc${i}" class="barcode-svg"></svg>
  <div class="barcode-number">${escapeJS(b.value)}</div>
</div>`).join('')}
</div>
<script>
  window.onload = function() {
    var data = [${jsArray}];
    data.forEach(function(item, idx) {
      try {
        JsBarcode("#bc" + idx, item.value, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false,
          margin: 5
        });
      } catch(e) {
        try {
          JsBarcode("#bc" + idx, item.value.replace(/[^a-zA-Z0-9]/g, 'X'), {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false,
            margin: 5
          });
        } catch(e2) {}
      }
    });
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</body></html>`;
    
    const win = window.open('', '', 'width=900,height=700');
    win.document.open();
    win.document.write(html);
    win.document.close();
  };
  
  // Update count for a product
  const updateCount = (idx, count) => {
    const n = parseInt(count) || 0;
    setBarcodeCounts(prev => ({...prev, [idx]: n}));
  };
  
  // Print all barcodes (A4 size)
  const printBarcodes = () => {
    if (!selectedPurchase) return;

    // Build data for barcodes
    const barcodeData = [];
    selectedPurchase.items.forEach((item, idx) => {
      const count = barcodeCounts[idx] || 0;
      if (count <= 0) return; // Skip items with 0 count
      const barcodeValue = item.barcode || item.id;
      for (let i = 0; i < count; i++) {
        barcodeData.push({ value: barcodeValue, price: item.sellP || 0 });
      }
    });

    // Show warning if no barcodes to print
    if (barcodeData.length === 0) {
      alert('কোনো বারকোড প্রিন্ট করার জন্য নেই! কাউন্ট সেট করুন অথবা প্রিন্ট থেকে বাদ দিন বাটন ব্যবহার করুন।');
      return;
    }

    // Escape function for JavaScript strings
    const escapeJS = (str) => String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");

    let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Barcode Labels</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
@page { size: A4; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 5mm; background: #fff; }
.barcode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.barcode-item { border: 1px solid #ddd; padding: 5px; text-align: center; page-break-inside: avoid; }
.barcode-price { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 0; }
.barcode-svg { display: block; margin: 0 auto; }
.barcode-number { font-size: 14px; font-family: monospace; color: #333; letter-spacing: 0.5px; }
</style>
</head>
<body>
<div class="barcode-grid">`;

    barcodeData.forEach((item, idx) => {
      html += `<div class="barcode-item">
  <div class="barcode-price">৳${item.price}</div>
  <svg id="bc${idx}" class="barcode-svg"></svg>
  <div class="barcode-number">${escapeJS(item.value)}</div>
</div>`;
    });

    // Create JavaScript array string
    const jsArray = barcodeData.map(item => `{"value":"${escapeJS(item.value)}","price":${item.price}}`).join(',');
    
    html += `</div>
<script>
  window.onload = function() {
    var barcodeData = [${jsArray}];
    barcodeData.forEach(function(item, idx) {
      try {
        JsBarcode("#bc" + idx, item.value, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false,
          margin: 5
        });
      } catch(e) {
        try {
          JsBarcode("#bc" + idx, item.value.replace(/[^a-zA-Z0-9]/g, 'X'), {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false,
            margin: 5
          });
        } catch(e2) {}
      }
    });
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</body></html>`;

    // A4 print - window.open for preview and printer selection
    const win = window.open('', '', 'width=900,height=700');
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',background:T.gray50}}>
      {/* Header */}
      <div style={{padding:16,background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:12}}>📊 বারকোড প্রিন্ট</div>
        <div style={{display:'flex',gap:8}}>
          <input 
            value={purchaseId} 
            onChange={e=>setPurchaseId(e.target.value)}
            placeholder="পারচেজ আইডি বা বারকোড নম্বর দিন..."
            style={{...input,flex:1,padding:'10px 12px'}}
            onKeyDown={e=>{if(e.key==='Enter')findPurchase();}}
          />
          <button onClick={findPurchase} style={{...btn('primary'),padding:'10px 20px'}}>🔍 খুঁজুন</button>
        </div>
        <div style={{fontSize:11,color:T.gray400,marginTop:6}}>
          💡 পারচেজ আইডি (PO-12345678) বা বারকোড নম্বর দিয়ে সার্চ করুন
        </div>
        
        {/* Recent Purchases */}
        {purchases.length > 0 && (
          <div style={{marginTop:12}}>
            <div style={{fontSize:12,color:T.gray500,marginBottom:6}}>সাম্প্রতিক পারচেজ:</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {purchases.slice(-5).reverse().map(p => (
                <button key={p.id} onClick={()=>{
                  setPurchaseId(p.id);
                  setSelectedPurchase(p);
                  setBarcodeListItems([]);
                  const counts = {};
                  p.items.forEach((item, idx) => {
                    counts[idx] = item.stock || 1;
                  });
                  setBarcodeCounts(counts);
                }} style={{
                  padding:'4px 10px',border:`1px solid ${T.gray200}`,borderRadius:20,
                  background:T.white,fontSize:11,cursor:'pointer',color:T.gray600
                }}>{p.id}</button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Products List */}
      {selectedPurchase ? (
        <div style={{flex:1,overflow:'auto',padding:16}}>
          <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontWeight:700,color:T.teal}}>{selectedPurchase.id}</div>
              <div style={{fontSize:12,color:T.gray500}}>{new Date(selectedPurchase.date).toLocaleDateString('bn-BD')} • {selectedPurchase.supplier}</div>
            </div>
            <button onClick={printBarcodes} style={{...btn('primary'),padding:'10px 20px'}}>🖨️ সব বারকোড প্রিন্ট করুন</button>
          </div>
          
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {selectedPurchase.items.map((item, idx) => {
              const count = barcodeCounts[idx] !== undefined ? barcodeCounts[idx] : 1;
              if (count <= 0) return null;
              return (
              <div key={idx} style={{
                padding:14,background:T.white,borderRadius:10,
                border:`1px solid ${T.gray200}`,display:'flex',alignItems:'center',gap:12
              }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{item.name}</div>
                  <div style={{fontSize:12,color:T.gray500}}>
                    বারকোড: <span style={{fontFamily:'monospace',color:T.teal}}>{item.barcode || item.id}</span>
                  </div>
                  <div style={{fontSize:11,color:T.gray400}}>মূল্য: ৳{item.sellP || 0} | কোম্পানি: {item.company || '-'}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12,color:T.gray500}}>কাউন্ট:</span>
                  <input 
                    type="number" 
                    min="0"
                    value={barcodeCounts[idx] !== undefined ? barcodeCounts[idx] : 1}
                    onChange={e=>updateCount(idx, e.target.value)}
                    style={{...input,width:60,textAlign:'center',padding:'6px'}}
                  />
                  <button onClick={()=>updateCount(idx, 0)} style={{...btn('danger'),padding:'6px 10px',fontSize:12}} title="প্রিন্ট থেকে বাদ দিন">✕</button>
                  <button onClick={()=>{
                    // Print single barcode (A4 size)
                    const barcodeValue = item.barcode || item.id;
                    const price = item.sellP || 0;
                    const count = barcodeCounts[idx] || 1;
                    if (count <= 0) {
                      alert('এই প্রোডাক্টের কাউন্ট ০ তাই প্রিন্ট করা সম্ভব নয়।');
                      return;
                    }
                    const escapeJS = (str) => String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
                    
                    // Build barcode data array
                    const barcodeData = [];
                    for (let i = 0; i < count; i++) {
                      barcodeData.push({ value: barcodeValue, price: price });
                    }
                    const jsArray = barcodeData.map(item => `{"value":"${escapeJS(item.value)}","price":${item.price}}`).join(',');
                    
                    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Barcode Labels</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
<style>
@page { size: A4; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 5mm; background: #fff; }
.barcode-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.barcode-item { border: 1px solid #ddd; padding: 5px; text-align: center; page-break-inside: avoid; }
.barcode-price { font-size: 18px; font-weight: bold; color: #000; margin-bottom: 0; }
.barcode-svg { display: block; margin: 0 auto; }
.barcode-number { font-size: 14px; font-family: monospace; color: #333; letter-spacing: 0.5px; }
</style>
</head>
<body>
<div class="barcode-grid">
${barcodeData.map((item, i) => `<div class="barcode-item">
  <div class="barcode-price">৳${item.price}</div>
  <svg id="bc${i}" class="barcode-svg"></svg>
  <div class="barcode-number">${escapeJS(item.value)}</div>
</div>`).join('')}
</div>
<script>
  window.onload = function() {
    var data = [${jsArray}];
    data.forEach(function(item, idx) {
      try {
        JsBarcode("#bc" + idx, item.value, {
          format: "CODE128",
          width: 2,
          height: 50,
          displayValue: false,
          margin: 5
        });
      } catch(e) {
        try {
          JsBarcode("#bc" + idx, item.value.replace(/[^a-zA-Z0-9]/g, 'X'), {
            format: "CODE128",
            width: 2,
            height: 50,
            displayValue: false,
            margin: 5
          });
        } catch(e2) {}
      }
    });
    setTimeout(function() { window.print(); }, 300);
  };
</script>
</body>
</html>`;
                    // A4 print - window.open for preview and printer selection
                    const win = window.open('', '', 'width=900,height=700');
                    win.document.open();
                    win.document.write(html);
                    win.document.close();
                  }} style={{...btn('ghost'),padding:'6px 12px',fontSize:12}}>🖨️</button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ) : barcodeListItems.length > 0 ? (
        <div style={{flex:1,overflow:'auto',padding:16}}>
          <div style={{marginBottom:12,display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontWeight:700,color:T.teal}}>📋 বারকোড লিস্ট ({barcodeListItems.length}টি)</div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setBarcodeListItems([])} style={{...btn('danger'),padding:'8px 16px'}}>✕ সব সরান</button>
              <button onClick={printBarcodeList} style={{...btn('primary'),padding:'8px 16px'}}>🖨️ সব প্রিন্ট</button>
            </div>
          </div>
          
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {barcodeListItems.map((item, idx) => (
              <div key={item.listIdx} style={{
                padding:14,background:T.white,borderRadius:10,
                border:`1px solid ${T.gray200}`,display:'flex',alignItems:'center',gap:12
              }}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:2}}>{item.name}</div>
                  <div style={{fontSize:12,color:T.gray500}}>
                    বারকোড: <span style={{fontFamily:'monospace',color:T.teal}}>{item.barcode}</span>
                  </div>
                  <div style={{fontSize:11,color:T.gray400}}>মূল্য: ৳{item.sellP || 0} | কোম্পানি: {item.company || '-'}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <span style={{fontSize:12,color:T.gray500}}>কাউন্ট:</span>
                  <input 
                    type="number" 
                    min="1"
                    value={item.count || 1}
                    onChange={e=>updateBarcodeListCount(item.listIdx, e.target.value)}
                    style={{...input,width:60,textAlign:'center',padding:'6px'}}
                  />
                  <button onClick={()=>printSingleBarcode(item, item.count || 1)} style={{...btn('primary'),padding:'6px 10px',fontSize:12}}>🖨️</button>
                  <button onClick={()=>removeBarcodeListItem(item.listIdx)} style={{...btn('danger'),padding:'6px 10px',fontSize:12}}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:T.gray400}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:48,marginBottom:12}}>📊</div>
            <div>পারচেজ আইডি বা বারকোড নম্বর দিন</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUPPLIERS SCREEN
═══════════════════════════════════════════ */
function SuppliersScreen({suppliers, products, categories, purchases, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [viewSupplier, setViewSupplier] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('pos_suppliers_tab') || 'companies'); // companies, products, categories
  const [productForm, setProductForm] = useState({company:'',cat:'',name:'',barcode:'',unit:'পিস',buyP:'',sellP:'',stock:0,minStock:5});
  const [catForm, setCatForm] = useState({name:''});
  const [companyQ, setCompanyQ] = useState('');
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);
  const [catQ, setCatQ] = useState('');
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showCsvSection, setShowCsvSection] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState(null);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pos_suppliers_tab', activeTab);
  }, [activeTab]);

  // Click outside to close dropdowns - only close when clicking outside the modal
  useEffect(() => {
    const handleClick = (e) => {
      // Only close if clicking outside the modal
      const modal = document.querySelector('[data-modal]');
      if (modal && !modal.contains(e.target)) {
        setShowCompanyDrop(false);
        setShowCatDrop(false);
        setShowCatCompanyDrop(false);
        setShowProductDrop(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  // Get categories from categories state (not from products)
  const allCategories = [...new Set(categories.map(c => c.name).filter(Boolean))];
  
  // Get products by company
  const companyProducts = form.company 
    ? products.filter(p => (p.company||'').toLowerCase() === (form.company||'').toLowerCase())
    : [];
    
  // Get categories for selected company
  const companyCategories = form.company 
    ? categories.filter(c => (c.company||'').toLowerCase() === (form.company||'').toLowerCase()).map(c => c.name)
    : [];

  // Filter companies for dropdown
  const filteredCompanies = suppliers.filter(s => 
    !companyQ || (s.name||'').toLowerCase().includes((companyQ||'').toLowerCase()) || (s.code||'').toLowerCase().includes((companyQ||'').toLowerCase())
  );

  // Filter categories for dropdown
  const filteredCats = companyCategories.filter(c => 
    !catQ || (c||'').toLowerCase().includes((catQ||'').toLowerCase())
  );

  // Get products count for each supplier
  const getProductsCount = (company) => products.filter(p => (p.company||'').toLowerCase() === (company||'').toLowerCase()).length;
  
  // Get purchases for a supplier
  const getSupplierPurchases = (company) => purchases.filter(p => (p.supplier||'').toLowerCase() === (company||'').toLowerCase());

  // Get all unique companies from products
  const allCompanies = [...new Set(products.map(p => p.company).filter(Boolean))];
  
  // Combine suppliers and product companies
  const allSuppliers = [
    ...suppliers,
    ...allCompanies.filter(c => !suppliers.find(s => (s.name||'').toLowerCase() === (c||'').toLowerCase())).map(c => ({ id: `auto-${c}`, name: c, phone: '', address: '', isAuto: true }))
  ];

  const filtered = allSuppliers.filter(s => 
    !search || (s.name||'').toLowerCase().includes((search||'').toLowerCase()) || (s.phone||'').includes(search) || (s.code||'').toLowerCase().includes((search||'').toLowerCase())
  );

  const saveCompany = async () => {
    if (!form.name?.trim()) { alert('কোম্পানির নাম দিন'); return; }
    
    // Check for duplicate company name
    const exists = suppliers.some(s => (s.name||'').toLowerCase().trim() === (form.name||'').toLowerCase().trim());
    if (exists) { alert('❌ এই কোম্পানির নাম ইতিমধ্যে আছে!'); return; }
    
    // Use custom code if provided, otherwise generate auto code
    let newCode = form.code?.trim();
    if (!newCode) {
      const maxCode = suppliers.reduce((max, s) => {
        const match = s.code?.match(/C-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      newCode = `C-${String(maxCode + 1).padStart(5, '0')}`;
    } else {
      // Check for duplicate code
      const codeExists = suppliers.some(s => s.code === newCode);
      if (codeExists) { alert('❌ এই কোম্পানি আইডি ইতিমধ্যে আছে!'); return; }
    }
    
    if (form.isAuto) {
      // Convert auto to real supplier
      const newS = { id: genId(), code: newCode, name: form.name.trim(), phone: form.phone||'', address: form.address||'' };
      await upd.suppliers([...suppliers, newS]);
      setForm({name:'',phone:'',address:'',isAuto:false});
      alert(`✅ কোম্পানি যোগ করা হয়েছে!\nকোম্পানি কোড: ${newCode}`);
    } else if (modal.mode === 'add') {
      await upd.suppliers([...suppliers, {...form, id: genId(), code: newCode}]);
      setForm({name:'',phone:'',address:'',isAuto:false,code:''});
      alert(`✅ কোম্পানি যোগ করা হয়েছে!\nকোম্পানি কোড: ${newCode}`);
    } else {
      await upd.suppliers(suppliers.map(s => s.id === modal.id ? {...form, id: modal.id} : s));
      setModal(null);
    }
  };

  const saveProduct = async () => {
    if (!productForm.company) { alert('কোম্পানি সিলেক্ট করুন'); return; }
    if (!productForm.cat) { alert('ক্যাটাগরি সিলেক্ট করুন'); return; }
    if (!productForm.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    
    // Check for duplicate by company AND barcode (if barcode is provided)
    const barcode = productForm.barcode?.trim() || '';
    if (barcode) {
      const existingIndex = products.findIndex(
        p => p.company === productForm.company && p.barcode === barcode
      );
      if (existingIndex !== -1) {
        // Update existing product - add stock
        const existing = products[existingIndex];
        const updatedProducts = [...products];
        updatedProducts[existingIndex] = {
          ...existing,
          stock: (existing.stock || 0) + (productForm.stock || 0),
          buyP: productForm.buyP || existing.buyP,
          sellP: productForm.sellP || existing.sellP,
          minStock: productForm.minStock || existing.minStock
        };
        await upd.products(updatedProducts);
        setProductForm({company:productForm.company,cat:productForm.cat,name:'',barcode:'',unit:'পিস',buyP:'',sellP:'',stock:0,minStock:5});
        alert(`✅ পণ্যের স্টক আপডেট হয়েছে!\nপণ্য: ${productForm.name}\nনতুন স্টক: ${updatedProducts[existingIndex].stock}`);
        return;
      }
    }
    
    // Check for duplicate product name (only if no barcode match)
    const exists = products.some(p => (p.name||'').toLowerCase().trim() === (productForm.name||'').toLowerCase().trim());
    if (exists) { alert('❌ এই পণ্যের নাম ইতিমধ্যে আছে!'); return; }
    
    // Generate product ID (P-00001, P-00002, etc.)
    const maxId = products.reduce((max, p) => {
      const match = p.id?.match(/P-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 50);
    const newId = `P-${String(maxId + 1).padStart(5, '0')}`;
    
    const newP = {
      id: newId,
      name: productForm.name.trim(),
      barcode: barcode,
      company: productForm.company,
      cat: productForm.cat,
      unit: productForm.unit || 'পিস',
      buyP: parseFloat(productForm.buyP) || 0,
      sellP: parseFloat(productForm.sellP) || 0,
      stock: parseFloat(productForm.stock) || 0,
      minStock: parseFloat(productForm.minStock) || 5
    };
    await upd.products([...products, newP]);
    setProductForm({company:productForm.company,cat:productForm.cat,name:'',barcode:'',unit:'পিস',buyP:'',sellP:'',stock:0,minStock:5});
    alert(`পণ্য সংরক্ষিত হয়েছে! আইডি: ${newId}`);
  };

  const saveCategory = async () => {
    if (!catForm.name?.trim()) { alert('ক্যাটাগরির নাম দিন'); return; }
    
    // Check for duplicate category name
    const exists = categories.some(c => (c.name||'').toLowerCase().trim() === (catForm.name||'').toLowerCase().trim());
    if (exists) { alert('❌ এই ক্যাটাগরির নাম ইতিমধ্যে আছে!'); return; }
    
    // Save category to categories state
    const newCat = {
      id: genId(),
      name: catForm.name.trim()
    };
    await upd.categories([...categories, newCat]);
    alert(`✅ ক্যাটাগরি যোগ করা হয়েছে!\nক্যাটাগরি: ${catForm.name.trim()}`);
    setCatForm({name:''});
  };

  const del = async (id) => {
    if (!confirm('এই কোম্পানি মুছে ফেলবেন?')) return;
    await upd.suppliers(suppliers.filter(s => s.id !== id));
  };

  // CSV Import Handler for suppliers/products/categories
  const handleSuppliersCsvImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          alert('CSV ফাইলে কমপক্ষে হেডার ও একটি ডাটা থাকতে হবে');
          return;
        }
        
        // Parse CSV header
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Parse data rows
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
          const values = [];
          let current = '';
          let inQuotes = false;
          for (const char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          const row = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          rows.push(row);
        }
        
        // Process data - ONLY companies and categories, NOT products
        let newCompanies = [...suppliers];
        let newCategories = [...categories];
        const errors = [];
        
        // Track for duplicate checking within CSV
        const csvCompanies = new Set();
        const csvCategories = new Set();
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;
          
          // Get company info
          const csvCompanyCode = (row['কোম্পানি কোড'] || row['company code'] || '').trim();
          const csvCompany = (row['কোম্পানি'] || row['company'] || '').trim();
          const csvCategory = (row['ক্যাটাগরি'] || row['category'] || '').trim();
          
          // Validate and add company
          if (csvCompany) {
            const companyExists = newCompanies.some(s => (s.name||'').toLowerCase() === (csvCompany||'').toLowerCase());
            if (!companyExists) {
              // Generate company code
              const maxCode = newCompanies.reduce((max, s) => {
                const match = s.code?.match(/C-(\d+)/);
                return match ? Math.max(max, parseInt(match[1])) : max;
              }, 0);
              const newCode = csvCompanyCode || `C-${String(maxCode + 1).padStart(5, '0')}`;
              
              // Check for duplicate code
              if (csvCompanyCode && newCompanies.some(s => s.code === csvCompanyCode)) {
                errors.push(`সারি ${rowNum}: কোম্পানি কোড "${csvCompanyCode}" ইতিমধ্যে আছে`);
              } else {
                const newComp = {
                  id: genId(),
                  code: newCode,
                  name: csvCompany,
                  phone: '',
                  address: ''
                };
                newCompanies.push(newComp);
                csvCompanies.add((csvCompany||'').toLowerCase());
              }
            }
          }
          
          // Validate and add category
          if (csvCategory) {
            const catExists = newCategories.some(c => (c.name||'').toLowerCase() === (csvCategory||'').toLowerCase());
            if (!catExists) {
              if (!csvCategories.has((csvCategory||'').toLowerCase())) {
                const newCat = {
                  id: genId(),
                  name: csvCategory
                };
                newCategories.push(newCat);
                csvCategories.add((csvCategory||'').toLowerCase());
              }
            }
          }
        }
        
        // Save changes - only companies and categories
        await upd.suppliers(newCompanies);
        await upd.categories(newCategories);
        
        // Show result
        const result = {
          companies: newCompanies.length - suppliers.length,
          categories: newCategories.length - categories.length,
          products: 0,
          errors: errors.length,
          errorList: errors
        };
        setCsvImportResult(result);
        
        let msg = `✅ আমদানি সম্পন্ন!\n\n`;
        msg += `🏢 নতুন কোম্পানি: ${result.companies}টি\n`;
        msg += `📂 নতুন ক্যাটাগরি: ${result.categories}টি\n`;
        if (errors.length > 0) {
          msg += `\n⚠️ সমস্যা: ${errors.length}টি\n`;
          msg += errors.slice(0, 5).join('\n');
          if (errors.length > 5) msg += `\n... এবং আরও ${errors.length - 5}টি`;
        }
        alert(msg);
        
      } catch (err) {
        alert(`❌ CSV পার্স করতে সমস্যা!\n\n${err.message}\n\nCSV ফাইল সঠিক ফরম্যাটে আছে কিনা দয়া করে পরীক্ষা করুন।`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download demo CSV
  const downloadSuppliersCSV = () => {
    const csv = `পণ্যের নাম,কোম্পানি কোড,কোম্পানি,ক্যাটাগরি,বারকোড,একক,ক্রয়মূল্য,বিক্রয়মূল্য,স্টক,মিনস্টক
মিনিকেট চাল 5kg,C-00001,মিনিকেট,খাদ্যপণ্য,001,বস্তা,2500,2800,50,10
মিনিকেট চাল 10kg,C-00001,মিনিকেট,খাদ্যপণ্য,002,বস্তা,4800,5200,30,5
সুজি চিপস,C-00002,সুজান,স্ন্যাকস,003,পিস,20,25,200,50
সুজি বিস্কুট,C-00002,সুজান,স্ন্যাকস,004,পিস,15,20,150,40`;
    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'সরবরাহকারী_পণ্য.csv';
    a.click();
  };

  // Purchase history for supplier
  const supplierPurchases = showPurchaseHistory ? getSupplierPurchases(showPurchaseHistory.name) : [];

  if (showPurchaseHistory) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setShowPurchaseHistory(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 {showPurchaseHistory.name} - পারচেজ হিস্ট্রি</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:'auto'}}>{supplierPurchases.length}টি পারচেজ</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {supplierPurchases.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:T.gray400}}>কোনো পারচেজ রেকর্ড নেই</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...supplierPurchases].reverse().map(p => (
                <div key={p.id} style={{padding:14,background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontWeight:700,color:T.teal}}>{p.id}</div>
                    <div style={{fontSize:12,color:T.gray500}}>{new Date(p.date).toLocaleDateString('bn-BD')}</div>
                  </div>
                  <div style={{display:'flex',gap:16,fontSize:13}}>
                    <span>📦 {p.totalItems}টি পণ্য</span>
                    <span>📋 {p.totalStock} একক</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // View single supplier
  if (viewSupplier) {
    const supProducts = products.filter(p => (p.company||'').toLowerCase() === (viewSupplier.name||'').toLowerCase());
    const supPurchases = getSupplierPurchases(viewSupplier.name);
    
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setViewSupplier(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>🏢 {viewSupplier.name}</span>
          {viewSupplier.code && <span style={{fontSize:12,color:T.teal,fontWeight:600,marginLeft:8}}>{viewSupplier.code}</span>}
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.teal}}>{supProducts.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট পণ্য</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.green}}>{supPurchases.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>পারচেজ সংখ্যা</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.orange}}>{supPurchases.reduce((s,p)=>s+p.totalStock,0)}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট একক</div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <button style={btn('primary')} onClick={()=>setShowPurchaseHistory(viewSupplier)}>📋 পারচেজ হিস্ট্রি</button>
            {!viewSupplier.isAuto && (
              <button style={btn()} onClick={()=>{setForm({...viewSupplier});setModal({mode:'edit',id:viewSupplier.id});}}>✏️ সম্পাদনা</button>
            )}
          </div>

          {/* Products List */}
          <div style={{...card,padding:0}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📦 পণ্য তালিকা</div>
            {supProducts.length === 0 ? (
              <div style={{padding:30,textAlign:'center',color:T.gray400}}>কোনো পণ্য নেই</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.tealLight}}>
                    <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পণ্য</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>স্টক</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>ক্রয়মূল্য</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>বিক্রয়মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {supProducts.map(p => (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{p.barcode}</div>
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600}}>{p.stock} {p.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:T.orange}}>{fmt(p.buyP)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:T.teal}}>{fmt(p.sellP)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  // View single category
  if (viewCategory) {
    const catProducts = products.filter(p => p.cat === viewCategory.name && p.name);
    
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setViewCategory(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📂 {viewCategory.name}</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:8}}>({viewCategory.company})</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.teal}}>{catProducts.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট পণ্য</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.orange}}>{catProducts.reduce((s,p)=>s+p.stock,0)}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট স্টক</div>
            </div>
          </div>

          {/* Products List */}
          <div style={{...card,padding:0}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📦 পণ্য তালিকা</div>
            {catProducts.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো পণ্য নেই</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  {catProducts.map(p => (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{p.barcode}</div>
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600}}>{p.stock} {p.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:T.orange}}>{fmt(p.buyP)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:T.teal}}>{fmt(p.sellP)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Sub tabs - Only Companies, Categories, and CSV Import */}
      <div style={{display:'flex',alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexShrink:0}}>
        <button onClick={()=>setActiveTab('companies')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='companies'?700:400,color:activeTab==='companies'?T.teal:T.gray500,borderBottom:activeTab==='companies'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          🏢 কোম্পানি ({allSuppliers.length})
        </button>
        <button onClick={()=>setActiveTab('categories')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='categories'?700:400,color:activeTab==='categories'?T.teal:T.gray500,borderBottom:activeTab==='categories'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📂 ক্যাটাগরি ({categories.length})
        </button>
        <button onClick={()=>setActiveTab('csv')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='csv'?700:400,color:activeTab==='csv'?T.teal:T.gray500,borderBottom:activeTab==='csv'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📥 CSV আমদানি
        </button>
        {/* Search and Add button - right aligned */}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',paddingRight:12}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} 
              placeholder={activeTab==='companies'?'কোম্পানি খুঁজুন...':'ক্যাটাগরি খুঁজুন...'}
              style={{...input,paddingLeft:32,padding:'6px 12px',fontSize:12}}/>
          </div>
          <button style={{...btn('primary'),padding:'6px 12px',fontSize:12}} onClick={()=>setModal({mode:'add'})}>
            {activeTab==='companies'?'🏢 নতুন কোম্পানি':'📂 ক্যাটাগরি যোগ করুন'}
          </button>
        </div>
      </div>

      <div style={{overflow:'auto',padding:12}}>

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div style={{...card,marginBottom:16,display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 180px)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:T.white,tableLayout:'fixed'}}>
              <thead>
                <tr style={{background:T.tealLight}}>
                  {['ক্রম','ক্যাটাগরির নাম','পণ্য সংখ্যা',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
            </table>
            <div style={{flex:1,overflow:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:T.white,tableLayout:'fixed'}}>
                <tbody>
                  {categories.length === 0 ? (
                    <tr><td colSpan={4} style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো ক্যাটাগরি পাওয়া যায়নি</td></tr>
                  ) : categories.filter(c => !search || (c.name||'').toLowerCase().includes(search.toLowerCase())).map((cat,i)=>(
                    <tr key={cat.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'10px 12px',fontSize:12,color:T.teal,fontWeight:600}}>{i+1}</td>
                      <td style={{padding:'10px 12px',fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.name}</td>
                      <td style={{padding:'10px 12px',fontSize:12,color:T.teal,fontWeight:600}}>{products.filter(p=>p.cat===cat.name).length}</td>
                      <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                        <button onClick={()=>setViewCategory(cat)} style={{...btn(),fontSize:11,padding:'4px 8px'}}>👁️</button>
                        <button onClick={()=>{setCatForm({name:cat.name});setModal({mode:'editCat',catName:cat.name,catId:cat.id});}} style={{...btn('ghost'),padding:'4px 6px'}}>✏️</button>
                        <button onClick={async ()=>{if(confirm('এই ক্যাটাগরি মুছে ফেলবেন?')){await upd.categories(categories.filter(c=>c.id!==cat.id));}}} style={{...btn('danger'),padding:'4px 6px'}}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSV IMPORT TAB */}
        {activeTab === 'csv' && (
          <div style={{...card,padding:24}}>
            <h3 style={{margin:'0 0 16px',fontSize:16}}>📥 CSV আমদানি করুন</h3>
            <input type="file" accept=".csv" onChange={handleSuppliersCsvImport} id="suppliersCsvInput" style={{display:'none'}} />
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              <label htmlFor="suppliersCsvInput" style={{...btn('primary'),cursor:'pointer',fontSize:14,padding:'10px 20px'}}>
                📁 CSV ফাইল নির্বাচন করুন
              </label>
              <button onClick={downloadSuppliersCSV} style={{...btn(),fontSize:14,padding:'10px 20px'}}>
                📥 ডেমো CSV ডাউনলোড
              </button>
            </div>
            <div style={{fontSize:13,color:T.gray600,lineHeight:1.8}}>
              <div style={{fontWeight:600,marginBottom:8}}>CSV কলাম (Header):</div>
              <code style={{background:T.gray50,padding:'8px 12px',borderRadius:8,display:'block',marginBottom:12}}>
                পণ্যের নাম, কোম্পানি কোড, কোম্পানি, ক্যাটাগরি, বারকোড, একক, ক্রয়মূল্য, বিক্রয়মূল্য, স্টক, মিনস্টক
              </code>
              <div style={{marginTop:12}}>
                <div style={{fontWeight:600,marginBottom:8}}>নিয়মাবলী:</div>
                <div>✅ কোম্পানি ও ক্যাটাগরি ডুপ্লিকেট হবে না</div>
                <div>✅ কোম্পানি কোড খালি রাখলে অটো তৈরি হবে</div>
                <div>📝 পণ্য যুক্ত করতে পারচেজ (ক্রয়) মেনু ব্যবহার করুন</div>
              </div>
            </div>
            {csvImportResult && (
              <div style={{marginTop:16,padding:16,background:T.tealLight,borderRadius:8}}>
                <div style={{fontWeight:600,color:T.teal,marginBottom:8}}>✅ সর্বশেষ আমদানি ফলাফল:</div>
                <div>🏢 নতুন কোম্পানি: {csvImportResult.companies}টি</div>
                <div>📂 নতুন ক্যাটাগরি: {csvImportResult.categories}টি</div>
                {csvImportResult.errors > 0 && (
                  <div style={{color:T.red,marginTop:8}}>⚠️ ত্রুটি: {csvImportResult.errors}টি</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* COMPANIES TAB */}
        {activeTab === 'companies' && (
          <div style={{...card,marginBottom:16,display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 180px)'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:T.white,tableLayout:'fixed'}}>
                <thead>
                  <tr style={{background:T.tealLight}}>
                    {['কোম্পানি কোড','কোম্পানির নাম','ফোন','ঠিকানা','পণ্য সংখ্যা',''].map((h,i)=>(
                      <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
              </table>
              <div style={{flex:1,overflow:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',background:T.white,tableLayout:'fixed'}}>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো কোম্পানি পাওয়া যায়নি</td></tr>
                    ) : filtered.map((s,i)=>(
                      <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                        <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{s.code||'-'}</td>
                        <td style={{padding:'10px 12px',fontWeight:600,fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</td>
                        <td style={{padding:'10px 12px',fontSize:12,color:T.gray600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.phone||'-'}</td>
                        <td style={{padding:'10px 12px',fontSize:12,color:T.gray600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.address||'-'}</td>
                        <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{getProductsCount(s.name)}</td>
                        <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                          <button onClick={()=>setViewSupplier(s)} style={{...btn(),fontSize:11,padding:'4px 8px'}}>👁️</button>
                          {!s.isAuto && (
                            <>
                              <button onClick={()=>{setForm({...s});setModal({mode:'edit',id:s.id});}} style={{...btn('ghost'),padding:'4px 6px'}}>✏️</button>
                              <button onClick={()=>del(s.id)} style={{...btn('danger'),padding:'4px 6px'}}>🗑️</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

      {/* Modal */}
      {modal && (
        <div style={{...overlay}} onClick={()=>{setShowCompanyDrop(false);setShowCatDrop(false);setShowCatCompanyDrop(false);setShowProductDrop(false);}} data-modal>
          <div style={{...card,width:activeTab==='products'?500:380,padding:24}} onClick={e=>{e.stopPropagation()}} data-modal>
            {/* Company Form */}
            {(modal.mode === 'add' || modal.mode === 'edit') && activeTab === 'companies' && (
              <>
                <h3 style={{margin:'0 0 16px'}}>{modal.mode === 'add' ? '🏢 নতুন কোম্পানি যোগ করুন' : '✏️ কোম্পানি সম্পাদনা করুন'}</h3>
                <div style={{marginBottom:12}}>
                  <label style={label}>🏢 কোম্পানির নাম *</label>
                  <input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="কোম্পানির নাম" style={input} autoFocus />
                </div>
                {modal.mode === 'add' && (
                  <div style={{marginBottom:12}}>
                    <label style={label}>🔢 কোম্পানি আইডি <span style={{fontSize:11,color:T.gray500}}>(খালি রাখলে অটো হবে)</span></label>
                    <input value={form.code||''} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder={`যেমন: C-${String(suppliers.length + 1).padStart(5, '0')}`} style={input} />
                  </div>
                )}
                <div style={{marginBottom:12}}>
                  <label style={label}>📱 ফোন নম্বর</label>
                  <input value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="মোবাইল নম্বর" style={input} />
                </div>
                <div style={{marginBottom:16}}>
                  <label style={label}>📍 ঠিকানা</label>
                  <input value={form.address||''} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="ঠিকানা" style={input} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModal(null)} style={{...btn(),flex:1}}>✕ বন্ধ করুন</button>
                  <button onClick={saveCompany} style={{...btn('primary'),flex:1}} disabled={!form.name?.trim()}>💾 সংরক্ষণ করুন</button>
                </div>
                {modal.mode === 'add' && (
                  <div style={{marginTop:12,fontSize:11,color:T.gray500,textAlign:'center'}}>
                    💡 সংরক্ষণের পর আবার নতুন কোম্পানি যোগ করতে পারবেন
                  </div>
                )}
              </>
            )}

            {/* Category Form */}
            {(modal.mode === 'add' || modal.mode === 'editCat') && activeTab === 'categories' && (
              <>
                <h3 style={{margin:'0 0 16px'}}>{modal.mode === 'add' ? '📂 নতুন ক্যাটাগরি যোগ করুন' : '✏️ ক্যাটাগরি সম্পাদনা করুন'}</h3>
                <div style={{marginBottom:16}}>
                  <label style={label}>📂 ক্যাটাগরির নাম *</label>
                  <input value={catForm.name||''} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} placeholder="ক্যাটাগরির নাম" style={input} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModal(null)} style={{...btn(),flex:1}}>✕ বন্ধ করুন</button>
                  <button onClick={saveCategory} style={{...btn('primary'),flex:1}} disabled={!catForm.name?.trim()}>💾 সংরক্ষণ করুন</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   NEW PRODUCT SCREEN
═══════════════════════════════════════════ */
function NewProductScreen({products, suppliers, categories, purchases, upd}) {
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [supplierQ, setSupplierQ] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [barcodeVal, setBarcodeVal] = useState('');
  const [form, setForm] = useState({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
  const [csvData, setCsvData] = useState([]);

  const card = {background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'};
  const input = {
    width:'100%',padding:'10px 12px',
    border:`1.5px solid ${T.gray200}`,
    borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',
    background:T.gray50,
    transition:'all 0.2s ease',
    color:T.gray800
  };
  const inputFocus = {
    borderColor:T.teal,
    background:T.white,
    boxShadow:'0 0 0 3px rgba(0,150,136,0.1)'
  };
  const label = {display:'block',marginBottom:6,fontWeight:600,fontSize:13,color:T.gray600};
  const btn = (type='ghost',size='md') => {
    const base = {border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:size==='sm'?11:13,transition:'all 0.2s'};
    const colors = {
      ghost: {background:T.gray100,color:T.gray700},
      primary: {background:T.teal,color:T.white},
      danger: {background:T.redLight,color:T.red}
    };
    const sizes = {sm:{padding:'4px 8px'},md:{padding:'8px 16px'},lg:{padding:'12px 24px'}};
    return {...base,...colors[type],...sizes[size]};
  };
  const fmt = (v) => '৳' + (v||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});
  const fmtN = (v) => (v||0).toLocaleString('bn-BD');

  // Get unique companies from suppliers and products
  const uniqueCompanies = [...new Set([
    ...suppliers.map(s => s.name).filter(Boolean),
    ...products.map(p => p.company).filter(Boolean)
  ])].sort();

  // Get unique categories
  const uniqueCategories = [...new Set([
    ...categories.map(c => c.name),
    ...products.map(p => p.cat).filter(Boolean)
  ])].sort();

  // Filter companies for dropdown
  const filteredCompanies = uniqueCompanies.filter(c => 
    !supplierQ || (c||'').toLowerCase().includes((supplierQ||'').toLowerCase())
  );

  // Filter categories for dropdown
  const filteredCategories = uniqueCategories.filter(c => 
    !form.cat || (c||'').toLowerCase().includes((form.cat||'').toLowerCase())
  );

  // Handle CSV Import
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = [];
      const errors = [];
      
      const existingCompanies = [
        ...suppliers.map(s => (s.name||'').toLowerCase()),
        ...products.map(p => (p.company||'').toLowerCase()).filter(Boolean)
      ];
      const existingCategories = [
        ...new Set([
          ...products.map(p => (p.cat||'').toLowerCase()).filter(Boolean),
          ...categories.map(c => (c.name||'').toLowerCase()).filter(Boolean)
        ])
      ];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        
        const csvCompany = (row['কোম্পানি'] || row['company'] || '').trim();
        const csvCategory = (row['ক্যাটাগরি'] || row['category'] || '').trim();
        
        if (csvCompany && !existingCompanies.includes(csvCompany.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCompany}" কোম্পানি ডাটাবেজে নেই`);
          continue;
        }
        
        if (csvCategory && !existingCategories.includes(csvCategory.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCategory}" ক্যাটাগরি ডাটাবেজে নেই`);
          continue;
        }
        
        const item = {
          id: genId(),
          name: row['পণ্যের নাম'] || row['নাম'] || row['name'] || '',
          barcode: row['বারকোড'] || row['barcode'] || '',
          company: csvCompany,
          cat: csvCategory,
          unit: row['একক'] || row['unit'] || 'পিস',
          buyP: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || row['buy'] || 0),
          sellP: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || row['sell'] || 0),
          stock: parseFloat(row['স্টক'] || row['stock'] || 0),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || 5)
        };
        
        if (item.name) items.push(item);
      }
      
      if (errors.length > 0) {
        alert(`কিছু সমস্যা হয়েছে:\n${errors.slice(0,5).join('\n')}${errors.length > 5 ? '\n...এবং আরও ' + (errors.length-5) + 'টি' : ''}`);
      }
      
      if (items.length > 0) {
        setCsvData(items);
        setPurchaseItems(prev => [...prev, ...items]);
        alert(`✅ ${items.length}টি পণ্য যোগ হয়েছে!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download demo CSV
  const downloadDemoCSV = () => {
    const csv = 'পণ্যের নাম,কোম্পানি কোড,কোম্পানি,ক্যাটাগরি,বারকোড,একক,ক্রয়মূল্য,বিক্রয়মূল্য,স্টক,মিনস্টক\nমিনিকেট চাল,M001,মিনিকেট,খাদ্যপণ্য,001,কেজি,55,65,100,10\nব্রিলিয়ান্ট চাল,B001,ব্রিলিয়ান্ট,খাদ্যপণ্য,002,কেজি,52,62,80,10';
    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'পণ্যের_তালিকা.csv';
    a.click();
  };

  // Add item to purchase list
  const addItem = () => {
    if (!form.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    if (!form.company?.trim()) { alert('কোম্পানির নাম দিন'); return; }
    
    const item = {
      id: genId(),
      name: form.name,
      barcode: form.barcode || '',
      company: form.company,
      cat: form.cat || '',
      unit: form.unit || 'পিস',
      buyP: +form.buyP || 0,
      sellP: +form.sellP || 0,
      stock: +form.stock || 0,
      minStock: +form.minStock || 5
    };
    setPurchaseItems([...purchaseItems, item]);
    setForm({name:'',barcode:'',company:form.company,cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setBarcodeVal('');
  };

  // Remove item
  const removeItem = (id) => {
    setPurchaseItems(purchaseItems.filter(i => i.id !== id));
  };

  // Save purchase
  const savePurchase = async () => {
    if (purchaseItems.length === 0) { alert('কমপক্ষে একটি পণ্য যোগ করুন'); return; }
    
    const savedCount = purchaseItems.length;
    const purchaseId = `PO-${Date.now().toString().slice(-8)}`;
    
    const purchase = {
      id: purchaseId,
      date: new Date().toISOString(),
      supplier: form.company || 'সাধারণ',
      items: purchaseItems,
      totalItems: purchaseItems.length,
      totalStock: purchaseItems.reduce((s,i) => s + i.stock, 0)
    };

    const updatedProducts = [...products];
    const newProductsToAdd = [];
    
    for (const item of purchaseItems) {
      const existingIndex = updatedProducts.findIndex(
        p => p.company === item.company && p.barcode === item.barcode && p.barcode !== ''
      );
      
      if (existingIndex !== -1) {
        updatedProducts[existingIndex] = {
          ...updatedProducts[existingIndex],
          stock: (updatedProducts[existingIndex].stock || 0) + (item.stock || 0),
          buyP: item.buyP || updatedProducts[existingIndex].buyP,
          sellP: item.sellP || updatedProducts[existingIndex].sellP
        };
      } else {
        newProductsToAdd.push({ ...item, id: genId() });
      }
    }
    
    let newSupplierArr = null;
    if (form.company && !suppliers.find(s => s.name === form.company)) {
      const newSupplier = { id: genId(), name: form.company, phone: '', address: '' };
      newSupplierArr = [...suppliers, newSupplier];
    }

    const promises = [];
    if (newSupplierArr) promises.push(upd.suppliers(newSupplierArr));
    promises.push(upd.products([...updatedProducts, ...newProductsToAdd]));
    promises.push(upd.purchases([...purchases, purchase]));

    await Promise.all(promises);
    alert(`✅ ${savedCount}টি পণ্য সংরক্ষিত হয়েছে!\nপারচেজ আইডি: ${purchaseId}`);
    setPurchaseItems([]);
    setForm({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setSupplierQ('');
  };

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:T.gray50}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        <span style={{fontWeight:700,fontSize:15}}>📦 নতুন পণ্য সংরক্ষণ</span>
        <span style={{fontSize:12,color:T.gray500,marginLeft:'auto'}}>{purchaseItems.length}টি পণ্য যোগ হয়েছে</span>
        {purchaseItems.length > 0 && (
          <button onClick={savePurchase} style={{...btn('primary'),padding:'8px 16px'}}>💾 সব সংরক্ষণ করুন</button>
        )}
      </div>
      
      <div style={{display:'flex',flex:1,overflow:'hidden'}}>
        {/* Left: Form */}
        <div style={{flex:1,padding:16,overflow:'auto',borderRight:`1px solid ${T.gray200}`,background:T.white}}>
          
          {/* CSV Import */}
          <div style={{...card,padding:16,marginBottom:16,background:T.tealLight,border:`1px dashed ${T.teal}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <h3 style={{margin:0,fontSize:14,color:T.teal}}>📥 CSV আমদানি করুন</h3>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <input type="file" accept=".csv" onChange={handleCsvImport} id="newProductCsvInput" style={{display:'none'}} />
              <label htmlFor="newProductCsvInput" style={{...btn('primary'),cursor:'pointer',fontSize:13,padding:'10px 20px'}}>
                📁 CSV আপলোড করুন
              </label>
              <button onClick={downloadDemoCSV} style={{...btn('ghost'),fontSize:13,padding:'10px 20px'}}>
                📥 ডেমো CSV
              </button>
            </div>
            <div style={{fontSize:11,color:T.gray600,marginTop:8}}>
              💡 CSV ফাইলে কোম্পানি ও ক্যাটাগরি ডাটাবেজে থাকতে হবে
            </div>
            {csvData.length > 0 && (
              <div style={{marginTop:8,fontSize:12,color:T.teal,fontWeight:600}}>
                ✓ {csvData.length}টি পণ্য CSV থেকে যোগ হয়েছে
              </div>
            )}
          </div>
          
          <div style={{...card,padding:20}}>
            <h3 style={{margin:'0 0 20px',fontSize:16,color:T.teal,fontWeight:700}}>পণ্য যোগ করুন</h3>
            
            {/* Company */}
            <div style={{marginBottom:16, position:'relative'}}>
              <label style={label}>🏢 সরবরাহকারী/কোম্পানি *</label>
              <div style={{display:'flex',gap:8}}>
                <input 
                  value={supplierQ} 
                  onChange={e=>{setSupplierQ(e.target.value);setForm(f=>({...f,company:e.target.value}));setShowCompanyList(true);}}
                  onFocus={()=>setShowCompanyList(true)}
                  placeholder="কোম্পানির নাম লিখুন..."
                  style={{...input,flex:1}} 
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
                <button type="button" onClick={()=>setShowCompanyList(!showCompanyList)} style={{...btn('ghost'),padding:'6px 12px'}}>▼</button>
              </div>
              {showCompanyList && (
                <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                  {filteredCompanies.map((c,i)=>(
                    <div key={i} onClick={()=>{setSupplierQ(c);setForm(f=>({...f,company:c}));setShowCompanyList(false);}}
                      style={{padding:'10px 14px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>{c}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div style={{marginBottom:16, position:'relative'}}>
              <label style={label}>📂 ক্যাটাগরি</label>
              <div style={{display:'flex',gap:8}}>
                <input 
                  value={form.cat} 
                  onChange={e=>{setForm(f=>({...f,cat:e.target.value}));setShowCategoryList(true);}}
                  onFocus={()=>setShowCategoryList(true)}
                  placeholder="ক্যাটাগরি নির্বাচন করুন..."
                  style={{...input,flex:1}} 
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
                <button type="button" onClick={()=>setShowCategoryList(!showCategoryList)} style={{...btn('ghost'),padding:'6px 12px'}}>▼</button>
              </div>
              {showCategoryList && (
                <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                  {filteredCategories.map((c,i)=>(
                    <div key={i} onClick={()=>{setForm(f=>({...f,cat:c}));setShowCategoryList(false);}}
                      style={{padding:'10px 14px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>{c}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Name */}
            <div style={{marginBottom:16}}>
              <label style={label}>📦 পণ্যের নাম *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="পণ্যের নাম লিখুন" 
                style={input} 
                onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
            </div>

            {/* Barcode */}
            <div style={{marginBottom:16}}>
              <label style={label}>🔢 বারকোড</label>
              <input value={barcodeVal} onChange={e=>{setBarcodeVal(e.target.value);setForm(f=>({...f,barcode:e.target.value}))}} placeholder="বারকোড নম্বর" 
                style={input} 
                onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
            </div>

            {/* Unit & Stock */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div>
                <label style={label}>📥 একক</label>
                <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} style={{...input,appearance:'none',cursor:'pointer',backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,backgroundRepeat:'no-repeat',backgroundPosition:'right 12px center',paddingRight:36}}
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})}>
                  <option value="পিস">পিস</option>
                  <option value="কেজি">কেজি</option>
                  <option value="লিটার">লিটার</option>
                  <option value="বাক্স">বাক্স</option>
                  <option value="গ্রাম">গ্রাম</option>
                  <option value="মিটার">মিটার</option>
                  <option value="ডজন">ডজন</option>
                  <option value="বোতল">বোতল</option>
                  <option value="সেট">সেট</option>
                </select>
              </div>
              <div>
                <label style={label}>📥 স্টক</label>
                <input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="0" 
                  style={input} 
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
              </div>
            </div>

            {/* Prices */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div>
                <label style={label}>💰 ক্রয়মূল্য</label>
                <input type="number" value={form.buyP} onChange={e=>setForm(f=>({...f,buyP:e.target.value}))} placeholder="0" 
                  style={input} 
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
              </div>
              <div>
                <label style={label}>💵 বিক্রয়মূল্য</label>
                <input type="number" value={form.sellP} onChange={e=>setForm(f=>({...f,sellP:e.target.value}))} placeholder="0" 
                  style={input} 
                  onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                  onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
              </div>
            </div>

            {/* Min Stock */}
            <div style={{marginBottom:20}}>
              <label style={label}>⚠️ মিন স্টক</label>
              <input type="number" value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} placeholder="5" 
                style={input} 
                onFocus={(e) => Object.assign(e.target.style, inputFocus)}
                onBlur={(e) => Object.assign(e.target.style, {borderColor: T.gray200, background: T.gray50})} />
            </div>

            {/* Add Button */}
            <button onClick={addItem} style={{...btn('primary'),width:'100%',padding:'14px',fontSize:14,borderRadius:10}}>
              ➕ পণ্য তালিকায় যোগ করুন
            </button>
          </div>
        </div>

        {/* Right: Purchase List */}
        <div style={{flex:1,padding:16,overflow:'auto',display:'flex',flexDirection:'column',gap:12}}>
          <h3 style={{margin:0,fontSize:14,fontWeight:700}}>📋 পণ্য তালিকা ({purchaseItems.length})</h3>
          
          {purchaseItems.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:T.gray400,background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`}}>
              কোনো পণ্য যোগ হয়নি<br/>
              <span style={{fontSize:12}}>উপরের ফর্ম পূরণ করে পণ্য যোগ করুন</span>
            </div>
          ) : (
            purchaseItems.map((item,i) => (
              <div key={item.id} style={{...card,padding:12,display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{item.name}</div>
                  <div style={{fontSize:12,color:T.gray500}}>
                    🏢 {item.company} • 📂 {item.cat || '-'}
                  </div>
                  <div style={{fontSize:12,color:T.gray500,display:'flex',gap:8,marginTop:4}}>
                    <span>📦 {item.stock} {item.unit}</span>
                    <span>💰 {fmt(item.buyP)}</span>
                    <span>💵 {fmt(item.sellP)}</span>
                  </div>
                  {item.barcode && <div style={{fontSize:11,color:T.gray400,fontFamily:'monospace',marginTop:2}}>🔢 {item.barcode}</div>}
                </div>
                <button onClick={()=>removeItem(item.id)} style={{...btn('danger'),padding:'6px 10px',marginLeft:8}}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CUSTOMERS SCREEN
═══════════════════════════════════════════ */
function CustomersScreen({customers, sales, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [viewId, setViewId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmt, setPayAmt] = useState('');

  const filtered = customers.filter(c=>!search||((c.name||'')+(c.phone||'')).includes(search));

  const save = async () => {
    if(!form.name?.trim()) { alert('নাম দিন'); return; }
    const row = {...form,credit:+form.credit||0};
    if(modal.mode==='add') await upd.customers([...customers,{...row,id:genId()}]);
    else await upd.customers(customers.map(c=>c.id===modal.id?{...row,id:modal.id}:c));
    setModal(null);
  };

  const del = async (id) => { if(confirm('মুছে ফেলবেন?')) await upd.customers(customers.filter(c=>c.id!==id)); };

  const recordPayment = async () => {
    const amt = parseFloat(payAmt)||0;
    if (amt<=0) { alert('পরিমাণ দিন'); return; }
    await upd.customers(customers.map(c=>c.id===payModal.id ? {...c,credit:Math.max(0,(c.credit||0)-amt)} : c));
    setPayModal(null); setPayAmt('');
  };

  const exportCSV = () => {
    const rows = [['নাম','ফোন','ঠিকানা','বাকি'],...customers.map(c=>[c.name,c.phone||'',c.address||'',c.credit||0])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    a.download='customers.csv'; a.click();
  };

  const viewCust = viewId ? customers.find(c=>c.id===viewId) : null;
  const custSales = viewId ? sales.filter(s=>s.custId===viewId) : [];
  const totalCreditAll = customers.reduce((s,c)=>s+(c.credit||0),0);

  if (viewCust) return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
        <button style={btn()} onClick={()=>setViewId(null)}>← ফিরে যান</button>
        <div style={{fontSize:15,fontWeight:700}}>{viewCust.name} — লেনদেন ইতিহাস</div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:12}}>
        <div style={{...card,marginBottom:12,display:'flex',gap:24,flexWrap:'wrap'}}>
          <div><div style={label}>নাম</div><div style={{fontWeight:700,fontSize:16}}>{viewCust.name}</div></div>
          <div><div style={label}>ফোন</div><div>{viewCust.phone||'-'}</div></div>
          <div><div style={label}>ঠিকানা</div><div>{viewCust.address||'-'}</div></div>
          <div>
            <div style={label}>মোট বাকি</div>
            <div style={{fontWeight:800,fontSize:22,color:viewCust.credit>0?T.red:T.green}}>{fmt(viewCust.credit||0)}</div>
          </div>
          {viewCust.credit>0 && (
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button style={btn('success')} onClick={()=>{setPayModal(viewCust);setPayAmt('');}}>💵 পেমেন্ট নিন</button>
            </div>
          )}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
          <thead>
            <tr style={{background:T.tealLight}}>
              {['তারিখ','বিল নং','পণ্য','মোট','পরিশোধ','বাকি'].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {custSales.length===0 ? <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:T.gray400}}>কোনো লেনদেন নেই</td></tr>
            : [...custSales].reverse().map((s,i)=>(
              <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                <td style={{padding:'10px 12px',fontSize:13}}>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                <td style={{padding:'10px 12px',fontSize:12,fontFamily:'monospace',color:T.teal}}>#{s.id.slice(-8).toUpperCase()}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{(s.items||[]).length}টি পণ্য</td>
                <td style={{padding:'10px 12px',fontWeight:600}}>{fmt(s.total)}</td>
                <td style={{padding:'10px 12px',color:T.green,fontWeight:600}}>{fmt(s.paid)}</td>
                <td style={{padding:'10px 12px',fontWeight:700,color:s.due>0?T.red:T.green}}>{fmt(s.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payModal && (
        <Modal onClose={()=>setPayModal(null)} title={`${payModal.name} — পেমেন্ট গ্রহণ`} width={360}>
          <div style={{marginBottom:12,padding:'10px 14px',background:T.redLight,borderRadius:8,fontSize:14,color:T.red,fontWeight:600}}>
            বর্তমান বাকি: {fmt(payModal.credit)}
          </div>
          <label style={label}>পরিশোধের পরিমাণ (৳)</label>
          <input value={payAmt} onChange={e=>setPayAmt(e.target.value)} type="number" min="0" max={payModal.credit} style={input} autoFocus/>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>setPayModal(null)} style={btn()}>বাতিল</button>
            <button onClick={recordPayment} style={btn('success')}>✓ পেমেন্ট নিন</button>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="নাম বা ফোন নম্বর..." style={{...input,paddingLeft:32}}/>
        </div>
        <button style={btn('primary')} onClick={()=>{setForm({name:'',phone:'',address:'',credit:0});setModal({mode:'add'});}}>+ কাস্টমার যোগ</button>
        <button style={btn()} onClick={exportCSV}>📤 CSV রপ্তানি</button>
        {totalCreditAll>0 && <span style={{fontSize:12,color:T.red,fontWeight:600}}>মোট বাকি: {fmt(totalCreditAll)}</span>}
      </div>
      <div style={{flex:1,overflow:'auto',padding:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:10}}>
          {filtered.map(c=>(
            <div key={c.id} style={{...card,cursor:'pointer',transition:'box-shadow 0.15s'}} onClick={()=>setViewId(c.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{c.name}</div>
                  <div style={{fontSize:13,color:T.gray600}}>📞 {c.phone||'ফোন নেই'}</div>
                  {c.address && <div style={{fontSize:12,color:T.gray400,marginTop:2}}>📍 {c.address}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  {(c.credit||0)>0 ? (
                    <div>
                      <div style={{fontSize:11,color:T.red,fontWeight:700}}>বাকি আছে</div>
                      <div style={{fontSize:18,fontWeight:800,color:T.red}}>{fmt(c.credit)}</div>
                    </div>
                  ) : (
                    <div style={{fontSize:12,color:T.green,fontWeight:600}}>✓ কোনো বাকি নেই</div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                <button style={{...btn('ghost','sm'),flex:1,justifyContent:'center'}} onClick={e=>{e.stopPropagation();setViewId(c.id);}}>📋 ইতিহাস</button>
                <button style={btn('ghost','sm')} onClick={e=>{e.stopPropagation();setForm({...c});setModal({mode:'edit',id:c.id});}}>✏️</button>
                <button style={btn('danger','sm')} onClick={e=>{e.stopPropagation();del(c.id);}}>🗑️</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div style={{textAlign:'center',padding:'60px 20px',color:T.gray400,gridColumn:'1/-1'}}><div style={{fontSize:44,marginBottom:8}}>👥</div><div>কোনো কাস্টমার নেই</div></div>}
        </div>
      </div>

      {modal && (
        <Modal onClose={()=>setModal(null)} title={modal.mode==='add'?'নতুন কাস্টমার':'কাস্টমার সম্পাদনা'} width={380}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{k:'name',l:'নাম *'},{k:'phone',l:'ফোন নম্বর'},{k:'address',l:'ঠিকানা'},{k:'credit',l:'প্রাথমিক বাকি (৳)',t:'number'}].map(f=>(
              <div key={f.k}>
                <label style={label}>{f.l}</label>
                <input value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} type={f.t||'text'} style={input}/>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>setModal(null)} style={btn()}>বাতিল</button>
            <button onClick={save} style={btn('primary')}>💾 সংরক্ষণ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   INVENTORY SCREEN
═══════════════════════════════════════════ */
function InventoryScreen({products, suppliers, productHistory, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('add');
  const [adjNote, setAdjNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [invTab, setInvTab] = useState('list'); // list, history
  const [stockFilter, setStockFilter] = useState('all'); // all, low, proper, out
  const [filterLoading, setFilterLoading] = useState(false);

  // Loading effect
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [products]);
  
  // Filter loading effect
  useEffect(() => {
    if (stockFilter !== 'all') {
      setFilterLoading(true);
      const timer = setTimeout(() => setFilterLoading(false), 200);
      return () => clearTimeout(timer);
    }
  }, [stockFilter]);

  const realProducts = products.filter(p=>!p.name?.includes('(ক্যাটাগরি)'));
  const filtered = realProducts
    .filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase()))
    .filter(p=>{
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= p.minStock;
      if (stockFilter === 'proper') return p.stock > p.minStock;
      if (stockFilter === 'out') return p.stock <= 0;
      return true;
    })
    .sort((a, b) => {
      // Out of stock first (stock <= 0)
      if (a.stock <= 0 && b.stock > 0) return -1;
      if (b.stock <= 0 && a.stock > 0) return 1;
      // Low stock second (stock > 0 && stock <= minStock)
      const aLow = a.stock > 0 && a.stock <= a.minStock;
      const bLow = b.stock > 0 && b.stock <= b.minStock;
      if (aLow && !bLow) return -1;
      if (bLow && !aLow) return 1;
      // Sort by stock level ascending (lowest first)
      return a.stock - b.stock;
    });
  const lowStock = realProducts.filter(p=>p.stock>0&&p.stock<=p.minStock);
  const outOfStock = realProducts.filter(p=>p.stock<=0);
  const properStock = realProducts.filter(p=>p.stock>p.minStock);
  const totalValue = realProducts.reduce((s,p)=>s+p.sellP*p.stock,0);
  
  // Filter only stock change history (exclude price changes)
  const stockHistory = productHistory.filter(h => h.type === 'stock');

  const adjust = async () => {
    const qty = parseInt(adjQty)||0;
    if(qty<=0) { alert('পরিমাণ দিন'); return; }
    const newS = adjType==='add' ? modal.stock+qty : Math.max(0,modal.stock-qty);
    await upd.products(products.map(p=>p.id===modal.id?{...p,stock:newS}:p));
    setModal(null); setAdjQty(''); setAdjNote('');
  };

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      {/* Sub-tabs: List / History */}
      <div style={{display:'flex',alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexShrink:0}}>
        <button onClick={()=>setInvTab('list')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:invTab==='list'?700:400,color:invTab==='list'?T.teal:T.gray500,borderBottom:invTab==='list'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📦 স্টক তালিকা
        </button>
        <button onClick={()=>setInvTab('history')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:invTab==='history'?700:400,color:invTab==='history'?T.teal:T.gray500,borderBottom:invTab==='history'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📜 হিস্ট্রি ({stockHistory.length})
        </button>
      </div>

      {/* History Tab Content */}
      {invTab === 'history' && (
        <div style={{flex:1,overflow:'auto',padding:12}}>
          <div style={{...card,overflow:'hidden'}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📜 স্টক পরিবর্তনের ইতিহাস</div>
            {stockHistory.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো স্টক পরিবর্তন নেই</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.tealLight}}>
                    <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>তারিখ ও সময়</th>
                    <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পণ্যের নাম</th>
                    <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পরিবর্তন</th>
                    <th style={{padding:'10px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>পুরাতন স্টক</th>
                    <th style={{padding:'10px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>নতুন স্টক</th>
                    <th style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>ব্যবহারকারী</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stockHistory].reverse().map((h,i)=>(
                    <tr key={h.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>
                        {new Date(h.timestamp).toLocaleString('bn-BD')}
                      </td>
                      <td style={{padding:'10px 12px',fontWeight:600,fontSize:13}}>{h.productName}</td>
                      <td style={{padding:'10px 12px',fontSize:12}}>
                        <span style={{
                          background: h.newValue > h.oldValue ? T.greenLight : T.redLight,
                          color: h.newValue > h.oldValue ? T.green : T.red,
                          padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:600
                        }}>
                          {h.newValue > h.oldValue ? '+' : ''}{h.newValue - h.oldValue}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontWeight:600,color:T.red}}>
                        {h.oldValue}
                      </td>
                      <td style={{padding:'10px 12px',textAlign:'right',fontWeight:700,color:T.green}}>
                        {h.newValue}
                      </td>
                      <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>
                        <div style={{fontWeight:600}}>{h.user}</div>
                        {h.userEmail && <div style={{fontSize:11,color:T.gray400}}>{h.userEmail}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* List Tab Content */}
      {invTab === 'list' && (
      <>
      <div style={{padding:'8px 12px',display:'flex',gap:6,alignItems:'center',background:T.gray50,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        {filterLoading ? (
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:T.white,borderRadius:6,border:`1px solid ${T.gray200}`}}>
            <div style={{
              width:14,height:14,border:'2px solid #E0E0E0',borderTop:`2px solid ${T.teal}`,
              borderRadius:'50%',animation:'spin 0.8s linear infinite'
            }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <span style={{fontSize:11,color:T.gray500}}>লোড হচ্ছে...</span>
          </div>
        ) : (
          <>
            <button onClick={()=>{setStockFilter('all');setSearch('');}} style={{
              border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11,
              padding:'6px 12px',transition:'all 0.15s',
              background:stockFilter==='all'?'#00897b':'#fff',
              color:stockFilter==='all'?'#fff':'#64748b',
              border:stockFilter==='all'?'1px solid #00897b':`1px solid ${T.gray200}`,
            }}>
              সকল <span style={{opacity:0.7}}>({realProducts.length})</span>
            </button>
            <button onClick={()=>{setStockFilter(stockFilter==='proper'?'all':'proper');setSearch('');}} style={{
              border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11,
              padding:'6px 12px',transition:'all 0.15s',
              background:stockFilter==='proper'?'#16A34A':'#fff',
              color:stockFilter==='proper'?'#fff':'#64748b',
              border:stockFilter==='proper'?'1px solid #16A34A':`1px solid ${T.gray200}`,
            }}>
              ঠিক আছে <span style={{opacity:0.7}}>({properStock.length})</span>
            </button>
            <button onClick={()=>{setStockFilter(stockFilter==='low'?'all':'low');setSearch('');}} style={{
              border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11,
              padding:'6px 12px',transition:'all 0.15s',
              background:stockFilter==='low'?'#EA580C':'#fff',
              color:stockFilter==='low'?'#fff':'#64748b',
              border:stockFilter==='low'?'1px solid #EA580C':`1px solid ${T.gray200}`,
            }}>
              কম <span style={{opacity:0.7}}>({lowStock.length})</span>
            </button>
            <button onClick={()=>{setStockFilter(stockFilter==='out'?'all':'out');setSearch('');}} style={{
              border:'none',borderRadius:6,cursor:'pointer',fontWeight:600,fontSize:11,
              padding:'6px 12px',transition:'all 0.15s',
              background:stockFilter==='out'?'#DC2626':'#fff',
              color:stockFilter==='out'?'#fff':'#64748b',
              border:stockFilter==='out'?'1px solid #DC2626':`1px solid ${T.gray200}`,
            }}>
              শেষ <span style={{opacity:0.7}}>({outOfStock.length})</span>
            </button>
          </>
        )}
        <div style={{position:'relative',flex:'1 1 180px'}}>
          <span style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',color:T.gray400,fontSize:12}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{...input,paddingLeft:28,height:32,fontSize:11,borderRadius:6}}/>
        </div>
        <button style={btn('ghost')} onClick={()=>{
          const printFiltered = filtered.length > 0 ? filtered : realProducts;
          const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>স্টক তালিকা</title><style>
@page { size: A4 landscape; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Tiro Bangla',Arial,sans-serif; padding:10px; font-size:11px; }
.header { text-align:center; margin-bottom:15px; border-bottom:2px solid #00897b; padding-bottom:10px; }
.header h1 { color:#00897b; font-size:20px; margin-bottom:4px; }
.header p { color:#666; font-size:11px; }
.summary { display:flex; justify-content:center; gap:20px; margin-bottom:15px; }
.summary-item { padding:8px 16px; border-radius:8px; font-size:12px; }
.summary-item.green { background:#e8f5e9; color:#2e7d32; }
.summary-item.red { background:#ffebee; color:#c62828; }
.summary-item.orange { background:#fff3e0; color:#ef6c00; }
.summary-item.blue { background:#e0f7fa; color:#00897b; }
table { width:100%; border-collapse:collapse; }
th { background:#e0f7f0; border:1px solid #b2dfdb; padding:6px 5px; text-align:left; font-size:10px; color:#00897b; font-weight:700; }
td { border:1px solid #e0e0e0; padding:6px 5px; font-size:11px; }
tr:nth-child(even) { background:#fafafa; }
.footer { margin-top:15px; text-align:center; color:#999; font-size:10px; }
</style></head><body>
<div class="header"><h1>🏭 স্টক তালিকা</h1><p>${new Date().toLocaleDateString('bn-BD')}</p></div>
<div class="summary">
  <div class="summary-item blue">মোট পণ্য: ${realProducts.length}টি</div>
  <div class="summary-item green">স্টক আছে: ${realProducts.filter(p=>p.stock>0).length}টি</div>
  <div class="summary-item orange">কম স্টক: ${lowStock.length}টি</div>
  <div class="summary-item red">স্টক শেষ: ${outOfStock.length}টি</div>
  <div class="summary-item blue">মোট মূল্য: ৳${totalValue.toLocaleString()}</div>
</div>
<table><thead><tr><th>কোম্পানি কোড</th><th>পণ্যের নাম</th><th>কোম্পানি</th><th>ক্যাটাগরি</th><th>স্টক</th><th>একক</th><th>মিন স্টক</th><th>বিক্রয়মূল্য</th><th>স্টক মূল্য</th><th>অবস্থা</th></tr></thead><tbody>
${printFiltered.map(p => {
  const st = p.stock<=0?'শেষ':p.stock<=p.minStock?'কম':'পর্যাপ্ত';
  const stColor = p.stock<=0?'#c62828':p.stock<=p.minStock?'#ef6c00':'#2e7d32';
  const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'-';
  return `<tr><td>${supCode}</td><td>${p.name}</td><td>${p.company||'-'}</td><td>${p.cat||'-'}</td><td style="font-weight:700;color:${stColor}">${p.stock}</td><td>${p.unit}</td><td>${p.minStock}</td><td>৳${p.sellP.toLocaleString()}</td><td>৳${(p.sellP*p.stock).toLocaleString()}</td><td style="color:${stColor};font-weight:600">${st}</td></tr>`;
}).join('')}
</tbody></table>
<div class="footer">প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')}</div>
</body></html>`;
          const win = window.open('', '_blank', 'width=1000,height=600,left=100,top=100');
          win.document.open();
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => { if (!win.closed) { win.print(); } }, 250);
        }}>🖨️ প্রিন্ট</button>
        <div style={{fontSize:12,color:T.gray600}}>স্টক মূল্য: <strong style={{color:T.teal}}>{fmt(totalValue)}</strong></div>
      </div>

      {(lowStock.length>0||outOfStock.length>0) && (
        <div style={{padding:'8px 12px',display:'flex',gap:8,flexWrap:'wrap',borderBottom:`1px solid ${T.gray200}`,background:T.amberLight}}>
          {outOfStock.length>0 && (
            <span style={{fontSize:12,color:T.red,fontWeight:600}}>🚨 স্টক শেষ ({outOfStock.length}টি): {outOfStock.map(p=>p.name).join(', ')}</span>
          )}
          {lowStock.length>0 && (
            <span style={{fontSize:12,color:T.amber,fontWeight:600}}>⚠️ কম স্টক ({lowStock.length}টি): {lowStock.map(p=>p.name).join(', ')}</span>
          )}
        </div>
      )}

      <div style={{flex:1,overflow:'auto',padding:12}}>
        {loading ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'80px 20px',gap:16}}>
            <div style={{
              width:48,height:48,border:'4px solid #E0E0E0',borderTop:'4px solid #00897b',
              borderRadius:'50%',animation:'spin 1s linear infinite'
            }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{fontSize:14,color:T.gray500}}>স্টক তালিকা লোড হচ্ছে...</div>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
            <thead>
              <tr style={{background:T.tealLight}}>
                {['কোম্পানি কোড','পণ্যের নাম','কোম্পানি','ক্যাটাগরি','স্টক','একক','মিনস্টক','স্টক মূল্য','অবস্থা',''].map(h=>(
                  <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p,i)=>{
                const st = p.stock<=0?'out':p.stock<=p.minStock?'low':'ok';
                const stColor = {out:T.red,low:T.amber,ok:T.green}[st];
                const stLabel = {out:'শেষ',low:'কম',ok:'পর্যাপ্ত'}[st];
                const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'';
                return (
                  <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{supCode||'-'}</td>
                    <td style={{padding:'10px 12px',fontWeight:600}}>{p.name}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.company||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:13,color:T.gray600}}>{p.cat||'-'}</td>
                    <td style={{padding:'10px 12px',fontWeight:800,fontSize:18,color:stColor}}>{fmtN(p.stock)}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{p.unit}</td>
                    <td style={{padding:'10px 12px',fontSize:13}}>{p.minStock}</td>
                    <td style={{padding:'10px 12px',fontSize:13,fontWeight:600}}>{fmt(p.sellP*p.stock)}</td>
                    <td style={{padding:'10px 12px'}}>
                      <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:stColor+'20',color:stColor}}>{stLabel}</span>
                    </td>
                    <td style={{padding:'10px 12px'}}>
                      <button style={btn('primary','sm')} onClick={()=>{setModal(p);setAdjType('add');setAdjQty('');setAdjNote('');}}>+ স্টক</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal onClose={()=>setModal(null)} title={`স্টক আপডেট: ${modal.name}`} width={360}>
          <div style={{padding:'10px 14px',background:T.tealLight,borderRadius:8,marginBottom:14,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:T.gray600}}>বর্তমান স্টক</span>
            <span style={{fontWeight:800,fontSize:18,color:T.teal}}>{modal.stock} {modal.unit}</span>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[{v:'add',l:'স্টক যোগ করুন',icon:'+'},{v:'subtract',l:'স্টক কমান',icon:'-'}].map(t=>(
              <button key={t.v} onClick={()=>setAdjType(t.v)} style={{
                ...btn(adjType===t.v?'primary':'ghost'), flex:1, justifyContent:'center',
              }}>{t.icon} {t.l}</button>
            ))}
          </div>
          <label style={label}>পরিমাণ ({modal.unit})</label>
          <input value={adjQty} onChange={e=>setAdjQty(e.target.value)} type="number" min="1" style={{...input,marginBottom:12}} autoFocus/>
          {adjQty && (
            <div style={{padding:'8px 12px',background:adjType==='add'?T.greenLight:T.redLight,borderRadius:8,fontSize:13,fontWeight:600,color:adjType==='add'?T.green:T.red,marginBottom:12}}>
              আপডেটের পর: {adjType==='add'?modal.stock+(parseInt(adjQty)||0):Math.max(0,modal.stock-(parseInt(adjQty)||0))} {modal.unit}
            </div>
          )}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={btn()}>বাতিল</button>
            <button onClick={adjust} style={btn('primary')}>আপডেট করুন</button>
          </div>
        </Modal>
      )}
      </>
      )}

    </div>
  );
}

/* ═══════════════════════════════════════════
   LOW STOCK SCREEN
═══════════════════════════════════════════ */
function LowStockScreen({products, upd}) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [products]);

  const realProducts = products.filter(p => !p.name?.includes('(ক্যাটাগরি)'));
  
  // Filter only low stock products (stock > 0 && stock <= minStock)
  const lowStockProducts = realProducts.filter(p => p.stock > 0 && p.stock <= p.minStock);
  
  const filtered = lowStockProducts
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.company||'').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.stock - b.stock);

  const totalValue = filtered.reduce((s, p) => s + p.sellP * p.stock, 0);

  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
      {/* Header */}
      <div style={{padding: '12px 16px', background: T.white, borderBottom: `1px solid ${T.gray200}`}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <span style={{fontSize: 24}}>⚠️</span>
            <div>
              <div style={{fontSize: 16, fontWeight: 700, color: T.gray900}}>স্টক কম পণ্যসমূহ</div>
              <div style={{fontSize: 12, color: T.gray500}}>মিনিমাম স্টকের নিচে পণ্য</div>
            </div>
          </div>
          <div style={{textAlign: 'right'}}>
            <div style={{fontSize: 20, fontWeight: 800, color: T.orange}}>{filtered.length}টি পণ্য</div>
            <div style={{fontSize: 12, color: T.gray500}}>স্টক মূল্য: <strong style={{color: T.teal}}>{fmt(totalValue)}</strong></div>
          </div>
        </div>
        
        {/* Search */}
        <div style={{position: 'relative'}}>
          <span style={{position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400}}>🔍</span>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="পণ্য বা কোম্পানি খুঁজুন..." 
            style={{...input, paddingLeft: 32, height: 36, fontSize: 13}}
          />
        </div>
      </div>

      {/* Product List */}
      <div style={{flex: 1, overflow: 'auto', padding: 12}}>
        {loading ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16}}>
            <div style={{
              width: 48, height: 48, border: '4px solid #E0E0E0', borderTop: '4px solid #ef6c00',
              borderRadius: '50%', animation: 'spin 1s linear infinite'
            }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            <div style={{fontSize: 14, color: T.gray500}}>লোড হচ্ছে...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16}}>
            <div style={{fontSize: 64}}>✅</div>
            <div style={{fontSize: 18, fontWeight: 700, color: T.green}}>সব পণ্যে পর্যাপ্ত স্টক আছে!</div>
            <div style={{fontSize: 13, color: T.gray500}}>কোনো পণ্য স্টক কম নেই</div>
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{
                background: T.white, border: `1.5px solid ${T.amber}`, borderRadius: 12,
                padding: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 15, fontWeight: 700, color: T.gray900, marginBottom: 4}}>{p.name}</div>
                    <div style={{fontSize: 12, color: T.gray500}}>
                      {p.company && <span>🏢 {p.company}</span>}
                      {p.cat && <span style={{marginLeft: 8}}>📁 {p.cat}</span>}
                    </div>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: T.orangeLight, color: T.orange,
                      padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700
                    }}>
                      ⚠️ স্টক কম
                    </div>
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.gray100}`}}>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 11, color: T.gray500, marginBottom: 2}}>বর্তমান স্টক</div>
                    <div style={{fontSize: 22, fontWeight: 800, color: T.orange}}>{p.stock} <span style={{fontSize: 12, fontWeight: 400, color: T.gray500}}>/ {p.unit}</span></div>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 11, color: T.gray500, marginBottom: 2}}>মিনিমাম স্টক</div>
                    <div style={{fontSize: 22, fontWeight: 800, color: T.gray700}}>{p.minStock} <span style={{fontSize: 12, fontWeight: 400, color: T.gray500}}>/ {p.unit}</span></div>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 11, color: T.gray500, marginBottom: 2}}>বিক্রয় মূল্য</div>
                    <div style={{fontSize: 22, fontWeight: 800, color: T.teal}}>{fmt(p.sellP)}</div>
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontSize: 11, color: T.gray500, marginBottom: 2}}>স্টক ঘাটতি</div>
                    <div style={{fontSize: 22, fontWeight: 800, color: T.red}}>{p.minStock - p.stock}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   INCOME SCREEN
═══════════════════════════════════════════ */
function IncomeScreen({sales, purchases, upd}) {
  const [period, setPeriod] = useState('month');
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => today());
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({title:'',amount:'',note:''});
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [incomeForm, setIncomeForm] = useState({title:'',amount:'',note:''});
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('pos_expenses') || '[]'));
  const [incomes, setIncomes] = useState(() => JSON.parse(localStorage.getItem('pos_incomes') || '[]'));

  const card = {background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`,boxShadow:'0 2px 8px rgba(0,0,0,0.04)'};
  const input = {width:'100%',padding:'10px 12px',border:`1.5px solid ${T.gray200}`,borderRadius:8,fontSize:13,outline:'none',boxSizing:'border-box',background:T.gray50,color:T.gray800};
  const label = {display:'block',marginBottom:6,fontWeight:600,fontSize:13,color:T.gray600};
  const btn = (type='ghost',size='md') => {
    const base = {border:'none',borderRadius:8,cursor:'pointer',fontWeight:600,fontSize:size==='sm'?11:13,transition:'all 0.2s'};
    const colors = {
      ghost: {background:T.gray100,color:T.gray700},
      primary: {background:T.teal,color:T.white},
      danger: {background:T.redLight,color:T.red},
      success: {background:T.greenLight,color:T.green}
    };
    const sizes = {sm:{padding:'4px 8px'},md:{padding:'8px 16px'},lg:{padding:'12px 24px'}};
    return {...base,...colors[type],...sizes[size]};
  };
  const fmt = (v) => '৳' + (v||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});

  // Filter items by period
  const getFilteredData = () => {
    const n = new Date();
    let startDate, endDate = new Date(to+'T23:59:59');
    
    if (period === 'today') {
      startDate = new Date(n.getFullYear(), n.getMonth(), n.getDate());
      endDate = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59);
    } else if (period === 'week') {
      startDate = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 6);
    } else if (period === '15days') {
      startDate = new Date(n.getFullYear(), n.getMonth(), n.getDate() - 14);
    } else if (period === 'month') {
      startDate = new Date(n.getFullYear(), n.getMonth(), 1);
    } else if (period === 'custom') {
      startDate = new Date(from);
    }

    // Filter sales (only completed)
    const filteredSales = sales.filter(s => {
      const d = new Date(s.date);
      return d >= startDate && d <= endDate;
    });

    // Filter purchases
    const filteredPurchases = purchases.filter(p => {
      const d = new Date(p.date);
      return d >= startDate && d <= endDate;
    });

    // Filter expenses
    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d >= startDate && d <= endDate;
    });

    // Filter incomes
    const filteredIncomes = incomes.filter(i => {
      const d = new Date(i.date);
      return d >= startDate && d <= endDate;
    });

    return { filteredSales, filteredPurchases, filteredExpenses, filteredIncomes, startDate, endDate };
  };

  const { filteredSales, filteredPurchases, filteredExpenses, filteredIncomes } = getFilteredData();

  // Calculate totals
  const totalSalesIncome = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalManualIncome = filteredIncomes.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalIncome = totalSalesIncome + totalManualIncome;
  const totalPurchaseExpense = filteredPurchases.reduce((sum, p) => {
    return sum + p.items.reduce((s, i) => s + (i.buyP || 0) * (i.stock || 0), 0);
  }, 0);
  const totalManualExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalExpense = totalPurchaseExpense + totalManualExpense;
  const netProfit = totalIncome - totalExpense;

  // Save expense to localStorage
  const saveExpense = async () => {
    if (!expenseForm.title?.trim()) { alert('ব্যয়ের বিবরণ দিন'); return; }
    if (!expenseForm.amount || expenseForm.amount <= 0) { alert('সঠিক পরিমাণ দিন'); return; }
    
    const newExpense = {
      id: genId(),
      date: new Date().toISOString(),
      title: expenseForm.title.trim(),
      amount: parseFloat(expenseForm.amount),
      note: expenseForm.note || ''
    };
    
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    localStorage.setItem('pos_expenses', JSON.stringify(updatedExpenses));
    
    setExpenseForm({title:'',amount:'',note:''});
    setShowExpenseForm(false);
    alert('✅ ব্যয় সংরক্ষিত হয়েছে!');
  };

  // Delete expense
  const deleteExpense = (id) => {
    if (!confirm('এই ব্যয় মুছে ফেলবেন?')) return;
    const updatedExpenses = expenses.filter(e => e.id !== id);
    setExpenses(updatedExpenses);
    localStorage.setItem('pos_expenses', JSON.stringify(updatedExpenses));
  };

  // Save income
  const saveIncome = () => {
    if (!incomeForm.title?.trim()) { alert('আয়ের বিবরণ দিন'); return; }
    if (!incomeForm.amount || incomeForm.amount <= 0) { alert('সঠিক পরিমাণ দিন'); return; }
    
    const newIncome = {
      id: genId(),
      date: new Date().toISOString(),
      title: incomeForm.title.trim(),
      amount: parseFloat(incomeForm.amount),
      note: incomeForm.note || ''
    };
    
    const updatedIncomes = [...incomes, newIncome];
    setIncomes(updatedIncomes);
    localStorage.setItem('pos_incomes', JSON.stringify(updatedIncomes));
    
    setIncomeForm({title:'',amount:'',note:''});
    setShowIncomeForm(false);
    alert('✅ আয় সংরক্ষিত হয়েছে!');
  };

  // Delete income
  const deleteIncome = (id) => {
    if (!confirm('এই আয় মুছে ফেলবেন?')) return;
    const updatedIncomes = incomes.filter(i => i.id !== id);
    setIncomes(updatedIncomes);
    localStorage.setItem('pos_incomes', JSON.stringify(updatedIncomes));
  };

  const periods = [
    {id:'today',label:'আজ'},
    {id:'week',label:'১ সপ্তাহ'},
    {id:'15days',label:'১৫ দিন'},
    {id:'month',label:'১ মাস'},
    {id:'custom',label:'কাস্টম'}
  ];

  // Get period label
  const getPeriodLabel = () => {
    if (period === 'today') return 'আজকের তারিখ';
    if (period === 'week') return 'গত ৭ দিন';
    if (period === '15days') return 'গত ১৫ দিন';
    if (period === 'month') return 'এই মাস';
    return `${from} থেকে ${to}`;
  };

  // Print function
  const printReport = () => {
    const { filteredSales, filteredPurchases, filteredExpenses } = getFilteredData();
    const totalIncome = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalPurchaseExpense = filteredPurchases.reduce((sum, p) => sum + p.items.reduce((s, i) => s + (i.buyP || 0) * (i.stock || 0), 0), 0);
    const totalManualExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpense = totalPurchaseExpense + totalManualExpense;
    const netProfit = totalIncome - totalExpense;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>আয়-ব্যয় হিসাব</title>
<style>
@page { size: A4; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Tiro Bangla','Courier New',monospace; font-size:11px; color:#333; padding:10px; }
.header { text-align:center; margin-bottom:15px; border-bottom:2px solid #333; padding-bottom:10px; }
.header h1 { font-size:20px; margin-bottom:5px; }
.header p { font-size:11px; color:#666; }
.summary { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px; }
.summary-item { border:1px solid #ddd; padding:10px; border-radius:5px; }
.summary-item.green { border-left:4px solid #22c55e; }
.summary-item.orange { border-left:4px solid #f97316; }
.summary-item.red { border-left:4px solid #ef4444; }
.summary-item.blue { border-left:4px solid #0d9488; }
.label { font-size:10px; color:#666; margin-bottom:3px; }
.amount { font-size:16px; font-weight:bold; }
.green .amount { color:#22c55e; }
.orange .amount { color:#f97316; }
.red .amount { color:#ef4444; }
.blue .amount { color:#0d9488; }
.section { margin-bottom:15px; }
.section-title { font-size:13px; font-weight:bold; margin-bottom:8px; padding:5px 10px; background:#f5f5f5; border-radius:4px; }
table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:10px; }
th { background:#0d9488; color:white; padding:6px 8px; text-align:left; }
td { padding:5px 8px; border-bottom:1px solid #eee; }
tr:nth-child(even) { background:#fafafa; }
.footer { margin-top:20px; padding-top:10px; border-top:2px solid #333; display:flex; justify-content:space-between; }
.signature { text-align:center; width:150px; }
.signature-line { border-top:1px solid #333; margin-top:40px; padding-top:5px; font-size:10px; }
.total-section { margin-top:15px; padding:10px; background:#f0fdfa; border-radius:8px; border:2px solid #0d9488; }
.total-row { display:flex; justify-content:space-between; padding:3px 0; font-size:12px; }
.total-row.grand { font-size:14px; font-weight:bold; border-top:2px solid #0d9488; margin-top:5px; padding-top:8px; }
</style>
</head>
<body>
<div class="header">
  <h1>📊 আয়-ব্যয় হিসাব</h1>
  <p>${getPeriodLabel()} (${new Date().toLocaleDateString('bn-BD')})</p>
</div>

<div class="total-section">
  <div class="total-row">
    <span>📈 মোট আয় (বিক্রয়)</span>
    <span style="color:#22c55e;font-weight:bold">৳${totalIncome.toLocaleString()}</span>
  </div>
  <div class="total-row">
    <span>📦 পারচেজ ব্যয়</span>
    <span style="color:#f97316">৳${totalPurchaseExpense.toLocaleString()}</span>
  </div>
  <div class="total-row">
    <span>📝 ম্যানুয়াল ব্যয়</span>
    <span style="color:#ef4444">৳${totalManualExpense.toLocaleString()}</span>
  </div>
  <div class="total-row">
    <span>💵 মোট ব্যয়</span>
    <span style="color:#ef4444">৳${totalExpense.toLocaleString()}</span>
  </div>
  <div class="total-row grand">
    <span>${netProfit >= 0 ? '✅ নীট লাভ' : '⚠️ নীট ক্ষতি'}</span>
    <span style="color:${netProfit >= 0 ? '#0d9488' : '#ef4444'}">৳${Math.abs(netProfit).toLocaleString()}</span>
  </div>
</div>

${filteredSales.length > 0 ? `
<div class="section">
  <div class="section-title">🛒 বিক্রয়সমূহ (${filteredSales.length}টি) - মোট: ৳${totalIncome.toLocaleString()}</div>
  <table>
    <thead><tr><th>আইডি</th><th>তারিখ</th><th>গ্রাহক</th><th>পরিমাণ</th></tr></thead>
    <tbody>
      ${filteredSales.slice(0, 20).map(s => `
      <tr>
        <td>${s.id}</td>
        <td>${new Date(s.date).toLocaleDateString('bn-BD')}</td>
        <td>${s.customer || '-'}</td>
        <td style="text-align:right;font-weight:bold">৳${(s.total || 0).toLocaleString()}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  ${filteredSales.length > 20 ? `<p style="color:#666;font-size:10px">... এবং আরও ${filteredSales.length - 20}টি</p>` : ''}
</div>` : ''}

${filteredPurchases.length > 0 ? `
<div class="section">
  <div class="section-title">📦 পারচেজসমূহ (${filteredPurchases.length}টি) - মোট: ৳${totalPurchaseExpense.toLocaleString()}</div>
  <table>
    <thead><tr><th>আইডি</th><th>তারিখ</th><th>সরবরাহকারী</th><th>পরিমাণ</th></tr></thead>
    <tbody>
      ${filteredPurchases.slice(0, 20).map(p => {
        const total = p.items.reduce((s, i) => s + (i.buyP || 0) * (i.stock || 0), 0);
        return `
      <tr>
        <td>${p.id}</td>
        <td>${new Date(p.date).toLocaleDateString('bn-BD')}</td>
        <td>${p.supplier || '-'}</td>
        <td style="text-align:right;font-weight:bold">৳${total.toLocaleString()}</td>
      </tr>`}).join('')}
    </tbody>
  </table>
  ${filteredPurchases.length > 20 ? `<p style="color:#666;font-size:10px">... এবং আরও ${filteredPurchases.length - 20}টি</p>` : ''}
</div>` : ''}

${filteredExpenses.length > 0 ? `
<div class="section">
  <div class="section-title">📝 ম্যানুয়াল ব্যয়সমূহ (${filteredExpenses.length}টি) - মোট: ৳${totalManualExpense.toLocaleString()}</div>
  <table>
    <thead><tr><th>তারিখ</th><th>বিবরণ</th><th>নোট</th><th>পরিমাণ</th></tr></thead>
    <tbody>
      ${filteredExpenses.map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString('bn-BD')}</td>
        <td>${e.title}</td>
        <td>${e.note || '-'}</td>
        <td style="text-align:right;font-weight:bold;color:#ef4444">৳${e.amount.toLocaleString()}</td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>` : ''}

<div class="footer">
  <div class="signature">
    <div class="signature-line">তৈরিকারী স্বাক্ষর</div>
  </div>
  <div class="signature">
    <div class="signature-line">ম্যানেজার স্বাক্ষর</div>
  </div>
  <div class="signature">
    <div class="signature-line">অনুমোদনকারী স্বাক্ষর</div>
  </div>
</div>
</body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px;';
    document.body.appendChild(iframe);
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(html);
    iframe.contentWindow.document.close();
    iframe.contentWindow.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      }, 250);
    };
  };

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',background:T.gray50}}>
      {/* Header */}
      <div style={{padding:'12px 16px',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h2 style={{margin:0,fontSize:18,fontWeight:700,color:T.teal}}>💰 আয়/ব্যয় হিসাব</h2>
          <div style={{display:'flex',gap:8}}>
            <button onClick={printReport} style={{...btn('ghost'),padding:'8px 16px'}}>
              🖨️ প্রিন্ট
            </button>
            <button onClick={()=>setShowIncomeForm(true)} style={{...btn('success'),padding:'8px 16px'}}>
              💰 আয় যোগ করুন
            </button>
            <button onClick={()=>setShowExpenseForm(true)} style={{...btn('danger'),padding:'8px 16px'}}>
              📝 ব্যয় যোগ করুন
            </button>
          </div>
        </div>
        
        {/* Period Filter */}
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
          {periods.map(p => (
            <button key={p.id} onClick={()=>setPeriod(p.id)} style={{
              padding:'6px 14px',border:'none',borderRadius:20,cursor:'pointer',fontWeight:600,fontSize:12,
              background: period === p.id ? T.teal : T.gray100,
              color: period === p.id ? T.white : T.gray600,
              transition:'all 0.2s'
            }}>{p.label}</button>
          ))}
          
          {period === 'custom' && (
            <div style={{display:'flex',gap:8,alignItems:'center',marginLeft:8}}>
              <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...input,padding:'6px 10px',width:'auto'}} />
              <span>থেকে</span>
              <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...input,padding:'6px 10px',width:'auto'}} />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:'auto',padding:16}}>
        {/* Summary Cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:20}}>
          {/* Sales Income Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${T.green}`}}>
            <div style={{fontSize:12,color:T.gray500,marginBottom:4}}>🛒 বিক্রয় আয়</div>
            <div style={{fontSize:24,fontWeight:800,color:T.green}}>{fmt(totalSalesIncome)}</div>
            <div style={{fontSize:11,color:T.gray400,marginTop:4}}>{filteredSales.length}টি বিক্রয়</div>
          </div>
          
          {/* Manual Income Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${T.teal}`}}>
            <div style={{fontSize:12,color:T.gray500,marginBottom:4}}>💰 ম্যানুয়াল আয়</div>
            <div style={{fontSize:24,fontWeight:800,color:T.teal}}>{fmt(totalManualIncome)}</div>
            <div style={{fontSize:11,color:T.gray400,marginTop:4}}>{filteredIncomes.length}টি আয়</div>
          </div>
          
          {/* Total Income Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${T.green}`,background:'#f0fdf4'}}>
            <div style={{fontSize:12,color:T.gray600,marginBottom:4}}>📈 মোট আয়</div>
            <div style={{fontSize:28,fontWeight:800,color:T.green}}>{fmt(totalIncome)}</div>
          </div>
          
          {/* Purchase Expense Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${T.orange}`}}>
            <div style={{fontSize:12,color:T.gray500,marginBottom:4}}>📦 পারচেজ ব্যয়</div>
            <div style={{fontSize:24,fontWeight:800,color:T.orange}}>{fmt(totalPurchaseExpense)}</div>
            <div style={{fontSize:11,color:T.gray400,marginTop:4}}>{filteredPurchases.length}টি পারচেজ</div>
          </div>
          
          {/* Manual Expense Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${T.red}`}}>
            <div style={{fontSize:12,color:T.gray500,marginBottom:4}}>📝 ম্যানুয়াল ব্যয়</div>
            <div style={{fontSize:24,fontWeight:800,color:T.red}}>{fmt(totalManualExpense)}</div>
            <div style={{fontSize:11,color:T.gray400,marginTop:4}}>{filteredExpenses.length}টি ব্যয়</div>
          </div>
          
          {/* Net Profit Card */}
          <div style={{...card,padding:20,borderLeft:`4px solid ${netProfit >= 0 ? T.teal : T.red}`,background:netProfit >= 0 ? '#f0fdfa' : '#fef2f2'}}>
            <div style={{fontSize:12,color:T.gray600,marginBottom:4}}>💵 নীট লাভ/ক্ষতি</div>
            <div style={{fontSize:28,fontWeight:800,color:netProfit >= 0 ? T.teal : T.red}}>{fmt(netProfit)}</div>
            <div style={{fontSize:11,color:T.gray500,marginTop:4}}>মোট ব্যয়: {fmt(totalExpense)}</div>
          </div>
        </div>

        {/* Income List */}
        {filteredIncomes.length > 0 && (
          <div style={{...card,padding:20,marginBottom:16,border:`1px solid ${T.green}`}}>
            <h3 style={{margin:'0 0 16px',fontSize:14,fontWeight:700,color:T.green}}>💰 ম্যানুয়াল আয়সমূহ</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filteredIncomes.map(i => (
                <div key={i.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:T.greenLight,borderRadius:8}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{i.title}</div>
                    <div style={{fontSize:11,color:T.gray500}}>{new Date(i.date).toLocaleDateString('bn-BD')}{i.note ? ` • ${i.note}` : ''}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontWeight:700,color:T.green,fontSize:14}}>{fmt(i.amount)}</span>
                    <button onClick={()=>deleteIncome(i.id)} style={{...btn('danger'),padding:'4px 8px'}}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expense List */}
        {filteredExpenses.length > 0 && (
          <div style={{...card,padding:20,marginBottom:16,border:`1px solid ${T.red}`}}>
            <h3 style={{margin:'0 0 16px',fontSize:14,fontWeight:700,color:T.red}}>📋 ম্যানুয়াল ব্যয়সমূহ</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filteredExpenses.map(e => (
                <div key={e.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 12px',background:T.redLight,borderRadius:8}}>
                  <div>
                    <div style={{fontWeight:600,fontSize:13}}>{e.title}</div>
                    <div style={{fontSize:11,color:T.gray500}}>{new Date(e.date).toLocaleDateString('bn-BD')}{e.note ? ` • ${e.note}` : ''}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontWeight:700,color:T.red,fontSize:14}}>{fmt(e.amount)}</span>
                    <button onClick={()=>deleteExpense(e.id)} style={{...btn('danger'),padding:'4px 8px'}}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sales Details */}
        {filteredSales.length > 0 && (
          <div style={{...card,padding:20,marginBottom:16}}>
            <h3 style={{margin:'0 0 16px',fontSize:14,fontWeight:700,color:T.gray700}}>🛒 বিক্রয়সমূহ ({filteredSales.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filteredSales.slice(0, 10).map(s => (
                <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.gray50,borderRadius:6}}>
                  <div style={{fontSize:12}}>
                    <span style={{fontWeight:600}}>{s.id}</span>
                    <span style={{color:T.gray500,marginLeft:8}}>{new Date(s.date).toLocaleDateString('bn-BD')}</span>
                    {s.customer && <span style={{color:T.teal,marginLeft:8}}>{s.customer}</span>}
                  </div>
                  <span style={{fontWeight:700,color:T.green}}>{fmt(s.total)}</span>
                </div>
              ))}
              {filteredSales.length > 10 && (
                <div style={{textAlign:'center',color:T.gray500,fontSize:12,padding:8}}>
                  ... এবং আরও {filteredSales.length - 10}টি
                </div>
              )}
            </div>
          </div>
        )}

        {/* Purchase Details */}
        {filteredPurchases.length > 0 && (
          <div style={{...card,padding:20,marginBottom:16}}>
            <h3 style={{margin:'0 0 16px',fontSize:14,fontWeight:700,color:T.gray700}}>📦 পারচেজসমূহ ({filteredPurchases.length})</h3>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {filteredPurchases.slice(0, 10).map(p => {
                const total = p.items.reduce((s, i) => s + (i.buyP || 0) * (i.stock || 0), 0);
                return (
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',background:T.gray50,borderRadius:6}}>
                    <div style={{fontSize:12}}>
                      <span style={{fontWeight:600}}>{p.id}</span>
                      <span style={{color:T.gray500,marginLeft:8}}>{new Date(p.date).toLocaleDateString('bn-BD')}</span>
                      {p.supplier && <span style={{color:T.orange,marginLeft:8}}>{p.supplier}</span>}
                    </div>
                    <span style={{fontWeight:700,color:T.orange}}>{fmt(total)}</span>
                  </div>
                );
              })}
              {filteredPurchases.length > 10 && (
                <div style={{textAlign:'center',color:T.gray500,fontSize:12,padding:8}}>
                  ... এবং আরও {filteredPurchases.length - 10}টি
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showExpenseForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setShowExpenseForm(false)}>
          <div style={{...card,width:400,padding:24}} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:700,color:T.red}}>📝 নতুন ব্যয় যোগ করুন</h3>
            
            <div style={{marginBottom:16}}>
              <label style={label}>📝 ব্যয়ের বিবরণ *</label>
              <input value={expenseForm.title} onChange={e=>setExpenseForm(f=>({...f,title:e.target.value}))} placeholder="যেমন: বিদ্যুৎ বিল, ভাড়া, অফিস খরচ" style={input} />
            </div>
            
            <div style={{marginBottom:16}}>
              <label style={label}>💰 পরিমাণ (৳) *</label>
              <input type="number" value={expenseForm.amount} onChange={e=>setExpenseForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={input} />
            </div>
            
            <div style={{marginBottom:20}}>
              <label style={label}>📋 নোট (ঐচ্ছিক)</label>
              <input value={expenseForm.note} onChange={e=>setExpenseForm(f=>({...f,note:e.target.value}))} placeholder="অতিরিক্ত তথ্য" style={input} />
            </div>
            
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowExpenseForm(false)} style={{...btn(),flex:1}}>বাতিল</button>
              <button onClick={saveExpense} style={{...btn('danger'),flex:1}}>💾 সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Income Modal */}
      {showIncomeForm && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setShowIncomeForm(false)}>
          <div style={{...card,width:400,padding:24}} onClick={e=>e.stopPropagation()}>
            <h3 style={{margin:'0 0 20px',fontSize:16,fontWeight:700,color:T.green}}>💰 নতুন আয় যোগ করুন</h3>
            
            <div style={{marginBottom:16}}>
              <label style={label}>📝 আয়ের বিবরণ *</label>
              <input value={incomeForm.title} onChange={e=>setIncomeForm(f=>({...f,title:e.target.value}))} placeholder="যেমন: সার্ভিস চার্জ, ডেলিভারি ফি, অতিরিক্ত আয়" style={input} />
            </div>
            
            <div style={{marginBottom:16}}>
              <label style={label}>💰 পরিমাণ (৳) *</label>
              <input type="number" value={incomeForm.amount} onChange={e=>setIncomeForm(f=>({...f,amount:e.target.value}))} placeholder="0" style={input} />
            </div>
            
            <div style={{marginBottom:20}}>
              <label style={label}>📋 নোট (ঐচ্ছিক)</label>
              <input value={incomeForm.note} onChange={e=>setIncomeForm(f=>({...f,note:e.target.value}))} placeholder="অতিরিক্ত তথ্য" style={input} />
            </div>
            
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>setShowIncomeForm(false)} style={{...btn(),flex:1}}>বাতিল</button>
              <button onClick={saveIncome} style={{...btn('success'),flex:1}}>💾 সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS SCREEN
═══════════════════════════════════════════ */
function ReportsScreen({sales, customers, purchases, settings}) {
  const [period, setPeriod] = useState('today');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [viewPurchase, setViewPurchase] = useState(null);
  const [viewSale, setViewSale] = useState(null);
  const [purchaseSearch, setPurchaseSearch] = useState('');

  const filterByPeriod = (items, dateField = 'date') => {
    const n = new Date();
    return items.filter(item => {
      const d = new Date(item[dateField]);
      if(period==='today')  return d.toDateString()===n.toDateString();
      if(period==='week')   return d >= new Date(n.getFullYear(),n.getMonth(),n.getDate()-6);
      if(period==='month')  return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();
      if(period==='custom') return d>=new Date(from)&&d<=new Date(to+'T23:59:59');
      return true;
    });
  };

  const filterSales = () => {
    return filterByPeriod(sales);
  };

  const filterPurchases = () => {
    return filterByPeriod(purchases);
  };

  const filteredPurchases = filterPurchases().filter(p => 
    !purchaseSearch || 
    p.id.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
    (p.supplier||'').toLowerCase().includes(purchaseSearch.toLowerCase())
  );

  const fs = filterSales();
  const totalSales = fs.reduce((s,i)=>s+i.total,0);
  const totalPaid  = fs.reduce((s,i)=>s+i.paid,0);
  const totalDue   = fs.reduce((s,i)=>s+i.due,0);
  const totalProfit= fs.reduce((s,i)=>s+(i.items||[]).reduce((a,it)=>a+(it.profit||0),0),0);
  const allCredit  = customers.reduce((s,c)=>s+(c.credit||0),0);
  const profitPct  = totalSales>0 ? (totalProfit/totalSales*100).toFixed(1) : 0;

  const exportCSV = () => {
    const rows = [['তারিখ','বিল নং','কাস্টমার','মোট','পরিশোধ','বাকি','লাভ'],
      ...fs.map(s=>[new Date(s.date).toLocaleDateString('en-GB'),s.id.slice(-8),s.custName,s.total,s.paid,s.due,
        (s.items||[]).reduce((a,i)=>a+(i.profit||0),0).toFixed(2)])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    a.download='sales-report.csv'; a.click();
  };

  const printPurchases = () => {
    const purchases = filterPurchases();
    const total = purchases.reduce((s,p) => s + p.items.reduce((a,i) => a + (i.stock||0)*(i.buyP||0), 0), 0);
    const periodLabel = period === 'today' ? 'আজ' : period === 'week' ? 'এই সপ্তাহ' : period === 'month' ? 'এই মাস' : period === 'all' ? 'সব সময়' : from + ' থেকে ' + to;
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
      <title>বিক্রয় ইতিহাস</title>
      <style>
        @page { size: A4 landscape; margin: 12.7mm; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Tiro Bangla',Arial,sans-serif; padding:12px; font-size:12px; }
        .header { text-align:center; margin-bottom:12px; border-bottom:2px solid #00897b; padding-bottom:8px; }
        .header h1 { color:#00897b; font-size:20px; margin-bottom:4px; }
        .header p { color:#666; font-size:11px; }
        table { width:100%; border-collapse:collapse; margin-bottom:12px; }
        th { background:#e0f7f0; border:1px solid #b2dfdb; padding:6px 5px; text-align:left; font-size:10px; color:#00897b; font-weight:700; }
        td { border:1px solid #e0e0e0; padding:6px 5px; font-size:11px; }
        tr:nth-child(even) { background:#fafafa; }
        .total-row { background:#e0f7f0 !important; font-weight:700; }
        .total-row td { border:1px solid #b2dfdb; font-size:12px; color:#00897b; }
        .footer { margin-top:12px; text-align:center; color:#999; font-size:10px; }
        @media print { body { padding:0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📦 পারচেজ হিস্ট্রি</h1>
        <p>${periodLabel} - ${new Date().toLocaleDateString('bn-BD')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>তারিখ</th>
            <th>পারচেজ আইডি</th>
            <th>সরবরাহকারী</th>
            <th style="text-align:center;">পণ্য</th>
            <th style="text-align:right;">মোট খরচ</th>
          </tr>
        </thead>
        <tbody>`;
    
    purchases.forEach(p => {
      html += `
          <tr>
            <td>${new Date(p.date).toLocaleDateString('bn-BD')}</td>
            <td style="font-family:monospace;color:#00897b;font-weight:600;">${p.id}</td>
            <td>${p.supplier}</td>
            <td style="text-align:center;">${p.totalItems}টি</td>
            <td style="text-align:right;font-weight:600;">৳${(p.items.reduce((s,i) => s + (i.stock||0)*(i.buyP||0), 0)).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          </tr>`;
    });
    
    html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="4" style="text-align:right;">মোট পারচেজ এমাউন্ট:</td>
            <td style="text-align:right;">৳${total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')} | ${purchases.length}টি পারচেজ</div>
    </body>
    </html>`;
    
    // Large paper print - window.open for preview and printer selection
    const win = window.open('', '', 'width=1000,height=600');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = function() { setTimeout(() => win.print(), 100); };
  };

  const printSales = () => {
    const periodLabel = period === 'today' ? 'আজ' : period === 'week' ? 'এই সপ্তাহ' : period === 'month' ? 'এই মাস' : period === 'all' ? 'সব সময়' : from + ' থেকে ' + to;
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
      <title>বিক্রয় ইতিহাস</title>
      <style>
        @page { size: A4 landscape; margin: 12.7mm; }
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Tiro Bangla','Courier New',monospace; padding:12px; font-size:12px; }
        .header { text-align:center; margin-bottom:12px; border-bottom:2px solid #00897b; padding-bottom:8px; }
        .header h1 { color:#00897b; font-size:20px; margin-bottom:4px; }
        .header p { color:#666; font-size:11px; }
        table { width:100%; border-collapse:collapse; margin-bottom:12px; }
        th { background:#e0f7f0; border:1px solid #b2dfdb; padding:6px 5px; text-align:left; font-size:10px; color:#00897b; font-weight:700; }
        td { border:1px solid #e0e0e0; padding:6px 5px; font-size:11px; }
        tr:nth-child(even) { background:#fafafa; }
        .total-row { background:#e8f5e9 !important; font-weight:700; }
        .total-row td { border:1px solid #a5d6a7; color:#2e7d32; font-size:12px; }
        .footer { margin-top:12px; text-align:center; color:#999; font-size:10px; }
        @media print { body { padding:0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🧾 বিক্রয় ইতিহাস</h1>
        <p>${periodLabel} - ${new Date().toLocaleDateString('bn-BD')}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>তারিখ</th>
            <th>বিল নং</th>
            <th>কাস্টমার</th>
            <th style="text-align:center;">পণ্য</th>
            <th style="text-align:right;">মোট</th>
            <th style="text-align:right;">পরিশোধ</th>
            <th style="text-align:right;">বাকি</th>
          </tr>
        </thead>
        <tbody>`;
    
    fs.forEach(s => {
      html += `
          <tr>
            <td>${new Date(s.date).toLocaleDateString('bn-BD')}</td>
            <td style="font-family:monospace;color:#00897b;font-weight:600;">#${s.id.slice(-6).toUpperCase()}</td>
            <td>${s.custName}</td>
            <td style="text-align:center;">${(s.items||[]).length}টি</td>
            <td style="text-align:right;font-weight:600;">৳${s.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td style="text-align:right;color:#2e7d32;">৳${s.paid.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td style="text-align:right;color:${s.due>0?'#c62828':'#999'};">৳${s.due.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          </tr>`;
    });
    
    html += `
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="4" style="text-align:right;">মোট:</td>
            <td style="text-align:right;">৳${totalSales.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td style="text-align:right;">৳${totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
            <td style="text-align:right;">৳${totalDue.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
          </tr>
        </tfoot>
      </table>
      <div class="footer">প্রিন্ট তারিখ: ${new Date().toLocaleString('bn-BD')} | ${fs.length}টি বিক্রয়</div>
    </body>
    </html>`;
    
    const win = window.open('', '', 'width=1000,height=600');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = function() { setTimeout(() => win.print(), 100); };
  };

  const statCards = [
    {l:'মোট বিক্রয়',v:fmt(totalSales),icon:'💰',c:T.teal,bg:T.tealLight},
    {l:'মোট লাভ',v:fmt(totalProfit),icon:'📈',c:T.green,bg:T.greenLight},
    {l:'লাভের হার',v:`${profitPct}%`,icon:'🎯',c:T.green,bg:T.greenLight},
    {l:'পরিশোধ হয়েছে',v:fmt(totalPaid),icon:'✅',c:T.green,bg:T.greenLight},
    {l:'বাকি বিক্রয়',v:fmt(totalDue),icon:'⏳',c:T.amber,bg:T.amberLight},
    {l:'বিলের সংখ্যা',v:fs.length,icon:'🧾',c:T.teal,bg:T.tealLight},
    {l:'সব কাস্টমার বাকি',v:fmt(allCredit),icon:'💳',c:T.red,bg:T.redLight},
  ];

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:6,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        {[{v:'today',l:'আজ'},{v:'week',l:'এই সপ্তাহ'},{v:'month',l:'এই মাস'},{v:'all',l:'সব সময়'},{v:'custom',l:'নির্দিষ্ট তারিখ'}].map(p=>(
          <button key={p.v} onClick={()=>setPeriod(p.v)} style={{
            ...btn(period===p.v?'primary':'ghost','sm'),
            background:period===p.v?T.teal:T.gray100, color:period===p.v?T.white:T.gray600, border:'none',
          }}>{p.l}</button>
        ))}
        {period==='custom' && <>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...input,width:140,fontSize:13}}/>
          <span style={{color:T.gray400,fontSize:13}}>থেকে</span>
          <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   style={{...input,width:140,fontSize:13}}/>
        </>}
        <button style={btn('ghost','sm')} onClick={exportCSV}>📤 CSV রপ্তানি</button>
      </div>

      <div style={{flex:1,overflow:'auto',padding:12}}>
        {/* Stat cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10,marginBottom:14}}>
          {statCards.map(s=>(
            <div key={s.l} style={{...card,textAlign:'center',background:s.bg,border:'none'}}>
              <div style={{fontSize:26,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:12,color:T.gray600,marginTop:2,fontWeight:500}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* P&L */}
        <div style={{...card,marginBottom:14}}>
          <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:700,color:T.gray600,textTransform:'uppercase',letterSpacing:'0.5px'}}>লাভ-ক্ষতির হিসাব</h3>
          {[
            {l:'মোট বিক্রয় আয়',v:totalSales,c:T.gray900},
            {l:'পণ্যের ক্রয়মূল্য (COGS)',v:-(totalSales-totalProfit),c:T.red},
            {l:'মোট লাভ',v:totalProfit,c:T.green,bold:true,line:true},
            {l:'লাভের হার',v:`${profitPct}%`,c:T.teal,bold:true,str:true},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderTop:r.line?`2px solid ${T.gray200}`:'none',marginTop:r.line?4:0}}>
              <span style={{color:T.gray600,fontSize:14}}>{r.l}</span>
              <span style={{fontWeight:r.bold?800:600,fontSize:r.bold?16:14,color:r.c}}>{r.str?r.v:fmt(r.v)}</span>
            </div>
          ))}
        </div>

        {/* Purchase History */}
        <div style={{...card,marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:T.gray600,textTransform:'uppercase',letterSpacing:'0.5px'}}>📦 পারচেজ হিস্ট্রি ({filterPurchases().length}টি)</h3>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input value={purchaseSearch} onChange={e=>setPurchaseSearch(e.target.value)} placeholder="খুঁজুন..." style={{...input,padding:'6px 10px',fontSize:12,width:150}}/>
              <button onClick={printPurchases} style={{...btn('ghost'),padding:'6px 12px',fontSize:12}}>🖨️ প্রিন্ট</button>
            </div>
          </div>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.gray50}}>
                  {['তারিখ','পারচেজ আইডি','সরবরাহকারী','পণ্য','মোট খরচ'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:T.gray400,borderBottom:`1px solid ${T.gray200}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length===0 ? <tr><td colSpan={5} style={{padding:30,textAlign:'center',color:T.gray400}}>কোনো পারচেজ নেই</td></tr>
                : [...filteredPurchases].reverse().map((p,i)=>(
                  <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`,cursor:'pointer'}} onClick={()=>setViewPurchase(p)}>
                    <td style={{padding:'9px 10px',fontSize:12,whiteSpace:'nowrap'}}>{new Date(p.date).toLocaleDateString('en-GB')}</td>
                    <td style={{padding:'9px 10px',fontSize:12,fontFamily:'monospace',color:T.teal,fontWeight:600}}>{p.id}</td>
                    <td style={{padding:'9px 10px',fontSize:12}}>{p.supplier}</td>
                    <td style={{padding:'9px 10px',fontSize:12,color:T.gray400}}>{p.totalItems}টি</td>
                    <td style={{padding:'9px 10px',fontWeight:600,fontSize:13,color:T.green}}>{fmt(p.items.reduce((s,i)=>s+(i.stock||0)*(i.buyP||0),0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:T.tealLight}}>
                  <td colSpan={4} style={{padding:'10px',fontWeight:700,fontSize:13}}>মোট পারচেজ এমাউন্ট:</td>
                  <td style={{padding:'10px',fontWeight:800,fontSize:14,color:T.teal}}>{fmt(filteredPurchases.reduce((s,p)=>s+p.items.reduce((a,i)=>a+(i.stock||0)*(i.buyP||0),0),0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Sales history */}
        <div style={card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700,color:T.gray600,textTransform:'uppercase',letterSpacing:'0.5px'}}>বিক্রয় ইতিহাস ({fs.length}টি বিল)</h3>
            <button onClick={printSales} style={{...btn('ghost'),padding:'6px 12px',fontSize:12}}>🖨️ প্রিন্ট</button>
          </div>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.gray50}}>
                  {['তারিখ','বিল নং','কাস্টমার','পণ্য','মোট','পরিশোধ','বাকি','লাভ'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:T.gray400,borderBottom:`1px solid ${T.gray200}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fs.length===0 ? <tr><td colSpan={8} style={{padding:30,textAlign:'center',color:T.gray400}}>নির্বাচিত সময়ে কোনো বিক্রয় নেই</td></tr>
                : [...fs].reverse().map((s,i)=>(
                  <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'9px 10px',fontSize:12,whiteSpace:'nowrap'}}>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                    <td style={{padding:'9px 10px',fontSize:12,cursor:'pointer',color:T.teal,fontWeight:600}} onClick={()=>setViewSale(s)}>#{s.id.slice(-6).toUpperCase()}</td>
                    <td style={{padding:'9px 10px',fontSize:12}}>{s.custName}</td>
                    <td style={{padding:'9px 10px',fontSize:12,color:T.gray400}}>{(s.items||[]).length}টি</td>
                    <td style={{padding:'9px 10px',fontWeight:600,fontSize:13}}>{fmt(s.total)}</td>
                    <td style={{padding:'9px 10px',color:T.green,fontSize:13}}>{fmt(s.paid)}</td>
                    <td style={{padding:'9px 10px',fontWeight:s.due>0?700:400,color:s.due>0?T.red:T.gray400}}>{fmt(s.due)}</td>
                    <td style={{padding:'9px 10px',color:T.green,fontSize:13}}>{fmt((s.items||[]).reduce((a,it)=>a+(it.profit||0),0))}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:T.greenLight}}>
                  <td colSpan={4} style={{padding:'10px',fontWeight:700,fontSize:13,color:T.green}}>মোট:</td>
                  <td style={{padding:'10px',fontWeight:800,fontSize:14,color:T.green}}>{fmt(totalSales)}</td>
                  <td style={{padding:'10px',fontWeight:700,fontSize:13,color:T.green}}>{fmt(totalPaid)}</td>
                  <td style={{padding:'10px',fontWeight:700,fontSize:13,color:totalDue>0?T.red:T.gray400}}>{fmt(totalDue)}</td>
                  <td style={{padding:'10px',fontWeight:700,fontSize:13,color:T.green}}>{fmt(totalProfit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Purchase Detail Modal */}
      {viewPurchase && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setViewPurchase(null)}>
          <div style={{background:T.white,borderRadius:12,padding:20,width:500,maxHeight:'80vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,borderBottom:'2px solid '+T.gray200,paddingBottom:16}}>
              <div>
                <div style={{fontWeight:800,fontSize:18,color:T.teal}}>{viewPurchase.id}</div>
                <div style={{fontSize:12,color:T.gray500,marginTop:4}}>📅 {new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
                <div style={{fontSize:13,marginTop:4}}>🏢 সরবরাহকারী: {viewPurchase.supplier}</div>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{
                  const grandTotal = viewPurchase.items.reduce((s,i) => s + (i.stock || 0) * (i.buyP || 0), 0);
                  const s = settings || {};
                  const headerText = s.purchaseIcon || s.purchaseHeader || '🛒 পারচেজ ইনভয়েস';
                  const footerText = s.purchaseFooter || 'ধন্যবাদ';
                  const fontSize = s.purchaseFontSize || 11;
                  const showLogo = s.purchaseShowLogo !== false;
                  const showAddress = s.purchaseShowAddress !== false;
                  const showSupplier = s.purchaseShowSupplier !== false;
                  const showPhone = s.purchaseShowPhone !== false;
                  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>পারচেজ ইনভয়েস</title>
<style>
@page { size: 80mm auto; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
html { width: 80mm; }
body { font-family:'Tiro Bangla','Courier New',monospace; width:80mm; margin:0; padding:2mm; font-size:${fontSize}px; color:#000; background:#fff; }
.center { text-align:center; }
.border { border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px; }
.row { display:flex; justify-content:space-between; margin:2px 0; }
table { width:100%; border-collapse:collapse; font-size:${fontSize-1}px; }
th { border-bottom:1px dashed #000; padding:3px 0; text-align:left; }
td { padding:3px 0; }
td:nth-child(2) { text-align:center; }
td:nth-child(3), td:nth-child(4) { text-align:right; }
.total { border-top:1px dashed #000; margin-top:5px; padding-top:5px; font-weight:bold; }
.footer { text-align:center; margin-top:10px; border-top:1px dashed #000; padding-top:5px; font-size:${fontSize-2}px; }
</style>
</head>
<body>
<div class="center border">
  ${showLogo ? '<div style="font-size:14px;font-weight:bold;">' + headerText + '</div>' : '<div style="font-weight:bold;">' + headerText.replace(/[^\w\s]/g, '') + '</div>'}
  ${showAddress && s.name ? '<div>' + s.name + '</div>' : ''}
  ${showAddress && s.address ? '<div>' + s.address + '</div>' : ''}
  ${showAddress && s.phone ? '<div>' + s.phone + '</div>' : ''}
  <div>#${viewPurchase.id.slice(-8).toUpperCase()}</div>
  <div>${new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
  ${showSupplier ? '<div>সরবরাহকারী: ' + viewPurchase.supplier + '</div>' : ''}
  ${showPhone && viewPurchase.phone ? '<div>ফোন: ' + viewPurchase.phone + '</div>' : ''}
</div>
<table>
  <thead><tr><th>পণ্য</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th></tr></thead>
  <tbody>`;
                  viewPurchase.items.forEach(item => {
                    const qty = item.stock||0;
                    const price = item.buyP||0;
                    html += `<tr><td>${item.name}<br><span style="font-size:9px;color:#666;">${item.company || ''}</span></td><td>${qty} ${item.unit||'পিস'}</td><td>৳${price.toFixed(2)}</td><td>৳${(qty*price).toFixed(2)}</td></tr>`;
                  });
                  html += `</tbody>
</table>
<div class="total row"><span>সর্বমোট:</span><span>৳${grandTotal.toFixed(2)}</span></div>
<div class="footer">${footerText}<br>${new Date().toLocaleDateString('bn-BD')}</div>
</body>
</html>`;
                  const iframe = document.createElement('iframe');
                  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px;';
                  document.body.appendChild(iframe);
                  iframe.contentWindow.document.open();
                  iframe.contentWindow.document.write(html);
                  iframe.contentWindow.document.close();
                  iframe.contentWindow.onload = function() {
                    setTimeout(() => {
                      iframe.contentWindow.print();
                      document.body.removeChild(iframe);
                    }, 100);
                  };
                }} style={{...btn('primary'),padding:'6px 12px'}}>🖨️ প্রিন্ট</button>
                <button onClick={()=>setViewPurchase(null)} style={{...btn(),padding:'6px 12px'}}>✕</button>
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.gray50}}>
                  <th style={{padding:8,textAlign:'left',fontSize:11,color:T.gray600}}>পণ্যের নাম</th>
                  <th style={{padding:8,textAlign:'center',fontSize:11,color:T.gray600}}>পরিমাণ</th>
                  <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>দাম</th>
                  <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {viewPurchase.items.map((item,i) => {
                  const qty = item.stock || 0;
                  const price = item.buyP || 0;
                  const total = qty * price;
                  return (
                    <tr key={i} style={{borderBottom:'1px solid '+T.gray100}}>
                      <td style={{padding:10,fontSize:13}}>
                        <div style={{fontWeight:600}}>{item.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{item.company} • {item.cat || '-'}</div>
                      </td>
                      <td style={{padding:10,textAlign:'center',fontWeight:600}}>{qty} {item.unit || 'পিস'}</td>
                      <td style={{padding:10,textAlign:'right',fontSize:13}}>{fmt(price)}</td>
                      <td style={{padding:10,textAlign:'right',fontWeight:700,color:T.green}}>{fmt(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{background:T.tealLight}}>
                  <td colSpan={3} style={{padding:10,fontWeight:700,fontSize:13}}>সর্বমোট</td>
                  <td style={{padding:10,textAlign:'right',fontWeight:800,fontSize:16,color:T.teal}}>
                    {fmt(viewPurchase.items.reduce((s,i) => s + (i.stock || 0) * (i.buyP || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Sale Detail Modal */}
      {viewSale && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}} onClick={()=>setViewSale(null)}>
          <div style={{background:T.white,borderRadius:12,padding:20,width:500,maxHeight:'80vh',overflow:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,borderBottom:'2px solid '+T.gray200,paddingBottom:16}}>
              <div>
                <div style={{fontWeight:800,fontSize:18,color:T.teal}}>#{viewSale.id.slice(-6).toUpperCase()}</div>
                <div style={{fontSize:12,color:T.gray500,marginTop:4}}>📅 {new Date(viewSale.date).toLocaleDateString('bn-BD')}</div>
                <div style={{fontSize:13,marginTop:4}}>👤 কাস্টমার: {viewSale.custName}</div>
                {viewSale.phone && <div style={{fontSize:12,color:T.gray500,marginTop:2}}>📱 {viewSale.phone}</div>}
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>{
                  const total = viewSale.total + (viewSale.vat||0);
                  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Sale Receipt</title>
<style>
@page { size: 80mm auto; margin: 0; }
* { margin:0; padding:0; box-sizing:border-box; }
html { width: 80mm; }
body { font-family:'Tiro Bangla','Courier New',monospace; width:80mm; margin:0; padding:2mm; font-size:11px; color:#000; background:#fff; }
.center { text-align:center; }
.border { border-bottom:1px dashed #000; padding-bottom:5px; margin-bottom:5px; }
.row { display:flex; justify-content:space-between; margin:2px 0; }
table { width:100%; border-collapse:collapse; font-size:10px; }
th { border-bottom:1px dashed #000; padding:3px 0; text-align:left; }
td { padding:3px 0; }
td:nth-child(2) { text-align:center; }
td:nth-child(3), td:nth-child(4) { text-align:right; }
.total { border-top:1px dashed #000; margin-top:5px; padding-top:5px; font-weight:bold; }
.footer { text-align:center; margin-top:10px; border-top:1px dashed #000; padding-top:5px; font-size:9px; }
</style>
</head>
<body>
<div class="center border">
  <div style="font-size:14px;font-weight:bold;">🧾 Sale Receipt</div>
  <div>#${viewSale.id.slice(-6).toUpperCase()}</div>
  <div>${new Date(viewSale.date).toLocaleDateString('bn-BD')}</div>
  <div>Customer: ${viewSale.custName}</div>
  ${viewSale.phone ? '<div>Phone: '+viewSale.phone+'</div>' : ''}
</div>
<table>
  <thead><tr><th>পণ্য</th><th>পরিমাণ</th><th>দাম</th><th>মোট</th></tr></thead>
  <tbody>`;
                  (viewSale.items||[]).forEach(item => {
                    html += `<tr><td>${item.name}<br><span style="font-size:9px;color:#666;">${item.company}</span></td><td>${item.qty} ${item.unit||'পিস'}</td><td>৳${item.sellP.toFixed(2)}</td><td>৳${(item.qty*item.sellP).toFixed(2)}</td></tr>`;
                  });
                  html += `</tbody>
</table>
<div class="total row"><span>সাবটোটাল:</span><span>৳${viewSale.total.toFixed(2)}</span></div>`;
                  if(viewSale.vat > 0) html += `<div class="row"><span>VAT (${viewSale.vatRate}%):</span><span>৳${viewSale.vat.toFixed(2)}</span></div>`;
                  html += `<div class="total row"><span>মোট:</span><span>৳${total.toFixed(2)}</span></div>
<div class="row"><span>পরিশোধ:</span><span>৳${viewSale.paid.toFixed(2)}</span></div>`;
                  if(viewSale.due > 0) html += `<div class="total row" style="color:#c00;"><span>বাকি:</span><span>৳${viewSale.due.toFixed(2)}</span></div>`;
                  html += `<div class="footer">ধন্যবাদ<br>${new Date().toLocaleDateString('bn-BD')}</div>
</body>
</html>`;
                  const iframe = document.createElement('iframe');
                  iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px;';
                  document.body.appendChild(iframe);
                  iframe.contentWindow.document.open();
                  iframe.contentWindow.document.write(html);
                  iframe.contentWindow.document.close();
                  iframe.contentWindow.onload = function() {
                    setTimeout(() => {
                      iframe.contentWindow.print();
                      document.body.removeChild(iframe);
                    }, 100);
                  };
                }} style={{...btn('primary'),padding:'6px 12px'}}>🖨️ প্রিন্ট</button>
                <button onClick={()=>setViewSale(null)} style={{...btn(),padding:'6px 12px'}}>✕</button>
              </div>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.gray50}}>
                  <th style={{padding:8,textAlign:'left',fontSize:11,color:T.gray600}}>পণ্যের নাম</th>
                  <th style={{padding:8,textAlign:'center',fontSize:11,color:T.gray600}}>পরিমাণ</th>
                  <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>দাম</th>
                  <th style={{padding:8,textAlign:'right',fontSize:11,color:T.gray600}}>মোট</th>
                </tr>
              </thead>
              <tbody>
                {(viewSale.items||[]).map((item,i) => (
                  <tr key={i} style={{borderBottom:'1px solid '+T.gray100}}>
                    <td style={{padding:10,fontSize:13}}>
                      <div style={{fontWeight:600}}>{item.name}</div>
                      <div style={{fontSize:11,color:T.gray400}}>{item.company} • {item.cat || '-'}</div>
                    </td>
                    <td style={{padding:10,textAlign:'center',fontWeight:600}}>{item.qty} {item.unit || 'পিস'}</td>
                    <td style={{padding:10,textAlign:'right',fontSize:13}}>{fmt(item.sellP)}</td>
                    <td style={{padding:10,textAlign:'right',fontWeight:700,color:T.green}}>{fmt(item.qty * item.sellP)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:T.gray100}}>
                  <td colSpan={3} style={{padding:10,fontWeight:600,fontSize:13}}>সাবটোটাল</td>
                  <td style={{padding:10,textAlign:'right',fontWeight:700,fontSize:14}}>{fmt(viewSale.total)}</td>
                </tr>
                {viewSale.vatEnabled && viewSale.vat > 0 && (
                  <tr style={{background:T.gray100}}>
                    <td colSpan={3} style={{padding:10,fontSize:13,color:T.gray600}}>ভ্যাট ({viewSale.vatRate}%)</td>
                    <td style={{padding:10,textAlign:'right',fontSize:13,color:T.gray600}}>{fmt(viewSale.vat)}</td>
                  </tr>
                )}
                <tr style={{background:T.greenLight}}>
                  <td colSpan={3} style={{padding:10,fontWeight:700,fontSize:13,color:T.green}}>মোট</td>
                  <td style={{padding:10,textAlign:'right',fontWeight:800,fontSize:16,color:T.green}}>{fmt(viewSale.total + (viewSale.vat||0))}</td>
                </tr>
                <tr style={{background:T.greenLight}}>
                  <td colSpan={3} style={{padding:10,fontWeight:600,fontSize:13,color:T.green}}>পরিশোধ হয়েছে</td>
                  <td style={{padding:10,textAlign:'right',fontWeight:700,fontSize:14,color:T.green}}>{fmt(viewSale.paid)}</td>
                </tr>
                {viewSale.due > 0 && (
                  <tr style={{background:T.redLight}}>
                    <td colSpan={3} style={{padding:10,fontWeight:700,fontSize:13,color:T.red}}>বাকি</td>
                    <td style={{padding:10,textAlign:'right',fontWeight:800,fontSize:14,color:T.red}}>{fmt(viewSale.due)}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
/* ═══════════════════════════════════════════
   SETTINGS SCREEN - NEW PROFESSIONAL DESIGN
═══════════════════════════════════════════ */
function SettingsScreen({settings, products, suppliers, categories, purchases, sales, customers, productHistory, upd}) {
  const [form, setForm] = useState({
    name: settings?.name || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    taxId: settings?.taxId || '',
    crNumber: settings?.crNumber || '',
    zatkaApiUrl: settings?.zatkaApiUrl || '',
    zatkaUsername: settings?.zatkaUsername || '',
    zatkaPassword: settings?.zatkaPassword || '',
    zatkaEnabled: settings?.zatkaEnabled || false,
    zatcaPhase: settings?.zatcaPhase || 'phase1',
    zatcaOid: settings?.zatcaOid || '',
    zatcaCsid: settings?.zatcaCsid || '',
    zatcaPrivateKey: settings?.zatcaPrivateKey || '',
    zatcaClientId: settings?.zatcaClientId || '',
    zatcaClientSecret: settings?.zatcaClientSecret || '',
    vatEnabled: settings?.vatEnabled !== false,
    vatPercent: settings?.vatPercent || 15,
    bannerImage: settings?.bannerImage || '',
    receiptHeader: settings?.receiptHeader || '🧾 বিক্রয় রিসিট',
    receiptFooter: settings?.receiptFooter || 'ধন্যবাদ',
    receiptShowLogo: settings?.receiptShowLogo !== false,
    receiptShowAddress: settings?.receiptShowAddress !== false,
    receiptShowPhone: settings?.receiptShowPhone !== false,
    receiptShowCustomer: settings?.receiptShowCustomer !== false,
    receiptShowVat: settings?.receiptShowVat !== false,
    receiptShowQr: settings?.receiptShowQr !== false,
    receiptFontSize: settings?.receiptFontSize || 11,
    receiptLogo: settings?.receiptLogo || '',
    // Purchase Invoice Template
    purchaseHeader: settings?.purchaseHeader || '🛒 পারচেজ ইনভয়েস',
    purchaseFooter: settings?.purchaseFooter || 'ধন্যবাদ',
    purchaseShowLogo: settings?.purchaseShowLogo !== false,
    purchaseShowAddress: settings?.purchaseShowAddress !== false,
    purchaseShowSupplier: settings?.purchaseShowSupplier !== false,
    purchaseShowPhone: settings?.purchaseShowPhone !== false,
    purchaseFontSize: settings?.purchaseFontSize || 11,
    purchaseIcon: settings?.purchaseIcon || '',
  });
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState(() => db.get(STORAGE_KEYS.users) || []);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ email: '', password: '', name: '', role: 'admin' });

  const currentUser = db.get(STORAGE_KEYS.auth);
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const save = async () => {
    await upd.settings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs = [
    { icon: '⚙️', label: 'জেনারেল' },
    { icon: '🎨', label: 'ডিজাইন' },
    { icon: '📊', label: 'রিপোর্ট' },
    { icon: '👥', label: 'ইউজার' },
    { icon: '💾', label: 'ডেটা' },
  ];

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({ email: user.email, password: user.password, name: user.name, role: user.role });
    } else {
      setEditingUser(null);
      setUserForm({ email: '', password: '', name: '', role: 'admin' });
    }
    setShowUserModal(true);
  };

  const saveUser = () => {
    if (!userForm.email || !userForm.password || !userForm.name) {
      alert('সব তথ্য পূরণ করুন!');
      return;
    }
    if (editingUser) {
      const updated = users.map(u => u.id === editingUser.id ? { ...u, ...userForm } : u);
      setUsers(updated);
      db.set(STORAGE_KEYS.users, updated);
    } else {
      const newUser = { ...userForm, id: genId() };
      const updated = [...users, newUser];
      setUsers(updated);
      db.set(STORAGE_KEYS.users, updated);
    }
    setShowUserModal(false);
  };

  const deleteUser = (id) => {
    if (confirm('এই ইউজার মুছে ফেলতে চান?')) {
      const updated = users.filter(u => u.id !== id);
      setUsers(updated);
      db.set(STORAGE_KEYS.users, updated);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('শুধুমাত্র ছবি ফাইল আপলোড করুন!');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ 5MB এর বেশি হওয়া উচিত নয়!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(p => ({...p, bannerImage: event.target.result}));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ 
      height: '100%', 
      overflow: 'auto', 
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      width: '100%'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #115E59 50%, #134E4A 100%)',
        padding: '32px 32px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              ⚙️ সেটিংস
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              আপনার POS সিস্টেম কনফিগার করুন
            </p>
          </div>
          
          {/* Save Button */}
          <button onClick={save} style={{
            padding: '14px 28px',
            background: saved ? '#059669' : 'rgba(255,255,255,0.95)',
            color: saved ? '#fff' : '#0F766E',
            border: 'none',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            transition: 'all 0.3s ease',
            transform: saved ? 'scale(1.05)' : 'scale(1)',
          }}>
            {saved ? '✅ সংরক্ষিত' : '💾 সংরক্ষণ করুন'}
          </button>
        </div>

      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #115E59 50%, #134E4A 100%)',
        padding: '0 32px 16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', gap: 8, overflowX: 'auto' }}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '12px 24px',
                border: 'none',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s ease',
                background: activeTab === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                color: activeTab === i ? '#0F766E' : '#fff',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === i ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 32 }}>
        {/* Business Tab */}
        {activeTab === 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#fff'
              }}>⚙️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>সাধারণ তথ্য</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>আপনার ব্যবসার মূল তথ্য</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🏪 ব্যবসার নাম *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="আপনার ব্যবসার নাম লিখুন"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📞 মোবাইল নম্বর
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({...p, phone: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📍 ঠিকানা
                </label>
                <input
                  value={form.address}
                  onChange={e => setForm(p => ({...p, address: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="আপনার ব্যবসার ঠিকানা লিখুন"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📧 ইমেইল
                </label>
                <input
                  value={form.email || ''}
                  onChange={e => setForm(p => ({...p, email: e.target.value}))}
                  type="email"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🔢 ভ্যাট নম্বর (TIN) *
                </label>
                <input
                  value={form.taxId || ''}
                  onChange={e => setForm(p => ({...p, taxId: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="310xxxxxx"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🏢 কমার্শিয়াল রেজিস্ট্রেশন (CR) *
                </label>
                <input
                  value={form.crNumber || ''}
                  onChange={e => setForm(p => ({...p, crNumber: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="1010xxxxxx"
                />
              </div>
              <div style={{ gridColumn: '1 / -1', padding: '20px 24px', background: '#f8fafc', borderRadius: 12, marginTop: 8, border: '2px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                      🧾 ZATCA ই-ইনভয়েসিং {form.zatkaEnabled ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}
                    </h4>
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b' }}>
                      সৌদি আরবের ZATCA নিয়ম অনুযায়ী ই-ইনভয়েস জমা দিন
                    </p>
                  </div>
                  <button
                    onClick={() => setForm(p => ({...p, zatkaEnabled: !p.zatkaEnabled}))}
                    style={{
                      padding: '10px 20px',
                      background: form.zatkaEnabled ? '#059669' : '#94a3b8',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {form.zatkaEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </button>
                </div>

                {/* Phase Selection */}
                <div style={{ marginBottom: 20 }}>
                  <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F766E' }}>📦 ফেজ সিলেক্ট করুন</h5>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button
                      onClick={() => setForm(p => ({...p, zatcaPhase: 'phase1'}))}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        background: form.zatcaPhase === 'phase1' ? '#0F766E' : '#fff',
                        color: form.zatcaPhase === 'phase1' ? '#fff' : '#64748b',
                        border: form.zatcaPhase === 'phase1' ? '2px solid #0F766E' : '2px solid #e2e8f0',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>📱 Phase 1 (সিমপ্লিফাইড)</div>
                      <div style={{ fontSize: 11, fontWeight: 400, opacity: form.zatcaPhase === 'phase1' ? 0.8 : 0.6 }}>
                        B2C - QR কোড + বেসিক ইনভয়েস (রিসিট)
                      </div>
                    </button>
                    <button
                      onClick={() => setForm(p => ({...p, zatcaPhase: 'phase2'}))}
                      style={{
                        flex: 1,
                        padding: '14px 20px',
                        background: form.zatcaPhase === 'phase2' ? '#0F766E' : '#fff',
                        color: form.zatcaPhase === 'phase2' ? '#fff' : '#64748b',
                        border: form.zatcaPhase === 'phase2' ? '2px solid #0F766E' : '2px solid #e2e8f0',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>🏢 Phase 2 (স্ট্যান্ডার্ড)</div>
                      <div style={{ fontSize: 11, fontWeight: 400, opacity: form.zatcaPhase === 'phase2' ? 0.8 : 0.6 }}>
                        B2B - XML UBL + API ক্লিয়ারেন্স + রিয়েল-টাইম রিপোর্টিং
                      </div>
                    </button>
                  </div>
                </div>

                {/* API Credentials - Common for both phases */}
                <div style={{ marginBottom: 20 }}>
                  <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F766E' }}>🔑 API ক্রেডেনশিয়ালস</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        🌐 API URL
                      </label>
                      <input
                        value={form.zatkaApiUrl || ''}
                        onChange={e => setForm(p => ({...p, zatkaApiUrl: e.target.value}))}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: 14,
                          border: '2px solid #e2e8f0',
                          borderRadius: 8,
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#1e293b',
                          background: '#fff'
                        }}
                        onFocus={e => e.target.style.borderColor = '#0F766E'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        placeholder="https://e-invoice.zatca.gov.sa"
                        disabled={!form.zatkaEnabled}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        👤 ইউজারনেম
                      </label>
                      <input
                        value={form.zatkaUsername || ''}
                        onChange={e => setForm(p => ({...p, zatkaUsername: e.target.value}))}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: 14,
                          border: '2px solid #e2e8f0',
                          borderRadius: 8,
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#1e293b',
                          background: '#fff'
                        }}
                        onFocus={e => e.target.style.borderColor = '#0F766E'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        placeholder="ZATCA ইউজারনেম"
                        disabled={!form.zatkaEnabled}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                        🔐 পাসওয়ার্ড
                      </label>
                      <input
                        value={form.zatkaPassword || ''}
                        onChange={e => setForm(p => ({...p, zatkaPassword: e.target.value}))}
                        type="password"
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          fontSize: 14,
                          border: '2px solid #e2e8f0',
                          borderRadius: 8,
                          outline: 'none',
                          boxSizing: 'border-box',
                          color: '#1e293b',
                          background: '#fff'
                        }}
                        onFocus={e => e.target.style.borderColor = '#0F766E'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                        placeholder="ZATCA পাসওয়ার্ড"
                        disabled={!form.zatkaEnabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Phase 1 Fields - CSID for Simplified Invoices */}
                {form.zatcaPhase === 'phase1' && (
                  <div style={{ marginBottom: 20 }}>
                    <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F766E' }}>🔐 Phase 1 ক্রিপ্টোগ্রাফিক আইডেন্টিফায়ার</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                          🏷️ OID (Organizational Identifier)
                        </label>
                        <input
                          value={form.zatcaOid || ''}
                          onChange={e => setForm(p => ({...p, zatcaOid: e.target.value}))}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: 14,
                            border: '2px solid #e2e8f0',
                            borderRadius: 8,
                            outline: 'none',
                            boxSizing: 'border-box',
                            color: '#1e293b',
                            background: '#fff'
                          }}
                          onFocus={e => e.target.style.borderColor = '#0F766E'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          placeholder="1.2.3.4.5.6.7.8.9"
                          disabled={!form.zatkaEnabled}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                          🆔 CSID (Cryptographic Stamp ID)
                        </label>
                        <input
                          value={form.zatcaCsid || ''}
                          onChange={e => setForm(p => ({...p, zatcaCsid: e.target.value}))}
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            fontSize: 14,
                            border: '2px solid #e2e8f0',
                            borderRadius: 8,
                            outline: 'none',
                            boxSizing: 'border-box',
                            color: '#1e293b',
                            background: '#fff'
                          }}
                          onFocus={e => e.target.style.borderColor = '#0F766E'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                          placeholder="CSID-XXXXXXXX"
                          disabled={!form.zatkaEnabled}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Phase 2 Fields - More complex requirements */}
                {form.zatcaPhase === 'phase2' && (
                  <>
                    <div style={{ marginBottom: 20 }}>
                      <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F766E' }}>🔐 Phase 2 ক্রিপ্টোগ্রাফিক আইডেন্টিফায়ার</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            🏷️ OID (Organizational Identifier)
                          </label>
                          <input
                            value={form.zatcaOid || ''}
                            onChange={e => setForm(p => ({...p, zatcaOid: e.target.value}))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: 14,
                              border: '2px solid #e2e8f0',
                              borderRadius: 8,
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: '#1e293b',
                              background: '#fff'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0F766E'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="1.2.3.4.5.6.7.8.9"
                            disabled={!form.zatkaEnabled}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            🆔 CSID (Cryptographic Stamp ID)
                          </label>
                          <input
                            value={form.zatcaCsid || ''}
                            onChange={e => setForm(p => ({...p, zatcaCsid: e.target.value}))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: 14,
                              border: '2px solid #e2e8f0',
                              borderRadius: 8,
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: '#1e293b',
                              background: '#fff'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0F766E'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="CSID-XXXXXXXX"
                            disabled={!form.zatkaEnabled}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            🔑 প্রাইভেট কী (Private Key)
                          </label>
                          <input
                            value={form.zatcaPrivateKey || ''}
                            onChange={e => setForm(p => ({...p, zatcaPrivateKey: e.target.value}))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: 14,
                              border: '2px solid #e2e8f0',
                              borderRadius: 8,
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: '#1e293b',
                              background: '#fff'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0F766E'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="-----BEGIN EC PRIVATE KEY-----"
                            disabled={!form.zatkaEnabled}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phase 2 - OAuth2 Client Credentials */}
                    <div style={{ marginBottom: 20 }}>
                      <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#0F766E' }}>🔑 OAuth2 Client Credentials (Phase 2 এর জন্য প্রয়োজন)</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            🆔 Client ID
                          </label>
                          <input
                            value={form.zatcaClientId || ''}
                            onChange={e => setForm(p => ({...p, zatcaClientId: e.target.value}))}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: 14,
                              border: '2px solid #e2e8f0',
                              borderRadius: 8,
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: '#1e293b',
                              background: '#fff'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0F766E'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="Client ID from ZATCA Portal"
                            disabled={!form.zatkaEnabled}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#475569' }}>
                            🔐 Client Secret
                          </label>
                          <input
                            value={form.zatcaClientSecret || ''}
                            onChange={e => setForm(p => ({...p, zatcaClientSecret: e.target.value}))}
                            type="password"
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              fontSize: 14,
                              border: '2px solid #e2e8f0',
                              borderRadius: 8,
                              outline: 'none',
                              boxSizing: 'border-box',
                              color: '#1e293b',
                              background: '#fff'
                            }}
                            onFocus={e => e.target.style.borderColor = '#0F766E'}
                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                            placeholder="Client Secret from ZATCA Portal"
                            disabled={!form.zatkaEnabled}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ZATCA Required Fields Info */}
                <div style={{ marginTop: 16, padding: '12px 16px', background: form.zatcaPhase === 'phase1' ? '#ecfdf5' : '#dbeafe', borderRadius: 8, border: `1px solid ${form.zatcaPhase === 'phase1' ? '#059669' : '#3b82f6'}` }}>
                  <p style={{ margin: 0, fontSize: 12, color: form.zatcaPhase === 'phase1' ? '#065f46' : '#1e40af' }}>
                    <strong>📋 {form.zatcaPhase === 'phase1' ? 'Phase 1 QR কোডে যা থাকবে:' : 'Phase 2 ইনভয়েসে যা থাকবে:'}</strong><br/>
                    {form.zatcaPhase === 'phase1' ? (
                      <>বিক্রেতার নাম • VAT নম্বর • CR নম্বর • ইনভয়েস তারিখ • মোট পরিমাণ (VAT সহ) • VAT পরিমাণ</>
                    ) : (
                      <>বিক্রেতার নাম • VAT নম্বর • CR নম্বর • ইনভয়েস তারিখ • মোট পরিমাণ (VAT সহ) • VAT পরিমাণ • UUID • হ্যাশ মান • XML UBL 2.1 ফরম্যাট • রিয়েল-টাইম ক্লিয়ারেন্স API</>
                    )}
                  </p>
                </div>

                {/* VAT Settings */}
                <div style={{ marginTop: 24 }}>
                  <h5 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>💰 ভ্যাট সেটিংস</h5>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: form.vatEnabled ? '#ecfdf5' : '#fef2f2',
                    borderRadius: 12,
                    border: `2px solid ${form.vatEnabled ? '#059669' : '#ef4444'}`
                  }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>
                        ভ্যাট সক্রিয় {form.vatEnabled ? '✅' : '❌'}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                        {form.vatEnabled ? 'সকল বিক্রয়ে ভ্যাট যোগ হবে' : 'ভ্যাট গণনা বন্ধ আছে'}
                      </p>
                    </div>
                    <button
                      onClick={() => setForm(p => ({...p, vatEnabled: !p.vatEnabled}))}
                      style={{
                        padding: '10px 20px',
                        background: form.vatEnabled ? '#059669' : '#94a3b8',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {form.vatEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                    </button>
                  </div>

                  {form.vatEnabled && (
                    <div style={{
                      marginTop: 16,
                      padding: '20px 24px',
                      background: '#f0fdf4',
                      borderRadius: 12,
                      border: '2px solid #86efac',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16
                    }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
                        ডিফল্ট ভ্যাট শতাংশ:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          value={form.vatPercent}
                          onChange={e => setForm(p => ({...p, vatPercent: parseFloat(e.target.value) || 0}))}
                          type="number"
                          min="0"
                          max="100"
                          style={{
                            width: 100,
                            padding: '12px 14px',
                            fontSize: 16,
                            fontWeight: 700,
                            border: '2px solid #86efac',
                            borderRadius: 8,
                            outline: 'none',
                            textAlign: 'center',
                            color: '#166534',
                            background: '#fff'
                          }}
                        />
                        <span style={{ fontSize: 18, fontWeight: 700, color: '#166534' }}>%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 1 && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#fff'
              }}>🎨</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>ডিজাইন সেটিংস</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>রিসিট টেমপ্লেট ও হোম পেজ ব্যানার</p>
              </div>
            </div>

            {/* 2 Column Layout: Settings | Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>

              {/* Left Column - Settings */}
              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>🧾 থার্মাল রিসিট টেমপ্লেট</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      হেডার টাইটেল
                    </label>
                    <input
                      value={form.receiptHeader || ''}
                      onChange={e => setForm(p => ({...p, receiptHeader: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        border: '2px solid #e2e8f0',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#1e293b',
                        background: '#f8fafc'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0F766E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      placeholder="🧾 বিক্রয় রিসিট"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      ফুটার টেক্সট
                    </label>
                    <input
                      value={form.receiptFooter || ''}
                      onChange={e => setForm(p => ({...p, receiptFooter: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        border: '2px solid #e2e8f0',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#1e293b',
                        background: '#f8fafc'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0F766E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      placeholder="ধন্যবাদ"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      আইকন
                    </label>
                    <input
                      value={form.receiptLogo || ''}
                      onChange={e => setForm(p => ({...p, receiptLogo: e.target.value}))}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        border: '2px solid #e2e8f0',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#1e293b',
                        background: '#f8fafc'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0F766E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      placeholder="🖼️"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                      ফন্ট সাইজ
                    </label>
                    <select
                      value={form.receiptFontSize || 11}
                      onChange={e => setForm(p => ({...p, receiptFontSize: parseInt(e.target.value)}))}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        fontSize: 14,
                        border: '2px solid #e2e8f0',
                        borderRadius: 8,
                        outline: 'none',
                        color: '#1e293b',
                        background: '#f8fafc'
                      }}
                      onFocus={e => e.target.style.borderColor = '#0F766E'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    >
                      <option value={9}>ছোট (৯px)</option>
                      <option value={10}>মাঝারি ছোট (১০px)</option>
                      <option value={11}>মাঝারি (১১px)</option>
                      <option value={12}>বড় (১২px)</option>
                    </select>
                  </div>
                </div>

                <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '2px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#475569' }}>প্রদর্শন অপশন</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[
                      { key: 'receiptShowLogo', label: 'লোগো/আইকন' },
                      { key: 'receiptShowAddress', label: 'ঠিকানা' },
                      { key: 'receiptShowPhone', label: 'ফোন নম্বর ও ভ্যাট' },
                      { key: 'receiptShowCustomer', label: 'গ্রাহক তথ্য' },
                      { key: 'receiptShowVat', label: 'ভ্যাট তথ্য' },
                      { key: 'receiptShowQr', label: 'QR কোড' },
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form[item.key] !== false}
                          onChange={e => setForm(p => ({...p, [item.key]: e.target.checked}))}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0F766E' }}
                        />
                        <span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Receipt Preview */}
              <div>
                <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>👁️ প্রিভিউ</h4>
                <div style={{
                  background: '#f1f5f9',
                  borderRadius: 12,
                  padding: 20,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    background: '#fff',
                    padding: `${form.receiptFontSize}px`,
                    width: 260,
                    minHeight: 380,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    fontSize: `${form.receiptFontSize}px`,
                    fontFamily: "'Tiro Bangla', 'Courier New', monospace",
                    color: '#000'
                  }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                      {form.receiptShowLogo !== false && (
                        <div style={{ fontWeight: 'bold', fontSize: `${form.receiptFontSize + 3}px` }}>
                          {form.receiptLogo || form.receiptHeader || '🧾 বিক্রয় রিসিট'}
                        </div>
                      )}
                      {form.receiptShowAddress !== false && form.name && (
                        <div style={{ fontSize: `${form.receiptFontSize - 1}px` }}>{form.name}</div>
                      )}
                      {form.receiptShowAddress !== false && form.address && (
                        <div style={{ fontSize: `${form.receiptFontSize - 2}px` }}>{form.address}</div>
                      )}
                      {form.receiptShowPhone !== false && form.phone && (
                        <div style={{ fontSize: `${form.receiptFontSize - 2}px` }}>{form.phone}</div>
                      )}
                      {form.receiptShowPhone !== false && form.taxId && (
                        <div style={{ fontSize: `${form.receiptFontSize - 2}px` }}>VAT: {form.taxId}</div>
                      )}
                      <div style={{ fontSize: `${form.receiptFontSize - 1}px`, marginTop: 4 }}>#ABC12345</div>
                      <div style={{ fontSize: `${form.receiptFontSize - 2}px` }}>২ আগস্ট, ২০২৬</div>
                    </div>

                    {/* Customer */}
                    {form.receiptShowCustomer !== false && (
                      <div style={{ marginBottom: 8, fontSize: `${form.receiptFontSize - 1}px` }}>
                        <div>গ্রাহক: মোঃ রহিম উদ্দিন</div>
                        <div>ফোন: ০১৭XXXXXXXX</div>
                      </div>
                    )}

                    {/* Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${form.receiptFontSize - 1}px` }}>
                      <thead>
                        <tr style={{ borderBottom: '1px dashed #000' }}>
                          <th style={{ textAlign: 'left', padding: '4px 0' }}>পণ্য</th>
                          <th style={{ textAlign: 'center', padding: '4px 0' }}>পরি</th>
                          <th style={{ textAlign: 'right', padding: '4px 0' }}>দাম</th>
                          <th style={{ textAlign: 'right', padding: '4px 0' }}>মোট</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0' }}>
                            পণ্য নাম ১<br/>
                            <span style={{ fontSize: `${form.receiptFontSize - 3}px`, color: '#666' }}>কোম্পানি</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 0' }}>2</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳50</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳100</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px 0' }}>
                            পণ্য নাম ২<br/>
                            <span style={{ fontSize: `${form.receiptFontSize - 3}px`, color: '#666' }}>কোম্পানি</span>
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 0' }}>1</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳75</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳75</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div style={{ borderTop: '1px dashed #000', marginTop: 8, paddingTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${form.receiptFontSize - 1}px` }}>
                        <span>সাবটোটাল:</span>
                        <span>৳175</span>
                      </div>
                      {form.receiptShowVat !== false && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${form.receiptFontSize - 1}px` }}>
                          <span>ভ্যাট (১৫%):</span>
                          <span>৳26.25</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: 4, paddingTop: 4 }}>
                        <span>মোট:</span>
                        <span>৳201.25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${form.receiptFontSize - 1}px` }}>
                        <span>পরিশোধ:</span>
                        <span>৳210</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: `${form.receiptFontSize - 1}px` }}>
                        <span>ফেরত:</span>
                        <span>৳8.75</span>
                      </div>
                    </div>

                    {/* QR Code - ZATCA Demo */}
                    {form.receiptShowQr !== false && (
                      <div style={{ textAlign: 'center', marginTop: 12, fontSize: `${form.receiptFontSize - 1}px` }}>
                        <div style={{
                          width: 64,
                          height: 64,
                          margin: '0 auto 6px',
                          padding: 4,
                          background: '#fff',
                          border: '2px solid #000',
                          borderRadius: 2
                        }}>
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: `repeating-linear-gradient(0deg, #000 0px, #000 2px, #fff 2px, #fff 4px),
                                         repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px),
                                         repeating-linear-gradient(45deg, transparent 0px, transparent 2px, #fff 2px, #fff 4px),
                                         repeating-linear-gradient(-45deg, transparent 0px, transparent 2px, #fff 2px, #fff 4px)`,
                            backgroundSize: '4px 4px, 4px 4px, 8px 8px, 8px 8px',
                            backgroundPosition: '0 0, 0 0, 2px 2px, -2px 2px'
                          }}></div>
                        </div>
                        <div style={{ color: '#000', fontWeight: 700, fontSize: '8px' }}>
                          🧾 ZATCA QR
                        </div>
                        <div style={{ color: '#666', fontSize: '6px', marginTop: 2 }}>
                          ডেমো
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div style={{ textAlign: 'center', borderTop: '1px dashed #000', marginTop: 12, paddingTop: 8, fontSize: `${form.receiptFontSize - 2}px` }}>
                      {form.receiptFooter || 'ধন্যবাদ'}<br/>
                      ২ আগস্ট, ২০২৬
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Purchase Invoice Template */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '32px 0 24px' }} />
            <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>🛒 পারচেজ ইনভয়েস প্রিন্ট টেমপ্লেট</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  হেডার টাইটেল
                </label>
                <input
                  value={form.purchaseHeader || ''}
                  onChange={e => setForm(p => ({...p, purchaseHeader: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    border: '2px solid #e2e8f0',
                    borderRadius: 8,
                    outline: 'none',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="🛒 পারচেজ ইনভয়েস"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  ফুটার টেক্সট
                </label>
                <input
                  value={form.purchaseFooter || ''}
                  onChange={e => setForm(p => ({...p, purchaseFooter: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    border: '2px solid #e2e8f0',
                    borderRadius: 8,
                    outline: 'none',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="ধন্যবাদ"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  আইকন
                </label>
                <input
                  value={form.purchaseIcon || ''}
                  onChange={e => setForm(p => ({...p, purchaseIcon: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    border: '2px solid #e2e8f0',
                    borderRadius: 8,
                    outline: 'none',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="🛒"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  ফন্ট সাইজ
                </label>
                <select
                  value={form.purchaseFontSize || 11}
                  onChange={e => setForm(p => ({...p, purchaseFontSize: parseInt(e.target.value)}))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    border: '2px solid #e2e8f0',
                    borderRadius: 8,
                    outline: 'none',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value={9}>ছোট (৯px)</option>
                  <option value={10}>মাঝারি ছোট (১০px)</option>
                  <option value={11}>মাঝারি (১১px)</option>
                  <option value={12}>বড় (১২px)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '2px solid #e2e8f0' }}>
                  <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#475569' }}>প্রদর্শন অপশন</h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    {[
                      { key: 'purchaseShowLogo', label: 'লোগো/আইকন' },
                      { key: 'purchaseShowAddress', label: 'ঠিকানা' },
                      { key: 'purchaseShowSupplier', label: 'সাপ্লায়ার তথ্য' },
                      { key: 'purchaseShowPhone', label: 'ফোন নম্বর' },
                    ].map(item => (
                      <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={form[item.key] !== false}
                          onChange={e => setForm(p => ({...p, [item.key]: e.target.checked}))}
                          style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#0F766E' }}
                        />
                        <span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Purchase Preview */}
              <div>
                <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>👁️ প্রিভিউ</h5>
                <div style={{
                  background: '#f1f5f9',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    background: '#fff',
                    padding: `${form.purchaseFontSize || 11}px`,
                    width: 240,
                    minHeight: 300,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    fontSize: `${form.purchaseFontSize || 11}px`,
                    fontFamily: "'Tiro Bangla', 'Courier New', monospace",
                    color: '#000'
                  }}>
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                      {form.purchaseShowLogo !== false && (
                        <div style={{ fontWeight: 'bold', fontSize: `${(form.purchaseFontSize || 11) + 3}px` }}>
                          {form.purchaseIcon || form.purchaseHeader || '🛒 পারচেজ ইনভয়েস'}
                        </div>
                      )}
                      {form.purchaseShowAddress !== false && form.name && (
                        <div style={{ fontSize: `${(form.purchaseFontSize || 11) - 1}px` }}>{form.name}</div>
                      )}
                      {form.purchaseShowAddress !== false && form.address && (
                        <div style={{ fontSize: `${(form.purchaseFontSize || 11) - 2}px` }}>{form.address}</div>
                      )}
                      {form.purchaseShowAddress !== false && form.phone && (
                        <div style={{ fontSize: `${(form.purchaseFontSize || 11) - 2}px` }}>{form.phone}</div>
                      )}
                      <div style={{ fontSize: `${(form.purchaseFontSize || 11) - 1}px`, marginTop: 4 }}>#ABC12345</div>
                      <div style={{ fontSize: `${(form.purchaseFontSize || 11) - 2}px` }}>২ আগস্ট, ২০২৬</div>
                    </div>
                    {form.purchaseShowSupplier !== false && (
                      <div style={{ marginBottom: 8, fontSize: `${(form.purchaseFontSize || 11) - 1}px` }}>
                        <div>সরবরাহকারী: সাপ্লায়ার নাম</div>
                        {form.purchaseShowPhone && <div>ফোন: ০১৭XXXXXXXX</div>}
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: `${(form.purchaseFontSize || 11) - 1}px` }}>
                      <thead>
                        <tr style={{ borderBottom: '1px dashed #000' }}>
                          <th style={{ textAlign: 'left', padding: '4px 0' }}>পণ্য</th>
                          <th style={{ textAlign: 'center', padding: '4px 0' }}>পরি</th>
                          <th style={{ textAlign: 'right', padding: '4px 0' }}>দাম</th>
                          <th style={{ textAlign: 'right', padding: '4px 0' }}>মোট</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px 0' }}>পণ্য নাম</td>
                          <td style={{ textAlign: 'center', padding: '4px 0' }}>10</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳50</td>
                          <td style={{ textAlign: 'right', padding: '4px 0' }}>৳500</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ borderTop: '1px dashed #000', marginTop: 8, paddingTop: 8, textAlign: 'right', fontWeight: 'bold' }}>
                      সর্বমোট: ৳500
                    </div>
                    <div style={{ textAlign: 'center', borderTop: '1px dashed #000', marginTop: 12, paddingTop: 8, fontSize: `${(form.purchaseFontSize || 11) - 2}px` }}>
                      {form.purchaseFooter || 'ধন্যবাদ'}<br/>
                      ২ আগস্ট, ২০২৬
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Home Page Banner Section - Below the 2-column grid */}
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0 0 24px' }} />
            <h4 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>🏠 হোম পেজ ব্যানার ছবি</h4>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              বিক্রয় পেজে ডিফল্টে দেখানোর জন্য একটি ছবি আপলোড করুন। কোম্পানি/ক্যাটাগরি সিলেক্ট করলে এই ছবি লুকিয়ে যাবে।
            </p>

            {form.bannerImage && (
              <div style={{
                marginBottom: 20,
                position: 'relative',
                borderRadius: 14,
                overflow: 'hidden',
                maxWidth: 500
              }}>
                <img src={form.bannerImage} alt="Banner" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <button
                  onClick={() => setForm(p => ({...p, bannerImage: ''}))}
                  style={{
                    position: 'absolute',
                    top: 12, right: 12,
                    padding: '10px 16px',
                    background: 'rgba(0,0,0,0.8)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  ✕ মুছুন
                </button>
              </div>
            )}

            <label style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              padding: '40px',
              border: '2px dashed #cbd5e1',
              borderRadius: 14,
              cursor: 'pointer',
              background: '#f8fafc',
              transition: 'all 0.2s',
              fontSize: 14,
              color: '#64748b'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#0F766E'; e.currentTarget.style.background = '#f0fdfa'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <span style={{ fontSize: 36 }}>📁</span>
              <span>ছবি আপলোড করুন (JPG, PNG - সর্বোচ্চ 5MB)</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 2 && (
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 32,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <div style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: '#fff'
              }}>📊</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>রিপোর্ট সেটিংস</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>বিভিন্ন রিপোর্টের সেটিংস</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              {[
                { l: '📦 পণ্য স্টক রিপোর্ট', d: 'সকল পণ্যের স্টক তথ্য' },
                { l: '📈 বিক্রয় রিপোর্ট', d: 'বিক্রয় সম্পর্কিত সব তথ্য' },
                { l: '💰 আয়-ব্যয় রিপোর্ট', d: 'আয় ও ব্যয়ের হিসাব' },
                { l: '👥 কাস্টমার রিপোর্ট', d: 'কাস্টমার তথ্য ও লেনদেন' },
              ].map((r, i) => (
                <div key={i} style={{
                  padding: 24,
                  background: '#f8fafc',
                  borderRadius: 14,
                  border: '2px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s'
                }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{r.l}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{r.d}</div>
                  </div>
                  <div style={{
                    padding: '8px 16px',
                    background: '#059669',
                    color: '#fff',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700
                  }}>সক্রিয়</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 3 && (
          isSuperAdmin ? (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48,
                    background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    color: '#fff'
                  }}>👥</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>ইউজার ম্যানেজমেন্ট</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>সিস্টেম ইউজার যোগ ও পরিচালনা</p>
                  </div>
                </div>
                <button
                  onClick={() => openUserModal()}
                  style={{
                    padding: '14px 24px',
                    background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 4px 12px rgba(15,118,110,0.3)'
                  }}
                >
                  ➕ নতুন ইউজার
                </button>
              </div>

              <div style={{
                padding: '16px 20px',
                background: '#f0fdfa',
                borderRadius: 12,
                border: '1px solid #99f6e4',
                marginBottom: 24
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#115e59', lineHeight: 1.6 }}>
                  👑 সুপার এডমিন (admin@konok.io) সবসময় সক্রিয় থাকে এবং মুছে যায় না।
                </p>
              </div>

              {/* Super Admin */}
              <div style={{
                padding: 20,
                background: '#f0fdfa',
                borderRadius: 14,
                border: '2px solid #0F766E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 48, height: 48,
                    background: '#0F766E',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    color: '#fff'
                  }}>👑</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Super Admin</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>admin@konok.io</div>
                  </div>
                </div>
                <div style={{
                  padding: '8px 16px',
                  background: '#0F766E',
                  color: '#fff',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700
                }}>👑 সুপার</div>
              </div>

              {/* Users */}
              {users.map(u => (
                <div key={u.id} style={{
                  padding: 20,
                  background: '#f8fafc',
                  borderRadius: 14,
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                      width: 48, height: 48,
                      background: '#115E59',
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: '#fff',
                      fontWeight: 700
                    }}>{u.name?.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{u.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{u.email}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      padding: '6px 14px',
                      background: u.role === 'admin' ? '#64748b' : '#f59e0b',
                      color: '#fff',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {u.role === 'admin' ? '🛡️ এডমিন' : '🛒 অপারেটর'}
                    </div>
                    <button
                      onClick={() => openUserModal(u)}
                      style={{
                        padding: '8px 14px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >✏️</button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      style={{
                        padding: '8px 14px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 14
                      }}
                    >🗑️</button>
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                  <div style={{ fontSize: 15 }}>কোনো ইউজার নেই</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 64,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🔒</div>
              <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: '#374151' }}>এক্সেস সীমাবদ্ধ</h3>
              <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>শুধুমাত্র সুপার এডমিন এই পেজ দেখতে পারবেন।</p>
            </div>
          )
        )}

        {/* Data Tab */}
        {activeTab === 4 && (
          <div>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 32,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48,
                  background: '#dc2626',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: '#fff'
                }}>⚠️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>ডেটা রিসেট</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>ডেটা মুছে ফেলার জন্য সতর্ক ব্যবহার করুন</p>
                </div>
              </div>

              <div style={{
                padding: '16px 20px',
                background: '#fef2f2',
                borderRadius: 12,
                border: '1px solid #fecaca',
                marginBottom: 24
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#dc2626', lineHeight: 1.6 }}>
                  ⚠️ সতর্কতা: নিচের অপশনগুলো ব্যবহারে ডেটা স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { l: '📦 পণ্য ডেটা', c: products.length, btn: 'সব পণ্য মুছে ফেলুন', fn: () => { if(confirm('সব পণ্য মুছে ফেলবেন?')) { upd.products([]); alert('পণ্য মুছা হয়েছে।'); } } },
                  { l: '🏢 কোম্পানি ডেটা', c: suppliers.length, btn: 'সব কোম্পানি মুছে ফেলুন', fn: () => { if(confirm('সব কোম্পানি মুছে ফেলবেন?')) { upd.suppliers([]); alert('কোম্পানি মুছা হয়েছে।'); } } },
                  { l: '📂 ক্যাটাগরি ডেটা', c: categories.length, btn: 'সব ক্যাটাগরি মুছে ফেলুন', fn: () => { if(confirm('সব ক্যাটাগরি মুছে ফেলবেন?')) { upd.categories([]); alert('ক্যাটাগরি মুছা হয়েছে।'); } } },
                  { l: '🛒 বিক্রয় ডেটা', c: sales.length, btn: 'সব বিক্রয় মুছে ফেলুন', fn: () => { if(confirm('সব বিক্রয় মুছে ফেলবেন?')) { upd.sales([]); alert('বিক্রয় মুছা হয়েছে।'); } } },
                  { l: '💰 পণ্যের ক্রয়-বিক্রয় দাম পূর্ণ-নির্ধারণ', c: productHistory.filter(h => h.type === 'price_buy' || h.type === 'price_sell').length, btn: 'সব দাম হিস্ট্রি মুছে ফেলুন', fn: () => { if(confirm('সব দাম হিস্ট্রি মুছে ফেলবেন?')) { upd.productHistory(productHistory.filter(h => h.type !== 'price_buy' && h.type !== 'price_sell')); alert('দাম হিস্ট্রি মুছা হয়েছে।'); } } },
                  { l: '📊 স্টক কমানো-বাড়ানো ডেটা', c: productHistory.filter(h => h.type === 'stock').length, btn: 'স্টক হিস্ট্রি মুছে ফেলুন', fn: () => { if(confirm('স্টক হিস্ট্রি মুছে ফেলবেন?')) { upd.productHistory(productHistory.filter(h => h.type !== 'stock')); alert('স্টক হিস্ট্রি মুছা হয়েছে।'); } } },
                  { l: '👥 কাস্টমার ডেটা', c: customers.length, btn: 'সব কাস্টমার মুছে ফেলুন', fn: () => { if(confirm('সব কাস্টমার মুছে ফেলবেন?')) { upd.customers([]); alert('কাস্টমার মুছা হয়েছে।'); } } },
                  { l: '🛒 পারচেজ হিস্ট্রি', c: purchases.length, btn: 'সব পারচেজ হিস্ট্রি মুছে ফেলুন', fn: () => { if(confirm('সব পারচেজ হিস্ট্রি মুছে ফেলবেন?')) { upd.purchases([]); alert('পারচেজ হিস্ট্রি মুছা হয়েছে।'); } } },
                  { l: '👤 সকল ইউজার (সুপার এডমিন ছাড়া)', c: users.length, btn: 'সব ইউজার মুছে ফেলুন', fn: () => { if(confirm('সুপার এডমিন ছাড়া সব ইউজার মুছে ফেলবেন?')) { setUsers([]); db.set('pos_users', []); alert('সব ইউজার মুছা হয়েছে।'); } } },
                ].map((d, i) => (
                  <div key={i} style={{
                    padding: 24,
                    background: '#fef2f2',
                    borderRadius: 14,
                    border: '1px solid #fecaca'
                  }}>
                    <h4 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{d.l}</h4>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>মোট {d.c}টি আইটেম</p>
                    <button
                      onClick={d.fn}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      🗑️ {d.btn}
                    </button>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 24,
                padding: 24,
                background: '#fef2f2',
                borderRadius: 14,
                border: '2px solid #ef4444'
              }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#dc2626' }}>💥 সম্পূর্ণ রিসেট</h4>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>সমস্ত ডেটা মুছে ফেলুন। এটি পূর্বাবস্থায় ফেরানো যাবে না।</p>
                <button
                  onClick={() => {
                    if(confirm('⚠️ সত্যিই সব ডেটা মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।')) {
                      localStorage.clear();
                      db.set('pos_reset_done', true);
                      alert('সব ডেটা মুছা হয়েছে।');
                      window.location.reload();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    background: '#991b1b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  💥 সব ডেটা মুছুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: 36,
            width: '100%',
            maxWidth: 460,
            boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
                {editingUser ? '✏️ ইউজার এডিট করুন' : '➕ নতুন ইউজার যোগ করুন'}
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  padding: '10px 14px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 18,
                  color: '#64748b'
                }}
              >✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  👤 নাম
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm(p => ({...p, name: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="ইউজারের নাম"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📧 ইমেইল
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(p => ({...p, email: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🔐 পাসওয়ার্ড
                </label>
                <input
                  type="text"
                  value={userForm.password}
                  onChange={e => setUserForm(p => ({...p, password: e.target.value}))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    border: '2px solid #e2e8f0',
                    borderRadius: 10,
                    outline: 'none',
                    boxSizing: 'border-box',
                    color: '#1e293b',
                    background: '#f8fafc'
                  }}
                  onFocus={e => e.target.style.borderColor = '#0F766E'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  placeholder="পাসওয়ার্ড"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 10, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🎭 রোল নির্বাচন করুন
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { v: 'operator', l: '🛒 অপারেটর' },
                    { v: 'admin', l: '🛡️ এডমিন' },
                    { v: 'super_admin', l: '👑 সুপার' },
                  ].map(r => (
                    <button
                      key={r.v}
                      type="button"
                      onClick={() => setUserForm(p => ({...p, role: r.v}))}
                      style={{
                        flex: 1,
                        padding: '12px 8px',
                        background: userForm.role === r.v ? '#0F766E' : '#f1f5f9',
                        color: userForm.role === r.v ? '#fff' : '#64748b',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {r.l}
                    </button>
                  ))}
                </div>
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>
                  সুপার = সব এক্সেস | এডমিন = সব (ইউজার ছাড়া) | অপারেটর = শুধু বিক্রয়
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 28 }}>
              <button
                onClick={() => setShowUserModal(false)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >বাতিল</button>
              <button
                onClick={saveUser}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(15,118,110,0.3)'
                }}
              >
                💾 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
