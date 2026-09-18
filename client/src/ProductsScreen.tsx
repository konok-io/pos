import { useState, useEffect } from 'react';
import { useLanguage } from './i18n';

const T = {
  teal: '#0F766E', tealDark: '#115E59', tealLight: '#F0FDFA',
  orange: '#EA580C', green: '#16A34A', greenLight: '#F0FDF4',
  red: '#DC2626', redLight: '#FEF2F2', amber: '#D97706', amberLight: '#FFFBEB',
  gray50: '#F9FAFB', gray100: '#F3F4F6', gray200: '#E5E7EB', gray300: '#D1D5DB',
  gray400: '#9CA3AF', gray500: '#6B7280', gray600: '#4B5563', gray800: '#1F2937', gray900: '#111827',
  white: '#FFFFFF',
};

const btn = (type: string = 'default', size: string = 'md') => {
  const bgMap: Record<string, string> = { primary: T.teal, success: T.green, danger: T.red, ghost: 'transparent', default: T.gray100 };
  const colorMap: Record<string, string> = { primary: T.white, success: T.white, danger: T.white, ghost: T.gray600, default: T.gray800 };
  const padding = size === 'sm' ? '5px 10px' : '8px 14px';
  const fontSize = size === 'sm' ? 14 : 15;
  return {
    padding, fontSize, background: bgMap[type] || bgMap.default, color: colorMap[type] || colorMap.default,
    border: type === 'ghost' ? `1px solid ${T.gray200}` : 'none', borderRadius: 7,
    cursor: 'pointer' as const, fontWeight: 600, display: 'inline-flex', alignItems: 'center', transition: 'all 0.15s',
  };
};

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: `1px solid ${T.gray200}`, borderRadius: 7, fontSize: 14,
  outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: T.white,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: T.gray600, marginBottom: 6, display: 'block',
};

