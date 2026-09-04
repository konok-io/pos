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
          }}><Icon e="👥" /> </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{t('userManagement')}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{t('totalUsers')}: {users.length}</p>
          </div>
        </div>
        <button
          onClick={handleAddUser}
          style={{
            padding: '10px 20px',
            background: '#e0e0e0',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        > <Icon e="➕" />
           {t('addUser')}
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder={t('searchUser')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, maxWidth: 300 }}
        />
      </div>

      {/* User List */}
      <div style={{ 
        background: '#f8fafc', 
        borderRadius: 12, 
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        {/* Table Header */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr', 
          padding: '12px 16px',
          background: '#f1f5f9',
          fontSize: 12,
          fontWeight: 700,
          color: '#64748b',
          textTransform: 'uppercase'
        }}>
          <div>{t('userName')}</div>
          <div>{t('userEmail')}</div>
          <div>{t('userRole')}</div>
          <div>{t('status')}</div>
          <div style={{ textAlign: 'right' }}>{t('actions')}</div>
        </div>

        {/* User Rows */}
        {filteredUsers.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}><Icon e="👤" /> </div>
            <p style={{ margin: 0 }}>{t('noUsersFound')}</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 2fr 1fr 1fr 1.5fr', 
              padding: '14px 16px',
              borderBottom: '1px solid #e2e8f0',
              alignItems: 'center',
              background: '#fff',
              transition: 'background 0.2s'
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{user.name}</div>
              </div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{user.email}</div>
              <div>{getRoleBadge(user.role)}</div>
              <div>
                <span style={{ 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontSize: 11, 
                  fontWeight: 600,
                  background: user.isActive ? '#dcfce7' : '#fee2e2',
                  color: user.isActive ? '#16a34a' : '#dc2626'
                }}>
                  {user.isActive ? t('active') : t('inactive')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleChangePassword(user)}
                  style={{
                    padding: '6px 12px',
                    background: '#fef3c7',
                    color: '#92400e',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title={t('changePassword')}
                ><Icon e="🔑" />
                  
                </button>
                <button
                  onClick={() => handleEditUser(user)}
                  style={{
                    padding: '6px 12px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                > <Icon e="✏" />
                  ️
                </button>
                <button
                  onClick={() => handleDeleteUser(user)}
                  style={{
                    padding: '6px 12px',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                > <Icon e="🗑" />
                  ️
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
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}><Icon e="✕" /> </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>{t('userName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={inputStyle}
                  placeholder={t('userName')}
                />
              </div>

              <div>
                <label style={labelStyle}>{t('userEmail')} *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  placeholder={t('userEmail')}
                />
              </div>

              <div>
                <label style={labelStyle}>{t('password')} {editingUser && `(${t('passwordNoChange')})`}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={inputStyle}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label style={labelStyle}>{t('userRole')}</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value as any })}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="admin">{t('roleAdmin')}</option>
                  <option value="manager">{t('roleManager')}</option>
                  <option value="staff">{t('roleStaff')}</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ ...labelStyle, marginBottom: 0, cursor: 'pointer' }}>{t('active')}</label>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  onClick={() => setShowModal(false)}
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
                  onClick={handleSaveUser}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#0F766E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && selectedUser && (
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
            maxWidth: 400
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}> <Icon e="🔑" />
                 {t('changePassword')}
              </h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}><Icon e="✕" /> </button>
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
  const { t } = useLanguage();
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
  const [stockFilter, setStockFilter] = useState<'in' | 'out'>('in');
  const [loading, setLoading] = useState(true);
  const [productTab, setProductTab] = useState('list');
  const [editProduct, setEditProduct] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);

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
        alert('CSV ফাইলে কমপক্ষে হেডার ও এক পণ্য থাকতে হবে');
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
        alert('❌ আপলোড ব্যর্থ!\n\n' + errors.slice(0, 5).join('\n') + (errors.length > 5 ? '\n...এবং আরও ' + (errors.length - 5) + 'টি ত্রুটি' : ''));
        return;
      }

      if (items.length > 0) {
        setPurchaseItems(prevItems => [...prevItems, ...items]);
        setCsvData(items);
        alert(`✅ ${items.length} ${t('productsCount')} আপলোড হয়েছে!`);
      } else {
        alert(t('noProductsFound') + '। CSV ফরম্যাট সঠিক নয়।');
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
      if (stockFilter === 'in' && p.stock <= 0) return false;
      if (stockFilter === 'out' && p.stock > 0) return false;
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
<div class="header"><h1> <Icon e="📦" /> পণ্যের তালিকা</h1><p>${new Date().toLocaleDateString('bn-BD')} | ${printFiltered.length}{t('productsCount')}</p></div>
<table><thead><tr><th>{t('productName')}</th><th>{t('company')}</th><th>{t('category')}</th><th>{t('buyPrice')}</th><th>{t('sellPrice')}</th><th>{t('stock')}</th><th>{t('unit')}</th></tr></thead><tbody>
${printFiltered.map(p => {
  return `<tr><td>${p.name}</td><td>${(p as any).company || '-'}</td><td>${(p as any).cat || '-'}</td><td>৳${p.costPrice.toLocaleString()}</td><td>৳${p.sellPrice.toLocaleString()}</td><td>${p.stock}</td><td>${p.unit}</td></tr>`;
}).join('')}
</tbody></table>
</body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600,left=100,top=100');
    if (win) {
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { if (!win.closed) { win.print(); } }, 250);
    }
  };

  // Purchase history view
  if (showPurchaseHistory) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={btn()} onClick={() => setShowPurchaseHistory(false)}> <Icon e="←" /> ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}> <Icon e="📦" /> {t('purchaseHistoryButton')}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {purchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.gray400 }}>কোনো ক্রয় রেকর্ড নেই</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...purchases].reverse().map(p => {
                const totalCost = p.items.reduce((s: number, i: any) => s + (i.stock || 0) * (i.costPrice || 0), 0);
                return (
                  <div key={p.id} onClick={() => setViewPurchase(p)}
                    style={{ padding: 14, background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.teal, fontSize: 14 }}>{p.id}</div>
                      <div style={{ fontSize: 14, color: T.gray500, marginTop: 2 }}>{new Date(p.date).toLocaleDateString('bn-BD')} - {p.supplier}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: T.green }}>{fmt(totalCost)}</div>
                      <div style={{ fontSize: 14, color: T.gray500 }}>{p.items.length}{t('productsCount')} - {p.items.reduce((s: number, i: any) => s + i.stock, 0)} একক</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {viewPurchase && (
          <div style={overlay} onClick={() => setViewPurchase(null)}>
            <div style={{ ...cardStyle, width: 500, maxHeight: '80vh', overflow: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
              <div style={{ marginBottom: 16, borderBottom: `2px solid ${T.gray200}`, paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: T.teal }}>{viewPurchase.id}</div>
                    <div style={{ fontSize: 14, color: T.gray500, marginTop: 4 }}> <Icon e="📅" /> {new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
                    <div style={{ fontSize: 15, marginTop: 4 }}> <Icon e="🏢" /> সরবরাহকারী: {viewPurchase.supplier}</div>
                  </div>
                  <button onClick={() => setViewPurchase(null)} style={{ ...btn('ghost', 'sm'), padding: '6px 12px', fontSize: 14 }}><Icon e="✕" /> </button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.gray50 }}>
                    <th style={{ padding: 8, textAlign: 'left', fontSize: 14, color: T.gray600 }}>{t('productName')}</th>
                    <th style={{ padding: 8, textAlign: 'center', fontSize: 14, color: T.gray600 }}>পরিমাণ</th>
                    <th style={{ padding: 8, textAlign: 'right', fontSize: 14, color: T.gray600 }}>দাম</th>
                    <th style={{ padding: 8, textAlign: 'right', fontSize: 14, color: T.gray600 }}>মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items.map((item: any, i: number) => {
                    const qty = item.stock || 0;
                    const price = item.costPrice || 0;
                    const total = qty * price;
                    return (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.gray100}` }}>
                        <td style={{ padding: 10, fontSize: 15 }}>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 14, color: T.gray400 }}>{item.company} - {item.cat || '-'}</div>
                        </td>
                        <td style={{ padding: 10, textAlign: 'center', fontWeight: 600 }}>{qty} {item.unit || 'পিস'}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontSize: 15 }}>{fmt(price)}</td>
                        <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: T.green }}>{fmt(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: T.tealLight }}>
                    <td colSpan={3} style={{ padding: 10, fontWeight: 800, fontSize: 24 }}>সর্বমোট</td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 800, fontSize: 16, color: T.teal }}>
                      {fmt(viewPurchase.items.reduce((s: number, i: any) => s + (i.stock || 0) * (i.costPrice || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <button onClick={() => setViewPurchase(null)} style={{ ...btn(), marginTop: 16, width: '100%' }}>বন্ধ করুন</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add product form
  if (showAddForm) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={btn()} onClick={() => { setShowAddForm(false); setPurchaseItems([]); setCsvData([]); }}> <Icon e="←" /> ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}> <Icon e="📦" /> {t('newProductSave')}</span>
          <span style={{ fontSize: 14, color: T.gray500, marginLeft: 'auto' }}>{purchaseItems.length}{t('productsCount')} যোগ হয়েছে</span>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Form */}
          <div style={{ flex: 1, padding: 16, overflow: 'auto', borderRight: `1px solid ${T.gray200}` }}>
            {/* CSV Import Section */}
            <div style={{ ...cardStyle, padding: 16, marginBottom: 16, background: T.tealLight, border: `1px dashed ${T.teal}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: T.teal }}> <Icon e="📥" /> CSV ইম্পোর্ট করুন</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="file" accept=".csv" onChange={handleCsvImport} id="csvInput" style={{ display: 'none' }} />
                  <label htmlFor="csvInput" style={{ ...btn('primary'), cursor: 'pointer', fontSize: 15, padding: '10px 20px' }}> <Icon e="📁" />
                     পণ্যের CSV আপলোড করুন
                  </label>
                  <button onClick={downloadDemoCSV} style={{ ...btn('ghost'), fontSize: 14, padding: '8px 16px' }}> <Icon e="📥" />
                     ডেমো CSV ডাউনলোড
                  </button>
                </div>
              </div>
              {csvData.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, color: T.teal, fontWeight: 600 }}> <Icon e="✓" />
                   {csvData.length}{t('productsCount')} আপলোড হয়েছে
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, padding: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.teal }}>পণ্য যোগ করুন</h3>

              {/* Supplier/Company */}
              <div style={{ marginBottom: 12, position: 'relative' }}>
                <label style={labelStyle}> <Icon e="🏢" /> সরবরাহকারী *</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={supplierQ}
                    onChange={e => { setSupplierQ(e.target.value); setForm(f => ({ ...f, company: e.target.value })); setShowCompanyList(true); }}
                    onFocus={() => setShowCompanyList(true)}
                    placeholder="সরবরাহকারী নাম..."
                    style={{ ...inputStyle, flex: 1, fontSize: 15 }}
                  />
                  <button type="button" onClick={() => setShowCompanyList(!showCompanyList)} style={{ ...btn('ghost'), padding: '4px 5px', fontSize: 14 }}><Icon e="▼" /> </button>
                </div>
                {showCompanyList && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCompanies.map((c, i) => (
                      <div key={i} onClick={() => {
                        const sup = suppliers.find(s => (s.name || '').toLowerCase().trim() === c.toLowerCase());
                        setSupplierQ(c);
                        setForm(f => ({ ...f, company: c, supplierCrNumber: sup?.crNumber || '', supplierVatNumber: sup?.vatNumber || '', supplierAddress: sup?.address || '' }));
                        setShowCompanyList(false);
                      }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 14 }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <label style={labelStyle}> <Icon e="📂" /> {t('category')}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={form.cat}
                    onChange={e => { setForm(f => ({ ...f, cat: e.target.value })); setShowCategoryList(true); }}
                    onFocus={() => setShowCategoryList(true)}
                    placeholder="ক্যাটাগরি..."
                    style={{ ...inputStyle, flex: 1, fontSize: 15 }}
                  />
                  <button type="button" onClick={() => setShowCategoryList(!showCategoryList)} style={{ ...btn('ghost'), padding: '4px 5px', fontSize: 14 }}><Icon e="▼" /> </button>
                </div>
                {showCategoryList && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCategories.map((c, i) => (
                      <div key={i} onClick={() => { setForm(f => ({ ...f, cat: c })); setShowCategoryList(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 14 }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}> <Icon e="📦" /> পণ্যের নাম *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="পণ্যের নাম..."
                  style={{ ...inputStyle, fontSize: 15 }}
                />
              </div>

              {/* Barcode */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}> <Icon e="🔢" /> বারকোড</label>
                <input
                  value={barcodeVal}
                  onChange={e => { setBarcodeVal(e.target.value); setForm(f => ({ ...f, code: e.target.value })); }}
                  placeholder="বারকোড..."
                  style={{ ...inputStyle, fontSize: 15 }}
                />
              </div>

              {/* Unit */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}> <Icon e="📥" /> {t('unit')}</label>
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ ...inputStyle, fontSize: 14 }}
                >
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

              {/* Price Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}> <Icon e="💰" /> {t('buyPrice')}</label>
                  <input type="number" value={form.buyP} onChange={e => setForm(f => ({ ...f, buyP: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}> <Icon e="💵" /> {t('sellPrice')}</label>
                  <input type="number" value={form.sellP} onChange={e => setForm(f => ({ ...f, sellP: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}> <Icon e="📊" /> {t('stock')}</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
              </div>

              {/* Min Stock */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}> <Icon e="⚠" /> মিনিমাম স্টক</label>
                <input type="number" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="5" style={inputStyle} />
              </div>

              {/* Add Button */}
              <button
                onClick={() => {
                  if (!form.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
                  if (!form.company?.trim()) { alert('সরবরাহকারীর নাম দিন'); return; }
                  const item = {
                    id: genId(),
                    name: form.name,
                    code: form.code || '',
                    company: form.company,
                    cat: form.cat || '',
                    unit: form.unit || 'পিস',
                    costPrice: +form.buyP || 0,
                    sellPrice: +form.sellP || 0,
                    stock: +form.stock || 0,
                    minStock: +form.minStock || 5,
                    image: '',
                    supplier: form.company,
                    categoryId: '',
                  };
                  setPurchaseItems([...purchaseItems, item]);
                  setForm({ name: '', code: '', company: form.company, cat: '', unit: 'পিস', buyP: '', sellP: '', stock: '', minStock: '5', supplierCrNumber: '', supplierVatNumber: '', supplierAddress: '' });
                  setBarcodeVal('');
                }}
                style={{ ...btn('primary'), width: '100%', padding: '12px', fontSize: 16 }}
              > <Icon e="➕" />
                 পণ্য তালিকায় যোগ করুন
              </button>
            </div>
          </div>

          {/* Right: Items List */}
          <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: T.gray50 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 24 }}> <Icon e="📋" /> পণ্যের তালিকা ({purchaseItems.length})</span>
              {purchaseItems.length > 0 && (
                <button
                  onClick={() => {
                    const newProducts = [...products, ...purchaseItems];
                    setProducts(newProducts);
                    setPurchaseItems([]);
                    setCsvData([]);
                    setShowAddForm(false);
                    alert(`✅ ${purchaseItems.length}{t('productsCount')} সংরক্ষিত হয়েছে!`);
                  }}
                  style={{ ...btn('success'), padding: '8px 16px', fontSize: 15 }}
                > <Icon e="💾" />
                   সব সংরক্ষণ
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
              {purchaseItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: T.gray400 }}>কোনো পণ্য যোগ করা হয়নি</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {purchaseItems.map((item) => (
                    <div key={item.id} style={{ background: T.white, padding: 12, borderRadius: 8, border: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: T.gray500 }}>{item.company} - {item.cat || '-'}</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          <span style={{ color: T.orange }}>ক্রয়: {fmt(item.costPrice)}</span>
                          <span style={{ margin: '0 8px', color: T.gray300 }}>|</span>
                          <span style={{ color: T.teal }}>বিক্রয়: {fmt(item.sellPrice)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: T.gray500, marginTop: 2 }}>স্টক: {item.stock} {item.unit}</div>
                      </div>
                      <button
                        onClick={() => setPurchaseItems(prev => prev.filter(p => p.id !== item.id))}
                        style={{ ...btn('danger', 'sm'), padding: '4px 5px', fontSize: 14 }}
                      ><Icon e="✕" />
                        
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Price History Tab Content
  if (productTab === 'history') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={btn()} onClick={() => setProductTab('list')}> <Icon e="←" /> ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}> <Icon e="📜" /> পণ্যের দাম পরিবর্তনের ইতিহাস</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            {(() => {
              const priceHistory = productHistory.filter((h: any) => h.type === 'price_buy' || h.type === 'price_sell');
              return priceHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>কোনো দাম পরিবর্তন নেই</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.tealLight }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>তারিখ ও সময়</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('productName')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>পরিবর্তনের ধরন</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.teal }}>পুরাতন দাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.teal }}>নতুন দাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>ব্যবহারকারী</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...priceHistory].reverse().map((h: any, i: number) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                        <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>
                          {new Date(h.timestamp).toLocaleString('bn-BD')}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 15 }}>{h.productName}</td>
                        <td style={{ padding: '10px 12px', fontSize: 14 }}>
                          {h.type === 'price_buy' && <span style={{ background: T.orangeLight, color: T.orange, padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>{t('buyPrice')}</span>}
                          {h.type === 'price_sell' && <span style={{ background: T.tealLight, color: T.teal, padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>{t('sellPrice')}</span>}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: T.red }}>{fmt(h.oldValue)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: T.green }}>{fmt(h.newValue)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>
                          <div style={{ fontWeight: 600 }}>{h.user}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Deleted Products Tab Content
  if (productTab === 'deleted') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={btn()} onClick={() => setProductTab('list')}> <Icon e="←" /> ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}><Icon e="🗑" /> <Icon e="️" /> পণ্য ডিলিটের তালিকা</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            {(() => {
              const deleteHistory = productHistory.filter((h: any) => h.type === 'product_delete');
              return deleteHistory.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>কোনো পণ্য ডিলিট করা হয়নি</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.redLight }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.red }}>তারিখ ও সময়</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.red }}>{t('productName')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.red }}>{t('company')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.red }}>ডিলিটের সময় স্টক</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.red }}>ব্যবহারকারী</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...deleteHistory].reverse().map((h: any, i: number) => (
                      <tr key={h.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                        <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>
                          {new Date(h.timestamp).toLocaleString('bn-BD')}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 15, color: T.red }}>{h.productName}</td>
                        <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{h.productCompany || '-'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: T.orange }}>{h.stockAtDeletion || 0}</td>
                        <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>
                          <div style={{ fontWeight: 600 }}>{h.user}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }

  // Main List Tab
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Product Sub-Menu */}
      <div style={{ padding: '8px 16px', background: '#F5F5F5', borderBottom: `1px solid ${T.gray200}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setProductTab('list')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'list' ? T.teal : T.white,
            color: productTab === 'list' ? T.white : T.gray600,
            backgroundImage: productTab === 'list' ? 'linear-gradient(135deg, #115E59, #0F766E)' : 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="📦" />
           Products
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: T.white, color: T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="➕" />
           New Product
        </button>
        <button
          onClick={() => setProductTab('suppliers')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'suppliers' ? T.teal : T.white,
            color: productTab === 'suppliers' ? T.white : T.gray600,
            backgroundImage: productTab === 'suppliers' ? 'linear-gradient(135deg, #115E59, #0F766E)' : 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="🏢" />
           Suppliers
        </button>
        <button
          onClick={() => setProductTab('barcode')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'barcode' ? T.teal : T.white,
            color: productTab === 'barcode' ? T.white : T.gray600,
            backgroundImage: productTab === 'barcode' ? 'linear-gradient(135deg, #115E59, #0F766E)' : 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="📊" />
           Barcode
        </button>
        <button
          onClick={() => setProductTab('inventory')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'inventory' ? T.teal : T.white,
            color: productTab === 'inventory' ? T.white : T.gray600,
            backgroundImage: productTab === 'inventory' ? 'linear-gradient(135deg, #115E59, #0F766E)' : 'none',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="🏭" />
           Stock
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={printProductList}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: T.white, color: T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        > <Icon e="🖨" /> {t('printButton')}
        </button>
      </div>

      {/* Filters - Only show for list tab */}
      {productTab === 'list' && (
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap', fontSize: 13 }}>
          <button onClick={() => setStockFilter('in')} style={{
            ...btn(stockFilter === 'in' ? 'primary' : 'ghost', 'sm'),
            borderRadius: 7, whiteSpace: 'nowrap',
            background: stockFilter === 'in' ? T.teal : T.gray100,
            color: stockFilter === 'in' ? T.white : T.gray600,
            border: 'none', padding: '8px 14px', fontSize: 13,
          }}> <Icon e="📦" /> {t('stockIn')} ({stockCount})</button>

          <button onClick={() => setStockFilter('out')} style={{
            ...btn(stockFilter === 'out' ? 'primary' : 'ghost', 'sm'),
            borderRadius: 7, whiteSpace: 'nowrap',
            background: stockFilter === 'out' ? T.red : T.redLight,
            color: stockFilter === 'out' ? T.white : T.red,
            border: 'none', padding: '8px 14px', fontSize: 13,
          }}> <Icon e="⚠" /> {t('stockOutStatus')} ({outOfStockCount})</button>

          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 150, fontSize: 13 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><Icon e="🔍" /> </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchProduct')}
              style={{ ...inputStyle, paddingLeft: 32, fontSize: 13 }}
            />
          </div>
          <button style={{ ...btn('ghost'), fontSize: 13 }} onClick={() => setShowPurchaseHistory(true)}> <Icon e="📦" /> {t('purchaseHistoryButton')}</button>
          <button
            onClick={() => setProductTab('history')}
            style={{ ...btn('ghost'), fontSize: 13, padding: '6px 12px' }}
          > <Icon e="📜" />
            {t('priceHistoryButton')}
          </button>
          <button
            onClick={() => setProductTab('deleted')}
            style={{ ...btn('ghost'), fontSize: 13, padding: '6px 12px' }}
          > <Icon e="🗑" />
            ️ {t('deletedListButton')}
          </button>

          <button type="button" onClick={() => setShowAddForm(true)} style={{ ...btn('primary'), fontSize: 13 }}>
            <Icon e="➕" /> {t('newProductButton')}
          </button>
          <span style={{ fontSize: 13, color: T.gray400, marginLeft: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 7, padding: '8px 14px', display: 'inline-flex', alignItems: 'center' }}>{filtered.length} {t('productsCount')}</span>
        </div>
      )}

      {/* Product Table - Only show for list tab */}
      {productTab === 'list' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', gap: 16 }}>
              <div style={{
                width: 48, height: 48, border: '4px solid #E0E0E0', borderTop: '4px solid #00897b',
                borderRadius: '50%', animation: 'spin 1s linear infinite'
              }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <div style={{ fontSize: 14, color: T.gray500 }}>{t('loadingProducts')}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${T.gray200}` }}>
              <thead>
                <tr style={{ background: T.tealLight }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>{t('productName')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('company')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('category')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('buyPrice')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('sellPrice')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('profit')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('stock')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('unit')}</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: T.teal }}>{t('action')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>{t('noProductsFound')}</td></tr>
                ) : filtered.map((p, i) => {
                  const profitPct = p.costPrice > 0 ? Math.round((p.sellPrice - p.costPrice) / p.costPrice * 100) : 0;
                  const isLowStock = p.stock <= (p as any).minStock;
                  return (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        {p.code && <div style={{ fontSize: 14, color: T.gray400, fontFamily: 'monospace' }}>{p.code}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{(p as any).company || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 15, color: T.gray600 }}>{(p as any).cat || '-'}</td>
                      <td style={{ padding: '10px 12px', fontSize: 15 }}>{fmt(p.costPrice)}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14 }}>{fmt(p.sellPrice)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: profitPct > 0 ? T.green : T.red }}>
                          {fmt(p.sellPrice - p.costPrice)} ({profitPct}%)
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: 15, color: isLowStock ? T.red : T.gray900 }}>{fmtN(p.stock)}</span>
                        {isLowStock && <span style={{ fontSize: 14, color: T.red, marginLeft: 4 }}><Icon e="⚠" /> </span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray400 }}>{p.unit}</td>
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button style={{ ...btn('ghost', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => setViewProduct(p)} title="দেখুন"><Icon e="👁" /> <Icon e="️" /> </button>
                        <button style={{ ...btn('primary', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => setEditProduct({ ...p, buyP: p.costPrice, sellP: p.sellPrice })} title="সম্পাদনা"><Icon e="✏" /> <Icon e="️" /> </button>
                        {p.stock <= 0 ? (
                          <button style={{ ...btn('danger', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => del(p.id)} title="মুছুন"><Icon e="🗑" /> <Icon e="️" /> </button>
                        ) : (
                          <button disabled style={{ ...btn('ghost', 'sm'), padding: '5px 8px', fontSize: 14, opacity: 0.4, cursor: 'not-allowed' }} title="স্টক থাকলে মুছা যাবে না"><Icon e="🔒" /> </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Suppliers Tab Content */}
      {productTab === 'suppliers' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><Icon e="🏢" /> </div>
            <h3 style={{ margin: '0 0 8px', color: T.teal }}>Suppliers</h3>
            <p style={{ color: T.gray500 }}>সরবরাহকারীদের তালিকা এখানে দেখা যাবে</p>
          </div>
        </div>
      )}

      {/* Barcode Tab Content */}
      {productTab === 'barcode' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><Icon e="📊" /> </div>
            <h3 style={{ margin: '0 0 8px', color: T.teal }}>Barcode</h3>
            <p style={{ color: T.gray500 }}>বারকোড জেনারেটর এখানে দেখা যাবে</p>
          </div>
        </div>
      )}

      {/* Inventory/Stock Tab Content */}
      {productTab === 'inventory' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}><Icon e="🏭" /> </div>
            <h3 style={{ margin: '0 0 8px', color: T.teal }}>Stock</h3>
            <p style={{ color: T.gray500 }}>স্টক ম্যানেজমেন্ট এখানে দেখা যাবে</p>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div style={overlay}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: T.teal }}><Icon e="✏" /> <Icon e="️" /> পণ্যের দাম সম্পাদনা</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}><Icon e="✕" /> </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{editProduct.name}</div>
              <div style={{ fontSize: 14, color: T.gray400 }}>{editProduct.company} - {editProduct.cat || '-'}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: T.gray600, marginBottom: 6, display: 'block' }}>ক্রয়মূল্য (৳)</label>
              <input
                type="number"
                value={editProduct.buyP}
                onChange={e => setEditProduct({ ...editProduct, buyP: parseFloat(e.target.value) || 0 })}
                style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: T.gray600, marginBottom: 6, display: 'block' }}>বিক্রয়মূল্য (৳)</label>
              <input
                type="number"
                value={editProduct.sellP}
                onChange={e => setEditProduct({ ...editProduct, sellP: parseFloat(e.target.value) || 0 })}
                style={{ ...inputStyle, padding: '10px 12px', fontSize: 14 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEditProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>বাতিল</button>
              <button onClick={handleEditProduct} style={{ ...btn('primary'), flex: 2 }}> <Icon e="💾" /> সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div style={overlay}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: T.teal }}> <Icon e="📋" /> পণ্যের বিবরণ</h3>
              <button onClick={() => setViewProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}><Icon e="✕" /> </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('productName')}</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{viewProduct.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>বারকোড</div>
                <div style={{ fontFamily: 'monospace', fontSize: 15 }}>{viewProduct.code || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('company')}</div>
                <div style={{ fontSize: 15 }}>{viewProduct.company || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('category')}</div>
                <div style={{ fontSize: 15 }}>{viewProduct.cat || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('buyPrice')}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.orange }}>{fmt(viewProduct.costPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('sellPrice')}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.teal }}>{fmt(viewProduct.sellPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>{t('stock')}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: viewProduct.stock <= (viewProduct.minStock || 5) ? T.red : T.green }}>{viewProduct.stock} {viewProduct.unit}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>মিনিমাম স্টক</div>
                <div style={{ fontSize: 14 }}>{viewProduct.minStock || 5} {viewProduct.unit}</div>
              </div>
            </div>

            <button onClick={() => setViewProduct(null)} style={{ ...btn(), width: '100%' }}>বন্ধ করুন</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Default admin credentials
