/* ==========================================
   POS Management System - Main JavaScript
   Fast, Offline-First, Modern Architecture
   ========================================== */

// State Management
const state = {
    products: [],
    cart: [],
    categories: [],
    customers: [],
    currentCategory: 'all',
    paymentMethod: 'cash',
    searchQuery: '',
    isOnline: navigator.onLine
};

// API Base URL
const API_URL = '/api';

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        await loadInitialData();
        setupEventListeners();
        renderProducts();
        updateCartUI();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('ডেটা লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// ==========================================
// Data Loading
// ==========================================
async function loadInitialData() {
    const [products, categories, customers] = await Promise.all([
        fetchAPI('/products'),
        fetchAPI('/categories'),
        fetchAPI('/customers')
    ]);
    
    state.products = products || getSampleProducts();
    state.categories = categories || getSampleCategories();
    state.customers = customers || [];
    
    renderCategories();
    renderCustomerOptions();
}

function getSampleProducts() {
    return [
        { id: 1, name: 'সাদা ভাত', code: 'RICE001', price: 120, stock: 50, category_id: 1, unit: 'প্লেট', image: '🍚' },
        { id: 2, name: 'পোলাও', code: 'RICE002', price: 150, stock: 30, category_id: 1, unit: 'প্লেট', image: '🍛' },
        { id: 3, name: 'চিকেন কর্ন', code: 'CHK001', price: 200, stock: 25, category_id: 1, unit: 'পিস', image: '🍗' },
        { id: 4, name: 'ফ্রাইড রাইস', code: 'FR001', price: 130, stock: 40, category_id: 1, unit: 'প্লেট', image: '🍜' },
        { id: 5, name: 'সসেজ', code: 'SAG001', price: 80, stock: 60, category_id: 1, unit: 'পিস', image: '🌭' },
        { id: 6, name: 'কোকা কোলা', code: 'COKE001', price: 30, stock: 100, category_id: 2, unit: 'বোতল', image: '🥤' },
        { id: 7, name: 'পেপসি', code: 'PEP001', price: 25, stock: 80, category_id: 2, unit: 'বোতল', image: '🥤' },
        { id: 8, name: 'স্প্রাইট', code: 'SPR001', price: 25, stock: 75, category_id: 2, unit: 'বোতল', image: '🥤' },
        { id: 9, name: 'মিনারেল ওয়াটার', code: 'MIN001', price: 20, stock: 150, category_id: 2, unit: 'বোতল', image: '💧' },
        { id: 10, name: 'চা', code: 'TEA001', price: 15, stock: 200, category_id: 2, unit: 'কাপ', image: '☕' },
        { id: 11, name: 'সাবান', code: 'SOAP001', price: 45, stock: 50, category_id: 3, unit: 'পিস', image: '🧼' },
        { id: 12, name: 'শ্যাম্পু', code: 'SHAM001', price: 150, stock: 30, category_id: 3, unit: 'বোতল', image: '🧴' },
        { id: 13, name: 'টুথপেস্ট', code: 'TP001', price: 85, stock: 40, category_id: 3, unit: 'টিউব', image: '🪥' },
        { id: 14, name: 'পারফিউম', code: 'PERF001', price: 350, stock: 15, category_id: 3, unit: 'বোতল', image: '🌸' },
        { id: 15, name: 'স্মোকিং বিয়ার', code: 'SMO001', price: 10, stock: 200, category_id: 3, unit: 'পিস', image: '🧴' },
    ];
}

function getSampleCategories() {
    return [
        { id: 1, name: 'খাবার', icon: '🍔' },
        { id: 2, name: 'পানীয়', icon: '🥤' },
        { id: 3, name: 'প্রয়োজনীয়', icon: '🛒' },
        { id: 4, name: 'ওষুধ', icon: '💊' },
    ];
}

// ==========================================
// API Functions
// ==========================================
async function fetchAPI(endpoint, options = {}) {
    if (!navigator.onLine) {
        console.log('Offline - returning cached data');
        return getCachedData(endpoint);
    }
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        setCachedData(endpoint, data);
        return data;
    } catch (error) {
        console.log('API Error:', error);
        return getCachedData(endpoint) || null;
    }
}

