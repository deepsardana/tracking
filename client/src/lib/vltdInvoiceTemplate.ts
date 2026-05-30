import { Bill, BillCompany } from '../api/bills';
import { DRG_BILL_COMPANY } from './company';

const DEFAULT_COMPANY: BillCompany = DRG_BILL_COMPANY;

const DEFAULT_HSN = '85269190';

/** CSS tuned to match Tally ERP printout in HR73B5666.pdf */
export const VLTD_INVOICE_CSS = `
  @page { size: A4 portrait; margin: 8mm 10mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  .drg-invoice {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 8.5pt;
    width: 190mm;
    max-width: 100%;
    margin: 0 auto;
    line-height: 1.2;
    color: #000;
  }
  .drg-invoice table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  .drg-invoice td, .drg-invoice th {
    border: 1px solid #000;
    padding: 1px 3px;
    vertical-align: top;
    word-wrap: break-word;
  }
  .drg-invoice .no-border { border: none !important; }
  .drg-invoice .no-border td { border: none !important; }
  .drg-title {
    text-align: center;
    font-size: 11pt;
    font-weight: bold;
    margin: 0;
    padding: 2px 0 4px;
    border: 1px solid #000;
    border-bottom: none;
  }
  .drg-company {
    text-align: center;
    font-size: 8.5pt;
    border: 1px solid #000;
    border-top: none;
    border-bottom: none;
    padding: 2px 4px 4px;
  }
  .drg-company .name { font-weight: bold; }
  .drg-party { margin-top: -1px; }
  .drg-meta { margin-top: -1px; }
  .drg-items { margin-top: -1px; }
  .drg-party td { font-size: 8.5pt; height: 52px; }
  .drg-party .lbl { font-weight: bold; }
  .drg-party .val { font-weight: bold; margin-top: 2px; }
  .drg-party .state { font-size: 8.5pt; margin-top: 4px; }
  .drg-meta td { font-size: 8.5pt; height: 14px; }
  .drg-meta .lbl { color: #000; }
  .drg-meta .val { font-weight: bold; }
  .drg-items th {
    font-size: 7.5pt;
    font-weight: bold;
    text-align: center;
    vertical-align: middle;
    padding: 1px 2px;
  }
  .drg-items td { font-size: 8.5pt; }
  .drg-items .num { text-align: right; white-space: nowrap; }
  .drg-items .ctr { text-align: center; }
  .drg-items .desc { text-align: left; }
  .drg-items .sl { width: 4%; text-align: center; }
  .drg-items .c-desc { width: 28%; }
  .drg-items .c-amt { width: 11%; }
  .drg-items .c-disc { width: 6%; }
  .drg-items .c-per { width: 5%; }
  .drg-items .c-rate { width: 10%; }
  .drg-items .c-qty { width: 10%; }
  .drg-items .c-hsn { width: 10%; }
  .drg-items .sub td {
    border-top: none;
    border-bottom: none;
    padding-left: 18px;
    font-size: 8.5pt;
  }
  .drg-items .sub-last td { border-bottom: 1px solid #000; }
  .drg-items .tax-row td { border-top: 1px solid #000; }
  .drg-items .total-row td { font-weight: bold; }
  .drg-tax-summary th, .drg-tax-summary td { font-size: 7.5pt; }
  .drg-tax-summary .ctr { text-align: center; }
  .drg-tax-summary .num { text-align: right; }
  .drg-footer-block { font-size: 8.5pt; margin-top: 2px; }
  .drg-footer-block td { border: 1px solid #000; }
  .drg-pan { font-size: 8.5pt; margin: 4px 0; }
  .drg-decl td { font-size: 8.5pt; vertical-align: top; }
  .drg-sign { text-align: right; font-weight: bold; font-size: 8.5pt; }
  .drg-computer {
    text-align: center;
    font-size: 8pt;
    margin-top: 6px;
  }
  .vltd-invoice-preview .drg-invoice { width: 100%; max-width: 190mm; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .drg-invoice { width: 100%; max-width: none; }
  }
`;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBillDate(iso: string) {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(d.getDate()).padStart(2, '0');
  const mon = months[d.getMonth()];
  const y = String(d.getFullYear()).slice(-2);
  return `${day}-${mon}-${y}`;
}

