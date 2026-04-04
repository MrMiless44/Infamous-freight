'use client';

import DataTable from '../../../_components/DataTable';
import { drivers } from '../../../_data/mock-data';

const driverStatusClasses: Record<string, string> = {
  available: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  on_route: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  resting: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  off_duty: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
};

const driverStatusLabels: Record<string, string> = {
  available: 'Available',
  on_route: 'On Route',
  resting: 'Resting',
  off_duty: 'Off Duty',
};

type DriverRow = Record<string, unknown> & {
  name: string;
  status: string;
  currentLoad: string;
  phone: string;
  rating: string;
  onTimeRate: string;
  actions: string;
};

const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${driverStatusClasses[s] ?? ''}`}>
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {driverStatusLabels[s] ?? s}
        </span>
      );
    },
  },
  { key: 'currentLoad', label: 'Current Load' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'rating',
    label: 'Rating',
    render: (val: unknown) => {
      const r = parseFloat(val as string);
      return (
        <span className="flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-yellow-400">
            <path d="M6 0l1.8 3.6L12 4.2 8.9 7.2l.7 4.2L6 9.3 2.4 11.4l.7-4.2L0 4.2l4.2-.6L6 0z" />
          </svg>
          <span className="text-sm text-slate-300">{r.toFixed(1)}</span>
        </span>
      );
    },
  },
  {
    key: 'onTimeRate',
    label: 'On-Time %',
    render: (val: unknown) => {
      const r = parseInt(val as string);
      const color = r >= 95 ? 'text-emerald-400' : r >= 90 ? 'text-yellow-400' : 'text-red-400';
      return <span className={`text-sm font-medium ${color}`}>{r}%</span>;
    },
  },
  {
    key: 'actions',
    label: '',
    render: () => (
      <div className="flex items-center gap-2">
        <button type="button" className="rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700">
          Contact
        </button>
        <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300">
          Profile
        </button>
      </div>
    ),
  },
];

const tableData: DriverRow[] = drivers.map((d) => ({
  name: d.name,
  status: d.status,
  currentLoad: d.currentLoad ?? '-',
  phone: d.phone,
  rating: d.rating.toString(),
  onTimeRate: d.onTimeRate.toString(),
  actions: '',
}));

export default function CarrierDriversPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Drivers</h1>
        <p className="text-sm text-slate-400">Manage your driver roster and assignments</p>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(driverStatusLabels).map(([key, label]) => {
          const count = drivers.filter((d) => d.status === key).length;
          return (
            <div key={key} className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
              <p className="text-xs text-slate-500">{label}</p>
              <p className={`text-lg font-bold ${driverStatusClasses[key]?.split(' ')[1] ?? 'text-slate-300'}`}>{count}</p>
            </div>
          );
        })}
      </div>

      <DataTable<DriverRow> columns={columns} data={tableData} emptyMessage="No drivers found" />
    </div>
  );
}
