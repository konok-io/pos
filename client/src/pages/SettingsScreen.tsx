import { useState, useEffect, CSSProperties } from 'react';
import { setSetting, getSetting, clearAllData } from '../services';

interface Settings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  crNumber: string;
  zatkaEnabled: boolean;
  zatkaApiUrl: string;
  zatkaUsername: string;
  zatkaPassword: string;
  zatcaPhase: string;
  zatcaOid: string;
  zatcaCsid: string;
  zatcaPrivateKey: string;
  zatcaClientId: string;
  zatcaClientSecret: string;
  vatEnabled: boolean;
  vatPercent: number;
  bannerImage: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  receiptShowAddress: boolean;
  receiptShowPhone: boolean;
  receiptShowCustomer: boolean;
  receiptShowVat: boolean;
  receiptShowQr: boolean;
  receiptFontSize: number;
  receiptLogo: string;
  purchaseHeader: string;
  purchaseFooter: string;
  purchaseShowLogo: boolean;
  purchaseShowAddress: boolean;
  purchaseShowSupplier: boolean;
  purchaseShowPhone: boolean;
  purchaseShowVat: boolean;
  purchaseShowStoreVat: boolean;
  purchaseFontSize: number;
  purchaseIcon: string;
}

interface Props {
  products: any[];
  customers: any[];
  sales: any[];
  suppliers: any[];
  categories: any[];
  purchases: any[];
  onRefresh: () => void;
}

const T = {
  teal: '#0F766E', tealDark: '#115E59', tealLight: '#F0FDFA', tealMid: '#CCFBF1',
  orange: '#EA580C', orangeLight: '#FFF7ED',
  green: '#16A34A', greenLight: '#F0FDF4',
  red: '#DC2626', redLight: '#FEF2F2',
  amber: '#D97706', amberLight: '#FFFBEB',
  gray50: '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB',
  gray400: '#9CA3AF', gray600: '#4B5563', gray800: '#1F2937', gray900: '#111827',
  white: '#FFFFFF',
};

const cardStyle: CSSProperties = {
  background: T.white,
  borderRadius: 16,
  padding: 32,
  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
  border: '1px solid #e2e8f0'
};

const inputStyle = (disabled = false): CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  fontSize: 14,
  border: '2px solid #e2e8f0',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box' as const,
  color: '#1e293b',
  background: disabled ? '#f3f4f6' : '#f8fafc',
  transition: 'all 0.2s',
});

