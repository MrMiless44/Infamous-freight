'use client';

import DataTable from '../../../_components/DataTable';
import FileUpload from '../../../_components/FileUpload';
import { documents } from '../../../_data/mock-data';

/* ---------- Compliance status cards ---------- */
const complianceItems = [
  {
    title: 'Insurance',
    status: 'Valid',
    statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    detail: 'Expires Jun 30, 2025',
    detailColor: 'text-yellow-400',
  },
  {
    title: 'MC Authority',
    status: 'Valid',
    statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    detail: 'MC-784921',
    detailColor: 'text-slate-400',
  },
  {
    title: 'Safety Rating',
    status: 'Satisfactory',
    statusColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    detail: 'Score: 92/100',
    detailColor: 'text-slate-400',
  },
  {
    title: 'DOT Number',
    status: 'Active',
    statusColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    detail: 'DOT-2847561',
    detailColor: 'text-slate-400',
  },
];

/* ---------- Document list ---------- */
const carrierDocs = documents.filter(
  (d) => d.type === 'insurance' || d.type === 'permit' || d.type === 'contract',
);

const typeLabels: Record<string, string> = {
  insurance: 'Insurance',
  permit: 'Permit',
  contract: 'Contract',
};

const typeColors: Record<string, string> = {
  insurance: 'bg-orange-600/20 text-orange-400',
  permit: 'bg-cyan-600/20 text-cyan-400',
  contract: 'bg-slate-600/20 text-slate-400',
};

type DocRow = Record<string, unknown> & {
  name: string;
  type: string;
  carrier: string;
  uploadedAt: string;
  expiresAt: string;
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
          {typeLabels[t] ?? t}
        </span>
      );
    },
  },
  { key: 'name', label: 'Document' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'uploadedAt', label: 'Uploaded' },
  { key: 'expiresAt', label: 'Expires' },
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
    label: '',
    render: () => (
      <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300">
        Download
      </button>
    ),
  },
];

const tableData: DocRow[] = carrierDocs.map((d) => ({
  name: d.name,
  type: d.type,
  carrier: d.carrier ?? '-',
  uploadedAt: d.uploadedAt,
  expiresAt: d.expiresAt ?? '-',
  status: d.status,
  actions: '',
}));

/* ---------- Expiration alerts ---------- */
const expiringDocs = carrierDocs.filter((d) => d.expiresAt);

export default function CarrierCompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Documents &amp; Compliance</h1>
        <p className="text-sm text-slate-400">Manage compliance documents, insurance, and permits</p>
      </div>

      {/* Compliance Status Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {complianceItems.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <p className="text-xs font-medium text-slate-400">{item.title}</p>
            <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${item.statusColor}`}>
              <span className="mr-1.5 h-2 w-2 rounded-full bg-current opacity-80" />
              {item.status}
            </span>
            <p className={`mt-2 text-xs ${item.detailColor}`}>{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Expiration Alerts */}
      {expiringDocs.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-yellow-400">Expiration Alerts</h3>
          <div className="space-y-2">
            {expiringDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-300">{d.name}</span>
                <span className="text-yellow-400">Expires: {d.expiresAt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Table */}
      <DataTable<DocRow> columns={columns} data={tableData} emptyMessage="No compliance documents found" />

      {/* Upload Area */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Upload Documents</h3>
        <FileUpload accept=".pdf,.png,.jpg,.jpeg" maxSizeMB={25} />
      </div>
    </div>
  );
}
