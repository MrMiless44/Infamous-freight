'use client';

import { useState } from 'react';
import DataTable from '../../../_components/DataTable';
import Tabs from '../../../_components/Tabs';
import FilterBar from '../../../_components/FilterBar';
import { invoices } from '../../../_data/mock-data';

/* ---------- Status config ---------- */
const invoiceStatusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  invoiced: { label: 'Invoiced', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  paid: { label: 'Paid', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  overdue: { label: 'Overdue', classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

/* ---------- Tabs ---------- */
const invoiceTabs = [
  { id: 'all', label: 'All', count: invoices.length },
  { id: 'pending', label: 'Pending', count: invoices.filter((i) => i.status === 'pending').length },
  { id: 'paid', label: 'Paid', count: invoices.filter((i) => i.status === 'paid').length },
  { id: 'overdue', label: 'Overdue', count: invoices.filter((i) => i.status === 'overdue').length },
];

/* ---------- Filters ---------- */
const filters = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'invoiced', label: 'Invoiced' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
    ],
  },
];

/* ---------- Table ---------- */
type InvoiceRow = Record<string, unknown> & {
  invoiceNumber: string;
  loadNumber: string;
  customer: string;
  amount: string;
  status: string;
  issuedDate: string;
  dueDate: string;
  paidDate: string;
};

const allInvoices: InvoiceRow[] = invoices.map((inv) => ({
  invoiceNumber: inv.invoiceNumber,
  loadNumber: inv.loadNumber,
  customer: inv.customer,
  amount: `$${inv.amount.toLocaleString()}`,
  status: inv.status,
  issuedDate: inv.issuedDate,
  dueDate: inv.dueDate,
  paidDate: inv.paidDate ?? '-',
}));

const tableColumns = [
  { key: 'invoiceNumber', label: 'Invoice #' },
  { key: 'loadNumber', label: 'Load #' },
  { key: 'customer', label: 'Customer' },
  { key: 'amount', label: 'Amount' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const cfg = invoiceStatusConfig[s] ?? { label: s, classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20' };
      return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {cfg.label}
        </span>
      );
    },
  },
  { key: 'issuedDate', label: 'Issued Date' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'paidDate', label: 'Paid Date' },
  {
    key: 'actions',
    label: 'Actions',
    render: (_val: unknown, row: InvoiceRow) => (
      <div className="flex items-center gap-1">
        <a href={`/billing/invoices/${row.invoiceNumber}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="View">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" /><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
          </svg>
        </a>
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="Download">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
          </svg>
        </button>
      </div>
    ),
  },
];

/* ---------- Totals ---------- */
const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
const pendingAmount = invoices.filter((i) => i.status === 'pending' || i.status === 'invoiced').reduce((sum, inv) => sum + inv.amount, 0);
const overdueAmount = invoices.filter((i) => i.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = allInvoices.filter((inv) => {
    if (activeTab !== 'all' && inv.status !== activeTab) return false;
    if (search && !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) && !inv.customer.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Invoices</h1>
          <p className="text-sm text-slate-400">Manage and track all invoices</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h12v8H4l-2 2V3z" />
            </svg>
            Send Reminder
          </button>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Invoice Totals Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Invoiced', value: `$${totalAmount.toLocaleString()}`, color: 'text-white' },
          { label: 'Paid', value: `$${paidAmount.toLocaleString()}`, color: 'text-emerald-400' },
          { label: 'Pending', value: `$${pendingAmount.toLocaleString()}`, color: 'text-yellow-400' },
          { label: 'Overdue', value: `$${overdueAmount.toLocaleString()}`, color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-1 text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={invoiceTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filter / Search */}
      <FilterBar
        filters={filters}
        onFilterChange={() => {}}
        searchPlaceholder="Search invoices..."
        onSearchChange={setSearch}
      />

      {/* Table */}
      <DataTable<InvoiceRow> columns={tableColumns} data={filtered} />
    </div>
  );
}
