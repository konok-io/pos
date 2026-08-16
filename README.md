# POS Management System v2.0

একটি আধুনিক, দ্রুত এবং অফলাইন-সাপোর্টেড POS সিস্টেম।

## ✨ বৈশিষ্ট্য

| ফিচার | বিবরণ |
|-------|--------|
| 💱 Multi-Currency | BDT, USD, EUR সাপোর্ট |
| 🏪 Multi-Store | একাধিক শাখা পরিচালনা |
| 🔄 Online + Offline Sync | IndexedDB + স্বয়ংক্রিয় সিঙ্ক |
| 📱 PWA | ওয়েব অ্যাপ হিসেবে ইনস্টল |
| ⚡ Fast | React + TypeScript |

## 📂 প্রোজেক্ট স্ট্রাকচার

```
pos/
├── server/                 # Node.js/Express Backend
│   ├── src/
│   │   └── routes/       # API Routes
│   ├── prisma/           # PostgreSQL Schema
│   └── package.json
├── client/                # React/TypeScript Frontend
│   ├── src/
│   │   ├── pages/        # POS, Dashboard
│   │   ├── store/         # Zustand stores
│   │   └── services/      # API & Offline sync
│   ├── vite.config.ts     # PWA config
│   └── package.json
└── README.md
```

## 🚀 সেটআপ (Laragon + SQLite)

**SQLite = কোনো ডাটাবেস সার্ভার লাগবে না! শুধু একটি ফাইল।**

### ধাপ ১: Laragon Virtual Host
```
Menu → Apache/NGINX → Site Enabled → pos.test
Document Root: C:/laragon/www/pos/client
```

### ধাপ ২: Backend সেটআপ
```bash
cd C:/laragon/www/pos/server
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
# চলবে http://localhost:3000
```

### ধাপ ৩: Frontend সেটআপ
```bash
cd C:/laragon/www/pos/client
npm install
npm run dev
# চলবে http://localhost:5173
```

### ধাপ ৪: ব্রাউজারে খুলুন
```
http://pos.test
```

## 🛠️ API Endpoints

| Method | Endpoint | বিবরণ |
|--------|----------|-------|
| GET | /api/products | পণ্য তালিকা |
| POST | /api/sales | নতুন বিক্রয় |
| GET | /api/stores | স্টোর তালিকা |
| GET | /api/currencies | মুদ্রা তালিকা |
| POST | /api/currencies/convert | মুদ্রা কনভার্ট |
| GET | /api/sync/pull/:storeId | পুল ডেটা |
| POST | /api/sync/push/:storeId | পুশ সেলস |
| GET | /api/reports/dashboard | ড্যাশবোর্ড |

## 📋 প্রযুক্তিসমূহ

### Backend
- Node.js + Express
- Prisma ORM
- **SQLite** (ফাইল-বেসড, কোনো সার্ভার লাগবে না!)
- JWT Auth

### Frontend
- React 18
- TypeScript
- Zustand (State)
- Vite + PWA
- IndexedDB (Offline)

## 📄 লাইসেন্স

MIT License

---

💼 **POS Management System v2.0** - আধুনিক POS সলিউশন
