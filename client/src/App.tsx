import ProductsScreen from "./ProductsScreen";
import { api, zatcaApi, setToken, clearToken } from "./api";
import { useState, useEffect, useRef } from 'react';
import './index.css';
import { useLanguage, languages, defaultTranslations, Language } from './i18n';
import { QR } from './qrCode';
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

  // Load users from localStorage on mount
  useEffect(() => {
    const savedUsers = localStorage.getItem('pos_users');
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        if (parsedUsers.length > 0) {
          setUsers(parsedUsers);
        }
      } catch (e) {
          }
    }
  }, []);

  // Save users to localStorage when changed
  useEffect(() => {
    localStorage.setItem('pos_users', JSON.stringify(users));
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
        id: genId(),
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
          }}><i className="fas fa-users"></i></div>
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
        >
          <i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addUser')}
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
            <div style={{ fontSize: 32, marginBottom: 8 }}><i className="fas fa-user"></i></div>
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
                >
                  <i className="fas fa-key"></i>
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
                >
                  <i className="fas fa-pen"></i>
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
                >
                  <i className="fas fa-trash"></i>
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
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}><i className="fas fa-xmark"></i></button>
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

              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>
                <i className="fas fa-key" style={{marginRight: 4}}></i> {t('changePassword')}
              </h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}><i className="fas fa-xmark"></i></button>
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

              <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
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
const genId = () => { const now = new Date(); const y = now.getFullYear(); const m = String(now.getMonth() + 1).padStart(2, '0'); const d = String(now.getDate()).padStart(2, '0'); const unique = String(Math.floor(10000 + Math.random() * 90000)); return `${y}${m}${d}${unique}`; };
const genSupplierId = (suppliersList: any[]) => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    let max = 0;
    (suppliersList || []).forEach((x: any) => {
      const id = String(x?.id || '');
      if (id.startsWith(ymd) && id.length >= ymd.length + 4) {
        const n = parseInt(id.slice(ymd.length), 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    });
    return `${ymd}${String(max + 1).padStart(4, '0')}`;
  };
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
  icon?: string;
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
  discount?: string;
  vatPercent?: string;
  paidAmount?: string;
  paymentMethod?: string;
  customerId?: string;
  customerName?: string;
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
  vatNumber?: string;
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
  customerVat?: string;
  invoiceType?: 'B2B' | 'B2C';
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
// Login Screen
function LoginScreen({ onLogin }: { onLogin: (user?: any) => void }) {
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

    try {
      const email = username === 'admin' || username === 'admin@konok.io' ? 'admin@pos.test' : username;
      const res: any = await api.login(email, password);
      if (res && res.token) {
        setToken(res.token);
        localStorage.setItem('pos_current_user', JSON.stringify(res.user));
        onLogin(res.user);
      } else {
        setError(t('invalidCredentials'));
      }
    } catch (err: any) {
      setError(err?.message || t('invalidCredentials'));
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
              {loading ? <i className="fas fa-spinner fa-spin"></i> : t('signIn')}
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
            }}>
              <i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {error}
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

function TabLoader({ text }: { text?: string }) {
  return (
    <div style={{ padding: '24px 16px', minHeight: 320 }} aria-busy="true" aria-live="polite">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#115E59', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{text || 'Loading data...'}</div>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Please wait while we load this section</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
            <div className="pos-skel" style={{ height: 14, width: '55%', borderRadius: 6, marginBottom: 12 }} />
            <div className="pos-skel" style={{ height: 28, width: '40%', borderRadius: 6, marginBottom: 14 }} />
            <div className="pos-skel" style={{ height: 10, width: '85%', borderRadius: 6, marginBottom: 8 }} />
            <div className="pos-skel" style={{ height: 10, width: '70%', borderRadius: 6 }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .pos-skel { background: linear-gradient(90deg, #EEF2F7 25%, #F8FAFC 50%, #EEF2F7 75%); background-size: 200% 100%; animation: pos-shimmer 1.2s ease-in-out infinite; }
        @keyframes pos-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
}

// Main App Component
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false); // Prevent save before initial load
  const [tabLoading, setTabLoading] = useState(false); // Show skeleton on every tab click
  const [currentTab, setCurrentTab] = useState(() => {
    // Load saved tab from localStorage
    const savedTab = localStorage.getItem('pos_current_tab');
    return savedTab || 'pos';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Save current tab to localStorage when it changes
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('pos_current_tab', currentTab);
    }
  }, [currentTab, isInitialized]);

  // Finance-style: show data-loading skeleton on every tab switch
  useEffect(() => {
    if (!isInitialized) return;
    setTabLoading(true);
    const timer = window.setTimeout(() => setTabLoading(false), 420);
    return () => window.clearTimeout(timer);
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
  const [settings, _setSettings] = useState<any>({ vatPercent: 15, vatEnabled: true, dueSalesEnabled: true, currencySymbol: '৳' });
  const [currentUser, _setCurrentUser] = useState<any>(DEFAULT_ADMIN);
  const [users, setUsers] = useState<User[]>([]);

  const getProductIcon = (name: string) => {
    const n = (name || '').toLowerCase();
    const icons: Record<string, string> = {
      food: 'fa-bowl-rice', rice: 'fa-bowl-rice', dal: 'fa-bowl-rice',
      meat: 'fa-drumstick-bite', chicken: 'fa-drumstick-bite', fish: 'fa-fish',
      fruit: 'fa-apple-whole', apple: 'fa-apple-whole', mango: 'fa-apple-whole',
      vegetable: 'fa-leaf', potato: 'fa-leaf', onion: 'fa-leaf',
      drink: 'fa-mug-hot', tea: 'fa-mug-hot', coffee: 'fa-mug-hot',
      soap: 'fa-bottle-droplet', shampoo: 'fa-bottle-droplet', cream: 'fa-bottle-droplet',
      medicine: 'fa-pills', tablet: 'fa-pills', drug: 'fa-pills',
      phone: 'fa-mobile-screen-button', mobile: 'fa-mobile-screen-button', samsung: 'fa-mobile-screen-button',
      laptop: 'fa-laptop', computer: 'fa-laptop',
      notebook: 'fa-book', book: 'fa-book', paper: 'fa-book',
      bag: 'fa-bag-shopping',
      shoe: 'fa-shoe-prints', sandal: 'fa-shoe-prints',
      pen: 'fa-pen', pencil: 'fa-pen', stationery: 'fa-pen',
      game: 'fa-gamepad', toy: 'fa-gamepad',
      money: 'fa-money-bill',
      electronics: 'fa-microchip', chip: 'fa-microchip',
      shirt: 'fa-shirt', clothing: 'fa-shirt',
      tool: 'fa-wrench',
      biscuit: 'fa-cookie', chocolate: 'fa-cookie',
      cigarette: 'fa-smoking',
      sugar: 'fa-cube', salt: 'fa-cube', flour: 'fa-cube', wheat: 'fa-cube',
    };
    for (const [key, icon] of Object.entries(icons)) {
      if (n.includes(key)) return icon;
    }
    return 'fa-box';
  };

  // Product images from internet
  const [productImages, setProductImages] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('pos_product_images') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    const cache = { ...productImages };
    let changed = false;
    (products || []).forEach((p: any) => {
      const name = p.name || '';
      if (!name || cache[name]) return;
      const query = encodeURIComponent(name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim().split('\s').slice(0, 3).join(' '));
      if (!query) return;
      cache[name] = `https://source.unsplash.com/featured/200x200/?${query}`;
      changed = true;
    });
    if (changed) {
      setProductImages(cache);
      try { localStorage.setItem('pos_product_images', JSON.stringify(cache)); } catch {}
    }
  }, [products]);

  // Tabs configuration
  const otherTabs = [
    { id: 'products', icon: <i className="fas fa-box"></i>, label: t('products') },
    { id: 'customers', icon: <i className="fas fa-users"></i>, label: t('customers') },
    { id: 'income', icon: <i className="fas fa-money-bill"></i>, label: t('incomeExpenses') },
    { id: 'reports', icon: <i className="fas fa-chart-bar"></i>, label: t('reports') },
    { id: 'settings', icon: <i className="fas fa-gear"></i>, label: t('settings') },
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

  const cartCustomerQ = cartCustomerInput.trim().toLowerCase();
  const cartCustomerFiltered = cartCustomerQ ? customers.filter(c =>
    c.name.toLowerCase().includes(cartCustomerQ) ||
    (c.phone || '').includes(cartCustomerInput) ||
    (c.id || '').toLowerCase().includes(cartCustomerQ) ||
    (c.vatNumber || '').includes(cartCustomerQ)
  ).slice(0, 5) : [];
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState<string>('15');
  const [defaultVatPercent, setDefaultVatPercent] = useState(15);
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [posBarcode, setPosBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockFilter, setStockFilter] = useState<string>('all'); // 'all', 'available', 'low', 'out'
  const [showExpiryList, setShowExpiryList] = useState(false);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [showHeldSales, setShowHeldSales] = useState(false);
  const [currency, setCurrency] = useState('৳');
  const [dataSyncStatus, setDataSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  const [dataLastSyncTime, setDataLastSyncTime] = useState<string | null>(null);
  const fmt = (n: number) => `${currency} ${(+n || 0).toLocaleString('en-IN')}`;
  
  // Settings (currency/vat) are loaded once inside initApp to avoid double hydration

  // Filter customers for dropdown
  const filteredCustomers = customers.filter(c => 
    (c.name || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || '').includes(customerSearch) ||
    (c.id || '').toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.vatNumber || '').includes(customerSearch)
  );
  

  // Check auth and load settings on mount
  useEffect(() => {
    const initApp = async () => {
      try {
      // Check if user was logged in
      const isLoggedInSetting = await db.get<boolean>('settings', 'isLoggedIn');
      const hasToken = !!localStorage.getItem('pos_api_token');
      if (isLoggedInSetting && hasToken) {
        setIsLoggedIn(true);
        try { const cu = JSON.parse(localStorage.getItem('pos_current_user') || ''); if (cu) _setCurrentUser(cu); } catch {}
      } else if (isLoggedInSetting && !hasToken) {
        await db.delete('settings', 'isLoggedIn');
      }
      
      // Load settings from API first, fallback to localDb
      let apiSettings: any = null;
      try {
        apiSettings = await api.getSettings();
      } catch {}

      const isTruthy = (v: any) => v === 'true' || v === true || v === 1 || v === '1';
      const getSetting = async (key: string): Promise<string | null> => {
        if (apiSettings && apiSettings[key] !== undefined && apiSettings[key] !== null) {
          return String(apiSettings[key]);
        }
        return (await localDb.getSetting<string>(key)) ?? null;
      };

      const savedVat = await getSetting('vatPercent');
      if (savedVat) {
        const vat = parseFloat(savedVat);
        setVatPercent(savedVat);
        setDefaultVatPercent(vat);
      }
      const savedCurrency = await getSetting('currencySymbol');
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
      const savedDueSales = await getSetting('dueSalesEnabled');
      if (savedDueSales !== null) {
        _setSettings((prev: any) => ({ ...prev, dueSalesEnabled: isTruthy(savedDueSales) }));
      }
      const savedVatEnabled = await getSetting('vatEnabled');
      if (savedVatEnabled !== null) {
        _setSettings((prev: any) => ({ ...prev, vatEnabled: isTruthy(savedVatEnabled) }));
      }
      const savedCurrencySymbol = await getSetting('currencySymbol');
      if (savedCurrencySymbol) {
        _setSettings((prev: any) => ({ ...prev, currencySymbol: savedCurrencySymbol }));

      // Load company info for receipt
      const savedName = await getSetting('name');
      if (savedName) _setSettings((prev: any) => ({ ...prev, name: savedName }));
      const savedPhone = await getSetting('phone');
      if (savedPhone) _setSettings((prev: any) => ({ ...prev, phone: savedPhone }));
      const savedAddress = await getSetting('address');
      if (savedAddress) _setSettings((prev: any) => ({ ...prev, address: savedAddress }));
      const savedEmail = await getSetting('email');
      if (savedEmail) _setSettings((prev: any) => ({ ...prev, email: savedEmail }));
      const savedTaxId = await getSetting('taxId');
      if (savedTaxId) _setSettings((prev: any) => ({ ...prev, taxId: savedTaxId }));
      const savedCrNumber = await getSetting('crNumber');
      if (savedCrNumber) _setSettings((prev: any) => ({ ...prev, crNumber: savedCrNumber }));
      const savedZatka = await getSetting('zatkaEnabled');
      if (savedZatka !== null) _setSettings((prev: any) => ({ ...prev, zatkaEnabled: isTruthy(savedZatka) }));
      const savedZatcaPhase = await getSetting('zatcaPhase');
      if (savedZatcaPhase) _setSettings((prev: any) => ({ ...prev, zatcaPhase: savedZatcaPhase }));
      const savedReceiptFooter = await getSetting('receiptFooter');
      if (savedReceiptFooter) _setSettings((prev: any) => ({ ...prev, receiptFooter: savedReceiptFooter }));
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
              }
      }
      
      // Load held sales from IndexedDB
      const savedHeldSales = await db.get<any>('heldSales', 'heldSales');
      if (savedHeldSales) {
        try {
          // Parse items if stored as JSON string
          const parsed = Array.isArray(savedHeldSales) ? savedHeldSales.map((s: any) => ({
            ...s,
            items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items || [],
          })) : [];
          setHeldSales(parsed);
        } catch (e) {
              }
      }
      
      // Load all data from MySQL API first; fall back to IndexedDB only when API fails
      const loadOrFallback = async <T,>(loader: () => Promise<T[] | any>, store: string): Promise<T[]> => {
        try {
          const data = await loader();
          return (Array.isArray(data) ? data : []) as T[];
        } catch (e) {
          console.error(`API failed for ${store}, loading IndexedDB fallback:`, e);
          const local = await db.getAll<any>(store).catch(() => []);
          return (local || []) as T[];
        }
      };

      const [apiProducts, apiCategories, apiSuppliers, apiCustomers, apiSales, apiPurchases, apiStockHistory] = await Promise.all([
        loadOrFallback<Product>(() => api.getProducts(), 'products'),
        loadOrFallback<Category>(() => api.getCategories(), 'categories'),
        loadOrFallback<any>(() => api.getSuppliers(), 'suppliers'),
        loadOrFallback<Customer>(() => api.getCustomers(), 'customers'),
        loadOrFallback<Sale>(() => api.getSales(), 'sales'),
        loadOrFallback<any>(() => api.getPurchases(), 'purchases'),
        loadOrFallback<any>(() => api.getStockHistory(), 'stock_history'),
      ]);

      // Local -> API migration: if API empty but browser IndexedDB has data, push it up
      const migrateLocal = async (apiData: any[], store: string, push: (x: any) => Promise<any>, setState?: (v: any[]) => void, skip?: (x: any) => boolean): Promise<any[]> => {
        if (apiData && apiData.length > 0) return apiData;
        try {
          const local = await db.getAll<any>(store).catch(() => []);
          const items = (local || []).filter((x: any) => x && x.id && !(skip && skip(x)));
          if (items.length === 0) return apiData || [];
          for (const item of items) { await push(item).catch(() => {}); }
          if (setState) setState(items);
          return items;
        } catch { return apiData || []; }
      };

      await migrateLocal(apiProducts, 'products', (x) => api.addProduct(x), (v) => setProducts(v as any), (x) => String(x.id || '').startsWith('auto-'));
      if (apiProducts.length > 0) setProducts(apiProducts);
      await migrateLocal(apiCategories, 'categories', (x) => api.addCategory(x), (v) => setCategories(v as any));
      if (apiCategories.length > 0) setCategories(apiCategories);
      await migrateLocal(apiSuppliers, 'suppliers', (x) => api.addSupplier(x), (v) => setSuppliers(v as any), (x) => String(x.id || '').startsWith('auto-'));
      if (apiSuppliers.length > 0) setSuppliers(apiSuppliers);
      if (apiSales.length > 0) setSales(apiSales);
      else {
        const localSales = await db.getAll<any>('sales').catch(() => []);
        if (localSales.length > 0) { for (const sale of localSales) await api.addSale(sale).catch(() => {}); setSales(localSales); }
      }
      if (apiPurchases && apiPurchases.length > 0) setPurchases(apiPurchases);
      else {
        const localPur = await db.getAll<any>('purchases').catch(() => []);
        if (localPur.length > 0) { for (const pur of localPur) await api.addPurchase(pur).catch(() => {}); setPurchases(localPur); }
      }
      if (apiStockHistory && apiStockHistory.length > 0) _setProductHistory(apiStockHistory);
      else {
        const localSh = await db.getAll<any>('stock_history').catch(() => []);
        if (localSh.length > 0) { for (const h of localSh) await api.addStockHistory(h).catch(() => {}); _setProductHistory(localSh); }
      }

      if (apiCustomers.length > 0) {
        const savedTransactions = await db.getAll<any>('transactions').catch(() => []);
        const customersWithTransactions = apiCustomers.map((customer: any) => {
          const customerTransactions = savedTransactions.filter((tx: any) => tx.customerId === customer.id);
          return { ...customer, transactions: customerTransactions.length > 0 ? customerTransactions : (customer.transactions || []) };
        });
        setCustomers(customersWithTransactions);
      }

      // Ensure General Customer exists
      // Always ensure general customer after load
      const genCust: Customer = {
        id: generateGeneralCustomerId(),
        name: 'General Customer',
        phone: '', address: '', balance: 0, deposit: 0, isSystem: true,
      };
      setCustomers((prev: any[]) => {
        if (prev.some((c: any) => c.isSystem)) return prev;
        return [genCust, ...prev];
      });
      
      // Ensure General Customer exists in DB
      api.addCustomer(genCust).catch(() => {});
      
      setIsInitialized(true); // Mark as initialized before enabling saves
      } catch (e) {
        console.error('initApp failed:', e);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Sync all local data to server
  const syncAllData = async () => {
    setDataSyncStatus('pending');
    try {
      const localCustomers = await db.getAll<any>('customers');
      if (localCustomers && localCustomers.length > 0) {
        for (const customer of localCustomers) {
          if (!customer.id.startsWith('CUST')) {
            await api.addCustomer(customer).catch(() => {});
          }
        }
      }
      const localProducts = await db.getAll<any>('products');
      if (localProducts && localProducts.length > 0) {
        for (const product of localProducts) {
          if (!product.id.startsWith('auto-')) {
            await api.addProduct(product).catch(() => {});
          }
        }
      }
      const localSales = await db.getAll<any>('sales');
      if (localSales && localSales.length > 0) {
        for (const sale of localSales) {
          await api.addSale(sale).catch(() => {});
        }
      }
      const localSuppliers = await db.getAll<any>('suppliers');
      if (localSuppliers && localSuppliers.length > 0) {
        for (const sup of localSuppliers) {
          if (!String(sup.id || '').startsWith('auto-')) {
            await api.addSupplier(sup).catch(() => {});
          }
        }
      }
      const localCategories = await db.getAll<any>('categories');
      if (localCategories && localCategories.length > 0) {
        for (const cat of localCategories) {
          await api.addCategory(cat).catch(() => {});
        }
      }
      const localPurchases = await db.getAll<any>('purchases');
      if (localPurchases && localPurchases.length > 0) {
        for (const pur of localPurchases) {
          await api.addPurchase(pur).catch(() => {});
        }
      }
      const localStock = await db.getAll<any>('stock_history');
      if (localStock && localStock.length > 0) {
        for (const h of localStock) {
          await api.addStockHistory(h).catch(() => {});
        }
      }
      setDataSyncStatus('synced');
      setDataLastSyncTime(new Date().toLocaleString());
      console.log('Auto-sync completed');
    } catch (e) {
      console.error('Sync failed:', e);
      setDataSyncStatus('pending');
    }
  };

  // Auto-sync when online
  useEffect(() => {
    const handleOnline = () => {
      setDataSyncStatus('pending');
      syncAllData();
    };
    const handleOffline = () => {
      setDataSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      const existing = await db.getAll('products');
      const existingIds = new Set(existing.map((p: any) => p.id));
      const currentIds = new Set(products.filter((p: any) => p?.id).map((p: any) => p.id));
      for (const id of existingIds) {
        if (!currentIds.has(id)) await db.delete('products', id);
      }
      for (const product of products) {
        if (product?.id) await db.put('products', product.id, product);
      }
    };
    saveProducts();
  }, [isInitialized, products]);

  // Save categories to IndexedDB whenever it changes (only after initial load)
  useEffect(() => {
    if (!isInitialized) return;
    const saveCategories = async () => {
      const existing = await db.getAll('categories');
      const existingIds = new Set(existing.map((c: any) => c.id));
      const currentIds = new Set(categories.filter((c: any) => c?.id).map((c: any) => c.id));
      for (const id of existingIds) {
        if (!currentIds.has(id)) await db.delete('categories', id);
      }
      for (const category of categories) {
        if (category?.id) await db.put('categories', category.id, category);
      }
    };
    saveCategories();
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

  const handleLogin = async (user?: any) => {
    await db.put('settings', 'isLoggedIn', true);
    if (user) _setCurrentUser(user);
    setIsLoggedIn(true);
  };

  // ===== 5-minute inactivity auto-logout (client side, server also enforces via DB sessions) =====
  useEffect(() => {
    if (!isLoggedIn) return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const evs: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'pointermove'];
    evs.forEach(e => window.addEventListener(e, bump, { passive: true }));
    const iv = window.setInterval(() => {
      if (Date.now() - last >= 5 * 60 * 1000) {
        handleLogout();
        try { window.dispatchEvent(new CustomEvent('pos:api-error', { detail: typeof t === 'function' ? t('autoLogout5min') : 'Inactive 5 min — auto logged out' })); } catch {}
      }
    }, 30 * 1000);
    return () => { evs.forEach(e => window.removeEventListener(e, bump)); window.clearInterval(iv); };
  }, [isLoggedIn]);

  useEffect(() => {
    const onUnauthorized = () => {
      localStorage.removeItem('pos_current_user');
      db.delete('settings', 'isLoggedIn').catch(() => {});
      setIsLoggedIn(false);
      _setCurrentUser(DEFAULT_ADMIN);
    };
    window.addEventListener('pos:unauthorized', onUnauthorized);
    return () => window.removeEventListener('pos:unauthorized', onUnauthorized);
  }, []);

  const handleLogout = async () => {
    try { await api.logout(); } catch {}
    clearToken();
    localStorage.removeItem('pos_current_user');
    await db.delete('settings', 'isLoggedIn');
    setIsLoggedIn(false);
    _setCurrentUser(DEFAULT_ADMIN);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const handleHardRefresh = async () => {
    if ('caches' in window) {
      const names = await caches.keys();
      for (const name of names) { await caches.delete(name); }
    }
    window.location.reload();
  };

  // Filter products - only show when search, category, supplier, or stock filter is selected
  const hasFilter = searchQuery || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'all';
  const filteredProducts = hasFilter ? products.filter(p => {
    const matchCategory = selectedCategory === 'all' || (p.cat || '') === selectedCategory;
    const matchSupplier = selectedSupplier === 'all' || (p.company || '') === selectedSupplier;
    const matchSearch = !searchQuery || 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStock = 
      stockFilter === 'all' ||
      (stockFilter === 'available' && p.stock > 0) ||
      (stockFilter === 'low' && p.stock > 0 && p.stock <= (p.minStock || 10)) ||
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
    const live = products.find(p => p.id === productId);
    const liveMax = live ? live.stock : undefined;
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item;
        const cap = liveMax !== undefined ? liveMax : item.maxStock;
        if (newQty > cap) {
          alert(`${t('maxStock')}: ${cap}`);
          return item;
        }
        return { ...item, quantity: newQty, maxStock: cap };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Handle add customer from POS
  const handleAddCustomerFromPOS = (customer: Customer) => {
    api.addCustomer(customer).catch(() => {});
    setCustomers([...customers, customer]);
    setSelectedCustomer(customer);
    setIsAddCustomerModalOpen(false);
  };

  // Calculate totals
  const subtotal = parseFloat(cart.reduce((sum, item) => sum + item.sellPrice * item.quantity, 0).toFixed(2));
  const discountAmount = parseFloat(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vatRate = parseFloat(vatPercent) || 0;
  const vatAmount = parseFloat((afterDiscount * vatRate / 100).toFixed(2));
  const total = parseFloat((afterDiscount + vatAmount).toFixed(2));
  const paid = parseFloat(paidAmount) || 0;
  const totalCents = Math.round(total * 100);
  const paidCents = Math.round(paid * 100);
  const due = parseFloat((Math.max(0, totalCents - paidCents) / 100).toFixed(2));
  const change = paidCents > totalCents ? parseFloat(((paidCents - totalCents) / 100).toFixed(2)) : 0;
  const isPaidInFull = paidCents >= totalCents;
  const dueSalesEnabled = settings.dueSalesEnabled !== false;

  // Checkout
  // POS Barcode Enter handler
  const handlePosBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && posBarcode.trim()) {
      const barcode = posBarcode.trim().toLowerCase();
      const found = products.find(p =>
        (p.barcode || '').toLowerCase() === barcode ||
        (p.code || '').toLowerCase() === barcode ||
        (p.id || '').toLowerCase() === barcode
      );
      if (found) {
        addToCart(found);
        setPosBarcode('');
      } else {
        alert(t('productNotFound') || 'Product not found');
      }
    }
  };
  const printReceipt = async (sale: Sale) => {
    const cur = settings?.currencySymbol || '\u09f3';
    const company = settings?.name || '';
    const phone = settings?.phone || '';
    const address = settings?.address || '';
    const email = settings?.email || '';
    const taxId = settings?.taxId || '';
    const crNumber = settings?.crNumber || '';
    const vatEnabled = settings?.vatEnabled !== false;
    const customerName = sale.customerName || t('generalCustomer');
    const invoiceType = sale.invoiceType || 'B2C';
    const customerVat = sale.customerVat || '';
    const customerObj = customers.find(c => c.id === sale.customerId);
    const custPhone = customerObj?.phone || '';
    const custAddress = customerObj?.address || '';
    const custDeposit = customerObj?.deposit || 0;
    const custBalance = customerObj?.balance || 0;
    const zatkaEnabled = settings?.zatkaEnabled === true || settings?.zatkaEnabled === 'true' || settings?.zatkaEnabled === 1 || settings?.zatkaEnabled === '1';
    const zatcaPhase = settings?.zatcaPhase || 'phase1';

    // Items HTML
    let itemsHtml = '';
    sale.items.forEach((item: any) => {
      const qty = +item.quantity || 0;
      const price = +item.price || 0;
      const lineTotal = +item.total || price * qty;
      itemsHtml += `<div style="display:flex;justify-content:space-between;font-size:11px;padding:2px 0;">
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:4px;">${item.name}</span>
        <span style="width:25px;text-align:center;">${qty}</span>
        <span style="width:45px;text-align:right;">${(+price).toFixed(2)}</span>
        <span style="width:60px;text-align:right;">${(+lineTotal).toFixed(2)}</span>
      </div>`;
    });

    // ZATCA QR Code - SVG based (no script needed)
    let qrHtml = '';
    if (zatkaEnabled) {
      try {
        let qrData = '';
        let label = '';
        if (zatcaPhase === 'phase1' || zatcaPhase === 'phase2') {
          // ZATCA TLV QR
          const sellerName = company || 'Seller';
          const vatNo = taxId;
          const ts = new Date().toISOString();
          const totalWithVat = String((+sale.total || 0).toFixed(2));
          const vatAmt = String((+sale.vatAmount || 0).toFixed(2));
          if (zatcaPhase === 'phase2') {
            // Call backend for Phase 2 signing + QR
            try {
              const processResult = await zatcaApi.processInvoice({
                invoiceNo: sale.invoiceNo,
                date: sale.date || new Date().toISOString(),
                customerName: sale.customerName || 'General',
                items: sale.items || [],
                subtotal: sale.subtotal || 0,
                vatAmount: sale.vatAmount || 0,
                total: sale.total || 0,
                paid: sale.paid || 0,
                uuid: '',
              });
              if (processResult.qrBase64) {
                qrData = processResult.qrBase64;
              } else {
                // Fallback to Phase 1 QR if backend not configured
                qrData = QR.generatePhase1QR(sellerName, vatNo, ts, totalWithVat, vatAmt);
              }
            } catch (e) {
              console.error('Phase 2 backend error:', e);
              // Fallback to Phase 1 QR
              qrData = QR.generatePhase1QR(sellerName, vatNo, ts, totalWithVat, vatAmt);
            }
          } else {
            qrData = QR.generatePhase1QR(sellerName, vatNo, ts, totalWithVat, vatAmt);
          }
          label = 'ZATCA ' + (zatcaPhase === 'phase2' ? 'Phase 2' : 'Phase 1');
        } else {
          // Normal QR - structured invoice info
          const itemCount = (sale.items || []).reduce((sum: number, it: any) => sum + (+it.quantity || 1), 0);
          const productCount = (sale.items || []).length;
          const saleDate = new Date(sale.date || Date.now());
          const dateStr = saleDate.toLocaleDateString('en-GB');
          const timeStr = saleDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          qrData = [
            company || '',
            address || '',
            'Tel: ' + (phone || ''),
            '',
            'Invoice: ' + (sale.invoiceNo || ''),
            'Date: ' + dateStr + ' ' + timeStr,
            '',
            'Items: ' + productCount + ' | Qty: ' + itemCount,
            'Total: ' + cur + ' ' + (+sale.total || 0).toFixed(2),
            'Paid: ' + cur + ' ' + (+sale.paid || 0).toFixed(2),
            sale.change > 0 ? 'Change: ' + cur + ' ' + (+sale.change || 0).toFixed(2) : '',
          ].filter(Boolean).join('\n');
          label = '';
        }
        const qrSvg = await QR.renderQRToSVG(qrData, 3);
        qrHtml = '<div style="text-align:center;margin-top:6px;padding-top:4px;border-top:1px dashed #ccc;">' +
          (label ? '<div style="font-size:8px;color:#666;margin-bottom:2px;">' + label + '</div>' : '') +
          qrSvg +
          '</div>';
      } catch (e) {
        console.error('QR generation failed:', e);
        qrHtml = '';
      }
    }

    // Build receipt
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt</title>
<style>
  @media print {
    @page { size: 80mm auto; margin: 2mm; }
    body { margin: 0; padding: 0; }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    color: #000;
    background: #fff;
    padding: 3mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .line2 { border-top: 2px solid #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; padding: 1px 0; font-size: 11px; }
  .row-total { display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 2px solid #000; margin-top: 4px; padding-top: 4px; }
  .due { color: #dc2626; font-weight: bold; }
  .deposit { color: #2563eb; }
  .footer { text-align: center; font-style: italic; font-size: 10px; margin-top: 8px; border-top: 1px dashed #000; padding-top: 6px; }
</style>
</head>
<body>
  <!-- Company Header -->
  <div class="center bold" style="font-size:14px;">${company}</div>
  ${address ? `<div class="center" style="font-size:10px;">${address}</div>` : ''}
  ${phone ? `<div class="center" style="font-size:10px;">Tel: ${phone}</div>` : ''}
  ${email ? `<div class="center" style="font-size:10px;">${email}</div>` : ''}
  ${taxId ? `<div class="center bold" style="font-size:10px;">VAT No: ${taxId}</div>` : ''}
  ${crNumber ? `<div class="center" style="font-size:10px;">CR: ${crNumber}</div>` : ''}

  <div class="line2"></div>
  <div class="center bold" style="font-size:13px;padding:4px 0;">SALES INVOICE</div>
  <div class="line2"></div>

  <!-- Invoice Info -->
  <div style="font-size:10px;margin:4px 0;">
    <div><strong>Invoice:</strong> ${sale.invoiceNo}</div>
    <div><strong>Date:</strong> ${new Date(sale.date || Date.now()).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'})} ${new Date(sale.date || Date.now()).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})}</div>
                    ${zatcaPhase === 'phase2' ? 'ZATCA Phase 2' : zatcaPhase === 'phase1' ? 'ZATCA Phase 1' : ''}
  </div>

  <!-- Customer Info -->
  <div class="line"></div>
  <div style="font-size:11px;padding:4px 0;">
    <div><strong>Customer:</strong> ${customerName}</div>
    ${customerVat ? `<div><strong>VAT:</strong> ${customerVat}</div>` : ''}
    ${custPhone ? `<div><strong>Phone:</strong> ${custPhone}</div>` : ''}
    ${custAddress ? `<div><strong>Address:</strong> ${custAddress}</div>` : ''}
    <div style="font-size:10px;color:${invoiceType === 'B2B' ? '#059669' : '#666'};margin-top:2px;">${invoiceType === 'B2B' ? 'B2B Tax Invoice (Standard)' : 'B2C Simplified Invoice'}</div>
  </div>
  ${sale.due > 0 || custBalance > 0 ? `<div class="line"></div>
  <div style="font-size:10px;padding:4px 0;background:#fef2f2;border-radius:4px;padding:4px 6px;">
    ${sale.due > 0 ? `<div class="due">Due This Sale: ${cur} ${(+sale.due || 0).toLocaleString('en-IN')}</div>` : ''}
    ${custBalance > 0 ? `<div class="due">Total Outstanding: ${cur} ${(+custBalance || 0).toLocaleString('en-IN')}</div>` : ''}
    ${custDeposit > 0 ? `<div class="deposit">Deposit Available: ${cur} ${(+custDeposit || 0).toLocaleString('en-IN')}</div>` : ''}
  </div>` : ''}
  <div class="line"></div>

  <!-- Items Table -->
  <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:bold;border-bottom:1px solid #000;padding-bottom:2px;margin-bottom:2px;">
    <span style="flex:1;">Product</span>
    <span style="width:25px;text-align:center;">Qty</span>
    <span style="width:45px;text-align:right;">Price</span>
    <span style="width:60px;text-align:right;">Total</span>
  </div>
  ${itemsHtml}

  <div class="line"></div>

  <!-- Totals -->
  <div class="row"><span>Subtotal:</span><span>${cur} ${(+sale.subtotal || 0).toLocaleString('en-IN')}</span></div>
  ${sale.discount > 0 ? `<div class="row"><span>Discount:</span><span>-${cur} ${(+sale.discount || 0).toLocaleString('en-IN')}</span></div>` : ''}
  ${vatEnabled && sale.vatAmount > 0 ? `<div class="row"><span>VAT (${sale.vatPercent}%):</span><span>${cur} ${(+sale.vatAmount || 0).toLocaleString('en-IN')}</span></div>` : ''}
  <div class="row-total"><span>TOTAL:</span><span>${cur} ${(+sale.total || 0).toLocaleString('en-IN')}</span></div>

  <div class="line"></div>

  <!-- Payment -->
  <div class="row"><span>Paid:</span><span>${cur} ${(+sale.paid || 0).toLocaleString('en-IN')}</span></div>
  ${sale.change > 0 ? `<div class="row"><span>Change:</span><span>${cur} ${(+sale.change || 0).toLocaleString('en-IN')}</span></div>` : ''}
  ${sale.due > 0 ? `<div class="row due"><span>DUE AMOUNT:</span><span>${cur} ${(+sale.due || 0).toLocaleString('en-IN')}</span></div>` : ''}

  <!-- ZATCA QR Code -->
  ${qrHtml}

  <!-- Footer -->
  <div class="footer" style="border-top:1px dashed #ccc;padding-top:6px;margin-top:8px;">
    <div style="font-size:9px;color:#666;margin-top:2px;">Thanks for shopping!</div>
    <div style="font-size:9px;color:#666;">${new Date(sale.date || Date.now()).toLocaleDateString('en-GB')}</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=320,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
    } else {
      alert(t('printBlocked') || 'Print window blocked! Allow popups to print receipt.');
    }
  };


  const posSearchRef = useRef<HTMLInputElement>(null);
  const posPaidRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentTab !== 'pos') return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'F2') {
        e.preventDefault();
        posSearchRef.current?.focus();
        posSearchRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setHeldSales([...heldSales, { id: `hold-${Date.now()}`, items: [...cart], createdAt: new Date().toISOString(), discount: discount || '', vatPercent: String(vatPercent), paidAmount: paidAmount || '', paymentMethod, customerId: selectedCustomer?.id || '', customerName: selectedCustomer?.name || '' }]);
          setCart([]);
          setDiscount('');
          setPaidAmount('');
          setVatPercent(String(defaultVatPercent));
          setPaymentMethod('cash');
          setSelectedCustomer(null);
          setCartCustomerInput('');
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        posPaidRef.current?.focus();
        posPaidRef.current?.select();
      } else if (e.key === 'Escape') {
        if (cart.length > 0 && (inField ? e.currentTarget !== target : true)) {
          if (window.confirm(t('clearCartConfirm'))) {
            setCart([]);
            setDiscount('');
            setPaidAmount('');
            setVatPercent(String(defaultVatPercent));
            setSelectedCustomer(null);
            setCartCustomerInput('');
            setPaymentMethod('cash');
          }
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentTab, cart.length, heldSales, discount, vatPercent, paidAmount, paymentMethod, defaultVatPercent]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert(t('cartEmpty'));
      return;
    }
    if (!window.confirm(t('confirmCompleteSale'))) return;

    // Check due sales permission
    if (due > 0 && !dueSalesEnabled) {
      alert(t('dueSalesNotEnabled'));
      return;
    }
    if (due > 0 && !selectedCustomer) {
      alert(t('payFullRequired'));
      return;
    }

    // Re-validate live stock (another device may have sold the same product)
    for (const item of cart) {
      const live = products.find(p => p.id === item.productId);
      if (!live) {
        alert(`${t('productNotFound')}: ${item.name}`);
        return;
      }
      if (live.stock < item.quantity) {
        alert(`${t('maxStock')}: ${live.name} (${live.stock} ${live.unit})`);
        return;
      }
    }

    // B2B/B2C detection: customer has VAT number = B2B
    const customerVat = selectedCustomer?.vatNumber || '';
    const isB2B = customerVat.length > 0;
    const invoiceType = isB2B ? 'B2B' : 'B2C';

    const sale: Sale = {
      id: genId(),
      invoiceNo: (() => {
        const d = new Date();
        const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        const seq = sales.filter(s => s.invoiceNo && String(s.invoiceNo).includes(ymd)).length + 1;
        return `${ymd}${String(seq).padStart(4, '0')}`;
      })(),
      date: now(),
      customerId: selectedCustomer?.id || GENERAL_CUSTOMER_ID,
      customerName: selectedCustomer?.name || t('generalCustomer'),
      customerVat: customerVat,
      invoiceType: invoiceType,
      items: cart.map(item => ({
        productId: item.productId,
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

    // Save sale to MySQL API (server will decrease stock)
    api.addSale(sale).catch((err) => console.error('Sale API error:', err));

    // Update stock locally for instant UI
    setProducts(prev => prev.map(p => {
      const cartItem = cart.find(c => c.productId === p.id);
      return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
    }));

    // Apply deposit first, then remaining becomes due
    if (selectedCustomer) {
      const custDeposit = selectedCustomer.deposit || 0;
      const custDue = selectedCustomer.balance > 0 ? selectedCustomer.balance : 0;
      let newBalance = custDue;
      let newDeposit = custDeposit;
      
      if (due > 0) {
        // Has due: apply deposit to reduce due
        if (custDeposit > 0) {
          const applied = Math.min(custDeposit, due);
          newBalance = custDue + (due - applied);
          newDeposit = custDeposit - applied;
        } else {
          newBalance = custDue + due;
        }
      } else if (paid > total && custDeposit >= 0) {
        // Overpaid: add extra to deposit
        const extra = paid - total;
        newDeposit = custDeposit + extra;
      }
      
      if (newBalance !== custDue || newDeposit !== custDeposit) {
        setCustomers(prev => prev.map(c =>
          c.id === selectedCustomer.id ? { ...c, balance: newBalance, deposit: newDeposit } : c
        ));
        api.updateCustomer(selectedCustomer.id, { ...selectedCustomer, balance: newBalance, deposit: newDeposit }).catch(() => {});
      }
    }

    setSales(prev => [...prev, sale]);
    // No popup: print directly to thermal printer

    // Print first (do not wait on ZATCA)
    await printReceipt(sale);

    // Submit to ZATCA if Phase 2 configured (non-blocking)
    if (settings.zatcaPhase === 'phase2') {
      zatcaApi.processInvoice({
        invoiceNo: sale.invoiceNo,
        date: sale.date,
        customerName: sale.customerName,
        customerVat: sale.customerVat,
        isSimplified: sale.invoiceType === 'B2C',
        items: sale.items,
        subtotal: sale.subtotal,
        vatAmount: sale.vatAmount,
        total: sale.total,
      }).then((zatcaResult: any) => {
        if (zatcaResult?.status) console.log('ZATCA submitted:', zatcaResult.status);
      }).catch((e: any) => console.error('ZATCA submit failed:', e));
    }
    setCart([]);
    setDiscount('');
    setPaidAmount('');
    setVatPercent(String(defaultVatPercent));
    setSelectedCustomer(null);
    setCartCustomerInput('');
    setPaymentMethod('cash');
    setSearchQuery('');
    setCustomerSearch('');
    setSelectedCategory('all');
    setSelectedSupplier('all');
    setStockFilter('all');
    setShowExpiryList(false);
    setShowCustomerList(false);
    setShowHeldSales(false);
    setPosBarcode('');
  };

  if (isLoading) return null;
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
              <div style={{ fontSize: 13, color: '#9CA3AF', width: 180, textAlign: 'center' }}>{t('smartBusinessPartner')}</div>
            </div>
          </div>
          
          {/* Dynamic Menu - Scrollable */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 10, marginRight: 10, minWidth: 0, flex: 1 }}>
            {/* Scrollable Menu - Centered */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 4 }}>
              {/* Left Arrow */}
              <button onClick={() => scrollMenu('left')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}><i className="fas fa-chevron-left"></i></button>

              {/* Menu Items Container */}
              <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto', gap: 2, padding: '4px 5px', background: '#F5F5F5', borderRadius: 12, border: '1px solid #E0E0E0', scrollbarWidth: 'none', msOverflowStyle: 'none', flexShrink: 0 }}>
                <button onClick={() => setCurrentTab('pos')} style={{
                  padding: '5px 10px',
                  border: 'none',
                  background: currentTab === 'pos' ? '#115E59' : 'transparent',
                  cursor: 'pointer',
                  color: currentTab === 'pos' ? '#FFFFFF' : '#115E59',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 16 }}><i className="fas fa-cart-shopping"></i></span>
                  <span style={{ marginLeft: 6 }}>{t('sales')}</span>
                </button>
                {otherTabs.map((t) => (
                  <button key={t.id} onClick={() => setCurrentTab(t.id)} style={{
                    padding: '5px 10px',
                    border: 'none',
                    background: currentTab === t.id ? '#115E59' : 'transparent',
                    cursor: 'pointer',
                    color: currentTab === t.id ? '#FFFFFF' : '#115E59',
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
                    <span style={{ marginLeft: 6 }}>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              <button onClick={() => scrollMenu('right')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}><i className="fas fa-chevron-right"></i></button>
            </div>
          </div>

          {/* Actions Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            {/* Refresh Button */}
            <button onClick={handleHardRefresh} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#4B5563' }} title={t("hardRefresh")}><i className="fas fa-rotate"></i></button>
            
            {/* Fullscreen Button */}
            <button onClick={handleFullscreen} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title={isFullscreen ? t('exitFullscreen') : t('fullScreen')}>{isFullscreen ? <i className="fas fa-xmark"></i> : <i className="fas fa-expand"></i>}</button>
            
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
              >
                <i className="fas fa-globe" style={{marginRight: 4}}></i> {currentLang.flag} {currentLang.nativeName}
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
                      {language === lang.code && <span style={{ marginLeft: 'auto' }}><i className="fas fa-check"></i></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title={t("logout")}><i className="fas fa-right-from-bracket"></i></button>

            {/* Date & Time */}
            <TimeDisplay language={language} />
            
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
        {currentTab === 'pos' && (
          (isInitialized && tabLoading) ? <TabLoader /> : (
          <div style={{ display: 'flex', height: '100%', overflow: 'hidden', width: '100%', background: '#F9FAFB' }}>
            {/* -- LEFT: Products -- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minWidth: 0, position: 'relative' }}>
              {/* Search Section - Professional Modern Design */}
              <div style={{ 
                background: '#F5F5F5', border: '1px solid #E0E0E0',
                padding: '10px 20px',
                boxShadow: 'none',
                position: 'relative',
                overflow: 'visible'
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
                      <span style={{ fontSize: 16 }}><i className="fas fa-box"></i></span>
                    </div>
                    <input
                      ref={posSearchRef}
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
                    overflow: 'visible'
                  }}>
                    <div style={{ 
                      position: 'absolute', left: 0, top: 0, bottom: 0, 
                      width: 40, 
                      background: '#E0E0E0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '10px 0 0 10px'
                    }}>
                      <span style={{ fontSize: 16 }}><i className="fas fa-user"></i></span>
                    </div>
                    <input
                      value={customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setShowHeldSales(false); setShowExpiryList(false); setShowCustomerList(e.target.value.length > 0 || showCustomerList); }}
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
                      <option value="all">{t('allSuppliers')}</option>
                      {suppliers.map((s: any) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
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
                      <option value="all">{t('allCategories')}</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
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
                      <span style={{ fontSize: 13 }}><i className="fas fa-box"></i></span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#424242' }}>{filteredProducts.length}</span>
                      <span style={{ fontSize: 13, color: '#757575' }}>{t("products")}</span>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'available' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-box"></i></div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'low' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-triangle-exclamation"></i></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: stockFilter === 'low' ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('stockLow')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stockFilter === 'low' ? '#FFFFFF' : '#D97706', lineHeight: 1 }}>{products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 10)).length}</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'out' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-ban"></i></div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showExpiryList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-calendar"></i></div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: showExpiryList ? 'rgba(255,255,255,0.9)' : '#6B7280', textTransform: 'uppercase' }}>{t('productExpiry')}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: showExpiryList ? '#FFFFFF' : '#059669', lineHeight: 1 }}>{products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length}</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showCustomerList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-users"></i></div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showHeldSales ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}><i className="fas fa-clipboard-list"></i></div>
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
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}><i className="fas fa-clipboard-list" style={{marginRight: 4}}></i> {t('holdSales')} ({heldSales.length})</span>
                      </div>

                      {/* Clear All Button - Right Side */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                        <button 
                          onClick={() => setShowHeldSales(false)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('close')}
                        </button>
                      </div>
                    </div>

                    {/* Hold Sales Cards */}
                    {heldSales.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}><i className="fas fa-clipboard-list"></i></div>
                        <div style={{ color: '#9CA3AF', fontSize: 14 }}>{t('noHoldSales')}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                        {heldSales.map((sale, idx) => (
                          <div
                            key={sale.id}
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
                                <span style={{ fontSize: 16 }}><i className="fas fa-clipboard-list"></i></span>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#115E59' }}>{t('hold')} #{idx + 1}</span>
                                <span style={{ fontSize: 12, color: '#6B7280' }}>({sale.items.length} items)</span>
                              </div>
                              <button 
                                onClick={() => {
                                  const newHeld = [...heldSales];
                                  newHeld.splice(idx, 1);
                                  setHeldSales(newHeld);
                                }}
                                style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                            
                            {/* Card Body - Items Summary */}
                            <div style={{ padding: '8px 12px' }}>
                              {sale.items.slice(0, 3).map((item, itemIdx) => (
                                <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: itemIdx < Math.min(sale.items.length - 1, 2) ? '1px dashed #E5E7EB' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}><i className="fas fa-box"></i></span>
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
                                  {fmt((() => {
                                    const holdSub = sale.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
                                    const holdDisc = parseFloat(sale.discount || '') || 0;
                                    const holdAfter = Math.max(0, holdSub - holdDisc);
                                    const holdVatRate = parseFloat(sale.vatPercent || '') || 0;
                                    return parseFloat((holdAfter + holdAfter * holdVatRate / 100).toFixed(2));
                                  })())}
                                </span>
                              </div>
                              <button 
                                onClick={() => {
                                  setCart(prev => {
                                    let next = [...prev];
                                    sale.items.forEach((item) => {
                                      const product = products.find(p => p.id === item.productId);
                                      if (!product || product.stock <= 0) return;
                                      const qty = Math.min(item.quantity, product.stock);
                                      const existing = next.find(i => i.productId === item.productId);
                                      if (existing) {
                                        next = next.map(i => i.productId === item.productId
                                          ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
                                          : i);
                                      } else {
                                        next = [...next, {
                                          id: genId(),
                                          productId: product.id,
                                          name: product.name,
                                          sellPrice: product.sellPrice,
                                          costPrice: product.costPrice,
                                          quantity: qty,
                                          unit: product.unit,
                                          maxStock: product.stock,
                                        }];
                                      }
                                    });
                                    return next;
                                  });
                                  if (sale.discount !== undefined) setDiscount(String(sale.discount || ''));
                                  if (sale.vatPercent !== undefined) setVatPercent(String(sale.vatPercent));
                                  if (sale.paidAmount !== undefined) setPaidAmount(String(sale.paidAmount || ''));
                                  if (sale.paymentMethod) setPaymentMethod(sale.paymentMethod);
                                  if (sale.customerId) {
                                    const heldCust = customers.find(c => c.id === sale.customerId);
                                    if (heldCust) {
                                      setSelectedCustomer(heldCust);
                                      setCartCustomerInput(heldCust.name);
                                    }
                                  }
                                  const newHeld = [...heldSales];
                                  newHeld.splice(idx, 1);
                                  setHeldSales(newHeld);
                                }}
                                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EA580C', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 6px rgba(234,88,12,0.3)' }}>
                                <i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addItems')}
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
                    {(selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'all' || searchQuery) && (
                      <div style={{ marginBottom: 12, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                        
                        {/* Filter Pills - Left Side */}
                        {searchQuery && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#EEF2FF', borderRadius: 20, border: '1px solid #C7D2FE' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}><i className="fas fa-magnifying-glass" style={{marginRight: 4}}></i> "{searchQuery}" ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Category Filter */}
                        {selectedCategory !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}><i className="fas fa-folder-open" style={{marginRight: 4}}></i> {categories.find(c => c.name === selectedCategory || String(c.id) === String(selectedCategory))?.name || selectedCategory} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Supplier Filter */}
                        {selectedSupplier !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#FEF3C7', borderRadius: 20, border: '1px solid #FDE68A' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}><i className="fas fa-clipboard-list" style={{marginRight: 4}}></i> {selectedSupplier} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Stock Filter */}
                        {stockFilter !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: stockFilter === 'available' ? '#F0FDFA' : stockFilter === 'low' ? '#FFF7ED' : '#FEF2F2', borderRadius: 20, border: `1px solid ${stockFilter === 'available' ? '#99F6E4' : stockFilter === 'low' ? '#FDBA74' : '#FECACA'}` }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: stockFilter === 'available' ? '#115E59' : stockFilter === 'low' ? '#EA580C' : '#DC2626' }}>
                              {stockFilter === 'available' && <><i className="fas fa-box" style={{marginRight: 4}}></i> {t('stockAvailable')} ({filteredProducts.length})</>}
                              {stockFilter === 'low' && <><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('stockLow')} ({filteredProducts.length})</>}
                              {stockFilter === 'out' && <><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('stockOut')} ({filteredProducts.length})</>}
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
                            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('close')}
                          </button>
                        </div>
                      </div>
                    )}
                  

                    {/* Expiry Products List */}
                    {showExpiryList && (
                      <div style={{ padding: '16px 0' }}>
                        <div style={{ marginBottom: 12, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}><i className="fas fa-calendar" style={{marginRight: 4}}></i> {t('productExpiry')} ({products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length})</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                            <button onClick={() => setShowExpiryList(false)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('close')}</button>
                          </div>
                        </div>
                        {products.filter(p => p.expiryDate && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length === 0 ? (
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
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}><i className="fas fa-calendar" style={{marginRight: 4}}></i> {p.expiryDate}</div>
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
                    {(showCustomerList || customerSearch.length > 0) && (
                      <div style={{ padding: '16px 0' }}>
                        <div style={{ marginBottom: 12, padding: 12, background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}><i className="fas fa-users" style={{marginRight: 4}}></i> {t('customers')} ({customerSearch.length > 0 ? filteredCustomers.length : customers.length})</span>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                            <button onClick={() => setIsAddCustomerModalOpen(true)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#115E59', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addCustomer')}</button>
                            <button onClick={() => { setShowCustomerList(false); setCustomerSearch(""); }} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('close')}</button>
                          </div>
                        </div>
                        {customers.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: 24, background: '#F0FDFA', borderRadius: 12 }}>
                            <p style={{ color: '#9CA3AF', margin: 0 }}>{t('noCustomerFound')}</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                             {(customerSearch.length > 0 ? filteredCustomers : customers).map(c => (
                              <div key={c.id} style={{ background: '#FFFFFF', border: '1px solid #CCFBF1', borderRadius: 14, padding: 12 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}><i className="fas fa-mobile-screen" style={{marginRight: 4}}></i> {c.phone}</div>
                                {c.vatNumber && <div style={{ fontSize: 10, color: '#059669', marginTop: 2 }}><i className="fas fa-building" style={{marginRight: 4}}></i> VAT: {c.vatNumber}</div>}
                                {c.balance > 0 && (
                                  <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>{t('due')}: {settings.currencySymbol} {c.balance}</div>
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
                    ) : !searchQuery && selectedCategory === 'all' && selectedSupplier === 'all' && stockFilter === 'all' && filteredProducts.length === 0 ? (
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
                          <span style={{ fontSize: 48 }}><i className="fas fa-cart-shopping"></i></span>
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
                            <span style={{ fontSize: 16 }}><i className="fas fa-barcode"></i></span>
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
                    ) : (searchQuery || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'all') ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {filteredProducts.filter(Boolean).map(product => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          style={{
                            background: product.stock <= 0 ? '#FEF2F2' : product.stock <= (product.minStock || 10) ? '#FFF7ED' : '#FFFFFF',
                            border: `1.5px solid ${product.stock <= 0 ? '#DC2626' : product.stock <= (product.minStock || 10) ? '#EA580C' : '#E5E7EB'}`,
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
                            background: product.stock <= 0 ? '#fecaca' : product.stock <= (product.minStock || 10) ? '#fed7aa' : '#F0FDFA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            overflow: 'hidden',
                            border: `2px solid ${product.stock <= 0 ? '#fca5a5' : product.stock <= (product.minStock || 10) ? '#fdba74' : '#E5E7EB'}`,
                          }}>
                             {productImages[product.id] || productImages[product.name] ? (
                                <img
                                  src={productImages[product.id] || productImages[product.name]}
                                  alt={product.name}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }}
                                  onError={(e: any) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
                                />
                              ) : null}
                              <div style={{ display: (productImages[product.id] || productImages[product.name]) ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                {product.icon ? (
                                  <i className={`fas ${product.icon}`} style={{ fontSize: 36, color: '#0F766E' }}></i>
                                ) : (
                                  <i className={`fas ${getProductIcon(product.name)}`} style={{ fontSize: 36, color: '#0F766E' }}></i>
                                )}
                              </div>
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
                                <i className="fas fa-barcode" style={{marginRight: 4}}></i> {product.code || 'N/A'}
                              </div>
                              <div style={{ fontSize: 11, color: '#9CA3AF' }}>
                                /{product.unit}
                              </div>
                            </div>

                            {/* Bottom: Price & Stock */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: product.stock <= 0 ? '#DC2626' : product.stock <= (product.minStock || 10) ? '#EA580C' : '#115E59', lineHeight: 1 }}>
                                {fmt(product.sellPrice)}
                              </div>
                              <div style={{ 
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                background: product.stock <= 0 ? '#DC2626' : product.stock <= (product.minStock || 10) ? '#EA580C' : '#115E59',
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
                  value={posBarcode}
                  onChange={(e) => setPosBarcode(e.target.value)}
                  onKeyDown={handlePosBarcodeKeyDown}
                />
              </div>

              {/* Cart Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#FFFFFF', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#115E59', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><i className="fas fa-cart-shopping" style={{marginRight: 4}}></i> {t('cart')}</h3>
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
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>
                          <i className="fas fa-user" style={{marginRight: 4}}></i> {selectedCustomer.name} • {selectedCustomer.phone}
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
                          }}>
                          <i className="fas fa-xmark"></i>
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
                      {cartCustomerFiltered.length > 0 && (
                        <div data-menu="cart-customer" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 100, maxHeight: 280, overflow: 'auto', padding: 8 }}>
                          {cartCustomerFiltered.map(c => {
                            const rawDue = (parseFloat(c.balance as any) || 0) > 0 ? parseFloat(c.balance as any) || 0 : 0;
                            const rawDeposit = parseFloat(c.deposit as any) || 0;
                            const netDue = Math.max(0, rawDue - rawDeposit);
                            const totalSales = sales.filter(s => s.customerId === c.id).reduce((sum, s) => sum + (parseFloat(s.total as any) || 0), 0);
                            return (
                              <div key={c.id} onClick={() => { setSelectedCustomer(c); setCartCustomerInput(''); }}
                                style={{ padding: '10px', cursor: 'pointer', borderRadius: 10, marginBottom: 4, border: '1px solid #e0e0e0', background: '#fff', transition: 'all 0.15s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#F0FDFA'; e.currentTarget.style.borderColor = '#115E59'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#115E59', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 700, flexShrink: 0 }}>
                                    {c.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: '#1F2937', fontSize: 13 }}>{c.name}</div>
                                    <div style={{ fontSize: 11, color: '#9CA3AF' }}>{c.phone || t('phoneNotFound')}</div>
                                    {c.vatNumber && <div style={{ fontSize: 10, color: '#059669' }}>VAT: {c.vatNumber}</div>}
                                  </div>
                                  <div style={{ textAlign: 'right', display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>{t('total')}</div>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: '#115E59' }}>{settings.currencySymbol}{totalSales}</div>
                                    </div>
                                    {netDue > 0 && (
                                      <div>
                                        <div style={{ fontSize: 9, fontWeight: 600, color: '#D32F2F', textTransform: 'uppercase' }}>{t('due')}</div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#D32F2F' }}>{settings.currencySymbol}{netDue}</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                  <button 
                    onClick={() => {
                      setIsAddCustomerModalOpen(true);
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
                    }}>
                    <i className="fas fa-plus" style={{marginRight: 4}}></i> {t('add')}
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflow: 'auto', background: '#fafbfc' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', background: '#FFFFFF', margin: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}><i className="fas fa-cart-shopping"></i></div>
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
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#115E59', flexShrink: 0 }}>{fmt(item.sellPrice * item.quantity)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                            <span style={{ fontSize: 14, color: '#6B7280' }}>{item.quantity} × {fmt(item.sellPrice)}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => updateQuantity(item.productId, -1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>−</button>
                              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 18, textAlign: 'center' }}>{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.productId, 1)} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#F3F4F6', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>+</button>
                              <button onClick={() => setCart(prev => prev.filter(i => i.productId !== item.productId))} style={{ width: 22, height: 22, border: 'none', borderRadius: 4, background: '#FEF2F2', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DC2626', marginLeft: 4 }}><i className="fas fa-xmark"></i></button>
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
                  {settings.vatEnabled && vatAmount > 0 && (
                    <div style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #d1d5db', background: '#FFFBEB' }}>
                      <span style={{ fontSize: 15, color: '#374151' }}>{t('vat')} ({vatRate}%)</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>+{fmt(vatAmount)}</span>
                    </div>
                  )}
                  <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#115E59' }}>
                    <span style={{ fontSize: 14, color: '#fff', fontWeight: 700 }}>{dueSalesEnabled && selectedCustomer && due > 0 ? t('totalDue') : t('total')}</span>
                    <span style={{ fontSize: 18, color: '#fff', fontWeight: 800 }}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Discount & VAT Inputs */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <input value={discount} onChange={(e) => setDiscount(e.target.value)} type="number" min="0"
                    placeholder={t('discount')}
                    style={{ flex: settings.vatEnabled ? 1 : '1 1 100%', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 8px', fontSize: 14, outline: 'none', background: '#fafbfc', boxSizing: 'border-box', color: '#16A34A' }}/>
                  {settings.vatEnabled && (
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
                  )}
                </div>

                {/* Payment Input */}
                <input ref={posPaidRef} value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} type="number" min="0"
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
                {due > 0 && dueSalesEnabled && selectedCustomer && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#FEF2F2', color: '#DC2626', fontWeight: 600, textAlign: 'center' }}>
                    <i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('due')}: {fmt(due)}
                  </div>
                )}
                {due > 0 && !dueSalesEnabled && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#FEF3C7', color: '#D97706', fontWeight: 600, textAlign: 'center' }}>
                    <i className="fas fa-info-circle" style={{marginRight: 4}}></i> {t('dueSalesDisabled')} — {t('payFullRequired')}
                  </div>
                )}
                {change > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#F0FDF4', color: '#16A34A', fontWeight: 600, textAlign: 'center' }}>
                    <i className="fas fa-dollar-sign" style={{marginRight: 4}}></i> {t('change')}: {fmt(change)}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 6 }}>
                  {/* Clear Cart Button */}
                  <button 
                    onClick={() => {
                      if (cart.length > 0 && confirm(t('clearCartConfirm'))) {
                        setCart([]);
                        setDiscount('');
                        setPaidAmount('');
                        setVatPercent(String(defaultVatPercent));
                        setPaymentMethod('cash');
                        setSelectedCustomer(null);
                        setCartCustomerInput('');
                      }
                    }}
                    disabled={cart.length === 0}
                    style={{
                      padding: '10px 12px', borderRadius: 8, border: '1px solid #D1D5DB',
                      background: '#F5F5F5',
                      color: cart.length > 0 ? '#DC2626' : '#9CA3AF',
                      fontWeight: 600, fontSize: 13, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    }}>
                    <i className="fas fa-trash"></i>
                  </button>
                  {/* Hold Button */}
                  <button 
                    onClick={() => {
                      if (cart.length > 0) {
                        setHeldSales([...heldSales, { id: `hold-${Date.now()}`, items: [...cart], createdAt: new Date().toISOString(), discount: discount || '', vatPercent: String(vatPercent), paidAmount: paidAmount || '', paymentMethod, customerId: selectedCustomer?.id || '', customerName: selectedCustomer?.name || '' }]);
                        setCart([]);
                        setDiscount('');
                        setPaidAmount('');
                        setVatPercent(String(defaultVatPercent));
                        setPaymentMethod('cash');
                        setSelectedCustomer(null);
                        setCartCustomerInput('');
                      }
                    }}
                    disabled={cart.length === 0}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: '1px solid #D1D5DB',
                      background: '#F5F5F5',
                      color: cart.length > 0 ? '#115E59' : '#9CA3AF',
                      fontWeight: 600, fontSize: 13, cursor: cart.length > 0 ? 'pointer' : 'not-allowed',
                    }}>
                    <i className="fas fa-clipboard-list" style={{marginRight: 4}}></i> {t('hold')}
                  </button>
                  {/* Complete Sale Button */}
                  {(() => {
                    const canComplete = cart.length > 0 && (
                      dueSalesEnabled && selectedCustomer
                        ? true
                        : isPaidInFull
                    );
                    return (
                    <button onClick={handleCheckout}
                      disabled={!canComplete}
                      style={{
                        padding: '12px 16px', borderRadius: 14, border: 'none',
                        background: canComplete ? '#EA580C' : '#e5e7eb',
                        color: canComplete ? '#fff' : '#9CA3AF', fontWeight: 700, fontSize: 16,
                        cursor: canComplete ? 'pointer' : 'not-allowed',
                        boxShadow: canComplete ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
                      }}>
                      <i className="fas fa-check" style={{marginRight: 4}}></i> {t('completeSale')}
                    </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {currentTab === 'pos' && (
          <CustomerModal
            isOpen={isAddCustomerModalOpen}
            mode="add"
            onClose={() => setIsAddCustomerModalOpen(false)}
            onSave={handleAddCustomerFromPOS}
          />
        )}

        {currentTab === 'products' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <ProductsScreen
            products={products}
            suppliers={suppliers}
            categories={categories}
            purchases={purchases}
            productHistory={productHistory}
            setProducts={setProducts}
            setSuppliers={setSuppliers}
            setCategories={setCategories}
            setPurchases={setPurchases}
            settings={settings}
            currentUser={currentUser}
          />
          )
        )}

        {currentTab === 'customers' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <CustomerManagement
            customers={customers}
            setCustomers={setCustomers}
            sales={sales}
            onDeleteCustomer={handleDeleteCustomerFromDB}
            settings={settings}
          />
          )
        )}

        {currentTab === 'reports' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <div>
            <h2 style={{ marginBottom: 16 }}><i className="fas fa-chart-line" style={{marginRight: 4}}></i> {t('reports')}</h2>
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
                  {products.filter(p => p.stock <= (p.minStock || 10)).length}
                </div>
              </div>
            </div>
            
            {/* Sales List Section */}
            <div className="card" style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 12 }}><i className="fas fa-receipt" style={{marginRight: 4}}></i> {t('salesList')}</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>{t('invoice')}</th>
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
          )
        )}

        {currentTab === 'settings' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <SettingsScreen 
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
            syncAllData={syncAllData}
            dataSyncStatus={dataSyncStatus}
            dataLastSyncTime={dataLastSyncTime}
          />
          )
        )}

        {currentTab === 'newproduct' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <NewProductTab 
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
          )
        )}

        {currentTab === 'barcode' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <div>
            <h2 style={{ marginBottom: 16 }}><i className="fas fa-barcode" style={{marginRight: 4}}></i> {t('barcode')}</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="label">{t('code')}</label>
                <input type="text" className="input" placeholder={t('code')} />
              </div>
              <button className="btn btn-primary">{t('barcode')}</button>
              <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#F9FAFB', borderRadius: 8 }}>
                <div style={{ fontSize: 48 }}><i className="fas fa-barcode"></i></div>
                <p style={{ color: '#9CA3AF', marginTop: 8 }}>{t('barcode')} preview</p>
              </div>
            </div>
          </div>
          )
        )}

        {currentTab === 'suppliers' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <SuppliersScreen 
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            categories={categories}
            setCategories={setCategories}
            products={products}
            setProducts={setProducts}
            purchases={purchases}
            settings={settings}
          />
          )
        )}

        {currentTab === 'inventory' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <div>
            <h2 style={{ marginBottom: 16 }}><i className="fas fa-warehouse" style={{marginRight: 4}}></i> {t('stock')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><i className="fas fa-box"></i></div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>{0}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalProductsCount')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><i className="fas fa-triangle-exclamation"></i></div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>{0}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockLow')}</div>
              </div>
              <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}><i className="fas fa-check"></i></div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>{0}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockAvailable')}</div>
              </div>
            </div>
            
            {/* Low Stock Alert Section */}
            <div className="card" style={{ border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <h3 style={{ marginBottom: 12, color: '#DC2626' }}><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('lowStockAlert')}</h3>
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>{t('noLowStockProducts')}</p>
            </div>
          </div>
          )
        )}

        {currentTab === 'income' && (
          (!isInitialized || tabLoading ? <TabLoader /> : <div>
            <h2 style={{ marginBottom: 16 }}><i className="fas fa-money-bill" style={{marginRight: 4}}></i> {t('incomeExpenses')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}><i className="fas fa-chart-line"></i></div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>{settings.currencySymbol} 0</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalIncome')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}><i className="fas fa-chart-line"></i></div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>{settings.currencySymbol} 0</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalExpense')}</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addExpense')}</h3>
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
          )
        )}
      </div>

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
    unit: 'pcs',
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
      unit: form.unit || 'pcs',
      buyP: +form.buyP || 0,
      sellP: +form.sellP || 0,
      stock: +form.stock || 0,
      minStock: +form.minStock || 5
    };
    setPurchaseItems([...purchaseItems, item]);
    setForm({ name: '', barcode: '', company: form.company, cat: '', unit: 'pcs', buyP: '', sellP: '', stock: '', minStock: '5' });
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
    setForm({ name: '', barcode: '', company: '', cat: '', unit: 'pcs', buyP: '', sellP: '', stock: '', minStock: '5' });
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
          unit: found.unit || 'pcs',
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
    const csv = `# Products CSV
name,barcode,company,cat,unit,buyprice,sellprice,stock,minstock
Mini Cement,001,${uniqueCompanies[0] || 'Company'},Food,kg,55,65,100,10
Sujin Chips,002,${uniqueCompanies[0] || 'Company'},Snacks,pcs,20,25,200,20`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'products.csv';
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
        alert(t('csvMinRows'));
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: NewProductItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

        const item: NewProductItem = {
          name: row['name'] || row['নাম'] || '',
          barcode: row['barcode'] || row['বারকোড'] || '',
          company: row['company'] || row['সরবরাহকারী'] || '',
          cat: row['cat'] || row['ক্যাটাগরি'] || '',
          unit: row['unit'] || row['একক'] || 'pcs',
          buyP: parseFloat(row['buyprice'] || row['buy'] || row['ক্রয়মূল্য'] || '0'),
          sellP: parseFloat(row['sellprice'] || row['sell'] || row['বিক্রয়মূল্য'] || '0'),
          stock: parseFloat(row['stock'] || row['স্টক'] || '0'),
          minStock: parseFloat(row['minstock'] || row['মিনস্টক'] || '5')
        };

        if (item.name) items.push(item);
      }

      if (items.length > 0) {
        setPurchaseItems([...purchaseItems, ...items]);
        alert(items.length + ' ' + t('productsUploaded'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', background: 'white', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>{t('products')} {t('newProductSave')}</span>
        <span style={{ fontSize: 14, color: '#6B7280', marginLeft: 'auto' }}>{purchaseItems.length} {t('productsAdded')}</span>
        {purchaseItems.length > 0 && (
          <button onClick={savePurchase} style={{ padding: '8px 16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('saveAll')}
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
              <span><i className="fas fa-folder-open"></i></span> {t('csvUpload')}
            </label>
            <button onClick={downloadDemoCSV} style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span><i className="fas fa-file-import"></i></span> {t('demoCsv')}
            </button>
          </div>

          {/* Form Card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0D9488', fontWeight: 700 }}>{t('addProduct')}</h3>

            {/* Company + Category: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Company */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-building" style={{marginRight: 4}}></i> {t('companySupplier')} *</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={supplierQ}
                    onChange={e => { setSupplierQ(e.target.value); setForm(f => ({ ...f, company: e.target.value || '' })); setShowCompanyList(true); }}
                    onFocus={() => setShowCompanyList(true)}
                    onBlur={() => setTimeout(() => setShowCompanyList(false), 200)}
                    placeholder={t('selectSupplier')}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowCompanyList(!showCompanyList)} style={{ padding: '4px 5px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>▼</button>
                </div>
                {showCompanyList && (
                  <div data-menu="company-list" style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCompanies.map((c, i) => (
                      <div key={i} onClick={() => { setSupplierQ(c || ''); setForm(f => ({ ...f, company: c || '' })); setShowCompanyList(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                        {c}
                      </div>
                    ))}
                    {filteredCompanies.length === 0 && <div style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 14 }}>{t('noProductsAdded')}</div>}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {t('category')}</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={form.cat}
                    onChange={e => setForm(f => ({ ...f, cat: e.target.value }))}
                    onFocus={() => setShowCategoryList(true)}
                    onBlur={() => setTimeout(() => setShowCategoryList(false), 200)}
                    placeholder={t('selectCategory')}
                    style={{ flex: 1, padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                  />
                  <button type="button" onClick={() => setShowCategoryList(!showCategoryList)} style={{ padding: '4px 5px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>▼</button>
                </div>
                {showCategoryList && (
                  <div data-menu="cat-list" style={{ position: 'absolute', left: 0, right: 0, top: '100%', background: 'white', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 180, overflow: 'auto', marginTop: 2 }}>
                    {filteredCategories.map((c, i) => (
                      <div key={i} onClick={() => { setForm(f => ({ ...f, cat: c || '' })); setShowCategoryList(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: 14 }}>
                        {c}
                      </div>
                    ))}
                    {filteredCategories.length === 0 && <div style={{ padding: '8px 12px', color: '#9CA3AF', fontSize: 14 }}>{t('noProductsAdded')}</div>}
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-hashtag" style={{marginRight: 4}}></i> {t('barcode')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('unit')}</label>
                <select
                  value={form.unit}
                  onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box', cursor: 'pointer' }}
                >
                  <option value="pcs">{t("pcs")}</option>
                  <option value="kg">{t("kg")}</option>
                  <option value="liter">{t("liter")}</option>
                  <option value="box">{t("box")}</option>
                  <option value="gram">{t("gram")}</option>
                  <option value="meter">{t("meter")}</option>
                  <option value="dozen">{t("dozen")}</option>
                  <option value="bottle">{t("bottle")}</option>
                  <option value="set">{t("setUnit")}</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('stock')}</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('minStock')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-money-bill" style={{marginRight: 4}}></i> {t('purchasePrice')}</label>
                <input
                  type="number"
                  value={form.buyP}
                  onChange={e => setForm(f => ({ ...f, buyP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-dollar-sign" style={{marginRight: 4}}></i> {t('sellPrice')}</label>
                <input
                  type="number"
                  value={form.sellP}
                  onChange={e => setForm(f => ({ ...f, sellP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-arrow-trend-up" style={{marginRight: 4}}></i> {t('profit')}</label>
                <div style={{ padding: '10px 12px', background: '#DCFCE7', borderRadius: 8, fontWeight: 700, color: '#166534', fontSize: 14, border: '1px solid #BBF7D0' }}>
                  {typeof profit === 'number' ? profit : profit} {typeof profitPercent === 'number' ? `(${profitPercent}%)` : ''}
                </div>
              </div>
            </div>

            {/* VAT + VAT Amount + Total: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}><i className="fas fa-receipt" style={{marginRight: 4}}></i> {t('vatPercent')}</label>
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
            <button onClick={addItem} style={{ width: '100%', padding: '12px', background: '#0D9488', color: 'white', border: 'none', borderRadius: 14, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              <i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addToProductList')}
            </button>
          </div>
        </div>

        {/* Right: Purchase List */}
        <div style={{ width: 350, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}><i className="fas fa-list-check" style={{marginRight: 4}}></i> {t('productList')} ({purchaseItems.length})</h3>

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
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    <i className="fas fa-building" style={{marginRight: 4}}></i> {item.company} {item.cat ? `- <i className="fas fa-folder" style={{marginRight: 4}}></i> ${item.cat}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', gap: 8, marginTop: 4 }}>
                    <span>{t('products')} {item.stock} {item.unit}</span>
                    <span><i className="fas fa-money-bill" style={{marginRight: 4}}></i> {fmt(item.buyP)}</span>
                    <span><i className="fas fa-dollar-sign" style={{marginRight: 4}}></i> {fmt(item.sellP)}</span>
                  </div>
                  {item.barcode && <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 }}><i className="fas fa-hashtag" style={{marginRight: 4}}></i> {item.barcode}</div>}
                </div>
                <button onClick={() => removeItem(i)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 8 }}><i className="fas fa-trash"></i></button>
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
  settings: any;
}
function SuppliersScreen({ suppliers, setSuppliers, categories, setCategories, products, setProducts, purchases, settings }: SuppliersScreenProps) {
  const { t } = useLanguage();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'categories'>(() => 
    (localStorage.getItem('pos_suppliers_tab') as 'companies' | 'categories') || 'companies'
  );
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [viewCategory, setViewCategory] = useState<SupplierCategory | null>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<Supplier | null>(null);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pos_suppliers_tab', activeTab);
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
    company: '', cat: '', name: '', barcode: '', unit: 'pcs', buyP: '', sellP: '', stock: '0', minStock: '5'
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
      alert(t('enterSupplierName'));
      return;
    }
    
    const nameLower = supplierForm.name.trim().toLowerCase();
    
    // Check duplicate
    const exists = suppliers.some(s => 
      s.id !== editingSupplier?.id && (s.name || '').toLowerCase().trim() === nameLower
    );
    if (exists) {
      alert(t('supplierNameExists'));
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
        api.updateSupplier(editingSupplier.id, updated).catch((e: any) => alert(t('errorOccurred') + ': ' + e.message));
        alert(t('supplierUpdated'));
      } else {
        const newSupplier: Supplier = {
          id: genSupplierId(suppliers),
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
        api.addSupplier(newSupplier).then((saved: any) => {
          if (saved && saved.id && saved.id !== newSupplier.id) {
            setSuppliers(prev => prev.map(s => s.id === newSupplier.id ? { ...s, ...saved } : s));
          }
        }).catch((e: any) => alert(t('errorOccurred') + ': ' + e.message));
        alert(t('supplierUpdated') + '\n' + t('supplierCode') + ': ' + codeToUse);
      }
      
      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' });
    } catch (error) {
      alert(t('errorOccurred'));
    }
  };
  
  // Delete Supplier
  const deleteSupplier = async (supplier: Supplier) => {
    const hasProducts = products.some(p => (p.company || '').toLowerCase() === (supplier.name || '').toLowerCase());
    if (hasProducts) {
      alert(t('companyHasProducts'));
      return;
    }
    
    if (!confirm(t('confirmDeleteCompany'))) return;
    
    try {
      setSuppliers(prev => prev.filter(s => s.id !== supplier.id));
      setViewSupplier(null);
      if (!supplier.isAuto && !String(supplier.id || '').startsWith('auto-')) {
        api.deleteSupplier(supplier.id).catch((e: any) => alert(t('deleteFailed') + ': ' + e.message));
      }
    } catch (error) {
      alert(t('deleteFailed'));
    }
  };
  
  // Save Category
  const saveCategory = async () => {
    if (!categoryForm.name?.trim()) {
      alert(t('enterCategoryNameAlert'));
      return;
    }
    
    try {
      if (editingCategory) {
        const updated: SupplierCategory = { ...editingCategory, name: categoryForm.name.trim() };
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
        api.updateCategory(editingCategory.id, updated).catch(() => {});
        alert(t('categoryUpdated'));
      } else {
        const newCategory: SupplierCategory = {
          id: genId(),
          name: categoryForm.name.trim()
        };
        setCategories(prev => [...prev, newCategory]);
        api.addCategory(newCategory).catch(() => {});
        alert(t('categoryAdded'));
      }
      
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '' });
    } catch (error) {
      alert(t('errorOccurred'));
    }
  };
  
  // Delete Category
  const deleteCategory = async (cat: SupplierCategory) => {
    const hasProducts = products.some(p => (p.cat || '').toLowerCase() === (cat.name || '').toLowerCase());
    if (hasProducts) {
      alert(t('categoryHasProducts'));
      return;
    }
    
    if (!confirm(t('confirmDeleteCategory'))) return;
    
    try {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setViewCategory(null);
      api.deleteCategory(cat.id).catch(() => {});
    } catch (error) {
    }
  };
  
  // Save Product
  const saveProduct = async () => {
    if (!productForm.name?.trim() || !productForm.company?.trim() || !productForm.cat?.trim()) {
      alert(t('fillRequiredFields'));
      return;
    }
    
    try {
      // Check if category exists, create if not
      let catId = categories.find(c => (c.name || '').toLowerCase() === (productForm.cat || '').toLowerCase())?.id;
      if (!catId) {
        catId = genId();
        const createdCat = { id: catId!, name: productForm.cat.trim() };
        setCategories(prev => [...prev, createdCat]);
        api.addCategory(createdCat).catch(() => {});
      }
      
      const newProduct = {
        id: genId(),
        name: productForm.name.trim(),
        code: `P-${Date.now().toString().slice(-6)}`,
        company: productForm.company.trim(),
        cat: productForm.cat.trim(),
        catId: catId!,
        barcode: productForm.barcode || '',
        unit: productForm.unit || 'pcs',
        buyPrice: parseFloat(productForm.buyP) || 0,
        sellPrice: parseFloat(productForm.sellP) || 0,
        stock: parseInt(productForm.stock) || 0,
        minStock: parseInt(productForm.minStock) || 5,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      setProducts(prev => [...prev, newProduct]);
      api.addProduct({
        id: newProduct.id,
        name: newProduct.name,
        code: newProduct.code,
        company: newProduct.company,
        cat: newProduct.cat,
        barcode: newProduct.barcode,
        unit: newProduct.unit,
        costPrice: newProduct.buyPrice,
        sellPrice: newProduct.sellPrice,
        stock: newProduct.stock,
        minStock: newProduct.minStock
      }).then((saved: any) => {
        if (saved && saved.id && saved.id !== newProduct.id) {
          setProducts(prev => prev.map(p => p.id === newProduct.id ? { ...p, ...saved } : p));
        }
      }).catch((e: any) => alert(t('errorOccurred') + ': ' + e.message));
      
      // Also add as supplier if not exists
      const supplierExists = suppliers.some(s => (s.name || '').toLowerCase() === (productForm.company || '').toLowerCase());
      if (!supplierExists) {
        const newSupplier: Supplier = {
          id: genSupplierId(suppliers),
          code: `C-${Date.now().toString().slice(-5)}`,
          name: productForm.company.trim(),
          phone: '', email: '', address: '', crNumber: '', vatNumber: '', company: productForm.company.trim()
        };
        setSuppliers(prev => [...prev, newSupplier]);
        api.addSupplier(newSupplier).catch(() => {});
      }
      
      alert(t('productAdded'));
      setShowProductModal(false);
      setProductForm({ company: '', cat: '', name: '', barcode: '', unit: 'pcs', buyP: '', sellP: '', stock: '0', minStock: '5' });
    } catch (error) {
      alert(t('errorOccurred'));
    }
  };

  const exportSuppliersCsv = () => {
    const headers = [t('supplierCode') || 'ID', t('companyName') || t('suppliers'), t('phone'), t('email'), t('address'), t('products'), t('totalPurchases') || 'Purchases'];
    const lines = [headers.join(',')];
    filteredSuppliers.forEach((sup: any) => {
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const pc = getSupplierPurchases(sup.name || '');
      const spend = pc.reduce((sum: number, p: any) => sum + (+p.total || 0), 0);
      lines.push([esc(sup.id || ''), esc(sup.name || ''), esc(sup.phone || ''), esc(sup.email || ''), esc(sup.address || ''), esc(getProductsCount(sup.name || '')), esc(pc.length), esc(spend)].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `suppliers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const printSuppliers = () => {
    const trs = filteredSuppliers.map((sup: any, i: number) => {
      const pc = getSupplierPurchases(sup.name || '');
      return `<tr><td>${i + 1}</td><td>${sup.id || '-'}</td><td>${sup.name || '-'}</td><td>${sup.phone || '-'}</td><td>${getProductsCount(sup.name || '')}</td><td>${pc.length}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page{size:A4 landscape;margin:10mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:10pt;color:#111}
.header{display:flex;justify-content:space-between;border-bottom:1.2mm solid #0F766E;padding-bottom:2mm;margin-bottom:3mm}
.header h1{color:#0F766E;font-size:14pt}
.meta{text-align:right;font-size:9pt;color:#555}
.stats{display:flex;gap:4mm;margin-bottom:3mm}
.stat{background:#F0FDFA;border:0.4mm solid #99f6e4;border-radius:2mm;padding:2mm 4mm;text-align:center}
.stat .lbl{font-size:7pt;color:#0F766E;text-transform:uppercase}
.stat .val{font-size:12pt;font-weight:800;color:#0F766E}
table{width:100%;border-collapse:collapse}
th{background:#0F766E;color:#fff;padding:2mm;text-align:left;font-size:8pt}
td{border:0.3mm solid #cbd5e1;padding:1.5mm 2mm;font-size:9pt}
tr:nth-child(even){background:#F8FAFC}
.footer{margin-top:4mm;font-size:8pt;color:#64748b}
</style></head><body>
<div class="header"><h1>Suppliers</h1><div class="meta">${new Date().toLocaleString()}</div></div>
<div class="stats">
  <div class="stat"><div class="lbl">${t('totalSuppliers')}</div><div class="val">${filteredSuppliers.length}</div></div>
  <div class="stat"><div class="lbl">${t('withProducts')}</div><div class="val">${filteredSuppliers.filter((x: any) => getProductsCount(x.name || '') > 0).length}</div></div>
  <div class="stat"><div class="lbl">${t('products')}</div><div class="val">${products.length}</div></div>
</div>
<table><thead><tr><th>#</th><th>ID</th><th>${t('companyName') || t('suppliers')}</th><th>${t('phone')}</th><th>${t('products')}</th><th>${t('purchaseHistory')}</th></tr></thead><tbody>${trs || '<tr><td colspan="6" style="text-align:center;padding:8mm">No suppliers</td></tr>'}</tbody></table>
<div class="footer">Generated by POS · ${filteredSuppliers.length} suppliers</div>
</body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
      {/* Top bar */}
      <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}><i className="fas fa-building" style={{ marginRight: 6, color: T.teal }}></i>{t('suppliers')}</span>
        <div style={{ position: 'relative', width: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchSupplierCategory')} style={{ width: '100%', padding: '6px 10px 6px 32px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: T.gray100, borderRadius: 10, padding: 3 }}>
          <button onClick={() => setActiveTab('companies')} style={{ padding: '6px 14px', background: activeTab === 'companies' ? T.teal : 'transparent', color: activeTab === 'companies' ? T.white : T.gray600, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <i className="fas fa-building" style={{ marginRight: 4 }}></i>{t('suppliers')} ({allSuppliers.length})
          </button>
          <button onClick={() => setActiveTab('categories')} style={{ padding: '6px 14px', background: activeTab === 'categories' ? T.teal : 'transparent', color: activeTab === 'categories' ? T.white : T.gray600, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            <i className="fas fa-folder" style={{ marginRight: 4 }}></i>{t('categories')} ({categories.length})
          </button>
        </div>
        <span style={{ fontSize: 14, color: T.gray400, marginLeft: 'auto' }}>{activeTab === 'companies' ? filteredSuppliers.length : filteredCategories.length}</span>
        <button onClick={() => { setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' }); setEditingSupplier(null); setShowSupplierModal(true); }} style={{ padding: '7px 12px', background: T.teal, color: T.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <i className="fas fa-plus" style={{ marginRight: 4 }}></i>{t('newCompany')}
        </button>
        <button onClick={() => { setCategoryForm({ name: '' }); setEditingCategory(null); setShowCategoryModal(true); }} style={{ padding: '7px 12px', background: T.white, color: T.gray600, border: `1px solid ${T.gray200}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <i className="fas fa-folder" style={{ marginRight: 4 }}></i>{t('categories')}
        </button>
        <button onClick={() => setShowProductModal(true)} style={{ padding: '7px 12px', background: T.orange, color: T.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <i className="fas fa-box" style={{ marginRight: 4 }}></i>{t('products')}
        </button>
        <button onClick={exportSuppliersCsv} style={{ padding: '7px 12px', background: T.white, color: T.gray600, border: `1px solid ${T.gray200}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <i className="fas fa-file-csv" style={{ marginRight: 4 }}></i>{t('exportCsv')}
        </button>
        <button onClick={printSuppliers} style={{ padding: '7px 12px', background: T.white, color: T.gray600, border: `1px solid ${T.gray200}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
          <i className="fas fa-print" style={{ marginRight: 4 }}></i>{t('print')}
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Gradient header */}
        <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark} 100%)`, padding: '28px 24px 24px', color: T.white }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
              <i className="fas fa-building"></i>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('suppliers')}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>
                {allSuppliers.length} {t('totalSuppliers')} · {categories.length} {t('totalCategories')} · {products.length} {t('products')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  <i className="fas fa-boxes-stacked" style={{ marginRight: 6 }}></i>{allSuppliers.filter(x => getProductsCount(x.name || '') > 0).length} {t('withProducts')}
                </span>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  <i className="fas fa-cart-flatbed" style={{ marginRight: 6 }}></i>{purchases.length} {t('totalPurchases') || 'Purchases'}
                </span>
                {search ? (
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-magnifying-glass" style={{ marginRight: 6 }}></i>{search}
                  </span>
                ) : null}
              </div>
            </div>
            <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: T.white, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} onClick={exportSuppliersCsv}>
              <i className="fas fa-file-csv" style={{ marginRight: 6 }}></i>{t('exportCsv')}
            </button>
          </div>
        </div>

        {activeTab === 'companies' && (() => {
          const stats = [
            { icon: 'fas fa-building', label: t('totalSuppliers'), value: String(allSuppliers.length), color: T.teal, bg: T.tealLight },
            { icon: 'fas fa-boxes-stacked', label: t('withProducts'), value: String(allSuppliers.filter(x => getProductsCount(x.name || '') > 0).length), color: '#7C3AED', bg: '#EDE9FE' },
            { icon: 'fas fa-box', label: t('products'), value: String(products.length), color: T.green, bg: T.greenLight },
            { icon: 'fas fa-folder', label: t('totalCategories'), value: String(categories.length), color: T.orange, bg: T.orangeLight },
            { icon: 'fas fa-cart-flatbed', label: t('totalPurchases') || 'Purchases', value: String(purchases.length), color: '#0369A1', bg: '#E0F2FE' },
            { icon: 'fas fa-receipt', label: t('totalSpend') || t('total'), value: (purchases.reduce((sum: number, p: any) => sum + (+p.total || 0), 0)).toLocaleString('en-IN'), color: T.amber, bg: T.amberLight },
          ];
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
                {stats.map((st, i) => (
                  <div key={i} style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: st.bg, color: st.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className={st.icon}></i>
                      </div>
                      <div style={{ fontSize: 12, color: T.gray400, fontWeight: 600 }}>{st.label}</div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: st.color }}>{st.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px' }}>
                <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                  <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.gray600 }}>
                      <i className="fas fa-list" style={{ marginRight: 6, color: T.teal }}></i>{t('suppliers')} · {filteredSuppliers.length}
                    </div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.tealLight }}>
                        {['#', 'ID', t('companyName') || t('suppliers'), t('supplierCode'), t('phone'), t('products'), t('purchaseHistory'), ''].map((h, hi) => (
                          <th key={hi} style={{ padding: '10px 14px', textAlign: hi === 0 || hi === 5 || hi === 6 ? 'center' : 'left', fontSize: 13, fontWeight: 700, color: T.teal }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSuppliers.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: 48, textAlign: 'center', color: T.gray400 }}>
                            <i className="fas fa-building" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: T.gray300 }}></i>
                            {t('noSuppliers') || t('noProductsAdded')}
                          </td>
                        </tr>
                      ) : filteredSuppliers.map((sup, i) => (
                        <tr key={sup.id || i} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}`, cursor: 'pointer' }} onClick={() => setViewSupplier(sup)}>
                          <td style={{ padding: '10px 14px', textAlign: 'center', color: T.gray400, fontWeight: 600 }}>{i + 1}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: T.teal, fontWeight: 700 }}>{sup.id || '-'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>{sup.name}{sup.isAuto ? <span style={{ fontSize: 10, background: T.amberLight, color: T.amber, padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>Auto</span> : null}</div>
                            {sup.address ? <div style={{ fontSize: 12, color: T.gray400, marginTop: 2 }}><i className="fas fa-location-dot" style={{ marginRight: 4 }}></i>{sup.address}</div> : null}
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, color: T.gray500 }}>{sup.code || '-'}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray600 }}>{sup.phone || '-'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ background: T.tealLight, color: T.teal, fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: 13 }}>{getProductsCount(sup.name || '')}</span>
                          </td>
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <span style={{ background: '#E0F2FE', color: '#0369A1', fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: 13 }}>{getSupplierPurchases(sup.name || '').length}</span>
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            <button title={t('purchaseHistory')} onClick={() => setShowPurchaseHistory(sup)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: T.orangeLight, color: T.orange, cursor: 'pointer', marginRight: 4 }}><i className="fas fa-clock-rotate-left"></i></button>
                            {!sup.isAuto && !String(sup.id || '').startsWith('auto-') ? (
                              <>
                                <button title={t('edit')} onClick={() => { setSupplierForm(sup); setEditingSupplier(sup); setShowSupplierModal(true); }} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: T.gray100, color: T.gray600, cursor: 'pointer', marginRight: 4 }}><i className="fas fa-pen"></i></button>
                                <button title={t('deleteAction')} onClick={() => deleteSupplier(sup)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: T.redLight, color: T.red, cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                              </>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          );
        })()}

        {activeTab === 'categories' && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px 24px' }}>
            <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gray600 }}>
                  <i className="fas fa-folder" style={{ marginRight: 6, color: T.teal }}></i>{t('categories')} · {filteredCategories.length}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.tealLight }}>
                    {['#', t('categoryName'), t('products'), ''].map((h, hi) => (
                      <th key={hi} style={{ padding: '10px 14px', textAlign: hi === 0 || hi === 2 ? 'center' : 'left', fontSize: 13, fontWeight: 700, color: T.teal }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 48, textAlign: 'center', color: T.gray400 }}>
                        <i className="fas fa-folder" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: T.gray300 }}></i>
                        {t('noProductsAdded')}
                      </td>
                    </tr>
                  ) : filteredCategories.map((c, i) => {
                    const cnt = products.filter(p => (p.cat || '').toLowerCase() === (c.name || '').toLowerCase()).length;
                    return (
                      <tr key={c.id || i} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}`, cursor: 'pointer' }} onClick={() => setViewCategory(c)}>
                        <td style={{ padding: '10px 14px', textAlign: 'center', color: T.gray400, fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 14 }}><i className="fas fa-folder" style={{ marginRight: 6, color: T.orange }}></i>{c.name}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={{ background: T.tealLight, color: T.teal, fontWeight: 700, padding: '3px 10px', borderRadius: 12, fontSize: 13 }}>{cnt}</span>
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                          <button title={t('edit')} onClick={() => { setCategoryForm(c); setEditingCategory(c); setShowCategoryModal(true); }} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: T.gray100, color: T.gray600, cursor: 'pointer', marginRight: 4 }}><i className="fas fa-pen"></i></button>
                          <button title={t('deleteAction')} onClick={() => deleteCategory(c)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, background: T.redLight, color: T.red, cursor: 'pointer' }}><i className="fas fa-trash"></i></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Supplier Detail Modal */}
      {viewSupplier && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}><i className="fas fa-building" style={{marginRight: 4}}></i> {viewSupplier.name}</h3>
              <button onClick={() => setViewSupplier(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            {viewSupplier.code && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}>{t('supplierCode')}: <strong>{viewSupplier.code}</strong></div>}
            {viewSupplier.phone && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}><i className="fas fa-phone" style={{marginRight: 4}}></i> {viewSupplier.phone}</div>}
            {viewSupplier.email && <div style={{ marginBottom: 8, fontSize: 14, color: '#6B7280' }}><i className="fas fa-envelope" style={{marginRight: 4}}></i> {viewSupplier.email}</div>}
            {viewSupplier.address && <div style={{ marginBottom: 16, fontSize: 14, color: '#6B7280' }}><i className="fas fa-location-dot" style={{marginRight: 4}}></i> {viewSupplier.address}</div>}
            
            <div style={{ background: '#F0FDFA', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#115E59' }}>{getProductsCount(viewSupplier.name)}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalProducts')}</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => { setShowPurchaseHistory(viewSupplier); setViewSupplier(null); }}
                style={{ flex: 1, padding: '10px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-clock-rotate-left" style={{marginRight: 4}}></i> {t('purchaseHistory')}
              </button>
              {!viewSupplier.isAuto && (
                <>
                  <button
                    onClick={() => { setSupplierForm(viewSupplier); setEditingSupplier(viewSupplier); setShowSupplierModal(true); setViewSupplier(null); }}
                    style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                    <i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit')}
                  </button>
                  <button
                    onClick={() => deleteSupplier(viewSupplier)}
                    style={{ flex: 1, padding: '10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                    <i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteAction')}
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {viewCategory.name}</h3>
              <button onClick={() => setViewCategory(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            <div style={{ background: '#F0FDFA', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#115E59' }}>{products.filter(p => (p.cat || '').toLowerCase() === (viewCategory.name || '').toLowerCase()).length}</div>
              <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalProducts')}</div>
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => { setCategoryForm(viewCategory); setEditingCategory(viewCategory); setShowCategoryModal(true); setViewCategory(null); }}
                style={{ flex: 1, padding: '10px', background: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit')}
              </button>
              <button
                onClick={() => deleteCategory(viewCategory)}
                style={{ flex: 1, padding: '10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteAction')}
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
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}><i className="fas fa-clock-rotate-left" style={{marginRight: 4}}></i> {showPurchaseHistory.name} - {t('purchaseHistory')}</h3>
              <button onClick={() => setShowPurchaseHistory(null)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
            </div>
            
            {getSupplierPurchases(showPurchaseHistory.name).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>{t('noPurchasesFound')}</div>
            ) : (
              <div>
                {getSupplierPurchases(showPurchaseHistory.name).map((p, i) => (
                  <div key={i} style={{ padding: 12, borderBottom: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600 }}>{new Date(p.date).toLocaleDateString()}</span>
                      <span style={{ fontWeight: 700, color: '#115E59' }}>{settings.currencySymbol} {p.total?.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{t('item')}: {p.items?.length || 0}</div>
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
              {editingSupplier ? <><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('editSupplier')}</> : <><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('newCompany')}</>}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('companyName')} *</label>
                <input
                  value={supplierForm.name}
                  onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t("companyName")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('phone')}</label>
                <input
                  value={supplierForm.phone}
                  onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder={t("phone")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('email')}</label>
                <input
                  value={supplierForm.email}
                  onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))}
                  placeholder={t("email")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('address')}</label>
                <input
                  value={supplierForm.address}
                  onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))}
                  placeholder={t("address")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button onClick={() => setShowSupplierModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                {t('cancel')}
              </button>
              <button onClick={saveSupplier} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                <i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}
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
              {editingCategory ? <><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('editCategory')}</> : <><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('newCategory')}</>}
            </h3>
            
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('categoryName')} *</label>
              <input
                value={categoryForm.name}
                onChange={e => setCategoryForm({ name: e.target.value })}
                placeholder={t("categoryName")}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                {t('cancel')}
              </button>
              <button onClick={saveCategory} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                <i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '90%', maxWidth: 450, maxHeight: '90vh', overflow: 'auto', padding: 20 }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 18, fontWeight: 700 }}>{t('products')} {t('newProductForm')}</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Company Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-building" style={{marginRight: 4}}></i> {t('suppliers')} *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.company}
                    onChange={e => { setProductForm(p => ({ ...p, company: e.target.value, cat: '' })); setShowCompanyDrop(true); }}
                    placeholder={t("selectSupplier")}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCompanyDrop && filteredCompanies.length > 0 && (
                    <div data-menu="company-drop" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCompanies.map(s => (
                        <div key={s.id} onClick={() => { setProductForm(p => ({ ...p, company: s.name })); setShowCompanyDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseOver={e => (e.currentTarget.style.background = '#F0FDFA')} onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
                          <i className="fas fa-building" style={{marginRight: 4}}></i> {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {t('categories')} *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.cat}
                    onChange={e => { setProductForm(p => ({ ...p, cat: e.target.value })); setShowCatDrop(true); }}
                    placeholder={t("selectCategory")}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCatDrop && filteredCats.length > 0 && (
                    <div data-menu="cat-drop" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCats.map(c => (
                        <div key={c.id} onClick={() => { setProductForm(p => ({ ...p, cat: c.name })); setShowCatDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }} onMouseOver={e => (e.currentTarget.style.background = '#F0FDFA')} onMouseOut={e => (e.currentTarget.style.background = '#fff')}>
                          <i className="fas fa-folder" style={{marginRight: 4}}></i> {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('productName')} *</label>
                <input
                  value={productForm.name}
                  onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t("productName")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-barcode" style={{marginRight: 4}}></i> {t('barcode')}</label>
                <input
                  value={productForm.barcode}
                  onChange={e => setProductForm(p => ({ ...p, barcode: e.target.value }))}
                  placeholder={t("barcodeOptional")}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-money-bill" style={{marginRight: 4}}></i> {t('buyPrice')}</label>
                  <input
                    type="number"
                    value={productForm.buyP}
                    onChange={e => setProductForm(p => ({ ...p, buyP: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-dollar-sign" style={{marginRight: 4}}></i> {t('sellPrice')}</label>
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
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}>{t('stock')}</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-ruler" style={{marginRight: 4}}></i> {t('unit')}</label>
                  <input
                    value={productForm.unit}
                    onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    placeholder={t("unitPcs")}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#4B5563' }}><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('minStock')}</label>
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
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '12px', background: '#F3F4F6', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: '#4B5563' }}>
                {t('cancel')}
              </button>
              <button onClick={saveProduct} style={{ flex: 1, padding: '12px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                <i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}
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
  settings: any;
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
  const [vatNumber, setVatNumber] = useState('');
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
        setVatNumber(customer.vatNumber || '');
        setAvatar(customer.avatar || null);
      } else {
        setCustomerId('');
        setName('');
        setPhone('');
        setAddress('');
        setVatNumber('');
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
      alert(t('cameraAccessDenied'));
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
      vatNumber: vatNumber || undefined,
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
                <span style={{ fontSize: '24px' }}><i className="fas fa-user"></i></span>
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
                  >
                    <i className="fas fa-camera" style={{marginRight: 4}}></i> {t('capture')}
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
                  >
                    <i className="fas fa-xmark"></i>
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
                  >
                    <i className="fas fa-camera" style={{marginRight: 4}}></i> {t('camera')}
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
                  >
                    <i className="fas fa-folder-open" style={{marginRight: 4}}></i> {t('browse')}
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
                    >
                      <i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('remove')}
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
                placeholder={isEditMode ? '' : t('autoGeneratedIfEmpty')}
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
                <div style={{ marginTop: 12 }}>
                  <label style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                  }}>
                    VAT Number (B2B)
                  </label>
                  <input
                    type="text"
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    placeholder="310XXXXXXXXXX"
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
        </div>

        {/* Footer - Compact */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderTop: `1px solid ${T.gray200}`,
          justifyContent: 'center',
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
          >
            <i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CustomerManagement({ customers, setCustomers, sales, onDeleteCustomer, settings }: CustomerManagementProps) {
  const { t, isRTL } = useLanguage();
  const [view, setView] = useState<ViewType>(() => (localStorage.getItem('pos_customer_view') as ViewType) || 'dashboard');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>(() => (localStorage.getItem('pos_customer_tab') as TabType) || 'all');
  
  // Save view to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pos_customer_view', view);
  }, [view]);

  // Save activeTab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('pos_customer_tab', activeTab);
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
  const modalFmt = (n: number) => `${settings?.currencySymbol || '৳'} ${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper to create transaction
  const createTransaction = (type: 'due' | 'deposit', amount: number, note?: string, paymentMethod?: string): Transaction => ({
    id: genId(),
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
      
      // Save to MySQL API
      api.updateCustomer(selectedCustomer.id, { ...selectedCustomer, balance: newBalance, deposit: newDeposit }).catch(() => {});
      
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
            <span style={{ fontSize: '20px' }}><i className="fas fa-money-bill"></i></span>
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
                    {method === 'cash' ? <i className="fas fa-dollar-sign"></i> : method === 'card' ? <i className="fas fa-credit-card"></i> : method === 'bank' ? <i className="fas fa-university"></i> : <i className="fas fa-mobile-screen"></i>}
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
            justifyContent: 'center',
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
            >
              <i className="fas fa-check" style={{marginRight: 4}}></i> {t('addDeposit')}
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
      
      // Save to MySQL API
      api.updateCustomer(selectedCustomer.id, { ...selectedCustomer, balance: newBalance }).catch(() => {});
      
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
            <span style={{ fontSize: '20px' }}><i className="fas fa-clipboard-list"></i></span>
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
            justifyContent: 'center',
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
            >
              <i className="fas fa-check" style={{marginRight: 4}}></i> {t('addDue')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle add customer
  const handleAddCustomer = (customer: Customer) => {
    api.addCustomer(customer).catch(() => {});
    setCustomers(prev => [...prev, customer]);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    api.updateCustomer(customer.id, customer).catch(() => {});
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
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
      api.deleteCustomer(customer.id).catch(() => {});
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
    if (isGeneralCustomer(customer)) {
      return sales.filter(s => !s.customerId || s.customerId === '' || s.customerId === GENERAL_CUSTOMER_ID || s.customerId === customer.id);
    }
    return sales.filter(s => s.customerId === customer.id);
  };

  // Calculate customer total
  const getCustomerTotal = (customer: Customer) => {
    const customerSales = getCustomerSales(customer);
    return customerSales.reduce((sum, s) => sum + (parseFloat(s.total as any) || 0), 0);
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
  const fmt = (n: number) => `${settings?.currencySymbol || '৳'} ${(+n || 0).toLocaleString('en-IN')}`;

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
            }}><i className="fas fa-magnifying-glass"></i></span>
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
            <span><i className="fas fa-file-export"></i></span> {t('csvExport')}
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
                }}>
                  <i className="fas fa-user"></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: T.tealDark, fontSize: '15px' }}>{t('generalCustomer')}</div>
                  <div style={{ fontSize: '12px', color: T.gray600 }}>{t('generalCustomerDefault')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: T.tealDark }}>{fmt(getCustomerTotal(generalCustomer))}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleViewHistory(generalCustomer)} style={{
                  flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none',
                  borderRadius: '10px', fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <span><i className="fas fa-clipboard-list"></i></span> {t('viewHistory')}
                </button>
                <div style={{ padding: '12px 16px', background: T.gray100, color: T.gray400, borderRadius: '10px', fontSize: '14px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  <i className="fas fa-trash"></i>
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
              const rawDue = (parseFloat(customer.balance as any) || 0) > 0 ? parseFloat(customer.balance as any) || 0 : 0;
              const rawDeposit = parseFloat(customer.deposit as any) || 0;
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
                    <div style={{ textAlign: 'right', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: T.gray400, textTransform: 'uppercase' }}>{t('total')}</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: T.teal }}>{fmt(getCustomerTotal(customer))}</div>
                      </div>
                      {netDue > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: '#D32F2F', textTransform: 'uppercase' }}>{t('due')}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#D32F2F' }}>{fmt(netDue)}</div>
                        </div>
                      )}
                      {netDeposit > 0 && (
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 600, color: T.tealDark, textTransform: 'uppercase' }}>{t('deposit')}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: T.tealDark }}>{fmt(netDeposit)}</div>
                        </div>
                      )}
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
                        <><span><i className="fas fa-triangle-exclamation"></i></span> {t('due')}: {fmt(netDue)}</>
                      ) : hasDeposit ? (
                        <><span><i className="fas fa-money-bill"></i></span> {t('deposit')}: {fmt(netDeposit)}</>
                      ) : isGeneralCustomer(customer) ? (
                        <><span><i className="fas fa-clipboard-list"></i></span> {t('viewHistory')}</>
                      ) : (
                        <><span><i className="fas fa-clipboard-list"></i></span> {t('history')}</>
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
                    >
                      <i className="fas fa-trash"></i>
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
          }}>
            <i className="fas fa-user"></i>
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
            <span><i className="fas fa-box"></i></span> {t('allPurchases')} ({generalSales.length})
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
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><i className="fas fa-cart-shopping"></i></div>
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
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || t('sale')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || t('pos')}</td>
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
    const rawDue = (parseFloat(selectedCustomer.balance as any) || 0) > 0 ? parseFloat(selectedCustomer.balance as any) || 0 : 0;
    const rawDeposit = parseFloat(selectedCustomer.deposit as any) || 0;
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
          >
            <i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit')}
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
              <i className="fas fa-clipboard-list" style={{marginRight: 4}}></i> {t('addDue')}
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
            >
              <i className="fas fa-money-bill" style={{marginRight: 4}}></i> {t('addDeposit')}
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
            <span><i className="fas fa-box"></i></span> {t('allPurchases')} ({customerSales.length})
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
            <span><i className="fas fa-clipboard-list"></i></span> {t('dueHistory')} ({(selectedCustomer.transactions || []).filter(t => t.type === 'due').length})
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
            <span><i className="fas fa-bag-shopping"></i></span> {t('depositHistory')} ({(selectedCustomer.transactions || []).filter(t => t.type === 'deposit').length})
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
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><i className="fas fa-cart-shopping"></i></div>
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
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.paymentMethod || t('sale')}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: T.gray800 }}>{sale.user || t('pos')}</td>
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
                <div style={{ fontSize: '48px', marginBottom: '12px' }}><i className="fas fa-clipboard-list"></i></div>
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
                <div style={{ fontSize: '48px', marginBottom: '12px' }}><i className="fas fa-bag-shopping"></i></div>
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
export function SettingsScreen({ products, customers, sales, suppliers, categories, purchases, setProducts, setCustomers, setSales, setSuppliers, setCategories, setPurchases, users, setUsers, syncAllData, dataSyncStatus, dataLastSyncTime }: { 
  products: any[]; customers: any[]; sales: any[]; suppliers: any[]; categories: any[]; purchases: any[];
  setProducts: any; setCustomers: any; setSales: any; setSuppliers: any; setCategories: any; setPurchases: any;
  users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  syncAllData: () => Promise<void>;
  dataSyncStatus: 'synced' | 'pending' | 'offline';
  dataLastSyncTime: string | null;
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
    zatcaEnvironment: 'developer-portal',
    
    
    zatcaPhase: 'normal',
    zatcaOtp: '',
    zatcaCsr: false,
    
    
    
    vatEnabled: true,
    vatPercent: 15,
    bannerImage: '',
    receiptHeader: t('salesReceipt'),
    receiptFooter: t('thankYou'),
    receiptShowLogo: true,
    receiptShowAddress: true,
    receiptShowPhone: true,
    receiptShowCustomer: true,
    receiptShowVat: true,
    receiptShowQr: true,
    receiptFontSize: 11,
    receiptLogo: '',
    purchaseHeader: t('purchaseInvoice'),
    purchaseFooter: t('thankYou'),
    purchaseShowLogo: true,
    purchaseShowAddress: true,
    purchaseShowSupplier: true,
    purchaseShowPhone: true,
    purchaseShowVat: true,
    purchaseShowStoreVat: true,
    purchaseFontSize: 11,
    purchaseIcon: '',
    dueSalesEnabled: true,
    currencySymbol: '৳',
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Load settings from PouchDB on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // Try MySQL API first
    try {
      const apiSettings = await api.getSettings();
      if (apiSettings && typeof apiSettings === 'object' && Object.keys(apiSettings).length > 0) {
        const loaded: Record<string, any> = {};
        for (const key of Object.keys(form)) {
          if (apiSettings[key] !== undefined && apiSettings[key] !== null) {
            const v = apiSettings[key];
            if (v === 'true' || v === true || v === 1 || v === '1') loaded[key] = true;
            else if (v === 'false' || v === false || v === 0 || v === '0') loaded[key] = false;
            else if (!isNaN(Number(v)) && v !== '') loaded[key] = Number(v);
            else loaded[key] = v;
          }
        }
        if (Object.keys(loaded).length > 0) {
          setForm(prev => ({ ...prev, ...loaded }));
          return;
        }
      }
    } catch {}

    // Fallback to localDb
    const keys = Object.keys(form);
    const loaded: Record<string, any> = {};
    for (const key of keys) {
      const value = await localDb.getSetting(key);
      if (value !== null) {
        if (value === 'true' || value === '1') loaded[key] = true;
        else if (value === 'false' || value === '0') loaded[key] = false;
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
      // Also save to MySQL API
      await api.updateSettings(form).catch(() => {});
      // Save ZATCA config to backend if Phase 2
      if (form.zatcaPhase === 'phase2') {
        await zatcaApi.saveIdentity({
          vat_number: form.taxId || '',
          org_name: form.name || '',
          org_unit_name: form.address || '',
          common_name: form.name || '',
          country: 'SA',
          invoice_type: '0200000',
          egs_serial: 'POS-001',
          industry: 'Retail',
          environment: form.zatcaEnvironment || 'developer-portal',
        }).catch(console.error);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      // Hard reload to pick up changed settings (VAT on/off etc.)
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) { await caches.delete(name); }
      }
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      alert(t('settingsSaveFailed'));
    }
  };

  const clearAll = async () => {
    if (!window.confirm(t('resetWarning'))) {
      return;
    }

    // Try API deletes (ignore failures)
    const apiCalls = [
      api.deleteAllProducts().catch(() => {}),
      api.deleteAllCategories().catch(() => {}),
      api.deleteAllSuppliers().catch(() => {}),
      api.deleteAllSales().catch(() => {}),
      api.deleteAllCustomers().catch(() => {}),
      api.deleteAllPurchases().catch(() => {}),
    ];
    await Promise.all(apiCalls);

    // Clear service worker caches
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) { await caches.delete(name); }
      }
    } catch {}

    // Clear all IndexedDB stores
    try {
      const storeNames = ['products', 'categories', 'suppliers', 'customers', 'sales', 'purchases', 'transactions', 'stock_history', 'price_history', 'cart', 'heldSales', 'settings'];
      for (const sn of storeNames) {
        try {
          const all = await db.getAll(sn);
          for (const item of all as any[]) { await db.delete(sn, item.id).catch(() => {}); }
        } catch {}
      }
    } catch {}

    // Clear React state
    setProducts([]);
    setSales([]);
    setSuppliers([]);
    
    // Recreate General Customer
    const genCust: Customer = {
      id: generateGeneralCustomerId(),
      name: 'General Customer',
      phone: '', address: '', balance: 0, deposit: 0, isSystem: true,
    };
    setCustomers([genCust]);
    setCategories([]);
    setPurchases([]);

    alert(t('dataDeletedSuccessfully'));
    setTimeout(() => window.location.reload(), 300);
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
      if (storeName === 'products') await api.deleteAllProducts().catch(() => {});
      else if (storeName === 'categories') await api.deleteAllCategories().catch(() => {});
      else if (storeName === 'suppliers') await api.deleteAllSuppliers().catch(() => {});
      else if (storeName === 'sales') await api.deleteAllSales().catch(() => {});
      else if (storeName === 'purchases') await api.deleteAllPurchases().catch(() => {});
      try {
        const sn = storeName === 'products' ? 'products' : storeName === 'categories' ? 'categories' : storeName === 'suppliers' ? 'suppliers' : storeName === 'sales' ? 'sales' : storeName === 'purchases' ? 'purchases' : null;
        if (sn) { const all = await db.getAll(sn); for (const item of all as any[]) { await db.delete(sn, item.id).catch(() => {}); } }
      } catch {}
      setItems([]);
      alert(translate('dataDeletedSuccessfully'));
      window.location.reload();
    } catch (error) {
      alert(translate('error') + '!');
    }
  };

  // Helper function to delete all customers (reset General Customer data)
  const deleteAllCustomers = async (
    customers: any[], 
    _setCustomers: React.Dispatch<React.SetStateAction<any[]>>, 
    translate: any
  ) => {
    if (customers.length === 0) return;
    if (!confirm(translate('warningPermanentDelete'))) return;
    try {
      await api.deleteAllCustomers().catch(() => {});
      try { const all = await db.getAll('customers'); for (const item of all as any[]) { await db.delete('customers', item.id).catch(() => {}); } } catch {}
      alert(translate('dataDeletedSuccessfully'));
      window.location.reload();
    } catch (error) {
      alert(translate('error') + '!');
    }
  };

  const tabs = [
    { icon: <i className="fas fa-gear"></i>, label: t('settings') },
    { icon: <i className="fas fa-palette"></i>, label: t('design') },
    { icon: <i className="fas fa-user"></i>, label: t('user') },
    { icon: <i className="fas fa-trash-can"></i>, label: t('dataReset') },
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

        {/* Sync + Save - Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, 
            background: dataSyncStatus === 'synced' ? '#ECFDF5' : dataSyncStatus === 'offline' ? '#FEF2F2' : '#FFFBE6',
            color: dataSyncStatus === 'synced' ? '#059669' : dataSyncStatus === 'offline' ? '#DC2626' : '#D97706',
            border: dataSyncStatus === 'synced' ? '1px solid #A7F3D0' : dataSyncStatus === 'offline' ? '1px solid #FECACA' : '1px solid #FDE68A' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', 
              background: dataSyncStatus === 'synced' ? '#059669' : dataSyncStatus === 'offline' ? '#DC2626' : '#F59E0B' }}></span>
            <span>{dataSyncStatus === 'synced' ? t('synced') : dataSyncStatus === 'offline' ? t('offline') : t('syncing')}</span>
            {dataLastSyncTime && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>({dataLastSyncTime})</span>}
          </div>
          <button onClick={syncAllData} disabled={dataSyncStatus === 'pending'} style={{ padding: '6px 10px', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: dataSyncStatus === 'pending' ? 'not-allowed' : 'pointer', background: '#115E59', color: '#fff', opacity: dataSyncStatus === 'pending' ? 0.6 : 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={dataSyncStatus === 'pending' ? 'fas fa-spinner fa-spin' : 'fas fa-sync'}></i> Sync
          </button>
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
          {saved ? <><i className="fas fa-check" style={{marginRight: 4}}></i> {t('saved')}</> : <><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('saveSettings')}</>}
        </button>
        </div>
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
              }}><i className="fas fa-gear"></i></div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>{t('generalInfo')}</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>{t('businessBasicInfo')}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-store" style={{marginRight: 4}}></i> {t('businessName')} *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder={t('enterBusinessName')}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-phone" style={{marginRight: 4}}></i> {t('mobileNumber')}
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-location-dot" style={{marginRight: 4}}></i> {t('address')}
                </label>
                <input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder={t('enterBusinessAddress')}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-envelope" style={{marginRight: 4}}></i> {t('email')}
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
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-hashtag" style={{marginRight: 4}}></i> VAT {t('number')} (TIN)
                </label>
                <input
                  value={form.taxId}
                  onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder={t('vat15Digit')}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-building" style={{marginRight: 4}}></i> CR {t('number')}
                </label>
                <input
                  value={form.crNumber}
                  onChange={e => setForm(p => ({ ...p, crNumber: e.target.value }))}
                  style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                  placeholder={t('crNumberPlaceholder')}
                />
              </div>
            </div>
            {/* ZATCA Saudi Arabia Settings */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}><i className="fas fa-receipt" style={{marginRight: 4}}></i> ZATCA {t('settings')}</h5>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                background: form.zatkaEnabled ? '#ecfdf5' : '#fef2f2',
                borderRadius: 10,
                border: `2px solid ${form.zatkaEnabled ? '#059669' : '#ef4444'}`
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>
                    ZATCA E-Invoicing {form.zatkaEnabled ? <i className="fas fa-check"></i> : <i className="fas fa-xmark"></i>}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    {form.zatkaEnabled ? 'QR code will appear on receipts' : 'ZATCA compliance disabled'}
                  </p>
                </div>
                <button
                  onClick={() => setForm(p => ({ ...p, zatkaEnabled: !p.zatkaEnabled }))}
                  style={{
                    padding: '8px 16px',
                    background: form.zatkaEnabled ? '#059669' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {form.zatkaEnabled ? t('active') : t('inactive')}
                </button>
              </div>

              {form.zatkaEnabled && (
                <div style={{ marginTop: 12, padding: '16px 20px', background: '#f0fdf4', borderRadius: 10, border: '2px solid #86efac' }}>
                  {/* Phase Selection */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #86efac' }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>ZATCA Phase:</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setForm(p => ({ ...p, zatcaPhase: 'normal' }))} style={{ padding: '8px 16px', background: form.zatcaPhase === 'normal' ? '#6B7280' : '#e0e0e0', color: form.zatcaPhase === 'normal' ? '#fff' : '#000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Normal</button>
                      <button onClick={() => setForm(p => ({ ...p, zatcaPhase: 'phase1' }))} style={{ padding: '8px 16px', background: form.zatcaPhase === 'phase1' ? '#059669' : '#e0e0e0', color: form.zatcaPhase === 'phase1' ? '#fff' : '#000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Phase 1</button>
                      <button onClick={() => setForm(p => ({ ...p, zatcaPhase: 'phase2' }))} style={{ padding: '8px 16px', background: form.zatcaPhase === 'phase2' ? '#059669' : '#e0e0e0', color: form.zatcaPhase === 'phase2' ? '#fff' : '#000', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Phase 2</button>
                    </div>
                    <span style={{ fontSize: 12, color: '#166534' }}>{form.zatcaPhase === 'phase2' ? 'Full API integration with ZATCA' : form.zatcaPhase === 'phase1' ? 'QR code on receipts (manual compliance)' : 'No QR code - Normal invoice only'}</span>
                  </div>

                  {/* Phase 2 - ZATCA Credentials */}
                  {form.zatcaPhase === 'phase2' && (
                    <div>
                      <h6 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#166534' }}><i className="fas fa-key" style={{ marginRight: 4 }}></i> ZATCA E-Invoicing Credentials</h6>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#166534' }}><i className="fas fa-globe" style={{ marginRight: 4 }}></i> Environment</label>
                          <select value={form.zatcaEnvironment || 'developer-portal'} onChange={e => setForm(p => ({ ...p, zatcaEnvironment: e.target.value }))} style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '2px solid #86efac', borderRadius: 8 }}>
                            <option value="developer-portal">Developer Portal (Testing)</option>
                            <option value="simulation">Simulation</option>
                            <option value="production">Production</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#166534' }}><i className="fas fa-building" style={{ marginRight: 4 }}></i> Company Name (as registered in ZATCA)</label>
                          <input value={form.name || ''} readOnly style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '2px solid #d1d5db', borderRadius: 8, background: '#f9fafb' }} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={{ display: 'block', marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#166534' }}><i className="fas fa-id-card" style={{ marginRight: 4 }}></i> VAT Number</label>
                          <input value={form.taxId || ''} readOnly style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '2px solid #d1d5db', borderRadius: 8, background: '#f9fafb' }} />
                        </div>
                      </div>

                      <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #86efac' }}>
                        <h6 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#166534' }}><i className="fas fa-info-circle" style={{ marginRight: 4 }}></i> ZATCA Onboarding Steps</h6>
                        <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                          <p style={{ margin: '4px 0' }}><strong>Step 1:</strong> Generate CSR from this system</p>
                          <p style={{ margin: '4px 0' }}><strong>Step 2:</strong> Login to <a href="https://fatoora.zatca.gov.sa" target="_blank" style={{ color: '#059669' }}>Fatoora Portal</a> → Generate OTP</p>
                          <p style={{ margin: '4px 0' }}><strong>Step 3:</strong> Submit CSR + OTP → Get Compliance CSID</p>
                          <p style={{ margin: '4px 0' }}><strong>Step 4:</strong> Run compliance checks (6 test invoices)</p>
                          <p style={{ margin: '4px 0' }}><strong>Step 5:</strong> Get Production CSID → Ready!</p>
                        </div>
                      </div>

                      {/* CSR Section */}
                      <div style={{ marginTop: 16 }}>
                        <h6 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#166534' }}><i className="fas fa-certificate" style={{ marginRight: 4 }}></i> Certificate Signing Request (CSR)</h6>
                        {form.zatcaCsr ? (
                          <div style={{ padding: 10, background: '#ecfdf5', borderRadius: 8, fontSize: 12, color: '#166534' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: 4 }}></i> CSR generated. Ready to submit to ZATCA.
                          </div>
                        ) : (
                          <button onClick={async () => {
                            if (!window.confirm('Generate CSR? This creates a new secp256k1 key pair.')) return;
                            try {
                              const res = await zatcaApi.generateCsr();
                              if (res.ok) {
                                setForm(p => ({ ...p, zatcaCsr: true }));
                                alert('CSR generated! Copy it from the server and submit to ZATCA Fatoora Portal.');
                              } else {
                                alert('Error: ' + (res.error || 'Unknown'));
                              }
                            } catch (e: any) { alert('Error: ' + e.message); }
                          }} style={{ padding: '8px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            <i className="fas fa-key" style={{ marginRight: 4 }}></i> Generate CSR
                          </button>
                        )}
                      </div>

                      {/* OTP + Compliance CSID */}
                      <div style={{ marginTop: 16 }}>
                        <h6 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#166534' }}><i className="fas fa-shield-alt" style={{ marginRight: 4 }}></i> Compliance CSID</h6>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            placeholder="Enter OTP from Fatoora Portal"
                            value={form.zatcaOtp || ''}
                            onChange={e => setForm(p => ({ ...p, zatcaOtp: e.target.value }))}
                            style={{ flex: 1, padding: '10px 12px', fontSize: 13, border: '2px solid #86efac', borderRadius: 8 }}
                          />
                          <button onClick={async () => {
                            if (!form.zatcaOtp) { alert('Enter OTP first'); return; }
                            try {
                              const res = await zatcaApi.requestComplianceCsid(form.zatcaOtp);
                              if (res.data && res.data.requestID) {
                                alert('Compliance CSID obtained! Request ID: ' + res.data.requestID);
                              } else {
                                alert('Error: ' + JSON.stringify(res.data || res.error));
                              }
                            } catch (e: any) { alert('Error: ' + e.message); }
                          }} style={{ padding: '10px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <i className="fas fa-paper-plane" style={{ marginRight: 4 }}></i> Submit OTP
                          </button>
                        </div>
                      </div>

                      {/* Production CSID */}
                      <div style={{ marginTop: 16 }}>
                        <h6 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#166534' }}><i className="fas fa-rocket" style={{ marginRight: 4 }}></i> Production CSID</h6>
                        <button onClick={async () => {
                          if (!window.confirm('Get Production CSID? You must complete compliance checks first.')) return;
                          try {
                            const res = await zatcaApi.requestProductionCsid();
                            if (res.data && res.data.binarySecurityToken) {
                              alert('Production CSID obtained! Ready for live invoices.');
                            } else {
                              alert('Response: ' + JSON.stringify(res.data || res.error));
                            }
                          } catch (e: any) { alert('Error: ' + e.message); }
                        }} style={{ padding: '8px 16px', background: '#115E59', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                          <i className="fas fa-rocket" style={{ marginRight: 4 }}></i> Get Production CSID
                        </button>
                      </div>

                      {/* Status */}
                      <div style={{ marginTop: 12, padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #86efac' }}>
                        <span style={{ fontSize: 12, color: '#166534' }}>
                          <i className="fas fa-info-circle" style={{ marginRight: 4 }}></i>
                          Phase 2 requires: CSR → OTP → Compliance CSID → Compliance Checks → Production CSID
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Phase 1 - Simple QR info */}
                  {form.zatcaPhase === 'phase1' && (
                    <div style={{ padding: '10px 14px', background: '#ecfdf5', borderRadius: 8, border: '1px solid #86efac' }}>
                      <span style={{ fontSize: 12, color: '#166534' }}>
                        <strong>Phase 1 - Simplified Invoicing</strong>
                        <br/>QR code with invoice data will appear on receipts. No API integration needed.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Currency Settings */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}><i className="fas fa-coins" style={{marginRight: 4}}></i> {t('currencySettings')}</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>{t('currencySymbolLabel')} *</label>
                  <input
                    value={form.currencySymbol}
                    onChange={e => setForm(p => ({ ...p, currencySymbol: e.target.value }))}
                    style={{ width: '100%', padding: '12px 14px', fontSize: 14, border: '2px solid #e2e8f0', borderRadius: 8, outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc' }}
                    placeholder={form.currencySymbol || '৳'}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>

            {/* Due Sales Settings */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 12 }}><i className="fas fa-clock" style={{marginRight: 4}}></i> {t('dueSales')}</h3>
              <div
                onClick={() => setForm(p => ({ ...p, dueSalesEnabled: !p.dueSalesEnabled }))}
                style={{
                  padding: '16px 20px',
                  background: form.dueSalesEnabled ? '#ecfdf5' : '#fef2f2',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: `2px solid ${form.dueSalesEnabled ? '#059669' : '#ef4444'}`,
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                    {t('dueSalesEnabled')} {form.dueSalesEnabled ? <i className="fas fa-check"></i> : <i className="fas fa-xmark"></i>}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
                    {form.dueSalesEnabled ? t('dueSalesEnabledDesc') : t('dueSalesDisabledDesc')}
                  </div>
                </div>
                <div style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: form.dueSalesEnabled ? '#059669' : '#94a3b8',
                  position: 'relative', transition: 'all 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 11,
                    background: '#fff', position: 'absolute', top: 2,
                    left: form.dueSalesEnabled ? 24 : 2,
                    transition: 'all 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
              </div>
            </div>

            {/* VAT Settings */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}><i className="fas fa-money-bill" style={{marginRight: 4}}></i> {t('vatSettings')}</h5>
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
                    {t('vatEnabled')} {form.vatEnabled ? <i className="fas fa-check"></i> : <i className="fas fa-xmark"></i>}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    {form.vatEnabled ? t('vatAppliedToAllSales') : t('vatCalculationOff')}
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
                  {form.vatEnabled ? t('active') : t('inactive')}
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
                    {t('defaultVatPercent')}:
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
              }}><i className="fas fa-palette"></i></div>
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
              >
                <i className="fas fa-receipt" style={{marginRight: 4}}></i> {t('salesInvoice')}
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
              >
                <i className="fas fa-cart-shopping" style={{marginRight: 4}}></i> {t('purchaseInvoice')}
              </button>
            </div>

            {/* 80mm Receipt Preview */}
            <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#475569' }}><i className="fas fa-eye" style={{marginRight: 4}}></i> {t('preview')} - 80mm {t('thermalPrinter')}</h4>
              
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
                  {form.name && <div style={{ fontSize: 10 }}>{t('countryName')}</div>}
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
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 50</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 100</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0', borderBottom: '1px dashed #ccc' }}>
                      <div>{t('productName')} 2</div>
                      <div style={{ textAlign: 'center' }}>1</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 75</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 75</div>
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('subtotal')}:</span>
                        <span>{form.currencySymbol} 175</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('vat')} (15%):</span>
                        <span>{form.currencySymbol} 26.25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: 4, paddingTop: 4 }}>
                        <span>{t('total')}:</span>
                        <span>{form.currencySymbol} 201.25</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('paid')}:</span>
                        <span>{form.currencySymbol} 210</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('change')}:</span>
                        <span>{form.currencySymbol} 8.75</span>
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
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 50</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 500</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px 45px 50px', fontSize: 10, padding: '3px 0', borderBottom: '1px dashed #ccc' }}>
                      <div>{t('productName')} 2</div>
                      <div style={{ textAlign: 'center' }}>5</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 80</div>
                      <div style={{ textAlign: 'right' }}>{form.currencySymbol} 400</div>
                    </div>

                    {/* Totals */}
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('subtotal')}:</span>
                        <span>{form.currencySymbol} 900</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                        <span>{t('vat')} (15%):</span>
                        <span>{form.currencySymbol} 135</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 'bold', borderTop: '1px dashed #000', marginTop: 4, paddingTop: 4 }}>
                        <span>{t('total')} ({t('vatWith')}):

                        </span>
                        <span>{form.currencySymbol} 1,035</span>
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
              <span style={{ fontSize: 18 }}><i className="fas fa-triangle-exclamation"></i></span>
              <p style={{ margin: 0, fontSize: 14, color: '#dc2626' }}>
                {t('warningPermanentDelete')}
              </p>
            </div>

            {/* Row 1: 5 Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
              {[
                { label: t('productData'), count: products.length, icon: <i className="fas fa-box"></i>, onClick: () => deleteAllItems('products', products, setProducts, t) },
                { label: t('customerData'), count: customers.filter(c => !c.isSystem).length, icon: <i className="fas fa-users"></i>, onClick: () => deleteAllCustomers(customers, setCustomers, t), disabled: customers.filter(c => !c.isSystem).length === 0 },
                { label: t('categoryData'), count: categories.length, icon: <i className="fas fa-folder"></i>, onClick: () => deleteAllItems('categories', categories, setCategories, t) },
                { label: t('supplierData'), count: suppliers.length, icon: <i className="fas fa-building"></i>, onClick: () => deleteAllItems('suppliers', suppliers, setSuppliers, t) },
                { label: t('salesData'), count: sales.length, icon: <i className="fas fa-cart-shopping"></i>, onClick: () => deleteAllItems('sales', sales, setSales, t) },
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
                    <span style={{ fontSize: 20 }}><i className="fas fa-file-import"></i></span>
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
                <span style={{ fontSize: 20 }}><i className="fas fa-burst"></i></span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('fullReset')}</div>
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
  const { language, customTranslations, syncTranslations, saveTranslation, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [transSyncStatus, setTransSyncStatus] = useState<string>('');

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
    setTransSyncStatus('syncing');
    await syncTranslations();
    setTransSyncStatus(t('synced') + '!');
    setTimeout(() => setTransSyncStatus(''), 2000);
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
        <h2 style={{ margin: 0 }}><i className="fas fa-globe" style={{marginRight: 4}}></i> Translation Settings</h2>
        <button
          onClick={handleSync}
          disabled={transSyncStatus === 'syncing'}
          style={{
            padding: '8px 16px',
            background: transSyncStatus ? '#22C55E' : '#0F766E',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: transSyncStatus ? 'default' : 'pointer',
            fontWeight: 600,
          }}
        >
          {transSyncStatus === 'syncing' ? t('syncing') : transSyncStatus || t('syncFromCode')}
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
          placeholder={t("searchTranslations")}
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
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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
                        {saving ? '...' : t('save')}
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
                    >
                      <i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredKeys.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>
            {t('noTranslationsFound')}
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

      // Save products to IndexedDB + MySQL API
      if (data.products) {
        for (const product of data.products) {
          await localDb.saveProduct(product);
          api.addProduct(product).catch(() => {});
        }
      }

      // Save categories to IndexedDB + MySQL API
      if (data.categories) {
        for (const category of data.categories) {
          await localDb.saveCategory(category);
          api.addCategory(category).catch(() => {});
        }
      }

      // Save customers to IndexedDB + MySQL API
      if (data.customers) {
        for (const customer of data.customers) {
          await localDb.saveCustomer(customer);
          api.addCustomer(customer).catch(() => {});
        }
      }

      // Save suppliers to IndexedDB + MySQL API
      if (data.suppliers) {
        for (const supplier of data.suppliers) {
          api.addSupplier(supplier).catch(() => {});
        }
      }

      // Save sales to IndexedDB + MySQL API
      if (data.sales) {
        for (const sale of data.sales) {
          await db.put('sales', sale.id, sale).catch(() => {});
          api.addSale(sale).catch(() => {});
        }
      }

      clearInterval(progressInterval);
      setImportProgress(100);

      setMessage(t('importSuccessful'));
        window.location.reload();
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
      <h2 style={{ marginBottom: 24 }}><i className="fas fa-database" style={{marginRight: 8}}></i> {t('databaseSettings')}</h2>

      {/* Database Info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}><i className="fas fa-chart-bar" style={{marginRight: 4}}></i> {t('databaseInfo')}</h3>
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
        <h3 style={{ marginBottom: 12 }}><i className="fas fa-globe" style={{marginRight: 4}}></i> {t('serverConnection')}</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          padding: '10px 14px',
          background: isOnline ? '#F0FDF4' : '#FEF2F2',
          borderRadius: 8,
        }}>
          <span style={{ fontSize: 18 }}>{isOnline ? <i className="fas fa-circle" style={{color:"#22C55E"}}></i> : <i className="fas fa-circle" style={{color:"#EF4444"}}></i>}</span>
          <span style={{ fontWeight: 600, color: isOnline ? '#166534' : '#DC2626' }}>
            {isOnline ? t('online') || 'Online' : t('offline') || 'Offline'}
          </span>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 12 }}>
          {isOnline 
            ? t('connectedToServer')
            : t('workingOffline')}
        </p>
      </div>

      {/* Export / Import */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 12 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('backupRestore')}</h3>
        
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
          >
            <i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportData') || 'Export Data'}
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
                {importFile ? `<i className="fas fa-file-csv"></i> ${importFile.name}` : t('selectFile') || 'Select File'}
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
        <h4 style={{ marginBottom: 8, color: '#115E59' }}><i className="fas fa-lightbulb" style={{marginRight: 4}}></i> {t('howItWorks')}</h4>
        <ul style={{ fontSize: 13, color: '#374151', margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{t('dataSavedLocally')}</li>
          <li>{t('worksOffline')}</li>
          <li>{t('autoSyncOnline')}</li>
          <li>{t('canBackupRestore')}</li>
        </ul>
      </div>
    </div>
  );
}
