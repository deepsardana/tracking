/** Fixed GST rate (%) applied to bill subtotal — does not change per line item. */
export const FIXED_GST_PERCENT = Number(process.env.GST_PERCENT ?? 18);

export const DEFAULT_DEVICE_TAXABLE = 3813.56;
export const DEFAULT_DEVICE_INCL = 4500;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface BillItemInput {
  description: string;
  hsn: string;
  quantity: number;
  per: string;
  unitPrice: number;
  rateInclTax: number;
  discPercent: number;
}

export function normalizeBillItem(item: BillItemInput, gstPercent = FIXED_GST_PERCENT) {
  const quantity = Number(item.quantity) || 0;
  let unitPrice = Number(item.unitPrice) || 0;
  let rateInclTax = Number(item.rateInclTax) || 0;
  const discPercent = Number(item.discPercent) || 0;

  if (rateInclTax > 0 && unitPrice <= 0) {
    unitPrice = roundMoney(rateInclTax / (1 + gstPercent / 100));
  } else if (unitPrice > 0 && rateInclTax <= 0) {
    rateInclTax = roundMoney(unitPrice * (1 + gstPercent / 100));
  }

  let amount = roundMoney(quantity * unitPrice);
  if (discPercent > 0) {
    amount = roundMoney(amount * (1 - discPercent / 100));
  }

  return {
    description: item.description.trim(),
    hsn: (item.hsn || '85269190').trim(),
    quantity,
    per: (item.per || 'PCS').trim(),
    unitPrice,
    rateInclTax,
    discPercent,
    amount,
  };
}

export function calculateBillTotals(items: BillItemInput[], gstPercent = FIXED_GST_PERCENT) {
  const lineItems = items.map((item) => normalizeBillItem(item, gstPercent));
  const subtotal = roundMoney(lineItems.reduce((sum, row) => sum + row.amount, 0));
  const gstAmount = roundMoney((subtotal * gstPercent) / 100);
  const totalAmount = roundMoney(subtotal + gstAmount);
  return { lineItems, subtotal, gstAmount, totalAmount };
}
