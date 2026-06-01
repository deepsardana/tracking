import { BillFormValues, BillLineFormValues } from '../components/BillForm';

export const DEFAULT_DEVICE_TAXABLE = 0;
export const DEFAULT_DEVICE_INCL = 0;

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
  invoiceNo: 'HKT/26-27/0001',
  vehicleId: '',
  vltdSerialNo: '',
  vltdImeiNo: '',
  items: [{ ...DEFAULT_LINE_ITEM }],
};

function currentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  return `${String(fyStart).slice(-2)}-${String(fyStart + 1).slice(-2)}`;
}

export function suggestInvoiceNo() {
  return `HKT/${currentFinancialYear()}/0001`;
}

export function newBillDefaults(): Partial<BillFormValues> {
  return {
    ...DEFAULT_VLTD_BILL,
    invoiceNo: suggestInvoiceNo(),
    billDate: new Date().toISOString().slice(0, 10),
    items: [{ ...DEFAULT_LINE_ITEM }],
  };
}
