'use client';

import { useMemo } from 'react';
import DataTable from '../../../_components/DataTable';
import { invoices } from '../../../_data/mock-data';

type InvoiceRow = Record<string, unknown> & {
  invoiceNumber: string;
  loadNumber: string;
  amount: string;
  status: string;
  issuedDate: string;
  dueDate: string;
  actions: string;
};

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

const columns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'loadNumber', label: 'Load #' },
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
  { key: 'dueDate', label: 'Due Date' },
  {
    key: 'actions',
    label: 'Actions',
    render: (_val: unknown, row: InvoiceRow) => {
      const status = row.status as string;
      return (
        <div className="flex items-center gap-2">
          <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View
          </button>
          {(status === 'pending' || status === 'overdue' || status === 'invoiced') && (
            <button type="button" className="rounded bg-emerald-600/20 px-2 py-0.5 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30">
              Pay
            </button>
          )}
        </div>
      );
    },
  },
];

export default function ShipperInvoicesPage() {
  const totalOutstanding = useMemo(
    () =>
      invoices
        .filter((inv) => inv.status !== 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0),
    [],
  );

  const tableData: InvoiceRow[] = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    loadNumber: inv.loadNumber,
    amount: `$${inv.amount.toLocaleString()}`,
    status: inv.status,
    issuedDate: inv.issuedDate,
    dueDate: inv.dueDate,
    actions: '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoices &amp; Billing</h1>
          <p className="text-sm text-slate-400">Manage your shipment invoices and payments</p>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Total Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-red-400">${totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Paid This Month</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            ${invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Overdue</p>
          <p className="mt-1 text-2xl font-bold text-orange-400">
            {invoices.filter((i) => i.status === 'overdue').length}
          </p>
        </div>
      </div>

      <DataTable<InvoiceRow> columns={columns} data={tableData} emptyMessage="No invoices found" />
    </div>
  );
}
