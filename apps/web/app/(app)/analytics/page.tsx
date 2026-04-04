'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import ChartCard from '../../_components/ChartCard';
import { carriers, drivers, loads } from '../../_data/mock-data';

/* ---------- Period selector ---------- */
const periods = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'year', label: 'This Year' },
];

/* ---------- KPIs ---------- */
const kpis = [
  {
    title: 'Total Loads',
    value: 342,
    change: 12,
    changeType: 'up' as const,
    subtitle: 'vs last period',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="16" height="10" rx="1.5" />
        <path d="M6 14v2M14 14v2M2 9h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'On-Time Rate',
    value: '94.2%',
    change: 2.1,
    changeType: 'up' as const,
    subtitle: 'vs last period',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 6v4l3 2" />
      </svg>
    ),
  },
  {
    title: 'Avg Revenue/Load',
    value: '$3,450',
    change: 8,
    changeType: 'up' as const,
    subtitle: 'vs last period',
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
    subtitle: 'vs last period',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M3 17V10M8 17V6M13 17V8M18 17V3" />
      </svg>
    ),
  },
];

/* ---------- Shipment performance ---------- */
const shipmentPerf = [
  { label: 'Delivered', count: 289, color: 'bg-emerald-500', pct: 84.5 },
  { label: 'In Transit', count: 31, color: 'bg-blue-500', pct: 9.1 },
  { label: 'Delayed', count: 14, color: 'bg-orange-500', pct: 4.1 },
  { label: 'Cancelled', count: 8, color: 'bg-red-500', pct: 2.3 },
];
const maxShipCount = Math.max(...shipmentPerf.map((s) => s.count));

/* ---------- Revenue data ---------- */
const revenueMonths = [
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
const maxRev = Math.max(...revenueMonths.map((d) => d.value));

/* ---------- Top carriers ---------- */
const topCarriers = carriers
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 5)
  .map((c) => ({
    name: c.name,
    rating: c.rating,
    onTimeRate: c.onTimeRate,
    totalLoads: c.totalLoads,
  }));

/* ---------- Top drivers ---------- */
const topDrivers = drivers
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 5)
  .map((d) => ({
    name: d.name,
    rating: d.rating,
    onTimeRate: d.onTimeRate,
    completedLoads: d.completedLoads,
  }));

/* ---------- Equipment breakdown ---------- */
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

const equipmentBreakdown = Object.entries(
  loads.reduce<Record<string, { count: number; revenue: number }>>((acc, l) => {
    const type = l.equipmentType;
    if (!acc[type]) acc[type] = { count: 0, revenue: 0 };
    acc[type].count += 1;
    acc[type].revenue += l.rate;
    return acc;
  }, {})
).map(([type, data]) => ({
  type: equipmentLabels[type] ?? type,
  count: data.count,
  revenue: data.revenue,
})).sort((a, b) => b.count - a.count);

/* ---------- Top routes ---------- */
const topRoutes = [
  { route: 'Chicago, IL -> Houston, TX', loads: 28, revenue: 135800 },
  { route: 'Los Angeles, CA -> Phoenix, AZ', loads: 24, revenue: 76800 },
  { route: 'Dallas, TX -> Memphis, TN', loads: 22, revenue: 46200 },
  { route: 'Detroit, MI -> Nashville, TN', loads: 19, revenue: 45600 },
  { route: 'Seattle, WA -> Denver, CO', loads: 18, revenue: 75600 },
  { route: 'Omaha, NE -> Kansas City, MO', loads: 16, revenue: 15200 },
  { route: 'San Jose, CA -> Portland, OR', loads: 15, revenue: 41250 },
  { route: 'Newark, NJ -> Miami, FL', loads: 14, revenue: 81200 },
  { route: 'Baton Rouge, LA -> Atlanta, GA', loads: 12, revenue: 61200 },
  { route: 'Salinas, CA -> Phoenix, AZ', loads: 11, revenue: 35200 },
];

