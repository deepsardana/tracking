import { Bill, BillCompany } from '../api/bills';

const DEFAULT_COMPANY: BillCompany = {
  name: 'GPS Tracking Solutions',
  address: 'Haryana, India',
  phone: '',
  gstin: '',
};

/** Shared CSS — screen + print use the same rules so Print matches the preview. */
export const VLTD_INVOICE_CSS = `
  @page { size: A4 portrait; margin: 8mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; background: #fff; }
  .vltd-invoice {
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    color: #000;
    width: 100%;
    max-width: 190mm;
    margin: 0 auto;
    padding: 4mm;
    line-height: 1.35;
  }
  .vltd-frame {
    border: 2px solid #000;
    padding: 3mm;
  }
  .vltd-header { text-align: center; border-bottom: 1px solid #000; padding-bottom: 6px; margin-bottom: 8px; }
  .vltd-header h1 { margin: 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
  .vltd-header .addr { font-size: 10pt; margin: 4px 0 0; }
  .vltd-header .meta { font-size: 10pt; margin-top: 4px; }
  .vltd-title { text-align: center; font-size: 13pt; font-weight: bold; text-decoration: underline; margin: 8px 0; }
  .vltd-grid { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; }
  .vltd-grid td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
  .vltd-grid .label { font-weight: bold; width: 28%; background: #f5f5f5; }
  .vltd-items { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 10.5pt; }
  .vltd-items th, .vltd-items td { border: 1px solid #000; padding: 4px 5px; }
  .vltd-items th { background: #e8e8e8; font-weight: bold; text-align: center; }
  .vltd-items .desc { text-align: left; }
  .vltd-items .num { text-align: right; }
  .vltd-items .center { text-align: center; }
  .vltd-totals { width: 48%; margin-left: auto; border-collapse: collapse; font-size: 10.5pt; }
  .vltd-totals td { border: 1px solid #000; padding: 4px 6px; }
  .vltd-totals .label { font-weight: bold; }
  .vltd-totals .grand { font-weight: bold; font-size: 11pt; background: #f0f0f0; }
  .vltd-footer { margin-top: 10px; font-size: 10pt; }
  .vltd-sign { margin-top: 28px; width: 100%; border-collapse: collapse; }
  .vltd-sign td { width: 50%; text-align: center; padding-top: 32px; border-top: 1px solid #000; font-size: 10pt; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .vltd-invoice { max-width: none; padding: 0; }
  }
`;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function money(value: string | number) {
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function amountInWords(n: number): string {
  const num = Math.round(n);
  if (num === 0) return 'Rupees Zero Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const below100 = (x: number): string => {
    if (x < 20) return ones[x];
    const t = Math.floor(x / 10);
    const o = x % 10;
    return o ? `${tens[t]} ${ones[o]}` : tens[t];
  };

  const below1000 = (x: number): string => {
    if (x < 100) return below100(x);
    const h = Math.floor(x / 100);
    const r = x % 100;
    return r ? `${ones[h]} Hundred ${below100(r)}` : `${ones[h]} Hundred`;
  };

  const chunks: string[] = [];
  let rem = num;
  const add = (divisor: number, label: string) => {
    const v = Math.floor(rem / divisor);
    if (v > 0) {
      chunks.push(`${below1000(v)} ${label}`);
      rem %= divisor;
    }
  };
  add(10000000, 'Crore');
  add(100000, 'Lakh');
  add(1000, 'Thousand');
  if (rem > 0) chunks.push(below1000(rem));

  return `Rupees ${chunks.join(' ').trim()} Only`;
}

export interface VltdInvoiceData {
  bill: Bill;
  gstPercent: number;
  company?: BillCompany;
}

