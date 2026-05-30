import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (_req, res) => {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(customers);
});

router.get('/summary', async (_req, res) => {
  const customers = await prisma.customer.findMany({
    include: { transactions: true },
    orderBy: { createdAt: 'desc' },
  });

  const summary = customers.map((c) => {
    const totalDR = c.transactions
      .filter((t) => t.type === 'DR')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const totalCR = c.transactions
      .filter((t) => t.type === 'CR')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      totalDR,
      totalCR,
      balance: totalDR - totalCR,
    };
  });

  res.json(summary);
});

router.post('/', async (req, res) => {
  const { name, phone } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }
  const customer = await prisma.customer.create({ data: { name, phone } });
  res.status(201).json(customer);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: { name, phone },
    });
    res.json(customer);
  } catch {
    res.status(404).json({ error: 'Customer not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.customer.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Customer not found' });
  }
});

export default router;
