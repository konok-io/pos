import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// Routes
import authRoutes from './routes/auth.js';
import storeRoutes from './routes/stores.js';
import currencyRoutes from './routes/currencies.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import customerRoutes from './routes/customers.js';
import supplierRoutes from './routes/suppliers.js';
import saleRoutes from './routes/sales.js';
import purchaseRoutes from './routes/purchases.js';
import expenseRoutes from './routes/expenses.js';
import syncRoutes from './routes/sync.js';
import reportRoutes from './routes/reports.js';
import translationRoutes from './routes/translations.js';

const app = express();
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Make prisma available to routes
app.use((req, res, next) => {
  req.prisma = prisma;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/translations', translationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 POS Server running on http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