export function renderVltdInvoiceHtml({ bill, gstPercent, company = DEFAULT_COMPANY }: VltdInvoiceData): string {
  const invoiceNo = bill.invoiceNo ?? bill.id.slice(0, 8).toUpperCase();
  const serial = bill.vltdSerialNo ?? bill.deviceId;
  const imei = bill.vltdImeiNo ?? '';
  const halfGst = gstPercent / 2;
  const cgst = Number(bill.gstAmount) / 2;
  const sgst = Number(bill.gstAmount) / 2;
  const total = Number(bill.totalAmount);

  const itemRows = bill.items
    .map(
      (item, i) => `
    <tr>
      <td class="center">${i + 1}</td>
      <td class="desc">${escapeHtml(item.description)}</td>
      <td class="center">9987</td>
      <td class="center">${Number(item.quantity)}</td>
      <td class="num">${money(item.unitPrice)}</td>
      <td class="num">${money(item.amount)}</td>
    </tr>`,
    )
    .join('');

  const emptyRows =
    bill.items.length < 5
      ? Array(5 - bill.items.length)
          .fill(0)
          .map(
            (_, i) => `
    <tr>
      <td class="center">${bill.items.length + i + 1}</td>
      <td class="desc">&nbsp;</td>
      <td class="center">&nbsp;</td>
      <td class="center">&nbsp;</td>
      <td class="num">&nbsp;</td>
      <td class="num">&nbsp;</td>
    </tr>`,
          )
          .join('')
      : '';

  const companyPhone = company.phone ? `Mob: ${escapeHtml(company.phone)}` : '';
  const companyGst = company.gstin ? `GSTIN: ${escapeHtml(company.gstin)}` : '';
  const remarks = bill.notes ? `<p><strong>Remarks:</strong> ${escapeHtml(bill.notes)}</p>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice ${escapeHtml(invoiceNo)}</title>
  <style>${VLTD_INVOICE_CSS}</style>
</head>
<body>
  <div class="vltd-invoice">
    <div class="vltd-frame">
      <div class="vltd-header">
        <h1>${escapeHtml(company.name)}</h1>
        <p class="addr">${escapeHtml(company.address)}</p>
        <p class="meta">${companyPhone}${companyPhone && companyGst ? ' &nbsp;|&nbsp; ' : ''}${companyGst}</p>
      </div>
      <p class="vltd-title">TAX INVOICE</p>

      <table class="vltd-grid">
        <tr>
          <td class="label">Invoice No.</td>
          <td>${escapeHtml(invoiceNo)}</td>
          <td class="label">Vehicle Reg. No.</td>
          <td><strong>${escapeHtml(bill.vehicleId)}</strong></td>
        </tr>
        <tr>
          <td class="label">Invoice Date</td>
          <td>${formatDate(bill.billDate)}</td>
          <td class="label">Place of Supply</td>
          <td>Haryana</td>
        </tr>
      </table>

      <table class="vltd-grid">
        <tr>
          <td class="label" colspan="1">Bill To / Buyer</td>
          <td colspan="3"><strong>${escapeHtml(bill.customer.name)}</strong><br/>Mobile: ${escapeHtml(bill.customer.phone)}</td>
        </tr>
        <tr>
          <td class="label">VLTD Serial No.</td>
          <td colspan="3" style="font-family: 'Courier New', monospace; font-weight: bold;">${escapeHtml(serial)}</td>
        </tr>
        <tr>
          <td class="label">VLTD IMEI No.</td>
          <td colspan="3" style="font-family: 'Courier New', monospace; font-weight: bold;">${escapeHtml(imei)}</td>
        </tr>
      </table>

      <table class="vltd-items">
        <thead>
          <tr>
            <th style="width:5%">S.No</th>
            <th style="width:42%">Description of Goods / Services</th>
            <th style="width:10%">HSN/SAC</th>
            <th style="width:8%">Qty</th>
            <th style="width:15%">Rate (₹)</th>
            <th style="width:20%">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          ${emptyRows}
        </tbody>
      </table>

      <table class="vltd-totals">
        <tr><td class="label">Taxable Value</td><td class="num">₹ ${money(bill.subtotal)}</td></tr>
        <tr><td class="label">CGST @ ${halfGst}%</td><td class="num">₹ ${money(cgst)}</td></tr>
        <tr><td class="label">SGST @ ${halfGst}%</td><td class="num">₹ ${money(sgst)}</td></tr>
        <tr class="grand"><td class="label">Grand Total</td><td class="num">₹ ${money(total)}</td></tr>
      </table>

      <div class="vltd-footer">
        <p><strong>Amount in words:</strong> ${amountInWords(total)}</p>
        <p style="margin-top:6px">Whether tax is payable on reverse charge basis: <strong>No</strong></p>
        ${remarks}
        <p style="margin-top:8px;font-size:9pt">Terms: Goods once sold will not be taken back. Subject to jurisdiction of local courts only.</p>
      </div>

      <table class="vltd-sign">
        <tr>
          <td>Receiver's Signature</td>
          <td>For ${escapeHtml(company.name)}<br/><br/>Authorised Signatory</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
}

export function billDownloadName(bill: Bill) {
  const inv = (bill.invoiceNo ?? 'invoice').replace(/[^\w-]+/g, '_');
  return `TaxInvoice_${inv}_${bill.billDate.slice(0, 10)}`;
}
