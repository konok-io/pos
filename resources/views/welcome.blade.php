<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1a1a2e">
    <meta name="description" content="POS Management System - Sales, Stock & Accounting">
    <title>POS Management System</title>
    
    <!-- PWA -->
    <link rel="manifest" href="/manifest.json">
    <link rel="apple-touch-icon" href="/icons/icon-192x192.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="/assets/app.css">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div id="app">
        <!-- Header -->
        <header class="header">
            <div class="header-left">
                <div class="logo">
                    <span class="logo-icon">💼</span>
                    <span class="logo-text">POS</span>
                </div>
            </div>
            <div class="header-center">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="searchInput" placeholder="পণ্য খুঁজুন..." autocomplete="off">
                    <span class="barcode-icon">📊</span>
                </div>
            </div>
            <div class="header-right">
                <button class="icon-btn" id="offlineIndicator" title="অনলাইন">
                    <span class="status-dot online"></span>
                </button>
                <button class="icon-btn" id="installBtn" title="অ্যাপ ইনস্টল করুন" style="display: none;">
                    📲
                </button>
                <button class="icon-btn" title="সেটিংস" onclick="window.location.href='/settings'">
                    ⚙️
                </button>
                <div class="user-menu">
                    <span class="user-name">অ্যাডমিন</span>
                    <span class="user-avatar">👤</span>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="main-content">
            <!-- Categories Sidebar -->
            <aside class="sidebar">
                <h3 class="sidebar-title">ক্যাটাগরি</h3>
                <nav class="category-nav">
                    <button class="category-btn active" data-category="all">
                        <span>📦</span> সব পণ্য
                    </button>
                </nav>
                <div class="sidebar-actions">
                    <button class="action-btn" onclick="showCategoryModal()">
                        <span>+</span> নতুন ক্যাটাগরি
                    </button>
                </div>
            </aside>

            <!-- Products Grid -->
            <section class="products-section">
                <div class="products-header">
                    <h2>পণ্য তালিকা</h2>
                    <div class="products-filter">
                        <select id="sortSelect" class="filter-select">
                            <option value="name">নাম অনুযায়ী</option>
                            <option value="price_low">দাম কম → বেশি</option>
                            <option value="price_high">দাম বেশি → কম</option>
                            <option value="stock">স্টক অনুযায়ী</option>
                        </select>
                        <button class="filter-btn" onclick="renderProducts()">🔄</button>
                    </div>
                </div>
                <div class="products-grid" id="productsGrid">
                    <!-- Products loaded dynamically -->
                </div>
            </section>

            <!-- Cart Sidebar -->
            <aside class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h3>🛒 কার্ট</h3>
                    <span class="cart-count" id="cartCount">0</span>
                    <button class="clear-cart-btn" onclick="clearCart()">🗑️</button>
                </div>
                <div class="cart-items" id="cartItems">
                    <!-- Cart items -->
                </div>
                <div class="cart-empty" id="cartEmpty">
                    <span class="empty-icon">🛒</span>
                    <p>কার্ট খালি</p>
                    <small>পণ্য যোগ করতে ক্লিক করুন</small>
                </div>
                <div class="cart-footer">
                    <div class="cart-summary">
                        <div class="summary-row">
                            <span>মোট পণ্য:</span>
                            <span id="totalItems">0</span>
                        </div>
                        <div class="summary-row">
                            <span>সাবটোটাল:</span>
                            <span id="subtotal">৳0</span>
                        </div>
                        <div class="summary-row discount">
                            <span>ছাড়:</span>
                            <span>
                                <input type="number" id="discountInput" value="0" min="0" step="1" onchange="updateCartTotals()">
                            </span>
                        </div>
                        <div class="summary-row vat">
                            <span>VAT (5%):</span>
                            <span id="vatAmount">৳0</span>
                        </div>
                        <div class="summary-row total">
                            <span>মোট:</span>
                            <span id="grandTotal">৳0</span>
                        </div>
                    </div>
                    <div class="payment-section">
                        <div class="payment-methods">
                            <button class="payment-btn active" data-method="cash" onclick="setPaymentMethod('cash')">
                                💵 নগদ
                            </button>
                            <button class="payment-btn" data-method="card" onclick="setPaymentMethod('card')">
                                💳 কার্ড
                            </button>
                            <button class="payment-btn" data-method="mobile" onclick="setPaymentMethod('mobile')">
                                📱 মোবাইল
                            </button>
                        </div>
                        <div class="customer-section">
                            <select id="customerSelect" class="customer-select">
                                <option value="">-- গ্রাহক নির্বাচন --</option>
                                <option value="walkin">প্রথম গ্রাহক (Walk-in)</option>
                            </select>
                        </div>
                        <button class="checkout-btn" onclick="processCheckout()">
                            💰 পেমেন্ট করুন
                        </button>
                    </div>
                </div>
            </aside>
        </main>

        <!-- Quick Actions Bar -->
        <div class="quick-actions">
            <button class="quick-btn" onclick="window.location.href='/dashboard'">
                📊 ড্যাশবোর্ড
            </button>
            <button class="quick-btn" onclick="window.location.href='/pos'">
                📝 বিক্রয়
            </button>
            <button class="quick-btn" onclick="window.location.href='/products'">
                📦 পণ্য
            </button>
            <button class="quick-btn" onclick="window.location.href='/purchases'">
                🛒 ক্রয়
            </button>
            <button class="quick-btn" onclick="window.location.href='/expenses'">
                💸 খরচ
            </button>
            <button class="quick-btn" onclick="window.location.href='/reports'">
                📈 রিপোর্ট
            </button>
            <button class="quick-btn" onclick="window.location.href='/settings'">
                ⚙️ সেটিংস
            </button>
        </div>

        <!-- Toast -->
        <div class="toast" id="toast">
            <span class="toast-icon">✓</span>
            <span class="toast-message">সফলভাবে যোগ হয়েছে</span>
        </div>

        <!-- Receipt Modal -->
        <div class="modal" id="receiptModal">
            <div class="modal-content receipt">
                <div class="receipt-header">
                    <h2>বিক্রয় রসিদ</h2>
                    <p id="receiptDate"></p>
                    <p>Invoice: <span id="receiptInvoice"></span></p>
                </div>
                <div class="receipt-body" id="receiptBody"></div>
                <div class="receipt-footer">
                    <div class="receipt-total">
                        <span>মোট:</span>
                        <span id="receiptTotal">৳0</span>
                    </div>
                    <div class="receipt-paid">
                        <span>পেমেন্ট:</span>
                        <span id="receiptPaid">৳0</span>
                    </div>
                    <div class="receipt-change">
                        <span>টাকা ফেরত:</span>
                        <span id="receiptChange">৳0</span>
                    </div>
                </div>
                <div class="receipt-actions">
                    <button class="btn btn-secondary" onclick="printReceipt()">🖨️ প্রিন্ট</button>
                    <button class="btn btn-primary" onclick="closeReceiptModal()">✓ সম্পন্ন</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="/assets/app.js"></script>
    
    <!-- PWA Registration -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((reg) => console.log('SW registered:', reg.scope))
                    .catch((err) => console.log('SW registration failed:', err));
            });
        }

        // Install PWA
        let deferredPrompt;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                deferredPrompt = null;
                installBtn.style.display = 'none';
            }
        });

        // Offline indicator
        function updateOnlineStatus() {
            const dot = document.querySelector('#offlineIndicator .status-dot');
            if (navigator.onLine) {
                dot.className = 'status-dot online';
            } else {
                dot.className = 'status-dot offline';
            }
        }
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    </script>
</body>
</html>
