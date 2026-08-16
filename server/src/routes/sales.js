import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List sales
router.get('/', async (req, res) => {
  try {
    const { storeId, startDate, endDate, customerId } = req.query;
    
    const where = {};
    if (storeId) where.storeId = storeId;
    if (customerId) where.customerId = customerId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59');
    }

    const sales = await req.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        customer: true,
        items: true,
        currency: true,
      },
    });
    res.json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const sale = await req.prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
        currency: true,
        store: true,
      },
    });
    if (!sale) {
      return res.status(404).json({ success: false, error: 'Sale not found' });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    const { storeId, customerId, currencyId, items, subtotal, discount, vat, total, paid, change, paymentMethod, invoiceNo, offlineId } = req.body;

    // Check for duplicate offline sale
    if (offlineId) {
      const existing = await req.prisma.sale.findFirst({ where: { offlineId } });
      if (existing) {
        return res.json({ success: true, data: existing, message: 'Already synced' });
      }
    }

    // Generate invoice if not provided
    const finalInvoiceNo = invoiceNo || generateInvoiceNo(req.prisma, storeId);

    const sale = await req.prisma.sale.create({
      data: {
        invoiceNo: finalInvoiceNo,
        storeId,
        customerId,
        currencyId,
        subtotal,
        discount: discount || 0,
        vat: vat || 0,
        total,
        paid,
        change: change || 0,
        paymentMethod: paymentMethod || 'CASH',
        offlineId,
        items: {
          create: items.map(item => ({
            productId: item.productId || item.product_id,
            productName: item.productName || item.product_name,
            quantity: item.quantity,
            unitPrice: item.unitPrice || item.unit_price,
            total: item.total,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    // Update product stock
    for (const item of items) {
      await req.prisma.product.update({
        where: { id: item.productId || item.product_id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    console.error('Sale error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Daily report
router.get('/report/daily', async (req, res) => {
  try {
    const { storeId, date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T00:00:00');
    const endOfDay = new Date(targetDate.toISOString().split('T')[0] + 'T23:59:59');

    const where = {
      storeId,
      createdAt: { gte: startOfDay, lte: endOfDay },
      status: 'COMPLETED',
    };

    const [sales, totalAmount, totalItems] = await Promise.all([
      req.prisma.sale.findMany({
        where,
        include: { items: true },
      }),
      req.prisma.sale.aggregate({
        where,
        _sum: { total: true, paid: true },
      }),
      req.prisma.saleItem.aggregate({
        where: { sale: where },
        _sum: { quantity: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        salesCount: sales.length,
        totalAmount: totalAmount._sum.total || 0,
        totalPaid: totalAmount._sum.paid || 0,
        totalItems: totalItems._sum.quantity || 0,
        sales,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Date range report
router.get('/report/date-range', async (req, res) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    const where = {
      storeId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      },
      status: 'COMPLETED',
    };

    const sales = await req.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: true },
    });

    const summary = await req.prisma.sale.aggregate({
      where,
      _count: true,
      _sum: { total: true, paid: true, discount: true },
    });

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        salesCount: summary._count,
        totalAmount: summary._sum.total || 0,
        totalPaid: summary._sum.paid || 0,
        totalDiscount: summary._sum.discount || 0,
        sales,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function generateInvoiceNo(prisma, storeId) {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const prefix = store?.invoicePrefix || 'INV';
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${prefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${timestamp}${random}`;
}

export default router;
