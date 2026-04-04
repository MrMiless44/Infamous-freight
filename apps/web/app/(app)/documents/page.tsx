'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import DataTable from '../../_components/DataTable';
import Tabs from '../../_components/Tabs';
import FilterBar from '../../_components/FilterBar';
import FileUpload from '../../_components/FileUpload';
import Modal from '../../_components/Modal';
import { documents, carriers } from '../../_data/mock-data';

/* ---------- Stats ---------- */
const stats = [
  {
    title: 'Total Documents',
    value: 156,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h8l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <path d="M12 2v4h4" />
      </svg>
    ),
  },
  {
    title: 'Pending Review',
    value: 8,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Expiring Soon',
    value: 12,
    changeType: 'down' as const,
    change: 4,
    subtitle: 'within 90 days',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v6l4 2" />
        <circle cx="10" cy="10" r="8" />
      </svg>
    ),
  },
  {
    title: 'Expired',
    value: 3,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M7 7l6 6M13 7l-6 6" />
      </svg>
    ),
  },
];

/* ---------- Tabs ---------- */
const docTabs = [
  { id: 'all', label: 'All Documents', count: 156 },
  { id: 'bol', label: 'BOL', count: 42 },
  { id: 'pod', label: 'POD', count: 38 },
  { id: 'invoice', label: 'Invoices', count: 31 },
  { id: 'insurance', label: 'Insurance', count: 18 },
  { id: 'permit', label: 'Permits', count: 15 },
  { id: 'contract', label: 'Contracts', count: 12 },
];

/* ---------- Type config ---------- */
const typeConfig: Record<string, { label: string; color: string }> = {
  bol: { label: 'BOL', color: 'bg-blue-500/20 text-blue-400' },
  pod: { label: 'POD', color: 'bg-emerald-500/20 text-emerald-400' },
  invoice: { label: 'Invoice', color: 'bg-purple-500/20 text-purple-400' },
  insurance: { label: 'Insurance', color: 'bg-cyan-500/20 text-cyan-400' },
  permit: { label: 'Permit', color: 'bg-yellow-500/20 text-yellow-400' },
  contract: { label: 'Contract', color: 'bg-orange-500/20 text-orange-400' },
};

const statusConfig: Record<string, { label: string; classes: string }> = {
  valid: { label: 'Valid', classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' },
  expired: { label: 'Expired', classes: 'bg-red-400/10 text-red-400 border-red-400/20' },
  pending_review: { label: 'Pending Review', classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
};

/* ---------- Filters ---------- */
const filters = [
  {
    id: 'type',
    label: 'Type',
    options: [
      { value: 'bol', label: 'BOL' },
      { value: 'pod', label: 'POD' },
      { value: 'invoice', label: 'Invoice' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'permit', label: 'Permit' },
      { value: 'contract', label: 'Contract' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'valid', label: 'Valid' },
      { value: 'expired', label: 'Expired' },
      { value: 'pending_review', label: 'Pending Review' },
    ],
  },
];

/* ---------- Expiration alerts ---------- */
const expirationAlerts = [
  { carrier: 'Southern Tanker Lines', doc: 'Insurance Certificate', expiry: '2025-07-10', daysLeft: 104 },
  { carrier: 'Great Plains Logistics', doc: 'Insurance Certificate', expiry: '2025-06-30', daysLeft: 94 },
  { carrier: 'Pacific Northwest Express', doc: 'MC Authority', expiry: '2025-12-01', daysLeft: 248 },
];

/* ---------- Table rows ---------- */
type DocRow = Record<string, unknown> & {
  name: string;
  type: string;
  related: string;
  uploadedBy: string;
  uploadedAt: string;
  expiresAt: string;
  status: string;
};

const docRows: DocRow[] = documents.map((d) => ({
  name: d.name,
  type: d.type,
  related: d.loadId ?? d.carrier ?? '-',
  uploadedBy: d.uploadedBy,
  uploadedAt: d.uploadedAt,
  expiresAt: d.expiresAt ?? '-',
  status: d.status,
}));

const tableColumns = [
  { key: 'name', label: 'Name' },
  {
    key: 'type',
    label: 'Type',
    render: (val: unknown) => {
      const t = val as string;
      const cfg = typeConfig[t] ?? { label: t, color: 'bg-slate-500/20 text-slate-400' };
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.color}`}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 1h7l3 3v10a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" strokeLinejoin="round" />
          </svg>
          {cfg.label}
        </span>
      );
    },
  },
  { key: 'related', label: 'Related Load/Carrier' },
  { key: 'uploadedBy', label: 'Uploaded By' },
  { key: 'uploadedAt', label: 'Date' },
  { key: 'expiresAt', label: 'Expiry' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const cfg = statusConfig[s] ?? { label: s, classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20' };
      return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.classes}`}>
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {cfg.label}
        </span>
      );
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <div className="flex items-center gap-1">
        <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200" title="View">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" />
            <path d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z" />
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

/* ---------- Compliance cards ---------- */
const complianceCards = carriers.slice(0, 4).map((c) => ({
  name: c.name,
  mcNumber: c.mcNumber,
  insuranceExpiry: c.insuranceExpiry,
  safetyScore: c.safetyScore,
  status: c.status,
}));

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  const filteredDocs = docRows.filter((d) => {
    if (activeTab !== 'all' && d.type !== activeTab) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Document Center</h1>
          <p className="text-sm text-slate-400">Manage all freight and compliance documents</p>
        </div>
        <button
          type="button"
          onClick={() => setShowUpload(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Upload Modal */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title="Upload Documents" size="lg">
        <FileUpload accept=".pdf,.doc,.docx,.jpg,.png" maxSizeMB={25} />
      </Modal>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <KPICard key={s.title} {...s} />
        ))}
      </div>

      {/* Tabs */}
      <Tabs tabs={docTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Filter / Search */}
      <FilterBar
        filters={filters}
        onFilterChange={() => {}}
        searchPlaceholder="Search documents..."
        onSearchChange={setSearch}
      />

      {/* Table */}
      <DataTable<DocRow> columns={tableColumns} data={filteredDocs} />

      {/* Bottom Row: Compliance + Expiration Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Compliance Status */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Carrier Compliance Status</h3>
          <div className="space-y-3">
            {complianceCards.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.mcNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Safety Score</p>
                    <p className={`text-sm font-semibold ${c.safetyScore >= 90 ? 'text-emerald-400' : c.safetyScore >= 80 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {c.safetyScore}%
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiration Alerts */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Expiration Alerts</h3>
          <div className="space-y-3">
            {expirationAlerts.map((a) => (
              <div key={`${a.carrier}-${a.doc}`} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${a.daysLeft <= 90 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 1l7 13H1L8 1zM8 6v4M8 12h.01" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-200">{a.carrier}</p>
                  <p className="text-xs text-slate-500">{a.doc} - Expires {a.expiry}</p>
                </div>
                <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.daysLeft <= 90 ? 'bg-orange-400/10 text-orange-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                  {a.daysLeft} days
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
