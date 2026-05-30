/** Default VLTD tax invoice layout (matches HR73B5666-style bills). */
export const BILL_COMPANY = {
  name: process.env.BILL_COMPANY_NAME ?? 'GPS Tracking Solutions',
  address: process.env.BILL_COMPANY_ADDRESS ?? 'Haryana, India',
  phone: process.env.BILL_COMPANY_PHONE ?? '',
  gstin: process.env.BILL_COMPANY_GSTIN ?? '',
};

export const DEFAULT_VLTD_BILL = {
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
  return `INV/${y}${m}${day}`;
}
