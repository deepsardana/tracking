import { useEffect, useRef } from 'react';
import { Bill, BillCompany } from '../api/bills';
import { renderVltdInvoiceHtml, VLTD_INVOICE_CSS } from '../lib/vltdInvoiceTemplate';

interface BillDocumentProps {
  bill: Bill;
  gstPercent: number;
  company?: BillCompany;
}

/** On-screen preview uses the same HTML/CSS as Print → output matches printed PDF. */
export function BillDocument({ bill, gstPercent, company }: BillDocumentProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;
    const html = renderVltdInvoiceHtml({ bill, gstPercent, company });
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const invoice = doc.querySelector('.vltd-invoice');
    if (invoice) {
      hostRef.current.innerHTML = '';
      hostRef.current.appendChild(document.importNode(invoice, true));
    }
  }, [bill, gstPercent, company]);

  return (
    <>
      <style>{VLTD_INVOICE_CSS}</style>
      <div ref={hostRef} className="vltd-invoice-preview bg-white mx-auto" />
    </>
  );
}
