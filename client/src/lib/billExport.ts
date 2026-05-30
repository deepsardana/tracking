import { Bill } from '../api/bills';

const PRINT_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; color: #111; }
  .bill-document { max-width: 720px; margin: 0 auto; padding: 32px; }
  h1 { margin: 0; font-size: 24px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 8px 4px; }
  thead tr { border-bottom: 2px solid #111; }
  tbody tr { border-bottom: 1px solid #ddd; }
  .totals { margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; margin: 6px 0; }
  .totals-grand { font-weight: bold; font-size: 16px; border-top: 2px solid #111; padding-top: 8px; margin-top: 8px; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

function billFileName(bill: Bill) {
  const date = bill.billDate.slice(0, 10);
  const name = bill.customer.name.replace(/[^\w-]+/g, '_').slice(0, 30);
  return `bill_${name}_${date}`;
}

function renderBillHtml(bill: Bill, gstPercent: number): string {
  const rows = bill.items
    .map(
      (item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(item.description)}</td>
        <td style="text-align:right">${Number(item.quantity)}</td>
        <td style="text-align:right">₹${Number(item.unitPrice).toFixed(2)}</td>
        <td style="text-align:right">₹${Number(item.amount).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  const notes = bill.notes
    ? `<p style="margin-top:24px;font-size:14px;color:#555"><strong>Notes:</strong> ${escapeHtml(bill.notes)}</p>`
    : '';

  const date = new Date(bill.billDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Bill - ${escapeHtml(bill.customer.name)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="bill-document">
    <header style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px">
      <h1>TAX INVOICE</h1>
      <p style="font-size:14px;color:#555;margin:4px 0">Bill No: ${bill.id.slice(0, 8).toUpperCase()}</p>
      <p style="font-size:14px;color:#555;margin:0">Date: ${date}</p>
    </header>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;font-size:14px">
      <div>
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#666;margin:0 0 4px">Bill To</p>
        <p style="font-weight:600;font-size:16px;margin:0">${escapeHtml(bill.customer.name)}</p>
        <p style="color:#555;margin:4px 0 0">Phone: ${escapeHtml(bill.customer.phone)}</p>
      </div>
      <div>
        <p style="font-size:11px;font-weight:600;text-transform:uppercase;color:#666;margin:0 0 4px">Device / Vehicle</p>
        <p style="margin:0">Device ID: ${escapeHtml(bill.deviceId)}</p>
        <p style="margin:4px 0 0">Vehicle ID: ${escapeHtml(bill.vehicleId)}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="text-align:left">#</th>
          <th style="text-align:left">Description</th>
          <th style="text-align:right">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals" style="margin-top:24px">
      <div class="totals-row"><span>Subtotal</span><span>₹${Number(bill.subtotal).toFixed(2)}</span></div>
      <div class="totals-row"><span>GST (${gstPercent}%)</span><span>₹${Number(bill.gstAmount).toFixed(2)}</span></div>
      <div class="totals-row totals-grand"><span>Grand Total</span><span>₹${Number(bill.totalAmount).toFixed(2)}</span></div>
    </div>
    ${notes}
    <footer style="margin-top:40px;padding-top:16px;border-top:1px solid #ccc;font-size:12px;color:#888;text-align:center">
      Thank you for your business
    </footer>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function saveBill(bill: Bill, gstPercent: number) {
  const html = renderBillHtml(bill, gstPercent);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${billFileName(bill)}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printBill(bill: Bill, gstPercent: number) {
  const win = window.open('', '_blank', 'width=800,height=900');
  if (!win) {
    alert('Please allow pop-ups to print the bill.');
    return;
  }

  win.document.write(renderBillHtml(bill, gstPercent));
  win.document.close();
  win.focus();
  win.onload = () => {
    win.print();
  };
  // Fallback if onload already fired
  setTimeout(() => win.print(), 300);
}
