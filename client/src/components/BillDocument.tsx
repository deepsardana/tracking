import { Bill } from '../api/bills';

interface BillDocumentProps {
  bill: Bill;
  gstPercent: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function money(value: string | number) {
  return `₹${Number(value).toFixed(2)}`;
}

export function BillDocument({ bill, gstPercent }: BillDocumentProps) {
  return (
    <div className="bill-document bg-white text-gray-900 p-8 max-w-2xl mx-auto">
      <header className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-2xl font-bold tracking-wide">TAX INVOICE</h1>
        <p className="text-sm text-gray-600 mt-1">Bill No: {bill.id.slice(0, 8).toUpperCase()}</p>
        <p className="text-sm text-gray-600">Date: {formatDate(bill.billDate)}</p>
      </header>

      <section className="grid grid-cols-2 gap-6 mb-6 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Bill To</p>
          <p className="font-semibold text-base">{bill.customer.name}</p>
          <p className="text-gray-600">Phone: {bill.customer.phone}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Device / Vehicle</p>
          <p><span className="text-gray-600">Device ID:</span> {bill.deviceId}</p>
          <p><span className="text-gray-600">Vehicle ID:</span> {bill.vehicleId}</p>
        </div>
      </section>

      <table className="w-full text-sm border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 font-semibold">#</th>
            <th className="text-left py-2 font-semibold">Description</th>
            <th className="text-right py-2 font-semibold">Qty</th>
            <th className="text-right py-2 font-semibold">Rate</th>
            <th className="text-right py-2 font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.items.map((item, i) => (
            <tr key={item.id} className="border-b border-gray-200">
              <td className="py-2">{i + 1}</td>
              <td className="py-2">{item.description}</td>
              <td className="py-2 text-right">{Number(item.quantity)}</td>
              <td className="py-2 text-right">{money(item.unitPrice)}</td>
              <td className="py-2 text-right">{money(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto w-64 text-sm space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(bill.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>GST ({gstPercent}%)</span>
          <span>{money(bill.gstAmount)}</span>
        </div>
        <div className="flex justify-between font-bold text-base border-t-2 border-gray-800 pt-2">
          <span>Grand Total</span>
          <span>{money(bill.totalAmount)}</span>
        </div>
      </section>

      {bill.notes && (
        <p className="mt-6 text-sm text-gray-600">
          <span className="font-semibold">Notes:</span> {bill.notes}
        </p>
      )}

      <footer className="mt-10 pt-4 border-t border-gray-300 text-xs text-gray-500 text-center">
        Thank you for your business
      </footer>
    </div>
  );
}
