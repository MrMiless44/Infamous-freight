'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import DataTable from '../../_components/DataTable';
import StatusBadge from '../../_components/StatusBadge';
import { loads, notifications } from '../../_data/mock-data';

/* ---------- KPI data ---------- */
const kpis = [
  {
    title: 'Active Shipments',
    value: 5,
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
    title: 'Pending Quotes',
    value: 3,
    change: 2,
    changeType: 'neutral' as const,
    subtitle: 'awaiting response',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Delivered This Month',
    value: 18,
    change: 15,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10l5 5L17 5" />
      </svg>
    ),
  },
  {
    title: 'Spend MTD',
    value: '$47,200',
    change: 8,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v16M6 6c0-2 8-2 8 0s-8 2-8 4 8 2 8 0" />
      </svg>
    ),
  },
];

/* ---------- Quick Actions ---------- */
const quickActions = [
  {
    title: 'Create Shipment',
    href: '/shipper/create',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: 'Track Shipment',
    href: '/shipper/tracking',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="3" />
        <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
      </svg>
    ),
  },
  {
    title: 'View Invoices',
    href: '/shipper/invoices',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path d="M14 2v4h4M8 13h8M8 17h5" />
      </svg>
    ),
  },
];

/* ---------- Table ---------- */
type ShipmentRow = Record<string, unknown> & {
  tracking: string;
  route: string;
  status: string;
  carrier: string;
  eta: string;
};

const tableColumns = [
  { key: 'tracking', label: 'Tracking #' },
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
  { key: 'carrier', label: 'Carrier' },
  { key: 'eta', label: 'ETA' },
];

const shipperLoads = loads.filter((l) => l.shipper.name === 'Midwest Steel Corp' || l.status === 'in_transit' || l.status === 'assigned').slice(0, 6);

const recentShipments: ShipmentRow[] = shipperLoads.map((l) => ({
  tracking: `IF-TRK-${l.id.replace('LD-2024-', '')}`,
  route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
  status: l.status,
  carrier: l.carrier?.name ?? 'Unassigned',
  eta: l.eta ?? '-',
}));

/* ---------- Notification colors ---------- */
const notifColors: Record<string, string> = {
  shipment: 'bg-blue-500/20 text-blue-400',
  system: 'bg-slate-500/20 text-slate-400',
  delay: 'bg-orange-500/20 text-orange-400',
  document: 'bg-purple-500/20 text-purple-400',
  payment: 'bg-emerald-500/20 text-emerald-400',
  message: 'bg-cyan-500/20 text-cyan-400',
};

export default function ShipperDashboardPage() {
  const [, setSelectedAction] = useState('');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome, Midwest Steel Corp
          </h1>
          <p className="text-sm text-slate-400">Shipper Portal Dashboard</p>
        </div>
        <a
          href="/shipper/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          New Shipment
        </a>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Recent Shipments Table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Recent Shipments</h3>
          <a href="/shipper/shipments" className="text-xs font-medium text-blue-400 hover:text-blue-300">
            View All
          </a>
        </div>
        <DataTable<ShipmentRow> columns={tableColumns} data={recentShipments} />
      </div>

      {/* Quick Actions + Notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                onClick={() => setSelectedAction(action.title)}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-[#0d1117] p-3 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
              >
                <span className="text-slate-400">{action.icon}</span>
                <span className="text-sm font-medium text-slate-300">{action.title}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            <span className="rounded-full bg-blue-600/20 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
              {notifications.filter((n) => !n.read).length} new
            </span>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 4).map((n) => (
              <div key={n.id} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${notifColors[n.type] ?? notifColors.system}`}
                >
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
      </div>
    </div>
  );
}
