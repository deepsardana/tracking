import { Router } from 'express';
import { prisma } from '../db';
import { calculateBillTotals, FIXED_GST_PERCENT } from '../config/billing';
import {
  BILL_COMPANY,
  DEFAULT_HSN,
  DEFAULT_VLTD_BILL,
  suggestInvoiceNo,
} from '../config/billTemplate';
import { assignDevicesToBill, releaseBillDevices, resolveInventoryDevices } from '../lib/inventorySync';

const router = Router();

router.get('/config', async (_req, res) => {
  res.json({
    gstPercent: FIXED_GST_PERCENT,
    company: BILL_COMPANY,
    defaultHsn: DEFAULT_HSN,
    defaultBill: {
      ...DEFAULT_VLTD_BILL,
      invoiceNo: await suggestInvoiceNo(),
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
      inventoryDevice: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true } },
          inventoryDevices: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true }, orderBy: { vltdSerialNo: 'asc' } },
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
      inventoryDevice: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true } },
          inventoryDevices: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true }, orderBy: { vltdSerialNo: 'asc' } },
    },
  });
  if (!bill) return res.status(404).json({ error: 'Bill not found' });
  res.json(bill);
});

function parseBillBody(body: Record<string, unknown>) {
  const customerId = body.customerId as string;
  const billDate = body.billDate as string;
  const invoiceNo = (body.invoiceNo as string)?.trim();
  const vehicleId = ((body.vehicleId as string) ?? '').trim();
  const vltdSerialNo = ((body.vltdSerialNo as string) ?? '').trim();
  const vltdImeiNo = ((body.vltdImeiNo as string) ?? '').trim();
  const inventoryDeviceId = (body.inventoryDeviceId as string | null | undefined) ?? null;
  const inventoryDeviceIds = Array.isArray(body.inventoryDeviceIds)
    ? (body.inventoryDeviceIds as unknown[]).map((id) => String(id))
    : inventoryDeviceId
      ? [inventoryDeviceId]
      : [];
  const customerGst = ((body.customerGst as string) ?? '').trim() || null;
  const notes = body.notes as string | undefined;
  const items = body.items;
  return {
    customerId,
    billDate,
    invoiceNo,
    vehicleId,
    vltdSerialNo,
    vltdImeiNo,
    inventoryDeviceId: inventoryDeviceId || null,
    inventoryDeviceIds,
    customerGst,
    notes,
    items,
  };
}

function billDeviceId(serial: string, vehicleId: string, invoiceNo: string) {
  const key = serial.trim() || vehicleId.trim() || invoiceNo.trim();
  return key.slice(0, 30) || 'NA';
}

function validateBillFields(
  invoiceNo: string,
  vehicleId: string,
  vltdSerialNo: string,
  vltdImeiNo: string,
) {
  if (invoiceNo.length > 40) return 'Invoice no exceeds max length';
  if (vehicleId.length > 500) return 'Vehicle reg list exceeds max length';
  if (vltdSerialNo.length > 20000) return 'VLTD serial list exceeds max length';
  if (vltdImeiNo.length > 20000) return 'VLTD IMEI list exceeds max length';
  return null;
}

router.post('/', async (req, res) => {
  const {
    customerId,
    billDate,
    invoiceNo,
    vehicleId,
    vltdSerialNo,
    vltdImeiNo,
    inventoryDeviceId,
    inventoryDeviceIds,
    customerGst,
    notes,
    items,
  } = parseBillBody(req.body);

  if (
    !customerId ||
    !billDate ||
    !invoiceNo ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  const fieldError = validateBillFields(invoiceNo, vehicleId, vltdSerialNo, vltdImeiNo);
  if (fieldError) return res.status(400).json({ error: fieldError });

  for (const item of items) {
    if (!item.description?.trim() || item.quantity == null) {
      return res.status(400).json({ error: 'Each item needs description and quantity' });
    }
  }

  try {
    const resolved = await resolveInventoryDevices(inventoryDeviceIds, vltdSerialNo, vltdImeiNo);
    const { lineItems, subtotal, gstAmount, totalAmount } = calculateBillTotals(items);

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          customerId,
          billDate: new Date(billDate),
          invoiceNo,
          vehicleId,
          vltdSerialNo: resolved.vltdSerialNo,
          vltdImeiNo: resolved.vltdImeiNo,
          inventoryDeviceId: resolved.inventoryDeviceId,
          deviceId: billDeviceId(resolved.vltdSerialNo, vehicleId, invoiceNo),
          subtotal,
          gstAmount,
          totalAmount,
          customerGst,
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
          inventoryDevice: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true } },
          inventoryDevices: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true }, orderBy: { vltdSerialNo: 'asc' } },
        },
      });
      await assignDevicesToBill(tx, created.id, resolved.inventoryDeviceIds);
      return created;
    });

    res.status(201).json(bill);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not create bill' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    customerId,
    billDate,
    invoiceNo,
    vehicleId,
    vltdSerialNo,
    vltdImeiNo,
    inventoryDeviceId,
    inventoryDeviceIds,
    customerGst,
    notes,
    items,
  } = parseBillBody(req.body);

  if (
    !customerId ||
    !billDate ||
    !invoiceNo ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({ error: 'Missing required fields or items' });
  }
  const fieldError = validateBillFields(invoiceNo, vehicleId, vltdSerialNo, vltdImeiNo);
  if (fieldError) return res.status(400).json({ error: fieldError });

  for (const item of items) {
    if (!item.description?.trim() || item.quantity == null) {
      return res.status(400).json({ error: 'Each item needs description and quantity' });
    }
  }

  try {
    const existing = await prisma.bill.findUnique({
      where: { id },
      select: { inventoryDeviceId: true, inventoryDevices: { select: { id: true } } },
    });
    if (!existing) return res.status(404).json({ error: 'Bill not found' });

    const resolved = await resolveInventoryDevices(inventoryDeviceIds, vltdSerialNo, vltdImeiNo, id);
    const { lineItems, subtotal, gstAmount, totalAmount } = calculateBillTotals(items);

    const bill = await prisma.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { billId: id } });
      const updated = await tx.bill.update({
        where: { id },
        data: {
          customerId,
          billDate: new Date(billDate),
          invoiceNo,
          vehicleId,
          vltdSerialNo: resolved.vltdSerialNo,
          vltdImeiNo: resolved.vltdImeiNo,
          inventoryDeviceId: resolved.inventoryDeviceId,
          deviceId: billDeviceId(resolved.vltdSerialNo, vehicleId, invoiceNo),
          subtotal,
          gstAmount,
          totalAmount,
          customerGst,
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
          inventoryDevice: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true } },
          inventoryDevices: { select: { id: true, vltdSerialNo: true, imeiNo: true, deviceNo: true }, orderBy: { vltdSerialNo: 'asc' } },
        },
      });
      await assignDevicesToBill(
        tx,
        id,
        resolved.inventoryDeviceIds,
        [existing.inventoryDeviceId, ...existing.inventoryDevices.map((device) => device.id)].filter(Boolean) as string[],
      );
      return updated;
    });

    res.json(bill);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Could not update bill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await releaseBillDevices(req.params.id);
    await prisma.bill.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'Bill not found' });
  }
});

export default router;