export default function SettingsScreen({ products, customers, sales, suppliers, categories, purchases, onRefresh }: Props) {
  void onRefresh; // Reserved for future use

  const [form, setForm] = useState<Settings>({
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
  });

  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [confirmText, setConfirmText] = useState('');

  // Load settings from PouchDB on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const keys = Object.keys(form);
    const loaded: Partial<Settings> = {};
    
    for (const key of keys) {
      const value = await getSetting(key);
      if (value !== null) {
        // Parse boolean strings
        if (value === 'true') loaded[key as keyof Settings] = true as any;
        else if (value === 'false') loaded[key as keyof Settings] = false as any;
        else if (!isNaN(Number(value)) && value !== '') loaded[key as keyof Settings] = Number(value) as any;
        else loaded[key as keyof Settings] = value as any;
      }
    }
    
    if (Object.keys(loaded).length > 0) {
      setForm(prev => ({ ...prev, ...loaded }));
    }
  };

  const save = async () => {
    try {
      // Save all settings to PouchDB
      for (const [key, value] of Object.entries(form)) {
        await setSetting(key, String(value));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('❌ সেটিংস সংরক্ষণ ব্যর্থ হয়েছে!');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
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
      setForm(p => ({ ...p, bannerImage: event.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const clearAll = async () => {
    if (confirmText !== 'মুছে ফেলুন') {
      alert('নিশ্চিত করতে "মুছে ফেলুন" লিখুন');
      return;
    }
    
    try {
      await clearAllData();
      alert('সব ডেটা মুছা হয়েছে। অ্যাপ রিলোড হচ্ছে...');
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('❌ ডেটা মুছতে ব্যর্থ হয়েছে!');
    }
  };

  const tabs = [
    { icon: '⚙️', label: 'জেনারেল' },
    { icon: '🎨', label: 'ডিজাইন' },
    { icon: '🔄', label: 'ট্রান্সলেশন' },
    { icon: '🗄️', label: 'ডেটাবেজ' },
    { icon: '💾', label: 'ইউজার' },
    { icon: '🔄', label: 'ডেটা রিসেট' },
  ];

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
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
              ⚙️ সেটিংস
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
              আপনার POS সিস্টেম কনফিগার করুন
            </p>
          </div>
          
          <button onClick={save} style={{
            padding: '12px 24px',
            background: saved ? '#059669' : 'rgba(255,255,255,0.95)',
            color: saved ? '#fff' : '#0F766E',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          }}>
            {saved ? '✅ সংরক্ষিত' : '💾 সংরক্ষণ করুন'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #115E59 50%, #134E4A 100%)',
        padding: '0 32px 16px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, overflowX: 'auto' }}>
          {tabs.map((tab, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(i)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                background: activeTab === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.15)',
                color: activeTab === i ? '#0F766E' : '#fff',
                whiteSpace: 'nowrap',
                boxShadow: activeTab === i ? '0 4px 12px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {/* General Tab */}
        {activeTab === 0 && (
          <div style={cardStyle}>
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
              }}>⚙️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>সাধারণ তথ্য</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>আপনার ব্যবসার মূল তথ্য</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🏪 ব্যবসার নাম *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle()}
                  placeholder="আপনার ব্যবসার নাম লিখুন"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📞 মোবাইল নম্বর
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  style={inputStyle()}
                  placeholder="01XXXXXXXXX"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📍 ঠিকানা
                </label>
                <input
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  style={inputStyle()}
                  placeholder="আপনার ব্যবসার ঠিকানা"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  📧 ইমেইল
                </label>
                <input
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  type="email"
                  style={inputStyle()}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🔢 VAT নম্বর (TIN)
                </label>
                <input
                  value={form.taxId}
                  onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))}
                  style={inputStyle()}
                  placeholder="১৫ ডিজিটের VAT নম্বর"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  🏢 CR নম্বর
                </label>
                <input
                  value={form.crNumber}
                  onChange={e => setForm(p => ({ ...p, crNumber: e.target.value }))}
                  style={inputStyle()}
                  placeholder="CR নম্বর"
                />
              </div>
            </div>

            {/* VAT Settings */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>💰 ভ্যাট সেটিংস</h5>
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
                      style={{
                        width: 80,
                        padding: '10px 12px',
                        fontSize: 14,
                        fontWeight: 700,
                        border: '2px solid #86efac',
                        borderRadius: 6,
                        outline: 'none',
                        textAlign: 'center',
                        color: '#166534',
                        background: '#fff'
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Banner Image */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#1e293b' }}>🖼️ হোম ব্যানার ছবি</h5>
              {form.bannerImage ? (
                <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', maxWidth: 400 }}>
                  <img src={form.bannerImage} alt="Banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                  <button
                    onClick={() => setForm(p => ({ ...p, bannerImage: '' }))}
                    style={{
                      position: 'absolute',
                      top: 8, right: 8,
                      padding: '6px 12px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 600
                    }}
                  >
                    ✕ মুছুন
                  </button>
                </div>
              ) : (
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  padding: '32px',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: '#f8fafc',
                  fontSize: 14,
                  color: '#64748b'
                }}>
                  <span style={{ fontSize: 28 }}>📁</span>
                  <span>ছবি আপলোড করুন (JPG, PNG - সর্বোচ্চ 5MB)</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 1 && (
          <div style={cardStyle}>
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
              }}>🎨</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ডিজাইন সেটিংস</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>রিসিট টেমপ্লেট কনফিগার করুন</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  হেডার টাইটেল
                </label>
                <input
                  value={form.receiptHeader}
                  onChange={e => setForm(p => ({ ...p, receiptHeader: e.target.value }))}
                  style={inputStyle()}
                  placeholder="🧾 বিক্রয় রিসিট"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  ফুটার টেক্সট
                </label>
                <input
                  value={form.receiptFooter}
                  onChange={e => setForm(p => ({ ...p, receiptFooter: e.target.value }))}
                  style={inputStyle()}
                  placeholder="ধন্যবাদ"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  আইকন/লোগো
                </label>
                <input
                  value={form.receiptLogo}
                  onChange={e => setForm(p => ({ ...p, receiptLogo: e.target.value }))}
                  style={inputStyle()}
                  placeholder="🖼️"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  ফন্ট সাইজ
                </label>
                <select
                  value={form.receiptFontSize}
                  onChange={e => setForm(p => ({ ...p, receiptFontSize: parseInt(e.target.value) }))}
                  style={inputStyle()}
                >
                  <option value={9}>ছোট (৯px)</option>
                  <option value={10}>মাঝারি ছোট (১০px)</option>
                  <option value={11}>মাঝারি (১১px)</option>
                  <option value={12}>বড় (১২px)</option>
                </select>
              </div>
            </div>

            {/* Receipt Options */}
            <div style={{ marginTop: 20, padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '2px solid #e2e8f0' }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#475569' }}>প্রদর্শন অপশন</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { key: 'receiptShowLogo', label: 'লোগো/আইকন' },
                  { key: 'receiptShowAddress', label: 'ঠিকানা' },
                  { key: 'receiptShowPhone', label: 'ফোন নম্বর ও ভ্যাট' },
                  { key: 'receiptShowCustomer', label: 'গ্রাহক তথ্য' },
                  { key: 'receiptShowVat', label: 'ভ্যাট তথ্য' },
                  { key: 'receiptShowQr', label: 'QR কোড' },
                ].map(item => (
                  <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form[item.key as keyof Settings] !== false}
                      onChange={e => setForm(p => ({ ...p, [item.key]: e.target.checked }))}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0F766E' }}
                    />
                    <span style={{ fontSize: 13, color: '#475569' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div style={{ marginTop: 24 }}>
              <h5 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#475569' }}>👁️ প্রিভিউ</h5>
              <div style={{ background: '#f1f5f9', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{
                  background: '#fff',
                  padding: `${form.receiptFontSize}px`,
                  width: 200,
                  margin: '0 auto',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  fontSize: `${form.receiptFontSize}px`,
                  fontFamily: 'monospace',
                  color: '#000',
                  textAlign: 'left'
                }}>
                  <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: 6, marginBottom: 6 }}>
                    {form.receiptShowLogo && <div style={{ fontWeight: 'bold', fontSize: `${form.receiptFontSize + 3}px` }}>{form.receiptLogo || form.receiptHeader}</div>}
                    {form.receiptShowAddress && form.name && <div style={{ fontSize: `${form.receiptFontSize - 1}px` }}>{form.name}</div>}
                    {form.receiptShowPhone && form.taxId && <div style={{ fontSize: `${form.receiptFontSize - 2}px`, fontWeight: 'bold' }}>VAT: {form.taxId}</div>}
                  </div>
                  <div style={{ fontSize: `${form.receiptFontSize - 1}px`, marginBottom: 4 }}>পণ্য ১ x ১০০ = ১০০</div>
                  <div style={{ fontSize: `${form.receiptFontSize - 1}px`, borderTop: '1px dashed #000', paddingTop: 6, marginTop: 6, fontWeight: 'bold' }}>
                    মোট: ১০০
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Translation Tab */}
        {activeTab === 2 && (
          <div style={cardStyle}>
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
              }}>🔄</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ট্রান্সলেশন</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>ভাষা সেটিংস পরিবর্তন করুন</p>
              </div>
            </div>
            
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: 12,
              textAlign: 'center',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🌐</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#374151' }}>ভাষা সেটিংস</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                বর্তমানে উপলব্ধ: বাংলা, ইংরেজি, হিন্দি, আরবি
              </p>
            </div>
          </div>
        )}

        {/* Database Tab */}
        {activeTab === 3 && (
          <div style={cardStyle}>
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
              }}>🗄️</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ডেটাবেজ</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>ডেটা ব্যাকআপ ও রিস্টোর</p>
              </div>
            </div>
            
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: 12,
              textAlign: 'center',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💾</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#374151' }}>ব্যাকআপ ও রিস্টোর</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                আপনার ডেটা ব্যাকআপ করুন এবং প্রয়োজনে রিস্টোর করুন।
              </p>
            </div>
          </div>
        )}

        {/* Users Tab - Placeholder (requires auth system) */}
        {activeTab === 4 && (
          <div style={cardStyle}>
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
              }}>👥</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ইউজার ম্যানেজমেন্ট</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>মাল্টি-ইউজার ফিচার শীঘ্রই আসছে</p>
              </div>
            </div>
            
            <div style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: 12,
              textAlign: 'center',
              border: '2px dashed #e2e8f0'
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 600, color: '#374151' }}>মাল্টি-ইউজার আসছে</h4>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                প্রো ভার্সনে মাল্টি-ইউজার, অ্যাডমিন রোল এবং লগইন সিস্টেম পাবেন।
              </p>
            </div>
          </div>
        )}

        {/* Data Reset Tab */}
        {activeTab === 5 && (
          <div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40,
                  background: '#dc2626',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#fff'
                }}>⚠️</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>ডেটা রিসেট</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>ডেটা মুছে ফেলার জন্য সতর্ক ব্যবহার করুন</p>
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                background: '#fef2f2',
                borderRadius: 10,
                border: '1px solid #fecaca',
                marginBottom: 20
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#dc2626', lineHeight: 1.6 }}>
                  ⚠️ সতর্কতা: নিচের অপশনগুলো ব্যবহারে ডেটা স্থায়ীভাবে মুছে যাবে। এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: '📦 পণ্য', count: products.length },
                  { label: '👥 কাস্টমার', count: customers.length },
                  { label: '📂 ক্যাটাগরি', count: categories.length },
                  { label: '🛒 বিক্রয়', count: sales.length },
                  { label: '🏢 সরবরাহকারী', count: suppliers.length },
                  { label: '🛒 পারচেজ', count: purchases.length },
                ].map((item, i) => (
                  <div key={i} style={{
                    padding: 16,
                    background: '#fef2f2',
                    borderRadius: 10,
                    border: '1px solid #fecaca',
                    textAlign: 'center'
                  }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.label}</h4>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#dc2626' }}>{item.count}টি</p>
                  </div>
                ))}
              </div>

              {/* Danger Zone */}
              <div style={{ marginTop: 24, padding: 20, background: '#fef2f2', borderRadius: 12, border: '2px solid #dc2626' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#dc2626' }}>☠️ সব ডেটা মুছে ফেলুন</h4>
                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
                  "মুছে ফেলুন" লিখে নিশ্চিত করুন
                </p>
                <input
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="মুছে ফেলুন"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    border: '2px solid #dc2626',
                    borderRadius: 8,
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 12,
                    background: '#fff'
                  }}
                />
                <button
                  onClick={clearAll}
                  disabled={confirmText !== 'মুছে ফেলুন'}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    background: confirmText === 'মুছে ফেলুন' ? '#991b1b' : '#9ca3af',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: confirmText === 'মুছে ফেলুন' ? 'pointer' : 'not-allowed'
                  }}
                >
                  💥 সব ডেটা মুছুন
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
