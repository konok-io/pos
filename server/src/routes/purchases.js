import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    const purchases = await req.prisma.purchase.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { supplier: true, items: true },
    });
    res.json({ success: true, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { storeId, supplierId, currencyId, items, subtotal, discount, total, paid, paymentMethod, invoiceNo } = req.body;

    const purchase = await req.prisma.purchase.create({
      data: {
        invoiceNo: invoiceNo || `PUR${Date.now()}`,
        storeId,
        supplierId,
        currencyId,
        subtotal,
        discount: discount || 0,
        total,
        paid: paid || 0,
        paymentMethod: paymentMethod || 'CASH',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    // Update product stock
    for (const item of items) {
      await req.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const purchase = await req.prisma.purchase.findUnique({
      where: { id: req.params.id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Purchase not found' });
    }
    res.json({ success: true, data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
