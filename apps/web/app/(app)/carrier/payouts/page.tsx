'use client';

import DataTable from '../../../_components/DataTable';
import { invoices } from '../../../_data/mock-data';

const statusClasses: Record<string, string> = {
  paid: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  invoiced: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  overdue: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const statusLabels: Record<string, string> = {
  paid: 'Paid',
  invoiced: 'Invoiced',
  pending: 'Pending',
  overdue: 'Overdue',
};

type PayoutRow = Record<string, unknown> & {
  invoiceNumber: string;
  loadNumber: string;
  customer: string;
  amount: string;
  status: string;
  issuedDate: string;
  dueDate: string;
};

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'loadNumber', label: 'Load #' },
  { key: 'customer', label: 'Customer' },
  {
    key: 'amount',
    label: 'Amount',
    render: (val: unknown) => <span className="font-medium text-white">{val as string}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[s] ?? ''}`}>
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {statusLabels[s] ?? s}
        </span>
      );
    },
  },
  { key: 'issuedDate', label: 'Issued' },
  { key: 'dueDate', label: 'Due' },
];

const tableData: PayoutRow[] = invoices.map((inv) => ({
  invoiceNumber: inv.invoiceNumber,
  loadNumber: inv.loadNumber,
  customer: inv.customer,
  amount: `$${inv.amount.toLocaleString()}`,
  status: inv.status,
  issuedDate: inv.issuedDate,
  dueDate: inv.dueDate,
}));

const totalPaid = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
const totalPending = invoices.filter((i) => i.status === 'pending' || i.status === 'invoiced').reduce((s, i) => s + i.amount, 0);
const totalOverdue = invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

export default function CarrierPayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Payouts &amp; Invoices</h1>
        <p className="text-sm text-slate-400">Track earnings and payment history</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">This Week</p>
          <p className="mt-1 text-2xl font-bold text-white">$12,450</p>
          <p className="mt-1 text-xs text-emerald-400">+18% vs last week</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">This Month</p>
          <p className="mt-1 text-2xl font-bold text-white">$124,500</p>
          <p className="mt-1 text-xs text-emerald-400">+15% vs last month</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">${totalPending.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-red-400">${totalOverdue.toLocaleString()}</p>
        </div>
      </div>

      {/* Payout History */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Payout History</h3>
        <div className="space-y-2">
          {[
            { date: 'Mar 22, 2024', amount: '$8,750', loads: 4, status: 'Completed' },
            { date: 'Mar 15, 2024', amount: '$11,200', loads: 5, status: 'Completed' },
            { date: 'Mar 8, 2024', amount: '$9,600', loads: 4, status: 'Completed' },
          ].map((payout) => (
            <div key={payout.date} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#161b22] px-4 py-3">
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600/20">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-emerald-400">
                    <path d="M3 10l5 5L17 5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200">{payout.amount}</p>
                  <p className="text-[11px] text-slate-500">{payout.loads} loads - {payout.date}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-emerald-400">{payout.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Invoice List</h3>
        <DataTable<PayoutRow> columns={columns} data={tableData} emptyMessage="No invoices found" />
      </div>
    </div>
  );
}
