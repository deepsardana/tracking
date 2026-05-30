/** Fixed GST rate (%) applied to bill subtotal — does not change per line item. */
export const FIXED_GST_PERCENT = Number(process.env.GST_PERCENT ?? 18);

export const DEFAULT_DEVICE_TAXABLE = 0;
export const DEFAULT_DEVICE_INCL = 0;

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
  const factor = 1 + gstPercent / 100;
  const discountFactor = discPercent > 0 ? 1 - discPercent / 100 : 1;
  let amount = 0;
  let lineTotalIncl = 0;

  if (rateInclTax > 0) {
    unitPrice = roundMoney(rateInclTax / factor);
    lineTotalIncl = roundMoney(quantity * rateInclTax * discountFactor);
    amount = roundMoney(lineTotalIncl / factor);
  } else if (unitPrice > 0) {
    rateInclTax = roundMoney(unitPrice * factor);
    amount = roundMoney(quantity * unitPrice * discountFactor);
    lineTotalIncl = roundMoney(amount * factor);
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
    lineTotalIncl,
  };
}

export function calculateBillTotals(items: BillItemInput[], gstPercent = FIXED_GST_PERCENT) {
  const lineItems = items.map((item) => normalizeBillItem(item, gstPercent));
  const subtotal = roundMoney(lineItems.reduce((sum, row) => sum + row.amount, 0));
  const totalAmount = roundMoney(lineItems.reduce((sum, row) => sum + row.lineTotalIncl, 0));
  const gstAmount = roundMoney(totalAmount - subtotal);
  return { lineItems, subtotal, gstAmount, totalAmount };
}
