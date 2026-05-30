import { DEFAULT_DEVICE_INCL, DEFAULT_DEVICE_TAXABLE } from './billing';

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
  invoiceNo: 'HKT/042/26-27',
  vehicleId: 'HR73B5666',
  vltdSerialNo: 'DRG1T1A042600000091',
  vltdImeiNo: '865820071384080',
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

export function suggestInvoiceNo() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${INVOICE_PREFIX}/${m}/${y}-27`;
}
