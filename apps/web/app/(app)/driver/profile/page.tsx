'use client';

import { useState } from 'react';
import { drivers } from '../../../_data/mock-data';

const driver = drivers[0]; // Marcus Johnson

export default function DriverProfilePage() {
  const [notifPrefs, setNotifPrefs] = useState({
    loadUpdates: true,
    messages: true,
    earnings: true,
    maintenance: false,
  });

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      <h1 className="text-xl font-bold text-white">My Profile</h1>

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xl font-bold text-blue-400">
            {driver.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white">{driver.name}</h2>
            <p className="text-sm text-slate-400">{driver.email}</p>
            <p className="text-sm text-slate-500">{driver.phone}</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-4 w-full rounded-lg border border-slate-700 bg-[#0d1117] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
        >
          Edit Profile
        </button>
      </div>

      {/* CDL Info */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">CDL Information</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">License</p>
            <p className="text-sm text-white">{driver.license}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Expiry</p>
            <p className="text-sm text-white">{driver.cdlExpiry}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Assignment */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Vehicle Assignment</h2>
        <p className="text-sm text-white">{driver.truck}</p>
        {driver.location && (
          <p className="mt-1 text-xs text-slate-500">
            Current location: {driver.location.city}, {driver.location.state}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Performance</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-yellow-400">
                <path d="M8 0l2.47 5.01L16 5.81l-4 3.9.94 5.49L8 12.49l-4.94 2.71L4 9.71 0 5.81l5.53-.8z" />
              </svg>
              <span className="text-lg font-bold text-white">{driver.rating}</span>
            </div>
            <p className="text-[10px] text-slate-500">Rating</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{driver.completedLoads}</p>
            <p className="text-[10px] text-slate-500">Loads Done</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{driver.onTimeRate}%</p>
            <p className="text-[10px] text-slate-500">On Time</p>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Notification Preferences</h2>
        <div className="space-y-3">
          {([
            { key: 'loadUpdates' as const, label: 'Load Updates' },
            { key: 'messages' as const, label: 'Messages' },
            { key: 'earnings' as const, label: 'Earnings & Payments' },
            { key: 'maintenance' as const, label: 'Maintenance Alerts' },
          ]).map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{item.label}</span>
              <button
                type="button"
                onClick={() => toggleNotif(item.key)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifPrefs[item.key] ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
