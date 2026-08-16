import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, search } = req.query;
    const where = { isActive: true };
    if (storeId) where.storeId = storeId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const customers = await req.prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, storeId } = req.body;
    const customer = await req.prisma.customer.create({
      data: { name, phone, email, address, storeId },
    });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await req.prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { sales: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = await req.prisma.customer.update({
      where: { id: req.params.id },
      data: { name, phone, email, address },
    });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