const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const fmt = (n: number) => `৳${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtN = (n: number) => (+n || 0).toLocaleString('en-IN');

interface ProductsScreenProps {
  products: any[];
  suppliers: any[];
  categories: any[];
  purchases: any[];
  productHistory: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  settings: any;
  currentUser?: any;
}

export default function ProductsScreen({ products, suppliers, categories, purchases, productHistory, setProducts, settings: _settings, currentUser: _currentUser }: ProductsScreenProps) {
  const { t } = useLanguage();
  const [productTab, setProductTab] = useState(() => localStorage.getItem('pos_product_tab') || 'allProducts');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [editProduct, setEditProduct] = useState<any>(null);
  const [viewProduct, setViewProduct] = useState<any>(null);

  const [viewPurchase, setViewPurchase] = useState<any>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [showDeleteHistory, setShowDeleteHistory] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [supplierSearch, setSupplierSearch] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '' });

  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '' });

  const [barcodeSearch, setBarcodeSearch] = useState('');

  const [stockSearch, setStockSearch] = useState('');
  const [stockAdjustProduct, setStockAdjustProduct] = useState<any>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState('');
  const [stockAdjustType, setStockAdjustType] = useState('add');
  const [stockAdjustReason, setStockAdjustReason] = useState('');

  useEffect(() => { localStorage.setItem('pos_product_tab', productTab); }, [productTab]);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  };

  const stockCount = products.filter((p: any) => p.stock > 0).length;
  const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;
  const lowStockCount = products.filter((p: any) => p.stock > 0 && p.stock <= ((p as any).minStock || 5)).length;
  const totalStockValue = products.reduce((s: number, p: any) => s + p.stock * p.costPrice, 0);

  const filteredProducts = products
    .filter((p: any) => {
      if (stockFilter === 'inStock' && p.stock <= 0) return false;
      if (stockFilter === 'outOfStock' && p.stock > 0) return false;
      if (stockFilter === 'lowStock' && (p.stock <= 0 || p.stock > ((p as any).minStock || 5))) return false;
      return !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.company || '').toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase()) || (p.cat || '').toLowerCase().includes(search.toLowerCase());
    })
    .sort((a: any, b: any) => {
      if (stockFilter === 'lowStock') return a.stock - b.stock;
      return a.name.localeCompare(b.name);
    });

  const allCompanies = [...new Set([...suppliers.map((s: any) => s.name).filter(Boolean), ...products.map((p: any) => p.company).filter(Boolean)])].sort();
  const filteredSuppliers = allCompanies.filter(c => !supplierSearch || (c || '').toLowerCase().includes(supplierSearch.toLowerCase()));
  const allCategories = [...new Set([...categories.map((c: any) => c.name).filter(Boolean), ...products.map((p: any) => p.cat).filter(Boolean)])].sort();
  const filteredCategories = allCategories.filter(c => !categorySearch || (c || '').toLowerCase().includes(categorySearch.toLowerCase()));
  const barcodeProducts = products.filter((p: any) => !barcodeSearch || (p.code || '').toLowerCase().includes(barcodeSearch.toLowerCase()) || (p.name || '').toLowerCase().includes(barcodeSearch.toLowerCase()));
  const stockProducts = products.filter((p: any) => !stockSearch || (p.name || '').toLowerCase().includes(stockSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(stockSearch.toLowerCase())).sort((a: any, b: any) => a.stock - b.stock);

  const handleEditProduct = () => {
    if (!editProduct) return;
    setProducts(products.map((p: any) => p.id === editProduct.id ? { ...p, costPrice: editProduct.buyP, sellPrice: editProduct.sellP } : p));
    setEditProduct(null);
  };

  const deleteProduct = (id: string) => {
    const product = products.find((p: any) => p.id === id);
    if (!product) return;
    if (!window.confirm(`"${product.name}" মুছে ফেলতে চান?`)) return;
    setProducts(products.filter((p: any) => p.id !== id));
  };

  const printBarcode = (product: any) => {
    const items = Array(6).fill(0).map(() => `<div class="barcode-item"><h4>${product.name}</h4><div class="code">${product.code || 'N/A'}</div><div class="price">${fmt(product.sellPrice)}</div></div>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px}.barcode-item{border:1px solid #ccc;padding:8px;text-align:center;width:200px}.barcode-item h4{font-size:11px;margin-bottom:4px}.barcode-item .code{font-family:monospace;font-size:14px;letter-spacing:2px}.barcode-item .price{font-size:12px;color:#666;margin-top:4px}</style></head><body>${items}</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 500); }
  };

  const printProductList = () => {
    const list = filteredProducts.length > 0 ? filteredProducts : products;
    const rows = list.map((p: any) => `<tr><td>${p.name}</td><td>${p.company || '-'}</td><td>${p.cat || '-'}</td><td>৳${p.costPrice.toLocaleString()}</td><td>৳${p.sellPrice.toLocaleString()}</td><td>${p.stock}</td><td>${p.unit}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:6px 5px;text-align:left;font-size:10px;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:6px 5px;font-size:11px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>📦 পণ্যের তালিকা</h1><p>${new Date().toLocaleDateString('bn-BD')} | ${list.length}টি পণ্য</p></div><table><thead><tr><th>নাম</th><th>কোম্পানি</th><th>ক্যাটাগরি</th><th>ক্রয়মূল্য</th><th>বিক্রয়মূল্য</th><th>স্টক</th><th>একক</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      if (lines.length < 2) { alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        items.push({
          id: genId(), name: row['পণ্যের নাম'] || row['name'] || '', code: row['বারকোড'] || row['barcode'] || '',
          company: row['কোম্পানি'] || row['company'] || '', cat: row['ক্যাটাগরি'] || row['category'] || '',
          unit: row['একক'] || row['unit'] || 'পিস', costPrice: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || '0'),
          sellPrice: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || '0'), stock: parseFloat(row['স্টক'] || row['stock'] || '0'),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || '5'), image: '', supplier: row['কোম্পানি'] || row['company'] || '', categoryId: '',
        });
      }
      const valid = items.filter(i => i.name);
      if (valid.length > 0) { setProducts((prev: any[]) => [...prev, ...valid]); alert(`✅ ${valid.length}টি পণ্য যোগ হয়েছে!`); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStockAdjust = () => {
    if (!stockAdjustProduct || !stockAdjustQty) return;
    const qty = parseInt(stockAdjustQty) || 0;
    if (qty <= 0) return;
    const newStock = stockAdjustType === 'add' ? stockAdjustProduct.stock + qty : Math.max(0, stockAdjustProduct.stock - qty);
    setProducts(products.map((p: any) => p.id === stockAdjustProduct.id ? { ...p, stock: newStock } : p));
    alert(`${stockAdjustProduct.name}: ${stockAdjustType === 'add' ? '+' : '-'}${qty} = ${newStock}`);
    setStockAdjustProduct(null); setStockAdjustQty(''); setStockAdjustReason('');
  };

  // ========== TAB RENDERERS ==========

  const renderAllProducts = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `📦 ${t('allProducts') || 'সব পণ্য'}`, count: products.length, bg: T.teal, bgLight: T.gray100 },
          { key: 'inStock', label: `✅ ${t('stockAvailable') || 'স্টক আছে'}`, count: stockCount, bg: T.green, bgLight: T.greenLight },
          { key: 'outOfStock', label: `❌ ${t('stockOut') || 'স্টক শেষ'}`, count: outOfStockCount, bg: T.red, bgLight: T.redLight },
          { key: 'lowStock', label: `⚠️ ${t('stockLow') || 'কম স্টক'}`, count: lowStockCount, bg: T.amber, bgLight: T.amberLight },
        ].map(f => (
          <button key={f.key} onClick={() => setStockFilter(f.key)} style={{ padding: '8px 14px', borderRadius: 7, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: stockFilter === f.key ? f.bg : f.bgLight, color: stockFilter === f.key ? T.white : T.gray600, whiteSpace: 'nowrap' }}>{f.label} ({f.count})</button>
        ))}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 150 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredProducts.length}টি</span>
      </div>
      <div style={{ padding: '8px 12px', display: 'flex', gap: 8, background: T.gray50, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap' }}>
        <button style={{ ...btn('primary', 'sm') }} onClick={() => alert('নতুন পণ্য ফর্ম শীঘ্রই আসছে')}>➕ নতুন পণ্য</button>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowImportModal(true)}>📥 CSV ইমপোর্ট</button>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowPriceHistory(true)}>📜 দামের ইতিহাস</button>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowDeleteHistory(true)}>🗑️ ডিলিট হিস্ট্রি</button>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowPurchaseHistory(true)}>📦 ক্রয় হিস্ট্রি</button>
        <button style={{ ...btn('ghost', 'sm') }} onClick={printProductList}>🖨️ প্রিন্ট</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.tealLight }}>
            {['পণ্যের নাম', 'কোম্পানি', 'ক্যাটাগরি', 'ক্রয়মূল্য', 'বিক্রয়মূল্য', 'লাভ', 'স্টক', 'একক', 'একশন'].map(h => (
              <th key={h} style={{ padding: '10px 12px', textAlign: h === 'স্টক' || h === 'একশন' || h === 'একক' ? 'center' : h === 'ক্রয়মূল্য' || h === 'বিক্রয়মূল্য' || h === 'লাভ' ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>পণ্য পাওয়া যায়নি</td></tr>
            ) : filteredProducts.map((p: any, i: number) => {
              const pct = p.costPrice > 0 ? Math.round((p.sellPrice - p.costPrice) / p.costPrice * 100) : 0;
              const low = p.stock > 0 && p.stock <= (p.minStock || 5);
              return (
                <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                  <td style={{ padding: '10px 12px' }}><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>{p.code && <div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{p.code}</div>}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{p.company || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{p.cat || '-'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, textAlign: 'right' }}>{fmt(p.costPrice)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14, textAlign: 'right' }}>{fmt(p.sellPrice)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right' }}><span style={{ fontSize: 13, fontWeight: 600, color: pct > 0 ? T.green : T.red }}>{fmt(p.sellPrice - p.costPrice)} ({pct}%)</span></td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ fontWeight: 700, fontSize: 15, color: p.stock <= 0 ? T.red : low ? T.amber : T.gray900 }}>{fmtN(p.stock)}</span>{low && ' ⚠️'}{p.stock <= 0 && ' ❌'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray400, textAlign: 'center' }}>{p.unit}</td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setViewProduct(p)}>👁️</button>
                    <button style={{ ...btn('primary', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setEditProduct({ ...p, buyP: p.costPrice, sellP: p.sellPrice })}>✏️</button>
                    {p.stock <= 0 ? <button style={{ ...btn('danger', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => deleteProduct(p.id)}>🗑️</button> : <button disabled style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13, opacity: 0.4, cursor: 'not-allowed' }}>🔒</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSupplier = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingSupplier(null); setSupplierForm({ name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '' }); setShowSupplierModal(true); }}>➕ নতুন সরবরাহকারী</button>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
          <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder="সরবরাহকারী খুঁজুন..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredSuppliers.length}টি সরবরাহকারী</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {filteredSuppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p>কোনো সরবরাহকারী পাওয়া যায়নি</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {filteredSuppliers.map((company: string) => {
              const prodCount = products.filter((p: any) => (p.company || '').toLowerCase() === company.toLowerCase()).length;
              const purchaseCount = purchases.filter((p: any) => (p.supplier || '').toLowerCase() === company.toLowerCase()).length;
              const totalPurchase = purchases.filter((p: any) => (p.supplier || '').toLowerCase() === company.toLowerCase()).reduce((s: number, p: any) => s + (p.items || []).reduce((ss: number, i: any) => ss + (i.stock || 0) * (i.costPrice || 0), 0), 0);
              return (
                <div key={company} style={{ padding: 16, background: T.white, borderRadius: 12, border: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏢</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{company}</div>
                      <div style={{ fontSize: 13, color: T.gray500, marginTop: 2 }}>📦 {prodCount}টি পণ্য | 🛒 {purchaseCount}টি ক্রয়</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: T.green, fontSize: 15 }}>{fmt(totalPurchase)}</div>
                    <div style={{ fontSize: 12, color: T.gray400 }}>মোট ক্রয়</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showSupplierModal && (
        <div style={overlay} onClick={() => setShowSupplierModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 450, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}>🏢 {editingSupplier ? 'সম্পাদনা' : 'নতুন সরবরাহকারী'}</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>নাম *</label><input value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>ফোন</label><input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>ইমেইল</label><input value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>ঠিকানা</label><input value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={labelStyle}>CR নম্বর</label><input value={supplierForm.crNumber} onChange={e => setSupplierForm({ ...supplierForm, crNumber: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>VAT নম্বর</label><input value={supplierForm.vatNumber} onChange={e => setSupplierForm({ ...supplierForm, vatNumber: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSupplierModal(false)} style={{ ...btn('ghost'), flex: 1 }}>বাতিল</button>
              <button onClick={() => { if (!supplierForm.name.trim()) { alert('নাম লিখুন!'); return; } alert(editingSupplier ? 'আপডেট হয়েছে!' : 'যোগ হয়েছে!'); setShowSupplierModal(false); }} style={{ ...btn('primary'), flex: 2 }}>💾 সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategory = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingCategory(null); setCategoryForm({ name: '' }); setShowCategoryModal(true); }}>➕ নতুন ক্যাটাগরি</button>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
          <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="ক্যাটাগরি খুঁজুন..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredCategories.length}টি ক্যাটাগরি</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}>📂</div><p>কোনো ক্যাটাগরি পাওয়া যায়নি</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
            {filteredCategories.map((cat: string) => {
              const catProducts = products.filter((p: any) => (p.cat || '').toLowerCase() === cat.toLowerCase());
              const totalValue = catProducts.reduce((s: number, p: any) => s + p.stock * p.sellPrice, 0);
              return (
                <div key={cat} style={{ padding: 16, background: T.white, borderRadius: 12, border: `1px solid ${T.gray200}`, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: T.teal }}>📂 {cat}</div>
                    <span style={{ background: T.tealLight, color: T.teal, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{catProducts.length}টি</span>
                  </div>
                  <div style={{ fontSize: 13, color: T.gray500 }}>মূল্য: {fmt(totalValue)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showCategoryModal && (
        <div style={overlay} onClick={() => setShowCategoryModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}>📂 {editingCategory ? 'সম্পাদনা' : 'নতুন ক্যাটাগরি'}</h3>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>ক্যাটাগরির নাম *</label><input value={categoryForm.name} onChange={e => setCategoryForm({ name: e.target.value })} style={inputStyle} placeholder="ক্যাটাগরির নাম লিখুন" /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ ...btn('ghost'), flex: 1 }}>বাতিল</button>
              <button onClick={() => { if (!categoryForm.name.trim()) { alert('নাম লিখুন!'); return; } alert(editingCategory ? 'আপডেট হয়েছে!' : 'যোগ হয়েছে!'); setShowCategoryModal(false); }} style={{ ...btn('primary'), flex: 2 }}>💾 সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBarcode = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>📊</span>
          <input value={barcodeSearch} onChange={e => setBarcodeSearch(e.target.value)} placeholder="বারকোড বা পণ্যের নাম লিখুন..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{barcodeProducts.length}টি পণ্য</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {barcodeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}>📊</div><p>কোনো পণ্য পাওয়া যায়নি</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {barcodeProducts.map((p: any) => (
              <div key={p.id} style={{ padding: 16, background: T.white, borderRadius: 12, border: `1px solid ${T.gray200}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                    <div style={{ fontSize: 13, color: T.gray500 }}>{p.company || '-'}</div>
                  </div>
                  <button style={{ ...btn('primary', 'sm') }} onClick={() => printBarcode(p)}>🖨️ প্রিন্ট</button>
                </div>
                <div style={{ background: T.gray50, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px dashed ${T.gray300}` }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 24, letterSpacing: 4, fontWeight: 700 }}>{p.code || 'N/A'}</div>
                  <div style={{ fontSize: 12, color: T.gray400, marginTop: 4 }}>বারকোড</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 14, color: T.gray500 }}>ক্রয়: {fmt(p.costPrice)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.teal }}>বিক্রয়: {fmt(p.sellPrice)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStock = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: T.tealLight, borderBottom: `1px solid ${T.gray200}`, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: T.gray500 }}>মোট পণ্য</div><div style={{ fontSize: 20, fontWeight: 700, color: T.teal }}>{products.length}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: T.gray500 }}>স্টক আছে</div><div style={{ fontSize: 20, fontWeight: 700, color: T.green }}>{stockCount}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: T.gray500 }}>স্টক শেষ</div><div style={{ fontSize: 20, fontWeight: 700, color: T.red }}>{outOfStockCount}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: T.gray500 }}>কম স্টক</div><div style={{ fontSize: 20, fontWeight: 700, color: T.amber }}>{lowStockCount}</div></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 12, color: T.gray500 }}>মোট মূল্য</div><div style={{ fontSize: 20, fontWeight: 700, color: T.teal }}>{fmt(totalStockValue)}</div></div>
      </div>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
          <input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{stockProducts.length}টি</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.tealLight }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>পণ্যের নাম</th>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>কোম্পানি</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>বর্তমান স্টক</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>মিনিমাম</th>
            <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>মূল্য</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>স্ট্যাটাস</th>
            <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>একশন</th>
          </tr></thead>
          <tbody>
            {stockProducts.map((p: any, i: number) => {
              const low = p.stock > 0 && p.stock <= (p.minStock || 5);
              const status = p.stock <= 0 ? 'out' : low ? 'low' : 'ok';
              return (
                <tr key={p.id} style={{ background: status === 'out' ? T.redLight : status === 'low' ? T.amberLight : i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}>{p.name}<div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{p.code || '-'}</div></td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{p.company || '-'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ fontWeight: 700, fontSize: 18, color: status === 'out' ? T.red : status === 'low' ? T.amber : T.green }}>{fmtN(p.stock)}</span></td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, color: T.gray500 }}>{p.minStock || 5}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14 }}>{fmt(p.stock * p.costPrice)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, background: status === 'out' ? T.redLight : status === 'low' ? T.amberLight : T.greenLight, color: status === 'out' ? T.red : status === 'low' ? T.amber : T.green }}>
                      {status === 'out' ? 'স্টক শেষ' : status === 'low' ? 'কম স্টক' : 'স্টক আছে'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button style={{ ...btn('primary', 'sm') }} onClick={() => { setStockAdjustProduct(p); setStockAdjustQty(''); setStockAdjustType('add'); setStockAdjustReason(''); }}>⚙️ সমন্বয়</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stockAdjustProduct && (
        <div style={overlay} onClick={() => setStockAdjustProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}>⚙️ স্টক সমন্বয়</h3>
            <div style={{ background: T.gray50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{stockAdjustProduct.name}</div>
              <div style={{ fontSize: 14, color: T.gray500 }}>বর্তমান স্টক: <strong>{stockAdjustProduct.stock}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setStockAdjustType('add')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${stockAdjustType === 'add' ? T.green : T.gray200}`, background: stockAdjustType === 'add' ? T.greenLight : T.white, color: stockAdjustType === 'add' ? T.green : T.gray600, fontWeight: 700, cursor: 'pointer' }}>➕ যোগ করুন</button>
              <button onClick={() => setStockAdjustType('remove')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${stockAdjustType === 'remove' ? T.red : T.gray200}`, background: stockAdjustType === 'remove' ? T.redLight : T.white, color: stockAdjustType === 'remove' ? T.red : T.gray600, fontWeight: 700, cursor: 'pointer' }}>➖ বাদ দিন</button>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>পরিমাণ</label><input type="number" value={stockAdjustQty} onChange={e => setStockAdjustQty(e.target.value)} style={inputStyle} placeholder="পরিমাণ লিখুন" min="1" /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>কারণ</label><input value={stockAdjustReason} onChange={e => setStockAdjustReason(e.target.value)} style={inputStyle} placeholder="সমন্বয়ের কারণ (ঐচ্ছিক)" /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStockAdjustProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>বাতিল</button>
              <button onClick={handleStockAdjust} style={{ ...btn('primary'), flex: 2 }}>✅ সমন্বয় করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const overlayModal = (title: string, onClose: () => void, content: React.ReactNode) => (
    <div style={overlay} onClick={onClose}>
      <div style={{ background: T.white, borderRadius: 12, width: '90vw', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: T.teal }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{content}</div>
      </div>
    </div>
  );

  // ========== MAIN RENDER ==========
  const tabs = [
    { id: 'allProducts', icon: '📦', label: 'অল পোডাক্ট' },
    { id: 'suppliers', icon: '🏢', label: 'সাপ্লাইয়ার' },
    { id: 'categories', icon: '📂', label: 'ক্যাটাগরি' },
    { id: 'barcode', icon: '📊', label: 'বারকোড' },
    { id: 'stock', icon: '🏭', label: 'স্টক' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tab Bar */}
      <div style={{ padding: '8px 16px', background: '#F5F5F5', borderBottom: `1px solid ${T.gray200}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setProductTab(tab.id)} style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === tab.id ? T.teal : T.white,
            color: productTab === tab.id ? T.white : T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {productTab === 'allProducts' && renderAllProducts()}
        {productTab === 'suppliers' && renderSupplier()}
        {productTab === 'categories' && renderCategory()}
        {productTab === 'barcode' && renderBarcode()}
        {productTab === 'stock' && renderStock()}
      </div>

      {/* Modals */}
      {editProduct && (
        <div style={overlay} onClick={() => setEditProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}>✏️ দাম সম্পাদনা</h3>
            <div style={{ marginBottom: 12 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{editProduct.name}</div><div style={{ fontSize: 13, color: T.gray400 }}>{editProduct.company} - {editProduct.cat || '-'}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>ক্রয়মূল্য (৳)</label><input type="number" value={editProduct.buyP} onChange={e => setEditProduct({ ...editProduct, buyP: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>বিক্রয়মূল্য (৳)</label><input type="number" value={editProduct.sellP} onChange={e => setEditProduct({ ...editProduct, sellP: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: 10 }}><button onClick={() => setEditProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>বাতিল</button><button onClick={handleEditProduct} style={{ ...btn('primary'), flex: 2 }}>💾 সংরক্ষণ</button></div>
          </div>
        </div>
      )}

      {viewProduct && (
        <div style={overlay} onClick={() => setViewProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}>📋 পণ্যের বিবরণ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[['পণ্যের নাম', viewProduct.name], ['বারকোড', viewProduct.code || '-'], ['কোম্পানি', viewProduct.company || '-'], ['ক্যাটাগরি', viewProduct.cat || '-'], ['ক্রয়মূল্য', fmt(viewProduct.costPrice)], ['বিক্রয়মূল্য', fmt(viewProduct.sellPrice)], ['স্টক', `${viewProduct.stock} ${viewProduct.unit}`], ['মিনিমাম স্টক', `${viewProduct.minStock || 5} ${viewProduct.unit}`]].map(([label, value]) => (
                <div key={label}><div style={{ fontSize: 13, color: T.gray400, marginBottom: 4 }}>{label}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div></div>
              ))}
            </div>
            <button onClick={() => setViewProduct(null)} style={{ ...btn(), width: '100%' }}>বন্ধ করুন</button>
          </div>
        </div>
      )}

      {showPriceHistory && overlayModal('📜 দামের ইতিহাস', () => setShowPriceHistory(false), (
        <div>{productHistory.length === 0 ? <p style={{ textAlign: 'center', color: T.gray400, padding: 20 }}>কোনো দাম পরিবর্তনের ইতিহাস নেই</p> : productHistory.map((h: any, i: number) => (
          <div key={i} style={{ padding: 10, background: T.gray50, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><div><strong>{h.productName || h.name}</strong><div style={{ fontSize: 12, color: T.gray500 }}>{new Date(h.timestamp || h.date).toLocaleString('bn-BD')}</div></div><div style={{ textAlign: 'right' }}>{h.oldPrice && <div style={{ textDecoration: 'line-through', color: T.red }}>{fmt(h.oldPrice)}</div>}{h.newPrice && <div style={{ color: T.green, fontWeight: 700 }}>{fmt(h.newPrice)}</div>}</div></div>
        ))}</div>
      ))}

      {showDeleteHistory && overlayModal('🗑️ ডিলিট হিস্ট্রি', () => setShowDeleteHistory(false), (
        <div><p style={{ textAlign: 'center', color: T.gray400, padding: 20 }}>ডিলিট করা পণ্যের তালিকা এখানে দেখা যাবে</p></div>
      ))}

      {showPurchaseHistory && (
        <div style={overlay} onClick={() => setShowPurchaseHistory(false)}>
          <div style={{ background: T.white, borderRadius: 12, width: '90vw', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: T.teal }}>📦 ক্রয় হিস্ট্রি</h3>
              <button onClick={() => setShowPurchaseHistory(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}>✕</button>
            </div>
            <div style={{ padding: 20 }}>
              {purchases.length === 0 ? <p style={{ textAlign: 'center', color: T.gray400 }}>কোনো ক্রয় রেকর্ড নেই</p> : [...purchases].reverse().map((p: any) => {
                const totalCost = (p.items || []).reduce((s: number, i: any) => s + (i.stock || 0) * (i.costPrice || 0), 0);
                return (
                  <div key={p.id} onClick={() => setViewPurchase(p)} style={{ padding: 14, background: T.gray50, borderRadius: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${T.gray200}` }}>
                    <div><div style={{ fontWeight: 700, color: T.teal, fontSize: 14 }}>{p.id}</div><div style={{ fontSize: 13, color: T.gray500, marginTop: 2 }}>{new Date(p.date).toLocaleDateString('bn-BD')} - {p.supplier}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, color: T.green }}>{fmt(totalCost)}</div><div style={{ fontSize: 13, color: T.gray500 }}>{(p.items || []).length}টি পণ্য</div></div>
                  </div>
                );
              })}
            </div>
            {viewPurchase && (
              <div style={{ padding: 20, borderTop: `2px solid ${T.gray200}` }}>
                <h4 style={{ margin: '0 0 12px', color: T.teal }}>{viewPurchase.id} - বিস্তারিত</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: T.gray50 }}><th style={{ padding: 8, textAlign: 'left', fontSize: 13 }}>পণ্য</th><th style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>পরিমাণ</th><th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>দাম</th><th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>মোট</th></tr></thead>
                  <tbody>{(viewPurchase.items || []).map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.gray100}` }}><td style={{ padding: 10, fontSize: 14 }}>{item.name}<div style={{ fontSize: 12, color: T.gray400 }}>{item.company}</div></td><td style={{ padding: 10, textAlign: 'center' }}>{item.stock} {item.unit}</td><td style={{ padding: 10, textAlign: 'right' }}>{fmt(item.costPrice)}</td><td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{fmt((item.stock || 0) * (item.costPrice || 0))}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showImportModal && overlayModal('📥 CSV ইমপোর্ট', () => setShowImportModal(false), (
        <div>
          <div style={{ border: `2px dashed ${T.gray300}`, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <p style={{ color: T.gray600, marginBottom: 12 }}>CSV ফাইল নির্বাচন করুন</p>
            <label style={{ ...btn('primary'), cursor: 'pointer' }}>
              📂 ফাইল নির্বাচন
              <input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ background: T.gray50, borderRadius: 8, padding: 12, fontSize: 13, color: T.gray600 }}>
            <strong>CSV ফরম্যাট:</strong> পণ্যের নাম, কোম্পানি, ক্যাটাগরি, বারকোড, একক, ক্রয়মূল্য, বিক্রয়মূল্য, স্টক, মিনস্টক
          </div>
        </div>
      ))}
    </div>
  );
}
