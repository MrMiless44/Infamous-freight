'use client';

import KPICard from '../../../_components/KPICard';
import ChartCard from '../../../_components/ChartCard';
import { loads, carriers, invoices } from '../../../_data/mock-data';

const totalRevenue = loads.reduce((sum, l) => sum + l.rate, 0);
const avgLoadValue = Math.round(totalRevenue / loads.length);
const outstandingAR = invoices
  .filter((i) => i.status === 'pending' || i.status === 'invoiced' || i.status === 'overdue')
  .reduce((sum, i) => sum + i.amount, 0);

const revenueKPIs = [
  {
    title: 'Total Revenue',
    value: `$${totalRevenue.toLocaleString()}`,
    change: 15,
    changeType: 'up' as const,
    subtitle: 'month to date',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v16M6 6c0-2 8-2 8 0s-8 2-8 4 8 2 8 0" />
      </svg>
    ),
  },
  {
    title: 'MoM Growth',
    value: '+15%',
    change: 3,
    changeType: 'up' as const,
    subtitle: 'vs prior month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 3 3 6-8" /><path d="M14 7h3v3" />
      </svg>
    ),
  },
  {
    title: 'Avg Load Value',
    value: `$${avgLoadValue.toLocaleString()}`,
    change: 7,
    changeType: 'up' as const,
    subtitle: 'per load',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="16" height="10" rx="1.5" /><path d="M6 14v2M14 14v2M2 9h16" />
      </svg>
    ),
  },
  {
    title: 'Outstanding AR',
    value: `$${outstandingAR.toLocaleString()}`,
    change: 12,
    changeType: 'down' as const,
    subtitle: 'accounts receivable',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2h8l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" /><path d="M13 2v4h4M7 10h6M7 14h4" />
      </svg>
    ),
  },
];

const monthlyRevenue = [
  { label: 'Oct', value: 620000 },
  { label: 'Nov', value: 710000 },
  { label: 'Dec', value: 680000 },
  { label: 'Jan', value: 740000 },
  { label: 'Feb', value: 780000 },
  { label: 'Mar', value: 847200 },
];

const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.value));

// Top customers by revenue - derived from loads
const customerRevenue = new Map<string, number>();
loads.forEach((l) => {
  const curr = customerRevenue.get(l.shipper.name) ?? 0;
  customerRevenue.set(l.shipper.name, curr + l.rate);
});
const topCustomers = Array.from(customerRevenue.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, revenue]) => ({ name, revenue }));

// Top carriers by volume
const carrierVolume = new Map<string, number>();
loads.forEach((l) => {
  if (l.carrier) {
    const curr = carrierVolume.get(l.carrier.name) ?? 0;
    carrierVolume.set(l.carrier.name, curr + 1);
  }
});
const topCarriers = Array.from(carrierVolume.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, count]) => ({ name, count }));

// Revenue by equipment type
const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed', step_deck: 'Step Deck',
  tanker: 'Tanker', intermodal: 'Intermodal', box_truck: 'Box Truck', ltl: 'LTL',
};
const equipmentRevenue = new Map<string, number>();
loads.forEach((l) => {
  const curr = equipmentRevenue.get(l.equipmentType) ?? 0;
  equipmentRevenue.set(l.equipmentType, curr + l.rate);
});
const revenueByEquipment = Array.from(equipmentRevenue.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([type, revenue]) => ({ type: equipmentLabels[type] ?? type, revenue }));

// Revenue by region
const regionRevenue = [
  { region: 'Midwest', revenue: 12400 },
  { region: 'West Coast', revenue: 11750 },
  { region: 'South', revenue: 9950 },
  { region: 'Northeast', revenue: 5800 },
  { region: 'Plains', revenue: 950 },
];

const equipmentColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500', 'bg-pink-500'];

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Revenue Analytics</h1>
        <p className="text-sm text-slate-400">Financial performance and insights</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {revenueKPIs.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Revenue Trend */}
      <ChartCard title="Revenue Trend" subtitle="Monthly revenue (last 6 months)">
        <div className="flex h-48 items-end gap-4 pt-4">
          {monthlyRevenue.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-[10px] font-medium text-slate-400">${(m.value / 1000).toFixed(0)}K</span>
              <div className="w-full">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                  style={{ height: `${(m.value / maxRevenue) * 150}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Top Customers + Top Carriers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Customers */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Customers by Revenue</h3>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{c.name}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-400">${c.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Carriers */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Top Carriers by Volume</h3>
          <div className="space-y-3">
            {topCarriers.map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{c.name}</p>
                </div>
                <span className="text-sm font-semibold text-blue-400">{c.count} loads</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue by Equipment + Revenue by Region */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Revenue by Equipment */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue by Equipment Type</h3>
          <div className="space-y-3">
            {revenueByEquipment.map((item, i) => {
              const maxVal = revenueByEquipment[0].revenue;
              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">{item.type}</span>
                    <span className="text-xs font-semibold text-slate-400">${item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${equipmentColors[i % equipmentColors.length]}`}
                      style={{ width: `${(item.revenue / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue by Region */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Revenue by Region</h3>
          <div className="space-y-3">
            {regionRevenue.map((item, i) => {
              const maxVal = regionRevenue[0].revenue;
              return (
                <div key={item.region} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">{item.region}</span>
                    <span className="text-xs font-semibold text-slate-400">${item.revenue.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${equipmentColors[i % equipmentColors.length]}`}
                      style={{ width: `${(item.revenue / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
