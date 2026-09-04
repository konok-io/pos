import { useState, useEffect, useRef } from 'react';
import { Icon } from './components/Icon';
import './index.css';
import { useLanguage, languages, defaultTranslations, Language } from './i18n';
import { db } from './utils/db';
import { localDb, initDatabase } from './services';

// Design Tokens
const T = {
  teal: '#0F766E',
  tealDark: '#115E59',
  tealLight: '#F0FDFA',
  tealMid: '#CCFBF1',
  orange: '#EA580C',
  orangeLight: '#FFF7ED',
  green: '#16A34A',
  greenLight: '#F0FDF4',
  red: '#DC2626',
  redLight: '#FEF2F2',
  amber: '#D97706',
  amberLight: '#FFFBEB',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray800: '#1F2937',
  gray900: '#111827',
  white: '#FFFFFF',
};

const btn = (type: string = 'default', size: string = 'md') => {
  const bgMap: Record<string, string> = { primary: T.teal, sell: T.orange, success: T.green, danger: T.red, ghost: 'transparent', default: T.gray100 };
  const colorMap: Record<string, string> = { primary: T.white, sell: T.white, success: T.white, danger: T.white, ghost: T.gray600, default: T.gray800 };
  const bg = bgMap[type] || bgMap.default;
  const color = colorMap[type] || colorMap.default;
  const border = type === 'ghost' ? `1px solid ${T.gray200}` : 'none';
  const padding = size === 'sm' ? '5px 10px' : size === 'lg' ? '12px 24px' : '8px 14px';
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 16 : 15;
  return {
    padding,
    fontSize,
    background: bg,
    color,
    border,
    borderRadius: 7,
    cursor: 'pointer' as const,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    
    transition: 'all 0.15s',
  };
};

const cardStyle = {
  background: T.white,
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  border: `1px solid ${T.gray200}`,
};

const inputStyle = {
  padding: '8px 12px',
  border: `1px solid ${T.gray200}`,
  borderRadius: 7,
  fontSize: 14,
  outline: 'none',
  width: '100%' as const,
  boxSizing: 'border-box' as const,
  fontFamily: 'inherit',
  background: T.white,
  color: T.gray900,
  transition: 'border-color 0.15s',
};

const labelStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: T.gray400,
  marginBottom: 4,
  display: 'block' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const fmt = (n: number) => `৳${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n: number) => (+n || 0).toLocaleString('en-IN');

// Fixed General Customer ID
const GENERAL_CUSTOMER_ID = '2000010112345';

// Generate General Customer ID (kept for backward compatibility)
const generateGeneralCustomerId = () => {
  return GENERAL_CUSTOMER_ID;
};

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  createdAt: string;
}

// User Management Component
interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  t: (key: string) => string;
}

function UserManagement({ users, setUsers, t }: UserManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    isActive: true
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load users from server on mount
  useEffect(() => {
    db.getAll<any>('users').then((serverUsers: any) => {
      if (serverUsers && serverUsers.length > 0) setUsers(serverUsers);
    }).catch(() => {});
  }, []);

  // Save users to server when changed
  useEffect(() => {
    if (!users || users.length === 0) return;
    users.forEach(u => db.put('users', u.id, u).catch(() => {}));
  }, [users]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddUser = () => {
    setEditingUser(null);
    setForm({ name: '', email: '', password: '', role: 'staff', isActive: true });
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(t('confirmDeleteUser'))) {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      alert(t('userDeleted'));
    }
  };

  const handleSaveUser = () => {
    if (!form.name.trim()) {
      alert(t('userNameRequired'));
      return;
    }
    if (!form.email.trim()) {
      alert(t('userEmailRequired'));
      return;
    }
    if (!editingUser && !form.password.trim()) {
      alert(t('passwordRequired'));
      return;
    }
    if (form.password && form.password.length < 6) {
      alert(t('passwordMinLength'));
      return;
    }

    if (editingUser) {
      // Update existing user
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id 
          ? { 
              ...u, 
              name: form.name, 
              email: form.email, 
              role: form.role, 
              isActive: form.isActive,
              ...(form.password ? { password: form.password } : {})
            }
          : u
      ));
      alert(t('userUpdated'));
    } else {
      // Add new user
      const newUser: User = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        isActive: form.isActive,
        createdAt: new Date().toISOString()
      };
      setUsers(prev => [...prev, newUser]);
      alert(t('userAdded'));
    }
    setShowModal(false);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const handleSavePassword = () => {
    if (!selectedUser) return;
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t('passwordMismatch'));
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert(t('passwordMinLength'));
      return;
    }

    setUsers(prev => prev.map(u => 
      u.id === selectedUser.id 
        ? { ...u, password: passwordForm.newPassword }
        : u
    ));
    alert(t('passwordChanged'));
    setShowPasswordModal(false);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      admin: { bg: '#dc2626', text: '#fff' },
      manager: { bg: '#f59e0b', text: '#fff' },
      staff: { bg: '#10b981', text: '#fff' }
    };
    const c = colors[role] || colors.staff;
    const labels: Record<string, string> = {
      admin: t('roleAdmin'),
      manager: t('roleManager'),
      staff: t('roleStaff')
    };
    return (
      <span style={{ 
        padding: '2px 8px', 
        borderRadius: 4, 
        fontSize: 11, 
        fontWeight: 600,
        background: c.bg,
        color: c.text
      }}>
        {labels[role] || role}
      </span>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6
  };

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: '#fff'
          }}>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            width: '90%',
            maxWidth: 450,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                {editingUser ? t('editUser') : t('addUser')}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}></button>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#64748b' }}>
              {t('userName')}: <strong>{selectedUser.name}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('newPassword')} *</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={inputStyle}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={labelStyle}>{t('confirmPassword')} *</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  style={inputStyle}
                  placeholder="••••••••"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSavePassword}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('changePassword')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ProductsScreen Component - Complete replacement from old App.jsx
interface ProductsScreenProps {
  products: Product[];
  suppliers: any[];
  categories: Category[];
  purchases: any[];
  productHistory: any[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: any;
  currentUser: any;
}

function ProductsScreen({ products, suppliers, categories, purchases, productHistory, setProducts, settings: _settings, currentUser }: ProductsScreenProps) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
  const [supplierQ, setSupplierQ] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [barcodeVal, setBarcodeVal] = useState('');
  const [form, setForm] = useState({
    name: '', code: '', company: '', cat: '', unit: 'পিস',
    buyP: '', sellP: '', stock: '', minStock: '5',
    supplierCrNumber: '', supplierVatNumber: '', supplierAddress: ''
  });
  const [viewPurchase, setViewPurchase] = useState<any>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [stockFilter, setStockFilter] = useState('স্টক আছে');
  const [loading, setLoading] = useState(true);
  const [productTab, setProductTab] = useState('list');
  const [editProduct, setEditProduct] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);

  // Load productTab from server settings
  useEffect(() => {
    localDb.getSetting<string>('pos_product_tab').then(v => { if (v) setProductTab(v); });
  }, []);

  // Save productTab to server settings when it changes
  useEffect(() => {
    localDb.saveSetting<string>('pos_product_tab', productTab);
  }, [productTab]);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  // Get unique companies from suppliers and products
  const uniqueCompanies = [...new Set([
    ...suppliers.map(s => s.name).filter(Boolean),
    ...products.map(p => (p as any).company).filter(Boolean)
  ])].sort();

  // Get unique categories
  const uniqueCategories = [...new Set([
    ...categories.map(c => c.name),
    ...products.map(p => (p as any).cat).filter(Boolean)
  ])].sort();

  // Filter companies for dropdown
  const filteredCompanies = uniqueCompanies.filter(c =>
    !supplierQ || (c || '').toLowerCase().includes((supplierQ || '').toLowerCase())
  );

  // Filter categories for dropdown
  const filteredCategories = uniqueCategories.filter(c =>
    !form.cat || (c || '').toLowerCase().includes((form.cat || '').toLowerCase())
  );

  // Handle edit product
  const handleEditProduct = () => {
    if (!editProduct) return;
    const updatedProducts = products.map(p => {
      if (p.id === editProduct.id) {
        return { ...p, costPrice: editProduct.buyP, sellPrice: editProduct.sellP };
      }
      return p;
    });
    setProducts(updatedProducts);
    setEditProduct(null);
  };

  // Delete product
  const del = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    if (!window.confirm(`"${product.name}" পণ্যটি মুছে ফেলতে চান?`)) return;

    // Log deletion for history (if needed in the future)
    const _deletionEntry = {
      id: genId(),
      productId: id,
      productName: product.name,
      productCompany: (product as any).company || '',
      productCat: (product as any).cat || '',
      stockAtDeletion: product.stock,
      type: 'product_delete',
      source: 'product_delete',
      user: currentUser?.name || 'Unknown',
      userEmail: currentUser?.email || '',
      timestamp: now(),
    };
    console.log('Product deleted:', _deletionEntry);

    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
  };

  // Handle CSV Import
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      if (lines.length < 2) {
        alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: any[] = [];
      const errors: string[] = [];

      const existingCompanies = [
        ...suppliers.map(s => (s.name || '').toLowerCase()),
        ...products.map(p => ((p as any).company || '').toLowerCase()).filter(Boolean)
      ];
      const existingCategories = [
        ...new Set([
          ...products.map(p => ((p as any).cat || '').toLowerCase()).filter(Boolean),
          ...categories.map(c => (c.name || '').toLowerCase()).filter(Boolean)
        ])
      ];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const csvCompany = (row['কোম্পানি'] || row['company'] || '').trim();
        const csvCategory = (row['ক্যাটাগরি'] || row['category'] || '').trim();

        if (csvCompany && !existingCompanies.includes(csvCompany.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCompany}" সরবরাহকারী ডাটাবেজে নেই`);
          continue;
        }

        if (csvCategory && !existingCategories.includes(csvCategory.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCategory}" ক্যাটাগরি ডাটাবেজে নেই`);
          continue;
        }

        const item = {
          id: genId(),
          name: row['পণ্যের নাম'] || row['নাম'] || row['name'] || '',
          code: row['বারকোড'] || row['barcode'] || '',
          company: csvCompany,
          cat: csvCategory,
          unit: row['একক'] || row['unit'] || 'পিস',
          costPrice: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || row['buy'] || '0'),
          sellPrice: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || row['sell'] || '0'),
          stock: parseFloat(row['স্টক'] || row['stock'] || '0'),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || '5'),
          image: '',
          supplier: csvCompany,
          categoryId: '',
        };

        if (item.name) items.push(item);
      }

      if (errors.length > 0) {
        alert(' আপলোড ব্যর্থ!\n\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...এবং আরও ' + (errors.length - 5) + 'টি ত্রুটি' : ''));
        return;
      }

      if (items.length > 0) {
        setPurchaseItems(prevItems => [...prevItems, ...items]);
        setCsvData(items);
        alert(` ${items.length}টি পণ্য আপলোড হয়েছে!`);
      } else {
        alert('কোনো পণ্য পাওয়া যায়নি। CSV ফরম্যাট সঠিক নয়।');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Download demo CSV
  const downloadDemoCSV = () => {
    const csv = `# সরবরাহকারী ডেমো (কোম্পানি)
কোম্পানি আইডি,সরবরাহকারীর নাম,CR নম্বর,VAT নম্বর,ফোন,ঠিকানা
C-00001,মিনিকেট ফুডস,1234567890,312345678901234,0501234567,রিয়াদ সৌদি আরব
C-00002,সুজান বেভারেজ,9876543210,398765432109876,0509876543,জেদ্দাহ সৌদি আরব
C-00003,আল-মারওয়া ট্রেডিং,5678901234,456789012345678,0551234567,দাম্মাম সৌদি আরব

# ক্যাটাগরি ডেমো
ক্যাটাগরি
খাদ্যপণ্য
স্ন্যাকস
সৌন্দর্য

# পণ্য ডেমো
পণ্যের নাম,সরবরাহকারী কোড,কোম্পানি,ক্যাটাগরি,বারকোড,একক,ক্রয়মূল্য,বিক্রয়মূল্য,VAT%,স্টক,মিনস্টক
মিনিকেট চাল,C-00001,মিনিকেট ফুডস,খাদ্যপণ্য,001,কেজি,55,65,15,100,10
ব্রিলিয়ান্ট চাল,C-00001,মিনিকেট ফুডস,খাদ্যপণ্য,002,কেজি,52,62,15,80,10
সুজি চিপস,C-00002,সুজান বেভারেজ,স্ন্যাকস,003,পিস,20,25,15,200,20
পারফেক্ট সাবান,C-00003,আল-মারওয়া ট্রেডিং,সৌন্দর্য,004,পিস,35,45,15,150,15`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'পণ্যের_তালিকা.csv';
    a.click();
  };

  // Filter and sort products
  const filtered = products
    .filter(p => {
      if (stockFilter === 'স্টক আছে' && p.stock <= 0) return false;
      if (stockFilter === 'স্টক শেষ' && p.stock > 0) return false;
      return !search ||
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        ((p as any).company || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.code || '').includes(search);
    })
    .sort((a, b) => {
      if (a.stock <= 0 && b.stock > 0) return -1;
      if (b.stock <= 0 && a.stock > 0) return 1;
      const aLow = a.stock > 0 && a.stock <= (a as any).minStock;
      const bLow = b.stock > 0 && b.stock <= (b as any).minStock;
      if (aLow && !bLow) return -1;
      if (bLow && !aLow) return 1;
      return a.stock - b.stock;
    });

  // Count stats
  const stockCount = products.filter(p => p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  // Print product list
  const printProductList = () => {
    const printFiltered = filtered.length > 0 ? filtered : products;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap" rel="stylesheet">
<title>পণ্যের তালিকা</title><style>
@page { size: A4 landscape; margin: 10mm; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Tiro Bangla',Arial,sans-serif; padding:10px; font-size:11px; }
.header { text-align:center; margin-bottom:15px; border-bottom:2px solid #00897b; padding-bottom:10px; }
.header h1 { color:#00897b; font-size:20px; margin-bottom:4px; }
table { width:100%; border-collapse:collapse; }
th { background:#e0f7f0; border:1px solid #b2dfdb; padding:6px 5px; text-align:left; font-size:10px; color:#00897b; font-weight:700; }
td { border:1px solid #e0e0e0; padding:6px 5px; font-size:11px; }
tr:nth-child(even) { background:#fafafa; }
</style></head><body>
<div class="header"><h1></button>
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
                    <span style={{ fontSize: 15, color: '#4B5563', fontWeight: 600 }}>{t('subtotal')} ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>{fmt(subtotal)}</span>
                  </div>
                  {(parseFloat(discount) || 0) > 0 && (
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', background: '#F0FDF4' }}>
                      <span style={{ fontSize: 15, color: '#16A34A' }}>{t('discount')}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#16A34A' }}>−{fmt(parseFloat(discount) || 0)}</span>
                    </div>
                  )}
                  {vatAmount > 0 && (
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', background: '#FFFBEB' }}>
                      <span style={{ fontSize: 15, color: '#374151' }}>{t('vat')} ({vatRate}%)</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>+{fmt(vatAmount)}</span>
                    </div>
                  )}
                  <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#115E59' }}>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{t('totalDue')}</span>
                    <span style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Discount & VAT Inputs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0"
                    placeholder={t('discount')}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 14, outline: 'none', background: '#fafbfc', boxSizing: 'border-box', color: '#16A34A' }}/>
                  <div style={{ position: 'relative', width: 70 }}>
                    <input 
                      value={vatPercent}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setVatPercent(val);
                        }
                      }}
                      onBlur={() => {
                        const num = parseFloat(vatPercent);
                        if (!isNaN(num) && vatPercent !== '') {
                          setVatPercent(String(num));
                        } else if (vatPercent === '' || isNaN(num)) {
                          setVatPercent(String(defaultVatPercent));
                        }
                      }}
                      type="text" inputMode="decimal"
                      placeholder={`${defaultVatPercent}`}
                      style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 20px 5px 6px', fontSize: 14, outline: 'none', background: '#fafbfc', boxSizing: 'border-box', color: '#374151', textAlign: 'center' }}
                    />
                    <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 12, pointerEvents: 'none' }}>%</span>
                  </div>
                </div>

                {/* Payment Input */}
                <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} type="number" min="0"
                  placeholder={`${t('paid')} (${currency})`}
                  style={{ padding: '10px 14px', fontSize: 16, fontWeight: 700, borderRadius: 8, marginBottom: 8, border: '2px solid #e5e7eb', background: '#fff', boxSizing: 'border-box', width: '100%', textAlign: 'center', color: '#115E59', outline: 'none' }}
                />

                {/* Payment Method Options */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { v: 'cash', t: t('cash'), icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="12" rx="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <path d="M6 12h.01M18 12h.01"/>
                        </svg>
                      )},
                      { v: 'card', t: t('card'), icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="M2 10h20"/>
                        </svg>
                      )},
                      { v: 'bank', t: t('bank'), icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18"/>
                          <path d="M3 7v14"/>
                          <path d="M21 7v14"/>
                          <path d="M6 21V10"/>
                          <path d="M18 21V10"/>
                          <path d="M12 21V14"/>
                          <path d="M12 10l4-4"/>
                          <path d="M8 10l-4-4"/>
                          <path d="M16 10l4-4"/>
                        </svg>
                      )},
                      { v: 'mobile', t: t('mobile'), icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="5" y="2" width="14" height="20" rx="2"/>
                          <path d="M12 18h.01"/>
                        </svg>
                      )},
                    ].map(pm => (
                      <button
                        key={pm.v}
                        type="button"
                        onClick={() => setPaymentMethod(pm.v)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          background: paymentMethod === pm.v ? '#EA580C' : 'transparent',
                          color: paymentMethod === pm.v ? '#FFFFFF' : '#6B7280',
                          border: paymentMethod === pm.v ? 'none' : '1px solid #e5e7eb',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        {pm.icon}
                        {pm.t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due/Change Alert */}
                {due > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>
                     {t('change')}: {fmt(change)}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 6 }}>
                  {/* Clear Cart Button */}
                  <button 
                    onClick={() => {
                      if (cart.length > 0 && confirm('কার্ট পরিষ্কার করবেন?')) {
                        setCart([]);
                        setDiscount('');
                        setPaidAmount('');
                        setVatPercent(String(defaultVatPercent));
                        setPaymentMethod('cash');
                      }
                    }}
                    disabled={cart.length === 0}
                    style={{
                      padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                      background: '#F5F5F5',
                      color: cart.length > 0 ? '#DC2626' : '#9CA3AF',
                      fontWeight: 600, fontSize: 13, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    }}>
                     {t('finish')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// NEW PRODUCT TAB COMPONENT
// ===========================================
interface NewProductItem {
  name: string;
  barcode: string;
  company: string;
  cat: string;
  unit: string;
  buyP: number;
  sellP: number;
  stock: number;
  minStock: number;
}

interface NewProductTabProps {
  products: Product[];
  suppliers: { id: string; name: string; phone?: string; address?: string }[];
  categories: { id: string; name: string }[];
  onAddProducts: (products: NewProductItem[]) => void;
  t: (key: string) => string;
  fmt: (value: number) => string;
}

const NewProductTab: React.FC<NewProductTabProps> = ({ products, suppliers, categories, onAddProducts, t, fmt }) => {
  const [purchaseItems, setPurchaseItems] = useState<NewProductItem[]>([]);
  const [supplierQ, setSupplierQ] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [barcodeVal, setBarcodeVal] = useState('');
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    company: '',
    cat: '',
    unit: 'পিস',
    buyP: '',
    sellP: '',
    stock: '',
    minStock: '5'
  });

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
    !supplierQ || (c || '').toLowerCase().includes((supplierQ || '').toLowerCase())
  );

  // Filter categories for dropdown
  const filteredCategories = uniqueCategories.filter(c =>
    !form.cat || (c || '').toLowerCase().includes((form.cat || '').toLowerCase())
  );

  // Calculate profit
  const profit = form.buyP && form.sellP ? (+form.sellP - +form.buyP).toFixed(0) : '--';
  const profitPercent = form.buyP && form.sellP && +form.buyP > 0 ? (((+form.sellP - +form.buyP) / +form.buyP) * 100).toFixed(0) : '--';
  const vatAmount = form.sellP ? (+form.sellP * 0.15).toFixed(2) : '--';
  const totalSellPrice = form.sellP ? (+form.sellP * 1.15).toFixed(2) : '--';

  // Add item to purchase list
  const addItem = () => {
    if (!form.name?.trim()) { alert(t('productNameRequired')); return; }
    if (!form.company?.trim()) { alert(t('supplierRequired')); return; }

    const item: NewProductItem = {
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
    setForm({ name: '', barcode: '', company: form.company, cat: '', unit: 'পিস', buyP: '', sellP: '', stock: '', minStock: '5' });
    setBarcodeVal('');
  };

  // Remove item
  const removeItem = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  // Save purchase
  const savePurchase = () => {
    if (purchaseItems.length === 0) { alert(t('addAtLeastOne')); return; }
    onAddProducts(purchaseItems);
    alert(`${purchaseItems.length}${t('productsSaved')}`);
    setPurchaseItems([]);
    setForm({ name: '', barcode: '', company: '', cat: '', unit: 'পিস', buyP: '', sellP: '', stock: '', minStock: '5' });
    setSupplierQ('');
  };

  // Handle barcode Enter key
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeVal) {
      const found = products.find(p => p.barcode === barcodeVal);
      if (found) {
        const companyName = (found as any).company || '';
        const catName = (found as any).cat || '';
        const buyPrice = (found as any).buyP || found.costPrice || 0;
        const sellPrice = (found as any).sellP || found.sellPrice || 0;
        const minStock = (found as any).minStock || 5;
        
        setSupplierQ(companyName);
        setForm({
          name: found.name || '',
          barcode: found.barcode || '',
          company: companyName,
          cat: catName,
          unit: found.unit || 'পিস',
          buyP: buyPrice.toString(),
          sellP: sellPrice.toString(),
          stock: '',
          minStock: minStock.toString()
        });
        setShowCategoryList(false);
      } else {
        alert(t('productNotFound'));
      }
    }
  };

  // Download demo CSV
  const downloadDemoCSV = () => {
    const csv = `# পণ্যের তালিকা CSV
পণ্যের নাম,বারকোড,সরবরাহকারী,ক্যাটাগরি,একক,ক্রয়মূল্য,বিক্রয়মূল্য,স্টক,মিনস্টক
মিনিকেট চাল,001,${uniqueCompanies[0] || 'কোম্পানি নাম'},খাদ্যপণ্য,কেজি,55,65,100,10
সুজি চিপস,002,${uniqueCompanies[0] || 'কোম্পানি নাম'},স্ন্যাকস,পিস,20,25,200,20`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'পণ্যের_তালিকা.csv';
    a.click();
  };

  // Handle CSV Import
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

      if (lines.length < 2) {
        alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: NewProductItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        const item: NewProductItem = {
          name: row['পণ্যের নাম'] || row['name'] || '',
          barcode: row['বারকোড'] || row['barcode'] || '',
          company: row['সরবরাহকারী'] || row['supplier'] || '',
          cat: row['ক্যাটাগরি'] || row['category'] || '',
          unit: row['একক'] || row['unit'] || 'পিস',
          buyP: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || row['buy'] || '0'),
          sellP: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || row['sell'] || '0'),
          stock: parseFloat(row['স্টক'] || row['stock'] || '0'),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || '5')
        };

        if (item.name) items.push(item);
      }

      if (items.length > 0) {
        setPurchaseItems([...purchaseItems, ...items]);
        alert(` এই সরবরাহকারীর নাম ইতিমধ্যে আছে!');
      return;
    }
    
    // Generate code if not provided
    let codeToUse = supplierForm.code?.trim();
    if (!codeToUse) {
      const maxCode = suppliers.reduce((max, s) => {
        const match = s.code?.match(/C-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 0);
      codeToUse = `C-${String(maxCode + 1).padStart(5, '0')}`;
    }
    
    try {
      if (editingSupplier) {
        const updated: Supplier = {
          ...editingSupplier,
          ...supplierForm,
          code: codeToUse,
          company: supplierForm.name.trim()
        };
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updated : s));
        alert(' সরবরাহকারী যোগ করা হয়েছে!\nকোড: ${codeToUse}`);
      }
      
      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' });
    } catch (error) {
      console.error('Failed to save supplier:', error);
      alert(' সমস্যা হয়েছে!');
    }
  };
  
  // Delete Category
  const deleteCategory = async (cat: SupplierCategory) => {
    const hasProducts = products.some(p => (p.cat || '').toLowerCase() === (cat.name || '').toLowerCase());
    if (hasProducts) {
      alert(' এই ক্যাটাগরিতে পণ্য আছে!');
      return;
    }
    
    if (!confirm('এই ক্যাটাগরি মুছে ফেলবেন?')) return;
    
    try {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setViewCategory(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  // Save Product
  const saveProduct = async () => {
    if (!productForm.name?.trim() || !productForm.company?.trim() || !productForm.cat?.trim()) {
      alert(' {t('addDue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle add customer
  const handleAddCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    // Update selectedCustomer to reflect changes
    setSelectedCustomer(prev => prev && prev.id === customer.id ? customer : prev);
  };

  // Open edit modal
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsEditCustomerModalOpen(true);
  };

  // Handle delete customer (with IndexedDB cleanup)
  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(t('confirmDelete'))) {
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      if (onDeleteCustomer) {
        onDeleteCustomer(customer);
      }
    }
  };

  // Check if customer is General Customer by name
  const isGeneralCustomer = (c: Customer) => 
    c.name.toLowerCase() === 'general customer';

  // Filter customers for dashboard
  const filteredCustomers = customers.filter(c => {
    if (isGeneralCustomer(c)) return false; // Exclude general customer
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query))
    );
  });

  // General customer
  const generalCustomer = customers.find(c => isGeneralCustomer(c));

  // Get customer sales
  const getCustomerSales = (customer: Customer) => {
    return sales.filter(s => s.customerId === customer.id);
  };

  // Calculate customer total
  const getCustomerTotal = (customer: Customer) => {
    const customerSales = getCustomerSales(customer);
    return customerSales.reduce((sum, s) => sum + s.total, 0);
  };

  // Handle CSV Export
  const handleCsvExport = () => {
    const regularCustomers = customers.filter(c => !isGeneralCustomer(c));
    const csvContent = [
      ['ID', 'Name', 'Phone', 'Address', 'Balance'].join(','),
      ...regularCustomers.map(c => [c.id, c.name, c.phone || '', c.address || '', c.balance.toString()].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle view history
  const handleViewHistory = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer === null || isGeneralCustomer(customer)) {
      setView('general');
    } else {
      setView('regular');
    }
  };

  // Format currency
  const fmt = (n: number) => `$${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: '20px',
    width: '100%',
  };

  const topBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: '250px',
    padding: '10px 16px',
    paddingLeft: '40px',
    border: `1px solid ${T.gray200}`,
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    background: T.white,
    position: 'relative' as const,
  };

  const searchWrapperStyle: React.CSSProperties = {
    position: 'relative' as const,
    flex: 1,
    minWidth: '250px',
  };

  const buttonTealStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: T.teal,
    color: T.white,
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const buttonGrayStyle: React.CSSProperties = {
    padding: '10px 20px',
    background: T.gray100,
    color: T.gray800,
    border: `1px solid ${T.gray200}`,
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const cardGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  };

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div style={containerStyle}>
        {/* Top Bar */}
        <div style={topBarStyle}>
          <div style={searchWrapperStyle}>
            <span style={{
              position: 'absolute',
              left: isRTL ? 'auto' : '12px',
              right: isRTL ? '12px' : 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '16px',
              color: T.gray400,
            }}></span>
            <input
              type="text"
              placeholder={t('nameOrPhonePlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={searchInputStyle}
            />
          </div>
          <button style={buttonTealStyle} onClick={() => setIsAddCustomerModalOpen(true)}>
            <span>+</span> {t('addCustomer')}
          </button>
          <button style={buttonGrayStyle} onClick={handleCsvExport}>
            <span> সেটিংস সংরক্ষণ ব্যর্থ হয়েছে!');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('সতর্কতা: সম্পূর্ণ ডাটা রিসেট হবে। এটি পূর্বাবস্থায় ফেরানো যাবে না।\n\nআপনি কি নিশ্চিত?')) {
      return;
    }

    try {
      await localDb.clearAll();
      alert(t('dataDeletedSuccessfully'));
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert(' CR নম্বর
                </label>
                <input
                  value={form.crNumber}
                  onChange={e => setForm(p => ({ ...p, crNumber: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="CR নম্বর"
                />
              </div>
            </div>

            {/* VAT Settings */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}> {t('howItWorks')}</h4>
        <ul style={{ fontSize: 13, color: '#374151', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>ডাটা IndexedDB-তে লোকালি সেভ থাকে</li>
          <li>অফলাইনেও সব কাজ করা যায়</li>
          <li>Online হলে automatic sync হয়</li>
          <li>Backup/Restore করা যায়</li>
        </ul>
      </div>
    </div>
  );
}
