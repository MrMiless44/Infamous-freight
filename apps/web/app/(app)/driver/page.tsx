'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '../../_components/StatusBadge';
import { loads, drivers } from '../../_data/mock-data';

const driver = drivers[0]; // Marcus Johnson
const currentLoad = loads.find((l) => l.id === driver.currentLoad);
const upcomingLoads = loads.filter((l) => l.status === 'assigned').slice(0, 3);

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

export default function DriverHomePage() {
  const [available, setAvailable] = useState(true);

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      {/* Welcome + Availability */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Welcome back, Marcus</h1>
          <p className="text-sm text-slate-400">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAvailable(!available)}
          className={`relative inline-flex h-8 w-[120px] items-center rounded-full border px-1 text-xs font-semibold transition-colors ${
            available
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-slate-700 bg-slate-800 text-slate-400'
          }`}
        >
          <span
            className={`absolute left-1 h-6 w-[56px] rounded-full transition-all ${
              available ? 'translate-x-[56px] bg-emerald-500' : 'translate-x-0 bg-slate-600'
            }`}
          />
          <span className={`relative z-10 w-[56px] text-center ${!available ? 'text-white' : ''}`}>
            Off Duty
          </span>
          <span className={`relative z-10 w-[56px] text-center ${available ? 'text-white' : ''}`}>
            Available
          </span>
        </button>
      </div>

      {/* Current Load Card */}
      {currentLoad && (
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Current Load</h2>
            <StatusBadge status={currentLoad.status === 'picked_up' ? 'at_pickup' : currentLoad.status as any} size="sm" />
          </div>
          <p className="text-xs font-medium text-slate-400">{currentLoad.loadNumber}</p>
          <p className="mt-1 text-sm text-white">
            {currentLoad.origin.city}, {currentLoad.origin.state}
            <span className="mx-2 text-slate-500">&rarr;</span>
            {currentLoad.destination.city}, {currentLoad.destination.state}
          </p>
          {currentLoad.eta && (
            <p className="mt-1 text-xs text-slate-500">ETA: {currentLoad.eta}</p>
          )}
          <Link
            href={`/driver/loads/${currentLoad.id}`}
            className="mt-3 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            {currentLoad.status === 'in_transit' ? 'Confirm Delivery' : 'View Details'}
          </Link>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Miles Today', value: '347' },
          { label: 'Loads Done', value: '1' },
          { label: 'Earnings', value: '$485' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-[#161b22] p-3 text-center">
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[11px] text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              title: 'View Load',
              href: '/driver/loads',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="2" y="4" width="16" height="10" rx="1.5" />
                  <path d="M6 14v2M14 14v2M2 9h16" />
                </svg>
              ),
            },
            {
              title: 'Upload Doc',
              href: '/driver/documents',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <path d="M14 2v6h6M12 18v-6M9 15l3-3 3 3" />
                </svg>
              ),
            },
            {
              title: 'Messages',
              href: '/driver/messages',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              ),
            },
            {
              title: 'Earnings',
              href: '/driver/earnings',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 2v20M6 6c0-2 12-2 12 0s-12 2-12 4 12 2 12 0" />
                </svg>
              ),
            },
          ].map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-700 bg-[#0d1117] p-4 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
            >
              <span className="text-slate-400">{action.icon}</span>
              <span className="text-xs font-medium text-slate-300">{action.title}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Loads */}
      {upcomingLoads.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white">Upcoming Loads</h2>
          <div className="space-y-3">
            {upcomingLoads.map((load) => (
              <Link
                key={load.id}
                href={`/driver/loads/${load.id}`}
                className="block rounded-xl border border-slate-800 bg-[#161b22] p-4 transition-colors hover:border-slate-700"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{load.loadNumber}</span>
                  <StatusBadge status="assigned" size="sm" />
                </div>
                <p className="mt-1 text-sm text-white">
                  {load.origin.city}, {load.origin.state}
                  <span className="mx-2 text-slate-500">&rarr;</span>
                  {load.destination.city}, {load.destination.state}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{load.pickupDate}</span>
                  <span>{equipmentLabels[load.equipmentType] ?? load.equipmentType}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
