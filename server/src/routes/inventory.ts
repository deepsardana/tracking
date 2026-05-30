import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { DeviceStatus } from '@prisma/client';
import { prisma } from '../db';
import {
  deviceToExportRow,
  INVENTORY_EXPORT_HEADERS,
  parseInventorySheetRows,
  parseInventoryText,
  ParsedDeviceRow,
} from '../lib/inventoryParse';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

function deviceData(row: ParsedDeviceRow) {
  return {
    vltdSerialNo: row.vltdSerialNo,
    imeiNo: row.imeiNo,
    deviceNo: row.deviceNo ?? null,
    iccid: row.iccid ?? null,
    qrCode: row.qrCode ?? null,
    billingCompany: row.billingCompany ?? null,
    dispatchCustomer: row.dispatchCustomer ?? null,
    pcba: row.pcba ?? null,
    dispatchHex: row.dispatchHex ?? null,
    scanBy: row.scanBy ?? null,
  };
}

async function upsertDevices(rows: ParsedDeviceRow[]) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const existing = await prisma.deviceInventory.findUnique({
        where: { vltdSerialNo: row.vltdSerialNo },
        include: { bill: { select: { invoiceNo: true } } },
      });

      if (existing?.status === DeviceStatus.BILLED) {
        skipped += 1;
        errors.push(`${row.vltdSerialNo}: already billed${existing.bill ? ` (${existing.bill.invoiceNo})` : ''}`);
        continue;
      }

      const data = deviceData(row);
      if (existing) {
        await prisma.deviceInventory.update({ where: { id: existing.id }, data });
        updated += 1;
      } else {
        await prisma.deviceInventory.create({ data });
        imported += 1;
      }
    } catch (err) {
      skipped += 1;
      errors.push(`${row.vltdSerialNo}: ${err instanceof Error ? err.message : 'import failed'}`);
    }
  }

  return { imported, updated, skipped, total: rows.length, errors: errors.slice(0, 50) };
}

function parseUploadBuffer(filename: string, buffer: Buffer): ParsedDeviceRow[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.txt') || lower.endsWith('.csv')) {
    return parseInventoryText(buffer.toString('utf8'));
  }

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const fromSheet = parseInventorySheetRows(rows);
  if (fromSheet.length > 0) return fromSheet;

  const asText = XLSX.utils.sheet_to_csv(sheet);
  return parseInventoryText(asText);
}

router.get('/export', async (_req, res) => {
  const devices = await prisma.deviceInventory.findMany({
    include: { bill: { select: { invoiceNo: true, vehicleId: true } } },
    orderBy: { vltdSerialNo: 'asc' },
  });

  const rows = devices.map((device) => deviceToExportRow(device));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...INVENTORY_EXPORT_HEADERS] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Inventory');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="hk-device-inventory.xlsx"');
  res.send(buffer);
});

router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload a .xlsx, .csv, or .txt file' });

  try {
    const rows = parseUploadBuffer(req.file.originalname, req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No devices found in file. Need VLTD Serial + 15-digit IMEI.' });
    }
    const result = await upsertDevices(rows);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Import failed' });
  }
});

router.get('/', async (req, res) => {
  const { status, q } = req.query;
  const where: Record<string, unknown> = {};

  if (status === 'AVAILABLE' || status === 'BILLED') {
    where.status = status;
  }

  if (q && String(q).trim()) {
    const term = String(q).trim();
    where.OR = [
      { vltdSerialNo: { contains: term, mode: 'insensitive' } },
      { imeiNo: { contains: term } },
      { deviceNo: { contains: term, mode: 'insensitive' } },
    ];
  }

  const devices = await prisma.deviceInventory.findMany({
    where,
    include: { bill: { select: { id: true, invoiceNo: true, vehicleId: true, billDate: true } } },
    orderBy: { vltdSerialNo: 'asc' },
  });
  res.json(devices);
});

router.post('/', async (req, res) => {
  const { vltdSerialNo, imeiNo, deviceNo, iccid } = req.body;
  if (!vltdSerialNo?.trim() || !imeiNo?.trim()) {
    return res.status(400).json({ error: 'VLTD Serial No and IMEI are required' });
  }
  if (String(imeiNo).trim().length !== 15) {
    return res.status(400).json({ error: 'IMEI must be 15 digits' });
  }

  try {
    const device = await prisma.deviceInventory.create({
      data: {
        vltdSerialNo: String(vltdSerialNo).trim(),
        imeiNo: String(imeiNo).trim(),
        deviceNo: deviceNo?.trim() || null,
        iccid: iccid?.trim() || null,
      },
    });
    res.status(201).json(device);
  } catch {
    res.status(409).json({ error: 'Serial number already exists in inventory' });
  }
});

router.delete('/:id', async (req, res) => {
  const device = await prisma.deviceInventory.findUnique({
    where: { id: req.params.id },
    include: { bill: true },
  });
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.status === DeviceStatus.BILLED) {
    return res.status(400).json({ error: 'Cannot delete a device that is already billed. Delete the bill first.' });
  }

  await prisma.deviceInventory.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
