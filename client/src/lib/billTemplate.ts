import { BillFormValues, BillLineFormValues } from '../components/BillForm';

export const DEFAULT_DEVICE_TAXABLE = 3813.56;
export const DEFAULT_DEVICE_INCL = 4500;

export const DEFAULT_LINE_ITEM: BillLineFormValues = {
  description: 'AIS 140 DEVICE 2G',
  hsn: '85269190',
  quantity: 1,
  per: 'PCS',
  unitPrice: DEFAULT_DEVICE_TAXABLE,
  rateInclTax: DEFAULT_DEVICE_INCL,
  discPercent: 0,
};

export const DEFAULT_VLTD_BILL: Partial<BillFormValues> = {
  invoiceNo: 'HKT/042/26-27',
  vehicleId: 'HR73B5666',
  vltdSerialNo: 'DRG1T1A042600000091',
  vltdImeiNo: '865820071384080',
  items: [{ ...DEFAULT_LINE_ITEM }],
};

export function suggestInvoiceNo() {
  const d = new Date();
  const y = String(d.getFullYear()).slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `HKT/${m}/${y}-27`;
}

export function newBillDefaults(): Partial<BillFormValues> {
  return {
    ...DEFAULT_VLTD_BILL,
    invoiceNo: suggestInvoiceNo(),
    billDate: new Date().toISOString().slice(0, 10),
    items: [{ ...DEFAULT_LINE_ITEM }],
  };
}
