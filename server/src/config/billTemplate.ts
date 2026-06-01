import { DEFAULT_DEVICE_INCL, DEFAULT_DEVICE_TAXABLE } from './billing';
import { prisma } from '../db';

/** HK Trading House — bill header defaults */
export const BILL_COMPANY = {
  name: process.env.BILL_COMPANY_NAME ?? 'HK TRADING HOUSE',
  addressLine1: process.env.BILL_COMPANY_ADDRESS_LINE1 ?? 'No 418, Jawahar Nagar',
  addressLine2: process.env.BILL_COMPANY_ADDRESS_LINE2 ?? 'Palwal, Haryana',
  phone: process.env.BILL_COMPANY_PHONE ?? '',
  gstin: process.env.BILL_COMPANY_GSTIN ?? '06BSRPS8447M3ZK',
  stateName: process.env.BILL_COMPANY_STATE ?? 'Haryana',
  stateCode: process.env.BILL_COMPANY_STATE_CODE ?? '06',
  cin: process.env.BILL_COMPANY_CIN ?? '',
  email: process.env.BILL_COMPANY_EMAIL ?? '',
  pan: process.env.BILL_COMPANY_PAN ?? 'BSRPS8447M',
};

export const DEFAULT_HSN = '85269190';

export const INVOICE_PREFIX = process.env.BILL_INVOICE_PREFIX ?? 'HKT';

export const DEFAULT_VLTD_BILL = {
  invoiceNo: 'HKT/26-27/0001',
  vehicleId: '',
  vltdSerialNo: '',
  vltdImeiNo: '',
  items: [
    {
      description: 'AIS 140 DEVICE 2G',
      hsn: DEFAULT_HSN,
      quantity: 1,
      per: 'PCS',
      unitPrice: DEFAULT_DEVICE_TAXABLE,
      rateInclTax: DEFAULT_DEVICE_INCL,
      discPercent: 0,
    },
  ],
};

function currentFinancialYear(): { fy: string; start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return {
    fy: `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`,
    start: new Date(`${fyStart}-04-01T00:00:00.000Z`),
    end: new Date(`${fyEnd}-03-31T23:59:59.999Z`),
  };
}

export async function suggestInvoiceNo(): Promise<string> {
  const { fy, start, end } = currentFinancialYear();
  const count = await prisma.bill.count({
    where: { billDate: { gte: start, lte: end } },
  });
  const next = String(count + 1).padStart(4, '0');
  return `${INVOICE_PREFIX}/${fy}/${next}`;
}
