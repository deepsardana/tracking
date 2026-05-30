import { Router } from 'express';
import { prisma } from '../db';
import { calculateBillTotals, FIXED_GST_PERCENT } from '../config/billing';
import {
  BILL_COMPANY,
  DEFAULT_HSN,
  DEFAULT_VLTD_BILL,
  suggestInvoiceNo,
} from '../config/billTemplate';

const router = Router();

router.get('/config', (_req, res) => {
  res.json({
    gstPercent: FIXED_GST_PERCENT,
    company: BILL_COMPANY,
    defaultHsn: DEFAULT_HSN,
    defaultBill: {
      ...DEFAULT_VLTD_BILL,
      invoiceNo: suggestInvoiceNo(),
    },
  });
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

function parseBillBody(body: Record<string, unknown>) {
  const customerId = body.customerId as string;
  const billDate = body.billDate as string;
  const invoiceNo = (body.invoiceNo as string)?.trim();
  const vehicleId = (body.vehicleId as string)?.trim();
  const vltdSerialNo = (body.vltdSerialNo as string)?.trim();
  const vltdImeiNo = (body.vltdImeiNo as string)?.trim();
  const notes = body.notes as string | undefined;
  const items = body.items;
  return { customerId, billDate, invoiceNo, vehicleId, vltdSerialNo, vltdImeiNo, notes, items };
}

router.post('/', async (req, res) => {
  const { customerId, billDate, invoiceNo, vehicleId, vltdSerialNo, vltdImeiNo, notes, items } =
    parseBillBody(req.body);

  if (
    !customerId ||
    !billDate ||
    !invoiceNo ||
    !vehicleId ||
    !vltdSerialNo ||
    !vltdImeiNo ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  if (invoiceNo.length > 40 || vehicleId.length > 30 || vltdSerialNo.length > 40 || vltdImeiNo.length > 20) {
    return res.status(400).json({ error: 'Invoice / vehicle / serial / IMEI exceeds max length' });
  }

  for (const item of items) {
    if (!item.description?.trim() || item.quantity == null) {
      return res.status(400).json({ error: 'Each item needs description and quantity' });
    }
  }

  const { lineItems, subtotal, gstAmount, totalAmount } = calculateBillTotals(items);

  const bill = await prisma.bill.create({
    data: {
      customerId,
      billDate: new Date(billDate),
      invoiceNo,
      vehicleId,
      vltdSerialNo,
      vltdImeiNo,
      deviceId: vltdSerialNo.slice(0, 30),
      subtotal,
      gstAmount,
      totalAmount,
      notes: notes?.trim() || null,
      items: {
        create: lineItems.map((row) => ({
          description: row.description,
          hsn: row.hsn,
          quantity: row.quantity,
          per: row.per,
          unitPrice: row.unitPrice,
          rateInclTax: row.rateInclTax,
          discPercent: row.discPercent,
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
  const { customerId, billDate, invoiceNo, vehicleId, vltdSerialNo, vltdImeiNo, notes, items } =
    parseBillBody(req.body);

  if (
    !customerId ||
    !billDate ||
    !invoiceNo ||
    !vehicleId ||
    !vltdSerialNo ||
    !vltdImeiNo ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  if (invoiceNo.length > 40 || vehicleId.length > 30 || vltdSerialNo.length > 40 || vltdImeiNo.length > 20) {
    return res.status(400).json({ error: 'Invoice / vehicle / serial / IMEI exceeds max length' });
  }

  for (const item of items) {
    if (!item.description?.trim() || item.quantity == null) {
      return res.status(400).json({ error: 'Each item needs description and quantity' });
    }
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
          invoiceNo,
          vehicleId,
          vltdSerialNo,
          vltdImeiNo,
          deviceId: vltdSerialNo.slice(0, 30),
          subtotal,
          gstAmount,
          totalAmount,
          notes: notes?.trim() || null,
          items: {
            create: lineItems.map((row) => ({
              description: row.description,
              hsn: row.hsn,
              quantity: row.quantity,
              per: row.per,
              unitPrice: row.unitPrice,
              rateInclTax: row.rateInclTax,
              discPercent: row.discPercent,
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
