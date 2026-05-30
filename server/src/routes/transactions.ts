import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const { customerId, type, from, to } = req.query;

  const where: any = {};
  if (customerId) where.customerId = customerId as string;
  if (type) where.type = type as string;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from as string);
    if (to) where.date.lte = new Date(to as string);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { customer: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(transactions);
});

router.post('/', async (req, res) => {
  const { customerId, type, amount, date, description, paymentMode, deviceId, vehicleId } = req.body;

  if (!customerId || !type || amount == null || !date || !paymentMode || !deviceId || !vehicleId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (deviceId.length > 30 || vehicleId.length > 30) {
    return res.status(400).json({ error: 'deviceId and vehicleId must be max 30 chars' });
  }

  const transaction = await prisma.transaction.create({
    data: {
      customerId,
      type,
      amount,
      date: new Date(date),
      description,
      paymentMode,
      deviceId,
      vehicleId,
    },
    include: { customer: { select: { id: true, name: true } } },
  });
  res.status(201).json(transaction);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const data: any = { ...req.body };
  if (data.date) data.date = new Date(data.date);
  if (data.deviceId && data.deviceId.length > 30) {
    return res.status(400).json({ error: 'deviceId must be max 30 chars' });
  }
  if (data.vehicleId && data.vehicleId.length > 30) {
    return res.status(400).json({ error: 'vehicleId must be max 30 chars' });
  }
  try {
    const transaction = await prisma.transaction.update({
      where: { id },
      data,
      include: { customer: { select: { id: true, name: true } } },
    });
    res.json(transaction);
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.transaction.delete({ where: { id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

export default router;