const DEFAULT_ADMIN = {
  id: 'admin',
  email: 'admin@pos.test',
  password: 'admin123',
  role: 'admin',
  name: 'Admin',
  isActive: true,
};

// Helper functions
const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
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
  // Extended fields
  barcode?: string;
  description?: string;
  category?: string;
  storeId?: string;
  company?: string;
  cat?: string;
  buyP?: number;
  minStock?: number;
  expiryDate?: string;
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

interface HeldSale {
  id: string;
  items: CartItem[];
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface Transaction {
  id: string;
  type: 'due' | 'deposit';
  amount: number;
  date: string;
  note?: string;
  paymentMethod?: string;
  customerId?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  deposit: number;
  transactions?: Transaction[];
  isSystem?: boolean;
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
  paymentMethod: string;
}

// Loading Screen
function LoadingScreen() {
  const { t } = useLanguage();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#115E59', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <div style={{ width: 50, height: 50, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <h3 style={{ marginTop: 16, fontSize: 18, fontWeight: 700 }}>{t('posManagementSystem')}</h3>
      <p style={{ marginTop: 8, opacity: 0.8 }}>{t('loading')}</p>
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
  const { t } = useLanguage();

  const currentYear = new Date().getFullYear();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if ((username === 'admin' || username === 'admin@konok.io') && password === 'admin123') {
      onLogin();
    } else {
      setError(t('invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#115E59', border: '1px solid #115E59',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
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

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Header - Icon left, text right */}
        <div style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '12px 20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
            <div style={{
              width: 40, height: 34,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(15,118,110,0.3)',
            }}>
              <img src="/Logo.png" alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
            </div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#115E59' }}>
                {t('posManagementSystem')}
              </h1>
              <div style={{
                fontSize: 15.5,
                color: '#115E59',
                fontWeight: 400,
                marginTop: 1,
              }}>
                {t('smartBusinessPartner')}
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div style={{
          background: '#fff',
          borderRadius: '0 0 20px 20px',
          padding: '12px 20px 16px',
        }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            {/* Username */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                required
                style={{
                  width: 140,
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                onFocus={(e) => e.target.style.borderColor = '#115E59'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 3 }}>
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
                style={{
                  width: 140,
                  padding: '8px 10px',
                  fontSize: 13,
                  border: '2px solid #E5E7EB',
                  borderRadius: 8,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
                onFocus={(e) => e.target.style.borderColor = '#115E59'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '8px 16px',
                background: loading ? '#9CA3AF' : '#115E59',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              {loading ? '⏳' : t('signIn')}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 8,
              padding: '6px 10px',
              background: '#FEF2F2',
              borderRadius: 6,
              color: '#DC2626',
              fontSize: 11,
              fontWeight: 500,
            }}> <Icon e="⚠" />
              ️ {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E5E7EB', fontSize: 11, color: '#9CA3AF' }}>
            © {currentYear} {t('posManagementSystem')} - {t('copyright')}
          </div>
        </div>
      </div>
    </div>
  );
}

// Time Display Component
function TimeDisplay({ language }: { language: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getLocale = () => {
    switch (language) {
      case 'bn': return 'bn-BD';
      case 'ar': return 'ar-SA';
      case 'hi': return 'hi-IN';
      default: return 'en-GB';
    }
  };

  const locale = getLocale();
  const timeStr = time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '4px 12px' }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: '#115E59' }}>
        {timeStr}
      </div>
      <div style={{ fontSize: 11, color: '#9CA3AF' }}>
        {dateStr}
      </div>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Prevent save before initial load
const [currentTab, setCurrentTab] = useState('pos');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Save current tab to server settings when it changes
  useEffect(() => {
    if (isInitialized) {
      localDb.saveSetting<string>('pos_current_tab', currentTab);
    }
  }, [currentTab, isInitialized]);

  // Language state
  const { language, setLanguage, t, currentLang } = useLanguage();
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Data - initialize directly in state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [productHistory, _setProductHistory] = useState<any[]>([]);
  const [settings, _setSettings] = useState<any>({ vatPercent: 15 });
  const [currentUser, _setCurrentUser] = useState<any>(DEFAULT_ADMIN);
  const [users, setUsers] = useState<User[]>([]);

  // Tabs configuration
  const otherTabs = [
    { id: 'products', icon: <Icon e="📦" /> , label: t('products') },
    { id: 'customers', icon: <Icon e="👥" /> , label: t('customers') },
    { id: 'income', icon: <Icon e="💰" /> , label: t('incomeExpenses') },
    { id: 'reports', icon: <Icon e="📊" /> , label: t('reports') },
    { id: 'settings', icon: <Icon e="⚙️" /> , label: t('settings') },
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

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [cartCustomerInput, setCartCustomerInput] = useState('');
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState<string>('15');
  const [defaultVatPercent, setDefaultVatPercent] = useState(15);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // 'all', 'available', 'low', 'out'
  const [showExpiryList, setShowExpiryList] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [currency, setCurrency] = useState('SAR '); // Currency symbol
  const fmt = (n: number) => `${currency}${(+n || 0).toLocaleString('en-IN')}`;
  
  // Load settings from localDB on startup
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedCurrency = await localDb.getSetting<string>('currency');
        if (savedCurrency) setCurrency(savedCurrency);
        
        const savedVat = await localDb.getSetting<string>('vatPercent');
        if (savedVat) setVatPercent(savedVat);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    };
    loadSettings();
  }, []);
  

  // Filter customers for dropdown
  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch) ||
    (c.id || '').toLowerCase().includes(customerSearch.toLowerCase())
  );
  
  // Search for customer profile display
  const searchedCustomer = customerSearch.length > 0 
    ? customers.find(c => 
        (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.phone || '').includes(customerSearch) ||
        (c.id || '').toLowerCase().includes(customerSearch.toLowerCase())
      )
    : null;

  // Check auth and load settings on mount
  useEffect(() => {
    const initApp = async () => {
      // Kick off big collections in parallel while settings/vat/cart resolve below
      const productsP = db.getAll<any>('products');
      const categoriesP = db.getAll<any>('categories');
      const customersP = db.getAll<any>('customers');
      const transactionsP = db.getAll<any>('transactions');
      const salesP = db.getAll<any>('sales');

      // Check if user was logged in
      const isLoggedInSetting = await db.get<boolean>('settings', 'isLoggedIn');
      if (isLoggedInSetting) {
        setIsLoggedIn(true);
      }
      
      // Load VAT settings from localDB
      const savedVat = await localDb.getSetting<string>('vatPercent');
      if (savedVat) {
        const vat = parseFloat(savedVat);
        setVatPercent(savedVat);
        setDefaultVatPercent(vat);
      }
      const savedCurrency = await localDb.getSetting<string>('currency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
      const savedDueSales = await localDb.getSetting<string>('dueSalesEnabled');
      if (savedDueSales !== null) {
        _setSettings((prev: any) => ({ ...prev, dueSalesEnabled: savedDueSales === 'true' }));
      }
      
      // Load cart state from IndexedDB
      const savedCart = await db.get<any>('cart', 'cartData');
      if (savedCart) {
        try {
          if (savedCart.cart) setCart(savedCart.cart);
          if (savedCart.selectedCustomer) setSelectedCustomer(savedCart.selectedCustomer);
          if (savedCart.customerSearch !== undefined) setCustomerSearch(savedCart.customerSearch);
          if (savedCart.discount !== undefined) setDiscount(savedCart.discount);
          if (savedCart.vatPercent !== undefined) setVatPercent(String(savedCart.vatPercent));
          if (savedCart.paidAmount !== undefined) setPaidAmount(savedCart.paidAmount);
          if (savedCart.paymentMethod) setPaymentMethod(savedCart.paymentMethod);
        } catch (e) {
          console.log('Error loading cart from IndexedDB');
        }
      }
      
      // Load held sales from IndexedDB
      const savedHeldSales = await db.get<any>('heldSales', 'heldSales');
      if (savedHeldSales) {
        try {
          setHeldSales(savedHeldSales);
        } catch (e) {
          console.log('Error loading held sales from IndexedDB');
        }
      }
      
      // Load products, categories, customers, sales from IndexedDB
      const savedProducts = await productsP;
      if (savedProducts && savedProducts.length > 0) {
        setProducts(savedProducts);
      }
      
      const savedCategories = await categoriesP;
      if (savedCategories && savedCategories.length > 0) {
        setCategories(savedCategories);
      }
      
      const savedCustomers = await customersP;
      const savedTransactions = await transactionsP;
      
      if (savedCustomers && savedCustomers.length > 0) {
        // Attach transactions to customers
        const customersWithTransactions = savedCustomers.map((customer: any) => {
          const customerTransactions = savedTransactions.filter((tx: any) => tx.customerId === customer.id);
          return {
            ...customer,
            transactions: customerTransactions.length > 0 ? customerTransactions : (customer.transactions || [])
          };
        });
        setCustomers(customersWithTransactions);
      } else {
        // Create General Customer (System) if no customers exist
        const generalCustomer: Customer = {
          id: generateGeneralCustomerId(),
          name: 'General Customer',
          phone: '',
          address: '',
          balance: 0,
          deposit: 0,
          isSystem: true,
        };
        setCustomers([generalCustomer]);
        await db.put('customers', generalCustomer.id, generalCustomer);
      }
      
      const savedSales = await salesP;
      if (savedSales && savedSales.length > 0) {
        setSales(savedSales);
      }
      
      setIsInitialized(true); // Mark as initialized before enabling saves
      setIsLoading(false);
    };
    initApp();
  }, []);

  // Save cart state to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveCartData = async () => {
      const cartData = {
        cart,
        selectedCustomer,
        customerSearch,
        discount,
        vatPercent,
        paidAmount,
        paymentMethod,
      };
      await db.put('cart', 'cartData', cartData);
    };
    saveCartData();
  }, [isInitialized, cart, selectedCustomer, customerSearch, discount, vatPercent, paidAmount, paymentMethod]);

  // Save held sales to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveHeldSales = async () => {
      await db.put('heldSales', 'heldSales', heldSales);
    };
    saveHeldSales();
  }, [isInitialized, heldSales]);

  // Save products to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveProducts = async () => {
      for (const product of products) {
        if (product?.id) {
          await db.put('products', product.id, product);
        }
      }
    };
    if (products.length > 0) saveProducts();
  }, [isInitialized, products]);

  // Save categories to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveCategories = async () => {
      for (const category of categories) {
        if (category?.id) {
          await db.put('categories', category.id, category);
        }
      }
    };
    if (categories.length > 0) saveCategories();
  }, [isInitialized, categories]);

  // Save customers to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveCustomers = async () => {
      for (const customer of customers) {
        if (customer?.id) {
          await db.put('customers', customer.id, customer);
        }
      }
    };
    if (customers.length > 0) saveCustomers();
  }, [isInitialized, customers]);

  // Delete customer from IndexedDB
  const handleDeleteCustomerFromDB = async (customer: Customer) => {
    try {
      await db.delete('customers', customer.id);
    } catch (err) {
      console.error('Failed to delete customer from IndexedDB:', err);
    }
  };

  // Save sales to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveSales = async () => {
      for (const sale of sales) {
        if (sale?.id) {
          await db.put('sales', sale.id, sale);
        }
      }
    };
    if (sales.length > 0) saveSales();
  }, [isInitialized, sales]);

  const handleLogin = async () => {
    await db.put('settings', 'isLoggedIn', true);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    await db.delete('settings', 'isLoggedIn');
    setIsLoggedIn(false);
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

  // Filter products - only show when search, category, supplier, or stock filter is selected
  const hasFilter = searchQuery || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'in';
  const filteredProducts = hasFilter ? products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSupplier = selectedSupplier === 'all' || (p.supplier || '') === selectedSupplier;
    const matchSearch = !searchQuery || 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStock = 
      stockFilter === 'in' ||
      (stockFilter === 'available' && p.stock > 0) ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= 10) ||
      (stockFilter === 'out' && p.stock <= 0);
    return matchCategory && matchSupplier && matchSearch && matchStock;
  }) : [];
  
  // Show products section when: has filter AND cart is empty
  const showProductsGrid = hasFilter && cart.length === 0;

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`"${product.name}" ${t('stockFinished')}`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`${t('maxStock')}: ${product.stock} ${product.unit}`);
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
          alert(`${t('maxStock')}: ${item.maxStock}`);
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
  const vatRate = parseFloat(vatPercent) || 0;
  const vatAmount = parseFloat((afterDiscount * vatRate / 100).toFixed(2));
  const total = afterDiscount + vatAmount;
  const paid = parseFloat(paidAmount) || 0;
  const due = total - paid;
  const change = paid > total ? paid - total : 0;

  // Checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(t('cartEmpty'));
      return;
    }

    // Check due sales permission
    const dueSalesEnabled = settings.dueSalesEnabled !== false;
    if (due > 0 && !selectedCustomer) {
      alert('⚠️ ' + t('selectCustomerOrPayFull'));
      return;
    }
    if (due > 0 && selectedCustomer && !dueSalesEnabled) {
      alert('⚠️ ডিউ সেলস সক্রিয় নেই! সেটিংসে ডিউ সেলস চালু করুন।');
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
      vatPercent: vatRate,
      vatAmount,
      total,
      paid,
      due,
      change,
      paymentMethod,
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
    setVatPercent(String(defaultVatPercent));
    setSelectedCustomer(null);
    setPaymentMethod('cash');
  };

  if (isLoading) return <LoadingScreen />;
  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="app-container">
      {/* Header - Modern Minimal Design */}
      <div style={{ background: '#FFFFFF', padding: '0 24px', flexShrink: 0, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderBottom: '2px solid #115E59' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(15,118,110,0.3)', cursor: 'pointer' }} onClick={() => setCurrentTab('pos')}><img src="/Logo.png" alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: 14 }} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#115E59', lineHeight: 1.2, width: 180, textAlign: 'center' }}>{t('posManagementSystem')}</div>
              <div style={{ fontSize: 15, color: '#9CA3AF', width: 180, textAlign: 'center' }}>{t('smartBusinessPartner')}</div>
            </div>
          </div>
          
          {/* Dynamic Menu - Scrollable */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginRight: 10, minWidth: 0, flex: 1 }}>
            {/* Scrollable Menu - Centered */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 }}>
              {/* Left Arrow */}
              <button onClick={() => scrollMenu('left')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}><Icon e="◀" /> </button>

              {/* Menu Items Container */}
              <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto', gap: 2, padding: '4px 5px', background: '#F5F5F5', borderRadius: 12, border: '1px solid #E0E0E0', scrollbarWidth: 'none', msOverflowStyle: 'none', flexShrink: 0 }}>
                <button onClick={() => setCurrentTab('pos')} style={{
                  padding: '5px 10px',
                  border: 'none',
                  background: currentTab === 'pos' ? '#ea580c' : 'transparent',
                  cursor: 'pointer',
                  color: currentTab === 'pos' ? '#FFFFFF' : '#000000',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 16 }}><Icon e="🛒" /> </span>
                  <span>{t('sales')}</span>
                </button>
                {otherTabs.map((t) => (
                  <button key={t.id} onClick={() => setCurrentTab(t.id)} style={{
                    padding: '5px 10px',
                    border: 'none',
                    background: currentTab === t.id ? '#ea580c' : 'transparent',
                    cursor: 'pointer',
                    color: currentTab === t.id ? '#FFFFFF' : '#000000',
                    fontWeight: 600,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                    borderRadius: 6,
                  }}>
                    <span style={{ fontSize: 16 }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button onClick={() => scrollMenu('right')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}><Icon e="▶" /> </button>
            </div>
          </div>

          {/* Actions Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            {/* Refresh Button */}
            <button onClick={handleHardRefresh} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#4B5563' }} title="🔄 হার্ড রিফ্রেশ"><Icon e="🔄" /> </button>
            
            {/* Fullscreen Button */}
            <button onClick={handleFullscreen} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title={isFullscreen ? '✕ বের হতে চাপুন' : '⛶ ফুল স্ক্রিন'}>{isFullscreen ? '✕' : '⛶'}</button>
            
            {/* Language Selector */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowLangDropdown(!showLangDropdown)}
                style={{ 
                  height: 34, 
                  padding: '0 12px', 
                  borderRadius: 8, 
                  border: '1px solid #e5e7eb', 
                  background: '#FFFFFF', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  fontSize: 14, 
                  fontWeight: 600,
                  transition: 'all 0.2s', 
                  color: '#4B5563' 
                }}
              > <Icon e="🌐" />
                 {currentLang.flag} {currentLang.nativeName}
              </button>
              {showLangDropdown && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  right: 0, 
                  marginTop: 4, 
                  background: '#FFFFFF', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: 8, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
                  zIndex: 100,
                  minWidth: 140,
                  overflow: 'hidden'
                }}>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setShowLangDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        border: 'none',
                        background: language === lang.code ? '#F0FDFA' : '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 14,
                        fontWeight: language === lang.code ? 600 : 400,
                        color: language === lang.code ? '#115E59' : '#4B5563',
                        textAlign: 'left',
                      }}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.nativeName}</span>
                      {language === lang.code && <span style={{ marginLeft: 'auto' }}><Icon e="✓" /> </span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title="লগআউট"><Icon e="↩" /> <Icon e="️" /> </button>

            {/* Date & Time */}
            <TimeDisplay language={language} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
        {currentTab === 'pos' && (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden', width: '100%', background: '#F9FAFB' }}>
            {/* -- LEFT: Products -- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0, position: 'relative' }}>
              {/* Search Section - Professional Modern Design */}
              <div style={{ 
                background: '#F5F5F5', border: '1px solid #E0E0E0',
                padding: '10px 20px',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Search Inputs Row - Compact Design */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Product Name Search - Enhanced Card */}
                  <div style={{ 
                    position: 'relative', 
                    flex: '2 1 240px', 
                    minWidth: 200,
                    background: '#FFFFFF',
                    borderRadius: 14,
                    border: '1px solid #D1D5DB', boxShadow: 'none',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', left: 0, top: 0, bottom: 0, 
                      width: 40, 
                      background: '#E0E0E0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px 0 0 10px'
                    }}>
                      <span style={{ fontSize: 16 }}><Icon e="📦" /> </span>
                    </div>
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                      placeholder={t('searchProduct')}
                      style={{ 
                        width: '100%', 
                        paddingLeft: 50, 
                        paddingRight: 12, 
                        height: 34, 
                        fontSize: 14, 
                        borderRadius: 14, 
                        border: 'none', 
                        background: '#FFFFFF', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        color: '#1F2937',
                        fontWeight: 500
                      }}
                    />
                  </div>

                  {/* Customer Search - Enhanced Card */}
                  <div style={{ 
                    position: 'relative', 
                    flex: '2 1 180px', 
                    minWidth: 160,
                    background: '#FFFFFF',
                    borderRadius: 14,
                    border: '1px solid #D1D5DB', boxShadow: 'none',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      position: 'absolute', left: 0, top: 0, bottom: 0, 
                      width: 40, 
                      background: '#E0E0E0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px 0 0 10px'
                    }}>
                      <span style={{ fontSize: 16 }}><Icon e="👤" /> </span>
                    </div>
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                      placeholder={t('customerSearch')}
                      style={{ 
                        width: '100%', 
                        paddingLeft: 50, 
                        paddingRight: 12, 
                        height: 34, 
                        fontSize: 14, 
                        borderRadius: 14, 
                        border: 'none', 
                        background: '#FFFFFF', 
                        outline: 'none', 
                        boxSizing: 'border-box',
                        color: '#1F2937',
                        fontWeight: 500
                      }}
                    />
                    {/* Customer Dropdown */}
                    {customerSearch.length > 0 && filteredCustomers.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 220, overflow: 'auto', marginTop: 4 }}>
                        {filteredCustomers.map(c => (
                          <div
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F0FDFA'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                          >
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{c.name}</div>
                              <div style={{ fontSize: 11, color: '#6B7280' }}>{c.phone}</div>
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              fontWeight: 600,
                              padding: '4px 5px',
                              borderRadius: 6,
                              background: c.balance > 0 ? '#FEE2E2' : '#D1FAE5',
                              color: c.balance > 0 ? '#DC2626' : '#10B981'
                            }}>
                              {c.balance > 0 ? `৳${c.balance}` : '✓ Paid'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supplier - Enhanced Select */}
                  <div style={{ 
                    flex: '1 1 140px', 
                    minWidth: 130,
                    position: 'relative'
                  }}>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => { setSelectedSupplier(e.target.value); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 12px',
                        fontSize: 13,
                        borderRadius: 14,
                        border: '1px solid #D1D5DB',
                        background: 'rgba(255,255,255,0.95)',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#1F2937',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E3A5F' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: 32
                      }}
                    >
                      <option value="all"> <Icon e="📋" /> {t('allSuppliers')}</option>
                      {[...new Set(products.map(p => p.supplier || 'Other'))].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Category - Enhanced Select */}
                  <div style={{ 
                    flex: '1 1 130px', 
                    minWidth: 120,
                    position: 'relative'
                  }}>
                    <select
                      value={selectedCategory}
                      onChange={(e) => { setSelectedCategory(e.target.value); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                      style={{
                        width: '100%',
                        height: 34,
                        padding: '0 12px',
                        fontSize: 13,
                        borderRadius: 14,
                        border: '1px solid #D1D5DB',
                        background: 'rgba(255,255,255,0.95)',
                        outline: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        color: '#1F2937',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        appearance: 'none',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%231E3A5F' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: 32
                      }}
                    >
                      <option value="all"> <Icon e="📁" /> {t('allCategories')}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick Stats Badge */}
                  <div style={{ 
                    marginLeft: 'auto',
                    display: 'flex', 
                    gap: 8,
                    flexShrink: 0
                  }}>
                    <div style={{ 
                      background: '#F5F5F5',
                      borderRadius: 14,
                      padding: '6px 12px',
                      height: 34,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxSizing: 'border-box',
                      border: '1px solid #E0E0E0'
                    }}>
                      <span style={{ fontSize: 14 }}><Icon e="📦" /> </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#424242' }}>{filteredProducts.length}</span>
                      <span style={{ fontSize: 11, color: '#757575' }}>পণ্য</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product grid */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#F9FAFB' }}>

                {/* Stock Summary Cards - Fixed Top */}
                <div style={{
                  padding: '10px 0',
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  marginBottom: 12,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#F9FAFB'
                }}>
                  {/* Stock Available Card */}
                  <div
                    onClick={() => { setStockFilter(stockFilter === 'available' ? 'all' : 'available'); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: stockFilter === 'available'
                        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                        : '#F5F5F5',
                      border: stockFilter === 'available'
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: stockFilter === 'available'
                        ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: stockFilter === 'available' ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'available' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="📦" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: stockFilter === 'available' ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('stockAvailable')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stockFilter === 'available' ? '#FFFFFF' : '#059669', lineHeight: 1 }}>{products.filter(p => p.stock > 0).length}</div>
                    </div>
                  </div>

                  {/* Low Stock Card */}
                  <div
                    onClick={() => { setStockFilter(stockFilter === 'low' ? 'all' : 'low'); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: stockFilter === 'low'
                        ? 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
                        : '#F5F5F5',
                      border: stockFilter === 'low'
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: stockFilter === 'low'
                        ? '0 4px 14px rgba(217, 119, 6, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: stockFilter === 'low' ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'low' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="⚠" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: stockFilter === 'low' ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('stockLow')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stockFilter === 'low' ? '#FFFFFF' : '#D97706', lineHeight: 1 }}>{products.filter(p => p.stock > 0 && p.stock <= 10).length}</div>
                    </div>
                  </div>

                  {/* Stock Out Card */}
                  <div
                    onClick={() => { setStockFilter(stockFilter === 'out' ? 'all' : 'out'); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(false); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: stockFilter === 'out'
                        ? 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)'
                        : '#F5F5F5',
                      border: stockFilter === 'out'
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: stockFilter === 'out'
                        ? '0 4px 14px rgba(220, 38, 38, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: stockFilter === 'out' ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'out' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="🚫" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: stockFilter === 'out' ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('stockOut')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stockFilter === 'out' ? '#FFFFFF' : '#DC2626', lineHeight: 1 }}>{products.filter(p => p.stock <= 0).length}</div>
                    </div>
                  </div>

                  {/* Expiry Card */}
                  <div
                    onClick={() => { setShowExpiryList(!showExpiryList); setShowCustomerList(false); setShowHeldSales(false); setStockFilter('all'); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: showExpiryList
                        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                        : '#F5F5F5',
                      border: showExpiryList
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: showExpiryList
                        ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: showExpiryList ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showExpiryList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="📅" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: showExpiryList ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('productExpiry')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: showExpiryList ? '#FFFFFF' : '#059669', lineHeight: 1 }}>{products.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date() && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}</div>
                    </div>
                  </div>

                  {/* Customer Card */}
                  <div
                    onClick={() => { setShowCustomerList(!showCustomerList); setShowExpiryList(false); setShowHeldSales(false); setStockFilter('all'); }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: showCustomerList
                        ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                        : '#F5F5F5',
                      border: showCustomerList
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: showCustomerList
                        ? '0 4px 14px rgba(16, 185, 129, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: showCustomerList ? 'translateY(-1px)' : 'none'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showCustomerList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="👥" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: showCustomerList ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('customers')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: showCustomerList ? '#FFFFFF' : '#059669', lineHeight: 1 }}>{customers.length}</div>
                    </div>
                  </div>

                  {/* Hold Card - Right Side */}
                  <div
                    onClick={() => {
                      if (showHeldSales) {
                        setShowHeldSales(false);
                      } else {
                        setSearchQuery('');
                        setSelectedCategory('all');
                        setSelectedSupplier('all');
                        setStockFilter('all');
                        setShowHeldSales(true);
                        setShowExpiryList(false);
                        setShowCustomerList(false);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      borderRadius: 12,
                      padding: '10px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: showHeldSales
                        ? 'linear-gradient(135deg, #115E59 0%, #0D9488 100%)'
                        : '#F5F5F5',
                      border: showHeldSales
                        ? 'none'
                        : '1px solid #E0E0E0',
                      boxShadow: showHeldSales
                        ? '0 4px 14px rgba(15, 118, 110, 0.4)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.2s ease',
                      transform: showHeldSales ? 'translateY(-1px)' : 'none',
                      position: 'relative',
                      marginLeft: 'auto'
                    }}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showHeldSales ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="📋" /> </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: showHeldSales ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('hold')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: showHeldSales ? '#FFFFFF' : '#059669', lineHeight: 1 }}>{heldSales.length > 0 ? heldSales.length : '0'}</div>
                    </div>
                    {heldSales.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>{heldSales.length}</div>
                    )}
                  </div>
                </div>
                
                {/* Show Held Sales Only - When hold is open and no filter active */}
                {showHeldSales && !showProductsGrid && (
                  <div>
                    {/* Hold Sales Header - Same Style */}
                    <div style={{ marginBottom: 12, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      
                      {/* Hold Sales Pill - Left Side */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}> <Icon e="📋" /> {t('holdSales')} ({heldSales.length})</span>
                      </div>

                      {/* Clear All Button - Right Side */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                        <button 
                          onClick={() => setShowHeldSales(false)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}> <Icon e="✕" />
                           {t('close')}
                        </button>
                      </div>
                    </div>

                    {/* Hold Sales Cards */}
                    {heldSales.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}><Icon e="📋" /> </div>
                        <div style={{ color: '#9CA3AF', fontSize: 14 }}>{t('noHoldSales')}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {heldSales.map((sale, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: '#fff',
                              border: '1.5px solid #E5E7EB',
                              borderRadius: 12,
                              padding: 0,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F0FDFA', borderBottom: '1px solid #99F6E4' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}><Icon e="📋" /> </span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#115E59' }}>{t('hold')} #{idx + 1}</span>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>({sale.items.length} items)</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const newHeld = [...heldSales];
                                  newHeld.splice(idx, 1);
                                  setHeldSales(newHeld);
                                }}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <Icon e="🗑" />
                                ️
                              </button>
                            </div>
                            
                            {/* Card Body - Items Summary */}
                            <div style={{ padding: '8px 12px' }}>
                              {sale.items.slice(0, 3).map((item, itemIdx) => (
                                <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: itemIdx < Math.min(sale.items.length - 1, 2) ? '1px dashed #E5E7EB' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}><Icon e="📦" /> </span>
                                    <div>
                                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{item.name}</div>
                                      <div style={{ fontSize: 11, color: '#6B7280' }}>×{item.quantity}</div>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: 13, fontWeight: 600, color: '#115E59' }}>{fmt(item.sellPrice * item.quantity)}</span>
                                </div>
                              ))}
                              {sale.items.length > 3 && (
                                <div style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', padding: '4px 0' }}>
                                  +{sale.items.length - 3} more items...
                                </div>
                              )}
                            </div>
                            
                            {/* Card Footer */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#F0FDFA', borderTop: '1px solid #99F6E4' }}>
                              <div>
                                <span style={{ fontSize: 11, color: '#6B7280' }}>{t('total')}: </span>
                                <span style={{ fontSize: 16, fontWeight: 700, color: '#115E59' }}>
                                  {fmt(sale.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0))}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  sale.items.forEach((item) => {
                                    const product = products.find(p => p.id === item.productId);
                                    if (product) addToCart(product);
                                  });
                                  // Remove this hold sale from the list
                                  const newHeld = [...heldSales];
                                  newHeld.splice(idx, 1);
                                  setHeldSales(newHeld);
                                }}
                                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EA580C', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 6px rgba(234,88,12,0.3)' }}> <Icon e="➕" />
                                 {t('addItems')}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Show Products when: no hold open, OR (hold open AND filter is active) */}
                {(!showHeldSales || showProductsGrid) && (
                  <>
                    {/* Active Filters Header - Same Style as Hold Sales */}
                    {(selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'in' || searchQuery) && (
                      <div style={{ marginBottom: 12, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        
                        {/* Filter Pills - Left Side */}
                        {searchQuery && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D2FE' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}> <Icon e="🔍" /> "{searchQuery}" ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Category Filter */}
                        {selectedCategory !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}> <Icon e="📁" /> {categories.find(c => c.id === selectedCategory)?.name} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Supplier Filter */}
                        {selectedSupplier !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#FEF3C7', borderRadius: 20, border: '1px solid #FDE68A' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}> <Icon e="📋" /> {selectedSupplier} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Stock Filter */}
                        {stockFilter !== 'in' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: stockFilter === 'available' ? '#F0FDFA' : stockFilter === 'low' ? '#FFF7ED' : '#FEF2F2', borderRadius: 20, border: `1px solid ${stockFilter === 'available' ? '#99F6E4' : stockFilter === 'low' ? '#FDBA74' : '#FECACA'}` }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: stockFilter === 'available' ? '#115E59' : stockFilter === 'low' ? '#EA580C' : '#DC2626' }}>
                              {stockFilter === 'available' && <> <Icon e='📦' /> {t('stockAvailable')} </> + ` (${filteredProducts.length})`}
                              {stockFilter === 'low' && '⚠️ ' + t('stockLow') + ` (${filteredProducts.length})`}
                              {stockFilter === 'out' && '⚠️ ' + t('stockOut') + ` (${filteredProducts.length})`}
                            </span>
                          </div>
                        )}
                        
                        {/* Clear All Button - Right Side */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                          <button 
                            onClick={() => {
                              setSearchQuery('');
                              setSelectedCategory('all');
                              setSelectedSupplier('all');
                              setStockFilter('all');
                              setShowHeldSales(false);
                            }}
                            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}> <Icon e="✕" />
                             {t('close')}
                          </button>
                        </div>
                      </div>
                    )}
                  
                    {/* Customer Profile Card - Show when searched */}
                    {searchedCustomer && (
                      <div style={{ marginBottom: 12, padding: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}><Icon e="👤" />
                          
                        </div>
                        <div style={{ flex: 1, color: '#fff' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{searchedCustomer.name}</div>
                          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 2 }}> <Icon e="📱" /> {searchedCustomer.phone}</div>
                          <div style={{ fontSize: 13, opacity: 0.9 }}> <Icon e="📍" /> {searchedCustomer.address}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ padding: '8px 16px', background: searchedCustomer.balance > 0 ? 'rgba(220,38,38,0.3)' : 'rgba(34,197,94,0.3)', borderRadius: 8, marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: '#fff', opacity: 0.9 }}>{t('balance')}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>৳{searchedCustomer.balance}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => { setSelectedCustomer(searchedCustomer); setCustomerSearch(''); }}
                              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#fff', color: '#667eea', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}> <Icon e="✓" />
                               {t('selectCustomer')}
                            </button>
                            <button 
                              onClick={() => setCustomerSearch('')}
                              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontSize: 12 }}><Icon e="✕" />
                              
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  

                    {/* Expiry Products List */}
                    {showExpiryList && (
                      <div style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="📅" /> </div>
                            <h3 style={{ fontSize: 14, fontWeight: 400, color: '#115E59', margin: 0 }}>{t('productExpiry')} ({products.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date() && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length})</h3>
                          </div>
                          <button onClick={() => setShowExpiryList(false)} style={{ padding: '6px 12px', borderRadius: 6, background: '#DC2626', border: 'none', fontSize: 12, cursor: 'pointer', color: 'white', fontWeight: 600 }}> <Icon e="✕" /> {t('close')}</button>
                        </div>
                        {products.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date() && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 24, background: '#F0FDFA', borderRadius: 12 }}>
                            <p style={{ color: '#9CA3AF', margin: 0 }}>No products expiring within 30 days</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                            {products.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date() && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).map(p => {
                              const daysLeft = Math.ceil((new Date(p.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              return (
                                <div key={p.id} style={{ background: '#FFFFFF', border: '1px solid #CCFBF1', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{p.name}</div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}> <Icon e="📅" /> {p.expiryDate}</div>
                                  </div>
                                  <div style={{ background: daysLeft <= 7 ? '#FEE2E2' : '#F0FDFA', color: daysLeft <= 7 ? '#DC2626' : '#115E59', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                                    {daysLeft} days
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}


                    {/* Customer List */}
                    {showCustomerList && (
                      <div style={{ padding: '16px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#14B8A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><Icon e="👥" /> </div>
                            <h3 style={{ fontSize: 14, fontWeight: 400, color: '#115E59', margin: 0 }}>{t('customers')} ({customers.length})</h3>
                          </div>
                          <button onClick={() => setShowCustomerList(false)} style={{ padding: '6px 12px', borderRadius: 6, background: '#DC2626', border: 'none', fontSize: 12, cursor: 'pointer', color: 'white', fontWeight: 600 }}> <Icon e="✕" /> {t('close')}</button>
                        </div>
                        {customers.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 24, background: '#F0FDFA', borderRadius: 12 }}>
                            <p style={{ color: '#9CA3AF', margin: 0 }}>{t('noCustomerFound')}</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                            {customers.map(c => (
                              <div key={c.id} style={{ background: '#FFFFFF', border: '1px solid #CCFBF1', borderRadius: 14, padding: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}> <Icon e="📱" /> {c.phone}</div>
                                {c.balance > 0 && (
                                  <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>বাকি: ৳{c.balance}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {showExpiryList ? (
                      null
                    ) : showCustomerList ? (
                      null
                    ) : !searchQuery && selectedCategory === 'all' && selectedSupplier === 'all' && stockFilter === 'in' && filteredProducts.length === 0 ? (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      minHeight: 'calc(100vh - 380px)'
                    }}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 40,
                        textAlign: 'center'
                      }}>
                        <div style={{
                          width: 100,
                          height: 100,
                          borderRadius: 50,
                          background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 20,
                          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)'
                        }}>
                          <span style={{ fontSize: 48 }}><Icon e="🛒" /> </span>
                        </div>
                        <div style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: '#374151',
                          marginBottom: 8,
                          letterSpacing: '-0.5px'
                        }}>
                          {t('readyForNewSale')}
                        </div>
                        <div style={{
                          fontSize: 14,
                          color: '#9CA3AF',
                          marginBottom: 24,
                          lineHeight: 1.5
                        }}>
                          {t('scanBarcode')}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: 12,
                          flexWrap: 'wrap',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            padding: '10px 16px',
                            background: '#FFFFFF',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <span style={{ fontSize: 16 }}><Icon e="▣" /> </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>{t('scanItem')}</span>
                          </div>
                          <div style={{
                            padding: '10px 16px',
                            background: '#F3F4F6',
                            borderRadius: 8,
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                          }}>
                            <span style={{ fontSize: 16 }}>＋</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>{t('addProductEmpty')}</span>
                          </div>
                        </div>
                        <div style={{
                          marginTop: 32,
                          padding: '12px 24px',
                          background: '#F9FAFB',
                          borderRadius: 8,
                          border: '1px dashed #E5E7EB'
                        }}>
                          <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#9CA3AF',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: 8
                          }}>
                            {t('quickShortcuts')}
                          </div>
                          <div style={{
                            display: 'flex',
                            gap: 16,
                            flexWrap: 'wrap',
                            justifyContent: 'center'
                          }}>
                            <span style={{ fontSize: 12, color: '#6B7280' }}><strong>{t('f2Search')}</strong></span>
                            <span style={{ fontSize: 12, color: '#6B7280' }}><strong>{t('f4Hold')}</strong></span>
                            <span style={{ fontSize: 12, color: '#6B7280' }}><strong>{t('f8Payment')}</strong></span>
                            <span style={{ fontSize: 12, color: '#6B7280' }}><strong>{t('escClear')}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : (searchQuery || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'in') ? (
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
                            borderRadius: 14,
                            background: product.stock <= 0 ? '#fecaca' : product.stock <= 10 ? '#fed7aa' : '#F0FDFA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: `2px solid ${product.stock <= 0 ? '#fca5a5' : product.stock <= 10 ? '#fdba74' : '#E5E7EB'}`,
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
                                 product.image ? product.image : <Icon e='📦' /> }
                              </span>
                            )}
                          </div>

                          {/* Product Info */}
                          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            {/* Top: Name */}
                            <div style={{ marginBottom: 4 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                                {product.name}
                              </div>
                            </div>

                            {/* Middle: Barcode & Unit */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <div style={{ fontSize: 11, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> <Icon e="📊" />
                                 {product.code || 'N/A'}
                              </div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                /{product.unit}
                              </div>
                            </div>

                            {/* Bottom: Price & Stock */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: product.stock <= 0 ? '#DC2626' : product.stock <= 10 ? '#EA580C' : '#115E59', lineHeight: 1 }}>
                                {fmt(product.sellPrice)}
                              </div>
                              <div style={{ 
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: product.stock <= 0 ? '#DC2626' : product.stock <= 10 ? '#EA580C' : '#115E59',
                                color: '#fff'
                              }}>
                                {t('stock')}: {product.stock}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    ) : null}
                  </>
                )}

              </div>
            </div>

            {/* -- RIGHT: Cart -- */}
            <div style={{ width: 360, display: 'flex', flexDirection: 'column', background: '#fafbfc', borderLeft: '1px solid #e5e7eb' }}>
              
              {/* Barcode Input - Simple */}
              <div style={{ 
                padding: '0 20px',
                background: '#F5F5F5',
                borderBottom: '1px solid #E5E7EB',
                height: 58,
                display: 'flex',
                alignItems: 'center',
              }}>
                <input
                  className="barcode-input"
                  placeholder={t('barcodePlaceholder')}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px',
                    height: 48, 
                    fontSize: 14, 
                    borderRadius: 14, 
                    border: '1px solid #D1D5DB', 
                    background: '#FFFFFF', 
                    outline: 'none', 
                    boxSizing: 'border-box',
                    fontFamily: "inherit",
                    fontWeight: 500,
                    color: '#1F2937'
                  }}
                />
              </div>

              {/* Cart Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#FFFFFF', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#115E59', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}> <Icon e="🛒" /> {t('cart')}</h3>
                  <span style={{ background: '#115E59', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>{cart.length}</span>
                </div>
                {/* Customer Input with Add Button */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', marginRight: 6 }}>
                    {selectedCustomer ? (
                      <div style={{ 
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 8,
                        background: '#D1FAE5',
                        border: '1.5px solid #10B981',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}> <Icon e="👤" />
                           {selectedCustomer.name} • {selectedCustomer.phone}
                        </span>
                        <button 
                          onClick={() => { setSelectedCustomer(null); setCartCustomerInput(''); }}
                          style={{ 
                            padding: '2px 6px', 
                            borderRadius: 8, 
                            border: 'none', 
                            background: '#FEE2E2', 
                            color: '#DC2626', 
                            fontSize: 11, 
                            fontWeight: 600, 
                            cursor: 'pointer',
                            marginLeft: 8
                          }}><Icon e="✕" />
                          
                        </button>
                      </div>
                    ) : (
                      <input
                        value={cartCustomerInput}
                        onChange={(e) => setCartCustomerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const found = customers.find(c => 
                              c.phone === cartCustomerInput.trim() || c.id === cartCustomerInput.trim()
                            );
                            if (found) {
                              setSelectedCustomer(found);
                              setCartCustomerInput('');
                            }
                          }
                        }}
                        placeholder={t('customerIdOrNumber')}
                        style={{ flex: 1, fontSize: 14, borderRadius: 8, padding: '8px 12px', border: '1.5px solid #e5e7eb', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      alert('কাস্টমার যোগ করার ফিচার শীঘ্রই আসছে!');
                    }}
                    style={{ 
                      padding: '8px 12px', 
                      borderRadius: 8, 
                      border: 'none', 
                      background: '#E0E0E0', 
                      color: '#000000', 
                      fontSize: 12, 
                      fontWeight: 600, 
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}> <Icon e="➕" />
                     Add
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflow: 'auto', background: '#fafbfc' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', background: '#FFFFFF', margin: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}><Icon e="🛒" /> </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 4 }}>{t('cartEmpty')}</div>
                    <div style={{ fontSize: 15, color: '#9CA3AF' }}>{t('addProductsFromLeft')}</div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 16px' }}>
                    {cart.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '6px 8px', background: '#FFFFFF', borderBottom: '1px dashed #e5e7eb', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#115E59', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#115E59', flexShrink: 0 }}>{fmt(item.sellPrice * item.quantity)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                            <span style={{ fontSize: 14, color: '#6B7280' }}>{item.quantity} × {fmt(item.sellPrice)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => updateQuantity(item.productId, -1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>−</button>
                              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.productId, 1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>+</button>
                              <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#FEF2F2', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginLeft: 4 }}><Icon e="✕" /> </button>
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
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 600, textAlign: 'center' }}> <Icon e="⚠" />
                    ️ {t('due')}: {fmt(due)}
                  </div>
                )}
                {change > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#F0FDF4', color: '#16A34A', fontWeight: 600, textAlign: 'center' }}> <Icon e="💵" />
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
                    }}> <Icon e="🗑" />
                    ️
                  </button>
                  {/* Hold Button */}
                  <button 
                    onClick={() => {
                      if (cart.length > 0) {
                        setHeldSales([...heldSales, { id: `hold-${Date.now()}`, items: [...cart], createdAt: new Date().toISOString() }]);
                        setCart([]);
                        setDiscount('');
                        setPaidAmount('');
                        setVatPercent(String(defaultVatPercent));
                        setPaymentMethod('cash');
                      }
                    }}
                    disabled={cart.length === 0}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                      background: '#F5F5F5',
                      color: cart.length > 0 ? '#115E59' : '#9CA3AF',
                      fontWeight: 600, fontSize: 13, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    }}>
                    📋 {t('hold')}
                  </button>
                  {/* Complete Sale Button */}
                  <button onClick={handleCheckout}
                    disabled={cart.length === 0}
                    style={{
                      padding: '12px 16px', borderRadius: 14, border: 'none',
                      background: cart.length > 0 ? '#EA580C' : '#e5e7eb',
                      color: '#fff', fontWeight: 700, fontSize: 16,
                      cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                      boxShadow: cart.length > 0 ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                    }}> <Icon e="✓" />
                     {t('completeSale')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'products' && (
          <ProductsScreen
            products={products}
            suppliers={suppliers}
            categories={categories}
            purchases={purchases}
            productHistory={productHistory}
            setProducts={setProducts}
            settings={settings}
            currentUser={currentUser}
          />
        )}

        {currentTab === 'customers' && (
          <CustomerManagement
            customers={customers}
            setCustomers={setCustomers}
            sales={sales}
            onDeleteCustomer={handleDeleteCustomerFromDB}
          />
        )}

        {currentTab === 'reports' && (
          <div>
            <h2 style={{ marginBottom: 16 }}> <Icon e="📈" /> {t('reports')}</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="label">{t('totalProducts')}</div>
                <div className="value">{products.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('totalCustomers')}</div>
                <div className="value">{customers.length}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('totalSales')}</div>
                <div className="value">{fmt(sales.reduce((sum, s) => sum + s.total, 0))}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('todaySales')}</div>
                <div className="value">
                  {fmt(sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).reduce((sum, s) => sum + s.total, 0))}
                </div>
              </div>
              <div className="stat-card">
                <div className="label">{t('totalDue')}</div>
                <div className="value" style={{ color: '#EF4444' }}>
                  {fmt(sales.reduce((sum, s) => sum + s.due, 0))}
                </div>
              </div>
              <div className="stat-card">
                <div className="label">{t('lowStockProducts')}</div>
                <div className="value" style={{ color: '#F59E0B' }}>
                  {products.filter(p => p.stock <= 10).length}
                </div>
              </div>
            </div>
            
            {/* Sales List Section */}
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}> <Icon e="🧾" /> {t('salesList')}</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>{t('date')}</th>
                      <th>{t('customer')}</th>
                      <th>{t('total')}</th>
                      <th>{t('paid')}</th>
                      <th>{t('due')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length === 0 ? (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>{t('noSalesYet')}</td></tr>
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
          </div>
        )}

        {currentTab === 'settings' && (
          <SettingsScreen 
            products={products}
            customers={customers}
            sales={sales}
            suppliers={suppliers}
            categories={categories}
            purchases={purchases}
            setProducts={setProducts}
            setCustomers={setCustomers}
            setSales={setSales}
            setSuppliers={setSuppliers}
            setCategories={setCategories}
            setPurchases={setPurchases}
            users={users}
            setUsers={setUsers}
            onRefresh={() => {
              setProducts([]);
              setCustomers([]);
              setSales([]);
              setSuppliers([]);
              setPurchases([]);
            }}
          />
        )}

        {currentTab === 'newproduct' && (
          <NewProductTab 
            products={products} 
            suppliers={suppliers}
            categories={categories}
            onAddProducts={(newProducts) => {
              const updatedProducts = [...products];
              const newProductsToAdd: Product[] = [];
              
              for (const item of newProducts) {
                const itemWithBarcode = item as any;
                const existingIndex = updatedProducts.findIndex(
                  p => p.barcode && itemWithBarcode.barcode && p.barcode === itemWithBarcode.barcode
                );
                
                if (existingIndex !== -1) {
                  const existing = updatedProducts[existingIndex];
                  updatedProducts[existingIndex] = {
                    ...existing,
                    stock: (existing.stock || 0) + (item.stock || 0),
                    costPrice: item.buyP || existing.costPrice,
                    sellPrice: item.sellP || existing.sellPrice
                  };
                } else {
                  const newProduct: Product = {
                    id: genId(),
                    name: item.name,
                    code: item.barcode || genId(),
                    costPrice: item.buyP,
                    sellPrice: item.sellP,
                    stock: item.stock,
                    unit: item.unit,
                    categoryId: '',
                    supplier: item.company,
                    image: '',
                    barcode: item.barcode,
                    company: item.company,
                    cat: item.cat,
                    minStock: item.minStock
                  };
                  newProductsToAdd.push(newProduct);
                }
              }
              
              setProducts([...updatedProducts, ...newProductsToAdd]);
            }}
            t={t}
            fmt={fmt}
          />
        )}

        {currentTab === 'barcode' && (
          <div>
            <h2 style={{ marginBottom: 16 }}> <Icon e="📊" /> {t('barcode')}</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="label">{t('code')}</label>
                <input type="text" className="input" placeholder={t('code')} />
              </div>
              <button className="btn btn-primary">{t('barcode')}</button>
              <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#F9FAFB', borderRadius: 8 }}>
                <div style={{ fontSize: 48 }}><Icon e="📊" /> </div>
                <p style={{ color: '#9CA3AF', marginTop: 8 }}>{t('barcode')} preview</p>
              </div>
            </div>
          </div>
        )}

        {currentTab === 'suppliers' && (
          <SuppliersScreen 
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            categories={categories}
            setCategories={setCategories}
            products={products}
            setProducts={setProducts}
            purchases={purchases}
          />
        )}

        {currentTab === 'inventory' && (
          <div>
            <h2 style={{ marginBottom: 16 }}> <Icon e="🏭" /> {t('stock')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><Icon e="📦" /> </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalProductsCount')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><Icon e="⚠" /> </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockLow')}</div>
              </div>
              <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><Icon e="✅" /> </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockAvailable')}</div>
              </div>
            </div>
            
            {/* Low Stock Alert Section */}
            <div className="card" style={{ border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <h3 style={{ marginBottom: 12, color: '#DC2626' }}> <Icon e="⚠" /> {t('lowStockAlert')}</h3>
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>{t('noLowStockProducts')}</p>
            </div>
          </div>
        )}

        {currentTab === 'income' && (
          <div>
            <h2 style={{ marginBottom: 16 }}> <Icon e="💰" /> {t('incomeExpenses')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}><Icon e="📈" /> </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalIncome')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}><Icon e="📉" /> </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalExpense')}</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}> <Icon e="➕" /> {t('addExpense')}</h3>
              <div className="form-group">
                <label className="label">{t('description')}</label>
                <input type="text" className="input" placeholder={t('description')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="label">{t('amount')}</label>
                  <input type="number" className="input" placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="label">{t('expenseType')}</label>
                  <select className="input">
                    <option value="income">{t('income')}</option>
                    <option value="expense">{t('expense')}</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary">{t('save')}</button>
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && lastSale && (
        <div className="modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3> <Icon e="✅" /> {t('saleComplete')}</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}><Icon e="✕" /> </button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48 }}><Icon e="✅" /> </div>
                <p style={{ fontSize: 14, color: '#6B7280' }}>{t('invoice')}: {lastSale.invoiceNo}</p>
              </div>
              <div style={{ borderBottom: '1px dashed #E5E7EB', paddingBottom: 12, marginBottom: 12 }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{t('customer')}: {lastSale.customerName}</p>
              </div>
              {lastSale.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{fmt(item.total)}</span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #E5E7EB', marginTop: 12, paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('subtotal')}:</span>
                  <span>{fmt(lastSale.subtotal)}</span>
                </div>
                {lastSale.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('discount')}:</span>
                    <span>-{fmt(lastSale.discount)}</span>
                  </div>
                )}
                {lastSale.vatAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('vat')} ({lastSale.vatPercent}%):</span>
                    <span>{fmt(lastSale.vatAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18, marginTop: 8 }}>
                  <span>{t('total')}:</span>
                  <span style={{ color: '#115E59' }}>{fmt(lastSale.total)}</span>
                </div>
                {lastSale.paid > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{t('paid')}:</span>
                    <span>{fmt(lastSale.paid)}</span>
                  </div>
                )}
                {lastSale.change > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10B981' }}>
                    <span>{t('change')}:</span>
                    <span>{fmt(lastSale.change)}</span>
                  </div>
                )}
                {lastSale.due > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#EF4444' }}>
                    <span>{t('due')}:</span>
                    <span>{fmt(lastSale.due)}</span>
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} onClick={() => setShowReceiptModal(false)}> <Icon e="✓" />
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
        alert('CSV ফাইলে কমপক্ষে হেডার ও এক পণ্য থাকতে হবে');
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
        alert(`✅ ${items.length}{t('productsCount')} যোগ হয়েছে!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', background: 'white', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}> <Icon e="📦" /> {t('newProductSave')}</span>
        <span style={{ fontSize: 14, color: '#6B7280', marginLeft: 'auto' }}>{purchaseItems.length} {t('productsAdded')}</span>
        {purchaseItems.length > 0 && (
          <button onClick={savePurchase} style={{ padding: '8px 16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}> <Icon e="💾" />
             {t('saveAll')}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Form */}
        <div style={{ flex: 1, padding: 16, overflow: 'auto', borderRight: '1px solid #E5E7EB', background: 'white' }}>
          {/* CSV Import */}
          <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <input type="file" accept=".csv" onChange={handleCsvImport} id="newProductCsvInput" style={{ display: 'none' }} />
            <label htmlFor="newProductCsvInput" style={{ padding: '8px 16px', background: '#0D9488', color: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span><Icon e="📁" /> </span> {t('csvUpload')}
            </label>
            <button onClick={downloadDemoCSV} style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span><Icon e="📥" /> </span> {t('demoCsv')}
            </button>
          </div>

          {/* Form Card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0D9488', fontWeight: 700 }}>{t('addProduct')}</h3>

            {/* Company + Category: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Company */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="🏢" /> {t('companySupplier')} *</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={supplierQ}
                    onChange={e => { setSupplierQ(e.target.value); setForm(f => ({ ...f, company: e.target.value || '' })); setShowCompanyList(true); }}
                    onFocus={() => setShowCompanyList(true)}
                    onBlur={() => setTimeout(() => setShowCompanyList(false), 200)}
                    placeholder={t('selectSupplier')}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowCompanyList(!showCompanyList)} style={{ padding: '4px 5px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}><Icon e="▼" /> </button>
                </div>
                {showCompanyList && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCompanies.map((c, i) => (
                      <div key={i} onClick={() => { setSupplierQ(c || ''); setForm(f => ({ ...f, company: c || '' })); setShowCompanyList(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                        {c}
                      </div>
                    ))}
                    {filteredCompanies.length === 0 && <div style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 14 }}>কোনো সরবরাহকারী নেই</div>}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="📂" /> {t('category')}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={form.cat}
                    onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                    onFocus={() => setShowCategoryList(true)}
                    onBlur={() => setTimeout(() => setShowCategoryList(false), 200)}
                    placeholder={t('selectCategory')}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowCategoryList(!showCategoryList)} style={{ padding: '4px 5px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}><Icon e="▼" /> </button>
                </div>
                {showCategoryList && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCategories.map((c, i) => (
                      <div key={i} onClick={() => { setForm(f => ({ ...f, cat: c || '' })); setShowCategoryList(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                        {c}
                      </div>
                    ))}
                    {filteredCategories.length === 0 && <div style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 14 }}>কোনো ক্যাটাগরি নেই</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Product Name + Barcode: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>{t('productName')} *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('enterProductName')}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="🔢" /> {t('barcode')}</label>
                <input
                  type="text"
                  value={barcodeVal}
                  onChange={e => { setBarcodeVal(e.target.value); setForm(f => ({ ...f, barcode: e.target.value })); }}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder={t('barcodeEnter')}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Unit + Stock + MinStock: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="📥" /> {t('unit')}</label>
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box', cursor: 'pointer' }}
                >
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="📥" /> {t('stock')}</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="⚠" /> {t('minStock')}</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))}
                  placeholder="5"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Buy Price + Sell Price + Profit: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="💰" /> {t('purchasePrice')}</label>
                <input
                  type="number"
                  value={form.buyP}
                  onChange={e => setForm(f => ({ ...f, buyP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="💵" /> {t('sellPrice')}</label>
                <input
                  type="number"
                  value={form.sellP}
                  onChange={e => setForm(f => ({ ...f, sellP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="📊" /> {t('profit')}</label>
                <div style={{ padding: '10px 12px', background: '#DCFCE7', borderRadius: 8, fontWeight: 700, color: '#166534', fontSize: 14, border: '1px solid #BBF7D0' }}>
                  {typeof profit === 'number' ? profit : profit} {typeof profitPercent === 'number' ? `(${profitPercent}%)` : ''}
                </div>
              </div>
            </div>

            {/* VAT + VAT Amount + Total: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}> <Icon e="🧾" /> {t('vatPercent')}</label>
                <input
                  type="number"
                  value="15"
                  readOnly
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, background: '#FFF7ED', color: '#C2410C', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>{t('vatAmount')}</label>
                <div style={{ padding: '10px 12px', background: '#FFF7ED', borderRadius: 8, fontWeight: 700, color: '#C2410C', fontSize: 14, border: '1px solid #FDBA74' }}>
                  {vatAmount}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>{t('totalSellPrice')}</label>
                <div style={{ padding: '10px 12px', background: '#CCFBF1', borderRadius: 8, fontWeight: 700, color: '#0D9488', fontSize: 14, border: '1px solid #99F6E4' }}>
                  {totalSellPrice}
                </div>
              </div>
            </div>

            {/* Add Button */}
            <button onClick={addItem} style={{ width: '100%', padding: '12px', background: '#0D9488', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}> <Icon e="➕" />
               {t('addToProductList')}
            </button>
          </div>
        </div>

        {/* Right: Purchase List */}
        <div style={{ width: 350, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB' }}>
          <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700 }}> <Icon e="📋" /> {t('productList')} ({purchaseItems.length})</h3>

          {purchaseItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', fontSize: 14 }}>
              {t('noProductsYet2')}<br />
              <span style={{ fontSize: 13 }}>{t('fillFormAbove')}</span>
            </div>
          ) : (
            purchaseItems.map((item, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E7EB', padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.name}</div>
                  <div style={{ fontSize: 13, color: '#6B7280' }}> <Icon e="🏢" />
                     {item.company} {item.cat ? `- 📂 ${item.cat}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', gap: 8, marginTop: 4 }}>
                    <span> <Icon e="📦" /> {item.stock} {item.unit}</span>
                    <span> <Icon e="💰" /> {fmt(item.buyP)}</span>
                    <span> <Icon e="💵" /> {fmt(item.sellP)}</span>
                  </div>
                  {item.barcode && <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 }}> <Icon e="🔢" /> {item.barcode}</div>}
                </div>
                <button onClick={() => removeItem(i)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 8 }}><Icon e="🗑" /> <Icon e="️" /> </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// SUPPLIERS SCREEN COMPONENT
// ===========================================
interface Supplier {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  crNumber: string;
  vatNumber: string;
  company: string;
  isAuto?: boolean;
}

interface SupplierCategory {
  id: string;
  name: string;
  company?: string;
}

interface SuppliersScreenProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  categories: SupplierCategory[];
  setCategories: React.Dispatch<React.SetStateAction<SupplierCategory[]>>;
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  purchases: any[];
}
function SuppliersScreen({ suppliers, setSuppliers, categories, setCategories, products, setProducts, purchases }: SuppliersScreenProps) {
  const { t } = useLanguage();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'categories'>(() => 
    'companies'
  );
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [viewCategory, setViewCategory] = useState<SupplierCategory | null>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<Supplier | null>(null);

  // Save activeTab to server settings when it changes
  useEffect(() => {
    localDb.saveSetting<string>('pos_suppliers_tab', activeTab);
  }, [activeTab]);
  
  // Form states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: ''
  });
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SupplierCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });
  
  const [showProductModal, setShowProductModal] = useState(false);
  const [productForm, setProductForm] = useState<{
    company: string; cat: string; name: string; barcode: string; unit: string; buyP: string; sellP: string; stock: string; minStock: string
  }>({
    company: '', cat: '', name: '', barcode: '', unit: 'পিস', buyP: '', sellP: '', stock: '0', minStock: '5'
  });
  
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [catQ] = useState('');
  
  // All unique companies from products
  const allCompanies = [...new Set(products.map(p => p.company).filter(Boolean))];
  
  // Combined list of suppliers + auto companies
  const allSuppliers = [
    ...suppliers,
    ...allCompanies.filter(c => !suppliers.find(s => (s.name || '').toLowerCase() === (c || '').toLowerCase()))
      .map(c => ({ id: `auto-${c}`, name: c, code: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', company: c, isAuto: true }))
  ];
  
  // Get products count for a company
  const getProductsCount = (company: string) => 
    products.filter(p => (p.company || '').toLowerCase() === (company || '').toLowerCase()).length;
  
  // Get purchases for a supplier
  const getSupplierPurchases = (name: string) => 
    purchases.filter(p => (p.supplier || '').toLowerCase() === (name || '').toLowerCase());
  
  // Filter suppliers
  const filteredSuppliers = allSuppliers
    .filter(s => 
      !search || 
      (s.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.phone || '').includes(search) ||
      (s.code || '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => getProductsCount(b.name) - getProductsCount(a.name));
  
  // Filter categories
  const filteredCategories = categories
    .filter(c => !search || (c.name || '').toLowerCase().includes(search.toLowerCase()));
  
  // Filter companies for dropdown
  const filteredCompanies = suppliers;
  
  // Filter cats for dropdown
  const companyCats = productForm.company 
    ? categories.filter(c => !c.company || c.company.toLowerCase() === productForm.company.toLowerCase())
    : categories;
  const filteredCats = companyCats.filter(c => !catQ || (c.name || '').toLowerCase().includes(catQ.toLowerCase()));

  // Save Supplier
  const saveSupplier = async () => {
    if (!supplierForm.name?.trim()) {
      alert(t('enterSupplierName') || 'সরবরাহকারীর নাম লিখুন!');
      return;
    }
    
    const nameLower = supplierForm.name.trim().toLowerCase();
    
    // Check duplicate
    const exists = suppliers.some(s => 
      s.id !== editingSupplier?.id && (s.name || '').toLowerCase().trim() === nameLower
    );
    if (exists) {
      alert('❌ এই সরবরাহকারীর নাম ইতিমধ্যে আছে!');
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
        alert('✅ সরবরাহকারী আপডেট করা হয়েছে!');
      } else {
        const newSupplier: Supplier = {
          id: genId(),
          code: codeToUse,
          name: supplierForm.name.trim(),
          phone: supplierForm.phone || '',
          email: supplierForm.email || '',
          address: supplierForm.address || '',
          crNumber: supplierForm.crNumber || '',
          vatNumber: supplierForm.vatNumber || '',
          company: supplierForm.name.trim()
        };
        setSuppliers(prev => [...prev, newSupplier]);
        alert(`✅ সরবরাহকারী যোগ করা হয়েছে!\nকোড: ${codeToUse}`);
      }
      
      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' });
    } catch (error) {
      console.error('Failed to save supplier:', error);
      alert('❌ সমস্যা হয়েছে!');
    }
  };
  
  // Delete Supplier
  const deleteSupplier = async (supplier: Supplier) => {
    const hasProducts = products.some(p => (p.company || '').toLowerCase() === (supplier.name || '').toLowerCase());
    if (hasProducts) {
      alert('❌ এই কোম্পানিতে পণ্য আছে বলে মুছা যাবে না!');
      return;
    }
    
    if (!confirm('এই কোম্পানি মুছে ফেলবেন?')) return;
    
    try {
      setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
      setViewSupplier(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ ডিলিট ব্যর্থ হয়েছে!');
    }
  };
  
  // Save Category
  const saveCategory = async () => {
    if (!categoryForm.name?.trim()) {
      alert('ক্যাটাগরির নাম দিন');
      return;
    }
    
    try {
      if (editingCategory) {
        const updated: SupplierCategory = { ...editingCategory, name: categoryForm.name.trim() };
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
        alert('✅ ক্যাটাগরি আপডেট হয়েছে!');
      } else {
        const newCategory: SupplierCategory = {
          id: genId(),
          name: categoryForm.name.trim()
        };
        setCategories(prev => [...prev, newCategory]);
        alert('✅ ক্যাটাগরি যোগ হয়েছে!');
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('❌ সমস্যা হয়েছে!');
    }
  };
  
  // Delete Category
  const deleteCategory = async (cat: SupplierCategory) => {
    const hasProducts = products.some(p => (p.cat || '').toLowerCase() === (cat.name || '').toLowerCase());
    if (hasProducts) {
      alert('❌ এই ক্যাটাগরিতে পণ্য আছে!');
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
      alert('❌ কোম্পানি, ক্যাটাগরি এবং পণ্যের নাম দিন!');
      return;
    }
    
    try {
      // Check if category exists, create if not
      let catId = categories.find(c => (c.name || '').toLowerCase() === (productForm.cat || '').toLowerCase())?.id;
      if (!catId) {
        catId = genId();
        setCategories(prev => [...prev, { id: catId!, name: productForm.cat.trim() }]);
      }
      
      const newProduct = {
        id: genId(),
        name: productForm.name.trim(),
        code: `P-${Date.now().toString().slice(-6)}`,
        company: productForm.company.trim(),
        cat: productForm.cat.trim(),
        catId: catId!,
        barcode: productForm.barcode || '',
        unit: productForm.unit || 'পিস',
        buyPrice: parseFloat(productForm.buyP) || 0,
        sellPrice: parseFloat(productForm.sellP) || 0,
        stock: parseInt(productForm.stock) || 0,
        minStock: parseInt(productForm.minStock) || 5,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      setProducts(prev => [...prev, newProduct]);
      
      // Also add as supplier if not exists
      const supplierExists = suppliers.some(s => (s.name || '').toLowerCase() === (productForm.company || '').toLowerCase());
      if (!supplierExists) {
        const newSupplier: Supplier = {
          id: genId(),
          code: `C-${Date.now().toString().slice(-5)}`,
          name: productForm.company.trim(),
          phone: '', email: '', address: '', crNumber: '', vatNumber: '', company: productForm.company.trim()
        };
        setSuppliers(prev => [...prev, newSupplier]);
      }
      
      alert('✅ পণ্য যোগ করা হয়েছে!');
      setShowProductModal(false);
      setProductForm({ company: '', cat: '', name: '', barcode: '', unit: 'পিস', buyP: '', sellP: '', stock: '0', minStock: '5' });
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('❌ সমস্যা হয়েছে!');
    }
  };

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1F2937' }}> <Icon e="🏢" />
           {t('suppliers') || 'সরবরাহকারী'}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => { setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' }); setEditingSupplier(null); setShowSupplierModal(true); }}
            style={{ padding: '8px 14px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}> <Icon e="➕" />
             {t('company')}</button>
          <button
            onClick={() => { setCategoryForm({ name: '' }); setEditingCategory(null); setShowCategoryModal(true); }}
            style={{ padding: '8px 14px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}> <Icon e="📂" />
             {t('category')}</button>
          <button
            onClick={() => setShowProductModal(true)}
            style={{ padding: '8px 14px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}> <Icon e="📦" />
             পণ্য
          </button>
        </div>
      </div>
      
      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 সরবরাহকারী বা ক্যাটাগরি খুঁজুন..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
        />
      </div>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setActiveTab('companies')}
          style={{ padding: '8px 16px', background: activeTab === 'companies' ? '#115E59' : '#F3F4F6', color: activeTab === 'companies' ? '#fff' : '#4B5563', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}> <Icon e="🏢" />
           কোম্পানি ({allSuppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{ padding: '8px 16px', background: activeTab === 'categories' ? '#115E59' : '#F3F4F6', color: activeTab === 'categories' ? '#fff' : '#4B5563', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}> <Icon e="📂" />
           ক্যাটাগরি ({categories.length})
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'companies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filteredSuppliers.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              কোনো কোম্পানি পাওয়া যায়নি
            </div>
          ) : filteredSuppliers.map(s => (
            <div
              key={s.id}
              onClick={() => setViewSupplier(s)}
              style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}> <Icon e="🏢" />
                     {s.name}
                    {s.isAuto && <span style={{ fontSize: 10, background: '#FEF3C7', color: '#D97706', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Auto</span>}
                  </div>
                  {s.code && <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>কোড: {s.code}</div>}
                  {s.phone && <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}> <Icon e="📞" /> {s.phone}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#115E59' }}>{getProductsCount(s.name)}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>পণ্য</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {activeTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {filteredCategories.length === 0 ? (
            <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
              কোনো ক্যাটাগরি পাওয়া যায়নি
            </div>
          ) : filteredCategories.map(c => (
            <div
              key={c.id}
              onClick={() => setViewCategory(c)}
              style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}> <Icon e="📂" /> {c.name}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{products.filter(p => (p.cat || '').toLowerCase() === (c.name || '').toLowerCase()).length} পণ্য</div>
            </div>
          ))}
        </div>
      )}
      
      {/* Supplier Detail Modal */}
      {viewSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}> <Icon e="🏢" /> {viewSupplier.name}</h3>
              <button onClick={() => setViewSupplier(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            {viewSupplier.code && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}>কোড: <strong>{viewSupplier.code}</strong></div>}
            {viewSupplier.phone && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}> <Icon e="📞" /> {viewSupplier.phone}</div>}
            {viewSupplier.email && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}><Icon e="✉" /> <Icon e="️" /> {viewSupplier.email}</div>}
            {viewSupplier.address && <div style={{ marginBottom: 16, fontSize: 14, color: '#6B7280' }}> <Icon e="📍" /> {viewSupplier.address}</div>}
            
            <div style={{ background: '#F0FDFA', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#115E59' }}>{getProductsCount(viewSupplier.name)}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>মোট পণ্য সংখ্যা</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowPurchaseHistory(viewSupplier); setViewSupplier(null); }}
                style={{ flex: 1, padding: '10px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}> <Icon e="📜" />
                 ক্রয় ইতিহাস
              </button>
              {!viewSupplier.isAuto && (
                <>
                  <button
                    onClick={() => { setSupplierForm(viewSupplier); setEditingSupplier(viewSupplier); setShowSupplierModal(true); setViewSupplier(null); }}
                    style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}> <Icon e="✏" />
                    ️ সম্পাদনা
                  </button>
                  <button
                    onClick={() => deleteSupplier(viewSupplier)}
                    style={{ flex: 1, padding: '10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}> <Icon e="🗑" />
                    ️ মুছুন
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Category Detail Modal */}
      {viewCategory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 400, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}> <Icon e="📂" /> {viewCategory.name}</h3>
              <button onClick={() => setViewCategory(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            <div style={{ background: '#F0FDFA', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#115E59' }}>{products.filter(p => (p.cat || '').toLowerCase() === (viewCategory.name || '').toLowerCase()).length}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>পণ্য সংখ্যা</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setCategoryForm(viewCategory); setEditingCategory(viewCategory); setShowCategoryModal(true); setViewCategory(null); }}
                style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}> <Icon e="✏" />
                ️ সম্পাদনা
              </button>
              <button
                onClick={() => deleteCategory(viewCategory)}
                style={{ flex: 1, padding: '10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}> <Icon e="🗑" />
                ️ মুছুন
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Purchase History Modal */}
      {showPurchaseHistory && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}> <Icon e="📜" /> {showPurchaseHistory.name} - ক্রয় ইতিহাস</h3>
              <button onClick={() => setShowPurchaseHistory(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            {getSupplierPurchases(showPurchaseHistory.name).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>কোনো ক্রয় পাওয়া যায়নি</div>
            ) : (
              <div>
                {getSupplierPurchases(showPurchaseHistory.name).map((p, i) => (
                  <div key={i} style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{new Date(p.date).toLocaleDateString()}</span>
                      <span style={{ fontWeight: 700, color: '#115E59' }}>৳{p.total?.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>আইটেম: {p.items?.length || 0}টি</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Supplier Modal */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 400, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>
              <> <Icon e={editingSupplier ? '✏' : '➕'} /> {editingSupplier ? 'সরবরাহকারী সম্পাদনা' : 'নতুন কোম্পানি'}</>
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="🏢" /> নাম *</label>
                <input
                  value={supplierForm.name}
                  onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="কোম্পানির নাম"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📞" /> ফোন</label>
                <input
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="ফোন নম্বর"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><Icon e="✉" /> <Icon e="️" /> ইমেইল</label>
                <input
                  value={supplierForm.email}
                  onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="ইমেইল"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📍" /> ঠিকানা</label>
                <input
                  value={supplierForm.address}
                  onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="ঠিকানা"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowSupplierModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                বাতিল
              </button>
              <button onClick={saveSupplier} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}> <Icon e="💾" />
                 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 400, padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>
              <> <Icon e={editingCategory ? '✏' : '➕'} /> {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি'}</>
            </h3>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📂" /> নাম *</label>
              <input
                value={categoryForm.name}
                onChange={e => setCategoryForm({ name: e.target.value })}
                placeholder="ক্যাটাগরির নাম"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                বাতিল
              </button>
              <button onClick={saveCategory} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}> <Icon e="💾" />
                 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 450, maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}> <Icon e="📦" /> {t('newProductButton')} যোগ করুন</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Company Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="🏢" /> কোম্পানি *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.company}
                    onChange={e => { setProductForm(p => ({ ...p, company: e.target.value, cat: '' })); setShowCompanyDrop(true); }}
                    placeholder="সরবরাহকারী নির্বাচন করুন"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCompanyDrop && filteredCompanies.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCompanies.map(s => (
                        <div key={s.id} onClick={() => { setProductForm(p => ({ ...p, company: s.name })); setShowCompanyDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseOver={e => (e.currentTarget.style.background = '#F0FDFA')} onMouseOut={e => (e.currentTarget.style.background = '#fff')}> <Icon e="🏢" />
                           {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📂" /> ক্যাটাগরি *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.cat}
                    onChange={e => { setProductForm(p => ({ ...p, cat: e.target.value })); setShowCatDrop(true); }}
                    placeholder="ক্যাটাগরি নির্বাচন করুন"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCatDrop && filteredCats.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCats.map(c => (
                        <div key={c.id} onClick={() => { setProductForm(p => ({ ...p, cat: c.name })); setShowCatDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseOver={e => (e.currentTarget.style.background = '#F0FDFA')} onMouseOut={e => (e.currentTarget.style.background = '#fff')}> <Icon e="📂" />
                           {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📦" /> পণ্যের নাম *</label>
                <input
                  value={productForm.name}
                  onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="পণ্যের নাম"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📊" /> বারকোড</label>
                <input
                  value={productForm.barcode}
                  onChange={e => setProductForm(p => ({ ...p, barcode: e.target.value }))}
                  placeholder="বারকোড (ঐচ্ছিক)"
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="💰" /> {t('buyPrice')}</label>
                  <input
                    type="number"
                    value={productForm.buyP}
                    onChange={e => setProductForm(p => ({ ...p, buyP: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="💵" /> {t('sellPrice')}</label>
                  <input
                    type="number"
                    value={productForm.sellP}
                    onChange={e => setProductForm(p => ({ ...p, sellP: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📦" /> {t('stock')}</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="📏" /> {t('unit')}</label>
                  <input
                    value={productForm.unit}
                    onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    placeholder="পিস"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}> <Icon e="⚠" /> মিন স্টক</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={e => setProductForm(p => ({ ...p, minStock: e.target.value }))}
                    placeholder="5"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                বাতিল
              </button>
              <button onClick={saveProduct} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}> <Icon e="💾" />
                 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  deposit: number;
  avatar?: string;
  transactions?: Transaction[];
  isSystem?: boolean;
}

interface Transaction {
  id: string;
  type: 'due' | 'deposit';
  amount: number;
  note?: string;
  paymentMethod?: string;
  date: string;
}

interface CustomerManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  sales: any[];
  onDeleteCustomer?: (customer: Customer) => void;
}

type ViewType = 'dashboard' | 'general' | 'regular';
type TabType = 'all' | 'due' | 'deposit';

// Generate 13-digit ID (YYMMDD + 7 random digits)
const generateCustomerId = (): string => {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random7 = Math.floor(1000000 + Math.random() * 9000000).toString();
  return `${yy}${mm}${dd}${random7}`;
};

// Unified Customer Modal Component (Add/Edit)
interface CustomerModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  customer?: Customer | null;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

function CustomerModal({ isOpen, mode, customer, onClose, onSave }: CustomerModalProps) {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const isEditMode = mode === 'edit';

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && customer) {
        setCustomerId(customer.id);
        setName(customer.name);
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setAvatar(customer.avatar || null);
      } else {
        setCustomerId('');
        setName('');
        setPhone('');
        setAddress('');
        setAvatar(null);
      }
      setNameError('');
      setIsCameraOpen(false);
      stopCamera();
    }
  }, [isOpen, isEditMode, customer]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      alert('Camera access denied or not available');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setAvatar(imageData);
        stopCamera();
        setIsCameraOpen(false);
      }
    }
  };

  const handleBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar(null);
  };

  const handleSave = () => {
    // Validate name
    if (!name.trim()) {
      setNameError(t('customerNameRequired'));
      return;
    }

    // Generate ID if empty (only in add mode)
    const finalId = isEditMode ? customerId : (customerId.trim() || generateCustomerId());

    // Create/update customer
    const savedCustomer: Customer = {
      id: finalId,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      balance: isEditMode && customer ? customer.balance : 0,
      deposit: isEditMode && customer ? customer.deposit : 0,
      avatar: avatar || undefined,
    };

    onSave(savedCustomer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: T.white,
        borderRadius: '12px',
        width: '90%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: `1px solid ${T.gray200}`,
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
            {isEditMode ? t('customerEdit') : t('newCustomer')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: T.gray400,
              padding: '2px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Body - Compact */}
        <div style={{ padding: '12px 16px' }}>
          {/* Profile Image Section - Compact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            {/* Avatar Preview - Smaller */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: T.gray100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `2px dashed ${T.gray200}`,
              flexShrink: 0,
            }}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px' }}><Icon e="👤" /> </span>
              )}
            </div>

            {/* Action Buttons - Horizontal */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {isCameraOpen ? (
                <>
                  <button
                    onClick={capturePhoto}
                    style={{
                      padding: '6px 10px',
                      background: T.teal,
                      color: T.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  > <Icon e="📷" />
                     Capture
                  </button>
                  <button
                    onClick={() => { stopCamera(); setIsCameraOpen(false); }}
                    style={{
                      padding: '6px 10px',
                      background: T.gray100,
                      color: T.gray600,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  ><Icon e="✕" />
                    
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startCamera}
                    style={{
                      padding: '6px 10px',
                      background: T.teal,
                      color: T.white,
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  > <Icon e="📷" />
                     {t('camera')}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      padding: '6px 10px',
                      background: T.gray100,
                      color: T.gray800,
                      border: `1px solid ${T.gray200}`,
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  > <Icon e="📁" />
                     {t('browse')}
                  </button>
                  {avatar && (
                    <button
                      onClick={handleRemovePhoto}
                      style={{
                        padding: '6px 10px',
                        background: T.redLight,
                        color: T.red,
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    > <Icon e="❌" />
                       {t('remove')}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hidden video and canvas for camera */}
          <div style={{ display: 'none' }}>
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} />
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleBrowse}
            style={{ display: 'none' }}
          />

          {/* Form Fields - Compact */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* ID Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerIdOptional')}
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={isEditMode}
                placeholder={isEditMode ? '' : 'Auto-generated if empty'}
                readOnly={isEditMode}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: isEditMode ? T.gray100 : T.white,
                  color: isEditMode ? T.gray400 : T.gray800,
                  cursor: isEditMode ? 'not-allowed' : 'text',
                }}
              />
            </div>

            {/* Name Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerNameLabel')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(''); }}
                placeholder={t('enterCustomerName')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${nameError ? T.red : T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {nameError && (
                <span style={{ fontSize: '11px', color: T.red, marginTop: '2px', display: 'block' }}>
                  {nameError}
                </span>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('phoneNumber')}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phoneNumber')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Address Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                color: T.gray600,
                marginBottom: '4px',
                textTransform: 'uppercase',
              }}>
                {t('customerAddress')}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('customerAddress')}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${T.gray200}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: `1px solid ${T.gray200}`,
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              background: T.gray100,
              color: T.gray800,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px',
              background: T.teal,
              color: T.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          > <Icon e="💾" />
             {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomerManagement({ customers, setCustomers, sales, onDeleteCustomer }: CustomerManagementProps) {
  const { t, isRTL } = useLanguage();
  const [view, setView] = useState<ViewType>(() => 'dashboard');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(() => 'all');
  
  // Save view to server settings when it changes
  useEffect(() => {
    localDb.saveSetting<string>('pos_customer_view', view);
  }, [view]);

  // Save activeTab to server settings when it changes
  useEffect(() => {
    localDb.saveSetting<string>('pos_customer_tab', activeTab);
  }, [activeTab]);
  
  // Add Due/Deposit Modal states
  const [isAddDueModalOpen, setIsAddDueModalOpen] = useState(false);
  const [isAddDepositModalOpen, setIsAddDepositModalOpen] = useState(false);
  
  // Modal form states (hooks must be at top level)
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [depositComment, setDepositComment] = useState('');
  const [dueAmount, setDueAmount] = useState('');
  const [dueComment, setDueComment] = useState('');
  const modalFmt = (n: number) => `$${(+n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper to create transaction
  const createTransaction = (type: 'due' | 'deposit', amount: number, note?: string, paymentMethod?: string): Transaction => ({
    id: Date.now().toString(),
    type,
    amount,
    note,
    paymentMethod,
    date: new Date().toISOString(),
  });

  // Add Deposit Modal - Render early to prevent issues
  if (isAddDepositModalOpen && selectedCustomer) {
    const currentDue = selectedCustomer.balance > 0 ? selectedCustomer.balance : 0;
    const currentDeposit = selectedCustomer.deposit || 0;
    
    const handleAddDeposit = async () => {
      const amount = parseFloat(depositAmount) || 0;
      if (amount <= 0) return;
      
      let newBalance = selectedCustomer.balance;
      let newDeposit = selectedCustomer.deposit || 0;
      
      // If customer has due, pay it first
      if (currentDue > 0) {
        if (amount <= currentDue) {
          // Full amount goes to pay due
          newBalance = currentDue - amount;
        } else {
          // Amount exceeds due, pay due first, rest goes to deposit
          newBalance = 0;
          newDeposit = currentDeposit + (amount - currentDue);
        }
      } else {
        // No due, full amount goes to deposit
        newDeposit = currentDeposit + amount;
      }
      
      const newTransaction = createTransaction('deposit', amount, depositComment || undefined, selectedPayment);
      const newTransactions = [...(selectedCustomer.transactions || []), newTransaction];
      
      // Save transaction to DB
      await db.put('transactions', newTransaction.id, { ...newTransaction, customerId: selectedCustomer.id });
      
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, balance: newBalance, deposit: newDeposit, transactions: newTransactions } 
          : c
      ));
      setSelectedCustomer({ 
        ...selectedCustomer, 
        balance: newBalance, 
        deposit: newDeposit,
        transactions: newTransactions,
      });
      setDepositAmount('');
      setDepositComment('');
      setSelectedPayment('cash');
      setIsAddDepositModalOpen(false);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: T.white,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.gray200}`,
          }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name} – {t('addDeposit')}
            </h2>
            <button
              onClick={() => setIsAddDepositModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: T.gray400,
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Notice Banner */}
          <div style={{
            margin: '16px 20px',
            padding: '12px 16px',
            background: T.tealLight,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}><Icon e="💰" /> </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: T.tealDark }}>{t('addDepositAmount')}</span>
          </div>

          {/* Summary Bar */}
          <div style={{
            margin: '0 20px 16px',
            padding: '12px 16px',
            background: T.gray50,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {currentDue > 0 && (
                <>
                  <div>
                    <span style={{ fontSize: '12px', color: T.gray600 }}>{t('currentDue')}: </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: T.red }}>{modalFmt(currentDue)}</span>
                  </div>
                  <span style={{ color: T.gray400 }}>|</span>
                </>
              )}
              <div>
                <span style={{ fontSize: '12px', color: T.gray600 }}>{t('currentDeposit')}: </span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: T.tealDark }}>{modalFmt(currentDeposit)}</span>
              </div>
            </div>
            {currentDue > 0 ? (
              <div style={{ fontSize: '12px', color: T.gray600, textAlign: 'center' }}>
                {t('depositWillPayDue')}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: T.gray600, textAlign: 'center' }}>
                {t('depositAddedToAccount')}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('depositAmount')}
            </label>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Payment Method */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '8px', textTransform: 'uppercase' }}>
              {t('paymentMethod')}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {['cash', 'card', 'bank', 'mobile'].map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  style={{
                    padding: '10px 8px',
                    background: selectedPayment === method ? T.tealLight : T.white,
                    color: selectedPayment === method ? T.tealDark : T.gray800,
                    border: selectedPayment === method ? `2px solid ${T.tealDark}` : `1px solid ${T.gray200}`,
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {method === 'cash' ? '💵' : method === 'card' ? '💳' : method === 'bank' ? '🏦' : '📱'}
                  </span>
                  <span>{t(method)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('comment')}
            </label>
            <textarea
              value={depositComment}
              onChange={(e) => setDepositComment(e.target.value)}
              placeholder={t('reasonForDeposit')}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            borderTop: `1px solid ${T.gray200}`,
          }}>
            <button
              onClick={() => setIsAddDepositModalOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddDeposit}
              style={{
                flex: 1,
                padding: '12px',
                background: T.tealDark,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            > <Icon e="✓" />
               {t('addDeposit')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add Due Modal - Render early to prevent issues
  if (isAddDueModalOpen && selectedCustomer) {
    const currentDue = selectedCustomer.balance > 0 ? selectedCustomer.balance : 0;
    
    const handleAddDue = async () => {
      const amount = parseFloat(dueAmount) || 0;
      if (amount <= 0) return;
      
      const newBalance = currentDue + amount;
      const newTransaction = createTransaction('due', amount, dueComment || undefined);
      const newTransactions = [...(selectedCustomer.transactions || []), newTransaction];
      
      // Save transaction to DB
      await db.put('transactions', newTransaction.id, { ...newTransaction, customerId: selectedCustomer.id });
      
      setCustomers(prev => prev.map(c => 
        c.id === selectedCustomer.id 
          ? { ...c, balance: newBalance, transactions: newTransactions } 
          : c
      ));
      setSelectedCustomer({ ...selectedCustomer, balance: newBalance, transactions: newTransactions });
      setDueAmount('');
      setDueComment('');
      setIsAddDueModalOpen(false);
    };

    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}>
        <div style={{
          background: T.white,
          borderRadius: '16px',
          width: '90%',
          maxWidth: '420px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.gray200}`,
          }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name} – {t('addDue')}
            </h2>
            <button
              onClick={() => setIsAddDueModalOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: T.gray400,
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Notice Banner */}
          <div style={{
            margin: '16px 20px',
            padding: '12px 16px',
            background: T.redLight,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}><Icon e="📋" /> </span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: T.red }}>{t('addDueAmount')}</span>
          </div>

          {/* Summary Bar */}
          <div style={{
            margin: '0 20px 16px',
            padding: '12px 16px',
            background: T.gray50,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div>
              <span style={{ fontSize: '12px', color: T.gray600, marginRight: '8px' }}>{t('currentDue')}: </span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: T.red }}>{modalFmt(currentDue)}</span>
            </div>
            <div style={{ fontSize: '12px', color: T.gray600, textAlign: 'center' }}>
              {t('dueWillBeAdded')}
            </div>
          </div>

          {/* Amount Input */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('dueAmount')}
            </label>
            <input
              type="number"
              value={dueAmount}
              onChange={(e) => setDueAmount(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 600,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Comment */}
          <div style={{ padding: '0 20px 16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: T.gray600, marginBottom: '6px', textTransform: 'uppercase' }}>
              {t('comment')}
            </label>
            <textarea
              value={dueComment}
              onChange={(e) => setDueComment(e.target.value)}
              placeholder={t('reasonForDue')}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: `1px solid ${T.gray200}`,
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 20px',
            borderTop: `1px solid ${T.gray200}`,
          }}>
            <button
              onClick={() => setIsAddDueModalOpen(false)}
              style={{
                flex: 1,
                padding: '12px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAddDue}
              style={{
                flex: 1,
                padding: '12px',
                background: T.red,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            > <Icon e="✓" />
               {t('addDue')}
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
            }}><Icon e="🔍" /> </span>
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
            <span><Icon e="📤" /> </span> {t('csvExport')}
          </button>
        </div>

        {/* Customer Cards Grid */}
        <div style={{ ...cardGridStyle, marginTop: '16px' }}>
          {/* General Customer Card - First */}
          {generalCustomer && (
            <div style={{
              background: T.white,
              borderRadius: '14px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: `2px solid ${T.tealDark}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: T.tealDark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  color: T.white,
                  fontWeight: 700,
                }}><Icon e="👤" />
                  
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: T.tealDark, fontSize: '15px' }}>{t('generalCustomer')}</div>
                  <div style={{ fontSize: '12px', color: T.gray600 }}>{t('generalCustomerDefault')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: T.tealDark }}>{fmt(generalCustomer.balance || 0)}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleViewHistory(generalCustomer)} style={{
                  flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <span><Icon e="📋" /> </span> {t('viewHistory')}
                </button>
                <div style={{ padding: '12px 16px', background: T.gray100, color: T.gray400, borderRadius: '10px', fontSize: '14px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}> <Icon e="🗑" />
                  ️
                </div>
              </div>
            </div>
          )}
          
          {/* Regular Customers */}
          {filteredCustomers.length === 0 && !generalCustomer ? (
            <div style={{
              ...cardGridStyle,
              gridColumn: '1 / -1',
              padding: '40px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              {t('noCustomersFound')}
            </div>
          ) : (
            filteredCustomers.map((customer) => {
              const rawDue = customer.balance > 0 ? customer.balance : 0;
              const rawDeposit = customer.deposit || 0;
              // Calculate net due/deposit: offset deposit against due
              const netDue = Math.max(0, rawDue - rawDeposit);
              const netDeposit = Math.max(0, rawDeposit - rawDue);
              const hasDue = netDue > 0;
              const hasDeposit = !hasDue && netDeposit > 0;
              
              return (
                <div key={customer.id} style={{
                  background: T.white,
                  borderRadius: '14px',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  {/* Header Row: Avatar + Info + Total */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: T.teal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px',
                      color: T.white,
                      fontWeight: 700,
                      overflow: 'hidden',
                    }}>
                      {customer.avatar ? (
                        <img 
                          src={customer.avatar} 
                          alt={customer.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        customer.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: T.gray800, fontSize: '15px' }}>{customer.name}</div>
                      <div style={{ fontSize: '12px', color: T.gray400 }}>
                        {customer.phone || t('phoneNotFound')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: T.teal }}>{fmt(getCustomerTotal(customer))}</div>
                    </div>
                  </div>

                  {/* Action Buttons - Dynamic Due/Deposit */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {/* Dynamic Button: Due or Deposit or History */}
                    <button
                      onClick={() => handleViewHistory(customer)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: hasDue ? '#D32F2F' : (hasDeposit ? T.tealDark : T.gray50),
                        color: hasDue ? T.white : (hasDeposit ? T.white : T.teal),
                        border: (hasDue || hasDeposit) ? 'none' : `1px solid ${T.teal}`,
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {hasDue ? (
                        <><span><Icon e="⚠" /> </span> {t('due')}: {fmt(netDue)}</>
                      ) : hasDeposit ? (
                        <><span><Icon e="💰" /> </span> Deposit: {fmt(netDeposit)}</>
                      ) : isGeneralCustomer(customer) ? (
                        <><span><Icon e="📋" /> </span> {t('viewHistory')}</>
                      ) : (
                        <><span><Icon e="📋" /> </span> {t('history')}</>
                      )}
                    </button>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        if (isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0) return;
                        handleDeleteCustomer(customer);
                      }}
                      disabled={isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0}
                      style={{
                        padding: '10px 14px',
                        background: (isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0) ? T.gray100 : '#EF9A9A',
                        color: (isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0) ? T.gray400 : '#B71C1C',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        cursor: (isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: (isGeneralCustomer(customer) || netDue > 0 || netDeposit > 0) ? 0.5 : 1,
                      }}
                    > <Icon e="🗑" />
                      ️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Customer Modal */}
        <CustomerModal
          isOpen={isAddCustomerModalOpen}
          mode="add"
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSave={handleAddCustomer}
        />

        {/* Edit Customer Modal */}
        <CustomerModal
          isOpen={isEditCustomerModalOpen}
          mode="edit"
          customer={editingCustomer}
          onClose={() => { setIsEditCustomerModalOpen(false); setEditingCustomer(null); }}
          onSave={handleEditCustomer}
        />
      </div>
    );
  }

  // General Customer Detail View
  if (view === 'general') {
    const generalCustomerData = generalCustomer || { id: '-', name: t('generalCustomer'), phone: '-', address: '-', balance: 0 };
    const generalSales = sales.filter(s => !s.customerId || s.customerId === generalCustomerData.id);
    const generalTotal = generalSales.reduce((sum, s) => sum + s.total, 0);

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <button
            onClick={() => setView('dashboard')}
            style={{
              padding: '8px 16px',
              background: T.gray100,
              color: T.gray800,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isRTL ? '→' : '←'} {t('back')}
          </button>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T.gray800 }}>
            {t('generalCustomerSystem')}
          </h2>
        </div>

        {/* Summary Card */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          padding: '20px',
          border: `1px solid ${T.gray100}`,
          marginBottom: '20px',
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
        }}>
          {/* Avatar on the left */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: T.tealDark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            flexShrink: 0,
          }}><Icon e="👤" />
            
          </div>

          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            flex: 1,
          }}>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('id')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{generalCustomerData.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('name')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{t('generalCustomer')}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('phone')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>-</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('address')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>-</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t('totalPurchases')}</div>
              <div style={{ fontSize: '14px', color: T.teal, fontWeight: 700 }}>{fmt(generalTotal)}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <button
            style={{
              padding: '10px 16px',
              background: T.teal,
              color: T.white,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span><Icon e="📦" /> </span> {t('allPurchases')} ({generalSales.length})
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          border: `1px solid ${T.gray100}`,
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {generalSales.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icon e="🛒" /> </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noPurchasesFound')}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('invoiceId')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('type')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('user')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {generalSales.map((sale, i) => (
                  <tr key={sale.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(sale.date).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.invoiceNo}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || 'Sale'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || 'POS'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800, textAlign: 'right', fontWeight: 600 }}>{fmt(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: T.tealLight,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: T.tealDark }}>
            {t('totalBills').replace('0', generalSales.length.toString())}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.teal }}>
            {fmt(generalTotal)}
          </span>
        </div>
      </div>
    );
  }

  // Regular Customer Detail View
  if (view === 'regular' && selectedCustomer) {
    const customerSales = getCustomerSales(selectedCustomer);
    const customerTotal = customerSales.reduce((sum, s) => sum + s.total, 0);
    const rawDue = selectedCustomer.balance > 0 ? selectedCustomer.balance : 0;
    const rawDeposit = selectedCustomer.deposit || 0;
    // Calculate net due/deposit: offset deposit against due
    const netDue = Math.max(0, rawDue - rawDeposit);
    const netDeposit = Math.max(0, rawDeposit - rawDue);

    return (
      <div style={containerStyle}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setView('dashboard')}
              style={{
                padding: '8px 16px',
                background: T.gray100,
                color: T.gray800,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isRTL ? '→' : '←'} {t('back')}
            </button>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: T.gray800 }}>
              {selectedCustomer.name}
            </h2>
          </div>
          <button
            onClick={() => openEditModal(selectedCustomer)}
            style={{
              padding: '8px 16px',
              background: T.white,
              color: T.teal,
              border: `1px solid ${T.teal}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          > <Icon e="✏" />
            ️ {t('edit')}
          </button>
        </div>

        {/* Summary Card - Single Line Layout */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          padding: '14px 16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          border: `1px solid ${T.gray200}`,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}>
          {/* Avatar on the left */}
          <div style={{
            width: '55px',
            height: '55px',
            borderRadius: '50%',
            background: T.teal,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            color: T.white,
            fontWeight: 700,
            flexShrink: 0,
            overflow: 'hidden',
          }}>
            {selectedCustomer.avatar ? (
              <img 
                src={selectedCustomer.avatar} 
                alt={selectedCustomer.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              selectedCustomer.name.charAt(0).toUpperCase()
            )}
          </div>

          {/* All Info in Single Line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, overflow: 'hidden' }}>
            {/* ID */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('id')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.id}</div>
            </div>
            
            {/* Name */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('name')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.name}</div>
            </div>
            
            {/* Phone */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('phone')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600 }}>{selectedCustomer.phone || '-'}</div>
            </div>
            
            {/* Address */}
            <div style={{ flexShrink: 0, maxWidth: '120px' }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('address')}</div>
              <div style={{ fontSize: '14px', color: T.gray800, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedCustomer.address || '-'}</div>
            </div>
            
            {/* Divider */}
            <div style={{ width: '1px', height: '35px', background: T.gray200, flexShrink: 0 }} />
            
            {/* Total Purchases - BIG */}
            <div style={{ flexShrink: 0 }}>
              <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('totalPurchases')}</div>
              <div style={{ fontSize: '22px', color: T.teal, fontWeight: 700 }}>{fmt(customerTotal)}</div>
            </div>
            
            {/* Due/Deposit - Dynamic based on net balance */}
            {netDue > 0 ? (
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('due')}</div>
                <div style={{ fontSize: '22px', color: T.red, fontWeight: 700 }}>{fmt(netDue)}</div>
              </div>
            ) : netDeposit > 0 ? (
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: '10px', color: T.gray400, fontWeight: 600 }}>{t('deposit')}</div>
                <div style={{ fontSize: '22px', color: T.tealDark, fontWeight: 700 }}>{fmt(netDeposit)}</div>
              </div>
            ) : null}
          </div>

          {/* Buttons on the right */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => setIsAddDueModalOpen(true)}
              style={{
                padding: '10px 16px',
                background: T.red,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📋 {t('addDue')}
            </button>
            <button
              onClick={() => setIsAddDepositModalOpen(true)}
              style={{
                padding: '10px 16px',
                background: T.tealDark,
                color: T.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            > <Icon e="💰" />
               {t('addDeposit')}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'all' ? T.teal : T.white,
              color: activeTab === 'all' ? T.white : T.gray600,
              border: activeTab === 'all' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span><Icon e="📦" /> </span> {t('allPurchases')} ({customerSales.length})
          </button>
          <button
            onClick={() => setActiveTab('due')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'due' ? T.teal : T.white,
              color: activeTab === 'due' ? T.white : T.gray600,
              border: activeTab === 'due' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span><Icon e="📋" /> </span> {t('dueHistory')} ({(selectedCustomer.transactions || []).filter(t => t.type === 'due').length})
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            style={{
              padding: '10px 16px',
              background: activeTab === 'deposit' ? T.teal : T.white,
              color: activeTab === 'deposit' ? T.white : T.gray600,
              border: activeTab === 'deposit' ? 'none' : `1px solid ${T.gray200}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span><Icon e="👜" /> </span> {t('depositHistory')} ({(selectedCustomer.transactions || []).filter(t => t.type === 'deposit').length})
          </button>
        </div>

        {/* Table */}
        <div style={{
          background: T.white,
          borderRadius: '14px',
          border: `1px solid ${T.gray100}`,
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          {activeTab === 'all' && customerSales.length === 0 && (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: T.gray400,
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icon e="🛒" /> </div>
              <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noPurchasesFound')}</div>
            </div>
          )}
          {activeTab === 'all' && customerSales.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.gray50 }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('invoiceId')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('type')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('user')}</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {customerSales.map((sale, i) => (
                  <tr key={sale.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(sale.date).toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.invoiceNo}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || 'Sale'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || 'POS'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800, textAlign: 'right', fontWeight: 600 }}>{fmt(sale.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'due' && (
            (selectedCustomer.transactions || []).filter(t => t.type === 'due').length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: T.gray400,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icon e="📋" /> </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noDueHistory')}</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.gray50 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('note')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCustomer.transactions || []).filter(t => t.type === 'due').map((tx, i) => (
                    <tr key={tx.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(tx.date).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{tx.note || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.red, textAlign: 'right', fontWeight: 600 }}>+{fmt(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
          {activeTab === 'deposit' && (
            (selectedCustomer.transactions || []).filter(t => t.type === 'deposit').length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: T.gray400,
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icon e="👜" /> </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{t('noDepositHistory')}</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.gray50 }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('dateTime')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('note')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('payment')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: T.gray600, textTransform: 'uppercase' }}>{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedCustomer.transactions || []).filter(t => t.type === 'deposit').map((tx, i) => (
                    <tr key={tx.id} style={{ borderTop: i > 0 ? `1px solid ${T.gray100}` : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{new Date(tx.date).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{tx.note || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{tx.paymentMethod || '-'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: T.tealDark, textAlign: 'right', fontWeight: 600 }}>+{fmt(tx.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: T.tealLight,
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: T.tealDark }}>
            {activeTab === 'all' ? t('totalBills').replace('0', customerSales.length.toString()) : 
             activeTab === 'due' ? `${t('total')} (${(selectedCustomer.transactions || []).filter(tx => tx.type === 'due').length})` :
             `${t('total')} (${(selectedCustomer.transactions || []).filter(tx => tx.type === 'deposit').length})`}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 700, color: T.teal }}>
            {activeTab === 'all' ? fmt(customerTotal) :
             activeTab === 'due' ? fmt((selectedCustomer.transactions || []).filter(tx => tx.type === 'due').reduce((sum, tx) => sum + tx.amount, 0)) :
             fmt((selectedCustomer.transactions || []).filter(tx => tx.type === 'deposit').reduce((sum, tx) => sum + tx.amount, 0))}
          </span>
        </div>

        {/* Edit Customer Modal - accessible from regular customer view */}
        <CustomerModal
          isOpen={isEditCustomerModalOpen}
          mode="edit"
          customer={editingCustomer}
          onClose={() => { setIsEditCustomerModalOpen(false); setEditingCustomer(null); }}
          onSave={handleEditCustomer}
        />
      </div>
    );
  }

  // Fallback
  return (
    <div style={containerStyle}>
      <button
        onClick={() => setView('dashboard')}
        style={{
          padding: '8px 16px',
          background: T.gray100,
          color: T.gray800,
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {t('back')}
      </button>
    </div>
  );
}

// SettingsScreen Component - extracted from pages/SettingsScreen.tsx
export function SettingsScreen({ products, customers, sales, suppliers, categories, purchases, setProducts, setCustomers, setSales, setSuppliers, setCategories, setPurchases, users, setUsers, onRefresh }: { 
  products: any[]; customers: any[]; sales: any[]; suppliers: any[]; categories: any[]; purchases: any[];
  setProducts: any; setCustomers: any; setSales: any; setSuppliers: any; setCategories: any; setPurchases: any;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onRefresh: () => void 
}) {
  const { t } = useLanguage();

  const [previewType, setPreviewType] = useState<'sales' | 'purchase'>('sales');

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    taxId: '',
    crNumber: '',
    zatkaEnabled: false,
    zatkaApiUrl: '',
    zatkaUsername: '',
    zatkaPassword: '',
    zatcaPhase: 'phase1',
    zatcaOid: '',
    zatcaCsid: '',
    zatcaPrivateKey: '',
    zatcaClientId: '',
    zatcaClientSecret: '',
    vatEnabled: true,
    vatPercent: 15,
    bannerImage: '',
    receiptHeader: '🧾 বিক্রয় রিসিট',
    receiptFooter: 'ধন্যবাদ',
    receiptShowLogo: true,
    receiptShowAddress: true,
    receiptShowPhone: true,
    receiptShowCustomer: true,
    receiptShowVat: true,
    receiptShowQr: true,
    receiptFontSize: 11,
    receiptLogo: '',
    purchaseHeader: '🛒 পারচেজ ইনভয়েস',
    purchaseFooter: 'ধন্যবাদ',
    purchaseShowLogo: true,
    purchaseShowAddress: true,
    purchaseShowSupplier: true,
    purchaseShowPhone: true,
    purchaseShowVat: true,
    purchaseShowStoreVat: true,
    purchaseFontSize: 11,
    purchaseIcon: '',
    dueSalesEnabled: true,
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Load settings from PouchDB on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const keys = Object.keys(form);
    const loaded: Record<string, any> = {};

    for (const key of keys) {
      const value = await localDb.getSetting(key);
      if (value !== null) {
        if (value === 'true') loaded[key] = true;
        else if (value === 'false') loaded[key] = false;
        else if (!isNaN(Number(value)) && value !== '') loaded[key] = Number(value);
        else loaded[key] = value;
      }
    }

    if (Object.keys(loaded).length > 0) {
      setForm(prev => ({ ...prev, ...loaded }));
    }
  };

  const save = async () => {
    try {
      for (const [key, value] of Object.entries(form)) {
        await localDb.saveSetting(key, String(value));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ সেটিংস সংরক্ষণ ব্যর্থ হয়েছে!');
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
      alert('❌ ' + t('error') + '!');
    }
  };

  // Helper function to delete all items of a type
  const deleteAllItems = async (
    storeName: string, 
    items: any[], 
    setItems: React.Dispatch<React.SetStateAction<any[]>>, 
    translate: any
  ) => {
    if (items.length === 0) return;
    
    if (!confirm(translate('warningPermanentDelete'))) return;
    
    try {
      for (const item of items) {
        await db.delete(storeName, item.id).catch(() => {});
      }
      setItems([]);
      onRefresh();
      alert(translate('dataDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('❌ ' + translate('error') + '!');
    }
  };

  // Helper function to delete all customers (reset General Customer data)
  const deleteAllCustomers = async (
    customers: any[], 
    setCustomers: React.Dispatch<React.SetStateAction<any[]>>, 
    translate: any
  ) => {
    const deletableCustomers = customers.filter(c => !c.isSystem);
    
    if (deletableCustomers.length === 0 && customers.filter(c => c.isSystem).length > 0) {
      // Only General Customer exists - reset its data completely
      if (!confirm(translate('warningPermanentDelete'))) return;
      
      try {
        // Delete all customers including General Customer's data
        for (const customer of customers) {
          await db.delete('customers', customer.id).catch(() => {});
        }
        
        // Recreate fresh General Customer with reset data
        const generalCustomer: Customer = {
          id: '2000010112345',
          name: 'General Customer',
          phone: '',
          address: '',
          balance: 0,
          deposit: 0,
          transactions: [],
          isSystem: true,
        };
        
        await db.put('customers', generalCustomer.id, generalCustomer);
        setCustomers([generalCustomer]);
        onRefresh();
        alert(translate('dataDeletedSuccessfully'));
      } catch (error) {
        console.error('Failed to reset customers:', error);
        alert('❌ ' + translate('error') + '!');
      }
      return;
    }
    
    if (deletableCustomers.length === 0) {
      alert(translate('noCustomersToDelete') || 'No customers to delete');
      return;
    }
    
    if (!confirm(translate('warningPermanentDelete'))) return;
    
    try {
      // Delete all non-system customers
      for (const customer of deletableCustomers) {
        await db.delete('customers', customer.id).catch(() => {});
      }
      
      // Reset General Customer data completely (only ID preserved)
      const systemCustomer = customers.find(c => c.isSystem);
      if (systemCustomer) {
        const resetCustomer: Customer = {
          id: systemCustomer.id,
          name: systemCustomer.name,
          phone: '',
          address: '',
          balance: 0,
          deposit: 0,
          transactions: [],
          isSystem: true,
        };
        await db.put('customers', resetCustomer.id, resetCustomer);
        setCustomers([resetCustomer]);
      }
      
      onRefresh();
      alert(translate('dataDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete customers:', error);
      alert('❌ ' + translate('error') + '!');
    }
  };

  const tabs = [
    { icon: <Icon e="⚙️" /> , label: t('settings') },
    { icon: <Icon e="🎨" /> , label: t('design') },
    { icon: <Icon e="👤" /> , label: t('user') },
    { icon: <Icon e="💥" /> , label: t('dataReset') },
  ];

  return (
    <div style={{
      height: '100%',
      overflow: 'hidden',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Tab Navigation */}
      <div style={{
        background: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 56,
        flexShrink: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}>
        {/* Tab Navigation - Left */}
        <div style={{ display: 'flex', gap: 6 }}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '6px 14px',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                fontWeight: 600,
                background: activeTab === i ? '#115E59' : 'transparent',
                color: activeTab === i ? '#fff' : '#374151',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Save Button - Right */}
        <button onClick={save} style={{
          padding: '8px 16px',
          background: saved ? '#059669' : '#115E59',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
          <Icon e={saved ? '✅' : '💾'} /> {saved ? t('saved') : t('saveSettings')}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: 24, background: '#f5f5f5', flex: 1, overflow: 'auto' }}>
        {/* General Tab */}
        {activeTab === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff'
              }}><Icon e="⚙" /> <Icon e="️" /> </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>সাধারণ তথ্য</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>আপনার ব্যবসার মূল তথ্য</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="🏪" />
                   ব্যবসার নাম *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="আপনার ব্যবসার নাম লিখুন"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="📞" />
                   মোবাইল নম্বর
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="📍" />
                   ঠিকানা
                </label>
                <input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="আপনার ব্যবসার ঠিকানা"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="📧" />
                   ইমেইল
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  type="email"
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="🔢" />
                   VAT নম্বর (TIN)
                </label>
                <input
                  value={form.taxId}
                  onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="১৫ ডিজিটের VAT নম্বর"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}> <Icon e="🏢" />
                   CR নম্বর
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
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}> <Icon e="💰" /> ভ্যাট সেটিংস</h5>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: form.vatEnabled ? '#ecfdf5' : '#fef2f2',
                borderRadius: 10,
                border: `2px solid ${form.vatEnabled ? '#059669' : '#ef4444'}`
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                    ভ্যাট সক্রিয় {form.vatEnabled ? '✅' : '❌'}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    {form.vatEnabled ? 'সকল বিক্রয়ে ভ্যাট যোগ হবে' : 'ভ্যাট গণনা বন্ধ আছে'}
                  </p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, vatEnabled: !p.vatEnabled }))}
                  style={{
                    padding: '8px 16px',
                    background: form.vatEnabled ? '#059669' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {form.vatEnabled ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                </button>
              </div>

              {form.vatEnabled && (
                <div style={{
                  marginTop: 12,
                  padding: '16px 20px',
                  background: '#f0fdf4',
                  borderRadius: 10,
                  border: '2px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <label style={{ fontSize: 14, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
                    ডিফল্ট ভ্যাট শতাংশ:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      value={form.vatPercent}
                      onChange={e => setForm(p => ({ ...p, vatPercent: parseFloat(e.target.value) || 0 }))}
                      type="number"
                      min="0"
                      max="100"
                      style={{ width: 80, padding: '8px 12px', fontSize: 14, border: '2px solid #86efac', borderRadius: 6, outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                    />
                    <span style={{ fontSize: 14, color: '#166534' }}>%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Design Tab - 80mm Thermal Printer Receipt Layout */}
        {activeTab === 1 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40,
                background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color: '#fff'
              }}><Icon e="🎨" /> </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{t('designSettings')}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{t('receiptTemplateConfig')}</p>
              </div>
            </div>

            {/* Preview Type Toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setPreviewType('sales')}
                style={{
                  padding: '8px 16px',
                  background: previewType === 'sales' ? '#115E59' : '#e0e0e0',
                  color: previewType === 'sales' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              > <Icon e="🧾" />
                 {t('salesInvoice')}
              </button>
              <button
                onClick={() => setPreviewType('purchase')}
                style={{
                  padding: '8px 16px',
                  background: previewType === 'purchase' ? '#115E59' : '#e0e0e0',
                  color: previewType === 'purchase' ? '#fff' : '#000',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              > <Icon e="🛒" />
                 {t('purchaseInvoice')}
              </button>
            </div>

            {/* 80mm Receipt Preview */}
            <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#475569' }}><Icon e="👁" /> <Icon e="️" /> {t('preview')} - 80mm {t('thermalPrinter')}</h4>
              
              {/* 80mm Thermal Receipt Paper */}
              <div style={{
                background: '#fff',
                padding: '12px',
                width: 220,
                margin: '0 auto',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#000',
                textAlign: 'left',
                borderRadius: 4
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 8, marginBottom: 8 }}>
                  {form.receiptLogo && <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>{form.receiptLogo}</div>}
                  {form.name && <div style={{ fontSize: 12, fontWeight: 'bold' }}>{form.name}</div>}
                  {form.name && <div style={{ fontSize: 10 }}>Bangladesh</div>}
                  {form.phone && <div style={{ fontSize: 10 }}>{form.phone}</div>}
                  {form.taxId && <div style={{ fontSize: 10, fontWeight: 'bold' }}>{t('vatRegNo')}: {form.taxId}</div>}
                </div>

                {/* Invoice Title */}
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 13, marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #000' }}>
                  {previewType === 'sales' ? (form.receiptHeader || t('salesInvoice')) : (form.purchaseHeader || t('purchaseInvoice'))}
                </div>

                {/* Invoice Info */}
                <div style={{ fontSize: 10, marginBottom: 6 }}>
                  <div><strong>{t('invoiceNo')}:</strong> 12345678</div>
                  <div><strong>{t('date')}:</strong> {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} | {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>

                {previewType === 'sales' ? (
                  <>
                    {/* Customer Info */}
                    <div style={{ fontSize: 10, padding: '6px 0', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', marginBottom: 8 }}>
                      <div><strong>{t('customer')}:</strong> {t('walkInCustomer')}</div>
                      <div><strong>{t('phone')}:</strong> 017XXXXXXXX</div>
                    </div>

                    {/* Products Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4 }}>
                      <div>{t('product')}</div>
                      <div style={{ textAlign: 'center' }}>{t('qty')}</div>
                      <div style={{ textAlign: 'right' }}>{t('price')}</div>
                      <div style={{ textAlign: 'right' }}>{t('total')}</div>
                    </div>

                    {/* Products */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0' }}>
                      <div>{t('productName')} 1</div>
                      <div style={{ textAlign: 'center' }}>2</div>
                      <div style={{ textAlign: 'right' }}>৳50</div>
                      <div style={{ textAlign: 'right' }}>৳100</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0', borderBottom: '1px dashed #ccc' }}>
                      <div>{t('productName')} 2</div>
                      <div style={{ textAlign: 'center' }}>1</div>
                      <div style={{ textAlign: 'right' }}>৳75</div>
                      <div style={{ textAlign: 'right' }}>৳75</div>
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('subtotal')}:</span>
                        <span>৳175</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('vat')} (15%):</span>
                        <span>৳26.25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: 4, paddingTop: 4 }}>
                        <span>{t('total')}:</span>
                        <span>৳201.25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('paid')}:</span>
                        <span>৳210</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('change')}:</span>
                        <span>৳8.75</span>
                      </div>
                    </div>

                    {/* QR Code */}
                    {form.receiptShowQr !== false && (
                      <div style={{ textAlign: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px dashed #ccc' }}>
                        <div style={{ fontSize: 8, color: '#666' }}>[ZATCA QR]</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Supplier Info */}
                    <div style={{ fontSize: 10, padding: '6px 0', borderTop: '1px dashed #ccc', borderBottom: '1px dashed #ccc', marginBottom: 8 }}>
                      <div><strong>{t('supplier')}:</strong> ABC Supplier</div>
                      <div><strong>{t('phone')}:</strong> 0123456789</div>
                      <div><strong>{t('cr')}:</strong> 1234567890</div>
                      <div><strong>{t('vat')} No:</strong> 123456789012345</div>
                    </div>

                    {/* Products Table Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: 4, marginBottom: 4 }}>
                      <div>{t('product')}</div>
                      <div style={{ textAlign: 'center' }}>{t('qty')}</div>
                      <div style={{ textAlign: 'right' }}>{t('price')}</div>
                      <div style={{ textAlign: 'right' }}>{t('total')}</div>
                    </div>

                    {/* Products */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0' }}>
                      <div>{t('productName')} 1</div>
                      <div style={{ textAlign: 'center' }}>10</div>
                      <div style={{ textAlign: 'right' }}>৳50</div>
                      <div style={{ textAlign: 'right' }}>৳500</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0', borderBottom: '1px dashed #ccc' }}>
                      <div>{t('productName')} 2</div>
                      <div style={{ textAlign: 'center' }}>5</div>
                      <div style={{ textAlign: 'right' }}>৳80</div>
                      <div style={{ textAlign: 'right' }}>৳400</div>
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('subtotal')}:</span>
                        <span>৳900</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('vat')} (15%):</span>
                        <span>৳135</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: 4, paddingTop: 4 }}>
                        <span>{t('total')} ({t('vatWith')}):

                        </span>
                        <span>৳1,035</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px dashed #000' }}>
                  <div style={{ fontSize: 10, fontStyle: 'italic' }}>{form.receiptFooter || t('thanks')}</div>
                  <div style={{ fontSize: 9, color: '#666', marginTop: 4 }}>{new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 2 && (
          <UserManagement users={users} setUsers={setUsers} t={t} />
        )}

        {/* Data Reset Tab */}
        {activeTab === 3 && (
          <div>
            {/* Warning */}
            <div style={{
              padding: '14px 18px',
              background: '#fef2f2',
              borderRadius: 10,
              border: '1px solid #fecaca',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span style={{ fontSize: 18 }}><Icon e="⚠" /> </span>
              <p style={{ margin: 0, fontSize: 14, color: '#dc2626' }}>
                {t('warningPermanentDelete')}
              </p>
            </div>

            {/* Row 1: 5 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { label: t('productData'), count: products.length, icon: <Icon e="📦" /> , onClick: () => deleteAllItems('products', products, setProducts, t) },
                { label: t('customerData'), count: customers.filter(c => !c.isSystem).length, icon: <Icon e="👥" /> , onClick: () => deleteAllCustomers(customers, setCustomers, t), disabled: customers.filter(c => !c.isSystem).length === 0 },
                { label: t('categoryData'), count: categories.length, icon: <Icon e="📂" /> , onClick: () => deleteAllItems('categories', categories, setCategories, t) },
                { label: t('supplierData'), count: suppliers.length, icon: <Icon e="🏢" /> , onClick: () => deleteAllItems('suppliers', suppliers, setSuppliers, t) },
                { label: t('salesData'), count: sales.length, icon: <Icon e="🛒" /> , onClick: () => deleteAllItems('sales', sales, setSales, t) },
              ].map((item, i) => (
                <div key={i} style={{ 
                  background: '#fff', 
                  borderRadius: 12, 
                  padding: 14, 
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{item.label}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>{item.count}</span>
                    <button
                      onClick={item.onClick}
                      disabled={item.disabled || item.count === 0}
                      style={{ 
                        padding: '5px 10px', 
                        background: (item.disabled || item.count === 0) ? '#f3f4f6' : '#ef4444', 
                        color: (item.disabled || item.count === 0) ? '#9ca3af' : '#fff', 
                        border: 'none', 
                        borderRadius: 6, 
                        fontSize: 11, 
                        fontWeight: 600, 
                        cursor: (item.disabled || item.count === 0) ? 'not-allowed' : 'pointer',
                      }}>
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: 1 Card + Delete All Button */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
              {/* Left: 1 Card */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  background: '#fff', 
                  borderRadius: 12, 
                  padding: 14, 
                  border: '1px solid #e5e7eb',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}><Icon e="📥" /> </span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{t('purchaseHistoryDelete')}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#374151' }}>{purchases.length}</span>
                    <button
                      onClick={() => deleteAllItems('purchases', purchases, setPurchases, t)}
                      disabled={purchases.length === 0}
                      style={{ 
                        padding: '6px 12px', 
                        background: purchases.length === 0 ? '#f3f4f6' : '#ef4444', 
                        color: purchases.length === 0 ? '#9ca3af' : '#fff', 
                        border: 'none', 
                        borderRadius: 6, 
                        fontSize: 12, 
                        fontWeight: 600, 
                        cursor: purchases.length === 0 ? 'not-allowed' : 'pointer',
                      }}>
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Delete All Button - Single Line */}
              <div style={{ 
                background: '#dc2626',
                borderRadius: 12, 
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}>
                <span style={{ fontSize: 20 }}><Icon e="💥" /> </span>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{t('fullReset')}</div>
                <button
                  onClick={clearAll}
                  style={{ 
                    padding: '8px 16px', 
                    background: '#fff', 
                    color: '#dc2626', 
                    border: 'none', 
                    borderRadius: 6, 
                    fontSize: 13, 
                    fontWeight: 700, 
                    cursor: 'pointer',
                  }}>
                  {t('deleteAllData')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// TranslationSettings Component
export function TranslationSettings() {
  const { language, customTranslations, syncTranslations, saveTranslation } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');

  // Get all translation keys from default translations
  const allKeys = Object.keys(defaultTranslations.en);

  // Filter keys based on search
  const filteredKeys = allKeys.filter(key => {
    const defaultValue = defaultTranslations[selectedLang]?.[key] || '';
    const customValue = customTranslations[selectedLang]?.[key] || '';
    const query = searchQuery.toLowerCase();
    return (
      key.toLowerCase().includes(query) ||
      defaultValue.toLowerCase().includes(query) ||
      customValue.toLowerCase().includes(query)
    );
  });

  const handleEdit = (key: string) => {
    const currentValue = customTranslations[selectedLang]?.[key] || defaultTranslations[selectedLang]?.[key] || '';
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    await saveTranslation(selectedLang, key, editValue);
    setSaving(false);
    setEditingKey(null);
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    await syncTranslations();
    setSyncStatus('Synced!');
    setTimeout(() => setSyncStatus(''), 2000);
  };

  // Get display value for a key
  const getDisplayValue = (key: string) => {
    return customTranslations[selectedLang]?.[key] || defaultTranslations[selectedLang]?.[key] || '';
  };

  // Check if a key has custom translation
  const hasCustomTranslation = (key: string) => {
    return customTranslations[selectedLang]?.[key] !== undefined;
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}> <Icon e="🌐" /> Translation Settings</h2>
        <button
          onClick={handleSync}
          disabled={syncStatus === 'syncing'}
          style={{
            padding: '8px 16px',
            background: syncStatus ? '#22C55E' : '#0F766E',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: syncStatus ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {syncStatus === 'syncing' ? '⏳ Syncing...' : syncStatus || '🔄 Sync from Code'}
        </button>
      </div>

      {/* Language Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E5E7EB', paddingBottom: 12 }}>
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => setSelectedLang(lang.code)}
            style={{
              padding: '8px 16px',
              background: selectedLang === lang.code ? '#0F766E' : '#F3F4F6',
              color: selectedLang === lang.code ? 'white' : '#4B5563',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {lang.flag} {lang.nativeName}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search translations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Translation List */}
      <div style={{ 
        background: 'white', 
        borderRadius: 12, 
        border: '1px solid #E5E7EB',
        maxHeight: 'calc(100vh - 300px)',
        overflow: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB' }}>
            <tr>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Key</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Translation</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#4B5563', borderBottom: '1px solid #E5E7EB' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredKeys.map(key => (
              <tr key={key} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: '#0F766E' }}>
                  {key}
                  {hasCustomTranslation(key) && (
                    <span style={{ 
                      marginLeft: 8, 
                      fontSize: 10, 
                      background: '#FEF3C7', 
                      color: '#D97706', 
                      padding: '2px 6px', 
                      borderRadius: 4 
                    }}>
                      Custom
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', width: '60%' }}>
                  {editingKey === key ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        id="translation-input"
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          border: '1px solid #0F766E',
                          borderRadius: 6,
                          fontSize: 14,
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave(key)}
                        disabled={saving}
                        style={{
                          padding: '6px 12px',
                          background: '#22C55E',
                          color: 'white',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        {saving ? '...' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingKey(null)}
                        style={{
                          padding: '6px 12px',
                          background: '#F3F4F6',
                          color: '#4B5563',
                          border: 'none',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 14 }}>{getDisplayValue(key)}</span>
                  )}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  {editingKey !== key && (
                    <button
                      onClick={() => handleEdit(key)}
                      style={{
                        padding: '4px 10px',
                        background: '#F0FDFA',
                        color: '#0F766E',
                        border: '1px solid #0F766E',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    > <Icon e="✏" />
                      ️ Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredKeys.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            No translations found
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ marginTop: 16, color: '#6B7280', fontSize: 13 }}>
        Showing {filteredKeys.length} of {allKeys.length} translations
      </div>
    </div>
  );
}

// DatabaseSettings Component
export function DatabaseSettings() {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [docCount, setDocCount] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDbInfo();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDbInfo = async () => {
    try {
      await initDatabase();
      const products = await localDb.getProducts();
      const sales = await localDb.getSales();
      const customers = await localDb.getCustomers();
      const categories = await localDb.getCategories();
      setDocCount(products.length + sales.length + customers.length + categories.length);
    } catch (error) {
      console.error('Error loading DB info:', error);
    }
  };

  const handleExport = async () => {
    try {
      setMessage(t('exporting') || 'Exporting data...');
      setMessageType('info');
      
      const data = {
        exportedAt: new Date().toISOString(),
        version: '2.0',
        products: await localDb.getProducts(),
        sales: await localDb.getSales(),
        customers: await localDb.getCustomers(),
        categories: await localDb.getCategories(),
        currencies: await localDb.getCurrencies(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage(t('exportSuccess') || 'Export successful!');
      setMessageType('success');
    } catch (error) {
      setMessage(`${t('exportFailed')}: ${error}`);
      setMessageType('error');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage(t('selectImportFile') || 'Please select a file');
      setMessageType('error');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setMessage(t('importing') || 'Importing data...');
    setMessageType('info');

    try {
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const text = await importFile.text();
      const data = JSON.parse(text);
      
      if (data.products) {
        for (const product of data.products) {
          await localDb.saveProduct(product);
        }
      }
      if (data.categories) {
        for (const category of data.categories) {
          await localDb.saveCategory(category);
        }
      }
      if (data.customers) {
        for (const customer of data.customers) {
          await localDb.saveCustomer(customer);
        }
      }
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      setMessage('Import successful!');
      setMessageType('success');
      setImportFile(null);
      loadDbInfo();
    } catch (error) {
      setMessage(`${t('importFailed')}: ${error}`);
      setMessageType('error');
    }
    
    setImporting(false);
    setImportProgress(0);
  };

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}><Icon e="🗄" /> <Icon e="️" /> {t('databaseSettings')}</h2>

      {/* Database Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}> <Icon e="📊" /> {t('databaseInfo')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#F0FDF4', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>
              {docCount}
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('totalDocuments')}</div>
          </div>
          <div style={{ background: '#F0FDFA', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#115E59' }}>
              IndexedDB
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{t('localDatabase')}</div>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}> <Icon e="🌐" /> {t('serverConnection')}</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '10px 14px',
          background: isOnline ? '#F0FDF4' : '#FEF2F2',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 18 }}>{isOnline ? '🟢' : '🔴'}</span>
          <span style={{ fontWeight: 600, color: isOnline ? '#166534' : '#DC2626' }}>
            {isOnline ? t('online') || 'Online' : t('offline') || 'Offline'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>
          {isOnline 
            ? 'সার্ভারে সংযুক্ত। Sales automatically sync হবে।'
            : 'অফলাইনে কাজ করছেন। সব data আপনার ডিভাইসে সংরক্ষিত।'}
        </p>
      </div>

      {/* Export / Import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}> <Icon e="💾" /> {t('backupRestore')}</h3>
        
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {t('exportDescription')}
          </p>
          <button
            onClick={handleExport}
            style={{
              width: '100%',
              padding: '14px',
              background: '#115E59',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          > <Icon e="📤" />
             {t('exportData') || 'Export Data'}
          </button>
        </div>

        <div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
            {t('importDescription')}
          </p>
          
          {importing && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 6, background: '#E5E7EB', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${importProgress}%`, background: '#115E59', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="import-file"
                disabled={importing}
              />
              <label
                htmlFor="import-file"
                style={{
                  display: 'block',
                  padding: '12px 14px',
                  background: '#F9FAFB',
                  border: `2px dashed ${importFile ? '#115E59' : '#D1D5DB'}`,
                  borderRadius: 10,
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: importFile ? '#115E59' : '#6B7280',
                }}
              >
                {importFile ? `📄 ${importFile.name}` : t('selectFile') || 'Select File'}
              </label>
            </div>
            <button
              onClick={handleImport}
              disabled={!importFile || importing}
              style={{
                padding: '12px 20px',
                background: importFile && !importing ? '#0F3460' : '#9CA3AF',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: importFile && !importing ? 'pointer' : 'not-allowed',
              }}
            >
              {importing ? '...' : t('importData') || 'Import'}
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: messageType === 'success' ? '#F0FDF4' : messageType === 'error' ? '#FEF2F2' : '#EFF6FF',
          color: messageType === 'success' ? '#166534' : messageType === 'error' ? '#DC2626' : '#1D4ED8',
          fontSize: 14,
        }}>
          {message}
        </div>
      )}

      {/* Info */}
      <div className="card" style={{ background: '#F0FDFA', border: '1px solid #99F6E4' }}>
        <h4 style={{ marginBottom: 8, color: '#115E59' }}> <Icon e="💡" /> {t('howItWorks')}</h4>
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
