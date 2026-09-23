import { useState, useEffect } from 'react';











import { useLanguage } from './i18n';











import { api } from './api';























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

  const isExpiringSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const str = String(dateStr);
    const m = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    let d: Date;
    if (m) d = new Date(`${m[3]}-${m[2]}-${m[1]}`);
    else d = new Date(str);
    if (isNaN(d.getTime())) return false;
    const now = new Date();
    const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days <= 30;
  };











  const [products, setProducts] = useState<any[]>(_initProducts || []);











  const [suppliers, setSuppliers] = useState<any[]>(_initSuppliers || []);











  const [categories, setCategories] = useState<any[]>(_initCategories || []);











  const [productTab, setProductTab] = useState('allProducts');











  const [search, setSearch] = useState('');











  const [editProduct, setEditProduct] = useState<any>(null);











  const [viewProduct, setViewProduct] = useState<any>(null);











  const [viewPurchase, setViewPurchase] = useState<any>(null);











  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);











  const [deleteHistory, setDeleteHistory] = useState<any[]>([]);











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











  const [tempProducts, setTempProducts] = useState<any[]>(() => { try { const d = localStorage.getItem('pos_temp_products'); return d ? JSON.parse(d) : []; } catch { return []; } });

  useEffect(() => { localStorage.setItem('pos_temp_products', JSON.stringify(tempProducts)); }, [tempProducts]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu]')) {
        setShowMoreMenu(false);
        setShowCategoryMoreMenu(false);
        setShowStockMoreMenu(false);
        setShowSupplierMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);











  const [productForm, setProductForm] = useState({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' });











  const [editFullProduct, setEditFullProduct] = useState<any>(null);











  const [viewSupplier, setViewSupplier] = useState<any>(null);











  const [viewCategory, setViewCategory] = useState<any>(null);











  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);











  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'profit' | 'expiry'>('name');











  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');











  const [stockHistory, setStockHistory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);











  const [stockHistoryFilter, setStockHistoryFilter] = useState<'all' | 'add' | 'remove'>('all');























  // Load ALL data from MySQL on mount - always override local data











  useEffect(() => {











    const loadData = async () => {











      try {











        const token = localStorage.getItem('pos_api_token');
        if (!token) {
          // No hardcoded fallback login — App session provides auth
          throw new Error('No auth token');
        }











        const [prods, cats, sups, hist, salesData] = await Promise.all([api.getProducts(), api.getCategories(), api.getSuppliers(), api.getStockHistory(), api.getSales()]);











        setProducts(prods);











        setCategories(cats);











        setSuppliers(sups);











        setStockHistory(hist);











        setSales(Array.isArray(salesData) ? salesData : []);











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
    else if (sortBy === 'expiry') {
      const parseD = (s: any) => {
        if (!s) return null;
        const str = String(s);
        const m1 = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (m1) return new Date(`${m1[3]}-${m1[2]}-${m1[1]}`).getTime();
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d.getTime();
      };
      const da = parseD(a.expiryDate);
      const db = parseD(b.expiryDate);
      if (da === null && db === null) cmp = 0;
      else if (da === null) cmp = 1;
      else if (db === null) cmp = -1;
      else cmp = da - db;
    }
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











    const latestForPrice = products.find((p: any) => p.id === editProduct.id);
    api.updateProduct(editProduct.id, {
      ...(latestForPrice || editProduct),
      costPrice: editProduct.costPrice,
      sellPrice: editProduct.sellPrice,
    }).catch(() => {});
    if (latestForPrice && (
      latestForPrice.costPrice !== editProduct.costPrice ||
      latestForPrice.sellPrice !== editProduct.sellPrice
    )) {
      api.addStockHistory({
        productId: editProduct.id,
        productName: editProduct.name || latestForPrice.name,
        type: 'price',
        quantity: 0,
        oldStock: latestForPrice.sellPrice || 0,
        newStock: editProduct.sellPrice || 0,
        reason: `Cost ${latestForPrice.costPrice || 0}→${editProduct.costPrice || 0}, Sell ${latestForPrice.sellPrice || 0}→${editProduct.sellPrice || 0}`,
      }).then((res: any) => {
        setStockHistory(prev => [{
          id: res.id,
          productId: editProduct.id,
          productName: editProduct.name || latestForPrice.name,
          type: 'price',
          quantity: 0,
          oldPrice: latestForPrice.sellPrice || 0,
          newPrice: editProduct.sellPrice || 0,
          oldStock: latestForPrice.sellPrice || 0,
          newStock: editProduct.sellPrice || 0,
          reason: res.reason || '',
          created_at: new Date().toISOString(),
        }, ...prev]);
      }).catch(() => {});
    }











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











    setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' });











  };























  const handleAddToTempList = () => {











    if (!productForm.name.trim()) { alert(t('enterName')); return; }











    const tempProduct = { id: genId(), ...productForm, _temp: true };











    setTempProducts(prev => [...prev, tempProduct]);











    setProductForm({ name: '', code: '', company: productForm.company, cat: productForm.cat, unit: productForm.unit, costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: productForm.supplierId, vat: _settings?.vatPercent ?? 0, expiryDate: '' });











  };























  const handleRemoveTempProduct = (id: string) => {











    setTempProducts(prev => prev.filter(p => p.id !== id));










  };

  const handleClearTempProducts = () => {
    if (tempProducts.length === 0) return;
    if (window.confirm(t('clearAll') || 'Clear all products from list?')) {
      setTempProducts([]);
    }
  };























  const handlePostTempProducts = async () => {











    if (tempProducts.length === 0) { alert(t('addAtLeastOne')); return; }











    const companyGroups: Record<string, any[]> = {};
    tempProducts.forEach((p: any) => {
      const key = p.company || p.supplierId || 'unknown';
      if (!companyGroups[key]) companyGroups[key] = [];
      companyGroups[key].push(p);
    });

    const results: any[] = [];
    const purchaseIds: string[] = [];

    for (const [, group] of Object.entries(companyGroups)) {
      const purchaseId = genUniqueId();
      purchaseIds.push(purchaseId);
      const groupResults = await Promise.allSettled(
        group.map((p: any) => {
          const existingProd = products.find((ep: any) => (ep.code || '').toLowerCase() === (p.code || '').toLowerCase());
          if (existingProd) {
            const newStock = (existingProd.stock || 0) + (p.stock || 0);
            delete p._temp;
            return api.updateProduct(existingProd.id, { ...existingProd, stock: newStock });
          }
          const product = { ...p, purchaseId };
          delete product._temp;
          return api.addProduct(product);
        })
      );
      results.push(...groupResults);
    }

    const succeeded = results.filter(r => r.status === 'fulfilled').length;











    const failed = results.filter(r => r.status === 'rejected').length;











    const [prods] = await Promise.all([api.getProducts()]);











    setProducts(prods);











    setProductsParent(prods);











    setTempProducts([]);











    alert(`${purchaseIds.length} Purchase IDs created: ${purchaseIds.join(', ')} | ${succeeded} ${t('saved')}${failed ? `, ${failed} failed` : ''}`);











  };























  const handleEditFullProduct = () => {











    if (!editFullProduct) return;











    const updated = products.map((p: any) => p.id === editFullProduct.id ? { ...p, name: editFullProduct.name, code: editFullProduct.code, company: editFullProduct.company, cat: editFullProduct.cat, unit: editFullProduct.unit, costPrice: editFullProduct.costPrice, sellPrice: editFullProduct.sellPrice, minStock: editFullProduct.minStock } : p);











    setProducts(updated);











    setProductsParent(updated);











    const latestFull = products.find((p: any) => p.id === editFullProduct.id);
    const payloadFull = { ...(latestFull || editFullProduct), ...editFullProduct, id: editFullProduct.id };
    if (latestFull && (latestFull.costPrice !== editFullProduct.costPrice || latestFull.sellPrice !== editFullProduct.sellPrice)) {
      // keep live stock from latestFull if form stock stale
      payloadFull.stock = latestFull.stock;
    }
    api.updateProduct(editFullProduct.id, payloadFull).catch(() => {});
    if (latestFull && (
      latestFull.costPrice !== editFullProduct.costPrice ||
      latestFull.sellPrice !== editFullProduct.sellPrice
    )) {
      api.addStockHistory({
        productId: editFullProduct.id,
        productName: editFullProduct.name || latestFull.name,
        type: 'price',
        quantity: 0,
        oldStock: latestFull.sellPrice || 0,
        newStock: editFullProduct.sellPrice || 0,
        reason: `Cost ${latestFull.costPrice || 0}→${editFullProduct.costPrice || 0}, Sell ${latestFull.sellPrice || 0}→${editFullProduct.sellPrice || 0}`,
      }).then((res: any) => {
        setStockHistory(prev => [{
          id: res.id,
          productId: editFullProduct.id,
          productName: editFullProduct.name || latestFull.name,
          type: 'price',
          quantity: 0,
          oldPrice: latestFull.sellPrice || 0,
          newPrice: editFullProduct.sellPrice || 0,
          oldStock: latestFull.sellPrice || 0,
          newStock: editFullProduct.sellPrice || 0,
          reason: res.reason || '',
          created_at: new Date().toISOString(),
        }, ...prev]);
      }).catch(() => {});
    }











    setEditFullProduct(null);











  };























  const deleteProduct = (id: string) => {











    const product = products.find((p: any) => p.id === id);











    if (!product) return;











    if (!window.confirm(`"${product.name}" ${t('confirmDelete')}`)) return;











    const updated = products.filter((p: any) => p.id !== id);
    setDeleteHistory(prev => [{
      id: product.id,
      name: product.name,
      code: product.code || '',
      stock: product.stock || 0,
      costPrice: product.costPrice || 0,
      sellPrice: product.sellPrice || 0,
      deletedAt: new Date().toISOString(),
    }, ...prev].slice(0, 200));











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











      const valid: any[] = [];
      for (const item of items) {
        if (!item.name) continue;
        const existing = products.find((ep: any) =>
          ((ep.code || '').toLowerCase() === (item.code || '').toLowerCase() && item.code) ||
          ((ep.name || '').toLowerCase() === (item.name || '').toLowerCase() && !item.code)
        );
        if (existing && item.code) {
          const newStock = (existing.stock || 0) + (item.stock || 0);
          const merged = { ...existing, stock: newStock };
          setProducts(prev => prev.map(p => p.id === existing.id ? merged : p));
          setProductsParent(products.map(p => p.id === existing.id ? merged : p));
          api.updateProduct(existing.id, merged).catch(() => {});
        } else if (!existing) {
          valid.push(item);
        }
      }











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











    // Save stock change to MySQL API (server also writes stock_history)
    api.adjustStock({
      productId: stockAdjustProduct.id,
      productName: stockAdjustProduct.name,
      quantity: qty,
      type: stockAdjustType,
      reason: stockAdjustReason,
    }).then((res: any) => {
      setStockHistory(prev => [{
        id: `local-${Date.now()}`,
        productId: stockAdjustProduct.id,
        productName: stockAdjustProduct.name,
        type: stockAdjustType === 'add' ? 'add' : 'remove',
        quantity: qty,
        oldStock: res.oldStock ?? oldStock,
        newStock: res.newStock ?? newStock,
        reason: stockAdjustReason,
        created_at: new Date().toISOString(),
      }, ...prev]);
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











            {[t('productName'), t('company'), t('category'), t('purchasePrice'), t('sellPrice'), t('profit'), t('stock'), t('unit'), t('expiryDate'), t('actions')].map((h, i) => (











              <th key={i} style={{ padding: '10px 12px', textAlign: i >= 3 && i <= 5 ? 'right' : i >= 6 ? 'center' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>











            ))}











          </tr></thead>











          <tbody>











            {filteredProducts.length === 0 ? (











              <tr><td colSpan={10} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>{t('noProductsYet')}</td></tr>











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











                  <td style={{ padding: '10px 12px', textAlign: 'right' }}><span style={{ fontSize: 13, fontWeight: 600, color: (p.sellPrice - p.costPrice) > 0 ? T.green : (p.sellPrice - p.costPrice) < 0 ? T.red : T.gray400 }}>{fmt(p.sellPrice - p.costPrice)} ({pct === 0 && p.costPrice === 0 && (p.sellPrice - p.costPrice) > 0 ? '∞' : pct}%)</span></td>











                  <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ fontWeight: 700, fontSize: 15, color: p.stock <= 0 ? T.red : low ? T.amber : T.gray900 }}>{fmtN(p.stock)}</span>{low && <i className="fas fa-triangle-exclamation" style={{color:'#F59E0B',marginRight:4}}></i>}{p.stock <= 0 && ' <i className="fas fa-xmark"></i>'}</td>











                  <td style={{ padding: '10px 12px', fontSize: 14, color: T.gray400, textAlign: 'center' }}>{p.unit}</td>

                  <td style={{ padding: '10px 12px', fontSize: 13, textAlign: 'center', color: p.expiryDate ? (isExpiringSoon(p.expiryDate) ? '#E11D48' : T.gray600) : T.gray400, fontWeight: p.expiryDate && isExpiringSoon(p.expiryDate) ? 700 : 400 }}>{p.expiryDate || '-'}</td>

                  <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>











                    <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewProduct(p)}><i className="fas fa-eye"></i></button>











                    <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setEditFullProduct({ ...p })}><i className="fas fa-pen"></i></button>











                    <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => printBarcode(p)}><i className="fas fa-barcode"></i></button>











                    {p.stock <= 0 ? <button style={{ ...btn('danger', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => deleteProduct(p.id)}><i className="fas fa-trash"></i></button> : <button disabled style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: 0.4, cursor: 'not-allowed' }}><i className="fas fa-lock"></i></button>}











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











              {[t('id'), t('name'), t('products'), t('categories'), t('stock'), t('totalPurchase'), t('actions')].map((h, i) => (











                <th key={i} style={{ padding: '10px 12px', textAlign: i === 1 ? 'left' : i >= 2 && i <= 4 ? 'center' : i === 5 ? 'right' : i === 6 ? 'center' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>











              ))}











            </tr></thead>











            <tbody>











              {filteredSuppliers.map((company: string, i: number) => {











                const supplier = suppliers.find((s: any) => s.name === company);











                const supplierProducts = products.filter((p: any) => (p.company || '').toLowerCase() === company.toLowerCase());











                const prodCount = supplierProducts.length;











                const catCount = [...new Set(supplierProducts.map((p: any) => p.cat).filter(Boolean))].length;











                const totalStock = supplierProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0);











                const totalPurchase = supplierProducts.reduce((s: number, p: any) => s + (p.stock || 0) * (p.costPrice || 0), 0);











                const hasProducts = prodCount > 0;











                return (











                  <tr key={company} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>











                    <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500, fontFamily: 'monospace' }}>{supplier?.id || '-'}</td>











                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 180 }} onClick={() => setViewSupplier({ name: company, prodCount, totalPurchase })}>{company}<div style={{ fontSize: 12, color: T.gray400 }}>{supplier?.crNumber || '-'}</div></td>











                    <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ background: T.tealLight, color: T.teal, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{prodCount}</span></td>











                    <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{catCount}</span></td>











                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{totalStock}</td>











                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: T.green }}>{fmt(totalPurchase)}</td>











                    <td style={{ padding: '10px 12px', display: 'flex', gap: 4, justifyContent: 'center' }}>











                      <button disabled={hasProducts} style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasProducts ? 0.3 : 1, cursor: hasProducts ? 'not-allowed' : 'pointer' }} onClick={() => { setEditingSupplier(supplier); setSupplierForm(supplier); setShowSupplierModal(true); }}><i className="fas fa-pen"></i></button>











                      <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewSupplier({ name: company, prodCount, totalPurchase })}><i className="fas fa-eye"></i></button>











                      <button disabled={hasProducts} style={{ ...btn('danger', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasProducts ? 0.3 : 1, cursor: hasProducts ? 'not-allowed' : 'pointer' }} onClick={() => deleteSupplier(company)}><i className="fas fa-trash"></i></button>











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











                      <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewCategory({ name: cat, products: catProducts, totalValue })}><i className="fas fa-eye"></i></button>











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











                    <button style={{ ...btn('primary', 'sm') }} onClick={() => printBarcode(p)}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>











                  </td>











                </tr>











              ))}











            </tbody>











          </table>











        )}











      </div>











    </div>











  );























  const renderViewProduct = () => {
    if (!viewProduct) return null;
    const p = viewProduct;
    const pct = p.costPrice > 0 ? Math.round((p.sellPrice - p.costPrice) / p.costPrice * 100) : 0;
    const unitProfit = (p.sellPrice || 0) - (p.costPrice || 0);
    const low = p.stock > 0 && p.stock <= (p.minStock || 5);
    const inventoryValue = (p.costPrice || 0) * (p.stock || 0);

    // Sales containing this product
    const productSales = (sales || []).filter((s: any) =>
      (s.items || []).some((it: any) =>
        (p.id && it.productId === p.id) ||
        (p.code && it.barcode === p.code) ||
        ((p.name || '').toLowerCase() === (it.name || '').toLowerCase())
      )
    ).sort((a: any, b: any) => {
      const da = a.date || a.created_at || 0;
      const db = b.date || b.created_at || 0;
      return (Number(db) || 0) - (Number(da) || 0);
    });

    let totalSoldQty = 0;
    let totalRevenue = 0;
    let totalProfit = 0;
    productSales.forEach((s: any) => {
      (s.items || []).forEach((it: any) => {
        const match = (p.id && it.productId === p.id) ||
          (p.code && it.barcode === p.code) ||
          ((p.name || '').toLowerCase() === (it.name || '').toLowerCase());
        if (!match) return;
        const qty = +it.quantity || 0;
        const price = +it.price || 0;
        const cost = p.costPrice || 0;
        totalSoldQty += qty;
        totalRevenue += price * qty;
        totalProfit += (price - cost) * qty;
      });
    });

    // Stock history for this product
    const productStockHist = (stockHistory || []).filter((h: any) =>
      (p.id && h.productId === p.id) ||
      ((p.name || '').toLowerCase() === (h.productName || '').toLowerCase())
    ).sort((a: any, b: any) => {
      const da = a.created_at || 0;
      const db = b.created_at || 0;
      return String(db).localeCompare(String(da));
    });
    const stockAdds = productStockHist.filter((h: any) => h.type === 'add' || h.type === 'purchase');
    const lastStockAdd = stockAdds[0] || null;

    // Purchases containing this product
    const productPurchases = (purchases || []).filter((pu: any) =>
      (pu.items || []).some((it: any) =>
        (p.id && it.productId === p.id) ||
        ((p.name || '').toLowerCase() === (it.name || '').toLowerCase())
      )
    );

    const stats = [
      { icon: 'fas fa-warehouse', label: t('currentStock') || t('stock'), value: `${p.stock ?? 0} ${p.unit || ''}`, color: p.stock <= 0 ? T.red : low ? '#D97706' : T.green, bg: p.stock <= 0 ? T.redLight : low ? '#FEF3C7' : '#DCFCE7' },
      { icon: 'fas fa-shopping-cart', label: t('totalSold') || 'Total Sold', value: `${totalSoldQty} ${p.unit || ''}`, color: T.teal, bg: T.tealLight },
      { icon: 'fas fa-sack-dollar', label: t('totalProfit') || t('profit'), value: fmt(totalProfit), color: totalProfit >= 0 ? T.green : T.red, bg: totalProfit >= 0 ? '#DCFCE7' : T.redLight },
      { icon: 'fas fa-coins', label: t('totalRevenue') || t('sellPrice'), value: fmt(totalRevenue), color: '#0369A1', bg: '#E0F2FE' },
      { icon: 'fas fa-boxes-stacked', label: t('inventoryValue') || t('purchasePrice'), value: fmt(inventoryValue), color: '#7C3AED', bg: '#EDE9FE' },
      { icon: 'fas fa-receipt', label: t('totalInvoices') || 'Invoices', value: `${productSales.length}`, color: '#B45309', bg: '#FEF3C7' },
    ];

    const infoFields: [string, any][] = [
      [t('productName'), p.name || '-'],
      [t('barcode'), p.code || '-'],
      [t('company'), p.company || '-'],
      [t('category'), p.cat || '-'],
      [t('purchasePrice'), fmt(p.costPrice)],
      [t('sellPrice'), fmt(p.sellPrice)],
      [t('unitProfit') || t('profit'), `${fmt(unitProfit)} (${pct}%)`],
      [t('minStock'), `${p.minStock || 5} ${p.unit || ''}`],
      [t('unit'), p.unit || '-'],
      [t('expiryDate'), p.expiryDate || '-'],
      [t('vat'), p.vat != null ? `${p.vat}%` : '-'],
      [t('supplier') || t('suppliers'), p.company || p.supplierId || '-'],
      [t('description') || 'Description', p.description || '-'],
      [t('createdAt') || 'Created', p.createdAt || p.created_at || '-'],
    ];

    const fmtDate = (d: any) => {
      if (!d) return '-';
      const n = Number(d);
      const dt = !isNaN(n) && n > 1000000000000 ? new Date(n) : new Date(d);
      return isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
    };

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
        {/* Top bar */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={{ ...btn('ghost', 'sm') }} onClick={() => setViewProduct(null)}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}>/ {t('productDetails')}</span>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Profile Header */}
          <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark} 100%)`, padding: '28px 24px 24px', color: T.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ width: 84, height: 84, borderRadius: 20, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
                <i className="fas fa-box" style={{ fontSize: 36 }}></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word' }}>{p.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8, alignItems: 'center', fontSize: 13, opacity: 0.92 }}>
                  {p.code && <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 12, fontFamily: 'monospace' }}><i className="fas fa-barcode" style={{marginRight: 4}}></i>{p.code}</span>}
                  {p.cat && <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 12 }}><i className="fas fa-folder" style={{marginRight: 4}}></i>{p.cat}</span>}
                  {p.company && <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 12 }}><i className="fas fa-building" style={{marginRight: 4}}></i>{p.company}</span>}
                  <span style={{ padding: '3px 10px', borderRadius: 12, background: p.stock <= 0 ? '#DC2626' : low ? '#D97706' : '#16A34A', fontWeight: 700 }}>
                    {p.stock <= 0 ? t('outOfStock') : low ? t('lowStock') : t('inStock')}
                  </span>
                  {p.expiryDate && isExpiringSoon(p.expiryDate) && (
                    <span style={{ padding: '3px 10px', borderRadius: 12, background: '#E11D48', fontWeight: 700 }}><i className="fas fa-triangle-exclamation" style={{marginRight: 4}}></i>{t('expiryDate')}: {p.expiryDate}</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{fmt(p.sellPrice)}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{t('sellPrice')}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setViewProduct(null); setEditFullProduct({ ...p }); }} style={{ ...btn('ghost', 'sm'), background: 'rgba(255,255,255,0.2)', color: T.white, border: '1px solid rgba(255,255,255,0.4)' }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit') || 'Edit'}</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12, marginBottom: 22 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, padding: '14px 16px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <i className={s.icon} style={{ color: s.color, fontSize: 16 }}></i>
                  </div>
                  <div style={{ fontSize: 12, color: T.gray400, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, wordBreak: 'break-word' }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
              {/* Product Info */}
              <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontWeight: 700, fontSize: 14, color: T.teal, background: T.tealLight }}>
                  <i className="fas fa-circle-info" style={{marginRight: 6}}></i>{t('productDetails') || 'Product Info'}
                </div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {infoFields.map(([label, value]) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: T.gray400, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: T.gray900, wordBreak: 'break-word' }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Activity Timeline */}
              <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontWeight: 700, fontSize: 14, color: T.teal, background: T.tealLight, display: 'flex', justifyContent: 'space-between' }}>
                  <span><i className="fas fa-clock-rotate-left" style={{marginRight: 6}}></i>{t('stockHistory') || 'Stock Activity'}</span>
                  <span style={{ fontSize: 13, color: T.gray500, fontWeight: 600 }}>{productStockHist.length}</span>
                </div>
                <div style={{ padding: 12, maxHeight: 360, overflow: 'auto' }}>
                  {productStockHist.length === 0 ? (
                    <div style={{ textAlign: 'center', color: T.gray400, padding: 24, fontSize: 13 }}>{t('noStockHistory') || 'No stock activity yet'}</div>
                  ) : productStockHist.slice(0, 50).map((h: any, i: number) => {
                    const isAdd = h.type === 'add' || h.type === 'purchase';
                    return (
                      <div key={h.id || i} style={{ display: 'flex', gap: 10, padding: '8px 6px', borderBottom: i < Math.min(productStockHist.length, 50) - 1 ? `1px solid ${T.gray100}` : 'none', alignItems: 'flex-start' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: isAdd ? '#DCFCE7' : T.redLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={isAdd ? 'fas fa-arrow-up' : 'fas fa-arrow-down'} style={{ color: isAdd ? T.green : T.red, fontSize: 12 }}></i>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>
                            <span style={{ color: isAdd ? T.green : T.red }}>{isAdd ? '+' : '-'}{h.quantity || 0}</span>
                            <span style={{ color: T.gray500, fontWeight: 400 }}> · {h.type}</span>
                          </div>
                          {h.reason && <div style={{ fontSize: 12, color: T.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.reason}</div>}
                          <div style={{ fontSize: 11, color: T.gray400 }}>{fmtDate(h.created_at)}</div>
                        </div>
                        <div style={{ fontSize: 12, color: T.gray500, textAlign: 'right', flexShrink: 0 }}>
                          {h.oldStock != null && <div>{h.oldStock} → {h.newStock}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {lastStockAdd && (
                  <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.gray100}`, fontSize: 12, color: T.gray500, background: T.gray50 }}>
                    <i className="fas fa-box-open" style={{marginRight: 4, color: T.green}}></i>
                    <strong>{t('lastStockAdd') || 'Last stock added'}:</strong> {fmtDate(lastStockAdd.created_at)} (+{lastStockAdd.quantity})
                  </div>
                )}
              </div>
            </div>

            {/* Sales History */}
            <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontWeight: 700, fontSize: 14, color: T.teal, background: T.tealLight, display: 'flex', justifyContent: 'space-between' }}>
                <span><i className="fas fa-receipt" style={{marginRight: 6}}></i>{t('salesHistory') || 'Sales History'}</span>
                <span style={{ fontSize: 13, color: T.gray500, fontWeight: 600 }}>{productSales.length} {t('invoices') || 'invoices'}</span>
              </div>
              {productSales.length === 0 ? (
                <div style={{ textAlign: 'center', color: T.gray400, padding: 28, fontSize: 13 }}>{t('noSalesYet') || 'No sales yet'}</div>
              ) : (
                <div style={{ overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: T.gray50 }}>
                        {[t('invoice') || t('invoiceNo') || 'Invoice', t('date'), t('customer') || 'Customer', t('qty') || 'Qty', t('price') || t('sellPrice'), t('total') || 'Total'].map((h, i) => (
                          <th key={i} style={{ padding: '10px 14px', textAlign: i >= 3 ? 'right' : 'left', fontSize: 12, fontWeight: 700, color: T.gray500, textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: `1px solid ${T.gray200}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {productSales.slice(0, 50).map((s: any, si: number) => {
                        const items = (s.items || []).filter((it: any) =>
                          (p.id && it.productId === p.id) ||
                          (p.code && it.barcode === p.code) ||
                          ((p.name || '').toLowerCase() === (it.name || '').toLowerCase())
                        );
                        const qty = items.reduce((a: number, it: any) => a + (+it.quantity || 0), 0);
                        const lineTotal = items.reduce((a: number, it: any) => a + ((+it.price || 0) * (+it.quantity || 0)), 0);
                        const invNo = s.invoiceNo || s.invoice_no || s.id;
                        return (
                          <tr key={s.id || si} style={{ background: si % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: T.teal }}>{invNo}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray600 }}>{fmtDate(s.date || s.created_at)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray600 }}>{s.customerName || s.customer_id || '-'}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>{qty}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 13, color: T.gray600 }}>{fmt(items[0] ? items[0].price : p.sellPrice)}</td>
                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, fontSize: 13, color: T.green }}>{fmt(lineTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Purchase History */}
            <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontWeight: 700, fontSize: 14, color: T.teal, background: T.tealLight, display: 'flex', justifyContent: 'space-between' }}>
                <span><i className="fas fa-truck" style={{marginRight: 6}}></i>{t('purchaseHistory') || 'Purchase History'}</span>
                <span style={{ fontSize: 13, color: T.gray500, fontWeight: 600 }}>{productPurchases.length}</span>
              </div>
              {productPurchases.length === 0 ? (
                <div style={{ textAlign: 'center', color: T.gray400, padding: 24, fontSize: 13 }}>{t('noPurchaseRecords') || 'No purchase records'}</div>
              ) : (
                <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                  {productPurchases.slice(0, 20).map((pu: any, pi: number) => {
                    const items = (pu.items || []).filter((it: any) =>
                      (p.id && it.productId === p.id) ||
                      ((p.name || '').toLowerCase() === (it.name || '').toLowerCase())
                    );
                    const qty = items.reduce((a: number, it: any) => a + (+it.quantity || 0), 0);
                    return (
                      <div key={pu.id || pi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: T.gray50, borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{pu.supplier || pu.supplierId || '-'}</div>
                          <div style={{ fontSize: 12, color: T.gray500 }}>{fmtDate(pu.date || pu.created_at)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: T.teal }}>+{qty} {p.unit || ''}</div>
                          <div style={{ fontSize: 12, color: T.gray500 }}>{t('invoice') || 'Invoice'}: {pu.invoiceNo || pu.invoice_no || pu.id || '-'}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setViewProduct(null)} style={{ ...btn('ghost') }}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
              <button onClick={() => { setViewProduct(null); setEditFullProduct({ ...p }); }} style={{ ...btn() }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit') || 'Edit'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const renderPriceHistory = () => {
    const rows = stockHistory.filter((h: any) => h.type === 'price');
    return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setProductTab('allProducts')}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{rows.length}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.tealLight }}>
            {[t('productName'), t('date'), t('oldPrice'), t('newPrice'), t('reason')].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: i >= 2 && i <= 3 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>{t('noPriceHistory')}</td></tr>
            ) : rows.filter((h: any) => !search || (h.productName || '').toLowerCase().includes(search.toLowerCase())).map((h: any, i: number) => (
              <tr key={h.id || i} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}>{h.productName}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500 }}>{h.created_at ? new Date(h.created_at).toLocaleString() : '-'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14 }}><span style={{ textDecoration: 'line-through', color: T.red }}>{fmt(h.oldPrice ?? h.oldStock ?? 0)}</span></td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(h.newPrice ?? h.newStock ?? 0)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray600 }}>{h.reason || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  const renderDeleteHistory = () => {
    return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
        <button style={{ ...btn('ghost', 'sm') }} onClick={() => setProductTab('allProducts')}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
        </div>
        <span style={{ fontSize: 14, color: T.gray400 }}>{deleteHistory.length}</span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
          <thead><tr style={{ background: T.redLight }}>
            {[t('productName'), t('code'), t('stock'), t('sellPrice'), t('deletedAt')].map((h, i) => (
              <th key={i} style={{ padding: '10px 12px', textAlign: i === 2 || i === 3 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.red }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {deleteHistory.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.gray400 }}>{t('noDeleteHistory')}</td></tr>
            ) : deleteHistory.filter((h: any) => !search || (h.name || '').toLowerCase().includes(search.toLowerCase()) || (h.code || '').toLowerCase().includes(search.toLowerCase())).map((h: any, i: number) => (
              <tr key={h.id + h.deletedAt} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}>{h.name}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500, fontFamily: 'monospace' }}>{h.code || '-'}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, color: T.gray600 }}>{h.stock}</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 14, fontWeight: 600 }}>{fmt(h.sellPrice)}</td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500 }}>{h.deletedAt ? new Date(h.deletedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

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











    { id: 'newProduct', icon: <i className="fas fa-plus-circle"></i>, label: t('newProduct') },











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











              <option value="expiry">{t('expiryDate')}</option>











            </select>











            <button style={{ ...btn('ghost', 'sm') }} onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? '↑' : '↓'}</button>











            <div style={{ position: 'relative' }}>











              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowMoreMenu(!showMoreMenu)}>⋯ {t('more')}</button>











              {showMoreMenu && (











                <div data-menu="more" style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 180, padding: 4 }}>






















                  <button onClick={() => { exportProductsCsv(); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>

                  <button onClick={() => { setProductTab('priceHistory'); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-clock-rotate-left" style={{marginRight: 4}}></i> {t('priceHistory')}</button>

                  <button onClick={() => { setProductTab('deleteHistory'); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteHistory')}</button>












































                </div>











              )}











            </div>











          </div>











        )}











        {productTab === 'suppliers' && (











          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>











            <div style={{ position: 'relative' }}>











              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowSupplierMoreMenu(!showSupplierMoreMenu)}>⋯ {t('more')}</button>











              {showSupplierMoreMenu && (











                <div data-menu="supplier" style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>











                  <button onClick={() => { document.getElementById('supplier-csv-input')?.click(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvImport')} {t('suppliers')}</button>
                  <button onClick={() => { const headers = ['Name', 'Phone', 'Email', 'Address', 'CR Number', 'VAT Number']; const demo = [headers.join(','), 'ABC Trading Co,01712345678,abc@trading.com,Dhaka Bangladesh,1234567890,VAT1234', 'XYZ Suppliers,01987654321,xyz@suppliers.com,Chittagong Bangladesh,9876543210,VAT5678'].join('\n'); const blob = new Blob([demo], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'suppliers_template.csv'; a.click(); URL.revokeObjectURL(url); setShowSupplierMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-download" style={{marginRight: 4}}></i> {t('demoCsv')}</button>











                  <button onClick={() => { exportSuppliersCsv(); setShowSupplierMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>











                </div>











              )}
                  <input id="supplier-csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim()); const headers = lines2[0].split(',').map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name')); const phoneIdx = headers.findIndex((h: string) => h.includes('phone')); const emailIdx = headers.findIndex((h: string) => h.includes('email')); const addressIdx = headers.findIndex((h: string) => h.includes('address')); const crIdx = headers.findIndex((h: string) => h.includes('cr')); const vatIdx = headers.findIndex((h: string) => h.includes('vat')); let imported = 0; for (let k = 1; k < lines2.length; k++) { const cols = lines2[k].split(',').map((c: string) => c.trim()); const name = nameIdx >= 0 ? cols[nameIdx] : ''; if (!name) continue; const newS = { id: genUniqueId(), name, phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '', email: emailIdx >= 0 ? cols[emailIdx] || '' : '', address: addressIdx >= 0 ? cols[addressIdx] || '' : '', crNumber: crIdx >= 0 ? cols[crIdx] || '' : '', vatNumber: vatIdx >= 0 ? cols[vatIdx] || '' : '' }; const exists = suppliers.find((s: any) => (s.name || '').toLowerCase() === name.toLowerCase()); if (!exists) { setSuppliers((prev: any[]) => [...prev, newS]); setSuppliersParent((prev: any[]) => [...prev, newS]); api.addSupplier(newS).catch(() => {}); imported++; } } alert(`${imported} ${t('suppliers')} imported!`); }; reader.readAsText(file); e.target.value = ''; }} />











            </div>











            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingSupplier(null); setSupplierForm({ id: genUniqueId(), name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '' }); setShowSupplierModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addSupplier')}</button>











          </div>











        )}











        {productTab === 'categories' && (











          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>











            <div style={{ position: 'relative' }}>











              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowCategoryMoreMenu(!showCategoryMoreMenu)}>⋯ {t('more')}</button>











              {showCategoryMoreMenu && (











                <div data-menu="category" style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>











                  <button onClick={() => { document.getElementById('category-csv-input')?.click(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvImport')} {t('categories')}</button>
                  <button onClick={() => { const headers = ['Name']; const demo = [headers.join(','), 'Electronics', 'Groceries', 'Clothing', 'Stationery'].join('\n'); const blob = new Blob([demo], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'categories_template.csv'; a.click(); URL.revokeObjectURL(url); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-download" style={{marginRight: 4}}></i> {t('demoCsv')}</button>











                  <button onClick={() => { exportCategoriesCsv(); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>











                </div>











              )}
                  <input id="category-csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim()); const headers = lines2[0].split(',').map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name')); let imported = 0; for (let k = 1; k < lines2.length; k++) { const cols = lines2[k].split(',').map((c: string) => c.trim()); const name = nameIdx >= 0 ? cols[nameIdx] : ''; if (!name) continue; const exists = categories.find((ca: any) => (ca.name || '').toLowerCase() === name.toLowerCase()); if (!exists) { const newCat = { id: genUniqueId(), name }; setCategories((prev: any[]) => [...prev, newCat]); setCategoriesParent((prev: any[]) => [...prev, newCat]); api.addCategory(newCat).catch(() => {}); imported++; } } alert(`${imported} ${t('categories')} imported!`); }; reader.readAsText(file); e.target.value = ''; }} />











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











                <div data-menu="stock" style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>











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











                {viewProduct && renderViewProduct()}

{!viewProduct && productTab === 'allProducts' && renderAllProducts()}











        {!viewProduct && productTab === 'newProduct' && (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* LEFT: Supplier + Category + Product Form */}
            <div style={{ flex: '0 0 420px', borderRight: `1px solid ${T.gray200}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.white }}>
              <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px' }}>
                {/* Supplier */}
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('suppliers')}</label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-building" style={{ fontSize: 13 }}></i></div>
                    <input value={productForm.company || productForm.supplierId} onChange={e => { const val = e.target.value; const found = suppliers.find((s: any) => s.id === val || s.name.toLowerCase() === val.toLowerCase()); if (found) { setProductForm({ ...productForm, supplierId: found.id, company: found.name }); } else { setProductForm({ ...productForm, supplierId: val, company: '' }); } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.company ? '#F0F9FF' : T.gray50, borderColor: productForm.company ? '#0369A1' : T.gray200, height: 40 }} placeholder={`${t('enterToSearch')}...`} />
                    {productForm.supplierId && !productForm.company && suppliers.filter((s: any) => s.id.includes(productForm.supplierId) || s.name.toLowerCase().includes(productForm.supplierId.toLowerCase())).length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, maxHeight: 140, overflow: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                        {suppliers.filter((s: any) => s.id.includes(productForm.supplierId) || s.name.toLowerCase().includes(productForm.supplierId.toLowerCase())).map((s: any) => (
                          <div key={s.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setProductForm({ ...productForm, supplierId: s.id, company: s.name })}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <i className="fas fa-building" style={{ color: '#0369A1', fontSize: 11 }}></i>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: T.tealDark }}>{s.id}</div>
                              <div style={{ fontSize: 11, color: T.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {/* Category + Expiry Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('categories')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-folder" style={{ fontSize: 13 }}></i></div>
                      <input value={productForm.cat} onChange={e => { const val = e.target.value; const found = categories.find((ca: any) => (ca.id || '').toLowerCase() === val.toLowerCase() || (ca.name || '').toLowerCase() === val.toLowerCase()); if (found) { setProductForm({ ...productForm, cat: found.name }); } else { setProductForm({ ...productForm, cat: val }); } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.cat && categories.some((ca: any) => (ca.name || '').toLowerCase() === productForm.cat.toLowerCase()) ? '#FFFBEB' : T.gray50, borderColor: productForm.cat && categories.some((ca: any) => (ca.name || '').toLowerCase() === productForm.cat.toLowerCase()) ? '#D97706' : T.gray200, height: 40 }} placeholder={`${t('enterToSearch')}...`} />
                      {productForm.cat && categories.filter((ca: any) => ((ca.name || '').toLowerCase().includes(productForm.cat.toLowerCase()) || (ca.id || '').toLowerCase().includes(productForm.cat.toLowerCase())) && (ca.name || '').toLowerCase() !== productForm.cat.toLowerCase() && (ca.id || '').toLowerCase() !== productForm.cat.toLowerCase()).length > 0 && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, maxHeight: 120, overflow: 'auto', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                          {categories.filter((ca: any) => ((ca.name || '').toLowerCase().includes(productForm.cat.toLowerCase()) || (ca.id || '').toLowerCase().includes(productForm.cat.toLowerCase())) && (ca.name || '').toLowerCase() !== productForm.cat.toLowerCase() && (ca.id || '').toLowerCase() !== productForm.cat.toLowerCase()).map((ca: any) => (
                            <div key={ca.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setProductForm({ ...productForm, cat: ca.name })}>
                              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fas fa-folder" style={{ color: '#D97706', fontSize: 11 }}></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#B45309' }}>{ca.id}</div>
                                <div style={{ fontSize: 11, color: T.gray500 }}>{ca.name}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('expiryDate')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-calendar-alt" style={{ fontSize: 13 }}></i></div>
                      <input value={productForm.expiryDate || ''} onChange={e => setProductForm({ ...productForm, expiryDate: e.target.value })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.expiryDate ? '#FFF1F2' : T.gray50, borderColor: productForm.expiryDate ? '#E11D48' : T.gray200, height: 40 }} placeholder="DD-MM-YYYY" />
                    </div>
                  </div>
                </div>
                {/* Product Name + Barcode */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('productName')} *</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-tag" style={{ fontSize: 13 }}></i></div>
                      <input value={productForm.name} onChange={e => { const val = e.target.value; setProductForm({ ...productForm, name: val }); }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.name && products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) ? '#F0FDFA' : T.gray50, borderColor: productForm.name && products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) ? T.teal : T.gray200, height: 40 }} placeholder={`${t('productName')}...`} />
                      {productForm.name && products.filter((p: any) => (p.name || '').toLowerCase().includes(productForm.name.toLowerCase())).length > 0 && !products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, maxHeight: 140, overflow: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                          {products.filter((p: any) => (p.name || '').toLowerCase().includes(productForm.name.toLowerCase())).slice(0, 8).map((p: any) => (
                            <div key={p.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setProductForm({ ...productForm, name: p.name, code: p.code || '', cat: p.cat || '', unit: p.unit || 'pcs', costPrice: p.costPrice, sellPrice: p.sellPrice, company: p.company || '', supplierId: p.supplierId || '' })}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fas fa-box" style={{ color: T.teal, fontSize: 12 }}></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: T.tealDark }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: T.gray400 }}>{p.code || '-'}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{_settings?.currencySymbol} {p.sellPrice}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('barcode')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-barcode" style={{ fontSize: 13 }}></i></div>
                      <input value={productForm.code} onChange={e => { const val = e.target.value; setProductForm({ ...productForm, code: val }); }} onKeyDown={e => { if (e.key === 'Enter') { const found = products.find((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()); if (found) { setProductForm({ ...productForm, name: found.name, code: found.code || '', cat: found.cat || '', unit: found.unit || 'pcs', costPrice: found.costPrice, sellPrice: found.sellPrice, stock: found.stock || 0, minStock: found.minStock || 5, company: found.company || '', supplierId: found.supplierId || '', vat: found.vat || 0 }); } } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 30, background: productForm.code && products.some((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()) ? '#F0FDFA' : T.gray50, borderColor: productForm.code && products.some((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()) ? T.teal : T.gray200, height: 40 }} placeholder="0000000000000" />
                      {productForm.code && products.filter((p: any) => (p.code || '').toLowerCase().includes(productForm.code.toLowerCase())).length > 0 && !products.some((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()) && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, maxHeight: 140, overflow: 'auto', zIndex: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: 4 }}>
                          {products.filter((p: any) => (p.code || '').toLowerCase().includes(productForm.code.toLowerCase())).slice(0, 8).map((p: any) => (
                            <div key={p.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setProductForm({ ...productForm, name: p.name, code: p.code || '', cat: p.cat || '', unit: p.unit || 'pcs', costPrice: p.costPrice, sellPrice: p.sellPrice, company: p.company || '', supplierId: p.supplierId || '', vat: p.vat || 0 })}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <i className="fas fa-barcode" style={{ color: T.teal, fontSize: 12 }}></i>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: T.tealDark }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: T.gray400 }}>{p.code || '-'}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Unit + VAT */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('unit')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-ruler" style={{ fontSize: 12 }}></i></div>
                      <input value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 30, height: 38 }} placeholder="pcs" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('vat')} (%)</label>
                    <input type="number" value={productForm.vat ?? _settings?.vatPercent ?? 0} onChange={e => setProductForm({ ...productForm, vat: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, fontSize: 14, fontWeight: 600, height: 38, color: '#7C3AED' }} />
                  </div>
                </div>
                {/* Stock + Min Stock */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('stock')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-cubes" style={{ fontSize: 11 }}></i></div>
                      <input type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 28, height: 38 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('minStock')}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-layer-group" style={{ fontSize: 12 }}></i></div>
                      <input type="number" value={productForm.minStock} onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 5 })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 30, height: 38 }} />
                    </div>
                  </div>
                </div>
                {/* Purchase Price + Sell Price */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('purchasePrice')} ({_settings?.currencySymbol})</label>
                    <input type="number" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, fontSize: 14, fontWeight: 600, height: 38, color: '#15803D' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('sellPrice')} ({_settings?.currencySymbol})</label>
                    <input type="number" value={productForm.sellPrice} onChange={e => setProductForm({ ...productForm, sellPrice: parseFloat(e.target.value) || 0 })} style={{ ...inputStyle, fontSize: 14, fontWeight: 600, height: 38, color: '#B91C1C' }} />
                  
</div>
                </div>
                {/* Profit + Profit % */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('profit')} ({_settings?.currencySymbol})</label>
                    {(() => {
                      const profit = (productForm.sellPrice || 0) - (productForm.costPrice || 0);
                      return (
                        <div style={{ height: 38, padding: '0 12px', background: T.gray50, border: `1px solid ${T.gray200}`, borderRadius: 7, display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: profit > 0 ? '#16A34A' : profit < 0 ? '#DC2626' : T.gray400 }}>{_settings?.currencySymbol} {profit}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('profit')} (%)</label>
                    {(() => {
                      const profit = (productForm.sellPrice || 0) - (productForm.costPrice || 0);
                      const profitPct = (productForm.costPrice || 0) > 0 ? Math.round(profit / (productForm.costPrice || 1) * 100) : 0;
                      return (
                        <div style={{ height: 38, padding: '0 12px', background: T.gray50, border: `1px solid ${T.gray200}`, borderRadius: 7, display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: profit > 0 ? '#16A34A' : profit < 0 ? '#DC2626' : T.gray400 }}>{profitPct === 0 && (productForm.costPrice || 0) === 0 && profit > 0 ? '∞' : profitPct}%</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* VAT included Sales Price */}
                {(() => {
                  const vat = productForm.vat || _settings?.vatPercent || 0;
                  const sellPrice = productForm.sellPrice || 0;
                  const totalWithVat = sellPrice + (sellPrice * vat / 100);
                  return (
                    <div style={{ marginBottom: 14, padding: '10px 14px', background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', borderRadius: 8, border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="fas fa-receipt" style={{ color: '#fff', fontSize: 12 }}></i>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>{t('salesPriceWithVat')}</span>
                      </div>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#15803D' }}>{_settings?.currencySymbol} {totalWithVat.toFixed(2)}</span>
                    </div>
                  );
                })()}
                {/* Buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, minStock: 5, supplierId: '', vat: 0, expiryDate: '' })} style={{ ...btn('ghost'), fontSize: 13, padding: '10px 16px' }}><i className="fas fa-eraser" style={{marginRight: 4}}></i> {t('clear')}</button>
                  <button onClick={handleAddToTempList} style={{ ...btn('primary'), flex: 1, fontSize: 13, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-plus" style={{marginRight: 6}}></i> {t('add')}</button>
                </div>
              </div>
            </div>
            {/* MIDDLE: CSV Upload + Purchase History */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.gray50, overflow: 'hidden' }}>
              {/* CSV Upload */}
              <div style={{ padding: 16, borderBottom: `1px solid ${T.gray200}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-file-csv" style={{ color: '#fff', fontSize: 16 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.gray800 }}>{t('csvUpload')}</div>
                    <div style={{ fontSize: 11, color: T.gray400 }}>{t('csvUploadDesc')}</div>
                  </div>
                </div>
                <div style={{ border: `2px dashed ${T.gray300}`, borderRadius: 10, padding: '16px 12px', textAlign: 'center', background: T.white, cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('csv-upload-input')?.click()}>
                  <input id="csv-upload-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim()); const headers = lines2[0].split(',').map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name') || h.includes('product')); const codeIdx = headers.findIndex((h: string) => h.includes('code') || h.includes('barcode')); const catIdx = headers.findIndex((h: string) => h.includes('cat') || h.includes('category')); const costIdx = headers.findIndex((h: string) => h.includes('cost') || h.includes('purchase')); const sellIdx = headers.findIndex((h: string) => h.includes('sell') || h.includes('price')); const stockIdx = headers.findIndex((h: string) => h.includes('stock') && !h.includes('min')); const unitIdx = headers.findIndex((h: string) => h.includes('unit')); const companyIdx = headers.findIndex((h: string) => h.includes('company') || h.includes('supplier')); const minStockIdx = headers.findIndex((h: string) => h.includes('minstock') || h.includes('min_stock') || h === 'min'); const vatIdx = headers.findIndex((h: string) => h.includes('vat')); const imported: any[] = []; const errors: string[] = []; for (let i = 1; i < lines2.length; i++) { const cols = lines2[i].split(',').map((c: string) => c.trim()); const name = nameIdx >= 0 ? cols[nameIdx] : ''; if (!name) continue; const companyName = companyIdx >= 0 ? cols[companyIdx] : ''; let supplierId = ''; if (companyName) { const matched = suppliers.find((s: any) => (s.name || '').toLowerCase() === companyName.toLowerCase()); if (matched) { supplierId = matched.id; } else { errors.push(`Row ${i+1}: "${companyName}" - ${t('supplierNotFound')}`); continue; } } const existingIdx = tempProducts.findIndex((t: any) => (t.code || '').toLowerCase() === (codeIdx >= 0 ? cols[codeIdx] : '').toLowerCase());
                    if (existingIdx >= 0) {
                      setTempProducts((prev: any[]) => prev.map((t: any, idx: number) => idx === existingIdx ? { ...t, stock: (t.stock || 0) + (stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0) } : t));
                    } else {
                      const existingDb = products.find((p: any) => (p.code || '').toLowerCase() === (codeIdx >= 0 ? cols[codeIdx] : '').toLowerCase());
                      if (existingDb) {
                        api.updateProduct(existingDb.id, { ...existingDb, stock: (existingDb.stock || 0) + (stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0) }).catch(() => {});
                        alert(`${existingDb.name} stock updated +${stockIdx >= 0 ? cols[stockIdx] : 0}`);
                      } else {
                        imported.push({ id: genId(), name, code: codeIdx >= 0 ? cols[codeIdx] : '', cat: catIdx >= 0 ? cols[catIdx] : '', costPrice: costIdx >= 0 ? parseFloat(cols[costIdx]) || 0 : 0, sellPrice: sellIdx >= 0 ? parseFloat(cols[sellIdx]) || 0 : 0, stock: stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0, unit: unitIdx >= 0 ? cols[unitIdx] || 'pcs' : 'pcs', company: companyName, minStock: minStockIdx >= 0 ? parseInt(cols[minStockIdx]) || 5 : 5, supplierId, vat: vatIdx >= 0 ? parseFloat(cols[vatIdx]) || 0 : 0, expiryDate: '', _temp: true }); } } } if (imported.length > 0) { setTempProducts((prev: any[]) => [...prev, ...imported]); } const msg = []; if (imported.length > 0) msg.push(`${imported.length} ${t('products')} imported!`); if (errors.length > 0) msg.push(`${errors.length} errors:\n${errors.join('\n')}`); alert(msg.join('\n\n')); }; reader.readAsText(file); e.target.value = ''; }} />
                  <i className="fas fa-cloud-arrow-up" style={{ fontSize: 24, color: T.gray300, marginBottom: 8 }}></i>
                  <div style={{ fontSize: 12, color: T.gray500, fontWeight: 500 }}>Click to upload CSV</div>
                  <div style={{ fontSize: 10, color: T.gray400, marginTop: 4 }}>name, code, category, costPrice, sellPrice, stock, minStock, vat, unit, company</div>
                </div>
                <button onClick={() => { const headers = ['Name', 'Code', 'Category', 'CostPrice', 'SellPrice', 'Stock', 'Unit', 'Company']; const demo = [headers.join(','), 'Rice Basmati,1001,Groceries,80,120,50,5,15,kg,ABC Traders', 'Samsung Galaxy S24,2001,Electronics,45000,55000,10,2,12,pcs,Mobile World', 'Notebook A4,3001,Stationery,25,40,200,10,5,pcs,Paper House'].join('\n'); const blob = new Blob([demo], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'products_template.csv'; a.click(); URL.revokeObjectURL(url); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '8px 0', marginTop: 8, border: `1px solid ${T.gray200}`, borderRadius: 8, background: T.white, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: T.gray600 }}><i className="fas fa-download" style={{ fontSize: 12 }}></i> {t('demoCsv')}</button>
              </div>
              {/* Purchase History */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${T.gray200}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-clock-rotate-left" style={{ color: '#fff', fontSize: 16 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.gray800 }}>{t('purchaseHistory')}</div>
                    <div style={{ fontSize: 11, color: T.gray400 }}>{products.filter((p: any) => p.purchaseId).length > 0 ? `${new Set(products.filter((p: any) => p.purchaseId).map((p: any) => p.purchaseId)).size} purchases` : 'No purchases yet'}</div>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
                  {(() => { const purchaseMap: Record<string, { items: any[], totalAmount: number, date: string }> = {}; products.filter((p: any) => p.purchaseId).forEach((p: any) => { if (!purchaseMap[p.purchaseId]) purchaseMap[p.purchaseId] = { items: [], totalAmount: 0, date: '' }; purchaseMap[p.purchaseId].items.push(p); purchaseMap[p.purchaseId].totalAmount += (p.costPrice || 0) * (p.stock || 0); }); const purchases = Object.entries(purchaseMap).sort((a, b) => b[1].items.length - a[1].items.length); if (purchases.length === 0) return <div style={{ textAlign: 'center', padding: '32px 16px', color: T.gray400 }}><div style={{ width: 56, height: 56, borderRadius: 14, background: T.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><i className="fas fa-receipt" style={{ fontSize: 22, color: T.gray300 }}></i></div><div style={{ fontSize: 13, fontWeight: 500 }}>No purchase history</div></div>; return purchases.map(([pid, data]) => (<div key={pid} style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.gray100}`, marginBottom: 8, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}><div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>{pid}</div><div style={{ fontSize: 11, color: T.gray400 }}>{data.items.length} {t('products')}</div></div><div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#15803D' }}>{_settings?.currencySymbol} {data.totalAmount.toLocaleString()}</div></div></div><div style={{ padding: '0 12px 8px' }}>{data.items.slice(0, 3).map((item: any, idx: number) => (<div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: T.gray500, padding: '3px 0', borderBottom: idx < Math.min(data.items.length, 3) - 1 ? `1px solid ${T.gray50}` : 'none' }}><span>{item.name}</span><span style={{ color: T.gray600 }}>x{item.stock}</span></div>))}{data.items.length > 3 && <div style={{ fontSize: 10, color: T.gray400, marginTop: 4 }}>+{data.items.length - 3} more...</div>}</div></div>)); })()}
                </div>
              </div>
            </div>
            {/* RIGHT: Product List Cart */}
            <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: T.white, flexShrink: 0, borderLeft: `1px solid ${T.gray200}` }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-list-check" style={{ color: '#fff', fontSize: 14 }}></i>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('productList')}</span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>{tempProducts.length}</span>
                </div>
                <button onClick={handleClearTempProducts} disabled={tempProducts.length === 0} style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: tempProducts.length > 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', color: tempProducts.length > 0 ? '#DC2626' : 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 13, cursor: tempProducts.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fas fa-trash-can"></i>
                </button>

                <button onClick={handlePostTempProducts} disabled={tempProducts.length === 0} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: tempProducts.length > 0 ? '#fff' : 'rgba(255,255,255,0.2)', color: tempProducts.length > 0 ? T.teal : 'rgba(255,255,255,0.5)', fontWeight: 700, fontSize: 12, cursor: tempProducts.length > 0 ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-paper-plane"></i> {t('post')}
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto', background: T.gray50 }}>
                {tempProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: T.gray400 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: T.gray100, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <i className="fas fa-cart-shopping" style={{ fontSize: 28, color: T.gray300 }}></i>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.gray500, marginBottom: 4 }}>{t('cartEmpty')}</div>
                    <div style={{ fontSize: 12 }}>{t('addProductsFromLeft')}</div>
                  </div>
                ) : (
                  <div style={{ padding: '8px 12px' }}>
                    {tempProducts.map((item, i) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: T.white, borderRadius: 10, border: `1px solid ${T.gray100}`, marginBottom: 6, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: T.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.teal, flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: T.gray800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: T.gray400 }}>{item.company || '-'} {item.cat ? `| ${item.cat}` : ''}</div>
                          {item.expiryDate && <div style={{ fontSize: 10, color: '#E11D48' }}>{item.expiryDate}</div>}
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>{_settings?.currencySymbol} {item.sellPrice}</div>
                          <div style={{ fontSize: 11, color: T.gray500 }}>x{item.stock}</div>
                        </div>
                        <button onClick={() => handleRemoveTempProduct(item.id)} style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: T.redLight, color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}><i className="fas fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!viewProduct && productTab === 'suppliers' && renderSupplier()}











        {!viewProduct && productTab === 'categories' && renderCategory()}











        {!viewProduct && productTab === 'barcode' && renderBarcode()}











        {!viewProduct && productTab === 'stock' && renderStock()}

        {!viewProduct && productTab === 'priceHistory' && renderPriceHistory()}

        {!viewProduct && productTab === 'deleteHistory' && renderDeleteHistory()}











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











