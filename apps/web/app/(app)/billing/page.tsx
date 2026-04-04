'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import ChartCard from '../../_components/ChartCard';
import DataTable from '../../_components/DataTable';
import { invoices } from '../../_data/mock-data';

/* ---------- KPIs ---------- */
const kpis = [
  {
    title: 'Total Revenue',
    value: '$847,200',
    change: 15,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v16M6 6c0-2 8-2 8 0s-8 2-8 4 8 2 8 0" />
      </svg>
    ),
  },
  {
    title: 'Outstanding',
    value: '$34,800',
    change: 3,
    changeType: 'down' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Overdue',
    value: '$8,500',
    change: 12,
    changeType: 'up' as const,
    subtitle: 'needs attention',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2l8 14H2L10 2zM10 8v4M10 14h.01" />
      </svg>
    ),
  },
  {
    title: 'Paid This Month',
    value: '$267,400',
    change: 22,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l5 5L17 5" />
      </svg>
    ),
  },
];

/* ---------- Revenue chart data ---------- */
const revenueData = [
  { label: 'Jan', value: 62000 },
  { label: 'Feb', value: 71000 },
  { label: 'Mar', value: 84000 },
  { label: 'Apr', value: 78000 },
  { label: 'May', value: 92000 },
  { label: 'Jun', value: 88000 },
  { label: 'Jul', value: 95000 },
  { label: 'Aug', value: 102000 },
  { label: 'Sep', value: 98000 },
  { label: 'Oct', value: 110000 },
  { label: 'Nov', value: 105000 },
  { label: 'Dec', value: 120000 },
];
const maxRevenue = Math.max(...revenueData.map((d) => d.value));

/* ---------- Invoice status config ---------- */
const invoiceStatusConfig: Record<string, { label: string; classes: string }> = {
  pending: { label: 'Pending', classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
  invoiced: { label: 'Invoiced', classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
  paid: { label: 'Paid', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  overdue: { label: 'Overdue', classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
};

/* ---------- Table data ---------- */
type InvoiceRow = Record<string, unknown> & {
  invoiceNumber: string;
  loadNumber: string;
  customer: string;
  amount: string;
  status: string;
  issuedDate: string;
  dueDate: string;
};

const recentInvoices: InvoiceRow[] = invoices.slice(0, 6).map((inv) => ({
  invoiceNumber: inv.invoiceNumber,
  loadNumber: inv.loadNumber,
  customer: inv.customer,
  amount: `$${inv.amount.toLocaleString()}`,
  status: inv.status,
  issuedDate: inv.issuedDate,
  dueDate: inv.dueDate,
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
  { key: 'issuedDate', label: 'Issued' },
  { key: 'dueDate', label: 'Due' },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <div className="flex items-center gap-1">
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="View">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" /><path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
          </svg>
        </button>
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="Download">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 2v9M5 8l3 3 3-3M3 13h10" />
          </svg>
        </button>
      </div>
    ),
  },
];

/* ---------- Payment methods ---------- */
const paymentMethods = [
  { id: 'pm1', type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
  { id: 'pm2', type: 'Mastercard', last4: '8891', expiry: '03/27', isDefault: false },
  { id: 'pm3', type: 'ACH Transfer', last4: '6723', expiry: 'Chase Business', isDefault: false },
];

/* ---------- Quick actions ---------- */
const quickActions = [
  { label: 'Create Invoice', icon: 'M8 3v10M3 8h10' },
  { label: 'Send Reminders', icon: 'M2 3h12v8H4l-2 2V3z' },
  { label: 'Export Report', icon: 'M8 2v9M5 8l3 3 3-3M3 13h10' },
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Billing & Payments</h1>
          <p className="text-sm text-slate-400">Manage invoices, payments, and revenue tracking</p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((a) => (
            <button
              key={a.label}
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Revenue Chart */}
      <ChartCard title="Revenue Trend" subtitle="Monthly revenue (last 12 months)">
        <div className="flex h-48 items-end gap-2 pt-4">
          {revenueData.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] text-slate-500">${(d.value / 1000).toFixed(0)}k</span>
              <div className="w-full">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                  style={{ height: `${(d.value / maxRevenue) * 140}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Recent Invoices */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Invoices</h3>
          <a href="/billing/invoices" className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</a>
        </div>
        <DataTable<InvoiceRow> columns={tableColumns} data={recentInvoices} />
      </div>

      {/* Payment Methods */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Payment Methods</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="18" height="12" rx="2" />
                  <path d="M1 9h18" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-200">{pm.type} ****{pm.last4}</p>
                  {pm.isDefault && (
                    <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[10px] font-semibold text-blue-400">Default</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{pm.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
