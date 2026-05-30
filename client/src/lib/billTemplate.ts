import { BillFormValues } from '../components/BillForm';

/** Default bill matching HR73B5666-style VLTD invoice — user edits serial, IMEI, invoice no per bill. */
export const DEFAULT_VLTD_BILL: Partial<BillFormValues> = {
  invoiceNo: 'HR73B5666',
  vehicleId: 'HR73B5666',
  vltdSerialNo: 'DRG1T1A042600000091',
  vltdImeiNo: '865820071384080',
  items: [
    { description: 'VLTD Device Supply', quantity: 1, unitPrice: 0 },
    { description: 'Installation & Activation', quantity: 1, unitPrice: 0 },
    { description: 'Annual Subscription / SIM', quantity: 1, unitPrice: 0 },
  ],
};

export function suggestInvoiceNo() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(Date.now()).slice(-4);
  return `INV/${y}${m}${day}/${seq}`;
}

export function newBillDefaults(): Partial<BillFormValues> {
  return {
    ...DEFAULT_VLTD_BILL,
    invoiceNo: suggestInvoiceNo(),
    billDate: new Date().toISOString().slice(0, 10),
  };
}