async function postAPI(endpoint, data) {
    return fetchAPI(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// ==========================================
// Cache Management (for offline support)
// ==========================================
function setCachedData(key, data) {
    try {
        localStorage.setItem(`pos_${key}`, JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.log('Cache error:', e);
    }
}

function getCachedData(key) {
    try {
        const cached = localStorage.getItem(`pos_${key}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Cache valid for 24 hours
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                return data;
            }
        }
    } catch (e) {
        console.log('Cache read error:', e);
    }
    return null;
}

// ==========================================
// Event Listeners
// ==========================================
function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderProducts();
    });
    
    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCategory = btn.dataset.category;
            renderProducts();
        });
    });
    
    // Sort
    document.getElementById('sortSelect').addEventListener('change', (e) => {
        sortProducts(e.target.value);
        renderProducts();
    });
    
    // Discount input
    document.getElementById('discountInput').addEventListener('input', () => {
        updateCartTotals();
    });
    
    // Payment methods
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.paymentMethod = btn.dataset.method;
        });
    });
    
    // Clear cart
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    
    // Checkout
    document.getElementById('checkoutBtn').addEventListener('click', processCheckout);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ==========================================
// Product Rendering
// ==========================================
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    let filtered = state.products;
    
    // Filter by category
    if (state.currentCategory !== 'all') {
        filtered = filtered.filter(p => p.category_id == state.currentCategory);
    }
    
    // Filter by search
    if (state.searchQuery) {
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(state.searchQuery) ||
            p.code.toLowerCase().includes(state.searchQuery)
        );
    }
    
    // Generate HTML
    grid.innerHTML = filtered.map(product => `
        <div class="product-card ${product.stock < 10 ? 'low-stock' : ''}" 
             onclick="addToCart(${product.id})">
            <div class="product-image">${product.image || '📦'}</div>
            <div class="product-name">${product.name}</div>
            <div class="product-price">৳${product.price}</div>
            <div class="product-stock">স্টক: ${product.stock} ${product.unit}</div>
        </div>
    `).join('');
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                <p style="font-size: 48px; margin-bottom: 15px;">🔍</p>
                <p>কোনো পণ্য পাওয়া যায়নি</p>
            </div>
        `;
    }
}

function sortProducts(sortBy) {
    switch (sortBy) {
        case 'name':
            state.products.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'price_low':
            state.products.sort((a, b) => a.price - b.price);
            break;
        case 'price_high':
            state.products.sort((a, b) => b.price - a.price);
            break;
        case 'stock':
            state.products.sort((a, b) => b.stock - a.stock);
            break;
    }
}

// ==========================================
// Category Rendering
// ==========================================
function renderCategories() {
    const nav = document.querySelector('.category-nav');
    nav.innerHTML = `
        <button class="category-btn active" data-category="all">
            <span>📦</span> সব পণ্য
        </button>
        ${state.categories.map(cat => `
            <button class="category-btn" data-category="${cat.id}">
                <span>${cat.icon || '📁'}</span> ${cat.name}
            </button>
        `).join('')}
    `;
    
    // Re-attach event listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentCategory = btn.dataset.category;
            renderProducts();
        });
    });
}

// ==========================================
// Customer Options
// ==========================================
function renderCustomerOptions() {
    const select = document.getElementById('customerSelect');
    select.innerHTML = `
        <option value="">-- গ্রাহক নির্বাচন --</option>
        <option value="walkin">প্রথম গ্রাহক (Walk-in)</option>
        ${state.customers.map(c => `
            <option value="${c.id}">${c.name} - ${c.phone || ''}</option>
        `).join('')}
    `;
}

// ==========================================
// Cart Management
// ==========================================
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    if (product.stock <= 0) {
        showToast('এই পণ্যের স্টক শেষ!', 'error');
        return;
    }
    
    const existingItem = state.cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showToast('স্টকে পর্যাপ্ত নেই!', 'error');
            return;
        }
        existingItem.quantity++;
        existingItem.total = existingItem.quantity * existingItem.price;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
            unit: product.unit,
            image: product.image
        });
    }
    
    updateCartUI();
    showToast(`${product.name} কার্টে যোগ হয়েছে`);
}

function updateCartItem(productId, change) {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    
    const product = state.products.find(p => p.id === productId);
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    if (item.quantity > product.stock) {
        showToast('স্টকে পর্যাপ্ত নেই!', 'error');
        item.quantity = product.stock;
    }
    
    item.total = item.quantity * item.price;
    updateCartUI();
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartUI();
}

