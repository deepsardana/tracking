/** Fixed GST rate (%) applied to bill subtotal — does not change per line item. */
export const FIXED_GST_PERCENT = Number(process.env.GST_PERCENT ?? 18);

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface BillItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function calculateBillTotals(items: BillItemInput[]) {
  const lineItems = items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const amount = roundMoney(quantity * unitPrice);
    return {
      description: item.description.trim(),
      quantity,
      unitPrice,
      amount,
    };
  });

  const subtotal = roundMoney(lineItems.reduce((sum, row) => sum + row.amount, 0));
  const gstAmount = roundMoney((subtotal * FIXED_GST_PERCENT) / 100);
  const totalAmount = roundMoney(subtotal + gstAmount);

  return { lineItems, subtotal, gstAmount, totalAmount };
}
