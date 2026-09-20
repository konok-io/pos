import { useState, useEffect } from 'react';
import { useLanguage } from './i18n';
import { api, setToken } from './api';

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
  return { padding, fontSize, background: bgMap[type] || bgMap.default, color: colorMap[type] || colorMap.default, border: type === 'ghost' ? `1px solid ${T.gray200}` : 'none', borderRadius: 7, cursor: 'pointer' as const, fontWeight: 600, display: 'inline-flex', alignItems: 'center', transition: 'all 0.15s' };
};

const inputStyle: React.CSSProperties = { padding: '9px 12px', border: `1px solid ${T.gray200}`, borderRadius: 7, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: T.white, height: '34px' };
const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: T.gray600, marginBottom: 6, display: 'block' };

const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
const genUniqueId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const unique = String(Math.floor(10000 + Math.random() * 90000));
  return `${y}${m}${d}${unique}`;
};
const fmtN = (n: number) => (+n || 0).toLocaleString('en-IN');

interface ProductsScreenProps {
  products: any[];
  suppliers: any[];
  categories: any[];
  purchases: any[];
  productHistory: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<any[]>>;
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  settings: any;
  currentUser?: any;
}

export default function ProductsScreen({ products: _initProducts, suppliers: _initSuppliers, categories: _initCategories, purchases, productHistory: _productHistory, setProducts: setProductsParent, setSuppliers: setSuppliersParent, setCategories: setCategoriesParent, settings: _settings, currentUser: _currentUser }: ProductsScreenProps) {
  const { t } = useLanguage();
  const fmt = (n: number) => `${_settings?.currencySymbol || '৳'} ${(+n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productTab, setProductTab] = useState('allProducts');
  const [search, setSearch] = useState('');
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
  const [supplierForm, setSupplierForm] = useState({ id: '', name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '' });
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [stockAdjustProduct, setStockAdjustProduct] = useState<any>(null);
  const [stockAdjustQty, setStockAdjustQty] = useState('');
  const [stockAdjustType, setStockAdjustType] = useState('add');
  const [stockAdjustReason, setStockAdjustReason] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSupplierMoreMenu, setShowSupplierMoreMenu] = useState(false);
  const [showCategoryMoreMenu, setShowCategoryMoreMenu] = useState(false);
  const [showStockMoreMenu, setShowStockMoreMenu] = useState(false);
  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'out' | 'low'>('all');
  const [showPurchaseBarcodeModal, setShowPurchaseBarcodeModal] = useState(false);
  const [purchaseBarcodeId, setPurchaseBarcodeId] = useState('');
  const [showCustomBarcodeModal, setShowCustomBarcodeModal] = useState(false);
  const [customBarcodeProducts, setCustomBarcodeProducts] = useState<any[]>([]);
  const [customBarcodeSearch, setCustomBarcodeSearch] = useState('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '' });
  const [editFullProduct, setEditFullProduct] = useState<any>(null);
  const [viewSupplier, setViewSupplier] = useState<any>(null);
  const [viewCategory, setViewCategory] = useState<any>(null);
  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'profit'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [stockHistoryFilter, setStockHistoryFilter] = useState<'all' | 'add' | 'remove'>('all');

  // Load ALL data from MySQL on mount - always override local data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('pos_api_token');
        if (!token) {
          const res = await api.login('admin@pos.test', 'admin123');
          setToken(res.token);
        }
        const [prods, cats, sups, hist] = await Promise.all([api.getProducts(), api.getCategories(), api.getSuppliers(), api.getStockHistory()]);
        setProducts(prods);
        setCategories(cats);
        setSuppliers(sups);
        setStockHistory(hist);
        setProductsParent(prods);
        setCategoriesParent(cats);
        setSuppliersParent(sups);
      } catch (e) { console.error('API load failed:', e); }
    };
    loadData();
  }, []);

  const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };

  const stockCount = products.filter((p: any) => p.stock > 0).length;
  const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;
  const lowStockCount = products.filter((p: any) => p.stock > 0 && p.stock <= ((p as any).minStock || 5)).length;
  const totalStockValue = products.reduce((s: number, p: any) => s + p.stock * p.costPrice, 0);

  const filteredProducts = products.filter((p: any) => {
    return !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.company || '').toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase()) || (p.cat || '').toLowerCase().includes(search.toLowerCase());
  }).sort((a: any, b: any) => {
    let cmp = 0;
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'price') cmp = a.sellPrice - b.sellPrice;
    else if (sortBy === 'stock') cmp = a.stock - b.stock;
    else if (sortBy === 'profit') cmp = (a.sellPrice - a.costPrice) - (b.sellPrice - b.costPrice);
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const allCompanies = [...new Set([...suppliers.map((s: any) => s.name).filter(Boolean), ...products.map((p: any) => p.company).filter(Boolean)])].sort();
  const filteredSuppliers = allCompanies.filter(c => !supplierSearch || (c || '').toLowerCase().includes(supplierSearch.toLowerCase()));
  const allCategories = [...new Set([...categories.map((c: any) => c.name).filter(Boolean), ...products.map((p: any) => p.cat).filter(Boolean)])].sort();
  const filteredCategories = allCategories.filter(c => !categorySearch || (c || '').toLowerCase().includes(categorySearch.toLowerCase()));
  const barcodeProducts = products.filter((p: any) => !barcodeSearch || (p.code || '').toLowerCase().includes(barcodeSearch.toLowerCase()) || (p.name || '').toLowerCase().includes(barcodeSearch.toLowerCase()));
  const stockProducts = products.filter((p: any) => {
    if (stockFilter === 'out') return p.stock <= 0;
    if (stockFilter === 'low') return p.stock > 0 && p.stock <= (p.minStock || 5);
    if (stockFilter === 'available') return p.stock > (p.minStock || 5);
    return true;
  }).filter((p: any) => !stockSearch || (p.name || '').toLowerCase().includes(stockSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(stockSearch.toLowerCase())).sort((a: any, b: any) => a.stock - b.stock);

  const handleEditProduct = () => {
    if (!editProduct) return;
    const updated = products.map((p: any) => p.id === editProduct.id ? { ...p, costPrice: editProduct.costPrice, sellPrice: editProduct.sellPrice } : p);
    setProducts(updated);
    setProductsParent(updated);
    api.updateProduct(editProduct.id, { ...editProduct, costPrice: editProduct.costPrice, sellPrice: editProduct.sellPrice }).catch(() => {});
    setEditProduct(null);
  };

  const handleAddProduct = () => {
    if (!productForm.name.trim()) { alert(t('enterName')); return; }
    const newProduct = { id: genId(), ...productForm };
    const updated = [...products, newProduct];
    setProducts(updated);
    setProductsParent(updated);
    api.addProduct(newProduct).catch(() => {});
    setShowAddProductModal(false);
    setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '' });
  };

  const handleEditFullProduct = () => {
    if (!editFullProduct) return;
    const updated = products.map((p: any) => p.id === editFullProduct.id ? { ...p, name: editFullProduct.name, code: editFullProduct.code, company: editFullProduct.company, cat: editFullProduct.cat, unit: editFullProduct.unit, costPrice: editFullProduct.costPrice, sellPrice: editFullProduct.sellPrice, minStock: editFullProduct.minStock } : p);
    setProducts(updated);
    setProductsParent(updated);
    api.updateProduct(editFullProduct.id, editFullProduct).catch(() => {});
    setEditFullProduct(null);
  };

  const deleteProduct = (id: string) => {
    const product = products.find((p: any) => p.id === id);
    if (!product) return;
    if (!window.confirm(`"${product.name}" ${t('confirmDelete')}`)) return;
    const updated = products.filter((p: any) => p.id !== id);
    setProducts(updated);
    setProductsParent(updated);
    api.deleteProduct(id).catch(() => {});
  };

  const deleteSupplier = (name: string) => {
    const supplierProducts = products.filter((p: any) => (p.company || '').toLowerCase() === name.toLowerCase());
    const msg = supplierProducts.length > 0 ? `\n\n${t('products')}: ${supplierProducts.length}` : '';
    if (!window.confirm(`"${name}" ${t('confirmDelete')}${msg}`)) return;
    const supplier = suppliers.find((s: any) => s.name === name);
    const updated = suppliers.filter((s: any) => s.name !== name);
    setSuppliers(updated);
    setSuppliersParent(updated);
    if (supplier) api.deleteSupplier(supplier.id).catch(() => {});
  };

  const deleteCategory = (name: string) => {
    const catProducts = products.filter((p: any) => (p.cat || '').toLowerCase() === name.toLowerCase());
    const msg = catProducts.length > 0 ? `\n\n${t('products')}: ${catProducts.length}` : '';
    if (!window.confirm(`"${name}" ${t('confirmDelete')}${msg}`)) return;
    const cat = categories.find((c: any) => c.name === name);
    const updated = categories.filter((c: any) => c.name !== name);
    setCategories(updated);
    setCategoriesParent(updated);
    if (cat) api.deleteCategory(cat.id).catch(() => {});
  };

  const exportProductsCsv = () => {
    const headers = ['Name', 'Barcode', 'Company', 'Category', 'Unit', 'BuyPrice', 'SellPrice', 'Stock', 'MinStock'];
    const rows = products.map((p: any) => [p.name, p.code || '', p.company || '', p.cat || '', p.unit, p.costPrice, p.sellPrice, p.stock, p.minStock || 5].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, 'products.csv');
  };

  const exportSuppliersCsv = () => {
    const headers = ['Name', 'Phone', 'Email', 'Address', 'CR Number', 'VAT Number'];
    const rows = suppliers.map((s: any) => [s.name, s.phone || '', s.email || '', s.address || '', s.crNumber || '', s.vatNumber || ''].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, 'suppliers.csv');
  };

  const exportCategoriesCsv = () => {
    const headers = ['Name', 'Products', 'Stock', 'TotalValue'];
    const rows = filteredCategories.map((c: string) => {
      const catProducts = products.filter((p: any) => (p.cat || '').toLowerCase() === c.toLowerCase());
      return [c, catProducts.length, catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0), catProducts.reduce((s: number, p: any) => s + p.stock * p.sellPrice, 0)].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, 'categories.csv');
  };

  const exportStockCsv = () => {
    const headers = ['Name', 'Barcode', 'Company', 'Stock', 'MinStock', 'CostValue', 'Status'];
    const rows = stockProducts.map((p: any) => {
      const status = p.stock <= 0 ? 'Out' : p.stock <= (p.minStock || 5) ? 'Low' : 'Available';
      return [p.name, p.code || '', p.company || '', p.stock, p.minStock || 5, (p.stock * p.costPrice).toFixed(2), status].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, 'stock.csv');
  };

  const downloadCsv = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printBarcode = (product: any) => {
    const items = Array(6).fill(0).map(() => `<div class="barcode-item"><h4>${product.name}</h4><div class="code">${product.code || 'N/A'}</div><div class="price">${fmt(product.sellPrice)}</div></div>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px}.barcode-item{border:1px solid #ccc;padding:8px;text-align:center;width:200px}.barcode-item h4{font-size:11px;margin-bottom:4px}.barcode-item .code{font-family:monospace;font-size:14px;letter-spacing:2px}.barcode-item .price{font-size:12px;color:#666;margin-top:4px}</style></head><body>${items}</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 500); }
  };

  const printProductList = () => {
    const list = filteredProducts.length > 0 ? filteredProducts : products;
    const rows = list.map((p: any) => `<tr><td>${p.name}</td><td>${p.company || '-'}</td><td>${p.cat || '-'}</td><td>${fmt(p.costPrice)}</td><td>${fmt(p.sellPrice)}</td><td>${p.stock}</td><td>${p.unit}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:6px 5px;text-align:left;font-size:10px;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:6px 5px;font-size:11px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('productList')}</h1><p>${new Date().toLocaleDateString()} | ${list.length} ${t('products')}</p></div><table><thead><tr><th>${t('name')}</th><th>${t('company')}</th><th>${t('category')}</th><th>${t('purchasePrice')}</th><th>${t('sellPrice')}</th><th>${t('stock')}</th><th>${t('unit')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }
  };

  const printSupplierList = () => {
    const rows = filteredSuppliers.map((c: string) => {
      const prodCount = products.filter((p: any) => (p.company || '').toLowerCase() === c.toLowerCase()).length;
      const totalP = purchases.filter((p: any) => (p.supplier || '').toLowerCase() === c.toLowerCase()).reduce((s: number, p: any) => s + (p.items || []).reduce((ss: number, i: any) => ss + (i.stock || 0) * (i.costPrice || 0), 0), 0);
      return `<tr><td>${c}</td><td>${prodCount}</td><td>${fmt(totalP)}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:8px;text-align:left;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:8px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('suppliers')}</h1><p>${new Date().toLocaleDateString()} | ${filteredSuppliers.length} ${t('suppliers')}</p></div><table><thead><tr><th>${t('name')}</th><th>${t('products')}</th><th>${t('totalPurchase')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }
  };

  const printCategoryList = () => {
    const rows = filteredCategories.map((c: string) => {
      const catProducts = products.filter((p: any) => (p.cat || '').toLowerCase() === c.toLowerCase());
      const totalStock = catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0);
      const totalV = catProducts.reduce((s: number, p: any) => s + p.stock * p.sellPrice, 0);
      return `<tr><td>${c}</td><td>${catProducts.length}</td><td>${totalStock}</td><td>${fmt(totalV)}</td></tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:8px;text-align:left;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:8px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('categories')}</h1><p>${new Date().toLocaleDateString()} | ${filteredCategories.length} ${t('categories')}</p></div><table><thead><tr><th>${t('name')}</th><th>${t('products')}</th><th>${t('stock')}</th><th>${t('totalValue')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }
  };

  const printStockList = () => {
    const rows = stockProducts.map((p: any) => `<tr><td>${p.name}</td><td>${p.company || '-'}</td><td>${p.stock}</td><td>${p.minStock || 5}</td><td>${fmt(p.stock * p.costPrice)}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:8px;text-align:left;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:8px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('stock')}</h1><p>${new Date().toLocaleDateString()} | ${stockProducts.length} ${t('products')}</p></div><table><thead><tr><th>${t('name')}</th><th>${t('company')}</th><th>${t('stock')}</th><th>${t('minStock')}</th><th>${t('totalValue')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    const win = window.open('', '_blank', 'width=1000,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }
  };

  const printPurchaseBarcode = () => {
    if (!purchaseBarcodeId.trim()) { alert(t('enterName')); return; }
    const matchedProducts = products.filter((p: any) => (p.purchaseId || '').toLowerCase() === purchaseBarcodeId.trim().toLowerCase());
    if (matchedProducts.length === 0) { alert(t('noProductsFound')); return; }
    const items = matchedProducts.map((p: any) => `<div class="barcode-item"><h4>${p.name}</h4><div class="code">${p.code || 'N/A'}</div><div class="price">${fmt(p.sellPrice)}</div></div>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px}.barcode-item{border:1px solid #ccc;padding:8px;text-align:center;width:200px}.barcode-item h4{font-size:11px;margin-bottom:4px}.barcode-item .code{font-family:monospace;font-size:14px;letter-spacing:2px}.barcode-item .price{font-size:12px;color:#666;margin-top:4px}</style></head><body>${items}</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 500); }
    setShowPurchaseBarcodeModal(false);
    setPurchaseBarcodeId('');
  };

  const printCustomBarcode = () => {
    if (customBarcodeProducts.length === 0) { alert(t('noProductsFound')); return; }
    const items = customBarcodeProducts.map((p: any) => `<div class="barcode-item"><h4>${p.name}</h4><div class="code">${p.code || 'N/A'}</div><div class="price">${fmt(p.sellPrice)}</div></div>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px}.barcode-item{border:1px solid #ccc;padding:8px;text-align:center;width:200px}.barcode-item h4{font-size:11px;margin-bottom:4px}.barcode-item .code{font-family:monospace;font-size:14px;letter-spacing:2px}.barcode-item .price{font-size:12px;color:#666;margin-top:4px}</style></head><body>${items}</body></html>`;
    const win = window.open('', '_blank', 'width=800,height=600');
    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 500); }
    setShowCustomBarcodeModal(false);
    setCustomBarcodeProducts([]);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      if (lines.length < 2) { alert(t('csvMinRows')); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        items.push({ id: genId(), name: row['name'] || '', code: row['barcode'] || '', company: row['company'] || '', cat: row['category'] || '', unit: row['unit'] || 'pcs', costPrice: parseFloat(row['buyprice'] || '0'), sellPrice: parseFloat(row['sellprice'] || '0'), stock: parseFloat(row['stock'] || '0'), minStock: parseFloat(row['minstock'] || '5'), image: '', supplier: row['company'] || '', categoryId: '' });
      }
      const valid = items.filter(i => i.name);
      if (valid.length > 0) {
        const updated = [...products, ...valid];
        setProducts(updated);
        setProductsParent(updated);
        valid.forEach((p: any) => api.addProduct(p).catch(() => {}));
        alert(`${valid.length} ${t('productsAdded')}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleStockAdjust = () => {
    if (!stockAdjustProduct || !stockAdjustQty) return;
    const qty = parseInt(stockAdjustQty) || 0;
    if (qty <= 0) return;
    const oldStock = stockAdjustProduct.stock;
    const newStock = stockAdjustType === 'add' ? oldStock + qty : Math.max(0, oldStock - qty);
    const updated = products.map((p: any) => p.id === stockAdjustProduct.id ? { ...p, stock: newStock } : p);
    setProducts(updated);
    setProductsParent(updated);
    api.addStockHistory({
      productId: stockAdjustProduct.id,
      productName: stockAdjustProduct.name,
      type: stockAdjustType === 'add' ? 'add' : 'remove',
      quantity: qty,
      oldStock,
      newStock,
      reason: stockAdjustReason,
    }).then((res: any) => {
      setStockHistory(prev => [{ id: res.id, productId: stockAdjustProduct.id, productName: stockAdjustProduct.name, type: stockAdjustType === 'add' ? 'add' : 'remove', quantity: qty, oldStock, newStock, reason: stockAdjustReason, created_at: new Date().toISOString() }, ...prev]);
    }).catch(() => {});
    alert(`${stockAdjustProduct.name}: ${stockAdjustType === 'add' ? '+' : '-'}${qty} = ${newStock}`);
    setStockAdjustProduct(null); setStockAdjustQty(''); setStockAdjustReason('');
  };

  const renderAllProducts = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredProducts.length}</span>
        <button style={{ ...btn('ghost', 'sm') }} onClick={printProductList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.tealLight }}>
            {[t('productName'), t('company'), t('category'), t('purchasePrice'), t('sellPrice'), t('profit'), t('stock'), t('unit'), t('actions')].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: i >= 3 && i <= 5 ? 'right' : i >= 6 ? 'center' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>{t('noProductsYet')}</td></tr>
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
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ fontWeight: 700, fontSize: 15, color: p.stock <= 0 ? T.red : low ? T.amber : T.gray900 }}>{fmtN(p.stock)}</span>{low && <i className="fas fa-triangle-exclamation" style={{color:'#F59E0B',marginRight:4}}></i>}{p.stock <= 0 && ' <i className="fas fa-xmark"></i>'}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray400, textAlign: 'center' }}>{p.unit}</td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setViewProduct(p)}><i className="fas fa-eye"></i></button>
                    <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setEditFullProduct({ ...p })}><i className="fas fa-pen"></i></button>
                    <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => printBarcode(p)}><i className="fas fa-barcode"></i></button>
                    {p.stock <= 0 ? <button style={{ ...btn('danger', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => deleteProduct(p.id)}><i className="fas fa-trash"></i></button> : <button disabled style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13, opacity: 0.4, cursor: 'not-allowed' }}><i className="fas fa-lock"></i></button>}
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
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder={t('searchSupplier')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredSuppliers.length}</span>
        <button style={{ ...btn('ghost', 'sm') }} onClick={printSupplierList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {filteredSuppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}><i className="fas fa-building"></i></div><p>{t('noSuppliers')}</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
            <thead><tr style={{ background: T.tealLight }}>
              {[t('name'), t('phone'), t('email'), t('products'), t('purchases'), t('totalPurchase'), t('actions')].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i >= 3 && i <= 4 ? 'center' : i === 5 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredSuppliers.map((company: string, i: number) => {
                const supplier = suppliers.find((s: any) => s.name === company);
                const prodCount = products.filter((p: any) => (p.company || '').toLowerCase() === company.toLowerCase()).length;
                const purchaseCount = purchases.filter((p: any) => (p.supplier || '').toLowerCase() === company.toLowerCase()).length;
                const totalPurchase = purchases.filter((p: any) => (p.supplier || '').toLowerCase() === company.toLowerCase()).reduce((s: number, p: any) => s + (p.items || []).reduce((ss: number, i: any) => ss + (i.stock || 0) * (i.costPrice || 0), 0), 0);
                return (
                  <tr key={company} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => setViewSupplier({ name: company, prodCount, purchaseCount, totalPurchase })}>{company}<div style={{ fontSize: 12, color: T.gray400 }}>{supplier?.crNumber || '-'}</div></td>
                    <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{supplier?.phone || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{supplier?.email || '-'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14 }}>{prodCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: 14 }}>{purchaseCount}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: T.green }}>{fmt(totalPurchase)}</td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setViewSupplier({ name: company, prodCount, purchaseCount, totalPurchase })}><i className="fas fa-eye"></i></button>
                      <button style={{ ...btn('danger', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => deleteSupplier(company)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showSupplierModal && (
        <div style={overlay} onClick={() => setShowSupplierModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 450, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-building" style={{marginRight: 4}}></i> {editingSupplier ? t('edit') : t('addSupplier')}</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('id')}</label><input value={supplierForm.id} readOnly style={{ ...inputStyle, background: T.gray50, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }} /></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('name')} *</label><input value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><label style={labelStyle}>{t('phone')}</label><input value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('email')}</label><input value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('address')}</label><input value={supplierForm.address} onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })} style={inputStyle} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><label style={labelStyle}>CR {t('number')}</label><input value={supplierForm.crNumber} onChange={e => setSupplierForm({ ...supplierForm, crNumber: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>VAT {t('number')}</label><input value={supplierForm.vatNumber} onChange={e => setSupplierForm({ ...supplierForm, vatNumber: e.target.value })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowSupplierModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={() => { if (!supplierForm.name.trim()) { alert(t('enterName')); return; } if (editingSupplier) { const updated = suppliers.map((s: any) => s.id === editingSupplier.id ? { ...s, ...supplierForm } : s); setSuppliers(updated); setSuppliersParent(updated); api.updateSupplier(editingSupplier.id, supplierForm).catch(() => {}); } else { const newSupplier = { ...supplierForm }; const updated = [...suppliers, newSupplier]; setSuppliers(updated); setSuppliersParent(updated); api.addSupplier(newSupplier).catch(() => {}); } setShowSupplierModal(false); }} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCategory = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder={t('searchCategory')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{filteredCategories.length}</span>
        <button style={{ ...btn('ghost', 'sm') }} onClick={printCategoryList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {filteredCategories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}><i className="fas fa-folder"></i></div><p>{t('noCategories')}</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
            <thead><tr style={{ background: T.tealLight }}>
              {[t('id'), t('categoryName'), t('products'), t('stock'), t('totalValue'), t('actions')].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i === 2 ? 'center' : i === 3 ? 'center' : i === 4 ? 'right' : i === 5 ? 'center' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredCategories.map((cat: string, i: number) => {
                const catObj = categories.find((c: any) => c.name === cat);
                const catId = catObj?.id || '-';
                const catProducts = products.filter((p: any) => (p.cat || '').toLowerCase() === cat.toLowerCase());
                const totalStock = catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0);
                const totalValue = catProducts.reduce((s: number, p: any) => s + p.stock * p.sellPrice, 0);
                return (
                  <tr key={cat} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500, fontFamily: 'monospace' }}>{catId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14, color: T.teal, cursor: 'pointer' }} onClick={() => setViewCategory({ name: cat, products: catProducts, totalValue })}><i className="fas fa-folder" style={{marginRight: 4}}></i> {cat}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ background: T.tealLight, color: T.teal, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{catProducts.length}</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{totalStock}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{fmt(totalValue)}</td>
                    <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button disabled={catProducts.length > 0} style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13, opacity: catProducts.length > 0 ? 0.3 : 1, cursor: catProducts.length > 0 ? 'not-allowed' : 'pointer' }} onClick={() => { setEditingCategory(catObj); setCategoryForm({ id: catObj?.id || '', name: cat }); setShowCategoryModal(true); }}><i className="fas fa-pen"></i></button>
                      <button style={{ ...btn('ghost', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => setViewCategory({ name: cat, products: catProducts, totalValue })}><i className="fas fa-eye"></i></button>
                      <button disabled={catProducts.length > 0} style={{ ...btn('danger', 'sm'), padding: '4px 8px', fontSize: 13, opacity: catProducts.length > 0 ? 0.3 : 1, cursor: catProducts.length > 0 ? 'not-allowed' : 'pointer' }} onClick={() => deleteCategory(cat)}><i className="fas fa-trash"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showCategoryModal && (
        <div style={overlay} onClick={() => setShowCategoryModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {editingCategory ? t('edit') : t('addCategory')}</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('id')}</label><input value={categoryForm.id} readOnly style={{ ...inputStyle, background: T.gray50, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }} /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('categoryName')} *</label><input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} style={inputStyle} placeholder={t('enterCategoryName')} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={() => { if (!categoryForm.name.trim()) { alert(t('enterName')); return; } if (editingCategory) { const updated = categories.map((c: any) => c.id === editingCategory.id ? { ...c, name: categoryForm.name } : c); setCategories(updated); setCategoriesParent(updated); api.updateCategory(editingCategory.id, { name: categoryForm.name }).catch(() => {}); } else { const newCat = { id: categoryForm.id || genUniqueId(), name: categoryForm.name }; const updated = [...categories, newCat]; setCategories(updated); setCategoriesParent(updated); api.addCategory(newCat).catch(() => {}); } setShowCategoryModal(false); }} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>
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
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={barcodeSearch} onChange={e => setBarcodeSearch(e.target.value)} placeholder={t('searchBarcode')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{barcodeProducts.length}</span>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => { const items = barcodeProducts.map((p: any) => `<div class="barcode-item"><h4>${p.name}</h4><div class="code">${p.code || 'N/A'}</div><div class="price">${fmt(p.sellPrice)}</div></div>`).join(''); const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px}.barcode-item{border:1px solid #ccc;padding:8px;text-align:center;width:200px}.barcode-item h4{font-size:11px;margin-bottom:4px}.barcode-item .code{font-family:monospace;font-size:14px;letter-spacing:2px}.barcode-item .price{font-size:12px;color:#666;margin-top:4px}</style></head><body>${items}</body></html>`; const win = window.open('', '_blank', 'width=800,height=600'); if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 500); } }}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {barcodeProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400 }}><div style={{ fontSize: 48, marginBottom: 16 }}><i className="fas fa-barcode"></i></div><p>{t('noProductsYet')}</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
            <thead><tr style={{ background: T.tealLight }}>
              {[t('productName'), t('company'), t('barcode'), t('purchasePrice'), t('sellPrice'), t('actions')].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i >= 3 && i <= 4 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {barcodeProducts.map((p: any, i: number) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}>{p.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray600 }}>{p.company || '-'}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, background: T.gray50, padding: '2px 8px', borderRadius: 4, border: `1px dashed ${T.gray300}` }}>{p.code || 'N/A'}</span></td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14 }}>{fmt(p.costPrice)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: T.teal }}>{fmt(p.sellPrice)}</td>
                  <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button style={{ ...btn('primary', 'sm'), padding: '4px 8px', fontSize: 13 }} onClick={() => printBarcode(p)}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderStock = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{stockProducts.length}</span>
        <button style={{ ...btn('ghost', 'sm') }} onClick={printStockList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.tealLight }}>
            {[t('productName'), t('company'), t('currentStock'), t('minStock'), t('totalValue'), t('status'), t('actions')].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: i === 2 || i === 3 || i === 5 || i === 6 ? 'center' : i === 4 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
            ))}
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
                      {status === 'out' ? t('stockOut') : status === 'low' ? t('stockLow') : t('stockAvailable')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <button style={{ ...btn('primary', 'sm') }} onClick={() => { setStockAdjustProduct(p); setStockAdjustQty(''); setStockAdjustType('add'); setStockAdjustReason(''); }}><i className="fas fa-gear" style={{marginRight: 4}}></i> {t('adjust')}</button>
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
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-gear" style={{marginRight: 4}}></i> {t('stockAdjustment')}</h3>
            <div style={{ background: T.gray50, borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{stockAdjustProduct.name}</div>
              <div style={{ fontSize: 14, color: T.gray500 }}>{t('currentStock')}: <strong>{stockAdjustProduct.stock}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setStockAdjustType('add')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${stockAdjustType === 'add' ? T.green : T.gray200}`, background: stockAdjustType === 'add' ? T.greenLight : T.white, color: stockAdjustType === 'add' ? T.green : T.gray600, fontWeight: 700, cursor: 'pointer' }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('add')}</button>
              <button onClick={() => setStockAdjustType('remove')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `2px solid ${stockAdjustType === 'remove' ? T.red : T.gray200}`, background: stockAdjustType === 'remove' ? T.redLight : T.white, color: stockAdjustType === 'remove' ? T.red : T.gray600, fontWeight: 700, cursor: 'pointer' }}><i className="fas fa-minus" style={{marginRight: 4}}></i> {t('remove')}</button>
            </div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('quantity')}</label><input type="number" value={stockAdjustQty} onChange={e => setStockAdjustQty(e.target.value)} style={inputStyle} placeholder={t('enterQuantity')} min="1" /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('reason')}</label><input value={stockAdjustReason} onChange={e => setStockAdjustReason(e.target.value)} style={inputStyle} placeholder={t('reasonOptional')} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setStockAdjustProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={handleStockAdjust} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-check" style={{marginRight: 4}}></i> {t('adjust')}</button>
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}><i className="fas fa-xmark"></i></button>
        </div>
        <div style={{ padding: 20 }}>{content}</div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'allProducts', icon: <i className="fas fa-box"></i>, label: t('allProducts') },
    { id: 'suppliers', icon: <i className="fas fa-building"></i>, label: t('suppliers') },
    { id: 'categories', icon: <i className="fas fa-folder"></i>, label: t('categories') },
    { id: 'barcode', icon: <i className="fas fa-barcode"></i>, label: t('barcode') },
    { id: 'stock', icon: <i className="fas fa-warehouse"></i>, label: t('stock') },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', background: '#F5F5F5', borderBottom: `1px solid ${T.gray200}`, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setProductTab(tab.id)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: productTab === tab.id ? T.teal : T.white, color: productTab === tab.id ? T.white : T.gray600, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>{tab.icon} {tab.label}</button>
          ))}
        </div>
        {productTab === 'allProducts' && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid ${T.gray200}`, fontSize: 13, background: T.white, cursor: 'pointer' }}>
              <option value="name">{t('name')}</option>
              <option value="price">{t('sellPrice')}</option>
              <option value="stock">{t('stock')}</option>
              <option value="profit">{t('profit')}</option>
            </select>
            <button style={{ ...btn('ghost', 'sm') }} onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? '↑' : '↓'}</button>
            <div style={{ position: 'relative' }}>
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowMoreMenu(!showMoreMenu)}>⋯ {t('more')}</button>
              {showMoreMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 180, padding: 4 }}>
                  <button onClick={() => { setShowImportModal(true); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvUpload')}</button>
                  <button onClick={() => { exportProductsCsv(); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
                  <button onClick={() => { setShowPriceHistory(true); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-clock-rotate-left" style={{marginRight: 4}}></i> {t('priceHistory')}</button>
                  <button onClick={() => { setShowDeleteHistory(true); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteHistory')}</button>
                  <button onClick={() => { setShowPurchaseHistory(true); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('purchases')}</button>
                </div>
              )}
            </div>
            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '' }); setShowAddProductModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addNewProduct')}</button>
          </div>
        )}
        {productTab === 'suppliers' && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowSupplierMoreMenu(!showSupplierMoreMenu)}>⋯ {t('more')}</button>
              {showSupplierMoreMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>
                  <button onClick={() => { setShowSupplierMoreMenu(false); alert(t('comingSoon')); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvImport')} {t('suppliers')}</button>
                  <button onClick={() => { exportSuppliersCsv(); setShowSupplierMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
                </div>
              )}
            </div>
            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingSupplier(null); setSupplierForm({ id: genUniqueId(), name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '' }); setShowSupplierModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addSupplier')}</button>
          </div>
        )}
        {productTab === 'categories' && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowCategoryMoreMenu(!showCategoryMoreMenu)}>⋯ {t('more')}</button>
              {showCategoryMoreMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>
                  <button onClick={() => { setShowCategoryMoreMenu(false); alert(t('comingSoon')); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvImport')} {t('categories')}</button>
                  <button onClick={() => { exportCategoriesCsv(); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
                </div>
              )}
            </div>
            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingCategory(null); setCategoryForm({ id: genUniqueId(), name: '' }); setShowCategoryModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addCategory')}</button>
          </div>
        )}
        {productTab === 'barcode' && (
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowPurchaseBarcodeModal(true)}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('purchaseBarcode')}</button>
            <button style={{ ...btn('ghost', 'sm') }} onClick={() => { setShowCustomBarcodeModal(true); setCustomBarcodeSearch(''); setCustomBarcodeProducts([]); }}><i className="fas fa-barcode" style={{marginRight: 4}}></i> {t('customBarcode')}</button>
          </div>
        )}
        {productTab === 'stock' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginLeft: 'auto' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: T.gray400, lineHeight: 1 }}>{t('totalProducts')}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.teal, lineHeight: 1.2 }}>{products.length}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: T.gray400, lineHeight: 1 }}>{t('stockAvailable')}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.green, lineHeight: 1.2 }}>{stockCount}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: T.gray400, lineHeight: 1 }}>{t('stockOut')}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.red, lineHeight: 1.2 }}>{outOfStockCount}</div></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 13, color: T.gray400, lineHeight: 1 }}>{t('stockLow')}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.amber, lineHeight: 1.2 }}>{lowStockCount}</div></div>
              <div style={{ borderLeft: `1px solid ${T.gray300}`, paddingLeft: 8 }}><div style={{ fontSize: 13, color: T.gray400, lineHeight: 1 }}>{t('totalValue')}</div><div style={{ fontSize: 15, fontWeight: 700, color: T.teal, lineHeight: 1.2 }}>{fmt(totalStockValue)}</div></div>
            </div>
            <div style={{ position: 'relative' }}>
              <button style={{ ...btn('ghost', 'sm'), background: stockFilter !== 'all' ? T.tealLight : undefined }} onClick={() => setShowStockMoreMenu(!showStockMoreMenu)}>⋯ {t('more')}</button>
              {showStockMoreMenu && (
                <div style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>
                  <div style={{ padding: '4px 12px', fontSize: 12, fontWeight: 700, color: T.gray400 }}>{t('stockFilters')}</div>
                  <button onClick={() => { setStockFilter('all'); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: stockFilter === 'all' ? T.tealLight : 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('totalProducts')}</button>
                  <button onClick={() => { setStockFilter('available'); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: stockFilter === 'available' ? T.greenLight : 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-check" style={{marginRight: 4}}></i> {t('stockAvailable')}</button>
                  <button onClick={() => { setStockFilter('out'); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: stockFilter === 'out' ? T.redLight : 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-xmark" style={{marginRight: 4}}></i> {t('stockOut')}</button>
                  <button onClick={() => { setStockFilter('low'); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: stockFilter === 'low' ? T.amberLight : 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i> {t('stockLow')}</button>
                  <div style={{ borderTop: `1px solid ${T.gray100}`, margin: '4px 0' }}></div>
                  <button onClick={() => { exportStockCsv(); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
                  <button onClick={() => { setStockHistoryFilter('add'); setShowStockHistoryModal(true); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('stock')} + {t('history')}</button>
                  <button onClick={() => { setStockHistoryFilter('remove'); setShowStockHistoryModal(true); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('stock')} - {t('history')}</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {productTab === 'allProducts' && renderAllProducts()}
        {productTab === 'suppliers' && renderSupplier()}
        {productTab === 'categories' && renderCategory()}
        {productTab === 'barcode' && renderBarcode()}
        {productTab === 'stock' && renderStock()}
      </div>

      {editProduct && (
        <div style={overlay} onClick={() => setEditProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('editProductPrice')}</h3>
            <div style={{ marginBottom: 12 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{editProduct.name}</div><div style={{ fontSize: 13, color: T.gray400 }}>{editProduct.company} - {editProduct.cat || '-'}</div></div>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('purchasePrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editProduct.costPrice} onChange={e => setEditProduct({ ...editProduct, costPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('sellPrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editProduct.sellPrice} onChange={e => setEditProduct({ ...editProduct, sellPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setEditProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button><button onClick={handleEditProduct} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('saveChanges')}</button></div>
          </div>
        </div>
      )}

      {viewProduct && (
        <div style={overlay} onClick={() => setViewProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-clipboard-list" style={{marginRight: 4}}></i> {t('productDetails')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[[t('productName'), viewProduct.name], [t('barcode'), viewProduct.code || '-'], [t('company'), viewProduct.company || '-'], [t('category'), viewProduct.cat || '-'], [t('purchasePrice'), fmt(viewProduct.costPrice)], [t('sellPrice'), fmt(viewProduct.sellPrice)], [t('stock'), `${viewProduct.stock} ${viewProduct.unit}`], [t('minStock'), `${viewProduct.minStock || 5} ${viewProduct.unit}`]].map(([label, value]) => (
                <div key={label}><div style={{ fontSize: 13, color: T.gray400, marginBottom: 4 }}>{label}</div><div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div></div>
              ))}
            </div>
            <button onClick={() => setViewProduct(null)} style={{ ...btn(), width: '100%' }}>{t('close')}</button>
          </div>
        </div>
      )}

      {showPriceHistory && overlayModal(`<i className="fas fa-clock-rotate-left"></i> ${t('priceHistory')}`, () => setShowPriceHistory(false), (
        <div>{stockHistory.length === 0 ? <p style={{ textAlign: 'center', color: T.gray400, padding: 20 }}>{t('noPriceHistory')}</p> : stockHistory.filter((h: any) => h.type === 'price').map((h: any, i: number) => (
          <div key={i} style={{ padding: 10, background: T.gray50, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}><div><strong>{h.productName}</strong><div style={{ fontSize: 12, color: T.gray500 }}>{new Date(h.created_at).toLocaleString()}</div></div><div style={{ textAlign: 'right' }}>{h.oldPrice && <div style={{ textDecoration: 'line-through', color: T.red }}>{fmt(h.oldPrice)}</div>}{h.newPrice && <div style={{ color: T.green, fontWeight: 700 }}>{fmt(h.newPrice)}</div>}</div></div>
        ))}</div>
      ))}

      {showDeleteHistory && overlayModal(`<i className="fas fa-trash"></i> ${t('deleteHistory')}`, () => setShowDeleteHistory(false), (
        <div><p style={{ textAlign: 'center', color: T.gray400, padding: 20 }}>{t('noDeleteHistory')}</p></div>
      ))}

      {showPurchaseHistory && (
        <div style={overlay} onClick={() => { setShowPurchaseHistory(false); setViewPurchase(null); }}>
          <div style={{ background: T.white, borderRadius: 12, width: '90vw', maxWidth: 700, maxHeight: '80vh', overflow: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: T.teal }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('purchases')}</h3>
              <button onClick={() => { setShowPurchaseHistory(false); setViewPurchase(null); }} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: T.gray400 }}><i className="fas fa-xmark"></i></button>
            </div>
            <div style={{ padding: 20 }}>
              {purchases.length === 0 ? <p style={{ textAlign: 'center', color: T.gray400 }}>{t('noPurchaseRecords')}</p> : [...purchases].reverse().map((p: any) => {
                const totalCost = (p.items || []).reduce((s: number, i: any) => s + (i.stock || 0) * (i.costPrice || 0), 0);
                return (
                  <div key={p.id} onClick={() => setViewPurchase(p)} style={{ padding: 14, background: T.gray50, borderRadius: 12, marginBottom: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${T.gray200}` }}>
                    <div><div style={{ fontWeight: 700, color: T.teal, fontSize: 14 }}>{p.id}</div><div style={{ fontSize: 13, color: T.gray500, marginTop: 2 }}>{new Date(p.date).toLocaleDateString()} - {p.supplier}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, color: T.green }}>{fmt(totalCost)}</div><div style={{ fontSize: 13, color: T.gray500 }}>{(p.items || []).length} {t('products')}</div></div>
                  </div>
                );
              })}
            </div>
            {viewPurchase && (
              <div style={{ padding: 20, borderTop: `2px solid ${T.gray200}` }}>
                <h4 style={{ margin: '0 0 12px', color: T.teal }}>{viewPurchase.id} - {t('details')}</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: T.gray50 }}><th style={{ padding: 8, textAlign: 'left', fontSize: 13 }}>{t('products')}</th><th style={{ padding: 8, textAlign: 'center', fontSize: 13 }}>{t('quantity')}</th><th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>{t('price')}</th><th style={{ padding: 8, textAlign: 'right', fontSize: 13 }}>{t('total')}</th></tr></thead>
                  <tbody>{(viewPurchase.items || []).map((item: any, i: number) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${T.gray100}` }}><td style={{ padding: 10, fontSize: 14 }}>{item.name}<div style={{ fontSize: 12, color: T.gray400 }}>{item.company}</div></td><td style={{ padding: 10, textAlign: 'center' }}>{item.stock} {item.unit}</td><td style={{ padding: 10, textAlign: 'right' }}>{fmt(item.costPrice)}</td><td style={{ padding: 10, textAlign: 'right', fontWeight: 700 }}>{fmt((item.stock || 0) * (item.costPrice || 0))}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showImportModal && overlayModal(`<i className="fas fa-file-import"></i> ${t('csvUpload')}`, () => setShowImportModal(false), (
        <div>
          <div style={{ border: `2px dashed ${T.gray300}`, borderRadius: 12, padding: 40, textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}><i className="fas fa-file-csv"></i></div>
            <p style={{ color: T.gray600, marginBottom: 12 }}>{t('selectCsvFile')}</p>
            <label style={{ ...btn('primary'), cursor: 'pointer' }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {t('selectFile')}<input type="file" accept=".csv" onChange={handleCsvImport} style={{ display: 'none' }} /></label>
          </div>
          <div style={{ background: T.gray50, borderRadius: 8, padding: 12, fontSize: 13, color: T.gray600 }}>
            <strong>{t('csvFormat')}:</strong> {t('csvFormatHelp')}
          </div>
        </div>
      ))}

      {showPurchaseBarcodeModal && (
        <div style={overlay} onClick={() => setShowPurchaseBarcodeModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('purchaseBarcode')}</h3>
            <p style={{ fontSize: 14, color: T.gray600, marginBottom: 12 }}>{t('enterPurchaseId')}</p>
            <div style={{ marginBottom: 16 }}>
              <input value={purchaseBarcodeId} onChange={e => setPurchaseBarcodeId(e.target.value)} placeholder={t('purchaseId')} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowPurchaseBarcodeModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={printPurchaseBarcode} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
            </div>
          </div>
        </div>
      )}

      {showCustomBarcodeModal && (
        <div style={overlay} onClick={() => setShowCustomBarcodeModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-barcode" style={{marginRight: 4}}></i> {t('customBarcode')}</h3>
            <p style={{ fontSize: 14, color: T.gray600, marginBottom: 12 }}>{t('selectProductsForBarcode')}</p>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
              <input value={customBarcodeSearch} onChange={e => setCustomBarcodeSearch(e.target.value)} placeholder={t('searchBarcode')} style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 8, marginBottom: 16 }}>
              {products.filter((p: any) => p.code && (!customBarcodeSearch || (p.name || '').toLowerCase().includes(customBarcodeSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(customBarcodeSearch.toLowerCase()))).map((p: any) => {
                const isSelected = customBarcodeProducts.some((cp: any) => cp.id === p.id);
                return (
                  <div key={p.id} onClick={() => { setCustomBarcodeProducts(isSelected ? customBarcodeProducts.filter((cp: any) => cp.id !== p.id) : [...customBarcodeProducts, p]); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, background: isSelected ? T.tealLight : T.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={isSelected} readOnly style={{ width: 16, height: 16 }} />
                    <div><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{p.code}</div></div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: T.gray500 }}>{customBarcodeProducts.length} {t('products')} {t('selected')}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCustomBarcodeModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={printCustomBarcode} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
            </div>
          </div>
        </div>
      )}

      {showAddProductModal && (
        <div style={overlay} onClick={() => setShowAddProductModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addNewProduct')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>{t('productName')} *</label><input value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} style={inputStyle} placeholder={t('productName')} /></div>
              <div><label style={labelStyle}>{t('barcode')}</label><input value={productForm.code} onChange={e => setProductForm({ ...productForm, code: e.target.value })} style={inputStyle} placeholder={t('barcode')} /></div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>{t('supplierId')} / {t('company')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={productForm.supplierId}
                    onChange={e => {
                      const val = e.target.value;
                      const found = suppliers.find((s: any) => s.id === val || s.name.toLowerCase() === val.toLowerCase());
                      if (found) {
                        setProductForm({ ...productForm, supplierId: found.id, company: found.name });
                      } else {
                        setProductForm({ ...productForm, supplierId: val });
                      }
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const found = suppliers.find((s: any) => s.id === productForm.supplierId || s.name.toLowerCase() === productForm.supplierId.toLowerCase());
                        if (found) {
                          setProductForm({ ...productForm, supplierId: found.id, company: found.name });
                        }
                      }
                    }}
                    style={inputStyle}
                    placeholder={`${t('supplierId')} - ${t('enterToSearch')}`}
                  />
                  {productForm.supplierId && suppliers.filter((s: any) =>
                    s.id.includes(productForm.supplierId) || s.name.toLowerCase().includes(productForm.supplierId.toLowerCase())
                  ).length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 7, maxHeight: 150, overflow: 'auto', zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                      {suppliers.filter((s: any) =>
                        s.id.includes(productForm.supplierId) || s.name.toLowerCase().includes(productForm.supplierId.toLowerCase())
                      ).map((s: any) => (
                        <div key={s.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 13 }} onClick={() => {
                          setProductForm({ ...productForm, supplierId: s.id, company: s.name });
                        }}>
                          <span style={{ color: T.teal, fontWeight: 600 }}>{s.id}</span> - <span>{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {productForm.company && <div style={{ fontSize: 12, color: T.green, marginTop: 4 }}><i className="fas fa-check" style={{marginRight: 4}}></i> {productForm.company}</div>}
              </div>
              <div><label style={labelStyle}>{t('category')}</label><input value={productForm.cat} onChange={e => setProductForm({ ...productForm, cat: e.target.value })} style={inputStyle} placeholder={t('category')} /></div>
              <div><label style={labelStyle}>{t('unit')}</label><input value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} style={inputStyle} placeholder={t('unit')} /></div>
              <div><label style={labelStyle}>{t('minStock')}</label><input type="number" value={productForm.minStock} onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 5 })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('purchasePrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('sellPrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={productForm.sellPrice} onChange={e => setProductForm({ ...productForm, sellPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('stock')}</label><input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <button onClick={() => setShowAddProductModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={handleAddProduct} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>
            </div>
          </div>
        </div>
      )}

      {editFullProduct && (
        <div style={overlay} onClick={() => setEditFullProduct(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit')}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>{t('productName')} *</label><input value={editFullProduct.name} onChange={e => setEditFullProduct({ ...editFullProduct, name: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('barcode')}</label><input value={editFullProduct.code} onChange={e => setEditFullProduct({ ...editFullProduct, code: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('company')}</label><input value={editFullProduct.company} onChange={e => setEditFullProduct({ ...editFullProduct, company: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('category')}</label><input value={editFullProduct.cat} onChange={e => setEditFullProduct({ ...editFullProduct, cat: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('unit')}</label><input value={editFullProduct.unit} onChange={e => setEditFullProduct({ ...editFullProduct, unit: e.target.value })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('minStock')}</label><input type="number" value={editFullProduct.minStock} onChange={e => setEditFullProduct({ ...editFullProduct, minStock: parseInt(e.target.value) || 5 })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('purchasePrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editFullProduct.costPrice} onChange={e => setEditFullProduct({ ...editFullProduct, costPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
              <div><label style={labelStyle}>{t('sellPrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editFullProduct.sellPrice} onChange={e => setEditFullProduct({ ...editFullProduct, sellPrice: parseFloat(e.target.value) || 0 })} style={inputStyle} /></div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>
              <button onClick={() => setEditFullProduct(null)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={handleEditFullProduct} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('saveChanges')}</button>
            </div>
          </div>
        </div>
      )}

      {viewSupplier && (
        <div style={overlay} onClick={() => setViewSupplier(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-building" style={{marginRight: 4}}></i> {viewSupplier.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div><div style={{ fontSize: 13, color: T.gray400 }}>{t('products')}</div><div style={{ fontWeight: 600, fontSize: 16 }}>{viewSupplier.prodCount}</div></div>
              <div><div style={{ fontSize: 13, color: T.gray400 }}>{t('purchases')}</div><div style={{ fontWeight: 600, fontSize: 16 }}>{viewSupplier.purchaseCount}</div></div>
              <div style={{ gridColumn: 'span 2' }}><div style={{ fontSize: 13, color: T.gray400 }}>{t('totalPurchase')}</div><div style={{ fontWeight: 700, fontSize: 18, color: T.green }}>{fmt(viewSupplier.totalPurchase)}</div></div>
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: T.gray600 }}>{t('products')}</h4>
            <div style={{ maxHeight: 200, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 8, marginBottom: 16 }}>
              {products.filter((p: any) => (p.company || '').toLowerCase() === viewSupplier.name.toLowerCase()).map((p: any) => (
                <div key={p.id} style={{ padding: '8px 12px', borderBottom: `1px solid ${T.gray100}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14 }}>{p.name}</span>
                  <span style={{ fontSize: 14, color: T.gray500 }}>{fmt(p.sellPrice)}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setViewSupplier(null)} style={{ ...btn(), width: '100%' }}>{t('close')}</button>
          </div>
        </div>
      )}

      {viewCategory && (
        <div style={overlay} onClick={() => setViewCategory(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {viewCategory.name}</h3>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: T.gray400 }}>{t('totalValue')}</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: T.green }}>{fmt(viewCategory.totalValue)}</div>
            </div>
            <div style={{ maxHeight: 300, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 8, marginBottom: 16 }}>
              {viewCategory.products.map((p: any) => (
                <div key={p.id} style={{ padding: '8px 12px', borderBottom: `1px solid ${T.gray100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: T.gray400 }}>{p.code || '-'}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(p.sellPrice)}</div><div style={{ fontSize: 12, color: T.gray500 }}>{t('stock')}: {p.stock}</div></div>
                </div>
              ))}
            </div>
            <button onClick={() => setViewCategory(null)} style={{ ...btn(), width: '100%' }}>{t('close')}</button>
          </div>
        </div>
      )}

      {showStockHistoryModal && (
        <div style={overlay} onClick={() => setShowStockHistoryModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 500, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-box" style={{marginRight: 4}}></i> {stockHistoryFilter === 'add' ? t('stockAddHistory') : stockHistoryFilter === 'remove' ? t('stockRemoveHistory') : t('stock')} {t('history')}</h3>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {stockHistory.filter((h: any) => stockHistoryFilter === 'all' || h.type === stockHistoryFilter).length === 0 ? (
                <p style={{ textAlign: 'center', color: T.gray400, padding: 20 }}>{t('noPriceHistory')}</p>
              ) : (
                stockHistory.filter((h: any) => stockHistoryFilter === 'all' || h.type === stockHistoryFilter).map((h: any, i: number) => (
                  <div key={i} style={{ padding: 10, background: h.type === 'add' ? T.greenLight : T.redLight, borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <div><strong>{h.productName}</strong><div style={{ fontSize: 12, color: T.gray500 }}>{new Date(h.created_at).toLocaleString()}</div><div style={{ fontSize: 12, color: T.gray500 }}>{h.reason || '-'}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontWeight: 700, color: h.type === 'add' ? T.green : T.red }}>{h.type === 'add' ? '+' : '-'}{h.quantity}</div><div style={{ fontSize: 12, color: T.gray500 }}>{h.oldStock} → {h.newStock}</div></div>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowStockHistoryModal(false)} style={{ ...btn(), width: '100%', marginTop: 12 }}>{t('close')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
