'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import StatusBadge from '../../_components/StatusBadge';
import { loads, drivers, messages, notifications } from '../../_data/mock-data';
import type { LoadStatus } from '../../_data/mock-data';

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

const driverStatusColors: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Available' },
  on_route: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'On Route' },
  off_duty: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Off Duty' },
  resting: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Resting' },
};

// Derived data
const unassignedLoads = loads.filter((l) => l.status === 'posted' || l.status === 'draft');
const availableDrivers = drivers.filter((d) => d.status === 'available' || d.status === 'resting');
const inTransitLoads = loads.filter((l) => l.status === 'in_transit' || l.status === 'picked_up');
const delayedLoads = loads.filter((l) => l.status === 'delayed');

const kpis = [
  {
    title: 'Open Loads',
    value: 15,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="4" width="16" height="12" rx="1.5" />
        <path d="M2 8h16" />
      </svg>
    ),
  },
  {
    title: 'Drivers Available',
    value: 12,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6" />
      </svg>
    ),
  },
  {
    title: 'In Transit',
    value: 31,
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
    title: 'Exceptions',
    value: 4,
    changeType: 'up' as const,
    change: 2,
    subtitle: 'needs attention',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2l8 14H2L10 2z" />
        <path d="M10 8v3M10 14h.01" />
      </svg>
    ),
  },
];

// Calendar data (simple weekly view)
const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const timeSlots = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM'];

export default function DispatchPage() {
  const [replyText, setReplyText] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Dispatcher Workspace</h1>
        <p className="text-sm text-slate-400">Manage loads, drivers, and active routes</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: Load Board */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Load Board</h3>
            <a href="/dispatch/load-board" className="text-xs text-blue-400 hover:text-blue-300">
              View All
            </a>
          </div>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {unassignedLoads.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No open loads</p>
            ) : (
              [...unassignedLoads, ...loads.filter((l) => l.status === 'assigned').slice(0, 3)].map((load) => (
                <div key={load.id} className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{load.loadNumber}</span>
                    <StatusBadge status={statusBadgeMap[load.status] ?? 'pending'} size="sm" />
                  </div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{load.origin.city}, {load.origin.state}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    <span>{load.destination.city}, {load.destination.state}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{equipmentLabels[load.equipmentType] ?? load.equipmentType}</span>
                    <span className="font-semibold text-emerald-400">${load.rate.toLocaleString()}</span>
                  </div>
                  {!load.driver && (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-md border border-blue-500/30 bg-blue-500/10 py-1.5 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-500/20"
                    >
                      Assign Driver
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Driver Assignment */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Driver Assignment</h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {drivers.map((drv) => {
              const statusConfig = driverStatusColors[drv.status] ?? driverStatusColors.available;
              return (
                <div key={drv.id} className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                        {drv.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">{drv.name}</p>
                        <p className="text-[10px] text-slate-500">{drv.truck}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">
                      {drv.location ? `${drv.location.city}, ${drv.location.state}` : 'Unknown'}
                    </span>
                    <span className="text-slate-400">{drv.onTimeRate}% on-time</span>
                  </div>
                  {drv.currentLoad && (
                    <p className="mt-1 text-[10px] text-slate-500">Active: {drv.currentLoad}</p>
                  )}
                  {drv.status === 'available' && (
                    <button
                      type="button"
                      className="mt-2 w-full rounded-md border border-emerald-500/30 bg-emerald-500/10 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
                    >
                      Assign to Load
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Active Routes */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Active Routes</h3>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {inTransitLoads.map((load) => (
              <div key={load.id} className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{load.loadNumber}</span>
                  <StatusBadge status={statusBadgeMap[load.status] ?? 'in_transit'} size="sm" />
                </div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span>{load.origin.city}, {load.origin.state}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  <span>{load.destination.city}, {load.destination.state}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{load.driver?.name ?? 'Unassigned'}</span>
                  <span className="text-slate-400">ETA: {load.eta ?? load.deliveryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Communication Center */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Communication Center</h3>
          <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
            {messages.slice(0, 4).map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-white">
                  {msg.from.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-medium text-slate-200">{msg.from.name}</p>
                    <span className="flex-shrink-0 text-[10px] text-slate-600">{msg.time}</span>
                  </div>
                  <p className="truncate text-[11px] text-slate-400">{msg.preview}</p>
                </div>
                {!msg.read && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Quick reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
            >
              Send
            </button>
          </div>
        </div>

        {/* Exception Management */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Exception Management</h3>
          {delayedLoads.length === 0 ? (
            <div className="flex h-32 items-center justify-center">
              <p className="text-sm text-slate-500">No active exceptions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {delayedLoads.map((load) => (
                <div key={load.id} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{load.loadNumber}</span>
                    <StatusBadge status="delayed" size="sm" />
                  </div>
                  <p className="mb-2 text-[11px] text-orange-300">{load.delayReason ?? 'Unknown delay reason'}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{load.origin.city}, {load.origin.state} → {load.destination.city}, {load.destination.state}</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="rounded border border-slate-700 bg-[#0d1117] px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-slate-800">
                      Contact Driver
                    </button>
                    <button type="button" className="rounded border border-slate-700 bg-[#0d1117] px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-slate-800">
                      Update ETA
                    </button>
                    <button type="button" className="rounded border border-orange-500/30 bg-orange-500/10 px-2 py-1 text-[10px] font-medium text-orange-400 hover:bg-orange-500/20">
                      Escalate
                    </button>
                  </div>
                </div>
              ))}
              {/* Also show urgent notifications */}
              {notifications.filter((n) => n.priority === 'urgent' && n.type !== 'delay').map((n) => (
                <div key={n.id} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{n.title}</span>
                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">Urgent</span>
                  </div>
                  <p className="text-[11px] text-slate-400">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scheduling Calendar */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Weekly Schedule</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr>
                  <th className="w-12 pb-2 text-left font-medium text-slate-500">&nbsp;</th>
                  {weekDays.map((day) => (
                    <th key={day} className="pb-2 text-center font-medium text-slate-500">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot) => (
                  <tr key={slot}>
                    <td className="py-1.5 pr-2 text-right text-slate-600">{slot}</td>
                    {weekDays.map((day) => (
                      <td key={day} className="py-1.5">
                        <div className="mx-0.5 h-5 rounded border border-slate-800 bg-slate-800/30 hover:border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-600">Click time slots to schedule pickups and deliveries</p>
        </div>
      </div>
    </div>
  );
}
