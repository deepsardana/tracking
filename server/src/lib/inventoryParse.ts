export interface ParsedDeviceRow {
  vltdSerialNo: string;
  imeiNo: string;
  deviceNo?: string;
  iccid?: string;
  qrCode?: string;
  billingCompany?: string;
  dispatchCustomer?: string;
  pcba?: string;
  dispatchHex?: string;
  scanBy?: string;
}

const SERIAL_RE = /DRG1T1A\d+/;
const IMEI_RE = /\b(\d{15})\b/;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function pickColumn(row: Record<string, string>, ...names: string[]) {
  const entries = Object.entries(row);
  for (const name of names) {
    const target = normalizeHeader(name);
    const hit = entries.find(([key]) => normalizeHeader(key).includes(target));
    if (hit?.[1]?.trim()) return hit[1].trim();
  }
  return '';
}

export function parseQrSegment(qr: string): Partial<ParsedDeviceRow> | null {
  const trimmed = qr.trim();
  if (!trimmed.startsWith('DRG1T1A')) return null;

  const parts = trimmed.split('-');
  if (parts.length >= 3) {
    const vltdSerialNo = parts[0];
    const deviceNo = parts[1];
    const imeiNo = parts[2]?.slice(0, 15);
    const iccid = parts[3]?.replace(/\D/g, '').slice(0, 20) || undefined;
    if (vltdSerialNo && imeiNo && imeiNo.length === 15) {
      return { vltdSerialNo, deviceNo, imeiNo, iccid, qrCode: trimmed };
    }
  }
  return null;
}

export function parseInventoryTextLine(line: string): ParsedDeviceRow | null {
  const trimmed = line.trim();
  if (!trimmed || /qr code|serial number|is excel/i.test(trimmed)) return null;

  const chunks = trimmed.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  const qrPart = chunks[0] ?? trimmed;
  const fromQr = parseQrSegment(qrPart.split(/\s/)[0] ?? qrPart);
  if (fromQr?.vltdSerialNo && fromQr.imeiNo) {
    const extra = chunks.slice(1);
    const serialInLine = extra.find((part) => SERIAL_RE.test(part))?.match(SERIAL_RE)?.[0];
    const deviceNo = extra.find((part) => /^\d{4,6}$/.test(part));
    const imeiInLine = trimmed.match(IMEI_RE)?.[1];
    return {
      vltdSerialNo: serialInLine ?? fromQr.vltdSerialNo,
      imeiNo: imeiInLine ?? fromQr.imeiNo,
      deviceNo: deviceNo ?? fromQr.deviceNo,
      iccid: fromQr.iccid,
      qrCode: fromQr.qrCode,
    };
  }

  const serial = trimmed.match(SERIAL_RE)?.[0];
  const imei = trimmed.match(IMEI_RE)?.[1];
  if (serial && imei) {
    const deviceNo = trimmed.match(/\b(\d{4,6})\b/)?.[1];
    return { vltdSerialNo: serial, imeiNo: imei, deviceNo };
  }

  return null;
}

export function parseInventoryText(content: string): ParsedDeviceRow[] {
  const seen = new Set<string>();
  const rows: ParsedDeviceRow[] = [];
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseInventoryTextLine(line);
    if (!parsed || seen.has(parsed.vltdSerialNo)) continue;
    seen.add(parsed.vltdSerialNo);
    rows.push(parsed);
  }
  return rows;
}

export function parseInventorySheetRows(rows: Record<string, unknown>[]): ParsedDeviceRow[] {
  const seen = new Set<string>();
  const parsed: ParsedDeviceRow[] = [];

  for (const raw of rows) {
    const row: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value != null && String(value).trim()) row[String(key)] = String(value).trim();
    }
    if (Object.keys(row).length === 0) continue;

    const qrCode = pickColumn(row, 'qr code', 'qrcode');
    const fromQr = qrCode ? parseQrSegment(qrCode) : null;

    const vltdSerialNo =
      pickColumn(row, 'serial number', 'vltd serial', 'serial no', 'serial') ||
      fromQr?.vltdSerialNo ||
      Object.values(row).find((v) => SERIAL_RE.test(v))?.match(SERIAL_RE)?.[0] ||
      '';

    const imeiNo =
      pickColumn(row, 'imei', 'imei no') ||
      fromQr?.imeiNo ||
      Object.values(row).find((v) => IMEI_RE.test(v))?.match(IMEI_RE)?.[1] ||
      '';

    if (!vltdSerialNo || !imeiNo || imeiNo.length !== 15 || seen.has(vltdSerialNo)) continue;

    seen.add(vltdSerialNo);
    parsed.push({
      vltdSerialNo,
      imeiNo,
      deviceNo: pickColumn(row, 'device', 'device no') || fromQr?.deviceNo,
      iccid: pickColumn(row, 'iccid') || fromQr?.iccid,
      qrCode: qrCode || fromQr?.qrCode,
      billingCompany: pickColumn(row, 'billing company'),
      dispatchCustomer: pickColumn(row, 'customer'),
      pcba: pickColumn(row, 'pcba'),
      dispatchHex: pickColumn(row, 'dispatchhex', 'dispatch hex'),
      scanBy: pickColumn(row, 'scan by', 'dispatchscan by'),
    });
  }

  return parsed;
}

export const INVENTORY_EXPORT_HEADERS = [
  'QR CODE',
  'SERIAL NUMBER',
  'DEVICE',
  'IMEI',
  'ICCID',
  'BILLING COMPANY',
  'CUSTOMER',
  'PCBA',
  'DISPATCH HEX',
  'SCAN BY',
  'STATUS',
  'INVOICE NO',
  'VEHICLE',
] as const;

export function deviceToExportRow(device: {
  vltdSerialNo: string;
  imeiNo: string;
  deviceNo: string | null;
  iccid: string | null;
  qrCode: string | null;
  billingCompany: string | null;
  dispatchCustomer: string | null;
  pcba: string | null;
  dispatchHex: string | null;
  scanBy: string | null;
  status: string;
  bill?: { invoiceNo: string; vehicleId: string } | null;
}) {
  const qr =
    device.qrCode ||
    [device.vltdSerialNo, device.deviceNo, device.imeiNo, device.iccid].filter(Boolean).join('-');
  return {
    'QR CODE': qr,
    'SERIAL NUMBER': device.vltdSerialNo,
    DEVICE: device.deviceNo ?? '',
    IMEI: device.imeiNo,
    ICCID: device.iccid ?? '',
    'BILLING COMPANY': device.billingCompany ?? '',
    CUSTOMER: device.dispatchCustomer ?? '',
    PCBA: device.pcba ?? '',
    'DISPATCH HEX': device.dispatchHex ?? '',
    'SCAN BY': device.scanBy ?? '',
    STATUS: device.status,
    'INVOICE NO': device.bill?.invoiceNo ?? '',
    VEHICLE: device.bill?.vehicleId ?? '',
  };
}
