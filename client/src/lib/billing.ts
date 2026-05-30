export const FIXED_GST_PERCENT = 18;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface BillLineDraft {
  description: string;
  hsn: string;
  quantity: number;
  per: string;
  unitPrice: number;
  rateInclTax: number;
  discPercent: number;
}

export function normalizeBillLine(item: BillLineDraft, gstPercent = FIXED_GST_PERCENT) {
  const quantity = Number(item.quantity) || 0;
  let unitPrice = Number(item.unitPrice) || 0;
  let rateInclTax = Number(item.rateInclTax) || 0;
  const discPercent = Number(item.discPercent) || 0;
  const factor = 1 + gstPercent / 100;

  // Inclusive rate is the primary price — derive taxable rate from it when set.
  if (rateInclTax > 0) {
    unitPrice = roundMoney(rateInclTax / factor);
  } else if (unitPrice > 0) {
    rateInclTax = roundMoney(unitPrice * factor);
  }

  let amount = roundMoney(quantity * unitPrice);
  if (discPercent > 0) {
    amount = roundMoney(amount * (1 - discPercent / 100));
  }

  const gstAmount = roundMoney(amount * (gstPercent / 100));
  const lineTotalIncl = roundMoney(amount + gstAmount);

  return { ...item, quantity, unitPrice, rateInclTax, discPercent, amount, gstAmount, lineTotalIncl };
}

export function calculateBillTotals(items: BillLineDraft[], gstPercent = FIXED_GST_PERCENT) {
  const lines = items.map((row) => normalizeBillLine(row, gstPercent));
  const subtotal = roundMoney(lines.reduce((sum, row) => sum + row.amount, 0));
  const gstAmount = roundMoney((subtotal * gstPercent) / 100);
  const totalAmount = roundMoney(subtotal + gstAmount);
  return { lines, subtotal, gstAmount, totalAmount };
}
