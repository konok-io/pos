# POS Management System - Laravel Version

একটি আধুনিক, দ্রুত এবং অফলাইন-সাপোর্টেড POS সিস্টেম।

## 🚀 বৈশিষ্ট্য

- ✅ **দ্রুত** - লোকাল হোস্টে instant রেসপন্স
- ✅ **PWA** - উইন্ডোজ/ম্যাক অ্যাপ হিসেবে ইনস্টল করুন
- ✅ **অফলাইন** - ইন্টারনেট ছাড়া কাজ করে
- ✅ **আধুনিক UI** - সুন্দর এবং রেসপন্সিভ
- ✅ **বাংলায়** - সম্পূর্ণ বাংলা ইন্টারফেস

## 📦 ইনস্টলেশন (Laragon)

### ধাপ ১: Laragon সেটআপ
```
আপনার Laragon ইতিমধ্যে কনফিগ করা আছে:
- Virtual Host: pos.test
- Document Root: C:/laragon/www/pos
```

### ধাপ ২: ক্লোন করুন
```bash
cd C:/laragon/www
rm -rf pos
git clone https://github.com/konok-io/pos.git
cd pos
```

### ধাপ ৩: Composer ইনস্টল
```bash
composer install
```

### ধাপ ৪: এনভায়রনমেন্ট
```bash
cp .env.example .env
php artisan key:generate
```

### ধাপ ৫: ডাটাবেস
```bash
php artisan migrate
php artisan db:seed
```

### ধাপ ৬: চালান
```
ব্রাউজারে যান: http://pos.test
```

## 📱 ডেস্কটপ অ্যাপ হিসেবে ইনস্টল

1. Chrome/Edge-এ pos.test খুলুন
2. Address Bar-এ "ইনস্টল" বাটন দেখা যাবে
3. ক্লিক করুন - অ্যাপ ইনস্টল হয়ে যাবে!
4. Desktop থেকে চালান যাবে

## 🖥️ স্ক্রিনশট

```
┌─────────────────────────────────────────────────────────┐
│  💼 POS          🔍 পণ্য খুঁজুন...         👤 অ্যাডমিন │
├────────┬────────────────────────────┬───────────────────┤
│ক্যাটাগরি│ পণ্য তালিকা                 │ 🛒 কার্ট          │
│        │ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │                   │
│📦 সব   │ │🍚  │ │🍛  │ │🍗  │ │🍜  │ │  সাদা ভাত  ৳120  │
│🍔 খাবার│ │৳120│ │৳150│ │৳200│ │৳130│ │                   │
│🥤 পানীয়│ └────┘ └────┘ └────┘ └────┘ │  পোলাও     ৳150  │
│🛒 প্রয়ো.│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │                   │
│        │ │🥤  │ │🥤  │ │☕  │ │💧  │ │  ─────────────────│
│        │ │৳30 │ │৳25 │ │৳15 │ │৳20 │ │  মোট: ৳270        │
└────────┴────────────────────────────┴───────────────────┘
```

## 📂 প্রজেক্ট স্ট্রাকচার

```
pos/
├── app/
│   ├── Http/Controllers/Api/    # API Controllers
│   └── Models/                  # Eloquent Models
├── database/
│   └── migrations/              # Database Migrations
├── public/
│   ├── assets/                  # CSS & JS
│   ├── icons/                   # App Icons
│   ├── manifest.json            # PWA Manifest
│   ├── sw.js                    # Service Worker
│   └── index.html               # Main App
├── resources/views/             # Blade Templates
├── routes/
│   ├── api.php                  # API Routes
│   └── web.php                  # Web Routes
├── composer.json
└── .env
```

## 🛠️ API Endpoints

| Method | Endpoint | বিবরণ |
|--------|----------|-------|
| GET | /api/products | সব পণ্য |
| POST | /api/products | নতুন পণ্য |
| GET | /api/sales | সব বিক্রয় |
| POST | /api/sales | নতুন বিক্রয় |
| GET | /api/categories | ক্যাটাগরি |

## 🔧 কমান্ড

```bash
# সার্ভার চালান
php artisan serve

# মাইগ্রেশন
php artisan migrate

# সিড ডাটা
php artisan db:seed

# ক্লিয়ার ক্যাশ
php artisan cache:clear

# কনফিগ ক্যাশ
php artisan config:cache
```

## 📋 প্রয়োজনীয় প্যাকেজ

- Laravel 11
- PHP 8.2+
- SQLite/MySQL/PostgreSQL

## 🌐 অফলাইন ফিচার

- Service Worker ক্যাশ করে static assets
- API requests সার্ভারে না থাকলে cached data দেখায়
- অফলাইন পেজ দেখায় যখন সার্ভার unreachable

## 🎯 ভবিষ্যতের পরিকল্পনা

- [ ] Multi-store সাপোর্ট
- [ ] Multi-currency সাপোর্ট
- [ ] Real-time sync
- [ ] Advanced reports
- [ ] AI-based suggestions

## 📄 লাইসেন্স

MIT License

---

💼 **POS Management System** - বিক্রয়, স্টক ও হিসাব ব্যবস্থাপনা
