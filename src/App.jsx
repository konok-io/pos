import { useState, useEffect, useRef } from "react";

/* ─────────────── GLOBAL CSS RESET ─────────────── */
const GlobalStyle = () => {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
  }, []);
  return null;
};

/* ─────────────── UTILITIES ─────────────── */
const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
const fmt = (n) => `৳${(+n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtN = (n) => (+n||0).toLocaleString('en-IN');
const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

/* ─────────────── STORAGE ─────────────── */
const db = {
  get(k) {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) { console.error(e); }
  },
  clear() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  }
};

/* ─────────────── STORAGE KEYS ─────────────── */
const STORAGE_KEYS = {
  products: 'pos_products',
  customers: 'pos_customers',
  sales: 'pos_sales',
  settings: 'pos_settings',
  suppliers: 'pos_suppliers',
  categories: 'pos_categories',
  purchases: 'pos_purchases',
};

/* ─────────────── DEMO DATA ─────────────── */
const DEMO = {
  products: [],
  customers: [],
  suppliers: [],
  categories: [],
};

/* ─────────────── DESIGN TOKENS ─────────────── */
const T = {
  teal:'#0F766E', tealDark:'#115E59', tealLight:'#F0FDFA', tealMid:'#CCFBF1',
  orange:'#EA580C', orangeLight:'#FFF7ED',
  green:'#16A34A', greenLight:'#F0FDF4',
  red:'#DC2626', redLight:'#FEF2F2',
  amber:'#D97706', amberLight:'#FFFBEB',
  gray50:'#F9FAFB', gray100:'#F3F4F6', gray200:'#E5E7EB',
  gray400:'#9CA3AF', gray600:'#4B5563', gray800:'#1F2937', gray900:'#111827',
  white:'#FFFFFF',
};

const btn = (type='default',size='md') => {
  const bg = {primary:T.teal,sell:T.orange,success:T.green,danger:T.red,ghost:'transparent',default:T.gray100}[type];
  const color = ['primary','sell','success','danger'].includes(type) ? T.white : type==='ghost' ? T.gray600 : T.gray800;
  const border = type==='ghost' ? `1px solid ${T.gray200}` : 'none';
  return {
    padding: size==='sm' ? '5px 10px' : size==='lg' ? '12px 24px' : '8px 14px',
    fontSize: size==='sm' ? 12 : size==='lg' ? 15 : 13,
    background: bg, color, border,
    borderRadius:7, cursor:'pointer', fontWeight:600,
    display:'inline-flex', alignItems:'center', gap:5,
    transition:'all 0.15s',
  };
};
const input = {
  padding:'8px 12px', border:`1px solid ${T.gray200}`, borderRadius:7,
  fontSize:14, outline:'none', width:'100%', boxSizing:'border-box',
  fontFamily:'inherit', background:T.white, color:T.gray900,
  transition:'border-color 0.15s',
};
const card = {
  background:T.white, borderRadius:10, padding:16,
  boxShadow:'0 1px 4px rgba(0,0,0,0.08)', border:`1px solid ${T.gray200}`,
};
const label = { fontSize:11, fontWeight:700, color:T.gray400, marginBottom:4, display:'block', textTransform:'uppercase', letterSpacing:'0.5px' };

/* ─────────────── MODAL WRAPPER ─────────────── */
function Modal({onClose, title, children, width=460}) {
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
      <div style={{...card,width,maxWidth:'100%',maxHeight:'90vh',overflow:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
          <h3 style={{margin:0,fontSize:16,color:T.gray900}}>{title}</h3>
          <button onClick={onClose} style={{...btn('ghost','sm'),padding:'4px 8px',fontSize:16}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─────────────── MAIN APP ─────────────── */
export default function App() {
  const [tab, setTab] = useState('pos');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [settings, setSettings] = useState({name:'',address:'',phone:'',vatEnabled:true,vatPercent:15});
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check if reset was done - flag stays forever to prevent DEMO loading
    const wasReset = db.get('pos_reset_done');
    
    // Load from localStorage
    const savedProducts = db.get(STORAGE_KEYS.products);
    const savedCustomers = db.get(STORAGE_KEYS.customers);
    const savedSales = db.get(STORAGE_KEYS.sales);
    const savedSettings = db.get(STORAGE_KEYS.settings);
    const savedSuppliers = db.get(STORAGE_KEYS.suppliers) || [];
    const savedPurchases = db.get(STORAGE_KEYS.purchases) || [];
    const savedCategories = db.get(STORAGE_KEYS.categories) || [];

    // If reset was done, always use empty data (never load DEMO)
    if (wasReset) {
      setProducts(savedProducts || []);
      setCustomers(savedCustomers || []);
      setCategories(savedCategories);
      setSuppliers(savedSuppliers);
      setSales(savedSales || []);
      setPurchases(savedPurchases);
      setSettings(savedSettings ? {...{name:'',address:'',phone:'',vatEnabled:true,vatPercent:15}, ...savedSettings} : {name:'',address:'',phone:'',vatEnabled:true,vatPercent:15});
      setReady(true);
      return;
    }

    // If no data exists and not reset, load DEMO data
    if (!savedProducts || savedProducts.length === 0) {
      setProducts(DEMO.products);
      db.set(STORAGE_KEYS.products, DEMO.products);
    } else {
      setProducts(savedProducts);
    }

    if (!savedCustomers || savedCustomers.length === 0) {
      setCustomers(DEMO.customers);
      db.set(STORAGE_KEYS.customers, DEMO.customers);
    } else {
      setCustomers(savedCustomers);
    }

    setSales(savedSales || []);
    setSuppliers(savedSuppliers);
    setPurchases(savedPurchases);

    // Migrate old category products to new categories state
    if (savedCategories && savedCategories.length > 0) {
      setCategories(savedCategories);
    } else if (savedProducts) {
      const oldCategories = savedProducts
        .filter(p => p.name?.includes('(ক্যাটাগরি)'))
        .map(p => ({ id: p.id, name: p.cat, company: p.company }));
      if (oldCategories.length > 0) {
        setCategories(oldCategories);
        db.set(STORAGE_KEYS.categories, oldCategories);
        // Remove old category products from products
        const realProducts = savedProducts.filter(p => !p.name?.includes('(ক্যাটাগরি)'));
        setProducts(realProducts);
        db.set(STORAGE_KEYS.products, realProducts);
      } else {
        setCategories([]);
      }
    } else {
      setCategories([]);
    }

    const defaultSettings = {name:'',address:'',phone:'',vatEnabled:true,vatPercent:15};
    setSettings(savedSettings ? {...defaultSettings, ...savedSettings} : defaultSettings);

    setReady(true);
  }, []);

  const upd = {
    products: v => { setProducts(v); db.set(STORAGE_KEYS.products, v); return Promise.resolve(); },
    customers: v => { setCustomers(v); db.set(STORAGE_KEYS.customers, v); return Promise.resolve(); },
    sales: v => { setSales(v); db.set(STORAGE_KEYS.sales, v); return Promise.resolve(); },
    settings: v => { setSettings(v); db.set(STORAGE_KEYS.settings, v); return Promise.resolve(); },
    suppliers: v => { setSuppliers(v); db.set(STORAGE_KEYS.suppliers, v); return Promise.resolve(); },
    categories: v => { setCategories(v); db.set(STORAGE_KEYS.categories, v); return Promise.resolve(); },
    purchases: v => { setPurchases(v); db.set(STORAGE_KEYS.purchases, v); return Promise.resolve(); },
  };

  if (!ready) return (
    <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:14,background:T.tealLight}}>
      <div style={{width:56,height:56,background:T.teal,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:28}}>🏪</div>
      <div style={{color:T.teal,fontWeight:700,fontSize:18}}>POS লোড হচ্ছে...</div>
      <div style={{color:T.gray400,fontSize:13}}>আপনার ডেটা প্রস্তুত করা হচ্ছে</div>
    </div>
  );

  const tabs = [
    {id:'pos',icon:'🛒',label:'বিক্রয়'},
    {id:'products',icon:'📦',label:'সকল পণ্য'},
    {id:'suppliers',icon:'🏢',label:'কোম্পানি ম্যানেজমেন্ট'},
    {id:'customers',icon:'👥',label:'কাস্টমার'},
    {id:'inventory',icon:'🏭',label:'স্টক'},
    {id:'reports',icon:'📊',label:'রিপোর্ট'},
    {id:'settings',icon:'⚙️',label:'সেটিংস'},
  ];

  const props = {products, customers, sales, settings, suppliers, categories, purchases, upd};

  return (
    <>
      <GlobalStyle />
      <div style={{display:'flex',flexDirection:'column',height:'100vh',width:'100%',background:T.gray50,fontFamily:'BanglaFont, "Segoe UI", system-ui, sans-serif',color:T.gray900,overflow:'hidden'}}>
      {/* Header */}
      <div style={{background:T.tealDark,color:T.white,padding:'0 20px',height:56,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 2px 8px rgba(0,0,0,0.15)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,background:'rgba(255,255,255,0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏪</div>
          <div>
            <div style={{fontWeight:700,fontSize:16,lineHeight:1.2}}>{settings.name}</div>
            <div style={{fontSize:11,opacity:0.7}}>POS ম্যানেজমেন্ট সিস্টেম</div>
          </div>
        </div>
        <div style={{fontSize:12,opacity:0.8,textAlign:'right'}}>
          <div>{new Date().toLocaleDateString('en-GB',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</div>
          <div>{new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}</div>
        </div>
      </div>

      {/* Nav Tabs */}
      <div style={{display:'flex',background:T.white,borderBottom:`1px solid ${T.gray200}`,padding:'0 12px',flexShrink:0,overflowX:'auto',boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'12px 16px', border:'none', background:'none', cursor:'pointer',
            borderBottom: tab===t.id ? `3px solid ${T.teal}` : '3px solid transparent',
            color: tab===t.id ? T.teal : T.gray500,
            fontWeight: tab===t.id ? 700 : 500,
            fontSize:14, display:'flex', alignItems:'center', gap:6,
            whiteSpace:'nowrap', fontFamily:'inherit',
            transition:'all 0.2s',
          }}>
            <span style={{fontSize:15}}>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflow:'hidden',width:'100%'}}>
        {tab==='pos'       && <POSScreen {...props} />}
        {tab==='products'  && <ProductsScreen {...props} />}
        {tab==='suppliers' && <SuppliersScreen {...props} />}
        {tab==='customers' && <CustomersScreen {...props} />}
        {tab==='inventory' && <InventoryScreen {...props} />}
        {tab==='reports'   && <ReportsScreen {...props} />}
        {tab==='settings'  && <SettingsScreen {...props} />}
      </div>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   POS SCREEN
═══════════════════════════════════════════ */
function POSScreen({products, customers, sales, settings, upd}) {
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [selCat, setSelCat] = useState('সব');
  const [selCust, setSelCust] = useState(null);
  const [custQ, setCustQ] = useState('');
  const [showCustDrop, setShowCustDrop] = useState(false);
  const [discount, setDiscount] = useState('');
  const [vatPercent, setVatPercent] = useState(settings.vatPercent || 15);
  const [paid, setPaid] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [showAddCust, setShowAddCust] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddr, setNewCustAddr] = useState('');
  const searchRef = useRef();
  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  useEffect(() => { searchRef.current?.focus(); }, []);

  const cats = ['সব', ...new Set(products.filter(p=>!p.name?.includes('(ক্যাটাগরি)')).map(p=>p.cat).filter(Boolean))];
  const filtered = products.filter(p => {
    const isCategory = p.name?.includes('(ক্যাটাগরি)');
    if (isCategory) return false;
    const matchCat = selCat==='সব' || p.cat===selCat;
    const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode||'').includes(search);
    return matchCat && matchQ;
  });

  const addToCart = (prod) => {
    if (prod.stock<=0) { alert(`"${prod.name}" এর স্টক শেষ!`); return; }
    setCart(prev => {
      const ex = prev.find(i=>i.id===prod.id);
      if (ex) {
        if (ex.qty >= prod.stock) { alert(`সর্বোচ্চ স্টক: ${prod.stock} ${prod.unit}`); return prev; }
        return prev.map(i=>i.id===prod.id ? {...i,qty:i.qty+1} : i);
      }
      return [...prev, {id:prod.id,name:prod.name,sellP:prod.sellP,buyP:prod.buyP,qty:1,unit:prod.unit,maxQ:prod.stock}];
    });
    setSearch('');
    searchRef.current?.focus();
  };

  const updQty = (id, q) => {
    const n = parseInt(q) || 0;
    if (n < 1) { setCart(prev=>prev.filter(i=>i.id!==id)); return; }
    const prod = products.find(p=>p.id===id);
    if (prod && n > prod.stock) { alert(`সর্বোচ্চ স্টক: ${prod.stock}`); return; }
    setCart(prev=>prev.map(i=>i.id===id ? {...i,qty:n} : i));
  };

  const subtotal = cart.reduce((s,i)=>s+i.sellP*i.qty,0);
  const disc = parseFloat(discount)||0;
  const afterDiscount = Math.max(0, subtotal-disc);
  const vatEnabled = settings.vatEnabled !== false;
  const vatRate = vatPercent || 0;
  const vatAmount = vatEnabled ? Math.round(afterDiscount * vatRate / 100) : 0;
  const total = afterDiscount + vatAmount;
  const paidAmt = paid === '' ? 0 : (parseFloat(paid) || 0);
  const due = total - paidAmt;
  const change = paidAmt > total ? paidAmt - total : 0;

  const checkout = () => {
    if (!cart.length) { alert('কার্টে কোনো পণ্য নেই!'); return; }
    if (due > 0 && !selCust) { alert('⚠️ বাকি বিক্রয় করতে গ্রাহক সিলেক্ট করুন অথবা পূর্ণ পরিশোধ করুন!'); return; }

    // Due sale confirmation
    if (due > 0 && selCust) {
      if (!confirm(`⚠️ আপনি কি সত্যিই বাকিতে বিক্রয় করতে চান?\nবাকি: ৳${due.toFixed(0)}\nগ্রাহক: ${selCust.name}\nএই বাকি ${selCust.name} এর হিসাবে যোগ হবে।`)) return;
    }

    // Confirmation dialog
    const dueText = due > 0 ? `\nবাকি: ৳${due.toFixed(0)}` : '';
    const dueCreditText = (selCust && due > 0) ? `\nবাকি ${selCust.name} এর হিসাবে যোগ হবে।` : '';
    const vatText = vatAmount > 0 ? `\nভ্যাট (${vatPercent}%): ৳${vatAmount.toFixed(0)}` : '';
    const confirmMsg = `বিক্রয় নিশ্চিত করুন?\nমোট: ৳${total.toFixed(0)}${vatText}${dueText}${dueCreditText}`;

    if (!window.confirm(confirmMsg)) return;

    const sale = {
      id:genId(), date:now(),
      custId:selCust?.id||null, custName:selCust?.name||'সাধারণ ক্রেতা',
      items:cart.map(i=>({...i,total:i.sellP*i.qty,profit:(i.sellP-i.buyP)*i.qty})),
      subtotal, discount:disc, vatPercent, vatAmount, total,
      paid:paidAmt, due:Math.max(0,due), change,
    };

    const newProds = products.map(p => {
      const ci = cart.find(i=>i.id===p.id);
      return ci ? {...p,stock:p.stock-ci.qty} : p;
    });

    let newCusts = [...customers];
    if (selCust && due > 0) {
      newCusts = newCusts.map(c=>c.id===selCust.id ? {...c,credit:(c.credit||0)+due} : c);
    }

    const newSales = [...sales, sale];

    upd.products(newProds);
    upd.customers(newCusts);
    upd.sales(newSales);

    setReceipt({sale, settings});
    setCart([]); setDiscount(''); setPaid(''); setSelCust(null); setCustQ('');
  };

  const printReceipt = (r) => {
    const w = window.open('','_blank','width=400,height=600');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>রসিদ</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace,serif;width:300px;margin:auto;padding:10px;font-size:13px;color:#000}
    .c{text-align:center}.b{font-weight:bold}.l{border-top:1px dashed #000;margin:6px 0}
    table{width:100%}td{padding:2px 0}.r{text-align:right}.big{font-size:16px}
    @media print{body{width:100%}}</style></head><body>
    <div class="c b" style="font-size:16px">${r.settings.name}</div>
    ${r.settings.address ? `<div class="c">${r.settings.address}</div>` : ''}
    ${r.settings.phone ? `<div class="c">📞 ${r.settings.phone}</div>` : ''}
    <div class="l"></div>
    <div>তারিখ: ${new Date(r.sale.date).toLocaleString('en-GB')}</div>
    <div>বিল নং: #${r.sale.id.slice(-8).toUpperCase()}</div>
    <div>কাস্টমার: ${r.sale.custName}</div>
    <div class="l"></div>
    <table><tr><td class="b">পণ্য</td><td class="b">পরি.</td><td class="b r">মূল্য</td></tr>
    <tr><td colspan="3"><div class="l"></div></td></tr>
    ${r.sale.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}${i.unit}</td><td class="r">৳${i.total.toFixed(0)}</td></tr>`).join('')}
    </table>
    <div class="l"></div>
    <table>
      <tr><td>সাবটোটাল</td><td class="r">৳${r.sale.subtotal.toFixed(0)}</td></tr>
      ${r.sale.discount>0?`<tr><td>ছাড়</td><td class="r">-৳${r.sale.discount.toFixed(0)}</td></tr>`:''}
      ${r.sale.vatAmount>0?`<tr><td>ভ্যাট (${r.sale.vatPercent}%)</td><td class="r">৳${r.sale.vatAmount.toFixed(0)}</td></tr>`:''}
      <tr class="b"><td class="big">মোট</td><td class="big r">৳${r.sale.total.toFixed(0)}</td></tr>
      <tr><td>পরিশোধ</td><td class="r">৳${r.sale.paid.toFixed(0)}</td></tr>
      ${r.sale.change>0?`<tr><td>ফেরত</td><td class="r">৳${r.sale.change.toFixed(0)}</td></tr>`:''}
      ${r.sale.due>0?`<tr class="b"><td>বাকি</td><td class="r" style="color:red">৳${r.sale.due.toFixed(0)}</td></tr>`:''}
    </table>
    <div class="l"></div>
    <div class="c" style="margin-top:8px">ধন্যবাদ! আবার আসবেন 🙏</div>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script>
    </body></html>`);
    w.document.close();
  };

  if (receipt) return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center',gap:20,background:T.greenLight}}>
      <div style={{fontSize:72}}>✅</div>
      <div style={{fontSize:24,fontWeight:800,color:T.green}}>বিক্রয় সম্পন্ন!</div>
      <div style={{...card,width:340,textAlign:'center',padding:24}}>
        <div style={{fontSize:12,color:T.gray400,marginBottom:6}}>বিল নং: #{receipt.sale.id.slice(-8).toUpperCase()}</div>
        <div style={{fontSize:32,fontWeight:800,color:T.teal,marginBottom:4}}>{fmt(receipt.sale.total)}</div>
        <div style={{display:'flex',justifyContent:'center',gap:20,fontSize:13,color:T.gray600,marginBottom:4}}>
          <span>পরিশোধ: {fmt(receipt.sale.paid)}</span>
          {receipt.sale.change>0 && <span style={{color:T.green}}>ফেরত: {fmt(receipt.sale.change)}</span>}
          {receipt.sale.due>0 && <span style={{color:T.red}}>বাকি: {fmt(receipt.sale.due)}</span>}
        </div>
        <div style={{fontSize:13,color:T.gray400,marginBottom:20}}>কাস্টমার: {receipt.sale.custName}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button style={btn('primary')} onClick={()=>printReceipt(receipt)}>🖨️ প্রিন্ট রসিদ</button>
          <button style={btn()} onClick={()=>setReceipt(null)}>+ নতুন বিল</button>
        </div>
      </div>
    </div>
  );

  // Add Customer Popup
  if (showAddCust) return (
    <div style={{...overlay}}>
      <div style={{...card,width:360,padding:24}}>
        <div style={{fontSize:18,fontWeight:700,marginBottom:16,textAlign:'center'}}>👤 নতুন কাস্টমার যোগ করুন</div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>নাম *</label>
          <input value={newCustName} onChange={e=>setNewCustName(e.target.value)} 
            placeholder="কাস্টমারের নাম" style={{...input,height:42}} autoFocus />
        </div>
        <div style={{marginBottom:12}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>ফোন</label>
          <input value={newCustPhone} onChange={e=>setNewCustPhone(e.target.value)} 
            placeholder="মোবাইল নম্বর" style={{...input,height:42}} />
        </div>
        <div style={{marginBottom:20}}>
          <label style={{fontSize:12,color:T.gray500,marginBottom:4,display:'block'}}>ঠিকানা</label>
          <input value={newCustAddr} onChange={e=>setNewCustAddr(e.target.value)} 
            placeholder="ঠিকানা" style={{...input,height:42}} />
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>{setShowAddCust(false);setNewCustName('');setNewCustPhone('');setNewCustAddr('');}} 
            style={{...btn('ghost'),flex:1}}>বাতিল</button>
          <button onClick={()=>{
            if (!newCustName.trim()) { alert('নাম দিন!'); return; }
            const newC = {id:genId(),name:newCustName.trim(),phone:newCustPhone.trim(),address:newCustAddr.trim(),credit:0};
            upd.customers([...customers, newC]);
            setSelCust(newC);
            setShowAddCust(false);
            setNewCustName('');setNewCustPhone('');setNewCustAddr('');
          }} style={{...btn('primary'),flex:2}}>✓ কাস্টমার যোগ করুন</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',height:'100%',overflow:'hidden',width:'100%',background:T.gray50}}>
      {/* ── LEFT: Products ── */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        {/* Search bar */}
        <div style={{padding:'14px 16px',background:T.white,borderBottom:`1px solid ${T.gray200}`,display:'flex',gap:10,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
          <div style={{position:'relative',flex:1}}>
            <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:T.gray400,fontSize:16}}>🔍</span>
            <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="পণ্যের নাম বা বারকোড লিখুন..."
              style={{...input,paddingLeft:42,height:46,fontSize:14,borderRadius:10}}
              onKeyDown={e=>{if(e.key==='Enter'&&filtered.length>0) addToCart(filtered[0]);}}
            />
          </div>
        </div>

        {/* Category filter */}
        <div style={{padding:'10px 16px',background:T.white,borderBottom:`1px solid ${T.gray200}`,display:'flex',gap:8,overflowX:'auto'}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setSelCat(c)} style={{
              ...btn(selCat===c?'primary':'ghost','sm'),
              borderRadius:20, whiteSpace:'nowrap',
              background:selCat===c?T.teal:T.gray100,
              color:selCat===c?T.white:T.gray600,
              border:'none',
              padding:'6px 14px',
            }}>{c}</button>
          ))}
        </div>

        {/* Product grid */}
        <div style={{flex:1,overflow:'auto',padding:16,display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,alignContent:'start',background:T.gray50}}>
          {filtered.map(p => (
            <button key={p.id} onClick={()=>addToCart(p)} style={{
              background:T.white, border:`1.5px solid ${p.stock<=0?T.gray200:p.stock<=p.minStock?T.amber+'80':T.gray200}`,
              borderRadius:12, padding:'14px 12px', cursor:p.stock>0?'pointer':'not-allowed',
              opacity:p.stock<=0?0.5:1, textAlign:'left', transition:'all 0.2s',
              boxShadow:'0 2px 8px rgba(0,0,0,0.08)',
              outline:'none',
            }}>
              <div style={{fontSize:10,color:T.gray400,marginBottom:4,fontWeight:600,textTransform:'uppercase'}}>{p.cat}</div>
              <div style={{fontWeight:600,fontSize:14,marginBottom:8,lineHeight:1.4,color:T.gray900}}>{p.name}</div>
              <div style={{fontSize:18,fontWeight:800,color:T.teal}}>{fmt(p.sellP)}</div>
              <div style={{fontSize:11,marginTop:4,color:T.gray400}}>/{p.unit}</div>
              <div style={{marginTop:8,display:'inline-block',padding:'3px 8px',borderRadius:10,fontSize:11,fontWeight:600,
                background:p.stock<=0?T.redLight:p.stock<=p.minStock?T.amberLight:T.tealLight,
                color:p.stock<=0?T.red:p.stock<=p.minStock?T.amber:T.teal}}>
                স্টক: {p.stock}
              </div>
            </button>
          ))}
          {filtered.length===0 && (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px 20px',color:T.gray400}}>
              <div style={{fontSize:48,marginBottom:12}}>📦</div>
              <div style={{fontSize:15}}>কোনো পণ্য পাওয়া যায়নি</div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── */}
      <div style={{width:360,display:'flex',flexDirection:'column',background:T.white,borderLeft:`1px solid ${T.gray200}`,boxShadow:'-2px 0 10px rgba(0,0,0,0.05)'}}>
        {/* Customer */}
        <div style={{padding:'14px 16px',borderBottom:`1px solid ${T.gray200}`,position:'relative'}}>
          <label style={label}>👥 কাস্টমার (ঐচ্ছিক)</label>
          <div style={{display:'flex',gap:8}}>
            <input value={custQ} onChange={e=>{setCustQ(e.target.value);setShowCustDrop(true);}}
              onFocus={()=>setShowCustDrop(true)}
              onMouseDown={() => { setShowCustDrop(true); }}
              placeholder="নাম বা ফোন..."
              style={{...input,fontSize:13,borderRadius:8,flex:1}}
            />
            {due > 0 && !selCust && cart.length > 0 && (
              <button onClick={()=>setShowAddCust(true)} style={{...btn('primary'),fontSize:12,padding:'8px 12px',whiteSpace:'nowrap'}}>👤 যোগ</button>
            )}
          </div>
          {due > 0 && !selCust && cart.length > 0 && !custQ && (
            <div style={{fontSize:11,color:T.red,marginTop:4,textAlign:'center'}}>বাকিতে বিক্রয় করতে কাস্টমার যোগ করুন</div>
          )}
          {selCust && (
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8,padding:'8px 12px',background:T.tealLight,borderRadius:8}}>
              <span style={{fontSize:12,color:T.teal,fontWeight:600}}>✓ {selCust.name} {selCust.credit>0 && <span style={{color:T.red}}>(বাকি: {fmt(selCust.credit)})</span>}</span>
              <button onClick={()=>{setSelCust(null);setCustQ('');}} style={{fontSize:12,background:'none',border:'none',color:T.gray400,cursor:'pointer'}}>✕</button>
            </div>
          )}
          {showCustDrop && !selCust && (
            <div 
              onMouseDown={(e) => e.preventDefault()}
              style={{position:'absolute',left:16,right:16,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto'}}>
              {customers.filter(c=>c.name.includes(custQ)||c.phone?.includes(custQ)).map(c=>(
                <div key={c.id} onClick={()=>{setSelCust(c);setCustQ(c.name);setShowCustDrop(false);}}
                  style={{padding:'10px 14px',cursor:'pointer',fontSize:13,borderBottom:`1px solid ${T.gray100}`,display:'flex',justifyContent:'space-between'}}>
                  <span><strong>{c.name}</strong>{c.phone?` · ${c.phone}`:''}</span>
                  {c.credit>0 && <span style={{color:T.red,fontSize:11}}>বাকি {fmt(c.credit)}</span>}
                </div>
              ))}
              {customers.filter(c=>c.name.includes(custQ)||c.phone?.includes(custQ)).length===0 && (
                <div style={{padding:'10px 14px',fontSize:13,color:T.gray400}}>কাস্টমার পাওয়া যায়নি</div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div style={{flex:1,overflow:'auto'}}>
          {cart.length===0 ? (
            <div style={{textAlign:'center',padding:'60px 20px',color:T.gray400}}>
              <div style={{fontSize:52,marginBottom:12}}>🛒</div>
              <div style={{fontSize:15,fontWeight:500}}>কার্ট খালি</div>
              <div style={{fontSize:12,marginTop:4}}>বাম দিক থেকে পণ্য যোগ করুন</div>
            </div>
          ) : (
            <div style={{padding:'8px 14px'}}>
              {cart.map(item=>(
                <div key={item.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${T.gray100}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:T.gray900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>
                    <div style={{fontSize:13,color:T.teal,marginTop:2}}>{fmt(item.sellP)} × {item.qty} = <strong>{fmt(item.sellP*item.qty)}</strong></div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <button onClick={()=>updQty(item.id,item.qty-1)} style={{width:28,height:28,border:`1px solid ${T.gray200}`,borderRadius:6,background:T.white,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button>
                    <input value={item.qty} onChange={e=>updQty(item.id,e.target.value)} type="number"
                      style={{width:42,height:28,textAlign:'center',border:`1px solid ${T.gray200}`,borderRadius:6,fontSize:13}}/>
                    <button onClick={()=>updQty(item.id,item.qty+1)} style={{width:28,height:28,border:`1px solid ${T.gray200}`,borderRadius:6,background:T.white,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button>
                    <button onClick={()=>setCart(p=>p.filter(i=>i.id!==item.id))} style={{width:28,height:28,border:'none',borderRadius:6,background:T.redLight,color:T.red,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{borderTop:`2px solid ${T.gray200}`,padding:'14px 16px 10px',background:T.white}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:14,color:T.gray600,marginBottom:8}}>
            <span>সাবটোটাল ({cart.reduce((s,i)=>s+i.qty,0)} আইটেম)</span>
            <span style={{fontWeight:600}}>{fmt(subtotal)}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <label style={{...label,margin:0,whiteSpace:'nowrap'}}>ছাড় (৳)</label>
            <input value={discount} onChange={e=>setDiscount(e.target.value)} type="number" min="0"
              style={{...input,width:100,padding:'8px 10px',fontSize:13,borderRadius:8}}/>
            <label style={{...label,margin:0,whiteSpace:'nowrap'}}>ভ্যাট (%)</label>
            <input value={vatPercent} onChange={e=>setVatPercent(e.target.value)} type="number" min="0" max="100"
              style={{...input,width:70,padding:'8px 10px',fontSize:13,borderRadius:8}}/>
          </div>
          {vatAmount > 0 && (
            <div style={{fontSize:12,color:T.amber,marginBottom:8}}>ভ্যাট (৳{vatAmount.toFixed(0)}) যোগ হয়েছে</div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',background:T.tealLight,borderRadius:10,marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:16}}>মোট দেনা</span>
            <span style={{fontWeight:800,fontSize:24,color:T.teal}}>{fmt(total)}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
            <label style={{...label,margin:0,whiteSpace:'nowrap'}}>পরিশোধ (৳)</label>
            <input value={paid} onChange={e=>setPaid(e.target.value)} type="number" min="0"
              placeholder="পুরো মূল্য দিতে টাইপ করুন" style={{...input,padding:'8px 10px',fontSize:14,fontWeight:600,borderRadius:8}}/>
          </div>
          {due > 0 && (
            <div style={{fontSize:14,marginBottom:10,padding:'8px 12px',borderRadius:8,
              background:due>0?T.redLight:T.greenLight, color:due>0?T.red:T.green, fontWeight:600}}>
              {due>0 ? `⚠️ বাকি থাকবে: ${fmt(due)}${selCust ? ' (কাস্টমার হিসাবে যোগ হবে)' : ''}` : `💵 ফেরত দিন: ${fmt(change)}`}
            </div>
          )}
          {paidAmt > total && (
            <div style={{fontSize:14,marginBottom:10,padding:'8px 12px',borderRadius:8,
              background:T.greenLight, color:T.green, fontWeight:600}}>
              💵 ফেরত দিতে হবে: {fmt(change)}
            </div>
          )}
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>{setCart([]);setDiscount('');setPaid('');setSelCust(null);setCustQ('');}}
              style={{...btn('ghost'),flex:1,justifyContent:'center',padding:'12px'}}>
              🗑️ ক্লিয়ার
            </button>
            <button onClick={checkout} 
              disabled={!cart.length || (due > 0 && !selCust)}
              style={{
                ...btn('sell'), flex:2, justifyContent:'center', fontSize:15, padding:'12px',
                opacity: cart.length && !(due > 0 && !selCust) ? 1 : 0.5,
                cursor: cart.length && !(due > 0 && !selCust) ? 'pointer' : 'not-allowed',
              }}>
              {due > 0 && !selCust && cart.length ? `⚠️ পূর্ণ পরিশোধ করুন` : 
               due > 0 && selCust && cart.length ? `✓ বাকি/পূর্ণ পরিশোধ` : 
               '✓ বিক্রয় সম্পন্ন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PRODUCTS SCREEN
═══════════════════════════════════════════ */
function ProductsScreen({products, suppliers, categories, upd}) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [supplierQ, setSupplierQ] = useState('');
  const [showCompanyList, setShowCompanyList] = useState(false);
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [barcodeVal, setBarcodeVal] = useState('');
  const [barcodeSuggestions, setBarcodeSuggestions] = useState([]);
  const [form, setForm] = useState({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
  const [viewPurchase, setViewPurchase] = useState(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [csvData, setCsvData] = useState([]);

  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  // Handle CSV Import
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        alert('CSV ফাইলে কমপক্ষে হেডার ও একটি পণ্য থাকতে হবে');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const items = [];
      const errors = [];
      
      // Get existing companies and categories
      const existingCompanies = [
        ...suppliers.map(s => s.name.toLowerCase()),
        ...products.map(p => (p.company||'').toLowerCase()).filter(Boolean)
      ];
      const existingCategories = [
        ...new Set([
          ...products.map(p => (p.cat||'').toLowerCase()).filter(Boolean),
          ...categories.map(c => (c.name||'').toLowerCase()).filter(Boolean)
        ])
      ];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        
        // Get company code, company name and category from CSV
        const csvCompanyCode = (row['কোম্পানি কোড'] || row['company code'] || '').trim();
        const csvCompany = (row['কোম্পানি'] || row['company'] || supplierQ || '').trim();
        const csvCategory = (row['ক্যাটাগরি'] || row['category'] || '').trim();
        
        // Validate company by name
        if (csvCompany && !existingCompanies.includes(csvCompany.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCompany}" কোম্পানি ডাটাবেজে নেই`);
          continue;
        }
        
        // Validate category
        if (csvCategory && !existingCategories.includes(csvCategory.toLowerCase())) {
          errors.push(`পণ্য ${i}: "${csvCategory}" ক্যাটাগরি ডাটাবেজে নেই`);
          continue;
        }
        
        // Map CSV columns to product fields
        const item = {
          id: genId(),
          name: row['পণ্যের নাম'] || row['নাম'] || row['name'] || '',
          barcode: row['বারকোড'] || row['barcode'] || '',
          company: csvCompany,
          cat: csvCategory,
          unit: row['একক'] || row['unit'] || 'পিস',
          buyP: parseFloat(row['ক্রয়মূল্য'] || row['buyprice'] || row['buy'] || 0),
          sellP: parseFloat(row['বিক্রয়মূল্য'] || row['sellprice'] || row['sell'] || 0),
          stock: parseFloat(row['স্টক'] || row['stock'] || 0),
          minStock: parseFloat(row['মিনস্টক'] || row['minstock'] || 5)
        };
        
        if (item.name) {
          items.push(item);
        }
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

  // Get all unique companies from products and suppliers
  const allCompanies = [
    ...suppliers.map(s => s.name),
    ...products.map(p => p.company).filter(Boolean)
  ];
  const uniqueCompanies = [...new Set(allCompanies)].sort();

  // Get all unique categories from categories state (not from products)
  const uniqueCategories = [...new Set(categories.map(c => c.name).filter(Boolean))].sort();

  // Filter products for table
  const filtered = products.filter(p=>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.company||'').toLowerCase().includes(search.toLowerCase()) || 
    (p.barcode||'').includes(search)
  );

  // Handle barcode input
  const handleBarcode = (val) => {
    setBarcodeVal(val);
    setForm(f => ({...f, barcode: val}));
    
    // Filter by selected company if one is selected
    let filteredProducts = products;
    if (form.company) {
      filteredProducts = products.filter(p => 
        (p.company||'').toLowerCase() === form.company.toLowerCase()
      );
    }
    
    if (val.length >= 1) {
      const matches = filteredProducts.filter(p => 
        p.barcode?.includes(val) || p.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setBarcodeSuggestions(matches);
      
      // Auto-fill if exact barcode match found
      const exactMatch = filteredProducts.find(p => p.barcode === val);
      if (exactMatch) {
        selectProduct(exactMatch);
      }
    } else {
      setBarcodeSuggestions([]);
    }
  };

  // Select product from suggestions
  const selectProduct = (p) => {
    setForm({
      name: p.name,
      barcode: p.barcode || '',
      company: p.company || '',
      cat: p.cat || '',
      unit: p.unit || 'পিস',
      buyP: p.buyP || '',
      sellP: p.sellP || '',
      stock: '',
      minStock: p.minStock || '5'
    });
    setBarcodeVal(p.barcode || '');
    setBarcodeSuggestions([]);
    setSelectedProduct(p);
    setShowProductDrop(false);
    setProductNameQ('');
  };

  // Add product to purchase list
  const addToPurchase = () => {
    if (!form.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    const item = {
      id: genId(),
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
    // Reset form
    setForm({name:'',barcode:'',company:form.company,cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setBarcodeVal('');
    setSelectedProduct(null);
  };

  // Remove item from purchase list
  const removeItem = (id) => {
    setPurchaseItems(purchaseItems.filter(i => i.id !== id));
  };

  // Save purchase with all items
  const savePurchase = async () => {
    if (purchaseItems.length === 0) { alert('কমপক্ষে একটি পণ্য যোগ করুন'); return; }
    
    const savedCount = purchaseItems.length;
    const purchaseId = `PO-${Date.now().toString().slice(-8)}`;
    
    const purchase = {
      id: purchaseId,
      date: now(),
      supplier: form.company || 'সাধারণ',
      items: purchaseItems,
      totalItems: purchaseItems.length,
      totalStock: purchaseItems.reduce((s,i) => s + i.stock, 0)
    };

    // Prepare new products
    const newProducts = purchaseItems.map(item => ({ ...item, id: genId() }));
    
    // Prepare new supplier if needed
    let newSupplierArr = null;
    if (form.company && !suppliers.find(s => s.name === form.company)) {
      const newSupplier = { id: genId(), name: form.company, phone: '', address: '' };
      newSupplierArr = [...suppliers, newSupplier];
    }

    // Build promises array
    const promises = [];
    if (newSupplierArr) {
      promises.push(upd.suppliers(newSupplierArr));
    }
    promises.push(upd.products([...products, ...newProducts]));
    promises.push(upd.purchases([...purchases, purchase]));

    // Execute all updates
    await Promise.all(promises);

    // Clear form after successful save
    setPurchaseItems([]);
    setCsvData([]);
    setForm({name:'',barcode:'',company:'',cat:'',unit:'পিস',buyP:'',sellP:'',stock:'',minStock:'5'});
    setSupplierQ('');
    setShowAddForm(false);
    alert(`✅ ${savedCount}টি পণ্য সংরক্ষিত হয়েছে!\nপারচেজ আইডি: ${purchaseId}`);
  };

  // Delete product
  const del = async (id) => {
    if (!confirm('এই পণ্যটি মুছে ফেলবেন?')) return;
    await upd.products(products.filter(p=>p.id!==id));
  };

  // Purchase history view
  if (showPurchaseHistory) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setShowPurchaseHistory(false)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 পারচেজ হিস্ট্রি</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {purchases.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:T.gray400}}>কোনো পারচেজ রেকর্ড নেই</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...purchases].reverse().map(p => (
                <div key={p.id} onClick={()=>setViewPurchase(p)} 
                  style={{padding:14,background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700,color:T.teal}}>{p.id}</div>
                    <div style={{fontSize:12,color:T.gray500}}>{new Date(p.date).toLocaleDateString('bn-BD')} • {p.supplier}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700}}>{p.totalItems}টি পণ্য</div>
                    <div style={{fontSize:12,color:T.gray500}}>{p.totalStock} একক</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {viewPurchase && (
          <div style={{...overlay}} onClick={()=>setViewPurchase(null)}>
            <div style={{...card,width:400,maxHeight:'80vh',overflow:'auto',padding:20}} onClick={e=>e.stopPropagation()}>
              <div style={{marginBottom:16}}>
                <div style={{fontWeight:800,fontSize:16,color:T.teal}}>{viewPurchase.id}</div>
                <div style={{fontSize:12,color:T.gray500}}>{new Date(viewPurchase.date).toLocaleDateString('bn-BD')}</div>
                <div style={{fontSize:13}}>সরবরাহকারী: {viewPurchase.supplier}</div>
              </div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.gray50}}>
                    <th style={{padding:8,textAlign:'left',fontSize:11}}>পণ্য</th>
                    <th style={{padding:8,textAlign:'right',fontSize:11}}>পরিমাণ</th>
                  </tr>
                </thead>
                <tbody>
                  {viewPurchase.items.map((item,i) => (
                    <tr key={i} style={{borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:8,fontSize:13}}>{item.name}<br/><span style={{fontSize:11,color:T.gray400}}>{item.company}</span></td>
                      <td style={{padding:8,textAlign:'right',fontWeight:600}}>{item.stock} {item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={()=>setViewPurchase(null)} style={{...btn(),marginTop:12,width:'100%'}}>বন্ধ করুন</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Add product form
  if (showAddForm) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>{setShowAddForm(false);setPurchaseItems([]);setCsvData([]);}}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 নতুন পণ্য সংরক্ষণ</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:'auto'}}>{purchaseItems.length}টি পণ্য যোগ হয়েছে</span>
        </div>
        
        <div style={{display:'flex',flex:1,overflow:'hidden'}}>
          {/* Left: Form */}
          <div style={{flex:1,padding:16,overflow:'auto',borderRight:`1px solid ${T.gray200}`}}>
            
            {/* CSV Import Section */}
            <div style={{...card,padding:16,marginBottom:16,background:T.tealLight,border:`1px dashed ${T.teal}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <h3 style={{margin:0,fontSize:14,color:T.teal}}>📥 CSV আমদানি করুন</h3>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-start'}}>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <input type="file" accept=".csv" onChange={handleCsvImport} id="csvInput" style={{display:'none'}} />
                  <label htmlFor="csvInput" style={{...btn('primary'),cursor:'pointer',fontSize:13,padding:'10px 20px'}}>
                    📁 পণ্যের CSV আপলোড করুন
                  </label>
                  <button onClick={() => {
                    const csv = 'পণ্যের নাম,কোম্পানি কোড,কোম্পানি,ক্যাটাগরি,বারকোড,একক,ক্রয়মূল্য,বিক্রয়মূল্য,স্টক,মিনস্টক\nমিনিকেট চাল,M001,মিনিকেট,খাদ্যপণ্য,001,কেজি,55,65,100,10\nব্রিলিয়ান্ট চাল,B001,ব্রিলিয়ান্ট,খাদ্যপণ্য,002,কেজি,52,62,80,10\nসুজি চিপস,S001,সুজি,স্ন্যাকস,003,পিস,20,25,200,20\nপারফেক্ট সাবান,P001,পারফেক্ট,সৌন্দর্য,004,পিস,35,45,150,15';
                    const blob = new Blob(['\uFEFF' + csv], {type: 'text/csv;charset=utf-8'});
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'পণ্যের_তালিকা.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }} style={{...btn('ghost'),fontSize:12,padding:'8px 16px'}}>
                    📥 ডেমো CSV ডাউনলোড
                  </button>
                </div>
                <div style={{fontSize:11,color:T.gray600}}>
                  💡 CSV ফাইলে কোম্পানি কোড, কোম্পানির নাম ও ক্যাটাগরি অবশ্যই ডাটাবেজে থাকতে হবে
                </div>
              </div>
              {csvData.length > 0 && (
                <div style={{marginTop:8,fontSize:12,color:T.teal,fontWeight:600}}>
                  ✓ {csvData.length}টি পণ্য আপলোড হয়েছে
                </div>
              )}
            </div>
            
            <div style={{...card,padding:16}}>
              <h3 style={{margin:'0 0 16px',fontSize:14,color:T.teal}}>পণ্য যোগ করুন</h3>
              
              {/* Supplier/Company */}
              <div style={{marginBottom:12, position:'relative'}}>
                <label style={label}>🏢 সরবরাহকারী/কোম্পানি *</label>
                <div style={{display:'flex',gap:4}}>
                  <input 
                    value={supplierQ} 
                    onChange={e=>{setSupplierQ(e.target.value);setForm(f=>({...f,company:e.target.value}));setShowCompanyList(true);}}
                    onClick={()=>setShowCompanyList(true)}
                    onBlur={()=>setTimeout(()=>setShowCompanyList(false),200)}
                    placeholder="কোম্পানির নাম লিখুন..."
                    style={{...input,fontSize:13,flex:1}} />
                  <button type="button" onClick={()=>setShowCompanyList(!showCompanyList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                </div>
                {showCompanyList && (
                  <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                    {uniqueCompanies.filter(c=>c.toLowerCase().includes(supplierQ.toLowerCase())).map((c,i)=>(
                      <div key={i} onClick={()=>{setSupplierQ(c);setForm(f=>({...f,company:c}));setShowCompanyList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                        {c}
                      </div>
                    ))}
                    {supplierQ && !uniqueCompanies.some(c=>c.toLowerCase()===supplierQ.toLowerCase()) && (
                      <div onClick={()=>{setForm(f=>({...f,company:supplierQ}));setShowCompanyList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                        + নতুন কোম্পানি যুক্ত করুন: "{supplierQ}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Category */}
              <div style={{marginBottom:12, position:'relative'}}>
                <label style={label}>📂 ক্যাটাগরি</label>
                <div style={{display:'flex',gap:4}}>
                  <input 
                    value={form.cat} 
                    onChange={e=>{setForm(f=>({...f,cat:e.target.value}));setShowCategoryList(true);}}
                    onClick={()=>setShowCategoryList(true)}
                    onBlur={()=>setTimeout(()=>setShowCategoryList(false),200)}
                    placeholder="ক্যাটাগরি লিখুন..."
                    style={{...input,fontSize:13,flex:1}} />
                  <button type="button" onClick={()=>setShowCategoryList(!showCategoryList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                </div>
                {showCategoryList && (
                  <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                    {uniqueCategories.filter(c=>c.toLowerCase().includes((form.cat||'').toLowerCase())).map((c,i)=>(
                      <div key={i} onClick={()=>{setForm(f=>({...f,cat:c}));setShowCategoryList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                        {c}
                      </div>
                    ))}
                    {form.cat && !uniqueCategories.some(c=>c.toLowerCase()===(form.cat||'').toLowerCase()) && (
                      <div onClick={()=>{setShowCategoryList(false);}}
                        style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                        + নতুন ক্যাটাগরি যুক্ত করুন: "{form.cat}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Barcode + Product Name */}
              <div style={{display:'flex',gap:8,marginBottom:12}}>
                <div style={{flex:1}}>
                  <label style={label}>④ বারকোড</label>
                  <input value={barcodeVal} onChange={e=>handleBarcode(e.target.value)} placeholder="বারকোড..."
                    style={{...input,fontSize:13}} />
                </div>
                <div style={{flex:2, position:'relative'}}>
                  <label style={label}>③ পণ্যের নাম *</label>
                  <div style={{display:'flex',gap:4}}>
                    <input value={form.name} onChange={e=>{setForm(f=>({...f,name:e.target.value}));setShowProductList(true);}} 
                      onClick={()=>setShowProductList(true)}
                      onBlur={()=>setTimeout(()=>setShowProductList(false),200)}
                      placeholder="পণ্যের নাম লিখুন..."
                      style={{...input,fontSize:13,flex:1}} />
                    <button type="button" onClick={()=>setShowProductList(!showProductList)} style={{...btn('ghost'),padding:'6px 12px',fontSize:13}}>▼</button>
                  </div>
                  {showProductList && (
                    <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto',marginTop:4}}>
                      {products.filter(p=>!p.name?.includes('(ক্যাটাগরি)') && p.name.toLowerCase().includes((form.name||'').toLowerCase())).slice(0,20).map((p,i)=>(
                        <div key={i} onClick={()=>{setForm(f=>({...f,name:p.name}));setShowProductList(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                          <div style={{fontWeight:600}}>{p.name}</div>
                          <div style={{fontSize:11,color:T.gray400}}>{p.company} • {p.cat}</div>
                        </div>
                      ))}
                      {form.name && !products.some(p=>!p.name?.includes('(ক্যাটাগরি)') && p.name.toLowerCase()===(form.name||'').toLowerCase()) && (
                        <div onClick={()=>{setShowProductList(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',background:T.tealLight,color:T.teal,fontWeight:600,borderTop:`1px solid ${T.gray200}`}}>
                          + নতুন পণ্য তৈরি করুন: "{form.name}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inline Fields: Unit, Stock, Prices, Min Stock */}
              <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
                <div style={{flex:'1 1 100px',minWidth:80}}>
                  <label style={label}>📥 একক</label>
                  <input value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} placeholder="পিস..."
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 80px',minWidth:70}}>
                  <label style={label}>📥 স্টক</label>
                  <input value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 90px',minWidth:80}}>
                  <label style={label}>💰 ক্রয়মূল্য</label>
                  <input value={form.buyP} onChange={e=>setForm(f=>({...f,buyP:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 90px',minWidth:80}}>
                  <label style={label}>💵 বিক্রয়মূল্য</label>
                  <input value={form.sellP} onChange={e=>setForm(f=>({...f,sellP:e.target.value}))} type="number" placeholder="০"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
                <div style={{flex:'1 1 80px',minWidth:70}}>
                  <label style={label}>⚠️ মিন স্টক</label>
                  <input value={form.minStock} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))} type="number" placeholder="৫"
                    style={{...input,fontSize:12,padding:'6px 8px'}} />
                </div>
              </div>

              {/* Profit Percentage Display */}
              {form.buyP > 0 && form.sellP > 0 && (
                <div style={{marginBottom:12,padding:'8px 12px',background:T.greenLight,borderRadius:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13,color:T.gray600}}>📊 লাভ:</span>
                  <span style={{fontSize:16,fontWeight:700,color:T.green}}>
                    ৳{((+form.sellP || 0) - (+form.buyP || 0)).toFixed(2)} 
                    ({(((+form.sellP || 0) - (+form.buyP || 0)) / (+form.buyP || 1) * 100).toFixed(1)}%)
                  </span>
                </div>
              )}

              <button onClick={addToPurchase} style={{...btn('primary'),width:'100%',padding:'10px'}}>
                ➕ পণ্য তালিকায় যোগ করুন
              </button>
            </div>
          </div>

          {/* Right: Purchase Items List */}
          <div style={{width:360,display:'flex',flexDirection:'column',background:T.gray50,overflow:'hidden'}}>
            <div style={{padding:12,background:T.white,borderBottom:`1px solid ${T.gray200}`,fontWeight:700}}>
              📋 পণ্য তালিকা ({purchaseItems.length})
            </div>
            <div style={{flex:1,overflow:'auto',padding:8}}>
              {purchaseItems.length === 0 ? (
                <div style={{textAlign:'center',padding:40,color:T.gray400}}>
                  <div style={{fontSize:32,marginBottom:8}}>📦</div>
                  <div>কোনো পণ্য যোগ হয়নি</div>
                </div>
              ) : (
                purchaseItems.map((item,i)=>(
                  <div key={item.id} style={{padding:10,background:T.white,borderRadius:8,marginBottom:6,border:`1px solid ${T.gray200}`}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
                        <div style={{fontSize:11,color:T.gray500}}>{item.company} • {item.barcode}</div>
                        {item.cat && <div style={{fontSize:11,color:T.gray400,marginTop:2}}>📂 {item.cat}</div>}
                        <div style={{fontSize:12,marginTop:4}}>
                          <span style={{color:T.teal}}>৳{item.buyP || 0}</span> → <span style={{color:T.green}}>৳{item.sellP || 0}</span>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700,fontSize:14}}>{item.stock || 0} {item.unit}</div>
                        <button onClick={()=>removeItem(item.id)} style={{fontSize:11,color:T.red,background:'none',border:'none',cursor:'pointer',marginTop:4}}>✕ মুছুন</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {purchaseItems.length > 0 && (
              <div style={{padding:12,background:T.white,borderTop:`1px solid ${T.gray200}`}}>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setPurchaseItems([])} style={{...btn('ghost'),flex:1}}>সব মুছুন</button>
                  <button onClick={savePurchase} style={{...btn('primary'),flex:2}}>💾 সংরক্ষণ করুন</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px',minWidth:150}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{...input,paddingLeft:32}}/>
        </div>
        <button style={btn('primary')} onClick={()=>{setShowAddForm(true);setPurchaseItems([]);}}>📦 নতুন পণ্য সংরক্ষণ</button>
        <button style={btn()} onClick={()=>setShowPurchaseHistory(true)}>📋 পারচেজ হিস্ট্রি</button>
        <span style={{fontSize:12,color:T.gray400}}>{products.length}টি পণ্য</span>
      </div>

      <div style={{flex:1,overflow:'auto',padding:12}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
          <thead>
            <tr style={{background:T.tealLight}}>
              {['কোম্পানি কোড','পণ্যের নাম','কোম্পানি','ক্যাটাগরি','ক্রয়মূল্য','বিক্রয়মূল্য','লাভ (%)','স্টক','একক',''].map((h,i)=>(
                <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length===0 ? (
              <tr><td colSpan={10} style={{padding:40,textAlign:'center',color:T.gray400}}>পণ্য পাওয়া যায়নি</td></tr>
            ) : filtered.map((p,i)=>{
              const profitPct = p.buyP>0 ? Math.round((p.sellP-p.buyP)/p.buyP*100) : 0;
              const isLowStock = p.stock <= p.minStock;
              const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'';
              return (
                <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                  <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{supCode||'-'}</td>
                  <td style={{padding:'10px 12px'}}>
                    <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                    {p.barcode && <div style={{fontSize:11,color:T.gray400,fontFamily:'monospace'}}>{p.barcode}</div>}
                  </td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.company||'-'}</td>
                  <td style={{padding:'10px 12px',fontSize:13,color:T.gray600}}>{p.cat||'-'}</td>
                  <td style={{padding:'10px 12px',fontSize:13}}>{fmt(p.buyP)}</td>
                  <td style={{padding:'10px 12px',fontWeight:700,fontSize:14}}>{fmt(p.sellP)}</td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{fontSize:12,fontWeight:600,color:profitPct>0?T.green:T.red}}>
                      {fmt(p.sellP-p.buyP)} ({profitPct}%)
                    </span>
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{fontWeight:700,fontSize:15,color:isLowStock?T.red:T.gray900}}>{fmtN(p.stock)}</span>
                    {isLowStock && <span style={{fontSize:10,color:T.red,marginLeft:4}}>⚠️ কম</span>}
                  </td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{p.unit}</td>
                  <td style={{padding:'10px 12px'}}>
                    <button style={btn('danger','sm')} onClick={()=>del(p.id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SUPPLIERS SCREEN
═══════════════════════════════════════════ */
function SuppliersScreen({suppliers, products, categories, purchases, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [viewSupplier, setViewSupplier] = useState(null);
  const [viewCategory, setViewCategory] = useState(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('companies'); // companies, products, categories
  const [productForm, setProductForm] = useState({company:'',cat:'',name:'',barcode:''});
  const [catForm, setCatForm] = useState({name:'',company:''});
  const [companyQ, setCompanyQ] = useState('');
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);
  const [catQ, setCatQ] = useState('');
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [catCompanyQ, setCatCompanyQ] = useState('');
  const [showCatCompanyDrop, setShowCatCompanyDrop] = useState(false);

  // Click outside to close dropdowns - only close when clicking outside the modal
  useEffect(() => {
    const handleClick = (e) => {
      // Only close if clicking outside the modal
      const modal = document.querySelector('[data-modal]');
      if (modal && !modal.contains(e.target)) {
        setShowCompanyDrop(false);
        setShowCatDrop(false);
        setShowCatCompanyDrop(false);
        setShowProductDrop(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const overlay = {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100};

  // Get categories from categories state (not from products)
  const allCategories = [...new Set(categories.map(c => c.name).filter(Boolean))];
  
  // Get products by company
  const companyProducts = form.company 
    ? products.filter(p => (p.company||'').toLowerCase() === form.company.toLowerCase())
    : [];
    
  // Get categories for selected company
  const companyCategories = form.company 
    ? categories.filter(c => c.company?.toLowerCase() === form.company.toLowerCase()).map(c => c.name)
    : [];

  // Filter companies for dropdown
  const filteredCompanies = suppliers.filter(s => 
    !companyQ || s.name.toLowerCase().includes(companyQ.toLowerCase()) || (s.code||'').toLowerCase().includes(companyQ.toLowerCase())
  );

  // Filter categories for dropdown
  const filteredCats = companyCategories.filter(c => 
    !catQ || c.toLowerCase().includes(catQ.toLowerCase())
  );

  // Get products count for each supplier
  const getProductsCount = (company) => products.filter(p => (p.company||'').toLowerCase() === company.toLowerCase()).length;
  
  // Get purchases for a supplier
  const getSupplierPurchases = (company) => purchases.filter(p => (p.supplier||'').toLowerCase() === company.toLowerCase());

  // Get all unique companies from products
  const allCompanies = [...new Set(products.map(p => p.company).filter(Boolean))];
  
  // Combine suppliers and product companies
  const allSuppliers = [
    ...suppliers,
    ...allCompanies.filter(c => !suppliers.find(s => s.name.toLowerCase() === c.toLowerCase())).map(c => ({ id: `auto-${c}`, name: c, phone: '', address: '', isAuto: true }))
  ];

  const filtered = allSuppliers.filter(s => 
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.phone||'').includes(search) || (s.code||'').toLowerCase().includes(search.toLowerCase())
  );

  const saveCompany = async () => {
    if (!form.name?.trim()) { alert('কোম্পানির নাম দিন'); return; }
    
    // Generate company code (C-00001, C-00002, etc.)
    const maxCode = suppliers.reduce((max, s) => {
      const match = s.code?.match(/C-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    const newCode = `C-${String(maxCode + 1).padStart(5, '0')}`;
    
    if (form.isAuto) {
      // Convert auto to real supplier
      const newS = { id: genId(), code: newCode, name: form.name.trim(), phone: form.phone||'', address: form.address||'' };
      await upd.suppliers([...suppliers, newS]);
      setForm({name:'',phone:'',address:'',isAuto:false});
      alert(`✅ কোম্পানি যোগ করা হয়েছে!\nকোম্পানি কোড: ${newCode}`);
    } else if (modal.mode === 'add') {
      await upd.suppliers([...suppliers, {...form, id: genId(), code: newCode}]);
      setForm({name:'',phone:'',address:'',isAuto:false});
      alert(`✅ কোম্পানি যোগ করা হয়েছে!\nকোম্পানি কোড: ${newCode}`);
    } else {
      await upd.suppliers(suppliers.map(s => s.id === modal.id ? {...form, id: modal.id} : s));
      setModal(null);
    }
  };

  const saveProduct = async () => {
    if (!productForm.company) { alert('কোম্পানি সিলেক্ট করুন'); return; }
    if (!productForm.cat) { alert('ক্যাটাগরি সিলেক্ট করুন'); return; }
    if (!productForm.name?.trim()) { alert('পণ্যের নাম দিন'); return; }
    
    // Generate product ID (P-00001, P-00002, etc.)
    const maxId = products.reduce((max, p) => {
      const match = p.id?.match(/P-(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 50);
    const newId = `P-${String(maxId + 1).padStart(5, '0')}`;
    
    const newP = {
      id: newId,
      name: productForm.name.trim(),
      barcode: productForm.barcode?.trim() || '',
      company: productForm.company,
      cat: productForm.cat,
      unit: 'পিস',
      buyP: 0,
      sellP: 0,
      stock: 0,
      minStock: 5
    };
    await upd.products([...products, newP]);
    setProductForm({company:productForm.company,cat:productForm.cat,name:'',barcode:'',unit:'পিস',buyP:'',sellP:'',stock:0,minStock:5});
    alert(`পণ্য সংরক্ষিত হয়েছে! আইডি: ${newId}`);
  };

  const saveCategory = async () => {
    if (!catForm.name?.trim()) { alert('ক্যাটাগরির নাম দিন'); return; }
    if (!catForm.company) { alert('কোম্পানি সিলেক্ট করুন'); return; }
    
    // Check if category already exists for this company
    const exists = categories.some(c => 
      (c.company||'').toLowerCase() === catForm.company.toLowerCase() && 
      c.name.toLowerCase() === catForm.name.trim().toLowerCase()
    );
    
    if (exists) {
      alert('এই ক্যাটাগরি ইতিমধ্যে এই কোম্পানিতে আছে');
      return;
    }
    
    // Save category to categories state
    const newCat = {
      id: genId(),
      name: catForm.name.trim(),
      company: catForm.company
    };
    await upd.categories([...categories, newCat]);
    alert(`✅ ক্যাটাগরি যোগ করা হয়েছে!\nকোম্পানি: ${catForm.company}\nক্যাটাগরি: ${catForm.name.trim()}`);
    setCatForm({name:'',company:''});
    setCatCompanyQ('');
    setShowCatCompanyDrop(false);
  };

  const del = async (id) => {
    if (!confirm('এই কোম্পানি মুছে ফেলবেন?')) return;
    await upd.suppliers(suppliers.filter(s => s.id !== id));
  };

  // Purchase history for supplier
  const supplierPurchases = showPurchaseHistory ? getSupplierPurchases(showPurchaseHistory.name) : [];

  if (showPurchaseHistory) {
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setShowPurchaseHistory(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📦 {showPurchaseHistory.name} - পারচেজ হিস্ট্রি</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:'auto'}}>{supplierPurchases.length}টি পারচেজ</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {supplierPurchases.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:T.gray400}}>কোনো পারচেজ রেকর্ড নেই</div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[...supplierPurchases].reverse().map(p => (
                <div key={p.id} style={{padding:14,background:T.white,borderRadius:10,border:`1px solid ${T.gray200}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontWeight:700,color:T.teal}}>{p.id}</div>
                    <div style={{fontSize:12,color:T.gray500}}>{new Date(p.date).toLocaleDateString('bn-BD')}</div>
                  </div>
                  <div style={{display:'flex',gap:16,fontSize:13}}>
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

  // View single supplier
  if (viewSupplier) {
    const supProducts = products.filter(p => (p.company||'').toLowerCase() === viewSupplier.name.toLowerCase());
    const supPurchases = getSupplierPurchases(viewSupplier.name);
    
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setViewSupplier(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>🏢 {viewSupplier.name}</span>
          {viewSupplier.code && <span style={{fontSize:12,color:T.teal,fontWeight:600,marginLeft:8}}>{viewSupplier.code}</span>}
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.teal}}>{supProducts.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট পণ্য</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.green}}>{supPurchases.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>পারচেজ সংখ্যা</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.orange}}>{supPurchases.reduce((s,p)=>s+p.totalStock,0)}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট একক</div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{display:'flex',gap:8,marginBottom:16}}>
            <button style={btn('primary')} onClick={()=>setShowPurchaseHistory(viewSupplier)}>📋 পারচেজ হিস্ট্রি</button>
            {!viewSupplier.isAuto && (
              <button style={btn()} onClick={()=>{setForm({...viewSupplier});setModal({mode:'edit',id:viewSupplier.id});}}>✏️ সম্পাদনা</button>
            )}
          </div>

          {/* Products List */}
          <div style={{...card,padding:0}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📦 পণ্য তালিকা</div>
            {supProducts.length === 0 ? (
              <div style={{padding:30,textAlign:'center',color:T.gray400}}>কোনো পণ্য নেই</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:T.tealLight}}>
                    <th style={{padding:'8px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>পণ্য</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>স্টক</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>ক্রয়মূল্য</th>
                    <th style={{padding:'8px 12px',textAlign:'right',fontSize:11,fontWeight:700,color:T.teal}}>বিক্রয়মূল্য</th>
                  </tr>
                </thead>
                <tbody>
                  {supProducts.map(p => (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{p.barcode}</div>
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600}}>{p.stock} {p.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:T.orange}}>{fmt(p.buyP)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:T.teal}}>{fmt(p.sellP)}</td>
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

  // View single category
  if (viewCategory) {
    const catProducts = products.filter(p => p.cat === viewCategory.name);
    
    return (
      <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
          <button style={btn()} onClick={()=>setViewCategory(null)}>← ফিরে যান</button>
          <span style={{fontWeight:700,fontSize:15}}>📂 {viewCategory.name}</span>
          <span style={{fontSize:12,color:T.gray500,marginLeft:8}}>({viewCategory.company})</span>
        </div>
        <div style={{flex:1,overflow:'auto',padding:12}}>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,marginBottom:16}}>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.teal}}>{catProducts.length}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট পণ্য</div>
            </div>
            <div style={{...card,padding:16,textAlign:'center'}}>
              <div style={{fontSize:24,fontWeight:800,color:T.orange}}>{catProducts.reduce((s,p)=>s+p.stock,0)}</div>
              <div style={{fontSize:12,color:T.gray500}}>মোট স্টক</div>
            </div>
          </div>

          {/* Products List */}
          <div style={{...card,padding:0}}>
            <div style={{padding:12,borderBottom:`1px solid ${T.gray200}`,fontWeight:700,background:T.gray50}}>📦 পণ্য তালিকা</div>
            {catProducts.length === 0 ? (
              <div style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো পণ্য নেই</div>
            ) : (
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  {catProducts.map(p => (
                    <tr key={p.id} style={{borderBottom:`1px solid ${T.gray100}`}}>
                      <td style={{padding:'8px 12px'}}>
                        <div style={{fontWeight:600,fontSize:13}}>{p.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{p.barcode}</div>
                      </td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600}}>{p.stock} {p.unit}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:600,color:T.orange}}>{fmt(p.buyP)}</td>
                      <td style={{padding:'8px 12px',textAlign:'right',fontWeight:700,color:T.teal}}>{fmt(p.sellP)}</td>
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

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      {/* Sub tabs */}
      <div style={{display:'flex',alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexShrink:0}}>
        <button onClick={()=>setActiveTab('companies')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='companies'?700:400,color:activeTab==='companies'?T.teal:T.gray500,borderBottom:activeTab==='companies'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          🏢 কোম্পানি ({allSuppliers.length})
        </button>
        <button onClick={()=>setActiveTab('categories')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='categories'?700:400,color:activeTab==='categories'?T.teal:T.gray500,borderBottom:activeTab==='categories'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📂 ক্যাটাগরি ({categories.length})
        </button>
        <button onClick={()=>setActiveTab('products')} style={{padding:'12px 20px',border:'none',background:'none',cursor:'pointer',fontWeight:activeTab==='products'?700:400,color:activeTab==='products'?T.teal:T.gray500,borderBottom:activeTab==='products'?`2px solid ${T.teal}`:'none',fontSize:13}}>
          📦 পণ্য ({products.filter(p=>!p.name?.includes('(ক্যাটাগরি)')).length})
        </button>
        {/* Search and Add button - right aligned - changes based on tab */}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',paddingRight:12}}>
          <div style={{position:'relative'}}>
            <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} 
              placeholder={activeTab==='companies'?'কোম্পানি খুঁজুন...':activeTab==='categories'?'ক্যাটাগরি খুঁজুন...':'পণ্য খুঁজুন...'}
              style={{...input,paddingLeft:32,padding:'6px 12px',fontSize:12}}/>
          </div>
          <button style={{...btn('primary'),padding:'6px 12px',fontSize:12}} onClick={()=>setModal({mode:'add'})}>
            {activeTab==='companies'?'🏢 নতুন কোম্পানি':activeTab==='categories'?'📂 ক্যাটাগরি যোগ করুন':'📦 নতুন পণ্য'}
          </button>
        </div>
      </div>

      <div style={{overflow:'auto',padding:12}}>
        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div style={{...card,overflow:'hidden',marginBottom:16}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:T.white}}>
              <thead>
                <tr style={{background:T.tealLight}}>
                  {['পণ্যের নাম','কোম্পানি','ক্যাটাগরি','ক্রয়মূল্য','বিক্রয়মূল্য','স্টক','একক',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter(p=>!p.name?.includes('(ক্যাটাগরি)')).length === 0 ? (
                  <tr><td colSpan={8} style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো পণ্য পাওয়া যায়নি</td></tr>
                ) : products.filter(p => !p.name?.includes('(ক্যাটাগরি)') && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.company||'').toLowerCase().includes(search.toLowerCase()))).map((p,i)=>(
                  <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'10px 12px',fontWeight:600,fontSize:14}}>{p.name}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.company||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.cat||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:12}}>{fmt(p.buyP)}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,fontSize:14}}>{fmt(p.sellP)}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:p.stock<=p.minStock?T.red:T.gray600}}>{p.stock}</td>
                    <td style={{padding:'10px 12px',fontSize:12}}>{p.unit}</td>
                    <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                      <button onClick={()=>setModal({mode:'edit',id:p.id})} style={{...btn('ghost'),padding:'4px 6px'}}>✏️</button>
                      <button onClick={()=>del(p.id)} style={{...btn('danger'),padding:'4px 6px'}}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div style={{...card,overflow:'hidden',marginBottom:16}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:T.white}}>
              <thead>
                <tr style={{background:T.tealLight}}>
                  {['ক্রম','কোম্পানি','ক্যাটাগরির নাম','পণ্য সংখ্যা',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr><td colSpan={5} style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো ক্যাটাগরি পাওয়া যায়নি</td></tr>
                ) : categories.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())).map((cat,i)=>(
                  <tr key={cat.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.teal,fontWeight:600}}>{i+1}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{cat.company}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,fontSize:14}}>{cat.name}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.teal,fontWeight:600}}>{products.filter(p=>p.cat===cat.name).length}</td>
                    <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                      <button onClick={()=>setViewCategory(cat)} style={{...btn(),fontSize:11,padding:'4px 8px'}}>👁️</button>
                      <button onClick={()=>{setCatForm({name:cat.name,company:cat.company});setModal({mode:'editCat',catName:cat.name,catId:cat.id});}} style={{...btn('ghost'),padding:'4px 6px'}}>✏️</button>
                      <button onClick={async ()=>{if(confirm('এই ক্যাটাগরি মুছে ফেলবেন?')){await upd.categories(categories.filter(c=>c.id!==cat.id));}}} style={{...btn('danger'),padding:'4px 6px'}}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPANIES TAB */}
        {activeTab === 'companies' && (
          <div style={{...card,overflow:'hidden',marginBottom:16}}>
            <table style={{width:'100%',borderCollapse:'collapse',background:T.white}}>
              <thead>
                <tr style={{background:T.tealLight}}>
                  {['কোম্পানি কোড','কোম্পানির নাম','ফোন','ঠিকানা','পণ্য সংখ্যা',''].map((h,i)=>(
                    <th key={i} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal,letterSpacing:'0.3px',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:T.gray400}}>কোনো কোম্পানি পাওয়া যায়নি</td></tr>
                ) : filtered.map((s,i)=>(
                  <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{s.code||'-'}</td>
                    <td style={{padding:'10px 12px',fontWeight:600,fontSize:14}}>{s.name}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{s.phone||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{s.address||'-'}</td>
                    <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{getProductsCount(s.name)}</td>
                    <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}>
                      <button onClick={()=>setViewSupplier(s)} style={{...btn(),fontSize:11,padding:'4px 8px'}}>👁️</button>
                      {!s.isAuto && (
                        <>
                          <button onClick={()=>{setForm({...s});setModal({mode:'edit',id:s.id});}} style={{...btn('ghost'),padding:'4px 6px'}}>✏️</button>
                          <button onClick={()=>del(s.id)} style={{...btn('danger'),padding:'4px 6px'}}>🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CATEGOR/* Company Modal */}
      {/* Unified Modal for all tabs */}
      {modal && (
        <div style={{...overlay}} onClick={()=>{setShowCompanyDrop(false);setShowCatDrop(false);setShowCatCompanyDrop(false);setShowProductDrop(false);}} data-modal>
          <div style={{...card,width:activeTab==='products'?500:380,padding:24}} onClick={e=>{e.stopPropagation()}} data-modal>
            {/* Company Form */}
            {(modal.mode === 'add' || modal.mode === 'edit') && activeTab === 'companies' && (
              <>
                <h3 style={{margin:'0 0 16px'}}>{modal.mode === 'add' ? '🏢 নতুন কোম্পানি যোগ করুন' : '✏️ কোম্পানি সম্পাদনা করুন'}</h3>
                <div style={{marginBottom:12}}>
                  <label style={label}>🏢 কোম্পানির নাম *</label>
                  <input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="কোম্পানির নাম" style={input} autoFocus />
                </div>
                {modal.mode === 'add' && (
                  <div style={{marginBottom:12,background:T.gray50,padding:10,borderRadius:8}}>
                    <label style={label}>🔢 কোম্পানি আইডি</label>
                    <div style={{fontWeight:700,color:T.teal,fontSize:15}}>C-{String(suppliers.length + 1).padStart(5, '0')}</div>
                  </div>
                )}
                <div style={{marginBottom:12}}>
                  <label style={label}>📱 ফোন নম্বর</label>
                  <input value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="মোবাইল নম্বর" style={input} />
                </div>
                <div style={{marginBottom:16}}>
                  <label style={label}>📍 ঠিকানা</label>
                  <input value={form.address||''} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="ঠিকানা" style={input} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModal(null)} style={{...btn(),flex:1}}>✕ বন্ধ করুন</button>
                  <button onClick={saveCompany} style={{...btn('primary'),flex:1}} disabled={!form.name?.trim()}>💾 সংরক্ষণ করুন</button>
                </div>
                {modal.mode === 'add' && (
                  <div style={{marginTop:12,fontSize:11,color:T.gray500,textAlign:'center'}}>
                    💡 সংরক্ষণের পর আবার নতুন কোম্পানি যোগ করতে পারবেন
                  </div>
                )}
              </>
            )}

            {/* Category Form */}
            {(modal.mode === 'add' || modal.mode === 'editCat') && activeTab === 'categories' && (
              <>
                <h3 style={{margin:'0 0 16px'}}>{modal.mode === 'add' ? '📂 নতুন ক্যাটাগরি যোগ করুন' : '✏️ ক্যাটাগরি সম্পাদনা করুন'}</h3>
                <div style={{marginBottom:12,position:'relative'}}>
                  <label style={label}>🏢 কোম্পানি নির্বাচন করুন *</label>
                  <input value={catForm.company||''} onChange={e=>{setCatForm(f=>({...f,company:e.target.value}));setCatCompanyQ(e.target.value);setShowCatCompanyDrop(true);}} 
                    onFocus={()=>setShowCatCompanyDrop(true)} placeholder="কোম্পানির নাম..." style={input} />
                  {showCatCompanyDrop && (
                    <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto'}}>
                      {filteredCompanies.filter(c=>!catCompanyQ || c.name.toLowerCase().includes(catCompanyQ.toLowerCase())).map(c=>(
                        <div key={c.id} onClick={()=>{setCatForm(f=>({...f,company:c.name}));setCatCompanyQ('');setShowCatCompanyDrop(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,display:'flex',justifyContent:'space-between'}}>
                          <span>{c.name}</span>
                          {c.code && <span style={{fontSize:11,color:T.teal}}>{c.code}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{marginBottom:16}}>
                  <label style={label}>📂 ক্যাটাগরির নাম *</label>
                  <input value={catForm.name||''} onChange={e=>setCatForm(f=>({...f,name:e.target.value}))} placeholder="ক্যাটাগরির নাম" style={input} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModal(null)} style={{...btn(),flex:1}}>✕ বন্ধ করুন</button>
                  <button onClick={saveCategory} style={{...btn('primary'),flex:1}} disabled={!catForm.name || !catForm.company}>💾 সংরক্ষণ করুন</button>
                </div>
              </>
            )}

            {/* Product Form */}
            {(modal.mode === 'add' || modal.mode === 'edit') && activeTab === 'products' && (
              <>
                <h3 style={{margin:'0 0 16px'}}>{modal.mode === 'add' ? '📦 নতুন পণ্য যোগ করুন' : '✏️ পণ্য সম্পাদনা করুন'}</h3>
                <div style={{marginBottom:12,position:'relative'}}>
                  <label style={label}>🏢 কোম্পানি নির্বাচন করুন *</label>
                  <input value={productForm.company||''} onChange={e=>{setProductForm(f=>({...f,company:e.target.value,cat:''}));setCompanyQ(e.target.value);setShowCompanyDrop(true);}} 
                    onFocus={()=>setShowCompanyDrop(true)} placeholder="কোম্পানির নাম..." style={input} />
                  {showCompanyDrop && (
                    <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto'}}>
                      {filteredCompanies.filter(c=>!companyQ || c.name.toLowerCase().includes(companyQ.toLowerCase())).map(c=>(
                        <div key={c.id} onClick={()=>{setProductForm(f=>({...f,company:c.name,cat:''}));setCompanyQ('');setShowCompanyDrop(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,display:'flex',justifyContent:'space-between'}}>
                          <span>{c.name}</span>
                          {c.code && <span style={{fontSize:11,color:T.teal}}>{c.code}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{marginBottom:12,position:'relative'}}>
                  <label style={label}>📂 ক্যাটাগরি নির্বাচন করুন *</label>
                  <input value={productForm.cat||''} onChange={e=>{setProductForm(f=>({...f,cat:e.target.value}));setCatQ(e.target.value);setShowCatDrop(true);}} 
                    onFocus={()=>setShowCatDrop(true)} placeholder="ক্যাটাগরির নাম..." style={input} />
                  {showCatDrop && (
                    <div style={{position:'absolute',left:0,right:0,top:'100%',background:T.white,border:`1px solid ${T.gray200}`,borderRadius:8,boxShadow:'0 4px 12px rgba(0,0,0,0.1)',zIndex:50,maxHeight:200,overflow:'auto'}}>
                      {companyCategories.filter(c=>!catQ || c.toLowerCase().includes(catQ.toLowerCase())).map(c=>(
                        <div key={c} onClick={()=>{setProductForm(f=>({...f,cat:c}));setCatQ('');setShowCatDrop(false);}}
                          style={{padding:'8px 12px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`}}>{c}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{marginBottom:12}}>
                  <label style={label}>📦 পণ্যের নাম *</label>
                  <input value={productForm.name||''} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))} placeholder="পণ্যের নাম" style={input} />
                </div>
                <div style={{marginBottom:16}}>
                  <label style={label}>🔢 বারকোড</label>
                  <input value={productForm.barcode||''} onChange={e=>setProductForm(f=>({...f,barcode:e.target.value}))} placeholder="বারকোড নম্বর" style={input} />
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>setModal(null)} style={{...btn(),flex:1}}>বাতিল</button>
                  <button onClick={saveProduct} style={{...btn('primary'),flex:1}}>💾 সংরক্ষণ</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CUSTOMERS SCREEN
═══════════════════════════════════════════ */
function CustomersScreen({customers, sales, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [viewId, setViewId] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [payAmt, setPayAmt] = useState('');

  const filtered = customers.filter(c=>!search||(c.name+c.phone).includes(search));

  const save = async () => {
    if(!form.name?.trim()) { alert('নাম দিন'); return; }
    const row = {...form,credit:+form.credit||0};
    if(modal.mode==='add') await upd.customers([...customers,{...row,id:genId()}]);
    else await upd.customers(customers.map(c=>c.id===modal.id?{...row,id:modal.id}:c));
    setModal(null);
  };

  const del = async (id) => { if(confirm('মুছে ফেলবেন?')) await upd.customers(customers.filter(c=>c.id!==id)); };

  const recordPayment = async () => {
    const amt = parseFloat(payAmt)||0;
    if (amt<=0) { alert('পরিমাণ দিন'); return; }
    await upd.customers(customers.map(c=>c.id===payModal.id ? {...c,credit:Math.max(0,(c.credit||0)-amt)} : c));
    setPayModal(null); setPayAmt('');
  };

  const exportCSV = () => {
    const rows = [['নাম','ফোন','ঠিকানা','বাকি'],...customers.map(c=>[c.name,c.phone||'',c.address||'',c.credit||0])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    a.download='customers.csv'; a.click();
  };

  const viewCust = viewId ? customers.find(c=>c.id===viewId) : null;
  const custSales = viewId ? sales.filter(s=>s.custId===viewId) : [];
  const totalCreditAll = customers.reduce((s,c)=>s+(c.credit||0),0);

  if (viewCust) return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`}}>
        <button style={btn()} onClick={()=>setViewId(null)}>← ফিরে যান</button>
        <div style={{fontSize:15,fontWeight:700}}>{viewCust.name} — লেনদেন ইতিহাস</div>
      </div>
      <div style={{flex:1,overflow:'auto',padding:12}}>
        <div style={{...card,marginBottom:12,display:'flex',gap:24,flexWrap:'wrap'}}>
          <div><div style={label}>নাম</div><div style={{fontWeight:700,fontSize:16}}>{viewCust.name}</div></div>
          <div><div style={label}>ফোন</div><div>{viewCust.phone||'-'}</div></div>
          <div><div style={label}>ঠিকানা</div><div>{viewCust.address||'-'}</div></div>
          <div>
            <div style={label}>মোট বাকি</div>
            <div style={{fontWeight:800,fontSize:22,color:viewCust.credit>0?T.red:T.green}}>{fmt(viewCust.credit||0)}</div>
          </div>
          {viewCust.credit>0 && (
            <div style={{display:'flex',alignItems:'flex-end'}}>
              <button style={btn('success')} onClick={()=>{setPayModal(viewCust);setPayAmt('');}}>💵 পেমেন্ট নিন</button>
            </div>
          )}
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
          <thead>
            <tr style={{background:T.tealLight}}>
              {['তারিখ','বিল নং','পণ্য','মোট','পরিশোধ','বাকি'].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {custSales.length===0 ? <tr><td colSpan={6} style={{padding:30,textAlign:'center',color:T.gray400}}>কোনো লেনদেন নেই</td></tr>
            : [...custSales].reverse().map((s,i)=>(
              <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                <td style={{padding:'10px 12px',fontSize:13}}>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                <td style={{padding:'10px 12px',fontSize:12,fontFamily:'monospace',color:T.teal}}>#{s.id.slice(-8).toUpperCase()}</td>
                <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{(s.items||[]).length}টি পণ্য</td>
                <td style={{padding:'10px 12px',fontWeight:600}}>{fmt(s.total)}</td>
                <td style={{padding:'10px 12px',color:T.green,fontWeight:600}}>{fmt(s.paid)}</td>
                <td style={{padding:'10px 12px',fontWeight:700,color:s.due>0?T.red:T.green}}>{fmt(s.due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payModal && (
        <Modal onClose={()=>setPayModal(null)} title={`${payModal.name} — পেমেন্ট গ্রহণ`} width={360}>
          <div style={{marginBottom:12,padding:'10px 14px',background:T.redLight,borderRadius:8,fontSize:14,color:T.red,fontWeight:600}}>
            বর্তমান বাকি: {fmt(payModal.credit)}
          </div>
          <label style={label}>পরিশোধের পরিমাণ (৳)</label>
          <input value={payAmt} onChange={e=>setPayAmt(e.target.value)} type="number" min="0" max={payModal.credit} style={input} autoFocus/>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>setPayModal(null)} style={btn()}>বাতিল</button>
            <button onClick={recordPayment} style={btn('success')}>✓ পেমেন্ট নিন</button>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="নাম বা ফোন নম্বর..." style={{...input,paddingLeft:32}}/>
        </div>
        <button style={btn('primary')} onClick={()=>{setForm({name:'',phone:'',address:'',credit:0});setModal({mode:'add'});}}>+ কাস্টমার যোগ</button>
        <button style={btn()} onClick={exportCSV}>📤 CSV রপ্তানি</button>
        {totalCreditAll>0 && <span style={{fontSize:12,color:T.red,fontWeight:600}}>মোট বাকি: {fmt(totalCreditAll)}</span>}
      </div>
      <div style={{flex:1,overflow:'auto',padding:12}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))',gap:10}}>
          {filtered.map(c=>(
            <div key={c.id} style={{...card,cursor:'pointer',transition:'box-shadow 0.15s'}} onClick={()=>setViewId(c.id)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{c.name}</div>
                  <div style={{fontSize:13,color:T.gray600}}>📞 {c.phone||'ফোন নেই'}</div>
                  {c.address && <div style={{fontSize:12,color:T.gray400,marginTop:2}}>📍 {c.address}</div>}
                </div>
                <div style={{textAlign:'right'}}>
                  {(c.credit||0)>0 ? (
                    <div>
                      <div style={{fontSize:11,color:T.red,fontWeight:700}}>বাকি আছে</div>
                      <div style={{fontSize:18,fontWeight:800,color:T.red}}>{fmt(c.credit)}</div>
                    </div>
                  ) : (
                    <div style={{fontSize:12,color:T.green,fontWeight:600}}>✓ কোনো বাকি নেই</div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                <button style={{...btn('ghost','sm'),flex:1,justifyContent:'center'}} onClick={e=>{e.stopPropagation();setViewId(c.id);}}>📋 ইতিহাস</button>
                <button style={btn('ghost','sm')} onClick={e=>{e.stopPropagation();setForm({...c});setModal({mode:'edit',id:c.id});}}>✏️</button>
                <button style={btn('danger','sm')} onClick={e=>{e.stopPropagation();del(c.id);}}>🗑️</button>
              </div>
            </div>
          ))}
          {filtered.length===0 && <div style={{textAlign:'center',padding:'60px 20px',color:T.gray400,gridColumn:'1/-1'}}><div style={{fontSize:44,marginBottom:8}}>👥</div><div>কোনো কাস্টমার নেই</div></div>}
        </div>
      </div>

      {modal && (
        <Modal onClose={()=>setModal(null)} title={modal.mode==='add'?'নতুন কাস্টমার':'কাস্টমার সম্পাদনা'} width={380}>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{k:'name',l:'নাম *'},{k:'phone',l:'ফোন নম্বর'},{k:'address',l:'ঠিকানা'},{k:'credit',l:'প্রাথমিক বাকি (৳)',t:'number'}].map(f=>(
              <div key={f.k}>
                <label style={label}>{f.l}</label>
                <input value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} type={f.t||'text'} style={input}/>
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:16}}>
            <button onClick={()=>setModal(null)} style={btn()}>বাতিল</button>
            <button onClick={save} style={btn('primary')}>💾 সংরক্ষণ</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   INVENTORY SCREEN
═══════════════════════════════════════════ */
function InventoryScreen({products, suppliers, upd}) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjType, setAdjType] = useState('add');
  const [adjNote, setAdjNote] = useState('');

  const realProducts = products.filter(p=>!p.name?.includes('(ক্যাটাগরি)'));
  const filtered = realProducts.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase()));
  const lowStock = realProducts.filter(p=>p.stock>0&&p.stock<=p.minStock);
  const outOfStock = realProducts.filter(p=>p.stock<=0);
  const totalValue = realProducts.reduce((s,p)=>s+p.sellP*p.stock,0);

  const adjust = async () => {
    const qty = parseInt(adjQty)||0;
    if(qty<=0) { alert('পরিমাণ দিন'); return; }
    const newS = adjType==='add' ? modal.stock+qty : Math.max(0,modal.stock-qty);
    await upd.products(products.map(p=>p.id===modal.id?{...p,stock:newS}:p));
    setModal(null); setAdjQty(''); setAdjNote('');
  };

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:8,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'1 1 200px'}}>
          <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:T.gray400}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." style={{...input,paddingLeft:32}}/>
        </div>
        <div style={{fontSize:12,color:T.gray600}}>স্টক মূল্য: <strong style={{color:T.teal}}>{fmt(totalValue)}</strong></div>
      </div>

      {(lowStock.length>0||outOfStock.length>0) && (
        <div style={{padding:'8px 12px',display:'flex',gap:8,flexWrap:'wrap',borderBottom:`1px solid ${T.gray200}`,background:T.amberLight}}>
          {outOfStock.length>0 && (
            <span style={{fontSize:12,color:T.red,fontWeight:600}}>🚨 স্টক শেষ ({outOfStock.length}টি): {outOfStock.map(p=>p.name).join(', ')}</span>
          )}
          {lowStock.length>0 && (
            <span style={{fontSize:12,color:T.amber,fontWeight:600}}>⚠️ কম স্টক ({lowStock.length}টি): {lowStock.map(p=>p.name).join(', ')}</span>
          )}
        </div>
      )}

      <div style={{flex:1,overflow:'auto',padding:12}}>
        <table style={{width:'100%',borderCollapse:'collapse',background:T.white,borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.08)',border:`1px solid ${T.gray200}`}}>
          <thead>
            <tr style={{background:T.tealLight}}>
              {['কোম্পানি কোড','পণ্যের নাম','কোম্পানি','ক্যাটাগরি','স্টক','একক','মিনস্টক','স্টক মূল্য','অবস্থা',''].map(h=>(
                <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:T.teal}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i)=>{
              const st = p.stock<=0?'out':p.stock<=p.minStock?'low':'ok';
              const stColor = {out:T.red,low:T.amber,ok:T.green}[st];
              const stLabel = {out:'শেষ',low:'কম',ok:'পর্যাপ্ত'}[st];
              const supCode = suppliers.find(s=>(s.name||'').toLowerCase()===(p.company||'').toLowerCase())?.code||'';
              return (
                <tr key={p.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                  <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:T.teal}}>{supCode||'-'}</td>
                  <td style={{padding:'10px 12px',fontWeight:600}}>{p.name}</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray600}}>{p.company||'-'}</td>
                  <td style={{padding:'10px 12px',fontSize:13,color:T.gray600}}>{p.cat||'-'}</td>
                  <td style={{padding:'10px 12px',fontWeight:800,fontSize:18,color:stColor}}>{fmtN(p.stock)}</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{p.unit}</td>
                  <td style={{padding:'10px 12px',fontSize:13}}>{p.minStock}</td>
                  <td style={{padding:'10px 12px',fontSize:13,fontWeight:600}}>{fmt(p.sellP*p.stock)}</td>
                  <td style={{padding:'10px 12px'}}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:stColor+'20',color:stColor}}>{stLabel}</span>
                  </td>
                  <td style={{padding:'10px 12px'}}>
                    <button style={btn('primary','sm')} onClick={()=>{setModal(p);setAdjType('add');setAdjQty('');setAdjNote('');}}>+ স্টক</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal onClose={()=>setModal(null)} title={`স্টক আপডেট: ${modal.name}`} width={360}>
          <div style={{padding:'10px 14px',background:T.tealLight,borderRadius:8,marginBottom:14,display:'flex',justifyContent:'space-between'}}>
            <span style={{fontSize:13,color:T.gray600}}>বর্তমান স্টক</span>
            <span style={{fontWeight:800,fontSize:18,color:T.teal}}>{modal.stock} {modal.unit}</span>
          </div>
          <div style={{display:'flex',gap:6,marginBottom:14}}>
            {[{v:'add',l:'স্টক যোগ করুন',icon:'+'},{v:'subtract',l:'স্টক কমান',icon:'-'}].map(t=>(
              <button key={t.v} onClick={()=>setAdjType(t.v)} style={{
                ...btn(adjType===t.v?'primary':'ghost'), flex:1, justifyContent:'center',
              }}>{t.icon} {t.l}</button>
            ))}
          </div>
          <label style={label}>পরিমাণ ({modal.unit})</label>
          <input value={adjQty} onChange={e=>setAdjQty(e.target.value)} type="number" min="1" style={{...input,marginBottom:12}} autoFocus/>
          {adjQty && (
            <div style={{padding:'8px 12px',background:adjType==='add'?T.greenLight:T.redLight,borderRadius:8,fontSize:13,fontWeight:600,color:adjType==='add'?T.green:T.red,marginBottom:12}}>
              আপডেটের পর: {adjType==='add'?modal.stock+(parseInt(adjQty)||0):Math.max(0,modal.stock-(parseInt(adjQty)||0))} {modal.unit}
            </div>
          )}
          <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={btn()}>বাতিল</button>
            <button onClick={adjust} style={btn('primary')}>আপডেট করুন</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   REPORTS SCREEN
═══════════════════════════════════════════ */
function ReportsScreen({sales, customers}) {
  const [period, setPeriod] = useState('today');
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const filterSales = () => {
    const n = new Date();
    return sales.filter(s => {
      const d = new Date(s.date);
      if(period==='today')  return d.toDateString()===n.toDateString();
      if(period==='week')   return d >= new Date(n.getFullYear(),n.getMonth(),n.getDate()-6);
      if(period==='month')  return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear();
      if(period==='custom') return d>=new Date(from)&&d<=new Date(to+'T23:59:59');
      return true;
    });
  };

  const fs = filterSales();
  const totalSales = fs.reduce((s,i)=>s+i.total,0);
  const totalPaid  = fs.reduce((s,i)=>s+i.paid,0);
  const totalDue   = fs.reduce((s,i)=>s+i.due,0);
  const totalProfit= fs.reduce((s,i)=>s+(i.items||[]).reduce((a,it)=>a+(it.profit||0),0),0);
  const allCredit  = customers.reduce((s,c)=>s+(c.credit||0),0);
  const profitPct  = totalSales>0 ? (totalProfit/totalSales*100).toFixed(1) : 0;

  const exportCSV = () => {
    const rows = [['তারিখ','বিল নং','কাস্টমার','মোট','পরিশোধ','বাকি','লাভ'],
      ...fs.map(s=>[new Date(s.date).toLocaleDateString('en-GB'),s.id.slice(-8),s.custName,s.total,s.paid,s.due,
        (s.items||[]).reduce((a,i)=>a+(i.profit||0),0).toFixed(2)])];
    const csv = rows.map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    a.download='sales-report.csv'; a.click();
  };

  const statCards = [
    {l:'মোট বিক্রয়',v:fmt(totalSales),icon:'💰',c:T.teal,bg:T.tealLight},
    {l:'মোট লাভ',v:fmt(totalProfit),icon:'📈',c:T.green,bg:T.greenLight},
    {l:'লাভের হার',v:`${profitPct}%`,icon:'🎯',c:T.green,bg:T.greenLight},
    {l:'পরিশোধ হয়েছে',v:fmt(totalPaid),icon:'✅',c:T.green,bg:T.greenLight},
    {l:'বাকি বিক্রয়',v:fmt(totalDue),icon:'⏳',c:T.amber,bg:T.amberLight},
    {l:'বিলের সংখ্যা',v:fs.length,icon:'🧾',c:T.teal,bg:T.tealLight},
    {l:'সব কাস্টমার বাকি',v:fmt(allCredit),icon:'💳',c:T.red,bg:T.redLight},
  ];

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{padding:'10px 12px',display:'flex',gap:6,alignItems:'center',background:T.white,borderBottom:`1px solid ${T.gray200}`,flexWrap:'wrap'}}>
        {[{v:'today',l:'আজ'},{v:'week',l:'এই সপ্তাহ'},{v:'month',l:'এই মাস'},{v:'all',l:'সব সময়'},{v:'custom',l:'নির্দিষ্ট তারিখ'}].map(p=>(
          <button key={p.v} onClick={()=>setPeriod(p.v)} style={{
            ...btn(period===p.v?'primary':'ghost','sm'),
            background:period===p.v?T.teal:T.gray100, color:period===p.v?T.white:T.gray600, border:'none',
          }}>{p.l}</button>
        ))}
        {period==='custom' && <>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...input,width:140,fontSize:13}}/>
          <span style={{color:T.gray400,fontSize:13}}>থেকে</span>
          <input type="date" value={to}   onChange={e=>setTo(e.target.value)}   style={{...input,width:140,fontSize:13}}/>
        </>}
        <button style={btn('ghost','sm')} onClick={exportCSV}>📤 CSV রপ্তানি</button>
      </div>

      <div style={{flex:1,overflow:'auto',padding:12}}>
        {/* Stat cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10,marginBottom:14}}>
          {statCards.map(s=>(
            <div key={s.l} style={{...card,textAlign:'center',background:s.bg,border:'none'}}>
              <div style={{fontSize:26,marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
              <div style={{fontSize:12,color:T.gray600,marginTop:2,fontWeight:500}}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* P&L */}
        <div style={{...card,marginBottom:14}}>
          <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:700,color:T.gray600,textTransform:'uppercase',letterSpacing:'0.5px'}}>লাভ-ক্ষতির হিসাব</h3>
          {[
            {l:'মোট বিক্রয় আয়',v:totalSales,c:T.gray900},
            {l:'পণ্যের ক্রয়মূল্য (COGS)',v:-(totalSales-totalProfit),c:T.red},
            {l:'মোট লাভ',v:totalProfit,c:T.green,bold:true,line:true},
            {l:'লাভের হার',v:`${profitPct}%`,c:T.teal,bold:true,str:true},
          ].map((r,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderTop:r.line?`2px solid ${T.gray200}`:'none',marginTop:r.line?4:0}}>
              <span style={{color:T.gray600,fontSize:14}}>{r.l}</span>
              <span style={{fontWeight:r.bold?800:600,fontSize:r.bold?16:14,color:r.c}}>{r.str?r.v:fmt(r.v)}</span>
            </div>
          ))}
        </div>

        {/* Sales history */}
        <div style={card}>
          <h3 style={{margin:'0 0 12px',fontSize:14,fontWeight:700,color:T.gray600,textTransform:'uppercase',letterSpacing:'0.5px'}}>বিক্রয় ইতিহাস ({fs.length}টি বিল)</h3>
          <div style={{overflow:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:T.gray50}}>
                  {['তারিখ','বিল নং','কাস্টমার','পণ্য','মোট','পরিশোধ','বাকি','লাভ'].map(h=>(
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:11,fontWeight:700,color:T.gray400,borderBottom:`1px solid ${T.gray200}`,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fs.length===0 ? <tr><td colSpan={8} style={{padding:30,textAlign:'center',color:T.gray400}}>নির্বাচিত সময়ে কোনো বিক্রয় নেই</td></tr>
                : [...fs].reverse().map((s,i)=>(
                  <tr key={s.id} style={{background:i%2===0?T.white:'#FAFAFA',borderBottom:`1px solid ${T.gray100}`}}>
                    <td style={{padding:'9px 10px',fontSize:12,whiteSpace:'nowrap'}}>{new Date(s.date).toLocaleDateString('en-GB')}</td>
                    <td style={{padding:'9px 10px',fontSize:12,fontFamily:'monospace',color:T.teal}}>#{s.id.slice(-6).toUpperCase()}</td>
                    <td style={{padding:'9px 10px',fontSize:12}}>{s.custName}</td>
                    <td style={{padding:'9px 10px',fontSize:12,color:T.gray400}}>{(s.items||[]).length}টি</td>
                    <td style={{padding:'9px 10px',fontWeight:600,fontSize:13}}>{fmt(s.total)}</td>
                    <td style={{padding:'9px 10px',color:T.green,fontSize:13}}>{fmt(s.paid)}</td>
                    <td style={{padding:'9px 10px',fontWeight:s.due>0?700:400,color:s.due>0?T.red:T.gray400}}>{fmt(s.due)}</td>
                    <td style={{padding:'9px 10px',color:T.green,fontSize:13}}>{fmt((s.items||[]).reduce((a,it)=>a+(it.profit||0),0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS SCREEN
═══════════════════════════════════════════ */
function SettingsScreen({settings, products, suppliers, purchases, upd}) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    await upd.settings(form);
    setSaved(true); setTimeout(()=>setSaved(false),2000);
  };

  return (
    <div style={{height:'100%',overflow:'auto',padding:20,width:'100%'}}>
      <div style={{maxWidth:'none',display:'flex',flexDirection:'column',gap:14,width:'100%'}}>
        {/* Business Info */}
        <div style={{...card,width:'100%'}}>
          <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:700}}>🏪 ব্যবসার তথ্য</h3>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[{k:'name',l:'ব্যবসার নাম *'},{k:'address',l:'ঠিকানা'},{k:'phone',l:'ফোন নম্বর'}].map(f=>(
              <div key={f.k}>
                <label style={label}>{f.l}</label>
                <input value={form[f.k]||''} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} style={input}/>
              </div>
            ))}
          </div>
        </div>

        {/* VAT Settings */}
        <div style={{...card,width:'100%'}}>
          <h3 style={{margin:'0 0 18px',fontSize:15,fontWeight:700}}>💰 ভ্যাট/ট্যাক্স সেটিংস</h3>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <label style={{...label,margin:0}}>ভ্যাট সক্রিয় করুন</label>
              <button 
                onClick={()=>setForm(p=>({...p,vatEnabled:!p.vatEnabled}))}
                style={{
                  padding:'8px 20px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer',
                  background: form.vatEnabled ? T.green : T.gray200,
                  color: form.vatEnabled ? T.white : T.gray600,
                  border:'none', transition:'all 0.2s',
                }}>
                {form.vatEnabled ? '✅ চালু' : '❌ বন্ধ'}
              </button>
            </div>
            {form.vatEnabled && (
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <label style={{...label,margin:0}}>ডিফল্ট ভ্যাট শতাংশ</label>
                <input 
                  value={form.vatPercent||15} 
                  onChange={e=>setForm(p=>({...p,vatPercent:parseFloat(e.target.value)||0}))} 
                  type="number" min="0" max="100" 
                  style={{...input,width:80,padding:'8px 12px',fontSize:14}}/>
                <span style={{fontSize:14,color:T.gray600}}>%</span>
              </div>
            )}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <button onClick={save} style={btn('primary')}>💾 সেটিংস সংরক্ষণ</button>
          {saved && <span style={{color:T.green,fontSize:13,fontWeight:600}}>✓ সংরক্ষিত হয়েছে!</span>}
        </div>

        {/* Stats */}
        <div style={card}>
          <h3 style={{margin:'0 0 12px',fontSize:15,fontWeight:700}}>📊 সংক্ষিপ্ত পরিসংখ্যান</h3>
          {[
            {l:'মোট পণ্য',v:`${products.length}টি`},
            {l:'স্টক শেষ',v:`${products.filter(p=>p.stock<=0).length}টি`,c:T.red},
            {l:'কম স্টক',v:`${products.filter(p=>p.stock>0&&p.stock<=p.minStock).length}টি`,c:T.amber},
            {l:'মোট স্টক মূল্য',v:fmt(products.reduce((s,p)=>s+p.sellP*p.stock,0)),c:T.teal},
          ].map(s=>(
            <div key={s.l} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:`1px solid ${T.gray100}`}}>
              <span style={{color:T.gray600,fontSize:14}}>{s.l}</span>
              <span style={{fontWeight:700,color:s.c||T.gray900}}>{s.v}</span>
            </div>
          ))}
        </div>

        {/* Data management */}
        <div style={{...card,borderColor:T.red+'40'}}>
          <h3 style={{margin:'0 0 10px',fontSize:15,fontWeight:700,color:T.red}}>⚠️ ডেটা ম্যানেজমেন্ট</h3>
          <p style={{fontSize:13,color:T.gray600,margin:'0 0 14px',lineHeight:1.6}}>সতর্কতা: নিচের অপশনগুলো ব্যবহারে ডেটা স্থায়ীভাবে মুছে যাবে।</p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button style={btn('danger','sm')} onClick={async()=>{
              if(confirm('সব বিক্রয় ইতিহাস মুছে ফেলবেন?')) { await upd.sales([]); alert('বিক্রয় ইতিহাস মুছা হয়েছে।'); }
            }}>বিক্রয় ইতিহাস মুছুন</button>
            <button style={btn('danger','sm')} onClick={async()=>{
              if(confirm('⚠️ সব ডেটা মুছে ফেলবেন? এটি পূর্বাবস্থায় ফেরানো যাবে না।')) {
                localStorage.clear();
                db.set('pos_reset_done', true);
                alert('সব ডেটা মুছে ফেলা হয়েছে।');
                window.location.reload();
              }
            }}>সম্পূর্ণ রিসেট</button>
          </div>
        </div>
      </div>
    </div>
  );
}
