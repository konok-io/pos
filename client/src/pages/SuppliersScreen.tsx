import { useState, CSSProperties } from 'react';
import { useLanguage } from '../i18n';

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

interface Category {
  id: string;
  name: string;
  company?: string;
}

interface Props {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  purchases: any[];
}

const T: Record<string, string> = {
  teal: '#0F766E', tealDark: '#115E59', tealLight: '#F0FDFA', tealMid: '#CCFBF1',
  orange: '#EA580C', orangeLight: '#FFF7ED',
  green: '#16A34A', greenLight: '#F0FDF4',
  red: '#DC2626', redLight: '#FEF2F2',
  amber: '#D97706', amberLight: '#FFFBEB',
  gray50: '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB',
  gray400: '#9CA3AF', gray500: '#6B7280', gray600: '#4B5563', gray800: '#1F2937', gray900: '#111827',
  white: '#FFFFFF',
};

const cardStyle: CSSProperties = {
  background: T.white,
  borderRadius: 12,
  padding: 16,
  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  border: '1px solid #e2e8f0'
};

const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

export default function SuppliersScreen({ suppliers, setSuppliers, categories, setCategories, products, setProducts, purchases }: Props) {
  const { t } = useLanguage();
  
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'categories'>('companies');
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [viewCategory, setViewCategory] = useState<Category | null>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<Supplier | null>(null);
  
  // Form states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: ''
  });
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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
        // Update in state only (local-only for now)
        const updated: Supplier = {
          ...editingSupplier,
          ...supplierForm,
          code: codeToUse,
          company: supplierForm.name.trim()
        };
        setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updated : s));
        alert('✅ সরবরাহকারী আপডেট করা হয়েছে!');
      } else {
        // Create new
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
        // Update
        const updated: Category = { ...editingCategory, name: categoryForm.name.trim() };
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updated : c));
        alert('✅ ক্যাটাগরি আপডেট করা হয়েছে!');
      } else {
        // Create
        const newCat: Category = { id: genId(), name: categoryForm.name.trim() };
        setCategories(prev => [...prev, newCat]);
        alert(`✅ ক্যাটাগরি যোগ করা হয়েছে!`);
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
  const deleteCategory = async (cat: Category) => {
    const hasProducts = products.some(p => (p.cat || '').toLowerCase() === cat.name.toLowerCase());
    if (hasProducts) {
      alert('❌ এই ক্যাটাগরিতে পণ্য আছে বলে মুছা যাবে না!');
      return;
    }
    
    if (!confirm('এই ক্যাটাগরি মুছে ফেলবেন?')) return;
    
    try {
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setViewCategory(null);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('❌ ডিলিট ব্যর্থ হয়েছে!');
    }
  };
  
  // Save Product
  const saveProduct = async () => {
    if (!productForm.company) { alert('সরবরাহকারী সিলেক্ট করুন'); return; }
    if (!productForm.cat) { alert('ক্যাটাগরি সিলেক্ট করুন'); return; }
    if (!productForm.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    
    try {
      // Generate ID
      const maxId = products.reduce((max, p) => {
        const match = p.id?.match(/P-(\d+)/);
        return match ? Math.max(max, parseInt(match[1])) : max;
      }, 50);
      const newId = `P-${String(maxId + 1).padStart(5, '0')}`;
      
      const newProduct = {
        id: newId,
        name: productForm.name.trim(),
        barcode: productForm.barcode || '',
        company: productForm.company,
        cat: productForm.cat,
        unit: productForm.unit || 'পিস',
        buyP: parseFloat(String(productForm.buyP)) || 0,
        sellP: parseFloat(String(productForm.sellP)) || 0,
        stock: parseFloat(String(productForm.stock)) || 0,
        minStock: parseFloat(String(productForm.minStock)) || 5
      };
      
      setProducts(prev => [...prev, newProduct]);
      alert(`✅ পণ্য সংরক্ষিত হয়েছে!\nআইডি: ${newId}`);
      setShowProductModal(false);
      setProductForm({ company: '', cat: '', name: '', barcode: '', unit: 'পিস', buyP: '', sellP: '', stock: '0', minStock: '5' });
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('❌ সমস্যা হয়েছে!');
    }
  };
  
  // Download CSV
  const downloadCSV = () => {
    const csv = `কোম্পানি আইডি,সরবরাহকারীর নাম,CR নম্বর,VAT নম্বর,ফোন,ঠিকানা
C-00001,মিনিকেট ফুডস,1234567890,312345678901234,0501234567,রিয়াদ সৌদি আরব
C-00002,সুজান বেভারেজ,9876543210,398765432109876,0509876543,জেদ্দাহ সৌদি আরব`;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'সরবরাহকারী.csv';
    a.click();
  };

  // Format currency
  const fmt = (n: number) => `৳${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Open Edit Modal
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      crNumber: supplier.crNumber || '',
      vatNumber: supplier.vatNumber || '',
      code: supplier.code || ''
    });
    setShowSupplierModal(true);
  };

  // View Supplier Detail
  if (viewSupplier) {
    const supProducts = products.filter(p => (p.company || '').toLowerCase() === (viewSupplier.name || '').toLowerCase());
    const supPurchases = getSupplierPurchases(viewSupplier.name);
    const totalPurchase = supPurchases.reduce((s: number, p: any) => 
      s + p.items.reduce((a: number, i: any) => a + (i.stock || 0) * (i.buyP || 0), 0) * 1.15, 0
    );
    
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray50 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button onClick={() => setViewSupplier(null)} style={{
            padding: '8px 14px',
            background: T.gray100,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            ← {t('back') || 'ফিরে যান'}
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: 18, color: T.teal }}>🏢 {viewSupplier.name}</span>
            <span style={{ fontSize: 14, color: T.gray500, marginTop: 4 }}>
              {viewSupplier.phone && `📞 ${viewSupplier.phone}`}
              {viewSupplier.phone && viewSupplier.crNumber && ' | '}
              {viewSupplier.crNumber && `CR: ${viewSupplier.crNumber}`}
            </span>
            {viewSupplier.address && (
              <span style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>📍 {viewSupplier.address}</span>
            )}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button style={{ ...cardStyle, padding: '8px 14px', cursor: 'pointer' }} onClick={() => setShowPurchaseHistory(viewSupplier)}>
              📋 {t('purchaseHistory') || 'পারচেজ হিস্ট্রি'}
            </button>
            {!viewSupplier.isAuto && (
              <>
                <button style={{ ...cardStyle, padding: '8px 14px', cursor: 'pointer', background: T.tealLight, color: T.teal }} onClick={() => openEditModal(viewSupplier)}>
                  ✏️ {t('edit') || 'এডিট'}
                </button>
                <button style={{ ...cardStyle, padding: '8px 14px', cursor: 'pointer', background: T.redLight, color: T.red }} onClick={() => deleteSupplier(viewSupplier)}>
                  🗑️ {t('delete') || 'মুছুন'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.teal }}>{supProducts.length}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('products') || 'পণ্য'}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.orange }}>{supPurchases.length}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('purchases') || 'পারচেজ'}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.green }}>{fmt(totalPurchase)}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('totalPurchase') || 'মোট পারচেজ'}</div>
            </div>
          </div>
          
          {/* Products */}
          <div style={{ ...cardStyle, padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.gray100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>📦 {t('products') || 'পণ্য'}</span>
              <button style={{ padding: '6px 12px', background: T.teal, color: T.white, border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }} onClick={() => {
                setProductForm(p => ({ ...p, company: viewSupplier.name }));
                setShowProductModal(true);
              }}>
                ➕ {t('addProduct') || 'পণ্য যোগ'}
              </button>
            </div>
            {supProducts.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.gray400 }}>{t('noProducts') || 'কোনো পণ্য নেই'}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {supProducts.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: T.gray400, marginTop: 2 }}>{p.barcode || p.id}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: T.gray600 }}>{p.stock} {p.unit}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: T.gray600 }}>{fmt(p.buyP)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: T.teal, fontSize: 14 }}>{fmt(p.sellP)}</td>
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

  // View Category Detail
  if (viewCategory) {
    const catProducts = products.filter(p => (p.cat || '').toLowerCase() === viewCategory.name.toLowerCase());
    const totalValue = catProducts.reduce((s, p) => s + (p.stock || 0) * (p.sellP || 0), 0);
    
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray50 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button onClick={() => setViewCategory(null)} style={{
            padding: '8px 14px',
            background: T.gray100,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            ← {t('back') || 'ফিরে যান'}
          </button>
          <span style={{ fontWeight: 700, fontSize: 18, color: T.teal }}>📂 {viewCategory.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            {catProducts.length === 0 && (
              <>
                <button style={{ ...cardStyle, padding: '8px 14px', cursor: 'pointer', background: T.tealLight, color: T.teal }} onClick={() => {
                  setEditingCategory(viewCategory);
                  setCategoryForm({ name: viewCategory.name });
                  setShowCategoryModal(true);
                }}>
                  ✏️ {t('edit') || 'এডিট'}
                </button>
                <button style={{ ...cardStyle, padding: '8px 14px', cursor: 'pointer', background: T.redLight, color: T.red }} onClick={() => deleteCategory(viewCategory)}>
                  🗑️ {t('delete') || 'মুছুন'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.teal }}>{catProducts.length}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('products') || 'পণ্য'}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.orange }}>{catProducts.reduce((s, p) => s + p.stock, 0)}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('stock') || 'স্টক'}</div>
            </div>
            <div style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: T.green }}>{fmt(totalValue)}</div>
              <div style={{ fontSize: 14, color: T.gray400, marginTop: 4 }}>{t('value') || 'মূল্য'}</div>
            </div>
          </div>
          
          {/* Products */}
          <div style={{ ...cardStyle, padding: 0 }}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.gray100}` }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>📦 {t('products') || 'পণ্য'} ({catProducts.length}টি)</span>
            </div>
            {catProducts.length === 0 ? (
              <div style={{ padding: 30, textAlign: 'center', color: T.gray400 }}>{t('noProducts') || 'কোনো পণ্য নেই'}</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {catProducts.map((p, i) => (
                    <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: T.gray400, marginTop: 2 }}>{p.company}</div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: T.gray600 }}>{p.stock} {p.unit}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: T.gray600 }}>{fmt(p.buyP)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: T.teal, fontSize: 14 }}>{fmt(p.sellP)}</td>
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

  // Purchase History View
  if (showPurchaseHistory) {
    const supplierPurchases = getSupplierPurchases(showPurchaseHistory.name);
    
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.gray50 }}>
        <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button onClick={() => setShowPurchaseHistory(null)} style={{
            padding: '8px 14px',
            background: T.gray100,
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600
          }}>
            ← {t('back') || 'ফিরে যান'}
          </button>
          <span style={{ fontWeight: 700, fontSize: 15 }}>📦 {showPurchaseHistory.name} - {t('purchaseHistory') || 'পারচেজ হিস্ট্রি'}</span>
          <span style={{ fontSize: 14, color: T.gray500, marginLeft: 'auto' }}>{supplierPurchases.length}টি পারচেজ</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {supplierPurchases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.gray400 }}>{t('noPurchases') || 'কোনো পারচেজ রেকর্ড নেই'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...supplierPurchases].reverse().map(p => (
                <div key={p.id} style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, color: T.teal }}>{p.id}</div>
                    <div style={{ fontSize: 14, color: T.gray500 }}>{new Date(p.date).toLocaleDateString('bn-BD')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 14 }}>
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

  // Main View
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.white }}>🏢 {t('suppliers') || 'সরবরাহকারী'}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            {activeTab === 'companies' ? `${t('total') || 'মোট'}: ${allSuppliers.length} ${t('suppliers') || 'সরবরাহকারী'}` : `${t('total') || 'মোট'}: ${categories.length} ক্যাটাগরি`}
          </p>
        </div>
        <button 
          onClick={() => {
            if (activeTab === 'companies') {
              setEditingSupplier(null);
              setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' });
              setShowSupplierModal(true);
            } else {
              setEditingCategory(null);
              setCategoryForm({ name: '' });
              setShowCategoryModal(true);
            }
          }}
          style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.95)', color: T.teal, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}
        >
          ➕ {activeTab === 'companies' ? (t('addSupplier') || 'সরবরাহকারী যোগ') : (t('addCategory') || 'ক্যাটাগরি যোগ')}
        </button>
      </div>

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.white, padding: '10px 16px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveTab('companies')} style={{
          padding: '8px 14px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          border: `1px solid ${activeTab === 'companies' ? T.teal : T.gray200}`,
          background: activeTab === 'companies' ? T.teal : T.gray100,
          color: activeTab === 'companies' ? T.white : T.gray600,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}>
          🏢 {t('suppliers') || 'সরবরাহকারী'} ({allSuppliers.length})
        </button>
        <button onClick={() => setActiveTab('categories')} style={{
          padding: '8px 14px',
          borderRadius: 7,
          whiteSpace: 'nowrap',
          border: `1px solid ${activeTab === 'categories' ? T.teal : T.gray200}`,
          background: activeTab === 'categories' ? T.teal : T.gray100,
          color: activeTab === 'categories' ? T.white : T.gray600,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 13,
        }}>
          📂 ক্যাটাগরি ({categories.length})
        </button>
        
        {/* Search */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder={activeTab === 'companies' ? 'সরবরাহকারী খুঁজুন...' : 'ক্যাটাগরি খুঁজুন...'}
              style={{ padding: '8px 12px 8px 32px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, width: 200 }}
            />
          </div>
          <button onClick={downloadCSV} style={{ padding: '8px 12px', background: T.tealLight, border: `1px solid ${T.teal}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: T.teal }}>
            📥 CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {activeTab === 'companies' ? (
          // Suppliers List
          filteredSuppliers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: T.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
              <p style={{ fontSize: 16 }}>{t('noSuppliers') || 'কোনো সরবরাহকারী নেই'}</p>
              <button onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' }); setShowSupplierModal(true); }} style={{ marginTop: 16, padding: '10px 20px', background: T.teal, color: T.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                ➕ সরবরাহকারী যোগ করুন
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {filteredSuppliers.map(s => (
                <div key={s.id} style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setViewSupplier(s)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: T.teal, marginBottom: 4 }}>
                        {s.isAuto && <span style={{ fontSize: 11, background: T.amberLight, color: T.amber, padding: '2px 6px', borderRadius: 4, marginRight: 6 }}>অটো</span>}
                        🏢 {s.name}
                      </div>
                      <div style={{ fontSize: 13, color: T.gray500, marginBottom: 2 }}>
                        {s.code && <span>📋 {s.code}</span>}
                        {s.code && s.phone && ' | '}
                        {s.phone && `📞 ${s.phone}`}
                      </div>
                      <div style={{ fontSize: 12, color: T.gray400 }}>{s.address || 'ঠিকানা নেই'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <div style={{ padding: '4px 8px', background: T.tealLight, borderRadius: 6, fontSize: 12, color: T.teal, fontWeight: 600 }}>
                        📦 {getProductsCount(s.name)}টি
                      </div>
                      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewSupplier(s); }}
                          style={{ padding: '4px 8px', background: T.tealLight, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                          title={t('view') || 'দেখুন'}
                        >
                          👁️
                        </button>
                        {!s.isAuto && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditModal(s); }}
                              style={{ padding: '4px 8px', background: T.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                              title={t('edit') || 'এডিট'}
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteSupplier(s); }}
                              style={{ padding: '4px 8px', background: T.redLight, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                              title={t('delete') || 'মুছুন'}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Categories List
          filteredCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: T.gray400 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ fontSize: 16 }}>কোনো ক্যাটাগরি নেই</p>
              <button onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); setShowCategoryModal(true); }} style={{ marginTop: 16, padding: '10px 20px', background: T.teal, color: T.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                ➕ ক্যাটাগরি যোগ করুন
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
              {filteredCategories.map(c => {
                const catProducts = products.filter(p => (p.cat || '').toLowerCase() === c.name.toLowerCase());
                return (
                  <div key={c.id} style={{ ...cardStyle, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setViewCategory(c)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: T.teal, marginBottom: 4 }}>📂 {c.name}</div>
                        <div style={{ fontSize: 13, color: T.gray500 }}>{catProducts.length}টি পণ্য</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setViewCategory(c); }}
                          style={{ padding: '4px 8px', background: T.tealLight, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                          title="দেখুন"
                        >
                          👁️
                        </button>
                        {catProducts.length === 0 && (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditingCategory(c); setCategoryForm({ name: c.name }); setShowCategoryModal(true); }}
                              style={{ padding: '4px 8px', background: T.gray100, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                              title="এডিট"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteCategory(c); }}
                              style={{ padding: '4px 8px', background: T.redLight, border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                              title="মুছুন"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: T.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.teal }}>
                {editingSupplier ? '✏️ সরবরাহকারী এডিট করুন' : '➕ নতুন সরবরাহকারী যোগ করুন'}
              </h3>
              <button onClick={() => { setShowSupplierModal(false); setEditingSupplier(null); }} style={{ padding: '6px 10px', background: T.gray100, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>🏢 নাম *</label>
                <input
                  value={supplierForm.name}
                  onChange={e => setSupplierForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="সরবরাহকারীর নাম"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📋 কোড</label>
                  <input
                    value={supplierForm.code}
                    onChange={e => setSupplierForm(p => ({ ...p, code: e.target.value }))}
                    placeholder="C-00001 (অটো হবে)"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📞 ফোন</label>
                  <input
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="0501234567"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📧 ইমেইল</label>
                <input
                  value={supplierForm.email}
                  onChange={e => setSupplierForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📍 ঠিকানা</label>
                <input
                  value={supplierForm.address}
                  onChange={e => setSupplierForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="সৌদি আরব"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>🏢 CR নম্বর</label>
                  <input
                    value={supplierForm.crNumber}
                    onChange={e => setSupplierForm(p => ({ ...p, crNumber: e.target.value }))}
                    placeholder="CR নম্বর"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>🔢 VAT নম্বর</label>
                  <input
                    value={supplierForm.vatNumber}
                    onChange={e => setSupplierForm(p => ({ ...p, vatNumber: e.target.value }))}
                    placeholder="VAT নম্বর"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => { setShowSupplierModal(false); setEditingSupplier(null); }} style={{ flex: 1, padding: '12px', background: T.gray100, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: T.gray600 }}>
                বাতিল
              </button>
              <button onClick={saveSupplier} style={{ flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                💾 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: T.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.teal }}>
                {editingCategory ? '✏️ ক্যাটাগরি এডিট করুন' : '➕ নতুন ক্যাটাগরি যোগ করুন'}
              </h3>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} style={{ padding: '6px 10px', background: T.gray100, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📂 নাম *</label>
              <input
                value={categoryForm.name}
                onChange={e => setCategoryForm({ name: e.target.value })}
                placeholder="ক্যাটাগরির নাম"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} style={{ flex: 1, padding: '12px', background: T.gray100, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: T.gray600 }}>
                বাতিল
              </button>
              <button onClick={saveCategory} style={{ flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                💾 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div style={{ background: T.white, borderRadius: 16, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: T.teal }}>➕ নতুন পণ্য যোগ করুন</h3>
              <button onClick={() => setShowProductModal(false)} style={{ padding: '6px 10px', background: T.gray100, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Company Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>🏢 সরবরাহকারী *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.company}
                    onChange={e => { setProductForm(p => ({ ...p, company: e.target.value, cat: '' })); setShowCompanyDrop(true); }}
                    placeholder="সরবরাহকারী নির্বাচন করুন"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCompanyDrop && filteredCompanies.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCompanies.map(s => (
                        <div key={s.id} onClick={() => { setProductForm(p => ({ ...p, company: s.name })); setShowCompanyDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}` }} onMouseOver={e => (e.currentTarget.style.background = T.tealLight)} onMouseOut={e => (e.currentTarget.style.background = T.white)}>
                          🏢 {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Category Dropdown */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📂 ক্যাটাগরি *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.cat}
                    onChange={e => { setProductForm(p => ({ ...p, cat: e.target.value })); setShowCatDrop(true); }}
                    placeholder="ক্যাটাগরি নির্বাচন করুন"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                  {showCatDrop && filteredCats.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, maxHeight: 150, overflow: 'auto' }}>
                      {filteredCats.map(c => (
                        <div key={c.id} onClick={() => { setProductForm(p => ({ ...p, cat: c.name })); setShowCatDrop(false); }} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}` }} onMouseOver={e => (e.currentTarget.style.background = T.tealLight)} onMouseOut={e => (e.currentTarget.style.background = T.white)}>
                          📂 {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📦 পণ্যের নাম *</label>
                <input
                  value={productForm.name}
                  onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="পণ্যের নাম"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📊 বারকোড</label>
                <input
                  value={productForm.barcode}
                  onChange={e => setProductForm(p => ({ ...p, barcode: e.target.value }))}
                  placeholder="বারকোড (ঐচ্ছিক)"
                  style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>💰 ক্রয়মূল্য</label>
                  <input
                    type="number"
                    value={productForm.buyP}
                    onChange={e => setProductForm(p => ({ ...p, buyP: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>💵 বিক্রয়মূল্য</label>
                  <input
                    type="number"
                    value={productForm.sellP}
                    onChange={e => setProductForm(p => ({ ...p, sellP: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📦 স্টক</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>📏 একক</label>
                  <input
                    value={productForm.unit}
                    onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))}
                    placeholder="পিস"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: T.gray600 }}>⚠️ মিন স্টক</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={e => setProductForm(p => ({ ...p, minStock: e.target.value }))}
                    placeholder="5"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${T.gray200}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => setShowProductModal(false)} style={{ flex: 1, padding: '12px', background: T.gray100, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, color: T.gray600 }}>
                বাতিল
              </button>
              <button onClick={saveProduct} style={{ flex: 1, padding: '12px', background: T.teal, color: T.white, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                💾 সংরক্ষণ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
