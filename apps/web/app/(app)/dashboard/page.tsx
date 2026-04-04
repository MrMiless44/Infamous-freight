import KPICard from '../../_components/KPICard';
import ChartCard from '../../_components/ChartCard';
import StatusBadge from '../../_components/StatusBadge';
import DataTable from '../../_components/DataTable';
import { loads, notifications } from '../../_data/mock-data';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Dashboard' };

/* ---------- KPI data ---------- */
const kpis = [
  {
    title: 'Active Loads',
    value: 47,
    change: 12,
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
    title: 'Delivered Today',
    value: 23,
    change: 8,
    changeType: 'up' as const,
    subtitle: 'vs last week',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l5 5L17 5" />
      </svg>
    ),
  },
  {
    title: 'In Transit',
    value: 31,
    change: 3,
    changeType: 'down' as const,
    subtitle: 'vs last week',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="6" width="12" height="8" rx="1" />
        <path d="M13 9h3l2.5 3V14h-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5.5" cy="15" r="1.5" />
        <circle cx="15.5" cy="15" r="1.5" />
      </svg>
    ),
  },
  {
    title: 'Delayed',
    value: 4,
    change: 2,
    changeType: 'up' as const,
    subtitle: '+2 from yesterday',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Revenue (MTD)',
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
    title: 'Carrier Utilization',
    value: '78%',
    change: 5,
    changeType: 'up' as const,
    subtitle: 'vs last week',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 17V10M8 17V6M13 17V8M18 17V3" />
      </svg>
    ),
  },
];

/* ---------- Fleet status ---------- */
const fleetStatus = [
  { label: 'Available', count: 12, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { label: 'On Route', count: 31, color: 'bg-blue-500', textColor: 'text-blue-400' },
  { label: 'Off Duty', count: 4, color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  { label: 'Maintenance', count: 2, color: 'bg-red-500', textColor: 'text-red-400' },
];
const fleetTotal = fleetStatus.reduce((acc, s) => acc + s.count, 0);

/* ---------- Quick Actions ---------- */
const quickActions = [
  {
    title: 'Create Load',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: 'Assign Driver',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    title: 'Track Shipment',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="3" />
        <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
      </svg>
    ),
  },
  {
    title: 'Generate Report',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path d="M14 2v4h4M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

/* ---------- Table columns ---------- */
type LoadRow = Record<string, unknown> & {
  loadNumber: string;
  route: string;
  status: string;
  equipment: string;
  rate: string;
  driver: string;
  eta: string;
};

const tableColumns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'route', label: 'Origin / Destination' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const mapped = s === 'picked_up' ? 'at_pickup' : s === 'posted' ? 'pending' : s;
      return <StatusBadge status={mapped as 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'} size="sm" />;
    },
  },
  { key: 'equipment', label: 'Equipment' },
  { key: 'rate', label: 'Rate' },
  { key: 'driver', label: 'Driver' },
  { key: 'eta', label: 'ETA' },
];

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  tanker: 'Tanker',
  intermodal: 'Intermodal',
  box_truck: 'Box Truck',
  ltl: 'LTL',
};

const recentLoads: LoadRow[] = loads.slice(0, 8).map((l) => ({
  loadNumber: l.loadNumber,
  route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
  status: l.status,
  equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
  rate: `$${l.rate.toLocaleString()}`,
  driver: l.driver?.name ?? 'Unassigned',
  eta: l.eta ?? '-',
}));

/* ---------- Notification icon colors ---------- */
const notifColors: Record<string, string> = {
  shipment: 'bg-blue-500/20 text-blue-400',
  system: 'bg-slate-500/20 text-slate-400',
  delay: 'bg-orange-500/20 text-orange-400',
  document: 'bg-purple-500/20 text-purple-400',
  payment: 'bg-emerald-500/20 text-emerald-400',
  message: 'bg-cyan-500/20 text-cyan-400',
};

/* ---------- Bar chart days ---------- */
const barData = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 80 },
  { label: 'Wed', value: 55 },
  { label: 'Thu', value: 90 },
  { label: 'Fri', value: 70 },
  { label: 'Sat', value: 40 },
  { label: 'Sun', value: 30 },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-sm text-slate-400">{today}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Charts + Fleet row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Shipment Activity */}
        <div className="lg:col-span-2">
          <ChartCard title="Shipment Activity" subtitle="Loads processed per day (last 7 days)">
            <div className="flex h-44 items-end gap-3 pt-4">
              {barData.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
                      style={{ height: `${d.value * 1.6}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Fleet Status */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Fleet Status</h3>
          <div className="flex items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              {/* Donut ring (CSS conic-gradient) */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(
                    #10b981 0% ${(fleetStatus[0].count / fleetTotal) * 100}%,
                    #3b82f6 ${(fleetStatus[0].count / fleetTotal) * 100}% ${((fleetStatus[0].count + fleetStatus[1].count) / fleetTotal) * 100}%,
                    #eab308 ${((fleetStatus[0].count + fleetStatus[1].count) / fleetTotal) * 100}% ${((fleetStatus[0].count + fleetStatus[1].count + fleetStatus[2].count) / fleetTotal) * 100}%,
                    #ef4444 ${((fleetStatus[0].count + fleetStatus[1].count + fleetStatus[2].count) / fleetTotal) * 100}% 100%
                  )`,
                }}
              />
              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#161b22]">
                <span className="text-2xl font-bold text-white">{fleetTotal}</span>
                <span className="text-[10px] text-slate-500">Total</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {fleetStatus.map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="text-xs text-slate-400">{s.label}</span>
                <span className={`ml-auto text-xs font-semibold ${s.textColor}`}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Loads Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Recent Loads</h3>
        <DataTable<LoadRow> columns={tableColumns} data={recentLoads} />
      </div>

      {/* Notifications + Map + Quick Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Notifications */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Notifications</h3>
          <div className="space-y-3">
            {notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${notifColors[n.type] ?? notifColors.system}`}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 5v3l2 1" />
                  </svg>
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className={`truncate text-xs font-medium ${n.read ? 'text-slate-400' : 'text-slate-200'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{n.message}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{n.time}</p>
                </div>
                {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Live Load Tracking</h3>
          <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
            <div className="text-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3" />
                <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
              </svg>
              <p className="text-sm text-slate-500">Map integration coming soon</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-700 bg-[#0d1117] p-4 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <span className="text-slate-400">{action.icon}</span>
                <span className="text-xs font-medium text-slate-300">{action.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