/* ---------- Star rating helper ---------- */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm font-semibold text-yellow-400">{rating.toFixed(1)}</span>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
        <path d="M8 0l2.47 4.94L16 5.77l-4 3.83.94 5.4L8 12.42 3.06 15l.94-5.4-4-3.83 5.53-.83L8 0z" />
      </svg>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('month');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
          <p className="text-sm text-slate-400">Performance insights and business intelligence</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-slate-700 bg-[#161b22] p-1">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {p.label}
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

      {/* Shipment Performance + On-Time Rate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="Shipment Performance" subtitle="Breakdown by delivery outcome">
            <div className="space-y-3 pt-2">
              {shipmentPerf.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-20 text-xs text-slate-400">{s.label}</span>
                  <div className="flex-1">
                    <div className="h-6 w-full rounded-lg bg-slate-800/50">
                      <div
                        className={`h-full rounded-lg ${s.color} flex items-center px-2 transition-all`}
                        style={{ width: `${(s.count / maxShipCount) * 100}%` }}
                      >
                        <span className="text-[11px] font-semibold text-white">{s.count}</span>
                      </div>
                    </div>
                  </div>
                  <span className="w-12 text-right text-xs text-slate-500">{s.pct}%</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* On-Time Rate */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="text-sm font-semibold text-white">On-Time Delivery Rate</h3>
          <div className="mt-6 flex flex-col items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 0% 94.2%, #1e293b 94.2% 100%)`,
                }}
              />
              <div className="relative flex h-24 w-24 flex-col items-center justify-center rounded-full bg-[#161b22]">
                <span className="text-3xl font-bold text-emerald-400">94.2</span>
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-emerald-400">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 12V4M5 7l3-3 3 3" />
              </svg>
              <span className="font-medium">+2.1%</span>
              <span className="text-xs text-slate-500">vs last period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      <ChartCard title="Revenue Trends" subtitle="Monthly revenue overview">
        <div className="flex h-48 items-end gap-2 pt-4">
          {revenueMonths.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] text-slate-500">${(d.value / 1000).toFixed(0)}k</span>
              <div className="w-full">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
                  style={{ height: `${(d.value / maxRev) * 140}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{d.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Carrier Scorecards + Driver Performance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Carrier Scorecards */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Carrier Scorecards</h3>
          <div className="space-y-3">
            {topCarriers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.totalLoads.toLocaleString()} loads</p>
                </div>
                <div className="text-right">
                  <StarRating rating={c.rating} />
                  <p className="text-[11px] text-slate-500">{c.onTimeRate}% on-time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Performance */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Driver Performance</h3>
          <div className="space-y-3">
            {topDrivers.map((d, i) => (
              <div key={d.name} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-200">{d.name}</p>
                  <p className="text-xs text-slate-500">{d.completedLoads} loads completed</p>
                </div>
                <div className="text-right">
                  <StarRating rating={d.rating} />
                  <p className="text-[11px] text-slate-500">{d.onTimeRate}% on-time</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Load Efficiency + Geographic Breakdown */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Load Efficiency */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Load Efficiency by Equipment Type</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Equipment</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Loads</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Avg/Load</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {equipmentBreakdown.map((e) => (
                  <tr key={e.type}>
                    <td className="py-2.5 text-sm text-slate-300">{e.type}</td>
                    <td className="py-2.5 text-sm text-slate-400 text-right">{e.count}</td>
                    <td className="py-2.5 text-sm text-slate-400 text-right">${e.revenue.toLocaleString()}</td>
                    <td className="py-2.5 text-sm text-white text-right">${Math.round(e.revenue / e.count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geographic Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Routes by Volume</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Route</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Loads</th>
                  <th className="pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {topRoutes.map((r) => (
                  <tr key={r.route}>
                    <td className="py-2 text-xs text-slate-300">{r.route}</td>
                    <td className="py-2 text-xs text-slate-400 text-right">{r.loads}</td>
                    <td className="py-2 text-xs text-white text-right">${r.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
