export const FIXED_GST_PERCENT = 18;

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface BillLineDraft {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function calculateBillTotals(items: BillLineDraft[], gstPercent = FIXED_GST_PERCENT) {
  const lines = items.map((item) => ({
    ...item,
    amount: roundMoney(item.quantity * item.unitPrice),
  }));
  const subtotal = roundMoney(lines.reduce((sum, row) => sum + row.amount, 0));
  const gstAmount = roundMoney((subtotal * gstPercent) / 100);
  const totalAmount = roundMoney(subtotal + gstAmount);
  return { lines, subtotal, gstAmount, totalAmount };
}
