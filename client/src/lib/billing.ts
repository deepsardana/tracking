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
  const discountFactor = discPercent > 0 ? 1 - discPercent / 100 : 1;
  let amount = 0;
  let lineTotalIncl = 0;

  // Inclusive rate is the primary price, so totals stay exactly equal to price x quantity.
  if (rateInclTax > 0) {
    unitPrice = roundMoney(rateInclTax / factor);
    lineTotalIncl = roundMoney(quantity * rateInclTax * discountFactor);
    amount = roundMoney(lineTotalIncl / factor);
  } else if (unitPrice > 0) {
    rateInclTax = roundMoney(unitPrice * factor);
    amount = roundMoney(quantity * unitPrice * discountFactor);
    lineTotalIncl = roundMoney(amount * factor);
  }

  const gstAmount = roundMoney(lineTotalIncl - amount);

  return { ...item, quantity, unitPrice, rateInclTax, discPercent, amount, gstAmount, lineTotalIncl };
}

export function calculateBillTotals(items: BillLineDraft[], gstPercent = FIXED_GST_PERCENT) {
  const lines = items.map((row) => normalizeBillLine(row, gstPercent));
  const subtotal = roundMoney(lines.reduce((sum, row) => sum + row.amount, 0));
  const totalAmount = roundMoney(lines.reduce((sum, row) => sum + row.lineTotalIncl, 0));
  const gstAmount = roundMoney(totalAmount - subtotal);
  return { lines, subtotal, gstAmount, totalAmount };
}
