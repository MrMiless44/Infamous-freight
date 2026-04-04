'use client';

import KPICard from '../../_components/KPICard';
import DataTable from '../../_components/DataTable';
import StatusBadge from '../../_components/StatusBadge';
import { loads, drivers } from '../../_data/mock-data';

/* ---------- KPI data ---------- */
const kpis = [
  {
    title: 'Active Loads',
    value: 12,
    change: 8,
    changeType: 'up' as const,
    subtitle: 'vs last week',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="10" rx="1.5" />
        <path d="M6 14v2M14 14v2M2 9h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Drivers Active',
    value: 8,
    change: 2,
    changeType: 'up' as const,
    subtitle: 'on the road',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="3" />
        <path d="M4 17c0-3 2.5-5.5 6-5.5s6 2.5 6 5.5" />
      </svg>
    ),
  },
  {
    title: 'Revenue MTD',
    value: '$124,500',
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
    title: 'On-Time Rate',
    value: '95%',
    change: 2,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
];

/* ---------- Available loads to claim ---------- */
const availableLoads = loads.filter((l) => l.status === 'posted' || l.status === 'draft').slice(0, 3);

type AvailableRow = Record<string, unknown> & {
  loadNumber: string;
  route: string;
  equipment: string;
  weight: string;
  rate: string;
  actions: string;
};

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed', step_deck: 'Step Deck',
  tanker: 'Tanker', intermodal: 'Intermodal', box_truck: 'Box Truck', ltl: 'LTL',
};

const availableColumns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'route', label: 'Route' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'weight', label: 'Weight' },
  { key: 'rate', label: 'Rate' },
  {
    key: 'actions',
    label: '',
    render: () => (
      <button type="button" className="rounded bg-blue-600/20 px-3 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/30">
        Claim
      </button>
    ),
  },
];

const availableData: AvailableRow[] = availableLoads.map((l) => ({
  loadNumber: l.loadNumber,
  route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
  equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
  weight: `${(l.weight / 1000).toFixed(0)}K lbs`,
  rate: `$${l.rate.toLocaleString()}`,
  actions: '',
}));

/* ---------- Active loads table ---------- */
const activeLoads = loads.filter((l) =>
  l.carrier?.name === 'Great Plains Logistics' &&
  ['in_transit', 'assigned', 'picked_up'].includes(l.status),
);

type ActiveRow = Record<string, unknown> & {
  loadNumber: string;
  route: string;
  status: string;
  driver: string;
  eta: string;
};

const activeColumns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'route', label: 'Route' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const mapped = s === 'picked_up' ? 'at_pickup' : s === 'posted' ? 'pending' : s;
      return <StatusBadge status={mapped as 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'} size="sm" />;
    },
  },
  { key: 'driver', label: 'Driver' },
  { key: 'eta', label: 'ETA' },
];

const activeData: ActiveRow[] = activeLoads.map((l) => ({
  loadNumber: l.loadNumber,
  route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
  status: l.status,
  driver: l.driver?.name ?? 'Unassigned',
  eta: l.eta ?? '-',
}));

/* ---------- Performance summary ---------- */
const performanceStats = [
  { label: 'On-Time Deliveries', value: '95%', color: 'text-emerald-400' },
  { label: 'Safety Score', value: '92/100', color: 'text-blue-400' },
  { label: 'Customer Rating', value: '4.7/5', color: 'text-yellow-400' },
  { label: 'Load Acceptance', value: '88%', color: 'text-purple-400' },
];

export default function CarrierDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Great Plains Logistics
          </h1>
          <p className="text-sm text-slate-400">Carrier Portal Dashboard</p>
        </div>
        <a
          href="/carrier/available"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          View Available Loads
        </a>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Available Loads */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Available Loads to Claim</h3>
          <a href="/carrier/available" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View All
          </a>
        </div>
        <DataTable<AvailableRow> columns={availableColumns} data={availableData} emptyMessage="No loads available" />
      </div>

      {/* Active Loads */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Active Loads</h3>
          <a href="/carrier/loads" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View All
          </a>
        </div>
        <DataTable<ActiveRow> columns={activeColumns} data={activeData} emptyMessage="No active loads" />
      </div>

      {/* Performance Summary */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Performance Summary</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {performanceStats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
