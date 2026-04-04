'use client';

import { useState } from 'react';
import Timeline from '../../../_components/Timeline';
import StatusBadge from '../../../_components/StatusBadge';
import { shipments } from '../../../_data/mock-data';
import type { LoadStatus } from '../../../_data/mock-data';

const statusBadgeMap: Record<string, 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'> = {
  in_transit: 'in_transit',
  picked_up: 'at_pickup',
  delivered: 'delivered',
  delayed: 'delayed',
  assigned: 'assigned',
  posted: 'pending',
  draft: 'pending',
  cancelled: 'cancelled',
};

export default function PublicTrackingPage() {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<typeof shipments[number] | null>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch() {
    if (!search.trim()) return;
    const q = search.trim().toUpperCase();
    const found = shipments.find(
      (s) => s.trackingNumber.toUpperCase() === q || s.trackingNumber.toUpperCase().includes(q),
    );
    setResult(found ?? null);
    setSearched(true);
  }

  const timelineSteps = result
    ? result.milestones.map((m, i) => {
        const nextUncompleted = result.milestones.findIndex((ms) => !ms.completed);
        return {
          label: m.label,
          time: m.time || undefined,
          completed: m.completed,
          active: i === nextUncompleted,
        };
      })
    : [];

  return (
    <div className="min-h-screen space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Branded header */}
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
            IF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Inf<span className="text-blue-400">ae</span>mous Freight
          </h1>
        </div>
        <p className="text-sm text-slate-400">Track your shipment in real-time</p>
      </div>

      {/* Search box */}
      <div className="mx-auto max-w-xl">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Enter tracking number (e.g., IF-TRK-847291)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border border-slate-700 bg-[#0d1117] py-3 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Track
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-600">
          Try: IF-TRK-847291, IF-TRK-847295, IF-TRK-847300
        </p>
      </div>

      {/* Results */}
      {searched && !result && (
        <div className="mx-auto max-w-xl rounded-xl border border-slate-800 bg-[#161b22] p-8 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 text-slate-600" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <p className="text-sm font-medium text-white">No shipment found</p>
          <p className="mt-1 text-xs text-slate-400">Please check the tracking number and try again.</p>
        </div>
      )}

      {result && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Status header */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">Tracking Number</p>
                <p className="mt-1 text-xl font-bold text-white">{result.trackingNumber}</p>
              </div>
              <StatusBadge status={statusBadgeMap[result.status] ?? 'pending'} />
            </div>

            {/* Progress */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">Delivery Progress</span>
                <span className="font-semibold text-white">{result.progress}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full rounded-full ${
                    result.status === 'delayed'
                      ? 'bg-orange-500'
                      : result.status === 'delivered'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${result.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs font-medium uppercase text-slate-500">From</p>
                <p className="mt-1 text-base font-semibold text-white">{result.origin.city}, {result.origin.state}</p>
              </div>
              <div className="px-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-600">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className="text-center flex-1">
                <p className="text-xs font-medium uppercase text-slate-500">To</p>
                <p className="mt-1 text-base font-semibold text-white">{result.destination.city}, {result.destination.state}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-sm">
              <div>
                <span className="text-xs text-slate-500">Estimated Arrival</span>
                <p className="mt-0.5 font-medium text-white">{result.eta}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Carrier</span>
                <p className="mt-0.5 font-medium text-white">{result.carrier}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
            <h3 className="mb-4 text-sm font-semibold text-white">Shipment Timeline</h3>
            <Timeline steps={timelineSteps} />
          </div>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600">
            For questions about your shipment, contact us at support@infamousfreight.com
          </p>
        </div>
      )}
    </div>
  );
}
