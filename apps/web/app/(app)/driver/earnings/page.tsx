'use client';

import { useState } from 'react';
import { loads, drivers } from '../../../_data/mock-data';

const driver = drivers[0]; // Marcus Johnson
const completedLoads = loads.filter((l) => l.status === 'delivered');

const periods = [
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
];

const weeklyData = [
  { day: 'Mon', amount: 680 },
  { day: 'Tue', amount: 520 },
  { day: 'Wed', amount: 890 },
  { day: 'Thu', amount: 340 },
  { day: 'Fri', amount: 770 },
  { day: 'Sat', amount: 0 },
  { day: 'Sun', amount: 0 },
];

const maxAmount = Math.max(...weeklyData.map((d) => d.amount), 1);

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState('week');

  const totalEarnings =
    period === 'week'
      ? driver.earnings.thisWeek
      : period === 'month'
        ? driver.earnings.thisMonth
        : 9800;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <h1 className="text-xl font-bold text-white">Earnings</h1>

      {/* Period Selector */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              period === p.id
                ? 'bg-blue-600 text-white'
                : 'border border-slate-700 bg-[#0d1117] text-slate-400 hover:text-slate-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Total Earnings */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5 text-center">
        <p className="text-sm text-slate-400">Total Earnings</p>
        <p className="mt-1 text-3xl font-bold text-emerald-400">
          ${totalEarnings.toLocaleString()}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'Last month'}
        </p>
      </div>

      {/* Weekly Bar Chart */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-4 text-sm font-semibold text-white">Weekly Breakdown</h2>
        <div className="flex h-36 items-end gap-2">
          {weeklyData.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">
                {d.amount > 0 ? `$${d.amount}` : ''}
              </span>
              <div className="w-full">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all"
                  style={{ height: `${d.amount > 0 ? (d.amount / maxAmount) * 100 : 2}px` }}
                />
              </div>
              <span className="text-[10px] text-slate-500">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Load Breakdown */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Earnings by Load</h2>
        {completedLoads.length === 0 ? (
          <p className="text-xs text-slate-500">No completed loads.</p>
        ) : (
          <div className="space-y-3">
            {completedLoads.map((load) => (
              <div
                key={load.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1117] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">{load.loadNumber}</p>
                  <p className="text-[11px] text-slate-500">
                    {load.origin.city}, {load.origin.state} &rarr;{' '}
                    {load.destination.city}, {load.destination.state}
                  </p>
                  <p className="text-[11px] text-slate-600">{load.deliveryDate}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-semibold text-emerald-400">
                    ${load.rate.toLocaleString()}
                  </p>
                  <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    Paid
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
