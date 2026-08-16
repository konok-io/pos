import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { storeId } = req.query;
    const where = { isActive: true };
    if (storeId) where.storeId = storeId;

    const suppliers = await req.prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, storeId } = req.body;
    const supplier = await req.prisma.supplier.create({
      data: { name, phone, email, address, storeId },
    });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const supplier = await req.prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { purchases: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!supplier) {
      return res.status(404).json({ success: false, error: 'Supplier not found' });
    }
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const supplier = await req.prisma.supplier.update({
      where: { id: req.params.id },
      data: { name, phone, email, address },
    });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
