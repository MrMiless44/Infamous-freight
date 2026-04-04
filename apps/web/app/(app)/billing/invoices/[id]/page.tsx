import { invoices, loads } from '../../../../_data/mock-data';

/* ---------- Status config ---------- */
const invoiceStatusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  invoiced: { label: 'Invoiced', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  paid: { label: 'Paid', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  overdue: { label: 'Overdue', classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

/* ---------- Mock line items ---------- */
function getLineItems(inv: (typeof invoices)[number]) {
  const load = loads.find((l) => l.loadNumber === inv.loadNumber);
  const baseRate = inv.amount * 0.85;
  const fuelSurcharge = inv.amount * 0.1;
  const accessorial = inv.amount * 0.05;
  return {
    items: [
      { description: `Freight Charges - ${load?.commodity ?? 'General Freight'}`, loadNumber: inv.loadNumber, qty: 1, rate: baseRate, amount: baseRate },
      { description: 'Fuel Surcharge', loadNumber: inv.loadNumber, qty: 1, rate: fuelSurcharge, amount: fuelSurcharge },
      { description: 'Accessorial Charges', loadNumber: inv.loadNumber, qty: 1, rate: accessorial, amount: accessorial },
    ],
    subtotal: inv.amount,
    tax: inv.amount * 0.08,
    total: inv.amount * 1.08,
    load,
  };
}

/* ---------- Payment history ---------- */
function getPaymentHistory(inv: (typeof invoices)[number]) {
  if (inv.status === 'paid') {
    return [
      { date: inv.paidDate ?? inv.dueDate, method: 'ACH Transfer', amount: inv.amount * 1.08, reference: `PAY-${inv.invoiceNumber.replace('INV-', '')}` },
    ];
  }
  return [];
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = invoices.find((inv) => inv.invoiceNumber === id || inv.id === id);

  if (!invoice) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white">Invoice Not Found</h2>
          <p className="mt-2 text-sm text-slate-400">The invoice you are looking for does not exist.</p>
          <a href="/billing/invoices" className="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300">
            Back to Invoices
          </a>
        </div>
      </div>
    );
  }

  const { items, subtotal, tax, total, load } = getLineItems(invoice);
  const payments = getPaymentHistory(invoice);
  const statusCfg = invoiceStatusConfig[invoice.status] ?? { label: invoice.status, classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20' };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <a href="/billing/invoices" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-300">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 3L5 8l5 5" />
        </svg>
        Back to Invoices
      </a>

      {/* Invoice Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">{invoice.invoiceNumber}</h1>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.classes}`}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-current opacity-80" />
            {statusCfg.label}
          </span>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2L7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2z" />
            </svg>
            Send
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
            </svg>
            Download PDF
          </button>
          {invoice.status !== 'paid' && (
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l3 3 7-7" />
              </svg>
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {/* From / To */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">From</p>
          <p className="text-sm font-medium text-white">Infæmous Freight Inc.</p>
          <p className="mt-1 text-xs text-slate-400">1200 Logistics Blvd, Suite 400</p>
          <p className="text-xs text-slate-400">Chicago, IL 60601</p>
          <p className="mt-1 text-xs text-slate-400">billing@infamousfreight.com</p>
          <p className="text-xs text-slate-400">(312) 555-0100</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">To</p>
          <p className="text-sm font-medium text-white">{invoice.customer}</p>
          <p className="mt-1 text-xs text-slate-400">{load?.origin.address ?? '123 Business Ave'}</p>
          <p className="text-xs text-slate-400">{load ? `${load.origin.city}, ${load.origin.state} ${load.origin.zip}` : 'City, ST 00000'}</p>
          <p className="mt-2 text-xs text-slate-500">Invoice Date: {invoice.issuedDate}</p>
          <p className="text-xs text-slate-500">Due Date: {invoice.dueDate}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Load #</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Qty</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Rate</th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-slate-800/20">
                <td className="px-5 py-3 text-sm text-slate-300">{item.description}</td>
                <td className="px-5 py-3 text-sm text-slate-400">{item.loadNumber}</td>
                <td className="px-5 py-3 text-sm text-slate-400 text-right">{item.qty}</td>
                <td className="px-5 py-3 text-sm text-slate-400 text-right">${item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-5 py-3 text-sm text-white text-right">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-800">
            <tr>
              <td colSpan={4} className="px-5 py-2 text-sm text-slate-400 text-right">Subtotal</td>
              <td className="px-5 py-2 text-sm text-white text-right">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colSpan={4} className="px-5 py-2 text-sm text-slate-400 text-right">Tax (8%)</td>
              <td className="px-5 py-2 text-sm text-white text-right">${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-t border-slate-700">
              <td colSpan={4} className="px-5 py-3 text-sm font-semibold text-white text-right">Total</td>
              <td className="px-5 py-3 text-lg font-bold text-white text-right">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment History */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{p.method}</p>
                  <p className="text-xs text-slate-500">Ref: {p.reference} - {p.date}</p>
                </div>
                <p className="text-sm font-semibold text-emerald-400">${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Notes</h3>
        <div className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
          <p className="text-sm text-slate-400">
            {load?.notes ?? 'Payment terms: Net 14. Late payments subject to 1.5% monthly interest. Please reference invoice number in all correspondence.'}
          </p>
        </div>
      </div>
    </div>
  );
}
