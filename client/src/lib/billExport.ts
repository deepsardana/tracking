import { Bill, BillCompany } from '../api/bills';
import { billDownloadName, renderVltdInvoiceHtml } from './vltdInvoiceTemplate';

export function saveBill(bill: Bill, gstPercent: number, company?: BillCompany) {
  const html = renderVltdInvoiceHtml({ bill, gstPercent, company });
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${billDownloadName(bill)}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printBill(bill: Bill, gstPercent: number, company?: BillCompany) {
  const win = window.open('', '_blank', 'width=820,height=1100');
  if (!win) {
    alert('Please allow pop-ups to print the bill.');
    return;
  }
  win.document.write(renderVltdInvoiceHtml({ bill, gstPercent, company }));
  win.document.close();
  win.focus();
  const doPrint = () => win.print();
  win.onload = doPrint;
  setTimeout(doPrint, 400);
}
