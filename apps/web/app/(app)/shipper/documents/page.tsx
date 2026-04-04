'use client';

import { useState, useMemo } from 'react';
import DataTable from '../../../_components/DataTable';
import FileUpload from '../../../_components/FileUpload';
import Tabs from '../../../_components/Tabs';
import { documents } from '../../../_data/mock-data';

const typeIcons: Record<string, string> = {
  bol: 'BOL',
  pod: 'POD',
  invoice: 'INV',
  insurance: 'INS',
  permit: 'PER',
  contract: 'CON',
};

const typeColors: Record<string, string> = {
  bol: 'bg-blue-600/20 text-blue-400',
  pod: 'bg-emerald-600/20 text-emerald-400',
  invoice: 'bg-purple-600/20 text-purple-400',
  insurance: 'bg-orange-600/20 text-orange-400',
  permit: 'bg-cyan-600/20 text-cyan-400',
  contract: 'bg-slate-600/20 text-slate-400',
};

const tabs = [
  { id: 'all', label: 'All', count: documents.length },
  { id: 'bol', label: 'BOL', count: documents.filter((d) => d.type === 'bol').length },
  { id: 'pod', label: 'POD', count: documents.filter((d) => d.type === 'pod').length },
  { id: 'invoice', label: 'Invoice', count: documents.filter((d) => d.type === 'invoice').length },
];

type DocRow = Record<string, unknown> & {
  name: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  fileSize: string;
  status: string;
  actions: string;
};

const columns = [
  {
    key: 'type',
    label: 'Type',
    render: (val: unknown) => {
      const t = val as string;
      return (
        <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${typeColors[t] ?? 'bg-slate-600/20 text-slate-400'}`}>
          {typeIcons[t] ?? t.toUpperCase()}
        </span>
      );
    },
  },
  { key: 'name', label: 'Document Name' },
  { key: 'uploadedBy', label: 'Uploaded By' },
  { key: 'uploadedAt', label: 'Date' },
  { key: 'fileSize', label: 'Size' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const cls =
        s === 'valid'
          ? 'text-emerald-400'
          : s === 'expired'
            ? 'text-red-400'
            : 'text-yellow-400';
      return <span className={`text-xs font-medium ${cls}`}>{s === 'pending_review' ? 'Pending Review' : s.charAt(0).toUpperCase() + s.slice(1)}</span>;
    },
  },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7 2v8M3 7l4 4 4-4" />
        </svg>
        Download
      </button>
    ),
  },
];

export default function ShipperDocumentsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredDocs = useMemo(() => {
    if (activeTab === 'all') return documents;
    return documents.filter((d) => d.type === activeTab);
  }, [activeTab]);

  const tableData: DocRow[] = filteredDocs.map((d) => ({
    name: d.name,
    type: d.type,
    uploadedBy: d.uploadedBy,
    uploadedAt: d.uploadedAt,
    fileSize: d.fileSize,
    status: d.status,
    actions: '',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Documents</h1>
        <p className="text-sm text-slate-400">Manage your shipment documents</p>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <DataTable<DocRow> columns={columns} data={tableData} emptyMessage="No documents found" />

      {/* Upload Area */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Upload Documents</h3>
        <FileUpload accept=".pdf,.png,.jpg,.jpeg" maxSizeMB={25} />
      </div>
    </div>
  );
}
