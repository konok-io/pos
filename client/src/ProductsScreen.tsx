import { useState, useEffect, useRef, useMemo } from 'react';











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























const inputStyle: React.CSSProperties = { padding: '0 12px', border: `1px solid ${T.gray200}`, borderRadius: 7, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', background: T.white, height: '34px' };











const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: T.gray600, marginBottom: 6, display: 'block' };























const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;






















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

const genCategoryId = (categoriesList: any[]) => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  let max = 0;
  (categoriesList || []).forEach((x: any) => {
    const id = String(x?.id || '');
    if (id.startsWith(ymd) && id.length >= ymd.length + 4) {
      const n = parseInt(id.slice(ymd.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    }
  });
  return `${ymd}${String(max + 1).padStart(4, '0')}`;
};

const fmtN = (n: number) => (+n || 0).toLocaleString('en-IN');























interface ProductsScreenProps {











  products: any[];











  suppliers: any[];











  categories: any[];











  purchases: any[];











  productHistory: any[];











  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  setPurchases: React.Dispatch<React.SetStateAction<any[]>>;











  setSuppliers: React.Dispatch<React.SetStateAction<any[]>>;











  setCategories: React.Dispatch<React.SetStateAction<any[]>>;











  settings: any;











  currentUser?: any;











}























const printableAscii = (s: any): string => Array.from(String(s ?? '')).filter((ch: string) => { const c = ch.charCodeAt(0); return c >= 32 && c <= 126; }).join('');

const codeOf = (p: any): string => {
  const raw = String((p && p.code) || '').trim();
  const clean = printableAscii(raw);
  return clean !== '' && clean === raw ? clean : '';
};

export default function ProductsScreen({ products: _initProducts, suppliers: _initSuppliers, categories: _initCategories, purchases, productHistory: _productHistory, setProducts: setProductsParent, setSuppliers: setSuppliersParent, setCategories: setCategoriesParent, setPurchases: setPurchasesParent, settings: _settings, currentUser: _currentUser }: ProductsScreenProps) {











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
  const [barcodePopup, setBarcodePopup] = useState<any>(null);











  const [showImportModal, setShowImportModal] = useState(false);











  const [supplierSearch, setSupplierSearch] = useState('');











  const [showSupplierModal, setShowSupplierModal] = useState(false);











  const [editingSupplier, setEditingSupplier] = useState<any>(null);











  const [supplierForm, setSupplierForm] = useState({ id: '', name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' });











  const [categorySearch, setCategorySearch] = useState('');











  const [showCategoryModal, setShowCategoryModal] = useState(false);











  const [editingCategory, setEditingCategory] = useState<any>(null);











  const [categoryForm, setCategoryForm] = useState({ id: '', name: '' });






















  const [stockSearch, setStockSearch] = useState('');











  const [stockAdjustProduct, setStockAdjustProduct] = useState<any>(null);











  const [stockAdjustQty, setStockAdjustQty] = useState('');











  const [stockAdjustType, setStockAdjustType] = useState('add');











  const [stockAdjustReason, setStockAdjustReason] = useState('');











  const [showMoreMenu, setShowMoreMenu] = useState(false);











  const [showSupplierMoreMenu, setShowSupplierMoreMenu] = useState(false);











  const [showCategoryMoreMenu, setShowCategoryMoreMenu] = useState(false);











  const [showStockMoreMenu, setShowStockMoreMenu] = useState(false);











  const [stockFilter, setStockFilter] = useState<'all' | 'available' | 'out' | 'low' | 'foc'>('all');






















  const [purchaseBarcodeId, setPurchaseBarcodeId] = useState('');
  const [apPage, setApPage] = useState(1);
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');






















  const [customBarcodeProducts, setCustomBarcodeProducts] = useState<any[]>([]);
  const LABEL_SIZE_KEYS = ['50x25', '38x25', '50x40', '50x30', '40x30'];
  const PAPER_KEYS = ['a4', 'roll58', 'roll80'];
  const [labelSize, setLabelSize] = useState('50x25');
  const [labelShowName, setLabelShowName] = useState(true);
  const [labelShowPrice, setLabelShowPrice] = useState(true);
  const [labelShowCompany, setLabelShowCompany] = useState(false);
  const [labelPaper, setLabelPaper] = useState('a4');
  const labelSettingsReady = useRef(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s: any = await api.getSettings();
        if (alive && s) {
          const sz = String(s.pos_label_size || '');
          if (LABEL_SIZE_KEYS.indexOf(sz) >= 0) setLabelSize(sz);
          if (s.pos_label_show_name !== undefined) setLabelShowName(s.pos_label_show_name !== '0');
          if (s.pos_label_show_price !== undefined) setLabelShowPrice(s.pos_label_show_price !== '0');
          if (s.pos_label_show_company !== undefined) setLabelShowCompany(s.pos_label_show_company === '1');
          const pp = String(s.pos_label_paper || '');
          if (PAPER_KEYS.indexOf(pp) >= 0) setLabelPaper(pp);
        }
      } catch {}
      if (alive) labelSettingsReady.current = true;
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!labelSettingsReady.current) return;
    api.updateSettings({
      pos_label_size: labelSize,
      pos_label_show_name: labelShowName ? '1' : '0',
      pos_label_show_price: labelShowPrice ? '1' : '0',
      pos_label_show_company: labelShowCompany ? '1' : '0',
      pos_label_paper: labelPaper,
    }).catch(() => {});
  }, [labelSize, labelShowName, labelShowPrice, labelShowCompany, labelPaper]);
  const [purchaseSelIds, setPurchaseSelIds] = useState<string[]>([]);
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchasePage, setPurchasePage] = useState(0);
  const [generatingBarcodes, setGeneratingBarcodes] = useState(false);
  const [customQty, setCustomQty] = useState<Record<string, number>>({});











  const [customBarcodeSearch, setCustomBarcodeSearch] = useState('');











  const [showAddProductModal, setShowAddProductModal] = useState(false);











  const [tempProducts, setTempProducts] = useState<any[]>([]);
  const tempProductsReady = useRef(false);
  const tempProductsDirty = useRef(false);
  const tempProductsRef = useRef<any[]>([]);
  const tempProductsTimer = useRef<any>(null);
  tempProductsRef.current = tempProducts;
  const saveTempProducts = (list: any[]) => {
    api.updateSettings({ pos_temp_products: JSON.stringify(list) }).catch(() => {});
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s: any = await api.getSettings();
        if (alive && s && s.pos_temp_products) {
          const parsed = JSON.parse(String(s.pos_temp_products));
          if (Array.isArray(parsed)) {
            tempProductsRef.current = parsed;
            if (parsed.length > 0) setTempProducts(parsed);
          }
        }
      } catch {}
      if (alive) tempProductsReady.current = true;
    })();
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!tempProductsReady.current) return;
    tempProductsDirty.current = true;
    if (tempProductsTimer.current) clearTimeout(tempProductsTimer.current);
    tempProductsTimer.current = setTimeout(() => { tempProductsTimer.current = null; saveTempProducts(tempProductsRef.current); }, 500);
  }, [tempProducts]);
  useEffect(() => () => {
    if (tempProductsTimer.current) { clearTimeout(tempProductsTimer.current); tempProductsTimer.current = null; }
    if (tempProductsDirty.current) saveTempProducts(tempProductsRef.current);
  }, []);

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











  const [productForm, setProductForm] = useState({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' });
  const [isPosting, setIsPosting] = useState(false);











  











  const [viewSupplier, setViewSupplier] = useState<any>(null);











  const [viewCategory, setViewCategory] = useState<any>(null);











  const [showStockHistoryModal, setShowStockHistoryModal] = useState(false);
  const [showDeleteHistory, setShowDeleteHistory] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState<any[]>([]);











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











  const totalStockValue = products.reduce((s: number, p: any) => {
    const stock = +p.stock || 0;
    const free = Math.min(+p.freeQty || 0, stock);
    return s + (stock - free) * (+p.costPrice || 0);
  }, 0);























  const filteredProducts = products.filter((p: any) => {
    if ((+p.stock || 0) <= 0) return false;
    return !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.company || '').toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase()) || (p.cat || '').toLowerCase().includes(search.toLowerCase());
  }).sort((a: any, b: any) => {











    let cmp = 0;











    if (sortBy === 'name') cmp = String(a.name || '').localeCompare(String(b.name || ''));











    else if (sortBy === 'price') cmp = (+a.sellPrice || 0) - (+b.sellPrice || 0);











    else if (sortBy === 'stock') cmp = (+a.stock || 0) - (+b.stock || 0);











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























  const allCompanies = useMemo(() => [...new Set([...suppliers.map((s: any) => s.name).filter(Boolean), ...products.map((p: any) => p.company).filter(Boolean)])].sort(), [suppliers, products]);











  const filteredSuppliers = useMemo(() => allCompanies.filter(c => !supplierSearch || (c || '').toLowerCase().includes(supplierSearch.toLowerCase())), [allCompanies, supplierSearch]);











  const _catSeen = new Map<string, string>();
  [...categories.map((c: any) => c.name), ...products.map((p: any) => p.cat)].filter(Boolean).forEach((n: any) => {
    const trimmed = String(n).trim();
    if (trimmed && !_catSeen.has(trimmed.toLowerCase())) _catSeen.set(trimmed.toLowerCase(), trimmed);
  });
  const allCategories = [..._catSeen.values()].sort((a, b) => a.localeCompare(b));











  const filteredCategories = allCategories.filter(c => !categorySearch || (c || '').toLowerCase().includes(categorySearch.toLowerCase()));











  const customBarcodeFiltered = products.filter((p: any) => codeOf(p) !== '' && (!customBarcodeSearch || (p.name || '').toLowerCase().includes(customBarcodeSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(customBarcodeSearch.toLowerCase())));











  const stockProducts = products.filter((p: any) => {

    if (stockFilter === 'out') return p.stock <= 0;

    if (stockFilter === 'low') return p.stock > 0 && p.stock <= (p.minStock || 5);

    if (stockFilter === 'available') return p.stock > (p.minStock || 5);

    if (stockFilter === 'foc') return !!p.foc;

    return true;











  }).filter((p: any) => !stockSearch || (p.name || '').toLowerCase().includes(stockSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(stockSearch.toLowerCase())).sort((a: any, b: any) => a.stock - b.stock);























  const handleEditProduct = () => {











    if (!editProduct) return;

    const nextCode = String((editProduct as any).code || '').trim();











    const updated = products.map((p: any) => p.id === editProduct.id ? { ...p, costPrice: editProduct.costPrice, sellPrice: editProduct.sellPrice, code: nextCode, foc: !!editProduct.foc, freeQty: editProduct.freeQty ?? p.freeQty } : p);











    setProducts(updated);











    setProductsParent(updated);











    const latestForPrice = products.find((p: any) => p.id === editProduct.id);
    const supEdit = suppliers.find((x: any) => (x.name || '').toLowerCase() === String((editProduct as any).company || (latestForPrice && latestForPrice.company) || '').toLowerCase());
    api.updateProduct(editProduct.id, {
      ...(latestForPrice || editProduct),
      costPrice: editProduct.costPrice,
      sellPrice: editProduct.sellPrice,
      code: nextCode,
      foc: !!editProduct.foc,
      freeQty: editProduct.freeQty ?? (latestForPrice && latestForPrice.freeQty) ?? 0,
      supplierId: (editProduct as any).supplierId || (supEdit && supEdit.id) || '',
    }).catch((err: any) => {
      if (!String((err && err.message) || '').toLowerCase().includes('duplicate')) return;
      const prevCode = String((latestForPrice && latestForPrice.code) || '');
      const reverted = products.map((p: any) => p.id === editProduct.id ? { ...p, code: prevCode } : p);
      setProducts(reverted);
      setProductsParent(reverted);
      alert(t('duplicateCode'));
    });
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























  const purchaseSeqTodayRef = useRef<string[]>([]);
  const openDeleteHistory = async () => {
    try {
      const d: any = await api.getDeletedProducts();
      setDeletedProducts(Array.isArray(d) ? d : []);
    } catch {
      setDeletedProducts([]);
    }
    setShowDeleteHistory(true);
    setShowStockMoreMenu(false);
  };

  const handleDeleteProduct = async (p: any) => {
    if (!p || (p.stock || 0) > 0) return;
    if (!window.confirm(t('deleteProductConfirm'))) return;
    try {
      await api.deleteProduct(p.id);
      const next = products.filter((x: any) => x.id !== p.id);
      setProducts(next);
      setProductsParent(next);
      if (viewProduct && viewProduct.id === p.id) setViewProduct(null);
      if (editProduct && editProduct.id === p.id) setEditProduct(null);
    } catch {
      alert(t('failed'));
    }
  };

  const genPurchaseId = () => {
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    let max = 0;
    (purchases || []).forEach((p: any) => {
      const id = String(p?.id || '');
      if (id.startsWith(ymd) && id.length >= ymd.length + 4) {
        const n = parseInt(id.slice(ymd.length), 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    });
    purchaseSeqTodayRef.current.forEach((id: string) => {
      if (id.startsWith(ymd) && id.length >= ymd.length + 4) {
        const n = parseInt(id.slice(ymd.length), 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    });
    return `${ymd}${String(max + 1).padStart(4, '0')}`;
  };

  const handleAddProduct = async () => {











    if (!productForm.name.trim()) { alert(t('enterName')); return; }
    if (!(Number(productForm.sellPrice) > 0)) { alert(t('sellPriceRequired')); return; }
    if (Number(productForm.costPrice) < 0 || Number(productForm.sellPrice) < 0) { alert(t('invalid')); return; }
    const dupName = products.find((p: any) => (p.name || '').trim().toLowerCase() === productForm.name.trim().toLowerCase());
    if (dupName) { alert(t('duplicateName')); return; }
    if ((productForm.code || '').trim()) {
      const dupCode = products.find((p: any) => (p.code || '').trim() && (p.code || '').trim().toLowerCase() === productForm.code.trim().toLowerCase());
      if (dupCode) { alert(t('duplicateCode')); return; }
    }











    const supResolve = suppliers.find((x: any) => (x.name || '').toLowerCase() === String(productForm.company || '').toLowerCase());
    const newProduct = { id: genId(), ...productForm, supplierId: productForm.supplierId || supResolve?.id || '' };











    const updated = [...products, newProduct];











    setProducts(updated);











    setProductsParent(updated);











    try {
      await api.addProduct(newProduct);
    } catch (err: any) {
      alert(`${t('failed') || 'Save failed'}: ${err?.message || err}`);
      return;
    }











    setShowAddProductModal(false);











    setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' });











  };























  const handleAddToTempList = () => {
    if (!productForm.name.trim()) { alert(t('enterName')); return; }
    if (!(Number(productForm.sellPrice) > 0)) { alert(t('sellPriceRequired')); return; }
    if (Number(productForm.costPrice) < 0 || Number(productForm.sellPrice) < 0) { alert(t('invalid')); return; }
    const paidIn = Math.max(0, Math.floor(Number(productForm.paidQty) || 0));
    const freeIn = Math.max(0, Math.floor(Number(productForm.freeQty) || 0));
    if (paidIn + freeIn <= 0) { alert(t('enterStock')); return; }
    const unitCost = Math.max(0, Number(productForm.costPrice) || 0);
    const nameL = productForm.name.trim().toLowerCase();
    const codeL = (productForm.code || '').trim().toLowerCase();

    const tempIdx = tempProducts.findIndex((p: any) => {
      const tCode = (p.code || '').trim().toLowerCase();
      const tName = (p.name || '').trim().toLowerCase();
      return (codeL !== '' && tCode === codeL) || (nameL !== '' && tName === nameL);
    });
    if (tempIdx >= 0) {
      setTempProducts(prev => prev.map((p, i) => i === tempIdx ? {
        ...p,
        paidQty: Math.max(0, p.paidQty || 0) + paidIn,
        freeQty: Math.max(0, p.freeQty || 0) + freeIn,
        stock: Math.max(0, p.stock || 0) + paidIn + freeIn,
        sellPrice: Number(productForm.sellPrice) > 0 ? Number(productForm.sellPrice) : p.sellPrice,
        costPrice: unitCost > 0 ? unitCost : p.costPrice,
        foc: productForm.foc || p.foc || false,
      } : p));
      setProductForm({ name: '', code: '', company: productForm.company, cat: productForm.cat, unit: productForm.unit, costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: productForm.supplierId, vat: _settings?.vatPercent ?? 0, expiryDate: '' });
      alert(t('stockMerged'));
      return;
    }

    const tempProduct = {
      id: genId(),
      ...productForm,
      paidQty: paidIn,
      freeQty: freeIn,
      stock: paidIn + freeIn,
      costPrice: unitCost,
      _temp: true,
    };
    setTempProducts(prev => [...prev, tempProduct]);
    setProductForm({ name: '', code: '', company: productForm.company, cat: productForm.cat, unit: productForm.unit, costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: productForm.supplierId, vat: _settings?.vatPercent ?? 0, expiryDate: '' });
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
    if (isPosting) return;
    if (tempProducts.length === 0) { alert(t('addAtLeastOne')); return; }
    setIsPosting(true);
    try {
      const merged: any[] = [];
      for (const p of tempProducts) {
        const pCode = (p.code || '').trim().toLowerCase();
        const pName = (p.name || '').trim().toLowerCase();
        const hit = merged.find((m: any) => {
          const mCode = (m.code || '').trim().toLowerCase();
          const mName = (m.name || '').trim().toLowerCase();
          return (pCode !== '' && mCode === pCode) || (pName !== '' && mName === pName);
        });
        const paid = Math.max(0, p.paidQty || 0);
        const free = Math.max(0, p.freeQty || 0);
        const unitCost = Math.max(0, p.costPrice || 0);
        if (hit) {
          hit.paidQty = Math.max(0, hit.paidQty || 0) + paid;
          hit.freeQty = Math.max(0, hit.freeQty || 0) + free;
          hit.stock = Math.max(0, hit.stock || 0) + paid + free;
          if (unitCost > 0) hit.costPrice = unitCost;
          if (p.foc) hit.foc = true;
          hit._srcIds = [...(hit._srcIds || [hit.id]), p.id];
        } else {
          merged.push({ ...p, paidQty: paid, freeQty: free, stock: paid + free, costPrice: unitCost, foc: !!p.foc, _srcIds: [p.id] });
        }
      }

      const companyGroups: Record<string, any[]> = {};
      merged.forEach((p: any) => {
        const key = p.company || p.supplierId || 'unknown';
        if (!companyGroups[key]) companyGroups[key] = [];
        companyGroups[key].push(p);
      });

      const results: any[] = [];
      const purchaseIds: string[] = [];
      const purchasesCreated: any[] = [];
      const historyPlan: any[] = [];
      const succeededSrcIds = new Set<string>();
      let workingProducts = [...products];

      for (const group of Object.values(companyGroups)) {
        const purchaseId = genPurchaseId();
        purchaseSeqTodayRef.current.push(purchaseId);
        purchaseIds.push(purchaseId);

        const groupResults = await Promise.allSettled(
          group.map((p: any) => {
            const pCode = (p.code || '').trim().toLowerCase();
            const pName = (p.name || '').trim().toLowerCase();
            const existingProd = workingProducts.find((ep: any) => {
              const eCode = (ep.code || '').trim().toLowerCase();
              const eName = (ep.name || '').trim().toLowerCase();
              return (pCode !== '' && eCode === pCode) || (pName !== '' && eName === pName);
            });
            const paid = Math.max(0, p.paidQty || 0);
            const free = Math.max(0, p.freeQty || 0);
            const qty = paid + free;
            const unitCost = Math.max(0, p.costPrice || 0);
            const freeValue = free * unitCost;
            const paidTotal = paid * unitCost;
            const clean: any = { ...p };
            delete clean._temp;
            delete clean.paidQty;
            delete clean.freeQty;
            clean.supplier = p.company || p.supplierId || '';
            if (existingProd) {
              const oldStock = +existingProd.stock || 0;
              const newStock = oldStock + qty;
              const newCost = paid > 0 ? unitCost : (+existingProd.costPrice || 0);
              const newFree = (+existingProd.freeQty || 0) + free;
              const plan = {
                matchCode: pCode, matchName: pName, productName: existingProd.name,
                quantity: qty, paidQty: paid, freeQty: free, unitCost, paidTotal, freeValue,
                oldStock, newStock, purchaseId,
              };
              workingProducts = workingProducts.map(w => w.id === existingProd.id ? { ...w, stock: newStock, costPrice: newCost, freeQty: newFree } : w);
              return api.updateProduct(existingProd.id, { ...existingProd, stock: newStock, costPrice: newCost, foc: existingProd.foc || !!p.foc, freeQty: newFree, purchaseId }).then((res: any) => {
                historyPlan.push(plan);
                (p._srcIds || [p.id]).forEach((id: string) => succeededSrcIds.add(id));
                return res;
              });
            }
            const newCost = paid > 0 ? unitCost : 0;
            clean.costPrice = newCost;
            clean.stock = qty;
            clean.foc = !!p.foc;
            clean.freeQty = free;
            const plan = {
              matchCode: pCode, matchName: pName, productName: p.name,
              quantity: qty, paidQty: paid, freeQty: free, unitCost, paidTotal, freeValue,
              oldStock: 0, newStock: qty, purchaseId,
            };
            return api.addProduct({ ...clean, purchaseId, stock: qty, costPrice: newCost, foc: !!p.foc, freeQty: free }).then((res: any) => {
              historyPlan.push(plan);
              (p._srcIds || [p.id]).forEach((id: string) => succeededSrcIds.add(id));
              return res;
            });
          })
        );
        results.push(...groupResults);
      }

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      const [prods, hist] = await Promise.all([api.getProducts(), api.getStockHistory()]);

      const byGroup: Record<string, any[]> = {};
      for (const h of historyPlan) {
        if (!byGroup[h.purchaseId]) byGroup[h.purchaseId] = [];
        byGroup[h.purchaseId].push(h);
      }
      for (const [purchaseId, hs] of Object.entries(byGroup)) {
        const findEp = (h: any) => prods.find((e: any) => {
          const eCode = (e.code || '').trim().toLowerCase();
          const eName = (e.name || '').trim().toLowerCase();
          return (h.matchCode !== '' && eCode === h.matchCode) || (h.matchName !== '' && eName === h.matchName);
        });
        let total = 0;
        let freeTotal = 0;
        const items = hs.map((h: any) => {
          const ep = findEp(h);
          total += h.paidTotal || 0;
          freeTotal += h.freeValue || 0;
          return {
            productId: ep ? ep.id : '',
            name: h.productName,
            code: h.matchCode || '',
            quantity: h.quantity,
            paidQty: h.paidQty,
            freeQty: h.freeQty,
            unitCost: h.unitCost,
            paidTotal: h.paidTotal,
            freeValue: h.freeValue,
            costPrice: h.unitCost,
          };
        });
        const groupKey = Object.keys(companyGroups).find(ck => {
          const anyH = hs[0];
          return companyGroups[ck].some((pp: any) => {
            const pCode = (pp.code || '').trim().toLowerCase();
            const pName = (pp.name || '').trim().toLowerCase();
            return (anyH.matchCode !== '' && pCode === anyH.matchCode) || (anyH.matchName !== '' && pName === anyH.matchName);
          });
        }) || 'unknown';
        const supForPurchase = suppliers.find((s: any) => (s.name || '').toLowerCase() === String(groupKey || '').toLowerCase());
        const purchase = {
          id: purchaseId,
          supplier: groupKey === 'unknown' ? '' : groupKey,
          supplierId: groupKey === 'unknown' ? '' : (supForPurchase?.id || ''),
          date: new Date().toISOString(),
          items,
          total,
          freeTotal,
        };
        api.addPurchase(purchase).catch(() => {});
        purchasesCreated.push(purchase);

        for (const h of hs) {
          const ep = findEp(h);
          if (!ep) continue;
          api.addStockHistory({
            productId: ep.id,
            productName: h.productName,
            type: 'purchase',
            quantity: h.quantity,
            oldStock: h.oldStock,
            newStock: +ep.stock || h.newStock,
            reason: h.freeQty > 0
              ? `Purchase: ${purchaseId} (paid ${h.paidQty} + free ${h.freeQty})`
              : `Purchase: ${purchaseId}`,
          }).catch(() => {});
        }
      }

      setStockHistory(hist);
      if (purchasesCreated.length > 0) setPurchasesParent((prev: any[]) => [...prev, ...purchasesCreated]);
      setProducts(prods);
      setProductsParent(prods);
      setTempProducts(prev => prev.filter((tp: any) => !succeededSrcIds.has(tp.id)));
      if (failed === 0) {
        setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' });
      }
      const usedPurchaseIds = [...new Set(historyPlan.map((h: any) => h.purchaseId))];
      if (succeeded === 0) {
        alert(`${failed} failed — ${t('invalid')}`);
      } else {
        alert(`${usedPurchaseIds.length} Purchase IDs created: ${usedPurchaseIds.join(', ')} | ${succeeded} ${t('saved')}${failed ? `, ${failed} failed (kept in list)` : ''}`);
      }
    } catch (e: any) {
      alert(t('invalid'));
    } finally {
      setIsPosting(false);
    }
  };

  const deleteSupplier = (name: string) => {
    const supplierProducts = products.filter((p: any) => (p.company || '').toLowerCase() === name.toLowerCase());
    if (supplierProducts.length > 0) {
      alert(t('companyHasProducts'));
      return;
    }
    if (!window.confirm(`"${name}" ${t('confirmDelete')}`)) return;
    const supplier = suppliers.find((s: any) => s.name === name);
    if (!supplier) return;
    const prevSuppliers = suppliers;
    const updated = suppliers.filter((s: any) => s.name !== name);
    setSuppliers(updated);
    setSuppliersParent(updated);
    if (String(supplier.id || '').startsWith('auto-')) return;
    api.deleteSupplier(supplier.id).catch((e: any) => {
      setSuppliers(prevSuppliers);
      setSuppliersParent(prevSuppliers);
      alert(t('deleteFailed') + ': ' + e.message);
    });
  };























  const deleteCategory = (name: string) => {
    const norm = (s: any) => String(s || '').trim().toLowerCase();
    const target = norm(name);
    const catProducts = products.filter((p: any) => norm(p.cat) === target);
    const msg = catProducts.length > 0 ? `\n\n${t('products')}: ${catProducts.length}\n${t('productsUncat')}` : '';
    if (!window.confirm(`"${name}" ${t('confirmDeleteCat')}${msg}`)) return;
    const cat = categories.find((c: any) => norm(c.name) === target);
    const prevCats = categories;
    const prevProds = products;
    const updated = categories.filter((c: any) => norm(c.name) !== target);
    const cleared = products.map((p: any) => norm(p.cat) === target ? { ...p, cat: '' } : p);
    setCategories(updated);
    setCategoriesParent(updated);
    if (cat) {
      api.deleteCategory(cat.id).then(() => {
        if (catProducts.length > 0) { setProducts(cleared); setProductsParent(cleared); }
      }).catch((e: any) => {
        setCategories(prevCats); setCategoriesParent(prevCats);
        alert(`${t('failed')}: ${e?.message || e}`);
      });
    } else if (catProducts.length > 0) {
      setProducts(cleared);
      setProductsParent(cleared);
      let restored = false;
      catProducts.forEach((p: any) => api.updateProduct(p.id, { ...p, cat: '' }).catch((e: any) => {
        if (restored) return;
        restored = true;
        setProducts(prevProds); setProductsParent(prevProds);
        alert(`${t('failed')}: ${e?.message || e}`);
      }));
    }
  };

  const exportProductsCsv = () => {
    const headers = ['SL', 'Name', 'Barcode', 'Company', 'Category', 'Unit', 'BuyPrice', 'SellPrice', 'Profit', 'Stock', 'MinStock', 'ExpiryDate'];
    const srcList = filteredProducts;
    const rows = srcList.map((p: any, i: number) => {
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      return [i + 1, p.name, p.code || '', p.company || '', p.cat || '', p.unit, p.costPrice, p.sellPrice, ((+p.sellPrice || 0) - (+p.costPrice || 0)), p.stock, p.minStock || 5, p.expiryDate || ''].map(esc).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    downloadCsv(csv, 'products.csv');
  };

  const exportSuppliersCsv = () => {
    const headers = [t('supplierCode') || 'ID', t('companyName') || t('suppliers'), t('phone'), t('email'), t('address'), t('products'), t('stock'), t('totalPurchase')];
    const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
    const lines = [headers.join(',')];
    const list = typeof filteredSuppliers !== 'undefined' ? filteredSuppliers : [];
    const nameList: string[] = Array.isArray(list) && list.length && typeof list[0] === 'string'
      ? (list as string[])
      : suppliers.map((s: any) => s.name).filter(Boolean);
    nameList.forEach((company: string) => {
      const supplier = suppliers.find((s: any) => (s.name || '').toLowerCase() === (company || '').toLowerCase());
      const supplierProducts = products.filter((p: any) => (p.company || '').toLowerCase() === company.toLowerCase());
      const stock = supplierProducts.reduce((a: number, p: any) => a + (p.stock || 0), 0);
      const value = supplierProducts.reduce((a: number, p: any) => a + (p.stock || 0) * (p.costPrice || 0), 0);
      lines.push([
        esc(supplier?.id || ''),
        esc(company),
        esc(supplier?.phone || ''),
        esc(supplier?.email || ''),
        esc(supplier?.address || ''),
        esc(supplierProducts.length),
        esc(stock),
        esc(value)
      ].join(','));
    });
    downloadCsv(lines.join('\n'), `suppliers-${new Date().toISOString().slice(0, 10)}.csv`);
  };























  const exportCategoriesCsv = () => {











    const headers = ['ID', 'Name', 'Products', 'Stock', 'TotalValue'];











    const rows = filteredCategories.map((c: string) => {











      const catProducts = products.filter((p: any) => String(p.cat || '').trim().toLowerCase() === String(c).trim().toLowerCase());











      const pid = (categories.find((cx: any) => String(cx.name || '').trim().toLowerCase() === c.trim().toLowerCase()) || {}).id || '';
      return ['"' + String(pid).replace(/"/g, '""') + '"', '"' + String(c).replace(/"/g, '""') + '"', catProducts.length, catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0), catProducts.reduce((s: number, p: any) => s + Math.max(0, (p.stock || 0) - (p.freeQty || 0)) * (p.costPrice || 0), 0)].join(',');











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























  // Real Code128-B SVG barcode (pure, no deps) - scannable by standard scanners
  const CODE128_PATTERNS = ['212222','222122','222221','121223','121322','131222','122213','122312','132212','221213','221312','231212','112232','122132','122231','113222','123122','123221','223211','221132','221231','213212','223112','312131','311222','321122','321221','312212','322112','322211','212123','212321','232121','111323','131123','131321','112313','132113','132311','211313','231113','231311','112133','112331','132131','113123','113321','133121','313121','211331','231131','213113','213311','213131','311123','311321','331121','312113','312311','332111','314111','221411','431111','111224','111422','121124','121421','141122','141221','112214','112412','122114','122411','142112','142211','241211','221114','413111','241112','134111','111242','121142','121241','114212','124112','124211','411212','421112','421211','212141','214121','412121','111143','111341','131141','114113','114311','411113','411311','113141','114131','311141','411131','211412','211214','211232','2331112'];

  const escHtml = (s: any): string => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const code128Svg = (value: string, height: number = 50, moduleWidth: number = 2): string => {
    const clean = printableAscii(value) || '000';
    const codes: number[] = [104];
    for (let i = 0; i < clean.length; i++) codes.push(clean.charCodeAt(i) - 32);
    let sum = codes[0];
    for (let i = 1; i < codes.length; i++) sum += codes[i] * i;
    codes.push(sum % 103);
    codes.push(106);
    let x = 10 * moduleWidth;
    let rects = '';
    for (const c of codes) {
      const pat = CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
      let bar = true;
      for (const d of pat) {
        const w = parseInt(d, 10) * moduleWidth;
        if (bar) rects += `<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000"/>`;
        x += w;
        bar = !bar;
      }
    }
    const totalW = x + 10 * moduleWidth;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${height}" viewBox="0 0 ${totalW} ${height}">${rects}</svg>`;
  };

  const LABEL_SIZES: Record<string, { w: number; h: number; svgMax: number; nameFs: number }> = {
    '50x25': { w: 50, h: 25, svgMax: 10, nameFs: 7 },
    '38x25': { w: 38, h: 25, svgMax: 10, nameFs: 6.5 },
    '50x40': { w: 50, h: 40, svgMax: 16, nameFs: 8 },
    '50x30': { w: 50, h: 30, svgMax: 13, nameFs: 7.5 },
    '40x30': { w: 40, h: 30, svgMax: 13, nameFs: 7 },
  };
  const labelWidthMm = (sizeKey: string, paper?: string): number => {
    if (paper === 'roll58') return 58;
    if (paper === 'roll80') return 80;
    const s = LABEL_SIZES[sizeKey] || LABEL_SIZES['50x25'];
    return s.w;
  };

  const labelItemCss = (sizeKey: string, widthMm?: number, paper?: string): string => {
    const s = LABEL_SIZES[sizeKey] || LABEL_SIZES['50x25'];
    const w = Number(widthMm) > 0 ? Number(widthMm) : s.w;
    const cutGuide = paper === 'roll58' || paper === 'roll80' ? 'none' : '0.3mm dashed #bbb';
    return `.barcode-item{width:${w}mm;height:${s.h}mm;border:${cutGuide};padding:0.5mm 1mm;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;page-break-inside:avoid;gap:0}
.barcode-item .bname{font-size:${s.nameFs}pt;font-weight:700;color:#333;line-height:1.15;margin:0;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.barcode-item .bcomp{font-size:6.5pt;color:#777;line-height:1.1;margin:0;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.barcode-item .bcode{font-family:monospace;font-size:8pt;font-weight:700;color:#111;line-height:1;margin:0.4mm 0 0 0;width:100%;overflow:hidden;white-space:nowrap}
.barcode-item .bc{display:flex;align-items:flex-start;justify-content:center;width:100%;line-height:0;margin:0.3mm 0 0 0}
.barcode-item .bc svg{max-width:100%;height:auto;max-height:${s.svgMax}mm;display:block}
.barcode-item .price{font-size:8pt;font-weight:800;color:#111;line-height:1;margin:0.4mm 0 0 0}`;
  };

  const labelSheetCss = (sizeKey: string, paper?: string): string => {
    const w = labelWidthMm(sizeKey, paper);
    if (paper === 'roll58' || paper === 'roll80') {
      return `@page{size:${w}mm auto;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;width:${w}mm;margin:0}
.summary{display:none}
.sheet{display:block;width:${w}mm;gap:0;padding:0}
` + labelItemCss(sizeKey, w, paper) + `
.sheet .barcode-item{margin:0 auto}`;
    }
    return `@page{size:A4;margin:4mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;width:202mm;margin:0}
.summary{font-size:9pt;color:#444;padding:2mm 3mm;border-bottom:0.4mm solid #0F766E;margin-bottom:1mm}
.sheet{display:flex;flex-wrap:wrap;gap:0;padding:0}
` + labelItemCss(sizeKey);
  };

  const barcodeLabelHtml = (product: any, opts?: any): string => {
    const o = { showName: true, showPrice: true, showCompany: false, ...(opts || {}) };
    const nameDiv = o.showName ? `<div class="bname">${escHtml(product.name)}</div>` : '';
    const compDiv = o.showCompany && product.company ? `<div class="bcomp">${escHtml(product.company)}</div>` : '';
    const priceDiv = o.showPrice ? `<div class="price">${fmt(product.sellPrice)}</div>` : '';
    const clean = codeOf(product);
    if (!clean) {
      const sz = LABEL_SIZES[o.size] || LABEL_SIZES['50x25'];
      return `<div class="barcode-item">${nameDiv}${compDiv}<div class="bc" style="height:${sz.svgMax}mm;line-height:1.2;align-items:center;border:0.3mm dashed #E5A3A3;border-radius:1mm;color:#B91C1C;font-size:7pt;font-weight:700">${escHtml(t('missingBarcode'))}</div>${priceDiv}</div>`;
    }
    const svg = code128Svg(clean, 44, 2);
    return `<div class="barcode-item">${nameDiv}${compDiv}<div class="bcode">${escHtml(clean)}</div><div class="bc">${svg}</div>${priceDiv}</div>`;
  };

  const openPrintWin = (html: string) => {
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) { alert(t('popupBlocked')); return; }
    win.document.write(html);
    win.document.close();
    const ua = String(navigator.userAgent || '');
    const touchIos = /iPhone|iPad|iPod/i.test(ua) || (String(navigator.platform || '') === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    if (touchIos) {
      setTimeout(() => { if (!win.closed) win.focus(); alert(t('printUnsupported')); }, 400);
      return;
    }
    let done = false;
    const doPrint = () => {
      if (done || win.closed) return;
      done = true;
      win.focus();
      win.print();
    };
    if (win.document.readyState === 'complete') {
      setTimeout(doPrint, 400);
    } else {
      win.addEventListener('load', () => { setTimeout(doPrint, 300); });
      setTimeout(doPrint, 8000);
    }
  };

  const labelOpts = () => ({ size: labelSize, paper: labelPaper, showName: labelShowName, showPrice: labelShowPrice, showCompany: labelShowCompany });

  const clampQty = (v: any): number => Math.max(1, Math.min(500, Math.round(Number(v) || 1)));

  const moduleSmall = (code: any, sizeKey: string, paper?: string): boolean => {
    const c = String(code || '');
    if (!c) return false;
    const mods = 11 * (c.length + 2) + 33;
    // printable width = label width minus 1mm padding on each side
    return (labelWidthMm(sizeKey, paper) - 2) / mods < 0.2;
  };

  const purchaseItemsOf = (pur: any): any[] => {
    if (!pur) return [];
    if (Array.isArray(pur.items)) return pur.items;
    if (typeof pur.items === 'string') {
      try { const parsed = JSON.parse(pur.items); if (Array.isArray(parsed)) return parsed; } catch (_err) { return []; }
    }
    return [];
  };

  const getPurchaseProducts = (pid: string): any[] => {
    const id = String(pid || '').trim();
    if (!id) return [];
    const idLc = id.toLowerCase();
    const rec = (purchases || []).find((x: any) => String(x.id || '').toLowerCase() === idLc);
    if (rec) {
      const recItems = purchaseItemsOf(rec);
      const ids = new Set(recItems.map((it: any) => (it && it.productId) || '').filter(Boolean));
      const codes = new Set(recItems.map((it: any) => String((it && it.code) || '').toLowerCase()).filter(Boolean));
      const names = new Set(recItems.map((it: any) => String((it && it.name) || '').toLowerCase()).filter(Boolean));
      const matched = products.filter((p: any) => ids.has(p.id) || (!!p.code && codes.has(String(p.code).toLowerCase())) || (!!p.name && names.has(String(p.name || '').toLowerCase())));
      if (matched.length > 0) return matched;
    }
    return products.filter((p: any) => String(p.purchaseId || '').toLowerCase() === idLc);
  };

  const printBarcodeSheet = (list: any[], summary: string, opts?: any) => {
    const o = { size: '50x25', showName: true, showPrice: true, showCompany: false, ...(opts || {}) };
    const printable = list.filter((p: any) => codeOf(p) !== '').slice(0, 500);
    if (printable.length === 0) { alert(t('missingBarcode')); return; }
    const items = printable.map((p: any) => barcodeLabelHtml(p, o)).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${labelSheetCss(o.size, o.paper)}</style></head><body><div class="summary">${escHtml(summary)}</div><div class="sheet">${items}</div></body></html>`;
    openPrintWin(html);
  };

  const printAllStockBarcodes = (product: any) => {
    const p = product;
    if (codeOf(p) === '') { alert(t('missingBarcode')); return; }
    const stockQty = Math.max(0, parseInt(String(p.stock), 10) || 0);
    const qty = Math.min(500, Math.max(1, stockQty));
    printBarcodeSheet(Array(qty).fill(p), `${p.name} | ${t('stock')}: ${stockQty} ${p.unit || ''} | ${qty} ${t('labels')} | ${new Date().toLocaleDateString()}`, labelOpts());
    setBarcodePopup(null);
  };

  const printManualCountBarcode = (product: any) => {
    const p = product;
    if (codeOf(p) === '') { alert(t('missingBarcode')); return; }
    const def = Math.min(500, Math.max(1, parseInt(String(p.stock), 10) || 1));
    const raw = window.prompt(
      `${p.name}\n${t('manualCountBarcode') || 'Manual Count Barcode'}\n\n${t('howManyBarcodes') || 'How many barcodes?'} (1-500):`,
      String(def)
    );
    if (raw === null) return;
    const qty = Math.max(1, Math.min(500, parseInt(raw, 10) || 1));
    printBarcodeSheet(Array(qty).fill(p), `${t('manualCountBarcode')} | ${p.name} | ${qty} ${t('labels')} | ${t('stock')}: ${p.stock} ${p.unit || ''} | ${new Date().toLocaleDateString()}`, labelOpts());
    setBarcodePopup(null);
  };

























  const printProductList = () => {
    const list = filteredProducts;
    const rows = list.map((p: any, i: number) => {
      const pct = p.costPrice > 0 ? Math.round((p.sellPrice - p.costPrice) / p.costPrice * 100) : 0;
      return `<tr><td style="text-align:center">${i + 1}</td><td>${p.name}${p.code ? ` (${p.code})` : ''}</td><td>${p.company || '-'}</td><td>${p.cat || '-'}</td><td>${fmt(p.costPrice)}</td><td>${fmt(p.sellPrice)}</td><td>${fmt(p.sellPrice - p.costPrice)} (${pct}%)</td><td>${p.stock}</td><td>${p.unit}</td><td>${p.expiryDate || '-'}</td></tr>`;
    }).join('');











    const totStock = list.reduce((x: number, p: any) => x + (+p.stock || 0), 0);
    const totBuyVal = list.reduce((x: number, p: any) => x + (+p.costPrice || 0) * (+p.stock || 0), 0);
    const totSellVal = list.reduce((x: number, p: any) => x + (+p.sellPrice || 0) * (+p.stock || 0), 0);
    const totProfitVal = totSellVal - totBuyVal;
    const totRow = `<tr style="background:#00897b;color:#fff;font-weight:700"><td colspan="3" style="text-align:center">${t('total') || 'Total'}</td><td>${fmt(totBuyVal)}</td><td>${fmt(totSellVal)}</td><td>${fmt(totProfitVal)}</td><td style="text-align:center">${totStock}</td><td colspan="2"></td></tr>`;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@import url('https://fonts.googleapis.com/css2?family=Tiro+Bangla&display=swap');@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tiro Bangla','Noto Sans Bengali',serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:6px 5px;text-align:left;font-size:10px;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:6px 5px;font-size:11px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('productList')}</h1><p>${new Date().toLocaleDateString()} | ${list.length} ${t('products')}</p></div><table><thead><tr><th style="text-align:center">#</th><th>${t('name')}</th><th>${t('company')}</th><th>${t('category')}</th><th>${t('purchasePrice')}</th><th>${t('sellPrice')}</th><th>${t('profit')}</th><th>${t('stock')}</th><th>${t('unit')}</th><th>${t('expiryDate')}</th></tr></thead><tbody>${rows}${totRow}</tbody></table></body></html>`;











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











      const catProducts = products.filter((p: any) => String(p.cat || '').trim().toLowerCase() === String(c).trim().toLowerCase());











      const totalStock = catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0);











      const totalV = catProducts.reduce((s: number, p: any) => s + Math.max(0, (p.stock || 0) - (p.freeQty || 0)) * (p.costPrice || 0), 0);











      const pid = (categories.find((cx: any) => String(cx.name || '').trim().toLowerCase() === c.trim().toLowerCase()) || {}).id || '-';
      return `<tr><td>${pid}</td><td>${c}</td><td>${catProducts.length}</td><td>${totalStock}</td><td>${fmt(totalV)}</td></tr>`;











    }).join('');











    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:8px;text-align:left;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:8px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('categories')}</h1><p>${new Date().toLocaleDateString()} | ${filteredCategories.length} ${t('categories')}</p></div><table><thead><tr><th>${t('id')}</th><th>${t('name')}</th><th>${t('products')}</th><th>${t('stock')}</th><th>${t('totalValue')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;











    const win = window.open('', '_blank', 'width=1000,height=600');











    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }











  };























  const printStockList = () => {











    const rows = stockProducts.map((p: any) => `<tr><td>${p.name}</td><td>${p.company || '-'}</td><td>${p.stock}</td><td>${p.minStock || 5}</td><td>${fmt(p.stock * p.costPrice)}</td></tr>`).join('');











    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>@page{size:A4 landscape;margin:10mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:10px;font-size:11px}.header{text-align:center;margin-bottom:15px;border-bottom:2px solid #00897b;padding-bottom:10px}.header h1{color:#00897b;font-size:20px}table{width:100%;border-collapse:collapse}th{background:#e0f7f0;border:1px solid #b2dfdb;padding:8px;text-align:left;color:#00897b;font-weight:700}td{border:1px solid #e0e0e0;padding:8px}tr:nth-child(even){background:#fafafa}</style></head><body><div class="header"><h1>${t('stock')}</h1><p>${new Date().toLocaleDateString()} | ${stockProducts.length} ${t('products')}</p></div><table><thead><tr><th>${t('name')}</th><th>${t('company')}</th><th>${t('stock')}</th><th>${t('minStock')}</th><th>${t('totalValue')}</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;











    const win = window.open('', '_blank', 'width=1000,height=600');











    if (win) { win.document.write(html); win.document.close(); setTimeout(() => { if (!win.closed) win.print(); }, 250); }











  };























  const purchaseQtyMap = (): Record<string, number> => {
    const map: Record<string, number> = {};
    const id = String(purchaseBarcodeId || '').trim().toLowerCase();
    if (!id) return map;
    const rec = (purchases || []).find((x: any) => String(x.id || '').toLowerCase() === id);
    if (!rec) return map;
    for (const it of purchaseItemsOf(rec)) {
      if (!it) continue;
      const raw = it.quantity != null ? it.quantity : ((Number(it.paidQty) || 0) + (Number(it.freeQty) || 0));
      const q = Math.round(Number(raw) || 0);
      if (q <= 0) continue;
      const code = String(it.code || '').toLowerCase();
      const name = String(it.name || '').toLowerCase();
      const hit = products.find((p: any) => (it.productId && String(p.id) === String(it.productId))
        || (!!p.code && !!code && String(p.code).toLowerCase() === code)
        || (!!p.name && !!name && String(p.name || '').toLowerCase() === name));
      if (!hit) continue;
      map[String(hit.id)] = (map[String(hit.id)] || 0) + q;
    }
    return map;
  };

  const purchaseLabelCount = (p: any, qtyMap?: Record<string, number>): number => {
    const q = qtyMap ? qtyMap[String(p.id)] : undefined;
    if (q != null) return q;
    return Math.max(0, Math.round(Number(p.stock) || 0));
  };

  const printPurchaseBarcode = () => {
    const pid = purchaseBarcodeId.trim();
    if (!pid) { alert(t('enterPurchaseId')); return; }
    const matched = getPurchaseProducts(pid);
    const selected = matched.filter((p: any) => purchaseSelIds.includes(p.id));
    if (selected.length === 0) { alert(t('noProductsFound')); return; }
    const printable = selected.filter((p: any) => codeOf(p) !== '');
    const skipped = selected.length - printable.length;
    if (skipped > 0) alert(`${skipped} ${t('missingBarcode')}`);
    if (printable.length === 0) return;
    const qtyMap = purchaseQtyMap();
    let total = 0;
    for (const p of printable) total += purchaseLabelCount(p, qtyMap);
    if (total === 0) { alert(t('noProductsFound')); return; }
    if (total > 500) { alert(t('maxLabels')); return; }
    const list: any[] = [];
    for (const p of printable) { const n = purchaseLabelCount(p, qtyMap); for (let i = 0; i < n; i++) list.push(p); }
    printBarcodeSheet(list, `${t('purchaseBarcode')} ${pid} | ${printable.length} ${t('products')} | ${t('total')}: ${list.length} | ${new Date().toLocaleDateString()}`, labelOpts());
  };























  const printCustomBarcode = () => {
    if (customBarcodeProducts.length === 0) { alert(t('noProductsFound')); return; }
    const printable = customBarcodeProducts.filter((p: any) => codeOf(p) !== '');
    const skipped = customBarcodeProducts.length - printable.length;
    if (skipped > 0) alert(`${skipped} ${t('missingBarcode')}`);
    if (printable.length === 0) return;
    let total = 0;
    for (const p of printable) total += clampQty(customQty[String(p.id)]);
    if (total > 500) { alert(t('maxLabels')); return; }
    const list: any[] = [];
    for (const p of printable) { const n = clampQty(customQty[String(p.id)]); for (let i = 0; i < n; i++) list.push(p); }
    printBarcodeSheet(list, `${t('customBarcode')} | ${printable.length} ${t('products')} | ${t('total')}: ${list.length} | ${new Date().toLocaleDateString()}`, labelOpts());
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
        const name = (row['name'] || '').trim();
        if (!name) continue;
        items.push({ id: genId(), name, code: (row['barcode'] || '').trim(), company: row['company'] || '', cat: row['category'] || '', unit: row['unit'] || 'pcs', costPrice: parseFloat(row['buyprice'] || '0') || 0, sellPrice: parseFloat(row['sellprice'] || '0') || 0, stock: parseFloat(row['stock'] || '0') || 0, minStock: parseFloat(row['minstock'] || '5') || 5, image: '', supplier: row['company'] || '', categoryId: '' });
      }
      if (items.length === 0) { alert(t('csvMinRows')); return; }
      const local: any[] = products.map((p: any) => ({ ...p }));
      const added: any[] = [];
      const mergedIds = new Set<string>();
      const seen = new Set<string>();
      for (const item of items) {
        const codeKey = (item.code || '').toLowerCase();
        const nameKey = (item.name || '').toLowerCase();
        const key = codeKey !== '' ? 'c:' + codeKey : 'n:' + nameKey;
        if (seen.has(key)) continue;
        const idx = local.findIndex((ep: any) =>
          (codeKey !== '' && (ep.code || '').toLowerCase() === codeKey) ||
          (codeKey === '' && nameKey !== '' && (ep.name || '').toLowerCase() === nameKey)
        );
        if (idx >= 0) {
          local[idx] = { ...local[idx], stock: Math.max(0, (+local[idx].stock || 0)) + item.stock };
          mergedIds.add(String(local[idx].id));
        } else {
          local.push(item);
          added.push(item);
        }
        seen.add(key);
      }
      const applyLocal = (next: any[]) => { setProducts(next); setProductsParent(next); };
      applyLocal([...local]);
      let addFailed = 0;
      let mergeFailed = 0;
      const jobs: Promise<any>[] = [];
      added.forEach((item) => {
        jobs.push(api.addProduct(item).catch(() => {
          addFailed++;
          const next = local.filter((p: any) => p.id !== item.id);
          local.length = 0;
          local.push(...next);
        }));
      });
      mergedIds.forEach((mid) => {
        const target = local.find((p: any) => String(p.id) === mid);
        if (!target) return;
        const before = products.find((p: any) => String(p.id) === mid);
        jobs.push(api.updateProduct(target.id, target).catch(() => {
          mergeFailed++;
          if (before) {
            const next = local.map((p: any) => String(p.id) === mid ? before : p);
            local.length = 0;
            local.push(...next);
          }
        }));
      });
      Promise.all(jobs).then(() => {
        applyLocal([...local]);
        const parts: string[] = [];
        const addedOk = added.length - addFailed;
        const mergedOk = mergedIds.size - mergeFailed;
        if (addedOk > 0) parts.push(`${addedOk} ${t('productsAdded')}`);
        if (mergedOk > 0) parts.push(`${t('stockMerged')}: ${mergedOk}`);
        if (addFailed + mergeFailed > 0) parts.push(`${addFailed + mergeFailed} ${t('failed')}`);
        alert(parts.length > 0 ? parts.join(' | ') : t('failed'));
      });
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























  const renderAllProducts = () => {
    const AP_PAGE = 50;
    const apTotalPages = Math.max(1, Math.ceil(filteredProducts.length / AP_PAGE));
    const apCur = Math.min(Math.max(1, apPage), apTotalPages);
    const apItems = filteredProducts.slice((apCur - 1) * AP_PAGE, apCur * AP_PAGE);
    const apBtn = (dis: boolean): React.CSSProperties => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.gray200}`, background: dis ? T.gray100 : T.white, color: dis ? T.gray400 : T.gray600, fontSize: 13, fontWeight: 600, cursor: dis ? 'not-allowed' : 'pointer' });
    return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>











      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.gray600, flexShrink: 0 }}>
              <i className="fas fa-list" style={{ marginRight: 6, color: T.teal }}></i>{t('allProducts')} · {filteredProducts.length}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: '1 1 260px', minWidth: 220, justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160, maxWidth: 480 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
                <input value={search} onChange={e => { setSearch(e.target.value); setApPage(1); }} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
              </div>
              <button style={{ ...btn('ghost', 'sm') }} onClick={printProductList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: T.tealLight }}>
                {['#', t('productName'), t('company'), t('category'), t('purchasePrice'), t('sellPrice'), t('profit'), t('stock'), t('unit'), t('expiryDate'), t('actions')].map((h, i) => (
                  <th key={i} style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.teal }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={11} style={{ padding: 48, textAlign: 'center', color: T.gray400 }}>
                  <i className="fas fa-box-open" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: T.gray300 }}></i>
                  {t('noProductsYet')}
                </td></tr>
              ) : apItems.map((p: any, i: number) => {
                const pct = p.costPrice > 0 ? Math.round((p.sellPrice - p.costPrice) / p.costPrice * 100) : 0;
                const low = p.stock > 0 && p.stock <= (p.minStock || 5);
                return (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 13, color: T.gray400 }}>{(apCur - 1) * AP_PAGE + i + 1}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                      {codeOf(p) && <div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{codeOf(p)}</div>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: T.gray600, textAlign: 'center' }}>{p.company || '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: T.gray600, textAlign: 'center' }}>{p.cat || '-'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, textAlign: 'center' }}>{fmt(p.costPrice)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: 14, textAlign: 'center' }}>{fmt(p.sellPrice)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: (p.sellPrice - p.costPrice) > 0 ? T.green : (p.sellPrice - p.costPrice) < 0 ? T.red : T.gray400 }}>{fmt(p.sellPrice - p.costPrice)} ({pct === 0 && p.costPrice === 0 && (p.sellPrice - p.costPrice) > 0 ? '∞' : pct}%)</span>
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: p.stock <= 0 ? T.red : low ? T.amber : T.gray900 }}>{fmtN(p.stock)}</span>
                      {low && <i className="fas fa-triangle-exclamation" style={{ color: '#F59E0B', marginRight: 4 }}></i>}
                      {p.stock <= 0 && <i className="fas fa-xmark" style={{ color: T.red, marginLeft: 4 }}></i>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 14, color: T.gray400, textAlign: 'center' }}>{p.unit}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'center', color: p.expiryDate ? (isExpiringSoon(p.expiryDate) ? '#E11D48' : T.gray600) : T.gray400, fontWeight: p.expiryDate && isExpiringSoon(p.expiryDate) ? 700 : 400 }}>{p.expiryDate || '-'}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                        <button title={t('view') || 'View'} style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewProduct(p)}><i className="fas fa-eye"></i></button>
                        <button title={t('edit')} style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setEditProduct({ ...p })}><i className="fas fa-pen"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {apTotalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '14px 0 4px' }}>
            <button style={apBtn(apCur <= 1)} disabled={apCur <= 1} onClick={() => setApPage(apCur - 1)}><i className="fas fa-chevron-left" style={{ marginRight: 4 }}></i>{t('prev')}</button>
            <span style={{ fontSize: 13, color: T.gray600, fontWeight: 600 }}>{apCur} / {apTotalPages} · {(apCur - 1) * AP_PAGE + 1}-{Math.min(apCur * AP_PAGE, filteredProducts.length)} / {filteredProducts.length}</span>
            <button style={apBtn(apCur >= apTotalPages)} disabled={apCur >= apTotalPages} onClick={() => setApPage(apCur + 1)}>{t('next')}<i className="fas fa-chevron-right" style={{ marginLeft: 4 }}></i></button>
          </div>
        )}
      </div>
    </div>
  );
  };  const renderSupplier = () => (











    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>






















      <div style={{ flex: 1, overflow: 'auto' }}>
        {(() => {
          const withProd = filteredSuppliers.filter((c: string) => products.some((p: any) => (p.company || '').toLowerCase() === c.toLowerCase())).length;
          const allSp = products.filter((p: any) => filteredSuppliers.some((c: string) => (p.company || '').toLowerCase() === c.toLowerCase()));
          const totalStock = allSp.reduce((a: number, p: any) => a + (p.stock || 0), 0);
          const totalValue = allSp.reduce((a: number, p: any) => a + (p.stock || 0) * (p.costPrice || 0), 0);
          const stats = [
            { icon: 'fas fa-building', label: t('totalSuppliers'), value: String(filteredSuppliers.length), color: T.teal, bg: T.tealLight },
            { icon: 'fas fa-boxes-stacked', label: t('withProducts'), value: String(withProd), color: '#7C3AED', bg: '#EDE9FE' },
            { icon: 'fas fa-box', label: t('products'), value: String(allSp.length), color: T.green, bg: T.greenLight },
            { icon: 'fas fa-layer-group', label: t('stock'), value: String(totalStock), color: T.orange, bg: '#FFF7ED' },
            { icon: 'fas fa-sack-dollar', label: t('totalPurchase'), value: fmt(totalValue), color: '#0369A1', bg: '#E0F2FE' },
            { icon: 'fas fa-folder', label: t('categories'), value: String([...new Set(allSp.map((p: any) => p.cat).filter(Boolean))].length), color: T.amber, bg: T.amberLight },
          ];
          return (
            <>
              <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark} 100%)`, padding: '28px 24px 24px', color: T.white }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                    <i className="fas fa-building"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('suppliers')}</div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      {filteredSuppliers.length} {t('totalSuppliers')} · {withProd} {t('withProducts')} · {allSp.length} {t('products')}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        <i className="fas fa-boxes-stacked" style={{ marginRight: 6 }}></i>{withProd} {t('withProducts')}
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        <i className="fas fa-sack-dollar" style={{ marginRight: 6 }}></i>{fmt(totalValue)}
                      </span>
                      {supplierSearch ? (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          <i className="fas fa-magnifying-glass" style={{ marginRight: 6 }}></i>{supplierSearch}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: T.white, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} onClick={exportSuppliersCsv}>
                    <i className="fas fa-file-csv" style={{ marginRight: 6 }}></i>{t('exportCsv')}
                  </button>
                </div>
              </div>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
                  <input value={supplierSearch} onChange={e => setSupplierSearch(e.target.value)} placeholder={t('searchSupplier')} style={{ ...inputStyle, paddingLeft: 32 }} />
                </div>
                <button style={{ ...btn('ghost', 'sm') }} onClick={printSupplierList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
              </div>
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











                const supplier = suppliers.find((s: any) => (s.name || '').toLowerCase() === (company || '').toLowerCase());











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











                    <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>










                        <button disabled={hasProducts} style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasProducts ? 0.3 : 1, cursor: hasProducts ? 'not-allowed' : 'pointer' }} onClick={() => { setEditingSupplier(supplier); setSupplierForm(supplier); setShowSupplierModal(true); }}><i className="fas fa-pen"></i></button>











                        <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewSupplier({ name: company, prodCount, totalPurchase })}><i className="fas fa-eye"></i></button>











                        <button disabled={hasProducts} style={{ ...btn('danger', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasProducts ? 0.3 : 1, cursor: hasProducts ? 'not-allowed' : 'pointer' }} onClick={() => deleteSupplier(company)}><i className="fas fa-trash"></i></button>











                      </div>
                    </td>











                  </tr>











                );











              })}











            </tbody>











          </table>











        )}
              </div>
            </>
          );
        })()}
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











              <button onClick={() => {
              if (!supplierForm.name.trim()) { alert(t('enterName')); return; }
              const nameLower = supplierForm.name.trim().toLowerCase();
              const dup = suppliers.some((s: any) => s.id !== editingSupplier?.id && (s.name || '').toLowerCase().trim() === nameLower);
              if (dup) { alert(t('supplierNameExists')); return; }
              const prevSuppliers = suppliers;
              const prevProducts = products;
              const prevPurchases = purchases;
              if (editingSupplier) {
                const oldName = editingSupplier.name || '';
                const newName = supplierForm.name.trim();
                const payload = { ...supplierForm, name: newName, code: supplierForm.code || editingSupplier.code || '' };
                const updated = suppliers.map((s: any) => s.id === editingSupplier.id ? { ...s, ...payload } : s);
                setSuppliers(updated);
                setSuppliersParent(updated);
                if (oldName && oldName.toLowerCase() !== newName.toLowerCase()) {
                  const nameLc = oldName.toLowerCase();
                  const nextProducts = products.map((p: any) => (p.company || '').toLowerCase() === nameLc ? { ...p, company: newName } : p);
                  const nextPurchases = purchases.map((p: any) => (p.supplier || '').toLowerCase() === nameLc ? { ...p, supplier: newName } : p);
                  setProducts(nextProducts);
                  setProductsParent(nextProducts);
                  setPurchasesParent(nextPurchases);
                  for (const p of nextProducts) {
                    if (prevProducts.find((x: any) => x.id === p.id && (x.company || '') !== (p.company || ''))) {
                      api.updateProduct(p.id, p).catch(() => {});
                    }
                  }
                }
                api.updateSupplier(editingSupplier.id, payload).catch((e: any) => {
                  setSuppliers(prevSuppliers);
                  setSuppliersParent(prevSuppliers);
                  setProducts(prevProducts);
                  setProductsParent(prevProducts);
                  setPurchasesParent(prevPurchases);
                  alert(t('errorOccurred') + ': ' + e.message);
                });
              } else {
                const maxCode = suppliers.reduce((max, x: any) => { const m = (x.code || '').match(/C-(\d+)/); return m ? Math.max(max, parseInt(m[1])) : max; }, 0);
                const autoCode = supplierForm.code || `C-${String(maxCode + 1).padStart(5, '0')}`;
                const newId = supplierForm.id || genSupplierId(suppliers);
                const newSupplier = { ...supplierForm, id: newId, code: autoCode };
                const updated = [...suppliers, newSupplier];
                setSuppliers(updated);
                setSuppliersParent(updated);
                api.addSupplier(newSupplier).catch((e: any) => {
                  setSuppliers(prevSuppliers);
                  setSuppliersParent(prevSuppliers);
                  alert(t('errorOccurred') + ': ' + e.message);
                });
              }
              setShowSupplierModal(false);
            }} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>











            </div>











          </div>











        </div>











      )}











    </div>











  );























  const renderCategory = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {(() => {
          const withProducts = filteredCategories.filter((cat: string) => products.some((p: any) => String(p.cat || '').trim().toLowerCase() === cat.trim().toLowerCase())).length;
          const catProds = products.filter((p: any) => filteredCategories.some((cat: string) => String(p.cat || '').trim().toLowerCase() === cat.trim().toLowerCase()));
          const totalStock = catProds.reduce((a: number, p: any) => a + (p.stock || 0), 0);
          const totalValue = catProds.reduce((a: number, p: any) => a + Math.max(0, (p.stock || 0) - (p.freeQty || 0)) * (p.costPrice || 0), 0);
          const supCount = [...new Set(catProds.map((p: any) => (p.company || '').trim().toLowerCase()).filter(Boolean))].length;
          const stats = [
            { icon: 'fas fa-folder', label: t('totalCategories'), value: String(filteredCategories.length), color: T.teal, bg: T.tealLight },
            { icon: 'fas fa-layer-group', label: t('withProducts'), value: String(withProducts), color: '#7C3AED', bg: '#EDE9FE' },
            { icon: 'fas fa-box', label: t('products'), value: String(catProds.length), color: T.green, bg: T.greenLight },
            { icon: 'fas fa-boxes-stacked', label: t('stock'), value: String(totalStock), color: T.orange, bg: '#FFF7ED' },
            { icon: 'fas fa-sack-dollar', label: t('totalValue'), value: fmt(totalValue), color: '#0369A1', bg: '#E0F2FE' },
            { icon: 'fas fa-truck', label: t('suppliers'), value: String(supCount), color: T.amber, bg: T.amberLight },
          ];
          return (
            <>
              <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark} 100%)`, padding: '28px 24px 24px', color: T.white }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                    <i className="fas fa-folder"></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('categories')}</div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      {filteredCategories.length} {t('totalCategories')} · {withProducts} {t('withProducts')} · {catProds.length} {t('products')}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        <i className="fas fa-boxes-stacked" style={{ marginRight: 6 }}></i>{totalStock} {t('stock')}
                      </span>
                      <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        <i className="fas fa-sack-dollar" style={{ marginRight: 6 }}></i>{fmt(totalValue)}
                      </span>
                      {categorySearch ? (
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          <i className="fas fa-magnifying-glass" style={{ marginRight: 6 }}></i>{categorySearch}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: T.white, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} onClick={exportCategoriesCsv}>
                    <i className="fas fa-file-csv" style={{ marginRight: 6 }}></i>{t('exportCsv')}
                  </button>
                </div>
              </div>
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 200 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
                  <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder={t('searchCategory')} style={{ ...inputStyle, paddingLeft: 32 }} />
                </div>
                <button style={{ ...btn('ghost', 'sm') }} onClick={printCategoryList}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
              </div>
        {filteredCategories.length === 0 ? (
          categorySearch ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400, background: T.white, borderRadius: 14, border: `1px dashed ${T.gray200}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}><i className="fas fa-magnifying-glass"></i></div>
              <p>{t('noResults')}</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: T.gray400, background: T.white, borderRadius: 14, border: `1px dashed ${T.gray200}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}><i className="fas fa-folder"></i></div>
              <p>{t('noCategories')}</p>
              <button style={{ ...btn('primary', 'sm'), marginTop: 8 }} onClick={() => { setEditingCategory(null); setCategoryForm({ id: genCategoryId(categories), name: '' }); setShowCategoryModal(true); }}><i className="fas fa-plus" style={{ marginRight: 4 }}></i> {t('addCategory')}</button>
            </div>
          )
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.gray200}` }}>
            <thead><tr style={{ background: T.tealLight }}>
              {[t('id'), t('categoryName'), t('products'), t('stock'), t('totalValue'), t('actions')].map((h, i) => (
                <th key={i} style={{ padding: '10px 12px', textAlign: i === 1 ? 'left' : i === 2 || i === 3 || i === 5 ? 'center' : i === 4 ? 'right' : 'left', fontSize: 14, fontWeight: 700, color: T.teal }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredCategories.map((cat: string, i: number) => {
                const catObj = categories.find((c: any) => String(c.name || '').trim().toLowerCase() === cat.trim().toLowerCase());
                const catId = catObj?.id || '-';
                const catProducts = products.filter((p: any) => String(p.cat || '').trim().toLowerCase() === cat.trim().toLowerCase());
                const totalStock = catProducts.reduce((s: number, p: any) => s + (p.stock || 0), 0);
                const totalValue = catProducts.reduce((s: number, p: any) => s + Math.max(0, (p.stock || 0) - (p.freeQty || 0)) * (p.costPrice || 0), 0);
                const hasCatProducts = catProducts.length > 0;
                return (
                  <tr key={cat} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: T.gray500, fontFamily: 'monospace' }}>{catId}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14, color: T.teal, cursor: 'pointer', minWidth: 180 }} onClick={() => setViewCategory({ name: cat, products: catProducts, totalValue })}><i className="fas fa-folder" style={{marginRight: 4}}></i> {cat}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}><span style={{ background: T.tealLight, color: T.teal, padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700 }}>{catProducts.length}</span></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{totalStock}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: 14, color: T.green }}>{fmt(totalValue)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
                        <button title={t('edit')} disabled={hasCatProducts} style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasCatProducts ? 0.3 : 1, cursor: hasCatProducts ? 'not-allowed' : 'pointer' }} onClick={() => { setEditingCategory(catObj || { id: '', name: cat }); setCategoryForm({ id: catObj?.id || '', name: cat }); setShowCategoryModal(true); }}><i className="fas fa-pen"></i></button>
                        <button style={{ ...btn('ghost', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }} onClick={() => setViewCategory({ name: cat, products: catProducts, totalValue })}><i className="fas fa-eye"></i></button>
                        <button title={t('delete') || t('confirmDelete')} disabled={hasCatProducts} style={{ ...btn('danger', 'sm'), padding: 0, width: 28, height: 28, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, opacity: hasCatProducts ? 0.3 : 1, cursor: hasCatProducts ? 'not-allowed' : 'pointer' }} onClick={() => deleteCategory(cat)}><i className="fas fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
              </div>
            </>
          );
        })()}
      </div>
      {showCategoryModal && (
        <div style={overlay} onClick={() => setShowCategoryModal(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-folder" style={{marginRight: 4}}></i> {editingCategory ? t('edit') : t('addCategory')}</h3>
            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('id')}</label><input value={categoryForm.id} readOnly style={{ ...inputStyle, background: T.gray50, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }} /></div>
            <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('categoryName')} *</label><input value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} style={inputStyle} placeholder={t('enterCategoryName')} /></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setShowCategoryModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>
              <button onClick={() => {
                const name = categoryForm.name.trim();
                if (!name) { alert(t('enterName')); return; }
                const editingId = editingCategory?.id || '';
                const oldName = String(editingCategory?.name || '').trim();
                const norm = (s: any) => String(s || '').trim().toLowerCase();
                const dup = categories.find((c: any) => (editingId ? c.id !== editingId : true) && norm(c.name) === norm(name));
                if (dup) { alert(t('duplicateNameCat')); return; }
                if (editingCategory) {
                  const prevCatsR = categories;
                  const doCascade = () => {
                    if (oldName && norm(oldName) !== norm(name)) {
                      const toRename = products.filter((p: any) => norm(p.cat) === norm(oldName));
                      if (toRename.length) {
                        const renamed = products.map((p: any) => norm(p.cat) === norm(oldName) ? { ...p, cat: name } : p);
                        setProducts(renamed); setProductsParent(renamed);
                        toRename.forEach((p: any) => api.updateProduct(p.id, { ...p, cat: name }).catch(() => {}));
                      }
                    }
                  };
                  if (editingId) {
                    const updated = categories.map((c: any) => c.id === editingId ? { ...c, name } : c);
                    setCategories(updated); setCategoriesParent(updated);
                    api.updateCategory(editingId, { name }).then(doCascade).catch((e: any) => {
                      setCategories(prevCatsR); setCategoriesParent(prevCatsR);
                      alert(`${t('failed')}: ${e?.message || e}`);
                    });
                  } else {
                    const startId = categoryForm.id && !categories.some((c: any) => c.id === categoryForm.id) ? categoryForm.id : genCategoryId(categories);
                    const newCat = { id: startId, name };
                    setCategories((prev: any[]) => [...prev, newCat]);
                    setCategoriesParent((prev: any[]) => [...prev, newCat]);
                    api.addCategory(newCat).then((res: any) => {
                      if (res && res.id && res.id !== newCat.id) {
                        setCategories((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c));
                        setCategoriesParent((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c));
                      }
                      doCascade();
                    }).catch((e: any) => {
                      setCategories((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id));
                      setCategoriesParent((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id));
                      alert(`${t('failed')}: ${e?.message || e}`);
                    });
                  }
                } else {
                  const startId = categoryForm.id && !categories.some((c: any) => c.id === categoryForm.id) ? categoryForm.id : genCategoryId(categories);
                  const newCat = { id: startId, name };
                  setCategories((prev: any[]) => [...prev, newCat]);
                  setCategoriesParent((prev: any[]) => [...prev, newCat]);
                  api.addCategory(newCat).then((res: any) => {
                    if (res && res.id && res.id !== newCat.id) {
                      setCategories((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c));
                      setCategoriesParent((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c));
                    }
                  }).catch((e: any) => {
                    setCategories((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id));
                    setCategoriesParent((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id));
                    alert(`${t('failed')}: ${e?.message || e}`);
                  });
                }
                setShowCategoryModal(false);
              }} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const generateMissingBarcodes = async () => {
    if (generatingBarcodes) return;
    const targets = products.filter((p: any) => codeOf(p) === '');
    if (targets.length === 0) { alert(t('noProductsFound')); return; }
    if (!window.confirm(`${t('generateBarcodes')} (${targets.length})?`)) return;
    const used = new Set<string>();
    for (const p of products) { const c = codeOf(p); if (c) used.add(c.toLowerCase()); }
    let n = 1000000000000;
    for (const c of used) {
      if (/^\d+$/.test(c)) { const v = Number(c); if (Number.isSafeInteger(v) && v >= 1000000000000 && v > n) n = v; }
    }
    const plan: { p: any; code: string }[] = [];
    for (const p of targets) {
      let code = '';
      let tries = 0;
      do { n += 1; code = String(n); tries += 1; } while (used.has(code.toLowerCase()) && tries < 100000);
      if (used.has(code.toLowerCase())) code = `BC${Date.now().toString(36)}${tries}`;
      used.add(code.toLowerCase());
      plan.push({ p, code });
    }
    setGeneratingBarcodes(true);
    try {
      let failed = 0;
      const gen = new Map<string, string>();
      for (let i = 0; i < plan.length; i += 10) {
        const batch = plan.slice(i, i + 10);
        const res = await Promise.all(batch.map(item =>
          api.updateProduct(item.p.id, { ...item.p, code: item.code })
            .then(() => item)
            .catch(() => { failed += 1; return null; })));
        for (const ok of res) {
          if (ok) gen.set(String(ok.p.id), ok.code);
        }
      }
      const updated = products.map((p: any) => (gen.has(String(p.id)) ? { ...p, code: gen.get(String(p.id)) } : p));
      setProducts(updated);
      setProductsParent(updated);
      const failPart = failed > 0 ? ' | ' + t('failed') + ': ' + failed : '';
      alert(t('generateBarcodes') + ': ' + gen.size + ' / ' + plan.length + failPart);
    } finally {
      setGeneratingBarcodes(false);
    }
  };

  const renderBarcode = () => {
    const withCode = products.filter((p: any) => codeOf(p) !== '');
    const missingCount = products.length - withCode.length;
    const pProducts = getPurchaseProducts(purchaseBarcodeId);
    const purchaseRows = (purchases || []).filter((pur: any) => {
      const q = purchaseSearch.trim().toLowerCase();
      if (!q) return true;
      const hay = `${String(pur.id || '')} ${String(pur.supplier || '')} ${pur.date ? new Date(pur.date).toLocaleDateString() : ''}`.toLowerCase();
      return hay.includes(q);
    }).sort((a: any, b: any) => {
      const ka = Date.parse(String(a.date || '')) || 0;
      const kb = Date.parse(String(b.date || '')) || 0;
      if (kb !== ka) return kb - ka;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
    const purchasePerPage = 10;
    const totalPurchasePages = Math.max(1, Math.ceil(purchaseRows.length / purchasePerPage));
    const purchasePageSafe = Math.min(purchasePage, totalPurchasePages - 1);
    const purchasePageRows = purchaseRows.slice(purchasePageSafe * purchasePerPage, purchasePageSafe * purchasePerPage + purchasePerPage);
    const selectedPurchaseProducts = pProducts.filter((p: any) => purchaseSelIds.includes(p.id));
    const qtyMap = purchaseQtyMap();
    const purchasePrintable = selectedPurchaseProducts.filter((p: any) => codeOf(p) !== '');
    const purchaseTotalLabels = purchasePrintable.reduce((s: number, p: any) => s + purchaseLabelCount(p, qtyMap), 0);
    const selectedCount = customBarcodeProducts.length + purchasePrintable.length;
    const customTotalLabels = customBarcodeProducts.reduce((s: number, p: any) => s + clampQty(customQty[String(p.id)]), 0);
    const totalLabels = purchaseTotalLabels + customTotalLabels;
    const previewProduct = customBarcodeProducts[0] || selectedPurchaseProducts[0] || pProducts[0] || withCode[0] || products[0];
    const barcodeWarn = selectedCount > 0 && [...selectedPurchaseProducts, ...customBarcodeProducts].some((p: any) => moduleSmall(codeOf(p), labelSize, labelPaper));
    const statCard = (icon: string, label: string, value: any, color: string, bg: string) => (
      <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={icon} style={{ fontSize: 16 }}></i></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: T.gray900, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: 12, color: T.gray500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        </div>
      </div>
    );
    const modeToggle = (checked: boolean, onCh: (e: any) => void, icon: string, label: string) => (
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: checked ? T.teal : T.gray600, background: checked ? T.tealLight : T.white, border: `1px solid ${checked ? T.teal : T.gray200}`, borderRadius: 8, padding: '8px 10px', width: '100%', boxSizing: 'border-box', whiteSpace: 'nowrap' }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: checked ? T.teal : T.gray100, color: checked ? T.white : T.gray500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={icon} style={{ fontSize: 10 }}></i></span>
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        <input type="checkbox" checked={checked} onChange={onCh} style={{ accentColor: T.teal, flexShrink: 0, width: 15, height: 15, margin: 0 }} />
      </label>
    );
    const selRow = (p: any, checked: boolean, onToggle: () => void, right?: any) => (
      <div key={p.id} role="button" tabIndex={0} onClick={onToggle} onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, background: checked ? T.tealLight : T.white, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={checked} readOnly style={{ width: 16, height: 16, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{codeOf(p) || t('missingBarcode')}</div>
        </div>
        <div style={{ fontSize: 12, color: T.gray500, flexShrink: 0 }}>{right !== undefined ? right : (p.stock ?? 0)}</div>
      </div>
    );
    const listBox = (children: any) => (
      <div style={{ marginTop: 10, maxHeight: 240, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 10, background: T.white }}>{children}</div>
    );
    const cardHead = (icon: string, title: string, sub: string) => (
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: T.tealLight, color: T.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><i className={icon} style={{ fontSize: 16 }}></i></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.gray900 }}>{title}</div>
          <div style={{ fontSize: 12, color: T.gray500 }}>{sub}</div>
        </div>
      </div>
    );
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark || '#0F766E'} 100%)`, padding: '28px 24px 24px', color: T.white }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, width: '100%', flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
                    <i className="fas fa-barcode" style={{ fontSize: 26 }}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>{t('barcode')}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13 }}><i className="fas fa-boxes-stacked" style={{ marginRight: 4 }}></i>{withCode.length} {t(withCode.length === 1 ? 'barcode' : 'barcodes')}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: selectedCount > 0 ? '#16A34A' : 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13 }}><i className="fas fa-check" style={{ marginRight: 4 }}></i>{selectedCount} {t('selected')}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: missingCount > 0 ? '#DC2626' : 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13 }}><i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{missingCount} {t('missingBarcode')}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>{labelWidthMm(labelSize, labelPaper)} × {(LABEL_SIZES[labelSize] || LABEL_SIZES['50x25']).h} mm</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{totalLabels}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>{t('labels')} · {t('labelOptions')}</div>
              </div>
            </div>
          </div>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 16 }}>
              {statCard('fas fa-box', t('products'), products.length, '#0369A1', '#E0F2FE')}
              {statCard('fas fa-barcode', t('barcode'), withCode.length, T.teal, T.tealLight)}
              {statCard('fas fa-check-double', t('selected'), selectedCount, '#16A34A', '#DCFCE7')}
              {statCard('fas fa-triangle-exclamation', t('missingBarcode'), missingCount, '#DC2626', '#FEE2E2')}
            </div>
            {missingCount > 0 && (
              <div style={{ marginBottom: 16 }}>
                <button type="button" onClick={generateMissingBarcodes} disabled={generatingBarcodes} style={{ ...btn('primary'), opacity: generatingBarcodes ? 0.6 : 1, cursor: generatingBarcodes ? 'wait' : 'pointer' }}><i className={generatingBarcodes ? 'fas fa-spinner fa-spin' : 'fas fa-wand-magic-sparkles'} style={{ marginRight: 6 }}></i>{generatingBarcodes ? t('loading') : t('generateBarcodes') + ' (' + missingCount + ')'}</button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16, marginBottom: 16 }}>
              <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                {cardHead('fas fa-box', t('purchaseBarcode'), t('enterPurchaseId'))}
                {(purchases || []).length === 0 ? (
                  <div style={{ marginTop: 10, border: `1px solid ${T.gray300}`, borderRadius: 10, padding: '26px 14px', textAlign: 'center', background: '#FAFAFA' }}>
                    <i className="fas fa-inbox" style={{ fontSize: 24, color: T.gray300, display: 'block', marginBottom: 8 }}></i>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.gray500 }}>{t('noPurchaseRecords')}</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
                      <input value={purchaseSearch} onChange={e => { setPurchaseSearch(e.target.value); setPurchasePage(0); }} placeholder={t('searchPurchaseId')} style={{ ...inputStyle, paddingLeft: 32 }} />
                    </div>
                    {purchaseBarcodeId !== '' && (
                      <div style={{ marginTop: 10 }}>
                        {pProducts.length === 0 ? (
                          <div style={{ fontSize: 13, color: T.gray400, padding: '10px 0' }}>{t('noProductsFound')}</div>
                        ) : listBox(pProducts.map((p: any) => selRow(p, purchaseSelIds.includes(p.id), () => setPurchaseSelIds(prev => prev.includes(p.id) ? prev.filter((x: string) => x !== p.id) : [...prev, p.id]), codeOf(p) ? `\u00d7${purchaseLabelCount(p, qtyMap)}` : t('missingBarcode'))))}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => setPurchaseSelIds(pProducts.map((p: any) => p.id))} style={{ ...btn('ghost', 'sm') }}><i className="fas fa-check-double" style={{ marginRight: 4 }}></i>{t('selectAll')}</button>
                            <button type="button" onClick={() => setPurchaseSelIds([])} style={{ ...btn('ghost', 'sm') }}>{t('clear')}</button>
                            <button type="button" onClick={() => { setPurchaseBarcodeId(''); setPurchaseSelIds([]); }} style={{ ...btn('ghost', 'sm') }}><i className="fas fa-xmark" style={{ marginRight: 4 }}></i>{t('deselectPurchase')}</button>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
                            <span style={{ fontSize: 13, color: T.gray500 }}>{purchasePrintable.length} {t('products')} {t('selected')} · {purchaseTotalLabels} {t('labels')}</span>
                            <button type="button" onClick={printPurchaseBarcode} disabled={purchasePrintable.length === 0 || purchaseTotalLabels === 0} style={{ ...btn('primary', 'sm'), opacity: purchasePrintable.length === 0 || purchaseTotalLabels === 0 ? 0.5 : 1 }}><i className="fas fa-print" style={{ marginRight: 4 }}></i>{t('print')}</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {purchasePageRows.length === 0 ? (
                      <div style={{ marginTop: 10, padding: 14, fontSize: 13, color: T.gray400, border: `1px solid ${T.gray200}`, borderRadius: 10, background: '#FAFAFA' }}>{t('noResults')}</div>
                    ) : (
                      <div style={{ marginTop: 10, maxHeight: 320, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 10, background: T.white }}>
                        {purchasePageRows.map((pur: any) => {
                          const active = String(purchaseBarcodeId) === String(pur.id);
                          const activate = () => { const v = String(pur.id); setPurchaseBarcodeId(v); setPurchaseSelIds(getPurchaseProducts(v).map((p: any) => p.id)); };
                          return (
                            <div key={String(pur.id)} role="button" tabIndex={0} onClick={activate} onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: `1px solid ${T.gray100}`, background: active ? T.tealLight : T.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <i className={active ? 'fas fa-circle-check' : 'fas fa-receipt'} style={{ color: active ? T.teal : T.gray300, fontSize: 14, flexShrink: 0 }}></i>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pur.id}</div>
                                <div style={{ fontSize: 11, color: T.gray400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pur.date ? new Date(pur.date).toLocaleDateString() : '-'} · {pur.supplier || '-'} · {purchaseItemsOf(pur).length} {t('products')}</div>
                              </div>
                              <i className="fas fa-chevron-right" style={{ color: active ? T.teal : T.gray300, fontSize: 12, flexShrink: 0 }}></i>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {totalPurchasePages > 1 && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                        <button type="button" onClick={() => setPurchasePage(Math.max(0, purchasePageSafe - 1))} disabled={purchasePageSafe === 0} style={{ ...btn('ghost', 'sm'), padding: '6px 10px', opacity: purchasePageSafe === 0 ? 0.5 : 1 }}><i className="fas fa-chevron-left"></i></button>
                        <span style={{ fontSize: 12, color: T.gray500, fontWeight: 700 }}>{purchasePageSafe + 1} / {totalPurchasePages}</span>
                        <button type="button" onClick={() => setPurchasePage(purchasePageSafe + 1)} disabled={purchasePageSafe >= totalPurchasePages - 1} style={{ ...btn('ghost', 'sm'), padding: '6px 10px', opacity: purchasePageSafe >= totalPurchasePages - 1 ? 0.5 : 1 }}><i className="fas fa-chevron-right"></i></button>
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: T.gray400, marginTop: 6 }}>{(purchases || []).length} {t('purchases')}</div>
                  </div>
                )}
              </div>
              <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                {cardHead('fas fa-barcode', t('customBarcode'), t('selectProductsForBarcode'))}
                <div style={{ position: 'relative', marginTop: 10 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
                  <input value={customBarcodeSearch} onChange={e => setCustomBarcodeSearch(e.target.value)} placeholder={t('searchBarcode')} style={{ ...inputStyle, paddingLeft: 32 }} />
                </div>
                {customBarcodeSearch.trim() !== '' && (
                  <div style={{ marginTop: 10, maxHeight: 200, overflow: 'auto', border: `1px solid ${T.gray200}`, borderRadius: 10, background: T.white }}>
                    {customBarcodeFiltered.length === 0 ? (
                      <div style={{ padding: 14, fontSize: 13, color: T.gray400 }}>{t('noResults')}</div>
                    ) : customBarcodeFiltered.slice(0, 50).map((p: any) => {
                      const added = customBarcodeProducts.some((cp: any) => cp.id === p.id);
                      const toggleAdd = () => { if (!added) { setCustomBarcodeProducts(prev => [...prev, p]); setCustomQty(prev => ({ ...prev, [String(p.id)]: prev[String(p.id)] || 1 })); } };
                      return (
                        <div key={String(p.id)} role="button" tabIndex={0} onClick={toggleAdd} onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleAdd(); } }} style={{ padding: '8px 12px', cursor: added ? 'default' : 'pointer', borderBottom: `1px solid ${T.gray100}`, background: added ? T.tealLight : T.white, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <i className={added ? 'fas fa-circle-check' : 'fas fa-plus-circle'} style={{ color: added ? T.teal : T.gray400, fontSize: 14, flexShrink: 0 }}></i>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{codeOf(p) || t('missingBarcode')}</div>
                          </div>
                          <div style={{ fontSize: 12, color: T.gray500, flexShrink: 0 }}>{p.stock ?? 0}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {customBarcodeProducts.length > 0 && (
                  <div style={{ marginTop: 10, border: `1px solid ${T.gray200}`, borderRadius: 10, overflow: 'hidden', background: T.white }}>
                    {customBarcodeProducts.map((p: any) => (
                      <div key={String(p.id)} style={{ padding: '8px 12px', borderBottom: `1px solid ${T.gray100}`, display: 'flex', alignItems: 'center', gap: 8, background: T.tealLight }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{codeOf(p) || t('missingBarcode')}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T.gray500, flexShrink: 0 }}>{t('qty')}</span>
                        <input type="number" min={1} max={500} value={clampQty(customQty[String(p.id)])} onChange={e => { const v = Math.max(1, Math.min(500, parseInt(e.target.value, 10) || 1)); setCustomQty(prev => ({ ...prev, [String(p.id)]: v })); }} style={{ ...inputStyle, width: 72, textAlign: 'center', flexShrink: 0 }} />
                        <button type="button" title={t('remove')} onClick={() => { setCustomBarcodeProducts(prev => prev.filter((cp: any) => cp.id !== p.id)); setCustomQty(prev => { const n = { ...prev }; delete n[String(p.id)]; return n; }); }} style={{ ...btn('ghost', 'sm'), padding: '6px 9px', flexShrink: 0 }}><i className="fas fa-xmark"></i></button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => { const add = customBarcodeFiltered.filter((p: any) => !customBarcodeProducts.some((cp: any) => cp.id === p.id)); if (add.length) { setCustomBarcodeProducts(prev => [...prev, ...add]); setCustomQty(prev => { const n = { ...prev }; for (const p of add) n[String(p.id)] = n[String(p.id)] || 1; return n; }); } }} style={{ ...btn('ghost', 'sm') }}><i className="fas fa-check-double" style={{ marginRight: 4 }}></i>{t('selectAll')}</button>
                    <button type="button" onClick={() => { setCustomBarcodeProducts([]); setCustomQty({}); }} style={{ ...btn('ghost', 'sm') }}>{t('clear')}</button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 'auto' }}>
                    <span style={{ fontSize: 13, color: T.gray500 }}>{customBarcodeProducts.length} {t('products')} {t('selected')} · {customTotalLabels} {t('labels')}</span>
                    <button type="button" onClick={printCustomBarcode} disabled={customBarcodeProducts.length === 0} style={{ ...btn('primary', 'sm'), opacity: customBarcodeProducts.length === 0 ? 0.5 : 1 }}><i className="fas fa-print" style={{ marginRight: 4 }}></i>{t('print')}</button>
                  </div>
                </div>
                {missingCount > 0 && <div style={{ fontSize: 12, color: '#B91C1C', marginTop: 8 }}><i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{missingCount} {t('missingBarcode')}</div>}
              </div>
              <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                {cardHead('fas fa-sliders', t('labelOptions'), `${t('labelSize')} / ${t('labelPaper')}`)}
                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.gray500, display: 'block', marginBottom: 4 }}>{t('labelSize')}</label>
                  <select value={labelSize} onChange={e => setLabelSize(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                    <option value="50x25">50 × 25 mm</option>
                    <option value="38x25">38 × 25 mm</option>
                    <option value="50x40">50 × 40 mm</option>
                    <option value="50x30">50 × 30 mm</option>
                    <option value="40x30">40 × 30 mm</option>
                  </select>
                </div>

                <div style={{ marginTop: 10 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: T.gray500, display: 'block', marginBottom: 4 }}>{t('labelPaper')}</label>
                  <select value={labelPaper} onChange={e => setLabelPaper(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                    <option value="a4">A4 Sheet</option>
                    <option value="roll58">Roll 58 mm</option>
                    <option value="roll80">Roll 80 mm</option>
                  </select>
                </div>
                {barcodeWarn && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px' }}>
                    <i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{t(labelPaper === 'a4' ? 'barcodeTooSmallA4' : 'barcodeTooSmall')}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {modeToggle(labelShowName, () => setLabelShowName(v => !v), 'fas fa-font', t('showName'))}
                  {modeToggle(labelShowPrice, () => setLabelShowPrice(v => !v), 'fas fa-tag', t('showPrice'))}
                  {modeToggle(labelShowCompany, () => setLabelShowCompany(v => !v), 'fas fa-building', t('showCompany'))}
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.gray500, marginBottom: 6 }}><i className="fas fa-eye" style={{ marginRight: 4 }}></i>{t('preview')}</div>
                  {previewProduct ? (
                    <div style={{ border: `1px dashed ${T.gray300}`, borderRadius: 10, padding: 14, background: '#FAFAFA', display: 'flex', justifyContent: 'center' }}>
                      <style dangerouslySetInnerHTML={{ __html: labelItemCss(labelSize, labelWidthMm(labelSize, labelPaper), labelPaper) }} />
                      <div dangerouslySetInnerHTML={{ __html: barcodeLabelHtml(previewProduct, labelOpts()) }} />
                    </div>
                  ) : (
                    <div style={{ border: `1px dashed ${T.gray300}`, borderRadius: 10, padding: 14, background: '#FAFAFA', textAlign: 'center', fontSize: 13, color: T.gray400 }}>{t('noProductsYet')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };























  const exportViewProductHistory = (p: any) => {
      const apFrom = filterFrom || '';
      const apTo = filterTo || '';
      const inRange = (d: any): boolean => {
        if (!apFrom && !apTo) return true;
        if (!d) return false;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return false;
        const day = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
        if (apFrom && day < apFrom) return false;
        if (apTo && day > apTo) return false;
        return true;
      };
      const headers = ['Type', 'Date', 'Qty', 'Price', 'Total', 'Ref'];
      const lines = [headers.join(',')];
      const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const hist = (stockHistory || []).filter((h: any) =>
        (p.id && h.productId === p.id) || ((p.name || '').toLowerCase() === ((h.productName || h.product_name || '').toLowerCase()))
      ).filter((h: any) => inRange(h.created_at));
      hist.forEach((h: any) => {
        lines.push([esc(h.type || ''), esc(h.created_at || ''), esc(h.quantity || 0), esc(h.newStock ?? h.new_stock ?? ''), esc(''), esc(h.reason || '')].map((x, i) => i === 0 ? x : x).join(','));
      });
      const productSales = (sales || []).filter((s: any) => (s.items || []).some((it: any) => (p.id && it.productId === p.id) || (p.code && it.barcode === p.code))).filter((s: any) => inRange(s.date || s.created_at));
      productSales.forEach((s: any) => {
        (s.items || []).forEach((it: any) => {
          const match = (p.id && it.productId === p.id) || (p.code && it.barcode === p.code) || ((p.name || '').toLowerCase() === (it.name || '').toLowerCase());
          if (!match) return;
          const qty = +it.quantity || 0;
          const price = +it.price || 0;
          lines.push([esc('sale'), esc(s.date || s.created_at || ''), esc(qty), esc(price), esc(qty * price), esc(s.invoiceNo || s.id || '')].join(','));
        });
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `product-${(p.code || p.id || 'export')}-history.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const printViewProduct = (p: any) => {
      const apFrom = filterFrom || '';
      const apTo = filterTo || '';
      const inRange = (d: any): boolean => {
        if (!apFrom && !apTo) return true;
        if (!d) return false;
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return false;
        const day = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
        if (apFrom && day < apFrom) return false;
        if (apTo && day > apTo) return false;
        return true;
      };
      const hist = (stockHistory || []).filter((h: any) =>
        (p.id && h.productId === p.id) || ((p.name || '').toLowerCase() === ((h.productName || h.product_name || '').toLowerCase()))
      ).filter((h: any) => inRange(h.created_at));
      const rows = hist.map((h: any, i: number) => `<tr><td>${i+1}</td><td>${h.type || '-'}</td><td>${h.created_at ? new Date(h.created_at).toLocaleString() : '-'}</td><td>${h.quantity || 0}</td><td>${h.reason || '-'}</td></tr>`).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page{size:A4;margin:12mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11pt;color:#111}
.header{display:flex;justify-content:space-between;border-bottom:1.2mm solid #0F766E;padding-bottom:3mm;margin-bottom:4mm}
.header h1{color:#0F766E;font-size:16pt}
.meta{text-align:right;font-size:9pt;color:#555}
.card{background:#F0FDFA;border:0.4mm solid #99f6e4;border-radius:2mm;padding:3mm;margin-bottom:3mm;display:flex;gap:6mm;flex-wrap:wrap}
.lbl{font-size:8pt;color:#0F766E;text-transform:uppercase}
.val{font-weight:700;font-size:12pt}
table{width:100%;border-collapse:collapse;margin-top:2mm}
th{background:#0F766E;color:#fff;padding:2.5mm;text-align:left;font-size:9pt}
td{border:0.3mm solid #cbd5e1;padding:2mm;font-size:10pt}
tr:nth-child(even){background:#F8FAFC}
.footer{margin-top:8mm;font-size:9pt;color:#64748b}
</style></head><body>
<div class="header"><h1>Product Report</h1><div class="meta">${apFrom || '…'} → ${apTo || '…'}<br/>${new Date().toLocaleString()}</div></div>
<div class="card">
  <div><div class="lbl">Name</div><div class="val">${p.name}</div></div>
  <div><div class="lbl">Code</div><div class="val">${p.code || '-'}</div></div>
  <div><div class="lbl">Stock</div><div class="val">${p.stock} ${p.unit || ''}</div></div>
  <div><div class="lbl">Cost</div><div class="val">${fmt(p.costPrice)}</div></div>
  <div><div class="lbl">Sell</div><div class="val">${fmt(p.sellPrice)}</div></div>
  <div><div class="lbl">Supplier</div><div class="val">${p.company || '-'}</div></div>
</div>
<table><thead><tr><th>#</th><th>Type</th><th>Date</th><th>Qty</th><th>Reason</th></tr></thead><tbody>${rows || '<tr><td colspan="5" style="text-align:center;padding:6mm">No records in range</td></tr>'}</tbody></table>
<div class="footer">POS · ${hist.length} history records · ${apFrom || ''} ${apTo ? '→ ' + apTo : ''}</div>
</body></html>`;
      openPrintWin(html);
    };

    const renderViewProduct = () => {
    if (!viewProduct) return null;
    const p = viewProduct;
    const q = (search || '').toLowerCase();
    const phFrom = filterFrom || '';
    const phTo = filterTo || '';
    const inPhDate = (d: any): boolean => {
      if (!phFrom && !phTo) return true;
      if (!d) return false;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return false;
      const day = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      if (phFrom && day < phFrom) return false;
      if (phTo && day > phTo) return false;
      return true;
    };
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
    ).filter((s: any) => inPhDate(s.date || s.created_at)).filter((s: any) => !q || String(s.id || '').toLowerCase().includes(q) || String(s.customer || s.customerName || '').toLowerCase().includes(q) || String(s.date || s.created_at || '').toLowerCase().includes(q)).sort((a: any, b: any) => {
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
    ).filter((h: any) => inPhDate(h.created_at)).filter((h: any) => !q || String(h.type || '').toLowerCase().includes(q) || String(h.reason || '').toLowerCase().includes(q)).sort((a: any, b: any) => {
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
        <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap' }}>
          <button style={{ ...btn('ghost', 'sm') }} onClick={() => setViewProduct(null)}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}>/ {t('productDetails')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 180 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <label style={{ fontSize: 12, color: T.gray500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fas fa-calendar" style={{ color: T.teal }}></i>
              <input type="date" value={filterFrom || ''} onChange={e => setFilterFrom(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('fromDate') || 'From'} />
            </label>
            <span style={{ color: T.gray400, fontSize: 12 }}>→</span>
            <label style={{ fontSize: 12, color: T.gray500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="date" value={filterTo || ''} onChange={e => setFilterTo(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('toDate') || 'To'} />
            </label>
            {(filterFrom || filterTo) ? (
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => { setFilterFrom(''); setFilterTo(''); }} title={t('clear') || 'Clear'}>
                <i className="fas fa-xmark"></i>
              </button>
            ) : null}
            <span style={{ fontSize: 14, color: T.gray400 }}>{productSales.length + productStockHist.length}</span>
            <button style={{ ...btn('ghost', 'sm') }} onClick={() => exportViewProductHistory(viewProduct)}><i className="fas fa-file-csv" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
            <button style={{ ...btn('ghost', 'sm') }} onClick={() => printViewProduct(viewProduct)}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
          </div>
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
                  {codeOf(p) && <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 12, fontFamily: 'monospace' }}><i className="fas fa-barcode" style={{marginRight: 4}}></i>{codeOf(p)}</span>}
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
                  <button onClick={() => { setEditProduct({ ...p }); }} style={{ ...btn('ghost', 'sm'), background: 'rgba(255,255,255,0.2)', color: T.white, border: '1px solid rgba(255,255,255,0.4)' }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('edit') || 'Edit'}</button>
                  {p.stock <= 0 && <button onClick={() => { handleDeleteProduct(p); }} style={{ ...btn('ghost', 'sm'), background: 'rgba(255,255,255,0.2)', color: T.white, border: '1px solid rgba(255,255,255,0.4)' }}><i className="fas fa-trash" style={{marginRight: 4}}></i> {t('delete')}</button>}
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

                      </div>
        </div>
      </div>
    );
  };
  
    
    const renderPurchaseHistory = () => {
    const q = (search || '').toLowerCase();
    const inDateRange = (p: any): boolean => {
      if (!filterFrom && !filterTo) return true;
      const d = p.date || p.created_at;
      if (!d) return false;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return false;
      const day = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      if (filterFrom && day < filterFrom) return false;
      if (filterTo && day > filterTo) return false;
      return true;
    };
    const list = (purchases || []).filter((p: any) => {
      if (!inDateRange(p)) return false;
      if (!q) return true;
      return (p.id || '').toLowerCase().includes(q)
        || (p.supplier || '').toLowerCase().includes(q)
        || String(p.date || '').toLowerCase().includes(q)
        || (p.items || []).some((it: any) => (it.name || '').toLowerCase().includes(q) || (it.code || '').toLowerCase().includes(q));
    }).sort((a: any, b: any) => String(b.date || b.created_at || '').localeCompare(String(a.date || a.created_at || '')));
    const totalSpend = list.reduce((s: number, p: any) => s + (p.total || (p.items || []).reduce((x: number, i: any) => x + (i.quantity || i.stock || 0) * (i.costPrice || 0), 0)), 0);
    const freeValueTotal = list.reduce((sum: number, p: any) => sum + (p.freeTotal || (p.items || []).reduce((a: number, i: any) => a + (i.freeValue || (i.freeQty || 0) * (i.unitCost || i.costPrice || 0)), 0)), 0);
    const totalItems = list.reduce((s: number, p: any) => s + (p.items || []).length, 0);
    const totalQty = list.reduce((s: number, p: any) => s + (p.items || []).reduce((x: number, i: any) => x + (i.quantity || i.stock || 0), 0), 0);
    const suppliersSet = new Set(list.map((p: any) => p.supplier || '-').filter(Boolean));
    const avgOrder = list.length ? totalSpend / list.length : 0;
    const selected = viewPurchase ? list.find((p: any) => p.id === viewPurchase.id) || viewPurchase : null;

    const exportPurchaseCsv = () => {
      const headers = [t('purchaseId'), t('date'), t('supplier'), t('products'), t('quantity'), t('paidQty'), t('freeQty'), t('purchasePrice'), t('total'), t('freeValue')];
      const lines = [headers.join(',')];
      list.forEach((p: any) => {
        const items = p.items || [];
        const qty = items.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0), 0);
        const paidSum = items.reduce((s: number, i: any) => s + (i.paidQty || i.quantity || i.stock || 0), 0);
        const freeSum = items.reduce((s: number, i: any) => s + (i.freeQty || 0), 0);
        const tot = p.total || items.reduce((s: number, i: any) => s + ((i.paidQty != null ? i.paidQty : (i.quantity || i.stock || 0)) * (i.unitCost || i.costPrice || 0)), 0);
        const freeTot = p.freeTotal || items.reduce((s: number, i: any) => s + (i.freeValue || (i.freeQty || 0) * (i.unitCost || i.costPrice || 0)), 0);
        const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const unitAvg = paidSum > 0 ? tot / paidSum : 0; lines.push([esc(p.id), esc(p.date), esc(p.supplier), esc(items.length), esc(qty), esc(paidSum), esc(freeSum), esc(unitAvg.toFixed(2)), esc(tot), esc(freeTot)].join(','));
        items.forEach((it: any) => {
          const lineQty = it.quantity || it.stock || 0;
          const linePaid = it.paidQty != null ? it.paidQty : lineQty;
          const lineFree = it.freeQty || 0;
          const unit = it.unitCost != null ? it.unitCost : (it.costPrice || 0);
          const lineTot = linePaid * unit;
          const lineFreeVal = it.freeValue != null ? it.freeValue : lineFree * unit;
          lines.push(['', '', '', esc(it.name), esc(lineQty), esc(linePaid), esc(lineFree), esc(unit), esc(lineTot), esc(lineFreeVal)].join(','));
        });
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `purchase-history-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const printPurchaseInvoice = (p: any) => {
      const items = p.items || [];
      const rows = items.map((it: any, i: number) => {
        const paid = it.paidQty != null ? it.paidQty : (it.quantity || it.stock || 0);
        const free = it.freeQty || 0;
        const qty = it.quantity || (paid + free) || it.stock || 0;
        const unit = it.unitCost != null ? it.unitCost : (it.costPrice || 0);
        const tot = paid * unit;
        const qtyLabel = free > 0 ? `${paid}+${free}free` : `${qty}`;
        return `<tr><td>${i+1}</td><td>${it.name || ''}</td><td>${it.code || ''}</td><td>${qtyLabel} ${it.unit || ''}</td><td>${fmt(unit)}</td><td>${fmt(tot)}</td></tr>`;
      }).join('');
      const total = p.total || items.reduce((s: number, i: any) => {
        const paid = i.paidQty != null ? i.paidQty : (i.quantity || i.stock || 0);
        const unit = i.unitCost != null ? i.unitCost : (i.costPrice || 0);
        return s + paid * unit;
      }, 0);
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
@page{size:A4;margin:12mm}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11pt;color:#111}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1.2mm solid #0F766E;padding-bottom:3mm;margin-bottom:4mm}
.header h1{color:#0F766E;font-size:16pt}
.meta{text-align:right;font-size:9pt;color:#555}
.card{background:#F0FDFA;border:0.4mm solid #99f6e4;border-radius:2mm;padding:3mm;margin-bottom:3mm;display:flex;gap:6mm;flex-wrap:wrap}
.card div{font-size:10pt}
.card .lbl{font-size:8pt;color:#0F766E;text-transform:uppercase}
.card .val{font-weight:700;font-size:12pt}
table{width:100%;border-collapse:collapse;margin-top:2mm}
th{background:#0F766E;color:#fff;padding:2.5mm;text-align:left;font-size:9pt}
td{border:0.3mm solid #cbd5e1;padding:2mm;font-size:10pt}
tr:nth-child(even){background:#F8FAFC}
.tot{margin-top:4mm;text-align:right;font-size:14pt;font-weight:800;color:#0F766E}
.footer{margin-top:8mm;display:flex;justify-content:space-between;font-size:9pt;color:#64748b}
.footer span{flex:1;border-top:0.4mm solid #94a3b8;padding-top:2mm;margin-right:4mm}
</style></head><body>
<div class="header"><h1>Purchase Invoice</h1><div class="meta">ID: ${p.id}<br/>Date: ${new Date(p.date).toLocaleString()}<br/>Supplier: ${p.supplier || '-'}</div></div>
<div class="card">
  <div><div class="lbl">Purchase ID</div><div class="val">${p.id}</div></div>
  <div><div class="lbl">Supplier</div><div class="val">${p.supplier || '-'}</div></div>
  <div><div class="lbl">Products</div><div class="val">${items.length}</div></div>
  <div><div class="lbl">Total Qty</div><div class="val">${items.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0), 0)}</div></div>
  <div><div class="lbl">Total</div><div class="val">${fmt(total)}</div></div>
</div>
<table><thead><tr><th>#</th><th>Product</th><th>Code</th><th>Qty</th><th>Cost</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
<div class="tot">Grand Total: ${fmt(total)}</div>
<div class="footer"><span>Received by: _______________</span><span>Authorized by: _______________</span></div>
</body></html>`;
      openPrintWin(html);
    };

    const stats = [
      { icon: 'fas fa-boxes-stacked', label: t('totalPurchases') || 'Total Purchases', value: String(list.length), color: T.teal, bg: T.tealLight },
      { icon: 'fas fa-sack-dollar', label: t('totalPurchase') || 'Total Spend', value: fmt(totalSpend), color: T.green, bg: '#DCFCE7' },
      { icon: 'fas fa-gift', label: t('freeValue'), value: `${_settings?.currencySymbol} ${freeValueTotal.toLocaleString()}`, color: '#B45309', bg: '#FEF3C7' },
      { icon: 'fas fa-box', label: t('products') || 'Product Lines', value: String(totalItems), color: '#7C3AED', bg: '#EDE9FE' },
      { icon: 'fas fa-cubes', label: t('quantity') || 'Total Qty', value: String(totalQty), color: '#D97706', bg: '#FEF3C7' },
      { icon: 'fas fa-building', label: t('suppliers') || 'Suppliers', value: String(suppliersSet.size), color: '#2563EB', bg: '#DBEAFE' },
      { icon: 'fas fa-chart-line', label: t('avgOrder') || 'Avg Order', value: fmt(avgOrder), color: '#0369A1', bg: '#E0F2FE' },
    ];

    const selectedItems = selected ? (selected.items || []) : [];
    const selectedQty = selectedItems.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0), 0);
    const selectedTotal = selected ? (selected.total || selectedItems.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0) * (i.costPrice || 0), 0)) : 0;

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
        {/* Top bar */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={{ ...btn('ghost', 'sm') }} onClick={() => { setProductTab('allProducts'); setViewPurchase(null); }}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}>/ {t('purchaseHistory')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', width: 200 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <label style={{ fontSize: 12, color: T.gray500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fas fa-calendar" style={{ color: T.teal }}></i>
              <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('fromDate') || 'From'} />
            </label>
            <span style={{ color: T.gray400, fontSize: 12 }}>→</span>
            <label style={{ fontSize: 12, color: T.gray500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('toDate') || 'To'} />
            </label>
            {(filterFrom || filterTo) ? (
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => { setFilterFrom(''); setFilterTo(''); }} title={t('clear') || 'Clear'}>
                <i className="fas fa-xmark"></i>
              </button>
            ) : null}
            <span style={{ fontSize: 14, color: T.gray400 }}>{list.length}</span>
            <button style={{ ...btn('ghost', 'sm') }} onClick={exportPurchaseCsv}><i className="fas fa-file-csv" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Gradient header */}
          <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark || '#0F766E'} 100%)`, padding: '28px 24px 24px', color: T.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                <i className="fas fa-truck"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('purchaseHistory')}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  {list.length} {t('totalPurchases') || 'purchases'} · {suppliersSet.size} {t('suppliers')} · {fmt(totalSpend)}{filterFrom || filterTo ? ` · ${filterFrom || '…'} → ${filterTo || '…'}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-boxes-stacked" style={{ marginRight: 6 }}></i>{list.length} {t('purchases')}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-building" style={{ marginRight: 6 }}></i>{suppliersSet.size} {t('suppliers')}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-sack-dollar" style={{ marginRight: 6 }}></i>{fmt(totalSpend)}
                  </span>
                </div>
              </div>
              <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: T.white, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} onClick={exportPurchaseCsv}>
                <i className="fas fa-file-csv" style={{ marginRight: 6 }}></i>{t('exportCsv')}
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={s.icon}></i>
                  </div>
                  <div style={{ fontSize: 12, color: T.gray400, fontWeight: 600 }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Detail panel when selected */}
          {selected && (
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 8px' }}>
              <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <div style={{ background: `linear-gradient(135deg, ${T.tealLight || '#F0FDFA'} 0%, ${T.white} 100%)`, padding: '16px 20px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.gray400, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('purchaseId')}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.teal, fontFamily: 'monospace' }}>{selected.id}</div>
                    <div style={{ fontSize: 13, color: T.gray500, marginTop: 4 }}>
                      <i className="fas fa-calendar" style={{ marginRight: 6 }}></i>{selected.date ? new Date(selected.date).toLocaleString() : '-'}
                      <span style={{ margin: '0 8px', color: T.gray300 }}>|</span>
                      <i className="fas fa-building" style={{ marginRight: 6 }}></i>{selected.supplier || '-'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: 8 }}>
                      <div style={{ fontSize: 11, color: T.gray400 }}>{t('total')}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.green }}>{fmt(selectedTotal)}</div>
                    </div>
                    <button style={{ ...btn('ghost', 'sm') }} onClick={() => printPurchaseInvoice(selected)}><i className="fas fa-print" style={{ marginRight: 4 }}></i>{t('print')}</button>
                    <button style={{ ...btn('ghost', 'sm') }} onClick={() => setViewPurchase(null)}><i className="fas fa-xmark"></i></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, padding: '14px 20px', borderBottom: `1px solid ${T.gray100}`, background: '#FAFAFA' }}>
                  {[
                    { label: t('products'), value: String(selectedItems.length) },
                    { label: t('quantity'), value: String(selectedQty) },
                    { label: t('supplier'), value: selected.supplier || '-' },
                    { label: t('date'), value: selected.date ? new Date(selected.date).toLocaleDateString() : '-' },
                    { label: t('purchaseId'), value: selected.id },
                  ].map((f, fi) => (
                    <div key={fi}>
                      <div style={{ fontSize: 11, color: T.gray400, fontWeight: 600 }}>{f.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.gray600, fontFamily: fi === 4 ? 'monospace' : 'inherit' }}>{f.value}</div>
                    </div>
                  ))}
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: T.tealLight }}>
                      {['#', t('productName'), t('code'), t('quantity'), t('purchasePrice'), t('total')].map((h, hi) => (
                        <th key={hi} style={{ padding: '10px 14px', textAlign: hi >= 3 ? 'right' : 'left', fontSize: 13, fontWeight: 700, color: T.teal }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: T.gray400 }}>{t('noPurchaseRecords')}</td></tr>
                    ) : selectedItems.map((it: any, ii: number) => {
                      const lineQty = it.quantity || it.stock || 0;
                      const lineTot = lineQty * (it.costPrice || 0);
                      return (
                        <tr key={ii} style={{ background: ii % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray400 }}>{ii + 1}</td>
                          <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 600 }}>{it.name}</td>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'monospace', color: T.gray500 }}>{it.code || '-'}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 14 }}>{lineQty} {it.unit || ''}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 14 }}>{fmt(it.costPrice || 0)}</td>
                          <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: T.green }}>{fmt(lineTot)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: T.tealLight }}>
                      <td colSpan={5} style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: T.teal, fontSize: 14 }}>{t('total')}</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: T.green, fontSize: 16 }}>{fmt(selectedTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Purchase list */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: selected ? '8px 24px 24px' : '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.gray500, padding: '4px 0' }}>
              {selected ? t('purchases') : `${list.length} ${t('purchases')}`}
            </div>
            {list.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: T.gray400, background: T.white, borderRadius: 14, border: `1px dashed ${T.gray200}` }}>
                <i className="fas fa-box-open" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: T.gray300 }}></i>
                {t('noPurchaseRecords')}
              </div>
            ) : list.map((p: any) => {
              const items = p.items || [];
              const qty = items.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0), 0);
              const total = p.total || items.reduce((s: number, i: any) => s + (i.quantity || i.stock || 0) * (i.costPrice || 0), 0);
              const isOpen = selected && selected.id === p.id;
              return (
                <div key={p.id} onClick={() => setViewPurchase(isOpen ? null : p)} style={{
                  background: T.white,
                  border: isOpen ? `2px solid ${T.teal}` : `1px solid ${T.gray200}`,
                  borderRadius: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: isOpen ? '0 4px 16px rgba(15,118,110,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flexWrap: 'wrap' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: isOpen ? T.teal : T.tealLight, color: isOpen ? T.white : T.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="fas fa-truck"></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, color: T.teal, fontSize: 14, fontFamily: 'monospace' }}>{p.id}</span>
                        <span style={{ fontSize: 12, background: T.tealLight, color: T.teal, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          {items.length} {t('products')}
                        </span>
                        <span style={{ fontSize: 12, background: '#FEF3C7', color: '#B45309', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          {qty} {t('quantity')}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: T.gray500, marginTop: 4 }}>
                        <i className="fas fa-calendar" style={{ marginRight: 5, fontSize: 11 }}></i>{p.date ? new Date(p.date).toLocaleString() : '-'}
                        <span style={{ margin: '0 6px', color: T.gray300 }}>·</span>
                        <i className="fas fa-building" style={{ marginRight: 5, fontSize: 11 }}></i>{p.supplier || '-'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: T.gray400 }}>{t('total')}</div>
                      <div style={{ fontWeight: 800, color: T.green, fontSize: 16 }}>{fmt(total)}</div>
                    </div>
                    <button style={{ ...btn('ghost', 'sm') }} onClick={(e: any) => { e.stopPropagation(); printPurchaseInvoice(p); }} title={t('print')}>
                      <i className="fas fa-print"></i>
                    </button>
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ color: T.gray400, fontSize: 12 }}></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  
    const renderPriceHistory = () => {
    const q = (search || '').toLowerCase();
    const fromDate = (typeof filterFrom !== 'undefined' ? filterFrom : '') || '';
    const toDate = (typeof filterTo !== 'undefined' ? filterTo : '') || '';
    const inRange = (h: any): boolean => {
      if (!fromDate && !toDate) return true;
      const d = h.created_at;
      if (!d) return false;
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return false;
      const day = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      if (fromDate && day < fromDate) return false;
      if (toDate && day > toDate) return false;
      return true;
    };
    const allPrice = (stockHistory || []).filter((h: any) => h.type === 'price');
    const rows = allPrice.filter((h: any) => {
      if (!inRange(h)) return false;
      if (!q) return true;
      return (h.productName || h.product_name || '').toLowerCase().includes(q)
        || (h.reason || '').toLowerCase().includes(q);
    });
    const uniqueProducts = new Set(rows.map((h: any) => h.productName || h.product_name || h.productId || '').filter(Boolean));
    let upCount = 0;
    let downCount = 0;
    let sumPct = 0;
    let pctN = 0;
    rows.forEach((h: any) => {
      const oldP = +(h.oldPrice ?? h.oldStock ?? h.old_stock ?? 0);
      const newP = +(h.newPrice ?? h.newStock ?? h.new_stock ?? 0);
      if (newP > oldP) upCount++;
      else if (newP < oldP) downCount++;
      if (oldP > 0) {
        sumPct += ((newP - oldP) / oldP) * 100;
        pctN++;
      }
    });
    const avgPct = pctN ? (sumPct / pctN) : 0;
    const lastChange = rows[0] || null;

    const exportPriceCsv = () => {
      const headers = [t('productName'), t('date'), t('oldPrice'), t('newPrice'), 'Change%', t('reason')];
      const lines = [headers.join(',')];
      rows.forEach((h: any) => {
        const oldP = +(h.oldPrice ?? h.oldStock ?? 0);
        const newP = +(h.newPrice ?? h.newStock ?? 0);
        const pct = oldP > 0 ? (((newP - oldP) / oldP) * 100).toFixed(1) : '';
        const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        lines.push([esc(h.productName || ''), esc(h.created_at || ''), esc(oldP), esc(newP), esc(pct), esc(h.reason || '')].join(','));
      });
      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `price-history-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    };

    const printPriceHistory = () => {
      const trs = rows.map((h: any, i: number) => {
        const oldP = +(h.oldPrice ?? h.oldStock ?? 0);
        const newP = +(h.newPrice ?? h.newStock ?? 0);
        const diff = newP - oldP;
        const pct = oldP > 0 ? ((diff / oldP) * 100).toFixed(1) + '%' : '-';
        return `<tr><td>${i+1}</td><td>${h.productName || '-'}</td><td>${h.created_at ? new Date(h.created_at).toLocaleString() : '-'}</td><td>${fmt(oldP)}</td><td>${fmt(newP)}</td><td class="${diff>=0?'up':'down'}">${fmt(diff)} (${pct})</td><td>${h.reason || '-'}</td></tr>`;
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
.up{color:#16a34a;font-weight:700}
.down{color:#dc2626;font-weight:700}
.footer{margin-top:4mm;font-size:8pt;color:#64748b}
</style></head><body>
<div class="header"><h1>Price Change History</h1><div class="meta">${fromDate || '…'} → ${toDate || '…'}<br/>${new Date().toLocaleString()}</div></div>
<div class="stats">
  <div class="stat"><div class="lbl">Changes</div><div class="val">${rows.length}</div></div>
  <div class="stat"><div class="lbl">Products</div><div class="val">${uniqueProducts.size}</div></div>
  <div class="stat"><div class="lbl">Price Up</div><div class="val">${upCount}</div></div>
  <div class="stat"><div class="lbl">Price Down</div><div class="val">${downCount}</div></div>
  <div class="stat"><div class="lbl">Avg Change</div><div class="val">${avgPct.toFixed(1)}%</div></div>
</div>
<table><thead><tr><th>#</th><th>Product</th><th>Date</th><th>Old</th><th>New</th><th>Change</th><th>Reason</th></tr></thead><tbody>${trs || '<tr><td colspan="7" style="text-align:center;padding:8mm">No price history</td></tr>'}</tbody></table>
<div class="footer">Generated by POS · ${rows.length} records</div>
</body></html>`;
      openPrintWin(html);
    };

    const stats = [
      { icon: 'fas fa-tags', label: t('totalChanges') || 'Changes', value: String(rows.length), color: T.teal, bg: T.tealLight },
      { icon: 'fas fa-box', label: t('products'), value: String(uniqueProducts.size), color: '#7C3AED', bg: '#EDE9FE' },
      { icon: 'fas fa-arrow-up', label: t('priceUp') || 'Price Up', value: String(upCount), color: T.green, bg: '#DCFCE7' },
      { icon: 'fas fa-arrow-down', label: t('priceDown') || 'Price Down', value: String(downCount), color: T.red, bg: T.redLight },
      { icon: 'fas fa-percent', label: t('avgChange') || 'Avg Change', value: `${avgPct >= 0 ? '+' : ''}${avgPct.toFixed(1)}%`, color: avgPct >= 0 ? T.green : T.red, bg: avgPct >= 0 ? '#DCFCE7' : T.redLight },
      { icon: 'fas fa-clock', label: t('lastChange') || 'Last Change', value: lastChange ? new Date(lastChange.created_at).toLocaleDateString() : '-', color: '#0369A1', bg: '#E0F2FE' },
    ];

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
        {/* Top bar */}
        <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}` }}>
          <button style={{ ...btn('ghost', 'sm') }} onClick={() => { setProductTab('allProducts'); if (typeof setFilterFrom === 'function') { setFilterFrom(''); setFilterTo(''); } setSearch(''); }}><i className="fas fa-arrow-left" style={{marginRight: 4}}></i> {t('back')}</button>
          <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}>/ {t('priceHistory')}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 180 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-magnifying-glass"></i></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('searchProductPlaceholder')} style={{ ...inputStyle, paddingLeft: 32 }} />
            </div>
            <input type="date" value={fromDate} onChange={e => setFilterFrom && setFilterFrom(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('fromDate')} />
            <span style={{ color: T.gray400, fontSize: 12 }}>→</span>
            <input type="date" value={toDate} onChange={e => setFilterTo && setFilterTo(e.target.value)} style={{ ...inputStyle, width: 140, padding: '6px 8px', fontSize: 13 }} title={t('toDate')} />
            <span style={{ fontSize: 14, color: T.gray400 }}>{rows.length}</span>
            <button style={{ ...btn('ghost', 'sm') }} onClick={exportPriceCsv}><i className="fas fa-file-csv" style={{marginRight: 4}}></i> {t('exportCsv')}</button>
            <button style={{ ...btn('ghost', 'sm') }} onClick={printPriceHistory}><i className="fas fa-print" style={{marginRight: 4}}></i> {t('print')}</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Gradient header */}
          <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark || '#0F766E'} 100%)`, padding: '28px 24px 24px', color: T.white }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, maxWidth: 1200, margin: '0 auto' }}>
              <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                <i className="fas fa-tags"></i>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>{t('priceHistory')}</div>
                <div style={{ fontSize: 13, opacity: 0.9 }}>
                  {rows.length} {t('totalChanges') || 'changes'} · {uniqueProducts.size} {t('products')} · {avgPct >= 0 ? '+' : ''}{avgPct.toFixed(1)}% {t('avgChange') || 'avg'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-arrow-up" style={{ marginRight: 6 }}></i>{upCount} Up
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                    <i className="fas fa-arrow-down" style={{ marginRight: 6 }}></i>{downCount} Down
                  </span>
                  {(fromDate || toDate) ? (
                    <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      <i className="fas fa-calendar" style={{ marginRight: 6 }}></i>{fromDate || '…'} → {toDate || '…'}
                    </span>
                  ) : null}
                </div>
              </div>
              <button style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: T.white, borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }} onClick={exportPriceCsv}>
                <i className="fas fa-file-csv" style={{ marginRight: 6 }}></i>{t('exportCsv')}
              </button>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, padding: '16px 24px', maxWidth: 1200, margin: '0 auto' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={s.icon}></i>
                  </div>
                  <div style={{ fontSize: 12, color: T.gray400, fontWeight: 600 }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Table / list */}
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 24px' }}>
            <div style={{ background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.gray600 }}>
                  <i className="fas fa-list" style={{ marginRight: 6, color: T.teal }}></i>{t('priceHistory')} · {rows.length}
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: T.tealLight }}>
                    {[t('productName'), t('date'), t('oldPrice'), t('newPrice'), t('change') || 'Change', t('reason')].map((h, hi) => (
                      <th key={hi} style={{ padding: '10px 14px', textAlign: hi >= 2 && hi <= 4 ? 'right' : 'left', fontSize: 13, fontWeight: 700, color: T.teal }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 48, textAlign: 'center', color: T.gray400 }}>
                        <i className="fas fa-tags" style={{ fontSize: 36, marginBottom: 12, display: 'block', color: T.gray300 }}></i>
                        {t('noPriceHistory')}
                      </td>
                    </tr>
                  ) : rows.map((h: any, i: number) => {
                    const oldP = +(h.oldPrice ?? h.oldStock ?? h.old_stock ?? 0);
                    const newP = +(h.newPrice ?? h.newStock ?? h.new_stock ?? 0);
                    const diff = newP - oldP;
                    const pct = oldP > 0 ? ((diff / oldP) * 100) : null;
                    const up = diff > 0;
                    const down = diff < 0;
                    return (
                      <tr key={h.id || i} style={{ background: i % 2 === 0 ? T.white : '#FAFAFA', borderBottom: `1px solid ${T.gray100}` }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{h.productName || h.product_name || '-'}</div>
                          {h.reason ? <div style={{ fontSize: 12, color: T.gray400, marginTop: 2 }}>{h.reason}</div> : null}
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray500 }}>{h.created_at ? new Date(h.created_at).toLocaleString() : '-'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 14 }}>
                          <span style={{ textDecoration: 'line-through', color: T.gray400 }}>{fmt(oldP)}</span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: 14, fontWeight: 700, color: up ? T.green : down ? T.red : T.gray600 }}>
                          {fmt(newP)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 800,
                            background: up ? '#DCFCE7' : down ? T.redLight : T.gray100,
                            color: up ? T.green : down ? T.red : T.gray500,
                          }}>
                            {up ? '▲' : down ? '▼' : '—'} {fmt(Math.abs(diff))}{pct !== null ? ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)` : ''}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: T.gray600 }}>{h.reason || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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











                  <td style={{ padding: '10px 12px', fontWeight: 600, fontSize: 14 }}>{p.name}<div style={{ fontSize: 12, color: T.gray400, fontFamily: 'monospace' }}>{codeOf(p) || '-'}</div></td>











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











              <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>{stockAdjustProduct.name}</span>
                {!!stockAdjustProduct.foc && (
                  <span style={{ padding: '2px 8px', borderRadius: 10, background: '#FEF3C7', color: '#B45309', fontSize: 11, fontWeight: 800, border: '1px solid #FCD34D' }}>
                    <i className="fas fa-gift" style={{ marginRight: 4, fontSize: 10 }}></i>{t('foc')}
                  </span>
                )}
              </div>











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
                  <button onClick={() => { setShowImportModal(true); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvUpload')}</button>

                  <button onClick={() => { setProductTab('priceHistory'); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-clock-rotate-left" style={{marginRight: 4}}></i> {t('priceHistory')}</button>

                  <button onClick={() => { setProductTab('purchaseHistory'); setShowMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-truck" style={{marginRight: 4}}></i> {t('purchaseHistory')}</button>

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
                  <input id="supplier-csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim()); const headers = lines2[0].split(',').map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name')); const phoneIdx = headers.findIndex((h: string) => h.includes('phone')); const emailIdx = headers.findIndex((h: string) => h.includes('email')); const addressIdx = headers.findIndex((h: string) => h.includes('address')); const crIdx = headers.findIndex((h: string) => h.includes('cr')); const vatIdx = headers.findIndex((h: string) => h.includes('vat')); let imported = 0; for (let k = 1; k < lines2.length; k++) { const cols = lines2[k].split(',').map((c: string) => c.trim()); const name = nameIdx >= 0 ? cols[nameIdx] : ''; if (!name) continue; const newS = { id: genSupplierId(suppliers), name, phone: phoneIdx >= 0 ? cols[phoneIdx] || '' : '', email: emailIdx >= 0 ? cols[emailIdx] || '' : '', address: addressIdx >= 0 ? cols[addressIdx] || '' : '', crNumber: crIdx >= 0 ? cols[crIdx] || '' : '', vatNumber: vatIdx >= 0 ? cols[vatIdx] || '' : '' }; const exists = suppliers.find((s: any) => (s.name || '').toLowerCase() === name.toLowerCase()); if (!exists) { setSuppliers((prev: any[]) => [...prev, newS]); setSuppliersParent((prev: any[]) => [...prev, newS]); api.addSupplier(newS).catch(() => {}); imported++; } } alert(`${imported} ${t('suppliers')} imported!`); }; reader.readAsText(file); e.target.value = ''; }} />











            </div>











            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingSupplier(null); setSupplierForm({ id: genSupplierId(suppliers), name: '', phone: '', email: '', address: '', crNumber: '', vatNumber: '', code: '' }); setShowSupplierModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addSupplier')}</button>











          </div>











        )}











        {productTab === 'categories' && (











          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>











            <div style={{ position: 'relative' }}>











              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setShowCategoryMoreMenu(!showCategoryMoreMenu)}>⋯ {t('more')}</button>











              {showCategoryMoreMenu && (











                <div data-menu="category" style={{ position: 'absolute', top: '100%', right: 0, background: T.white, border: `1px solid ${T.gray200}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 50, minWidth: 200, padding: 4 }}>











                  <button onClick={() => { document.getElementById('category-csv-input')?.click(); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-import" style={{marginRight: 4}}></i> {t('csvImport')} {t('categories')}</button>
                  <button onClick={() => { const headers = ['Name']; const demo = [headers.join(','), 'Electronics', 'Groceries', 'Clothing', 'Stationery'].join('\n'); const blob = new Blob([demo], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'categories_template.csv'; a.click(); URL.revokeObjectURL(url); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-download" style={{marginRight: 4}}></i> {t('demoCsv')}</button>











                  <button onClick={() => { exportCategoriesCsv(); setShowCategoryMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>











                </div>











              )}
                  <input id="category-csv-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim());
                  const parseLine = (line: string): string[] => {
                    const out: string[] = []; let cur = ''; let inQ = false;
                    for (let ci = 0; ci < line.length; ci++) {
                      const ch = line[ci];
                      if (inQ) {
                        if (ch === '"' && line[ci + 1] === '"') { cur += '"'; ci++; }
                        else if (ch === '"') inQ = false;
                        else cur += ch;
                      } else if (ch === '"') inQ = true;
                      else if (ch === ',') { out.push(cur); cur = ''; }
                      else cur += ch;
                    }
                    out.push(cur);
                    return out;
                  };
                  const headers = parseLine(lines2[0]).map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name')); let imported = 0; let failed = 0; const localCats: any[] = [...categories]; const jobs: Promise<void>[] = []; for (let k = 1; k < lines2.length; k++) { const cols = parseLine(lines2[k]).map((c: string) => c.trim()); const name = (nameIdx >= 0 ? cols[nameIdx] : '').trim(); if (!name) continue; const exists = localCats.find((ca: any) => String(ca.name || '').trim().toLowerCase() === name.toLowerCase()); if (exists) continue; const newCat = { id: genCategoryId(localCats), name }; localCats.push(newCat); setCategories((prev: any[]) => [...prev, newCat]); setCategoriesParent((prev: any[]) => [...prev, newCat]); imported++; jobs.push(api.addCategory(newCat).then((res: any) => { if (res && res.id && res.id !== newCat.id) { setCategories((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c)); setCategoriesParent((prev: any[]) => prev.map((c: any) => c.id === newCat.id ? { ...c, id: res.id } : c)); } }).catch(() => { failed++; setCategories((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id)); setCategoriesParent((prev: any[]) => prev.filter((c: any) => c.id !== newCat.id)); })); } Promise.all(jobs).finally(() => alert(`${imported} ${t('categories')} imported!${failed ? ` (${failed} ${t('failed')})` : ''}`)); }; reader.readAsText(file); e.target.value = ''; }} />











            </div>











            <button style={{ ...btn('primary', 'sm') }} onClick={() => { setEditingCategory(null); setCategoryForm({ id: genCategoryId(categories), name: '' }); setShowCategoryModal(true); }}><i className="fas fa-plus" style={{marginRight: 4}}></i> {t('addCategory')}</button>











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

                  <button onClick={() => { setStockFilter('foc'); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: stockFilter === 'foc' ? '#FEF3C7' : 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-gift" style={{marginRight: 4}}></i> {t('stockLow')}</button>











                  <div style={{ borderTop: `1px solid ${T.gray100}`, margin: '4px 0' }}></div>











                  <button onClick={() => { exportStockCsv(); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-file-export" style={{marginRight: 4}}></i> {t('exportCsv')}</button>











                  <button onClick={() => { setStockHistoryFilter('add'); setShowStockHistoryModal(true); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('stock')} + {t('history')}</button>











                  <button onClick={() => { setStockHistoryFilter('remove'); setShowStockHistoryModal(true); setShowStockMoreMenu(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-box" style={{marginRight: 4}}></i> {t('stock')} - {t('history')}</button>
                  <button onClick={() => { openDeleteHistory(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, borderRadius: 4, color: T.gray600 }}><i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteHistory')}</button>











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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>
            {/* Top bar — Product View style */}
            <div style={{ padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center', background: T.white, borderBottom: `1px solid ${T.gray200}`, flexWrap: 'wrap', flexShrink: 0 }}>
              <button style={{ ...btn('ghost', 'sm') }} onClick={() => setProductTab('allProducts')}><i className="fas fa-arrow-left" style={{ marginRight: 4 }}></i> {t('back')}</button>
              <span style={{ fontWeight: 700, fontSize: 15, color: T.gray600 }}>/ {t('newProduct')}</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: T.gray400 }}>{tempProducts.length} {t('productList')}</span>
                <input id="csv-upload-input" type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const text = (ev.target?.result as string) || ''; const lines2 = text.split('\n').filter((l: string) => l.trim()); const headers = lines2[0].split(',').map((h: string) => h.trim().toLowerCase()); const nameIdx = headers.findIndex((h: string) => h.includes('name') || h.includes('product')); const codeIdx = headers.findIndex((h: string) => h.includes('code') || h.includes('barcode')); const catIdx = headers.findIndex((h: string) => h.includes('cat') || h.includes('category')); const costIdx = headers.findIndex((h: string) => h.includes('cost') || h.includes('purchase')); const sellIdx = (() => { const s = headers.findIndex((h: string) => h.includes('sell')); if (s >= 0) return s; return headers.findIndex((h: string) => (h.includes('sellprice') || h.includes('sell_price') || (h.includes('price') && !h.includes('cost') && !h.includes('purchase')))); })(); const stockIdx = headers.findIndex((h: string) => h.includes('stock') && !h.includes('min')); const unitIdx = headers.findIndex((h: string) => h.includes('unit')); const companyIdx = headers.findIndex((h: string) => h.includes('company') || h.includes('supplier')); const minStockIdx = headers.findIndex((h: string) => h.includes('minstock') || h.includes('min_stock') || h === 'min'); const vatIdx = headers.findIndex((h: string) => h.includes('vat')); const expiryIdx = headers.findIndex((h: string) => h.includes('expir')); const imported: any[] = []; const errors: string[] = []; const stockUpdated: string[] = []; for (let i = 1; i < lines2.length; i++) { const cols = lines2[i].split(',').map((c: string) => c.trim()); const name = nameIdx >= 0 ? cols[nameIdx] : ''; if (!name) continue; const companyName = companyIdx >= 0 ? cols[companyIdx] : ''; let supplierId = ''; if (companyName) { const matched = suppliers.find((s: any) => (s.name || '').toLowerCase() === companyName.toLowerCase()); if (matched) { supplierId = matched.id; } else { errors.push(`Row ${i+1}: "${companyName}" - ${t('supplierNotFound')}`); continue; } } const rowCode = (codeIdx >= 0 ? cols[codeIdx] : '').trim().toLowerCase();
                      const existingIdx = tempProducts.findIndex((t: any) => {
                        const tCode = (t.code || '').trim().toLowerCase();
                        const tName = (t.name || '').trim().toLowerCase();
                        return (rowCode !== '' && tCode === rowCode) || tName === name.trim().toLowerCase();
                      });
                      if (existingIdx >= 0) {
                        setTempProducts((prev: any[]) => prev.map((t: any, idx: number) => idx === existingIdx ? { ...t, name: name || t.name, cat: (catIdx >= 0 && cols[catIdx]) ? cols[catIdx] : t.cat, costPrice: costIdx >= 0 && cols[costIdx] !== '' && cols[costIdx] !== undefined ? Math.max(0, parseFloat(cols[costIdx]) || t.costPrice || 0) : t.costPrice, sellPrice: sellIdx >= 0 && cols[sellIdx] !== '' && cols[sellIdx] !== undefined ? Math.max(0, parseFloat(cols[sellIdx]) || t.sellPrice || 0) : t.sellPrice, unit: (unitIdx >= 0 && cols[unitIdx]) ? cols[unitIdx] : t.unit, company: companyName || t.company, supplierId: supplierId || t.supplierId, minStock: minStockIdx >= 0 && cols[minStockIdx] !== '' && cols[minStockIdx] !== undefined ? (parseInt(cols[minStockIdx], 10) || t.minStock) : t.minStock, vat: vatIdx >= 0 && cols[vatIdx] !== '' && cols[vatIdx] !== undefined ? (parseFloat(cols[vatIdx]) || t.vat) : t.vat, expiryDate: expiryIdx >= 0 && cols[expiryIdx] ? cols[expiryIdx] : t.expiryDate, stock: Math.max(0, t.stock || 0) + (stockIdx >= 0 ? Math.max(0, parseInt(cols[stockIdx]) || 0) : 0) } : t));
                      } else {
                        const existingDb = products.find((p: any) => {
                          const pCode = (p.code || '').trim().toLowerCase();
                          const pName = (p.name || '').trim().toLowerCase();
                          return (rowCode !== '' && pCode === rowCode) || pName === name.trim().toLowerCase();
                        });
                        if (existingDb) {
                          const addStk = stockIdx >= 0 ? Math.max(0, parseInt(cols[stockIdx]) || 0) : 0;
                          const newStk = (existingDb.stock || 0) + addStk;
                          api.updateProduct(existingDb.id, { ...existingDb, stock: newStk }).catch(() => {});
                          if (addStk !== 0) api.addStockHistory({ productId: existingDb.id, productName: existingDb.name, type: 'purchase', quantity: addStk, oldStock: existingDb.stock || 0, newStock: newStk, reason: 'CSV import' }).catch(() => {});
                          stockUpdated.push(`${existingDb.name} +${addStk}`);
                        } else {
                          imported.push({ id: genId(), name, code: codeIdx >= 0 ? cols[codeIdx] : '', cat: catIdx >= 0 ? cols[catIdx] : '', costPrice: costIdx >= 0 ? Math.max(0, parseFloat(cols[costIdx]) || 0) : 0, sellPrice: sellIdx >= 0 ? Math.max(0, parseFloat(cols[sellIdx]) || 0) : 0, stock: stockIdx >= 0 ? Math.max(0, parseInt(cols[stockIdx]) || 0) : 0, unit: unitIdx >= 0 ? cols[unitIdx] || 'pcs' : 'pcs', company: companyName, minStock: minStockIdx >= 0 ? Math.max(0, parseInt(cols[minStockIdx]) || 5) : 5, supplierId, vat: vatIdx >= 0 ? parseFloat(cols[vatIdx]) || 0 : 0, expiryDate: expiryIdx >= 0 && cols[expiryIdx] ? cols[expiryIdx] : '', _temp: true }); } } } if (imported.length > 0) { setTempProducts((prev: any[]) => [...prev, ...imported]); } const msg = []; if (imported.length > 0) msg.push(`${imported.length} ${t('products')} imported!`); if (stockUpdated.length > 0) msg.push(`Stock updated:\n${stockUpdated.join('\n')}`); if (errors.length > 0) msg.push(`${errors.length} errors:\n${errors.join('\n')}`); if (msg.length) alert(msg.join('\n\n')); }; reader.readAsText(file); e.target.value = ''; }} />
                <button title="CSV Upload" onClick={() => document.getElementById('csv-upload-input')?.click()} style={{ ...btn('ghost', 'sm') }}>
                  <i className="fas fa-file-csv" style={{ marginRight: 4 }}></i> CSV
                </button>
                <button title="Demo CSV" onClick={() => { const headers = ['Name', 'Code', 'Category', 'CostPrice', 'SellPrice', 'Stock', 'MinStock', 'VAT', 'Unit', 'Company', 'ExpiryDate']; const demo = [headers.join(','), 'Rice Basmati,1001,Groceries,80,120,50,5,15,kg,ABC Traders,2027-06-30', 'Samsung Galaxy S24,2001,Electronics,45000,55000,10,2,12,pcs,Mobile World,2028-12-31', 'Notebook A4,3001,Stationery,25,40,200,10,5,pcs,Paper House,'].join('\n'); const blob = new Blob([demo], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'products_template.csv'; a.click(); URL.revokeObjectURL(url); }} style={{ ...btn('ghost', 'sm') }}>
                  <i className="fas fa-download" style={{ marginRight: 4 }}></i> {t('demoCsv')}
                </button>
                <button onClick={handleClearTempProducts} disabled={tempProducts.length === 0} style={{ ...btn('ghost', 'sm'), opacity: tempProducts.length ? 1 : 0.5 }}>
                  <i className="fas fa-trash-can" style={{ marginRight: 4 }}></i> {t('clear')}
                </button>
                <button onClick={handlePostTempProducts} disabled={tempProducts.length === 0 || isPosting} style={{ ...btn('primary', 'sm'), opacity: tempProducts.length && !isPosting ? 1 : 0.5 }}>
                  <i className={isPosting ? 'fas fa-spinner fa-spin' : 'fas fa-paper-plane'} style={{ marginRight: 4 }}></i> {isPosting ? t('posting') : t('post')}
                </button>
              </div>
            </div>

            {/* Page scroll area — Product View style */}
            <div style={{ flex: 1, overflow: 'auto' }}>
              {/* Gradient Header */}
              <div style={{ background: `linear-gradient(135deg, ${T.teal} 0%, ${T.tealDark || '#0F766E'} 100%)`, padding: '28px 24px 24px', color: T.white }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, width: '100%' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid rgba(255,255,255,0.35)', flexShrink: 0 }}>
                        <i className="fas fa-plus" style={{ fontSize: 26 }}></i>
                      </div>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2 }}>
                          {productForm.name || t('newProduct')}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
                          {productForm.code && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                              <i className="fas fa-barcode" style={{ marginRight: 4 }}></i>{productForm.code}
                            </span>
                          )}
                          {productForm.cat && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13 }}>
                              <i className="fas fa-folder" style={{ marginRight: 4 }}></i>{productForm.cat}
                            </span>
                          )}
                          {productForm.company && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', fontWeight: 700, fontSize: 13 }}>
                              <i className="fas fa-building" style={{ marginRight: 4 }}></i>{productForm.company}
                            </span>
                          )}
                          {(() => {
                            const listQty = tempProducts.reduce((s: number, it: any) => s + (it.stock || 0), 0);
                            const listMin = tempProducts.reduce((s: number, it: any) => s + (it.minStock || 0), 0);
                            const useList = tempProducts.length > 0;
                            const qty = useList ? listQty : (productForm.stock || 0);
                            const min = useList ? listMin : (productForm.minStock || 0);
                            return (
                              <span style={{ padding: '3px 10px', borderRadius: 12, background: qty <= 0 ? '#DC2626' : qty <= min ? '#D97706' : '#16A34A', fontWeight: 700, fontSize: 13 }}>
                                {qty <= 0 ? t('outOfStock') : qty <= min ? t('lowStock') : t('inStock')}
                              </span>
                            );
                          })()}
                          {productForm.foc && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: '#D97706', fontWeight: 700, fontSize: 13 }}>
                              <i className="fas fa-gift" style={{ marginRight: 4 }}></i>{t('foc')}
                            </span>
                          )}
                          {productForm.expiryDate && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: '#E11D48', fontWeight: 700, fontSize: 13 }}>
                              <i className="fas fa-calendar" style={{ marginRight: 4 }}></i>{productForm.expiryDate}
                            </span>
                          )}
                          {productForm.name && products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) && (
                            <span style={{ padding: '3px 10px', borderRadius: 12, background: '#F59E0B', fontWeight: 700, fontSize: 13, color: '#78350F' }}>
                              <i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{t('duplicateName')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 800 }}>{_settings?.currencySymbol} {tempProducts.length > 0 ? tempProducts.reduce((s: number, it: any) => s + (it.sellPrice || 0) * (it.stock || 0), 0).toLocaleString() : (productForm.sellPrice || 0)}</div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{tempProducts.length > 0 ? t('productList') : t('sellPrice')}</div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 40px' }}>
                {/* Stat cards */}
                {(() => {
                  const listCost = tempProducts.reduce((s: number, it: any) => s + (it.costPrice || 0) * ((it.paidQty != null ? it.paidQty : it.stock) || 0), 0);
                  const listValue = tempProducts.reduce((s: number, it: any) => s + (it.sellPrice || 0) * (it.stock || 0), 0);
                  const profit = listValue - listCost;
                  const cp = listCost;
                  const marginPct = cp > 0 ? Math.round(profit / cp * 100) : 0;
                  const stockValue = listCost;
                  const filled = (productForm.name ? 1 : 0)
                    + ((productForm.sellPrice || 0) > 0 ? 1 : 0)
                    + (productForm.code ? 1 : 0)
                    + (productForm.cat ? 1 : 0)
                    + ((productForm.costPrice || 0) > 0 ? 1 : 0)
                    + (productForm.expiryDate ? 1 : 0);
                  const formProgress = Math.round((filled / 6) * 100);
                  const listFilled = tempProducts.reduce((s: number, it: any) => s + ((it.name ? 1 : 0)
                    + ((it.sellPrice || 0) > 0 ? 1 : 0)
                    + (it.code ? 1 : 0)
                    + (it.cat ? 1 : 0)
                    + ((it.costPrice || 0) > 0 ? 1 : 0)
                    + ((it.stock || 0) > 0 ? 1 : 0)), 0);
                  const progress = tempProducts.length > 0
                    ? Math.round((listFilled / (tempProducts.length * 6)) * 100)
                    : formProgress;
                  const stats = [
                    { label: t('formProgress'), value: `${progress}%`, icon: 'fas fa-list-check', color: progress >= 100 ? '#16A34A' : '#D97706', bg: progress >= 100 ? '#DCFCE7' : '#FEF3C7' },
                    { label: t('profit'), value: `${_settings?.currencySymbol} ${profit}`, icon: 'fas fa-arrow-trend-up', color: profit > 0 ? '#16A34A' : profit < 0 ? '#DC2626' : T.gray500, bg: profit > 0 ? '#DCFCE7' : profit < 0 ? T.redLight : T.gray100 },
                    { label: `${t('profit')} %`, value: `${cp === 0 && profit > 0 ? '∞' : marginPct}%`, icon: 'fas fa-percent', color: marginPct > 0 ? '#16A34A' : T.gray500, bg: marginPct > 0 ? '#DCFCE7' : T.gray100 },
                    { label: t('stockValue'), value: `${_settings?.currencySymbol} ${stockValue.toLocaleString()}`, icon: 'fas fa-boxes-stacked', color: T.teal, bg: T.tealLight },
                    { label: `${t('productList')} (${tempProducts.length})`, value: `${_settings?.currencySymbol} ${listValue.toLocaleString()}`, icon: 'fas fa-cart-shopping', color: '#7C3AED', bg: '#EDE9FE' },
                    { label: t('totalQuantity') || 'Total Qty', value: `${tempProducts.reduce((s: number, it: any) => s + (it.stock || 0), 0)}`, icon: 'fas fa-cubes', color: '#0369A1', bg: '#E0F2FE' },
                  ];
                  return (
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
                  );
                })()}

                {/* Two-column: Form | Preview+List — Product View grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginBottom: 22 }}>
                  {/* LEFT: Form sections (Basic + Pricing + Inventory) */}
                  <div>
                {/* All form fields in one 3-column grid */}
                    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.gray100}`, fontWeight: 700, fontSize: 14, color: T.teal, background: T.tealLight }}>
                        <i className="fas fa-circle-info" style={{ marginRight: 6 }}></i>{t('basicInfo')} · {t('pricingInfo')} · {t('inventoryInfo')}
                      </div>
                      <div style={{ padding: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                 {/* Supplier */}
                 <div style={{ marginBottom: 12 }}>
                   <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('suppliers')}</label>
                   <div style={{ position: 'relative' }}>
                     <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-building" style={{ fontSize: 13 }}></i></div>
                     <input value={productForm.company || productForm.supplierId} onChange={e => { const val = e.target.value; const found = suppliers.find((s: any) => s.id === val || s.name.toLowerCase() === val.toLowerCase()); if (found) { setProductForm({ ...productForm, supplierId: found.id, company: found.name }); } else { setProductForm({ ...productForm, supplierId: '', company: val }); } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.company ? '#F0F9FF' : T.gray50, borderColor: productForm.company ? '#0369A1' : T.gray200, height: 40 }} placeholder={`${t('enterToSearch')}...`} />
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
                      <input type="date" value={productForm.expiryDate || ''} onChange={e => setProductForm({ ...productForm, expiryDate: e.target.value })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.expiryDate ? '#FFF1F2' : T.gray50, borderColor: productForm.expiryDate ? '#E11D48' : T.gray200, height: 40 }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('productName')} *</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-tag" style={{ fontSize: 13 }}></i></div>
                      <input value={productForm.name} onChange={e => { const val = e.target.value; setProductForm({ ...productForm, name: val }); }} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddToTempList(); } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 32, background: productForm.name && products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) ? '#F0FDFA' : T.gray50, borderColor: productForm.name && products.some((p: any) => (p.name || '').toLowerCase() === productForm.name.toLowerCase()) ? T.teal : T.gray200, height: 40 }} placeholder={`${t('productName')}...`} />
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
                      <input value={productForm.code} onChange={e => { const val = e.target.value; setProductForm({ ...productForm, code: val }); }} onKeyDown={e => { if (e.key === 'Enter') { const found = products.find((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()); if (found) { setProductForm({ ...productForm, name: found.name, code: found.code || '', cat: found.cat || '', unit: found.unit || 'pcs', costPrice: found.costPrice, sellPrice: found.sellPrice, stock: 0, paidQty: 0, freeQty: 0, minStock: found.minStock || 5, company: found.company || '', supplierId: found.supplierId || '', vat: found.vat || 0 }); } } }} style={{ ...inputStyle, fontSize: 13, paddingLeft: 30, background: productForm.code && products.some((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()) ? '#F0FDFA' : T.gray50, borderColor: productForm.code && products.some((p: any) => (p.code || '').toLowerCase() === productForm.code.toLowerCase()) ? T.teal : T.gray200, height: 40 }} placeholder="0000000000000" />
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
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('purchasePrice')} ({_settings?.currencySymbol})</label>
                    <input type="number" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={{ ...inputStyle, fontSize: 14, fontWeight: 600, height: 38, color: '#15803D' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('sellPrice')} ({_settings?.currencySymbol})</label>
                    <input type="number" value={productForm.sellPrice} onChange={e => setProductForm({ ...productForm, sellPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={{ ...inputStyle, fontSize: 14, fontWeight: 600, height: 38, color: '#B91C1C' }} />
                  </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('paidQty')}</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-cubes" style={{ fontSize: 11 }}></i></div>
                          <input type="number" value={productForm.paidQty} onChange={e => { const v = Math.max(0, parseInt(e.target.value) || 0); setProductForm({ ...productForm, paidQty: v, stock: v + (productForm.freeQty || 0) }); }} min={0} style={{ ...inputStyle, fontSize: 13, paddingLeft: 28, height: 38 }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('freeQty')}</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#B45309' }}><i className="fas fa-gift" style={{ fontSize: 11 }}></i></div>
                          <input type="number" value={productForm.freeQty} onChange={e => { const v = Math.max(0, parseInt(e.target.value) || 0); setProductForm({ ...productForm, freeQty: v, stock: (productForm.paidQty || 0) + v }); }} min={0} style={{ ...inputStyle, fontSize: 13, paddingLeft: 28, height: 38, background: productForm.freeQty > 0 ? '#FFFBEB' : undefined, borderColor: productForm.freeQty > 0 ? '#FCD34D' : undefined }} />
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('minStock')}</label>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }}><i className="fas fa-layer-group" style={{ fontSize: 11 }}></i></div>
                          <input type="number" value={productForm.minStock} onChange={e => setProductForm({ ...productForm, minStock: e.target.value === '' ? 5 : (Number.isNaN(parseInt(e.target.value, 10)) ? 5 : Math.max(0, parseInt(e.target.value, 10))) })} style={{ ...inputStyle, fontSize: 13, paddingLeft: 28, height: 38 }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex' }}>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: productForm.foc ? '#B45309' : T.gray600, background: productForm.foc ? '#FEF3C7' : T.gray100, border: `1px solid ${productForm.foc ? '#FCD34D' : T.gray200}`, borderRadius: 8, padding: '10px 14px', minHeight: 38, boxSizing: 'border-box', width: '100%' }}>
                          <input type="checkbox" checked={!!productForm.foc} onChange={e => setProductForm({ ...productForm, foc: e.target.checked })} style={{ accentColor: '#D97706' }} />
                          <i className="fas fa-gift" style={{ fontSize: 12 }}></i>
                          {t('foc')}
                        </label>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: '#15803D', background: '#F0FDF4', border: `1px solid #BBF7D0`, borderRadius: 8, padding: '8px 12px', minHeight: 38, boxSizing: 'border-box', justifyContent: 'center' }}>
                        {t('salesPriceWithVat')}: {_settings?.currencySymbol} {((productForm.sellPrice || 0) + ((productForm.sellPrice || 0) * (productForm.vat || _settings?.vatPercent || 0) / 100)).toFixed(2)}
                      </div>
                    {(() => {
                      const stock = productForm.stock || 0;
                      const min = productForm.minStock || 0;
                      if (stock <= 0) return (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: T.redLight, color: T.red, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38, boxSizing: 'border-box' }}>
                          <i className="fas fa-circle-xmark" style={{ marginRight: 4 }}></i>{t('outOfStock')}
                        </div>
                      );
                      if (stock <= min) return (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#FEF3C7', color: '#B45309', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38, boxSizing: 'border-box' }}>
                          <i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{t('lowStock')}
                        </div>
                      );
                      return (
                        <div style={{ padding: '8px 12px', borderRadius: 8, background: '#DCFCE7', color: '#15803D', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 38, boxSizing: 'border-box' }}>
                          <i className="fas fa-circle-check" style={{ marginRight: 4 }}></i>{t('inStock')}
                        </div>
                      );
                    })()}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('profit')} ({_settings?.currencySymbol})</label>
                    {(() => {
                      const profit = (productForm.sellPrice || 0) - (productForm.costPrice || 0);
                      return (
                        <div style={{ flex: 1, minHeight: 38, padding: '0 12px', background: T.gray50, border: `1px solid ${T.gray200}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: profit > 0 ? '#16A34A' : profit < 0 ? '#DC2626' : T.gray400 }}>{_settings?.currencySymbol} {profit}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 6, display: 'block' }}>{t('profit')} (%)</label>
                    {(() => {
                      const profit = (productForm.sellPrice || 0) - (productForm.costPrice || 0);
                      const profitPct = (productForm.costPrice || 0) > 0 ? Math.round(profit / (productForm.costPrice || 1) * 100) : 0;
                      return (
                        <div style={{ flex: 1, minHeight: 38, padding: '0 12px', background: T.gray50, border: `1px solid ${T.gray200}`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: profit > 0 ? '#16A34A' : profit < 0 ? '#DC2626' : T.gray400 }}>{profitPct === 0 && (productForm.costPrice || 0) === 0 && profit > 0 ? '∞' : profitPct}%</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <button onClick={() => setProductForm({ name: '', code: '', company: '', cat: '', unit: 'pcs', costPrice: 0, sellPrice: 0, stock: 0, paidQty: 0, freeQty: 0, foc: false, minStock: 5, supplierId: '', vat: _settings?.vatPercent ?? 0, expiryDate: '' })} style={{ ...btn('ghost'), fontSize: 13, padding: '10px 14px', whiteSpace: 'nowrap' }}><i className="fas fa-eraser" style={{ marginRight: 4 }}></i> {t('clear')}</button>
                    <button onClick={handleAddToTempList} style={{ ...btn('primary'), flex: 1, fontSize: 13, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-plus" style={{ marginRight: 6 }}></i> {t('add')}</button>
                  </div>
                    {(() => {
                      const paid = productForm.paidQty || 0;
                      const free = productForm.freeQty || 0;
                      const unit = productForm.costPrice || 0;
                      const paidTotal = paid * unit;
                      const totalIn = paid + free;
                      const freeVal = free * unit;
                      if (totalIn <= 0) return null;
                      return (
                        <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', border: '1px solid #FCD34D', borderRadius: 10, padding: '10px 12px', marginBottom: 12, gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '1fr 1fr', alignContent: 'center', gap: 8, fontSize: 12 }}>
                          <div><span style={{ color: T.gray500 }}>{t('invoiceTotal') || t('total')}:</span> <strong style={{ color: '#92400E' }}>{_settings?.currencySymbol} {paidTotal.toFixed(2)}</strong> <span style={{ color: T.gray400 }}>({paid} × {unit})</span></div>
                          <div><span style={{ color: T.gray500 }}>{t('totalIn')}:</span> <strong style={{ color: T.teal }}>{totalIn}</strong></div>
                          <div><span style={{ color: T.gray500 }}>{t('stockPrice') || t('purchasePrice')}:</span> <strong style={{ color: '#15803D' }}>{_settings?.currencySymbol} {unit.toFixed(2)}</strong></div>
                          <div><span style={{ color: T.gray500 }}>{t('freeValue')}:</span> <strong style={{ color: '#B45309' }}>{_settings?.currencySymbol} {freeVal.toFixed(2)}</strong> {free > 0 ? `(+${free})` : ''}</div>
                        </div>
                      );
                    })()}
                </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Live Preview + Product List + CSV + History */}
                  <div>
                    {/* Product List Cart */}
                    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.gray200}`, overflow: 'hidden', marginBottom: 16 }}>
                      <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #0F766E 0%, #115E59 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-list-check" style={{ color: '#fff', fontSize: 14 }}></i>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t('productList')}</span>
                        </div>
                        
                      </div>
                      <div style={{ maxHeight: 320, overflow: 'auto', background: T.gray50 }}>
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
                                  <div style={{ fontSize: 11, color: T.gray500 }}>x{item.stock}{(item.freeQty || 0) > 0 ? ` (+${item.freeQty} ${t('freeQty')})` : ''}</div>
                                </div>
                                <button onClick={() => handleRemoveTempProduct(item.id)} style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: T.redLight, color: T.red, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}><i className="fas fa-xmark"></i></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {tempProducts.length > 0 && (
                        <div style={{ borderTop: `1px solid ${T.gray200}`, padding: '12px 16px', background: T.white }}>
                          {(() => {
                            const totalQty = tempProducts.reduce((s: number, it: any) => s + (it.stock || 0), 0);
                            const totalCost = tempProducts.reduce((s: number, it: any) => s + (it.costPrice || 0) * (it.stock || 0), 0);
                            const totalSell = tempProducts.reduce((s: number, it: any) => s + (it.sellPrice || 0) * (it.stock || 0), 0);
                            const totalProfit = totalSell - totalCost;
                            return (
                              <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.gray500 }}>
                                  <span>{t('totalQuantity') || 'Total Qty'}</span>
                                  <strong style={{ color: T.gray800 }}>{totalQty}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.gray500 }}>
                                  <span>{t('purchasePrice')}</span>
                                  <strong style={{ color: '#15803D' }}>{_settings?.currencySymbol} {totalCost.toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: T.gray500 }}>
                                  <span>{t('totalValue')}</span>
                                  <strong style={{ color: T.teal }}>{_settings?.currencySymbol} {totalSell.toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: `1px dashed ${T.gray200}` }}>
                                  <span style={{ fontWeight: 700, color: T.gray600 }}>{t('potentialProfit')}</span>
                                  <strong style={{ color: totalProfit >= 0 ? '#16A34A' : '#DC2626', fontSize: 14 }}>{_settings?.currencySymbol} {totalProfit.toLocaleString()}</strong>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!viewProduct && productTab === 'suppliers' && renderSupplier()}











        {!viewProduct && productTab === 'categories' && renderCategory()}











        {!viewProduct && productTab === 'barcode' && renderBarcode()}











        {!viewProduct && productTab === 'stock' && renderStock()}

        {!viewProduct && productTab === 'priceHistory' && renderPriceHistory()}

        

        {!viewProduct && productTab === 'purchaseHistory' && renderPurchaseHistory()}











      </div>























      {barcodePopup && (
        <div style={overlay} onClick={() => setBarcodePopup(null)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 440, maxWidth: '92vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 6px', color: T.teal }}><i className="fas fa-barcode" style={{marginRight: 6}}></i>{t('barcode')}</h3>
            <div style={{ fontSize: 14, color: T.gray600, marginBottom: 4, fontWeight: 600 }}>{barcodePopup.name}</div>
            <div style={{ fontSize: 13, color: T.gray400, marginBottom: 14 }}>{barcodePopup.stock ?? 0} {t('inStock') || 'in stock'} {barcodePopup.unit ? barcodePopup.unit : ''}</div>
            {moduleSmall(codeOf(barcodePopup), labelSize, labelPaper) && (
              <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 600, color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 10px' }}>
                <i className="fas fa-triangle-exclamation" style={{ marginRight: 4 }}></i>{t(labelPaper === 'a4' ? 'barcodeTooSmallA4' : 'barcodeTooSmall')}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button onClick={() => printAllStockBarcodes(barcodePopup)} style={{ ...btn('primary'), width: '100%', justifyContent: 'center', textAlign: 'center', padding: '14px 16px', flexDirection: 'column', display: 'flex', gap: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}><i className="fas fa-boxes-stacked" style={{marginRight: 6}}></i>{t('allStockBarcode') || 'All Stock Barcode'}</span>
                <span style={{ fontSize: 12, opacity: 0.9, fontWeight: 400 }}>{t('allStockBarcodeHint') || 'Print barcode label for stock'}</span>
              </button>
              <button onClick={() => printManualCountBarcode(barcodePopup)} style={{ ...btn('ghost'), width: '100%', justifyContent: 'center', textAlign: 'center', padding: '14px 16px', flexDirection: 'column', display: 'flex', gap: 4, borderColor: T.teal, color: T.teal }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}><i className="fas fa-clipboard-list" style={{marginRight: 6}}></i>{t('manualCountBarcode') || 'Manual Count Barcode'}</span>
                <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 400 }}>{t('manualCountBarcodeHint') || 'Print count sheet with barcode'}</span>
              </button>
              <button onClick={() => setBarcodePopup(null)} style={{ ...btn('ghost'), width: '100%', justifyContent: 'center', textAlign: 'center' }}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {editProduct && (
        <div style={overlay} onClick={() => setEditProduct(null)}>











          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 400, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>











            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-pen" style={{marginRight: 4}}></i> {t('editProduct')}</h3>











            <div style={{ marginBottom: 12 }}><div style={{ fontWeight: 600, fontSize: 15 }}>{editProduct.name}</div><div style={{ fontSize: 13, color: T.gray400 }}>{editProduct.company} - {editProduct.cat || '-'}</div></div>











            <div style={{ marginBottom: 12 }}><label style={labelStyle}>{t('purchasePrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editProduct.costPrice} onChange={e => setEditProduct({ ...editProduct, costPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={inputStyle} /></div>











            <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t('sellPrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={editProduct.sellPrice} onChange={e => setEditProduct({ ...editProduct, sellPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={inputStyle} /></div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: editProduct.foc ? '#B45309' : T.gray600, background: editProduct.foc ? '#FEF3C7' : T.gray100, border: `1px solid ${editProduct.foc ? '#FCD34D' : T.gray200}`, borderRadius: 8, padding: '10px 14px' }}>
                <input type="checkbox" checked={!!editProduct.foc} onChange={e => setEditProduct({ ...editProduct, foc: e.target.checked })} style={{ accentColor: '#D97706' }} />
                <i className="fas fa-gift" style={{ fontSize: 12 }}></i>
                {t('foc')}
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}><button onClick={() => setEditProduct(null)} style={{ ...btn('ghost'), flex: 1, justifyContent: 'center', textAlign: 'center' }}>{t('cancel')}</button><button onClick={handleEditProduct} style={{ ...btn('primary'), flex: 2, justifyContent: 'center', textAlign: 'center' }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('saveChanges')}</button></div>











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











                const totalCost = (p.items || []).reduce((s: number, i: any) => { const paid = i.paidQty != null ? i.paidQty : (i.stock || 0); return s + paid * (i.unitCost != null ? i.unitCost : (i.costPrice || 0)); }, 0);











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











              <div><label style={labelStyle}>{t('minStock')}</label><input type="number" value={productForm.minStock} onChange={e => setProductForm({ ...productForm, minStock: e.target.value === '' ? 5 : (Number.isNaN(parseInt(e.target.value, 10)) ? 5 : Math.max(0, parseInt(e.target.value, 10))) })} style={inputStyle} /></div>











              <div><label style={labelStyle}>{t('purchasePrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={inputStyle} /></div>











              <div><label style={labelStyle}>{t('sellPrice')} ({_settings?.currencySymbol || '৳'})</label><input type="number" value={productForm.sellPrice} onChange={e => setProductForm({ ...productForm, sellPrice: Math.max(0, parseFloat(e.target.value) || 0) })} style={inputStyle} /></div>











              











            </div>











            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'center' }}>











              <button onClick={() => setShowAddProductModal(false)} style={{ ...btn('ghost'), flex: 1 }}>{t('cancel')}</button>











              <button onClick={handleAddProduct} style={{ ...btn('primary'), flex: 2 }}><i className="fas fa-floppy-disk" style={{marginRight: 4}}></i> {t('save')}</button>











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











                <div key={p.id} onClick={() => { setViewProduct(p); setViewCategory(null); }} style={{ padding: '8px 12px', borderBottom: `1px solid ${T.gray100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>











                  <div><div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: T.gray400 }}>{codeOf(p) || '-'}</div></div>











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

      {showDeleteHistory && (
        <div style={overlay} onClick={() => setShowDeleteHistory(false)}>
          <div style={{ background: T.white, borderRadius: 12, padding: 24, width: 540, maxWidth: '90vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: T.teal }}><i className="fas fa-trash" style={{marginRight: 4}}></i> {t('deleteHistory')}</h3>
            <div style={{ maxHeight: 380, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deletedProducts.length === 0 ? (
                <p style={{ textAlign: 'center', color: T.gray400, padding: '28px 8px' }}>{t('noDeleteHistory')}</p>
              ) : deletedProducts.map((d: any, i: number) => (
                <div key={d.id || i} style={{ padding: '10px 12px', background: T.redLight, borderRadius: 10, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.gray900 }}>{d.name || '-'}</div>
                    <div style={{ fontSize: 12, color: T.gray500, fontFamily: 'monospace' }}>{d.code || '-'}</div>
                    <div style={{ fontSize: 12, color: T.gray500 }}>{d.company || '-'} · {d.cat || '-'}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: T.red }}>{fmtN(d.stock)} {d.unit || ''}</div>
                    <div style={{ fontSize: 13, color: T.gray600 }}>{fmt(d.sell_price)}</div>
                    <div style={{ fontSize: 11, color: T.gray400 }}>{d.deleted_at ? new Date(d.deleted_at).toLocaleString() : '-'}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => { if (deletedProducts.length === 0) return; if (!window.confirm(t('clearDeleteHistoryConfirm'))) return; api.clearDeletedProducts().then(() => setDeletedProducts([])).catch(() => alert(t('failed'))); }} style={{ ...btn('ghost'), flex: 1, opacity: deletedProducts.length === 0 ? 0.5 : 1 }}><i className="fas fa-broom" style={{ marginRight: 4 }}></i>{t('clear')}</button>
              <button onClick={() => setShowDeleteHistory(false)} style={{ ...btn(), flex: 1 }}>{t('close')}</button>
            </div>
          </div>
        </div>
      )}











    </div>











  );











}











