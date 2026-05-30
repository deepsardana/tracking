import { Router } from 'express';
import { prisma } from '../db';
import { calculateBillTotals, FIXED_GST_PERCENT } from '../config/billing';

const router = Router();

router.get('/config', (_req, res) => {
  res.json({ gstPercent: FIXED_GST_PERCENT });
});

router.get('/', async (req, res) => {
  const { customerId, from, to } = req.query;

  const where: Record<string, unknown> = {};
  if (customerId) where.customerId = customerId as string;
  if (from || to) {
    where.billDate = {};
    if (from) (where.billDate as Record<string, Date>).gte = new Date(from as string);
    if (to) (where.billDate as Record<string, Date>).lte = new Date(to as string);
  }

  const bills = await prisma.bill.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { orderBy: { id: 'asc' } },
    },
    orderBy: { billDate: 'desc' },
  });
  res.json(bills);
});

router.get('/:id', async (req, res) => {
  const bill = await prisma.bill.findUnique({
    where: { id: req.params.id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { orderBy: { id: 'asc' } },
    },
  });
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  res.json(bill);
});

router.post('/', async (req, res) => {
  const { customerId, billDate, deviceId, vehicleId, notes, items } = req.body;

  if (!customerId || !billDate || !deviceId || !vehicleId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  if (deviceId.length > 30 || vehicleId.length > 30) {
    return res.status(400).json({ error: 'deviceId and vehicleId must be max 30 chars' });
  }

  for (const item of items) {
    if (!item.description?.trim() || item.quantity == null || item.unitPrice == null) {
      return res.status(400).json({ error: 'Each item needs description, quantity, and unit price' });
    }
  }

  const { lineItems, subtotal, gstAmount, totalAmount } = calculateBillTotals(items);

  const bill = await prisma.bill.create({
    data: {
      customerId,
      billDate: new Date(billDate),
      deviceId,
      vehicleId,
      subtotal,
      gstAmount,
      totalAmount,
      notes: notes?.trim() || null,
      items: {
        create: lineItems.map((row) => ({
          description: row.description,
          quantity: row.quantity,
          unitPrice: row.unitPrice,
          amount: row.amount,
        })),
      },
    },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      items: { orderBy: { id: 'asc' } },
    },
  });
  res.status(201).json(bill);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { customerId, billDate, deviceId, vehicleId, notes, items } = req.body;

  if (!customerId || !billDate || !deviceId || !vehicleId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  if (deviceId.length > 30 || vehicleId.length > 30) {
    return res.status(400).json({ error: 'deviceId and vehicleId must be max 30 chars' });
  }

  const { lineItems, subtotal, gstAmount, totalAmount } = calculateBillTotals(items);

  try {
    const bill = await prisma.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { billId: id } });
      return tx.bill.update({
        where: { id },
        data: {
          customerId,
          billDate: new Date(billDate),
          deviceId,
          vehicleId,
          subtotal,
          gstAmount,
          totalAmount,
          notes: notes?.trim() || null,
          items: {
            create: lineItems.map((row) => ({
              description: row.description,
              quantity: row.quantity,
              unitPrice: row.unitPrice,
              amount: row.amount,
            })),
          },
        },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          items: { orderBy: { id: 'asc' } },
        },
      });
    });
    res.json(bill);
  } catch {
    res.status(404).json({ error: 'Bill not found' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.bill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Bill not found' });
  }
});

export default router;
