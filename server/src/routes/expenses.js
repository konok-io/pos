import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { storeId, startDate, endDate, category } = req.query;
    
    const where = {};
    if (storeId) where.storeId = storeId;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate + 'T23:59:59');
    }

    const expenses = await req.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, amount, category, storeId, note, date } = req.body;
    const expense = await req.prisma.expense.create({
      data: { title, amount, category, storeId, note, date: date ? new Date(date) : new Date() },
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, note, date } = req.body;
    const expense = await req.prisma.expense.update({
      where: { id: req.params.id },
      data: { title, amount, category, note, date: date ? new Date(date) : undefined },
    });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await req.prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
