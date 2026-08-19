import { useState, useEffect, useRef } from 'react';
import './index.css';
import { useLanguage, languages } from './i18n';
import SettingsScreen from './pages/SettingsScreen';
import SuppliersScreen from './pages/SuppliersScreen';
import CustomerManagement from './pages/CustomerManagement';
import { db } from './utils/db';
import { localDb } from './services';

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

// Generate General Customer ID: GC + timestamp
const generateGeneralCustomerId = () => {
  return 'GC' + Date.now();
};

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
<div class="header"><h1>📦 পণ্যের তালিকা</h1><p>${new Date().toLocaleDateString('bn-BD')} | ${printFiltered.length}টি পণ্য</p></div>
<table><thead><tr><th>পণ্যের নাম</th><th>কোম্পানি</th><th>ক্যাটাগরি</th><th>ক্রয়মূল্য</th><th>বিক্রয়মূল্য</th><th>স্টক</th><th>একক</th></tr></thead><tbody>
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
          <button style={btn()} onClick={() => setShowPurchaseHistory(false)}>← ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}>📦 ক্রয় হিস্ট্রি</span>
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
                      <div style={{ fontSize: 14, color: T.gray500 }}>{p.items.length}টি পণ্য - {p.items.reduce((s: number, i: any) => s + i.stock, 0)} একক</div>
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
                    <div style={{ fontSize: 14, color: T.gray500, marginTop: 4 }}>📅 {new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
                    <div style={{ fontSize: 15, marginTop: 4 }}>🏢 সরবরাহকারী: {viewPurchase.supplier}</div>
                  </div>
                  <button onClick={() => setViewPurchase(null)} style={{ ...btn('ghost', 'sm'), padding: '6px 12px', fontSize: 14 }}>✕</button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.gray50 }}>
                    <th style={{ padding: 8, textAlign: 'left', fontSize: 14, color: T.gray600 }}>পণ্যের নাম</th>
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
          <button style={btn()} onClick={() => { setShowAddForm(false); setPurchaseItems([]); setCsvData([]); }}>← ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}>📦 নতুন পণ্য সংরক্ষণ</span>
          <span style={{ fontSize: 14, color: T.gray500, marginLeft: 'auto' }}>{purchaseItems.length}টি পণ্য যোগ হয়েছে</span>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left: Form */}
          <div style={{ flex: 1, padding: 16, overflow: 'auto', borderRight: `1px solid ${T.gray200}` }}>
            {/* CSV Import Section */}
            <div style={{ ...cardStyle, padding: 16, marginBottom: 16, background: T.tealLight, border: `1px dashed ${T.teal}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, color: T.teal }}>📥 CSV ইম্পোর্ট করুন</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input type="file" accept=".csv" onChange={handleCsvImport} id="csvInput" style={{ display: 'none' }} />
                  <label htmlFor="csvInput" style={{ ...btn('primary'), cursor: 'pointer', fontSize: 15, padding: '10px 20px' }}>
                    📁 পণ্যের CSV আপলোড করুন
                  </label>
                  <button onClick={downloadDemoCSV} style={{ ...btn('ghost'), fontSize: 14, padding: '8px 16px' }}>
                    📥 ডেমো CSV ডাউনলোড
                  </button>
                </div>
              </div>
              {csvData.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 14, color: T.teal, fontWeight: 600 }}>
                  ✓ {csvData.length}টি পণ্য আপলোড হয়েছে
                </div>
              )}
            </div>

            <div style={{ ...cardStyle, padding: 16 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: T.teal }}>পণ্য যোগ করুন</h3>

              {/* Supplier/Company */}
              <div style={{ marginBottom: 12, position: 'relative' }}>
                <label style={labelStyle}>🏢 সরবরাহকারী *</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={supplierQ}
                    onChange={e => { setSupplierQ(e.target.value); setForm(f => ({ ...f, company: e.target.value })); setShowCompanyList(true); }}
                    onFocus={() => setShowCompanyList(true)}
                    placeholder="সরবরাহকারী নাম..."
                    style={{ ...inputStyle, flex: 1, fontSize: 15 }}
                  />
                  <button type="button" onClick={() => setShowCompanyList(!showCompanyList)} style={{ ...btn('ghost'), padding: '4px 5px', fontSize: 14 }}>▼</button>
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
                <label style={labelStyle}>📂 ক্যাটাগরি</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={form.cat}
                    onChange={e => { setForm(f => ({ ...f, cat: e.target.value })); setShowCategoryList(true); }}
                    onFocus={() => setShowCategoryList(true)}
                    placeholder="ক্যাটাগরি..."
                    style={{ ...inputStyle, flex: 1, fontSize: 15 }}
                  />
                  <button type="button" onClick={() => setShowCategoryList(!showCategoryList)} style={{ ...btn('ghost'), padding: '4px 5px', fontSize: 14 }}>▼</button>
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
                <label style={labelStyle}>📦 পণ্যের নাম *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="পণ্যের নাম..."
                  style={{ ...inputStyle, fontSize: 15 }}
                />
              </div>

              {/* Barcode */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>🔢 বারকোড</label>
                <input
                  value={barcodeVal}
                  onChange={e => { setBarcodeVal(e.target.value); setForm(f => ({ ...f, code: e.target.value })); }}
                  placeholder="বারকোড..."
                  style={{ ...inputStyle, fontSize: 15 }}
                />
              </div>

              {/* Unit */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>📥 একক</label>
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
                  <label style={labelStyle}>💰 ক্রয়মূল্য</label>
                  <input type="number" value={form.buyP} onChange={e => setForm(f => ({ ...f, buyP: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>💵 বিক্রয়মূল্য</label>
                  <input type="number" value={form.sellP} onChange={e => setForm(f => ({ ...f, sellP: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>📊 স্টক</label>
                  <input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" style={inputStyle} />
                </div>
              </div>

              {/* Min Stock */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>⚠️ মিনিমাম স্টক</label>
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
              >
                ➕ পণ্য তালিকায় যোগ করুন
              </button>
            </div>
          </div>

          {/* Right: Items List */}
          <div style={{ width: 400, display: 'flex', flexDirection: 'column', background: T.gray50 }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 24 }}>📋 পণ্যের তালিকা ({purchaseItems.length})</span>
              {purchaseItems.length > 0 && (
                <button
                  onClick={() => {
                    const newProducts = [...products, ...purchaseItems];
                    setProducts(newProducts);
                    setPurchaseItems([]);
                    setCsvData([]);
                    setShowAddForm(false);
                    alert(`✅ ${purchaseItems.length}টি পণ্য সংরক্ষিত হয়েছে!`);
                  }}
                  style={{ ...btn('success'), padding: '8px 16px', fontSize: 15 }}
                >
                  💾 সব সংরক্ষণ
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
                      >
                        ✕
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
          <button style={btn()} onClick={() => setProductTab('list')}>← ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}>📜 পণ্যের দাম পরিবর্তনের ইতিহাস</span>
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
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>তারিখ ও সময়</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>পণ্যের নাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>পরিবর্তনের ধরন</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>পুরাতন দাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>নতুন দাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>ব্যবহারকারী</th>
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
                          {h.type === 'price_buy' && <span style={{ background: T.orangeLight, color: T.orange, padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>ক্রয়মূল্য</span>}
                          {h.type === 'price_sell' && <span style={{ background: T.tealLight, color: T.teal, padding: '3px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>বিক্রয়মূল্য</span>}
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
          <button style={btn()} onClick={() => setProductTab('list')}>← ফিরে যান</button>
          <span style={{ fontWeight: 800, fontSize: 24 }}>🗑️ পণ্য ডিলিটের তালিকা</span>
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
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.red }}>তারিখ ও সময়</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.red }}>পণ্যের নাম</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.red }}>কোম্পানি</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.red }}>ডিলিটের সময় স্টক</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.red }}>ব্যবহারকারী</th>
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
      {/* Header */}
      <div style={{ padding: '12px 16px', background: T.white, borderBottom: `1px solid ${T.gray200}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={btn('primary')} onClick={() => setShowAddForm(true)}>➕ নতুন পণ্য</button>
        <button style={btn('ghost')} onClick={() => setShowPurchaseHistory(true)}>📦 ক্রয় হিস্ট্রি</button>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <button
            onClick={() => setProductTab('history')}
            style={{ ...btn('ghost'), fontSize: 14, padding: '6px 12px' }}
          >
            📜 দামের ইতিহাস
          </button>
          <button
            onClick={() => setProductTab('deleted')}
            style={{ ...btn('ghost'), fontSize: 14, padding: '6px 12px' }}
          >
            🗑️ ডিলিট লিস্ট
          </button>
        </div>
      </div>
      
      {/* Product Sub-Menu */}
      <div style={{ padding: '8px 16px', background: '#F5F5F5', borderBottom: `1px solid ${T.gray200}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setProductTab('list')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'list' ? T.teal : T.white,
            color: productTab === 'list' ? T.white : T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          📦 Products
        </button>
        <button
          onClick={() => setShowAddForm(true)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: T.white, color: T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          ➕ New Product
        </button>
        <button
          onClick={() => setProductTab('suppliers')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'suppliers' ? T.teal : T.white,
            color: productTab === 'suppliers' ? T.white : T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          🏢 Suppliers
        </button>
        <button
          onClick={() => setProductTab('barcode')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'barcode' ? T.teal : T.white,
            color: productTab === 'barcode' ? T.white : T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          📊 Barcode
        </button>
        <button
          onClick={() => setProductTab('inventory')}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: productTab === 'inventory' ? T.teal : T.white,
            color: productTab === 'inventory' ? T.white : T.gray600,
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          🏭 Stock
        </button>
      </div>

      {/* Filters - Only show for list tab */}
      {productTab === 'list' && (
        <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap' }}>
          <button onClick={() => setStockFilter('স্টক আছে')} style={{
            ...btn(stockFilter === 'স্টক আছে' ? 'primary' : 'ghost', 'sm'),
            borderRadius: 7, whiteSpace: 'nowrap',
            background: stockFilter === 'স্টক আছে' ? T.teal : T.gray100,
            color: stockFilter === 'স্টক আছে' ? T.white : T.gray600,
            border: 'none', padding: '8px 14px', fontSize: 15,
          }}>📦 স্টক আছে ({stockCount})</button>

          <button onClick={() => setStockFilter('স্টক শেষ')} style={{
            ...btn(stockFilter === 'স্টক শেষ' ? 'primary' : 'ghost', 'sm'),
            borderRadius: 7, whiteSpace: 'nowrap',
            background: stockFilter === 'স্টক শেষ' ? T.red : T.redLight,
            color: stockFilter === 'স্টক শেষ' ? T.white : T.red,
            border: 'none', padding: '8px 14px', fontSize: 15,
          }}>⚠️ স্টক শেষ ({outOfStockCount})</button>

          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 150 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="পণ্য খুঁজুন..."
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
          <button style={btn('ghost')} onClick={printProductList}>🖨️ প্রিন্ট</button>
          <span style={{ fontSize: 14, color: T.gray400, marginLeft: 'auto' }}>{filtered.length}টি পণ্য</span>
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
              <div style={{ fontSize: 14, color: T.gray500 }}>পণ্যের তালিকা লোড হচ্ছে...</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: `1px solid ${T.gray200}` }}>
              <thead>
                <tr style={{ background: T.tealLight }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal, letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>পণ্যের নাম</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>কোম্পানি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>ক্যাটাগরি</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>ক্রয়মূল্য</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>বিক্রয়মূল্য</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.teal }}>লাভ</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>স্টক</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>একক</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: T.teal }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>পণ্য পাওয়া যায়নি</td></tr>
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
                        {isLowStock && <span style={{ fontSize: 14, color: T.red, marginLeft: 4 }}>⚠️</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray400 }}>{p.unit}</td>
                      <td style={{ padding: '10px 12px', display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button style={{ ...btn('ghost', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => setViewProduct(p)} title="দেখুন">👁️</button>
                        <button style={{ ...btn('primary', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => setEditProduct({ ...p, buyP: p.costPrice, sellP: p.sellPrice })} title="সম্পাদনা">✏️</button>
                        {p.stock <= 0 ? (
                          <button style={{ ...btn('danger', 'sm'), padding: '5px 8px', fontSize: 14 }} onClick={() => del(p.id)} title="মুছুন">🗑️</button>
                        ) : (
                          <button disabled style={{ ...btn('ghost', 'sm'), padding: '5px 8px', fontSize: 14, opacity: 0.4, cursor: 'not-allowed' }} title="স্টক থাকলে মুছা যাবে না">🔒</button>
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <h3 style={{ margin: '0 0 8px', color: T.teal }}>Suppliers</h3>
            <p style={{ color: T.gray500 }}>সরবরাহকারীদের তালিকা এখানে দেখা যাবে</p>
          </div>
        </div>
      )}

      {/* Barcode Tab Content */}
      {productTab === 'barcode' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ margin: '0 0 8px', color: T.teal }}>Barcode</h3>
            <p style={{ color: T.gray500 }}>বারকোড জেনারেটর এখানে দেখা যাবে</p>
          </div>
        </div>
      )}

      {/* Inventory/Stock Tab Content */}
      {productTab === 'inventory' && (
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏭</div>
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
              <h3 style={{ margin: 0, fontSize: 16, color: T.teal }}>✏️ পণ্যের দাম সম্পাদনা</h3>
              <button onClick={() => setEditProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}>✕</button>
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
              <button onClick={handleEditProduct} style={{ ...btn('primary'), flex: 2 }}>💾 সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* View Product Modal */}
      {viewProduct && (
        <div style={overlay}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: T.teal }}>📋 পণ্যের বিবরণ</h3>
              <button onClick={() => setViewProduct(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>পণ্যের নাম</div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{viewProduct.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>বারকোড</div>
                <div style={{ fontFamily: 'monospace', fontSize: 15 }}>{viewProduct.code || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>কোম্পানি</div>
                <div style={{ fontSize: 15 }}>{viewProduct.company || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>ক্যাটাগরি</div>
                <div style={{ fontSize: 15 }}>{viewProduct.cat || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>ক্রয়মূল্য</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.orange }}>{fmt(viewProduct.costPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>বিক্রয়মূল্য</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: T.teal }}>{fmt(viewProduct.sellPrice)}</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: T.gray400, marginBottom: 4 }}>স্টক</div>
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

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
  deposit: number;
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
            }}>
              ⚠️ {error}
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

  // Tabs configuration
  const otherTabs = [
    { id: 'products', icon: '📦', label: t('products') },
    { id: 'customers', icon: '👥', label: t('customers') },
    { id: 'income', icon: '💰', label: t('incomeExpenses') },
    { id: 'reports', icon: '📊', label: t('reports') },
    { id: 'settings', icon: '⚙️', label: t('settings') },
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
      const savedProducts = await db.getAll<any>('products');
      if (savedProducts && savedProducts.length > 0) {
        setProducts(savedProducts);
      }
      
      const savedCategories = await db.getAll<any>('categories');
      if (savedCategories && savedCategories.length > 0) {
        setCategories(savedCategories);
      }
      
      const savedCustomers = await db.getAll<any>('customers');
      if (savedCustomers && savedCustomers.length > 0) {
        setCustomers(savedCustomers);
      } else {
        // Create General Customer (System) if no customers exist
        const generalCustomer: Customer = {
          id: generateGeneralCustomerId(),
          name: 'General Customer',
          phone: '',
          address: '',
          balance: 0,
          deposit: 0,
        };
        setCustomers([generalCustomer]);
        await db.put('customers', generalCustomer.id, generalCustomer);
      }
      
      const savedSales = await db.getAll<any>('sales');
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
  const hasFilter = searchQuery || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockFilter !== 'all';
  const filteredProducts = hasFilter ? products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSupplier = selectedSupplier === 'all' || (p.supplier || '') === selectedSupplier;
    const matchSearch = !searchQuery || 
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStock = 
      stockFilter === 'all' ||
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

    if (due > 0 && !selectedCustomer) {
      alert('⚠️ ' + t('selectCustomerOrPayFull'));
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
              <button onClick={() => scrollMenu('left')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}>◀</button>

              {/* Menu Items Container */}
              <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto', gap: 2, padding: '4px 5px', background: '#F5F5F5', borderRadius: 12, border: '1px solid #E0E0E0', scrollbarWidth: 'none', msOverflowStyle: 'none', flexShrink: 0 }}>
                <button onClick={() => setCurrentTab('pos')} style={{
                  padding: '5px 10px',
                  border: 'none',
                  background: currentTab === 'pos' ? '#E0E0E0' : 'transparent',
                  cursor: 'pointer',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  borderRadius: 6,
                }}>
                  <span style={{ fontSize: 16 }}>🛒</span>
                  <span>{t('sales')}</span>
                </button>
                {otherTabs.map((t) => (
                  <button key={t.id} onClick={() => setCurrentTab(t.id)} style={{
                    padding: '5px 10px',
                    border: 'none',
                    background: currentTab === t.id ? '#E0E0E0' : 'transparent',
                    cursor: 'pointer',
                    color: '#000000',
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
              <button onClick={() => scrollMenu('right')} style={{ width: 28, height: 28, border: 'none', background: '#F3F4F6', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4B5563', flexShrink: 0 }}>▶</button>
            </div>
          </div>

          {/* Actions Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
            {/* Refresh Button */}
            <button onClick={handleHardRefresh} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#4B5563' }} title="🔄 হার্ড রিফ্রেশ">🔄</button>
            
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
              >
                🌐 {currentLang.flag} {currentLang.nativeName}
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
                      {language === lang.code && <span style={{ marginLeft: 'auto' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Logout Button */}
            <button onClick={handleLogout} style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all 0.2s', color: '#6B7280' }} title="লগআউট">↩️</button>

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
                      <span style={{ fontSize: 16 }}>📦</span>
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
                      <span style={{ fontSize: 16 }}>👤</span>
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
                      <option value="all">📋 {t('allSuppliers')}</option>
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
                      <option value="all">📁 {t('allCategories')}</option>
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
                      <span style={{ fontSize: 14 }}>📦</span>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'available' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📦</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'low' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚠️</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: stockFilter === 'out' ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🚫</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showExpiryList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📅</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showCustomerList ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👥</div>
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
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: showHeldSales ? 'rgba(255,255,255,0.25)' : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📋</div>
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
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}>📋 {t('holdSales')} ({heldSales.length})</span>
                      </div>

                      {/* Clear All Button - Right Side */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
                        <button 
                          onClick={() => setShowHeldSales(false)}
                          style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                          ✕ {t('close')}
                        </button>
                      </div>
                    </div>

                    {/* Hold Sales Cards */}
                    {heldSales.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>📋</div>
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
                                <span style={{ fontSize: 16 }}>📋</span>
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
                                🗑️
                              </button>
                            </div>
                            
                            {/* Card Body - Items Summary */}
                            <div style={{ padding: '8px 12px' }}>
                              {sale.items.slice(0, 3).map((item, itemIdx) => (
                                <div key={itemIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: itemIdx < Math.min(sale.items.length - 1, 2) ? '1px dashed #E5E7EB' : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16 }}>📦</span>
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
                                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EA580C', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, boxShadow: '0 2px 6px rgba(234,88,12,0.3)' }}>
                                ➕ {t('addItems')}
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
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#4338CA' }}>🔍 "{searchQuery}" ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Category Filter */}
                        {selectedCategory !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#F0FDFA', borderRadius: 20, border: '1px solid #99F6E4' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#115E59' }}>📁 {categories.find(c => c.id === selectedCategory)?.name} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Supplier Filter */}
                        {selectedSupplier !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: '#FEF3C7', borderRadius: 20, border: '1px solid #FDE68A' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706' }}>📋 {selectedSupplier} ({filteredProducts.length})</span>
                          </div>
                        )}
                        
                        {/* Stock Filter */}
                        {stockFilter !== 'all' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', background: stockFilter === 'available' ? '#F0FDFA' : stockFilter === 'low' ? '#FFF7ED' : '#FEF2F2', borderRadius: 20, border: `1px solid ${stockFilter === 'available' ? '#99F6E4' : stockFilter === 'low' ? '#FDBA74' : '#FECACA'}` }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: stockFilter === 'available' ? '#115E59' : stockFilter === 'low' ? '#EA580C' : '#DC2626' }}>
                              {stockFilter === 'available' && '📦 ' + t('stockAvailable') + ` (${filteredProducts.length})`}
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
                            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#DC2626', cursor: 'pointer', fontSize: 12, color: 'white', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            ✕ {t('close')}
                          </button>
                        </div>
                      </div>
                    )}
                  
                    {/* Customer Profile Card - Show when searched */}
                    {searchedCustomer && (
                      <div style={{ marginBottom: 12, padding: 16, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                          👤
                        </div>
                        <div style={{ flex: 1, color: '#fff' }}>
                          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{searchedCustomer.name}</div>
                          <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 2 }}>📱 {searchedCustomer.phone}</div>
                          <div style={{ fontSize: 13, opacity: 0.9 }}>📍 {searchedCustomer.address}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ padding: '8px 16px', background: searchedCustomer.balance > 0 ? 'rgba(220,38,38,0.3)' : 'rgba(34,197,94,0.3)', borderRadius: 8, marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: '#fff', opacity: 0.9 }}>{t('balance')}</div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>৳{searchedCustomer.balance}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button 
                              onClick={() => { setSelectedCustomer(searchedCustomer); setCustomerSearch(''); }}
                              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#fff', color: '#667eea', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              ✓ {t('selectCustomer')}
                            </button>
                            <button 
                              onClick={() => setCustomerSearch('')}
                              style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                              ✕
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
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📅</div>
                            <h3 style={{ fontSize: 14, fontWeight: 400, color: '#115E59', margin: 0 }}>{t('productExpiry')} ({products.filter(p => p.expiryDate && new Date(p.expiryDate) > new Date() && new Date(p.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length})</h3>
                          </div>
                          <button onClick={() => setShowExpiryList(false)} style={{ padding: '6px 12px', borderRadius: 6, background: '#DC2626', border: 'none', fontSize: 12, cursor: 'pointer', color: 'white', fontWeight: 600 }}>✕ {t('close')}</button>
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
                                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>📅 {p.expiryDate}</div>
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
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#14B8A6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👥</div>
                            <h3 style={{ fontSize: 14, fontWeight: 400, color: '#115E59', margin: 0 }}>{t('customers')} ({customers.length})</h3>
                          </div>
                          <button onClick={() => setShowCustomerList(false)} style={{ padding: '6px 12px', borderRadius: 6, background: '#DC2626', border: 'none', fontSize: 12, cursor: 'pointer', color: 'white', fontWeight: 600 }}>✕ {t('close')}</button>
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
                                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>📱 {c.phone}</div>
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
                          <span style={{ fontSize: 48 }}>🛒</span>
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
                            <span style={{ fontSize: 16 }}>▣</span>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#115E59', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>🛒 {t('cart')}</h3>
                  <span style={{ background: '#115E59', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 14, fontWeight: 600 }}>{cart.length}</span>
                </div>
                {/* Customer Input with Add Button */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    {selectedCustomer ? (
                      <div style={{ 
                        padding: '8px 12px', 
                        borderRadius: 8, 
                        border: '1.5px solid #10B981', 
                        background: '#D1FAE5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#065F46' }}>{selectedCustomer.name}</div>
                          <div style={{ fontSize: 12, color: '#059669' }}>{selectedCustomer.phone}</div>
                        </div>
                        <button 
                          onClick={() => { setSelectedCustomer(null); setCartCustomerInput(''); }}
                          style={{ 
                            padding: '4px 8px', 
                            borderRadius: 6, 
                            border: 'none', 
                            background: '#FEE2E2', 
                            color: '#DC2626', 
                            fontSize: 12, 
                            fontWeight: 600, 
                            cursor: 'pointer'
                          }}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <input
                        value={cartCustomerInput}
                        onChange={(e) => setCartCustomerInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            // Find customer by phone or ID
                            const found = customers.find(c => 
                              c.phone === cartCustomerInput.trim() || c.id === cartCustomerInput.trim()
                            );
                            if (found) {
                              setSelectedCustomer(found);
                              setCartCustomerInput('');
                            }
                          }
                        }}
                        placeholder="কাস্টমার নম্বর দিন"
                        style={{ width: '100%', fontSize: 14, borderRadius: 8, padding: '8px 12px', border: '1.5px solid #e5e7eb', background: '#fafbfc', outline: 'none', boxSizing: 'border-box' }}
                      />
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      // Future: Open add customer modal
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
                    }}>
                    ➕ Add
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ flex: 1, overflow: 'auto', background: '#fafbfc' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', background: '#FFFFFF', margin: 8, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🛒</div>
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
                    ⚠️ {t('due')}: {fmt(due)}
                  </div>
                )}
                {change > 0 && (
                  <div style={{ fontSize: 14, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: '#F0FDF4', color: '#16A34A', fontWeight: 600, textAlign: 'center' }}>
                    💵 {t('change')}: {fmt(change)}
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
                    🗑️
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
                    }}>
                    ✓ {t('completeSale')}
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
            <h2 style={{ marginBottom: 16 }}>📈 {t('reports')}</h2>
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
              <h3 style={{ marginBottom: 12 }}>🧾 {t('salesList')}</h3>
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
            <h2 style={{ marginBottom: 16 }}>📊 {t('barcode')}</h2>
            <div className="card" style={{ maxWidth: 500 }}>
              <div className="form-group">
                <label className="label">{t('code')}</label>
                <input type="text" className="input" placeholder={t('code')} />
              </div>
              <button className="btn btn-primary">{t('barcode')}</button>
              <div style={{ marginTop: 20, textAlign: 'center', padding: 20, background: '#F9FAFB', borderRadius: 8 }}>
                <div style={{ fontSize: 48 }}>📊</div>
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
            <h2 style={{ marginBottom: 16 }}>🏭 {t('stock')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#166534' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalProductsCount')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#DC2626' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockLow')}</div>
              </div>
              <div className="card" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#059669' }}>০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('stockAvailable')}</div>
              </div>
            </div>
            
            {/* Low Stock Alert Section */}
            <div className="card" style={{ border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <h3 style={{ marginBottom: 12, color: '#DC2626' }}>⚠️ {t('lowStockAlert')}</h3>
              <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 20 }}>{t('noLowStockProducts')}</p>
            </div>
          </div>
        )}

        {currentTab === 'income' && (
          <div>
            <h2 style={{ marginBottom: 16 }}>💰 {t('incomeExpenses')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div className="card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#166534' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalIncome')}</div>
              </div>
              <div className="card" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📉</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#DC2626' }}>৳০</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{t('totalExpense')}</div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>➕ {t('addExpense')}</h3>
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
              <h3>✅ {t('saleComplete')}</h3>
              <button className="modal-close" onClick={() => setShowReceiptModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 48 }}>✅</div>
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
              <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 20 }} onClick={() => setShowReceiptModal(false)}>
                ✓ {t('finish')}
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
        alert(`✅ ${items.length}টি পণ্য যোগ হয়েছে!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F9FAFB' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', background: 'white', borderBottom: '1px solid #E5E7EB', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: 16 }}>📦 {t('newProductSave')}</span>
        <span style={{ fontSize: 14, color: '#6B7280', marginLeft: 'auto' }}>{purchaseItems.length} {t('productsAdded')}</span>
        {purchaseItems.length > 0 && (
          <button onClick={savePurchase} style={{ padding: '8px 16px', background: '#0D9488', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            💾 {t('saveAll')}
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
              <span>📁</span> {t('csvUpload')}
            </label>
            <button onClick={downloadDemoCSV} style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📥</span> {t('demoCsv')}
            </button>
          </div>

          {/* Form Card */}
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, color: '#0D9488', fontWeight: 700 }}>{t('addProduct')}</h3>

            {/* Company + Category: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {/* Company */}
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>🏢 {t('companySupplier')} *</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>📂 {t('category')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>🔢 {t('barcode')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>📥 {t('unit')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>📥 {t('stock')}</label>
                <input
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>⚠️ {t('minStock')}</label>
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
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>💰 {t('purchasePrice')}</label>
                <input
                  type="number"
                  value={form.buyP}
                  onChange={e => setForm(f => ({ ...f, buyP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>💵 {t('sellPrice')}</label>
                <input
                  type="number"
                  value={form.sellP}
                  onChange={e => setForm(f => ({ ...f, sellP: e.target.value }))}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none', background: '#F9FAFB', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>📊 {t('profit')}</label>
                <div style={{ padding: '10px 12px', background: '#DCFCE7', borderRadius: 8, fontWeight: 700, color: '#166534', fontSize: 14, border: '1px solid #BBF7D0' }}>
                  {typeof profit === 'number' ? profit : profit} {typeof profitPercent === 'number' ? `(${profitPercent}%)` : ''}
                </div>
              </div>
            </div>

            {/* VAT + VAT Amount + Total: 3 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14, color: '#6B7280' }}>🧾 {t('vatPercent')}</label>
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
              ➕ {t('addToProductList')}
            </button>
          </div>
        </div>

        {/* Right: Purchase List */}
        <div style={{ width: 350, padding: 12, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#F9FAFB' }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📋 {t('productList')} ({purchaseItems.length})</h3>

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
                    🏢 {item.company} {item.cat ? `- 📂 ${item.cat}` : ''}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', display: 'flex', gap: 8, marginTop: 4 }}>
                    <span>📦 {item.stock} {item.unit}</span>
                    <span>💰 {fmt(item.buyP)}</span>
                    <span>💵 {fmt(item.sellP)}</span>
                  </div>
                  {item.barcode && <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'monospace', marginTop: 2 }}>🔢 {item.barcode}</div>}
                </div>
                <button onClick={() => removeItem(i)} style={{ padding: '6px 10px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, marginLeft: 8 }}>🗑️</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
