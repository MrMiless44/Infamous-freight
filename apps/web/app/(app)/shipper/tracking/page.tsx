'use client';

import { useState } from 'react';
import { shipments } from '../../../_data/mock-data';

export default function ShipperTrackingPage() {
  const [search, setSearch] = useState('');

  const activeShipments = shipments.filter((s) =>
    s.status === 'in_transit' || s.status === 'assigned' || s.status === 'picked_up',
  );

  const filteredShipments = search
    ? activeShipments.filter((s) =>
        s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
        s.origin.city.toLowerCase().includes(search.toLowerCase()) ||
        s.destination.city.toLowerCase().includes(search.toLowerCase()),
      )
    : activeShipments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Live Tracking</h1>
        <p className="text-sm text-slate-400">Track your active shipments in real-time</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by tracking number..."
          className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
        />
      </div>

      {/* Map Placeholder */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Shipment Map</h3>
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
          <div className="text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-slate-600" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
            </svg>
            <p className="text-sm text-slate-500">Map integration coming soon</p>
            <p className="mt-1 text-xs text-slate-600">{activeShipments.length} active shipments being tracked</p>
          </div>
        </div>
      </div>

      {/* Active Shipment Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredShipments.map((shipment) => (
          <div
            key={shipment.id}
            className="rounded-xl border border-slate-800 bg-[#161b22] p-5 transition-colors hover:border-slate-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400">{shipment.trackingNumber}</span>
              <span className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                In Transit
              </span>
            </div>

            <div className="mb-3 text-sm text-slate-300">
              {shipment.origin.city}, {shipment.origin.state} {'\u2192'} {shipment.destination.city}, {shipment.destination.state}
            </div>

            {/* Progress bar */}
            <div className="mb-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Progress</span>
                <span>{shipment.progress}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
                  style={{ width: `${shipment.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Carrier: {shipment.carrier}</span>
              <span>ETA: {shipment.eta.split(' ')[0]}</span>
            </div>

            {shipment.currentLocation && (
              <p className="mt-2 text-[11px] text-slate-600">
                Last seen: {shipment.currentLocation.city}, {shipment.currentLocation.state}
              </p>
            )}

            <button
              type="button"
              className="mt-3 w-full rounded-lg border border-slate-700 bg-[#0d1117] py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {filteredShipments.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#161b22] px-4 py-12 text-center">
          <p className="text-sm text-slate-500">No active shipments found</p>
        </div>
      )}
    </div>
  );
}