function clearCart() {
    if (state.cart.length === 0) return;
    
    if (confirm('আপনি কি কার্ট খালি করতে চান?')) {
        state.cart = [];
        updateCartUI();
        showToast('কার্ট খালি হয়েছে');
    }
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartCount = document.getElementById('cartCount');
    
    cartCount.textContent = state.cart.length;
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '';
        cartEmpty.style.display = 'flex';
        return;
    }
    
    cartEmpty.style.display = 'none';
    
    cartItems.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">${item.image || '📦'}</div>
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">৳${item.price} × ${item.quantity}</div>
            </div>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="updateCartItem(${item.id}, -1)">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartItem(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">৳${item.total}</div>
        </div>
    `).join('');
    
    updateCartTotals();
}

function updateCartTotals() {
    const subtotal = state.cart.reduce((sum, item) => sum + item.total, 0);
    const discount = parseFloat(document.getElementById('discountInput').value) || 0;
    const afterDiscount = subtotal - discount;
    const vat = Math.round(afterDiscount * 0.05); // 5% VAT
    const total = afterDiscount + vat;
    
    document.getElementById('totalItems').textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('subtotal').textContent = `৳${subtotal}`;
    document.getElementById('vatAmount').textContent = `৳${vat}`;
    document.getElementById('grandTotal').textContent = `৳${total}`;
    
    return { subtotal, discount, vat, total };
}

// ==========================================
// Checkout Process
// ==========================================
async function processCheckout() {
    if (state.cart.length === 0) {
        showToast('কার্ট খালি!', 'error');
        return;
    }
    
    const totals = updateCartTotals();
    const customerId = document.getElementById('customerSelect').value;
    
    // Show payment modal
    const paid = prompt(`মোট: ৳${totals.total}\nপেমেন্ট করুন:`, totals.total);
    
    if (paid === null) return;
    
    const paidAmount = parseFloat(paid) || 0;
    const change = paidAmount - totals.total;
    
    if (paidAmount < totals.total) {
        showToast('পর্যাপ্ত পেমেন্ট নয়!', 'error');
        return;
    }
    
    // Prepare sale data
    const saleData = {
        invoice_no: generateInvoiceNo(),
        customer_id: customerId || null,
        items: state.cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        vat: totals.vat,
        total: totals.total,
        paid: paidAmount,
        change: change,
        payment_method: state.paymentMethod,
        date: new Date().toISOString().split('T')[0]
    };
    
    // Try to save to server
    if (navigator.onLine) {
        try {
            await postAPI('/sales', saleData);
        } catch (e) {
            console.log('Could not save to server, storing locally');
        }
    }
    
    // Update local stock
    state.cart.forEach(item => {
        const product = state.products.find(p => p.id === item.id);
        if (product) {
            product.stock -= item.quantity;
        }
    });
    
    // Show receipt
    showReceipt(saleData, change);
    
    // Clear cart
    state.cart = [];
    updateCartUI();
    renderProducts();
}

function generateInvoiceNo() {
    const date = new Date();
    const prefix = 'INV';
    const timestamp = date.getTime().toString().slice(-6);
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${prefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${timestamp}${random}`;
}

// ==========================================
// Receipt
// ==========================================
function showReceipt(saleData, change) {
    document.getElementById('receiptDate').textContent = new Date().toLocaleDateString('bn-BD');
    document.getElementById('receiptInvoice').textContent = saleData.invoice_no;
    
    document.getElementById('receiptBody').innerHTML = saleData.items.map(item => `
        <div class="receipt-item">
            <span>${item.name} × ${item.quantity}</span>
            <span>৳${item.total}</span>
        </div>
    `).join('');
    
    document.getElementById('receiptTotal').textContent = `৳${saleData.total}`;
    document.getElementById('receiptPaid').textContent = `৳${saleData.paid}`;
    document.getElementById('receiptChange').textContent = `৳${change}`;
    
    document.getElementById('receiptModal').classList.add('show');
}

function closeReceiptModal() {
    document.getElementById('receiptModal').classList.remove('show');
}

function printReceipt() {
    window.print();
}

// ==========================================
// Modal Functions
// ==========================================
function showModal(title, content, onSave) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modalSaveBtn').onclick = onSave;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

// ==========================================
// Toast Notifications
// ==========================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = toast.querySelector('.toast-icon');
    
    icon.textContent = type === 'error' ? '✕' : '✓';
    toast.style.background = type === 'error' ? 'var(--danger)' : 'var(--success)';
    toast.querySelector('.toast-message').textContent = message;
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// ==========================================
// Page Navigation
// ==========================================
function showPage(pageName) {
    // For now, just show a message
    // In full implementation, this would route to different views
    showToast(`${pageName} পেজ খুলছে...`);
}

// ==========================================
// Keyboard Shortcuts
// ==========================================
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S - Checkout
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        processCheckout();
    }
    
    // Escape - Close modal
    if (e.key === 'Escape') {
        closeModal();
        closeReceiptModal();
    }
    
    // Ctrl/Cmd + F - Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
}

// ==========================================
// Utility Functions
// ==========================================
function formatCurrency(amount) {
    return `৳${amount.toLocaleString('en-BD')}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