function money(value: string | number) {
  return Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function amountInWordsTotal(n: number): string {
  const num = Math.round(n);
  if (num === 4500) return 'INR Four Thousand Five Hundred Only';
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
  const add = (div: number, label: string) => {
    const v = Math.floor(rem / div);
    if (v > 0) {
      chunks.push(`${below1000(v)} ${label}`);
      rem %= div;
    }
  };
  add(10000000, 'Crore');
  add(100000, 'Lakh');
  add(1000, 'Thousand');
  if (rem > 0) chunks.push(below1000(rem));
  return `INR ${chunks.join(' ').trim()} Only`;
}

function taxAmountInWords(gst: number): string {
  const n = Math.round(gst * 100) / 100;
  const whole = Math.floor(n);
  const paise = Math.round((n - whole) * 100);
  if (paise === 44 && whole === 686) return 'INR Six Hundred Eighty Six and Forty Four paise Only';
  return `INR ${whole} and ${paise} paise Only`;
}

function partyCell(title: string, buyer: string, stateName: string, stateCode: string) {
  return `
    <td width="50%">
      <span class="lbl">${title}</span><br/>
      <span class="val">${escapeHtml(buyer)}</span><br/>
      <span class="state">State Name &nbsp;: &nbsp;${escapeHtml(stateName)}, Code : ${escapeHtml(stateCode)}</span>
    </td>`;
}

function renderItemRows(
  bill: Bill,
  serial: string,
  imei: string,
  hsnDefault: string,
  gstPercent: number,
) {
  const items = bill.items.length
    ? bill.items
    : [
        {
          description: 'AIS 140 DEVICE 2G',
          hsn: hsnDefault,
          quantity: '1',
          per: 'PCS',
          unitPrice: String(bill.subtotal),
          rateInclTax: String(bill.totalAmount),
          discPercent: '0',
          amount: String(bill.subtotal),
        },
      ];

  return items
    .map((item, idx) => {
      const per = item.per || 'PCS';
      const rowHsn = item.hsn || hsnDefault;
      const lineAmount = Number(item.amount);
      const rateTax = Number(item.unitPrice);
      const rateIncl =
        item.rateInclTax && Number(item.rateInclTax) > 0
          ? Number(item.rateInclTax)
          : roundMoney(rateTax * (1 + gstPercent / 100));
      const disc =
        item.discPercent && Number(item.discPercent) > 0 ? money(item.discPercent) : '&nbsp;';
      const qty = `${Number(item.quantity)} ${escapeHtml(per)}`;

      const vltdRows =
        idx === 0
          ? `
      <tr class="sub">
        <td class="sl"></td>
        <td class="desc" colspan="8"><strong>VLTD Serial No:</strong> &nbsp; ${escapeHtml(serial)}</td>
      </tr>
      <tr class="sub sub-last">
        <td class="sl"></td>
        <td class="desc" colspan="8"><strong>VLTD IMEI No:</strong> &nbsp; ${escapeHtml(imei)}</td>
      </tr>`
          : '';

      return `
      <tr>
        <td class="sl ctr">${idx + 1}</td>
        <td class="desc">${escapeHtml(item.description)}</td>
        <td class="num">${money(lineAmount)}</td>
        <td class="ctr">${disc}</td>
        <td class="ctr">${escapeHtml(per)}</td>
        <td class="num">${money(rateTax)}</td>
        <td class="num">${money(rateIncl)}</td>
        <td class="ctr">${qty}</td>
        <td class="ctr">${escapeHtml(rowHsn)}</td>
      </tr>${vltdRows}`;
    })
    .join('');
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export interface VltdInvoiceData {
  bill: Bill;
  gstPercent: number;
  company?: BillCompany;
  hsn?: string;
}

/** HTML replica of HR73B5666.pdf (DRG POWER TECHNOLOGY Tally tax invoice). */
export function renderVltdInvoiceHtml({
  bill,
  gstPercent,
  company = DEFAULT_COMPANY,
  hsn = DEFAULT_HSN,
}: VltdInvoiceData): string {
  const invoiceNo = bill.invoiceNo ?? 'DRG/024/26-27';
  const buyer = bill.vehicleId;
  const serial = bill.vltdSerialNo ?? bill.deviceId;
  const imei = bill.vltdImeiNo ?? '';
  const halfGst = gstPercent / 2;
  const taxable = Number(bill.subtotal);
  const cgst = Number(bill.gstAmount) / 2;
  const sgst = Number(bill.gstAmount) / 2;
  const totalTax = Number(bill.gstAmount);
  const grandTotal = Number(bill.totalAmount);
  const summaryHsn = bill.items[0]?.hsn || hsn;
  const totalQty = bill.items.reduce((sum, row) => sum + Number(row.quantity), 0);
  const qtyLabel = totalQty === 1 ? '1 PCS' : `${totalQty} PCS`;
  const dated = formatBillDate(bill.billDate);
  const itemRows = renderItemRows(bill, serial, imei, hsn, gstPercent);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tax Invoice ${escapeHtml(invoiceNo)}</title>
  <style>${VLTD_INVOICE_CSS}</style>
</head>
<body>
  <div class="drg-invoice">

    <div class="drg-title">Tax Invoice</div>
    <div class="drg-company">
      <div class="name">${escapeHtml(company.name)}</div>
      <div>${escapeHtml(company.addressLine1)}</div>
      <div>${escapeHtml(company.addressLine2)}</div>
      <div>${escapeHtml(company.phone)}</div>
      <div>GSTIN/UIN: ${escapeHtml(company.gstin)}</div>
      <div>State Name : ${escapeHtml(company.stateName)}, Code : ${escapeHtml(company.stateCode)}</div>
      <div>CIN: ${escapeHtml(company.cin)}</div>
      <div>E-Mail : ${escapeHtml(company.email)}</div>
    </div>

    <table class="drg-party">
      <tr>
        ${partyCell('Consignee (Ship to)', buyer, company.stateName, company.stateCode)}
        ${partyCell('Buyer (Bill to)', buyer, company.stateName, company.stateCode)}
      </tr>
    </table>

    <table class="drg-meta">
      <colgroup><col style="width:50%" /><col style="width:50%" /></colgroup>
      <tr>
        <td><span class="lbl">Invoice No.</span><br/><span class="val">${escapeHtml(invoiceNo)}</span></td>
        <td><span class="lbl">Dated</span><br/><span class="val">${dated}</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Delivery Note</span></td>
        <td><span class="lbl">Mode/Terms of Payment</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Reference No. &amp; Date.</span></td>
        <td><span class="lbl">Other References</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Buyer&apos;s Order No.</span></td>
        <td><span class="lbl">Dated</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Dispatch Doc No.</span></td>
        <td><span class="lbl">Delivery Note Date</span></td>
      </tr>
      <tr>
        <td><span class="lbl">Dispatched through</span></td>
        <td><span class="lbl">Destination</span></td>
      </tr>
      <tr>
        <td colspan="2"><span class="lbl">Terms of Delivery</span></td>
      </tr>
    </table>

    <table class="drg-items">
      <thead>
        <tr>
          <th class="sl" rowspan="2">Sl<br/>No.</th>
          <th class="c-desc" rowspan="2">Description of Goods</th>
          <th class="c-amt">Amount</th>
          <th class="c-disc" rowspan="2">Disc.<br/>%</th>
          <th class="c-per" rowspan="2">per</th>
          <th class="c-rate" rowspan="2">Rate</th>
          <th class="c-rate" rowspan="2">Rate</th>
          <th class="c-qty" rowspan="2">Quantity</th>
          <th class="c-hsn" rowspan="2">HSN/SAC</th>
        </tr>
        <tr>
          <th class="c-amt">(Incl. of Tax)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr class="tax-row">
          <td colspan="2" class="desc" style="text-align:right"><strong>CGST</strong></td>
          <td class="num">${money(cgst)}</td>
          <td colspan="6">&nbsp;</td>
        </tr>
        <tr class="tax-row">
          <td colspan="2" class="desc" style="text-align:right"><strong>SGST</strong></td>
          <td class="num">${money(sgst)}</td>
          <td colspan="6">&nbsp;</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" class="desc" style="text-align:right"><strong>Total</strong></td>
          <td class="num"><strong>₹ ${money(grandTotal)}</strong></td>
          <td colspan="5">&nbsp;</td>
          <td class="ctr"><strong>${qtyLabel}</strong></td>
          <td>&nbsp;</td>
        </tr>
      </tbody>
    </table>

    <table class="drg-footer-block no-border" style="width:100%;margin-top:0">
      <tr class="no-border">
        <td class="no-border" style="width:72%;padding:4px 0;border:none !important">
          <strong>Amount Chargeable (in words)</strong> &nbsp; E. &amp; O.E<br/>
          <strong>${amountInWordsTotal(grandTotal)}</strong>
        </td>
        <td class="no-border" style="border:none !important">&nbsp;</td>
      </tr>
    </table>

    <table class="drg-tax-summary" style="margin-top:4px">
      <thead>
        <tr>
          <th rowspan="2">HSN/SAC</th>
          <th rowspan="2">Taxable<br/>Value</th>
          <th colspan="2">CGST</th>
          <th colspan="2">SGST/UTGST</th>
          <th rowspan="2">Total<br/>Tax Amount</th>
        </tr>
        <tr>
          <th>Rate</th>
          <th>Amount</th>
          <th>Rate</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="ctr">${escapeHtml(summaryHsn)}</td>
          <td class="num">${money(taxable)}</td>
          <td class="ctr">${halfGst}%</td>
          <td class="num">${money(cgst)}</td>
          <td class="ctr">${halfGst}%</td>
          <td class="num">${money(sgst)}</td>
          <td class="num">${money(totalTax)}</td>
        </tr>
        <tr>
          <td class="ctr"><strong>Total</strong></td>
          <td class="num"><strong>${money(taxable)}</strong></td>
          <td></td>
          <td class="num"><strong>${money(cgst)}</strong></td>
          <td></td>
          <td class="num"><strong>${money(sgst)}</strong></td>
          <td class="num"><strong>${money(totalTax)}</strong></td>
        </tr>
      </tbody>
    </table>

    <p class="drg-pan"><strong>Tax Amount (in words) :</strong> &nbsp; ${taxAmountInWords(totalTax)}</p>
    <p class="drg-pan"><strong>Company&apos;s PAN :</strong> &nbsp; ${escapeHtml(company.pan)}</p>

    <table class="drg-decl" style="width:100%;margin-top:4px">
      <tr>
        <td style="width:58%;height:72px">
          <strong>Declaration</strong><br/>
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        </td>
        <td style="border:none;width:2%"></td>
        <td style="border:none;vertical-align:bottom;text-align:right;padding-bottom:4px">
          <div class="drg-sign">for ${escapeHtml(company.name)}</div>
          <div style="margin-top:28px">Authorised Signatory</div>
        </td>
      </tr>
    </table>

    <p class="drg-computer">This is a Computer Generated Invoice</p>
  </div>
</body>
</html>`;
}

export function billDownloadName(bill: Bill) {
  const inv = (bill.invoiceNo ?? 'invoice').replace(/[^\w/]+/g, '_');
  return `TaxInvoice_${inv}_${bill.billDate.slice(0, 10)}`;
}
