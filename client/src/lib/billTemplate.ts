import { Bill } from '../api/bills';
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

export function nextInvoiceNo(bills: Bill[]): string {
  const fy = currentFinancialYear();
  const prefix = `HKT/${fy}/`;
  let max = 0;
  for (const bill of bills) {
    if (bill.invoiceNo?.startsWith(prefix)) {
      const seq = parseInt(bill.invoiceNo.slice(prefix.length), 10);
      if (!isNaN(seq) && seq > max) max = seq;
    }
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

export function newBillDefaults(bills?: Bill[]): Partial<BillFormValues> {
  return {
    ...DEFAULT_VLTD_BILL,
    invoiceNo: bills ? nextInvoiceNo(bills) : suggestInvoiceNo(),
    billDate: new Date().toISOString().slice(0, 10),
    items: [{ ...DEFAULT_LINE_ITEM }],
  };
}
