'use client';

import { useState, useMemo } from 'react';
import FilterBar from '../../../_components/FilterBar';
import { carriers } from '../../../_data/mock-data';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const filters = [
  { id: 'status', label: 'All Statuses', options: statusOptions },
];

const statusBadgeColors: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  suspended: 'bg-red-400/10 text-red-400 border-red-400/20',
  pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  pending: 'Pending',
};

function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-emerald-400';
  if (rating >= 4.0) return 'text-blue-400';
  if (rating >= 3.5) return 'text-yellow-400';
  return 'text-red-400';
}

function getSafetyColor(score: number): string {
  if (score >= 90) return 'text-emerald-400';
  if (score >= 80) return 'text-yellow-400';
  return 'text-red-400';
}

export default function CarriersPage() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);

  const filteredCarriers = useMemo(() => {
    return carriers.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.mcNumber.toLowerCase().includes(q) && !c.dotNumber.toLowerCase().includes(q)) return false;
      }
      if (activeFilters.status && c.status !== activeFilters.status) return false;
      return true;
    });
  }, [search, activeFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Carrier Management</h1>
          <p className="text-sm text-slate-400">{carriers.length} registered carriers</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add Carrier
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search by name, MC#, or DOT#..."
        onSearchChange={setSearch}
      />

      {/* Carrier Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Carrier</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">MC #</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">DOT #</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Fleet Size</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Rating</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">On-Time %</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Safety Score</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCarriers.map((carrier) => (
              <>
                <tr key={carrier.id} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedCarrier(expandedCarrier === carrier.id ? null : carrier.id)}
                      className="text-left"
                    >
                      <span className="font-medium text-slate-200">{carrier.name}</span>
                      <p className="text-[11px] text-slate-500">{carrier.contact}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{carrier.mcNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{carrier.dotNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{carrier.fleetSize}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-semibold ${getRatingColor(carrier.rating)}`}>{carrier.rating}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeColors[carrier.status]}`}>
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {statusLabels[carrier.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={carrier.onTimeRate >= 95 ? 'text-emerald-400' : carrier.onTimeRate >= 90 ? 'text-yellow-400' : 'text-red-400'}>
                      {carrier.onTimeRate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`font-semibold ${getSafetyColor(carrier.safetyScore)}`}>{carrier.safetyScore}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedCarrier(expandedCarrier === carrier.id ? null : carrier.id)}
                        className="rounded-lg px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-400/10"
                      >
                        Details
                      </button>
                      {carrier.status === 'active' ? (
                        <button type="button" className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-400/10">
                          Suspend
                        </button>
                      ) : (
                        <button type="button" className="rounded-lg px-2 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-400/10">
                          Approve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedCarrier === carrier.id && (
                  <tr key={`${carrier.id}-detail`}>
                    <td colSpan={9} className="bg-slate-800/20 px-6 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-[11px] font-medium uppercase text-slate-500">Contact</p>
                          <p className="text-sm text-slate-300">{carrier.contact}</p>
                          <p className="text-xs text-slate-400">{carrier.phone}</p>
                          <p className="text-xs text-slate-400">{carrier.email}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-slate-500">Load Stats</p>
                          <p className="text-sm text-slate-300">Active: {carrier.activeLoads}</p>
                          <p className="text-xs text-slate-400">Total: {carrier.totalLoads.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-slate-500">Insurance</p>
                          <p className="text-sm text-slate-300">Expires: {carrier.insuranceExpiry}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-medium uppercase text-slate-500">Fleet</p>
                          <p className="text-sm text-slate-300">{carrier.fleetSize} vehicles</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
