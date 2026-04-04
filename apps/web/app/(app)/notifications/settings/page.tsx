'use client';

import { useState } from 'react';

/* ---------- Notification categories ---------- */
const categories = [
  {
    id: 'shipment',
    label: 'Shipment Updates',
    description: 'Get notified about pickup confirmations, delivery status, and ETA changes',
  },
  {
    id: 'payment',
    label: 'Payment Alerts',
    description: 'Invoice payments, overdue reminders, and billing updates',
  },
  {
    id: 'system',
    label: 'System Alerts',
    description: 'CDL expirations, insurance renewals, and system maintenance',
  },
  {
    id: 'document',
    label: 'Document Reminders',
    description: 'Document uploads, expirations, and compliance alerts',
  },
  {
    id: 'driver',
    label: 'Driver Communications',
    description: 'Messages from drivers, check-in updates, and HOS alerts',
  },
  {
    id: 'delay',
    label: 'Delay Notifications',
    description: 'Weather delays, route changes, and shipment exceptions',
  },
];

/* ---------- Channel types ---------- */
const channels = ['Email', 'SMS', 'In-App', 'Push'] as const;

/* ---------- Frequency options ---------- */
const frequencies = [
  { value: 'realtime', label: 'Real-time' },
  { value: 'hourly', label: 'Hourly digest' },
  { value: 'daily', label: 'Daily digest' },
];

type ChannelState = Record<string, Record<string, boolean>>;
type FrequencyState = Record<string, string>;

export default function NotificationSettingsPage() {
  const [channelState, setChannelState] = useState<ChannelState>(() => {
    const state: ChannelState = {};
    categories.forEach((cat) => {
      state[cat.id] = { Email: true, SMS: false, 'In-App': true, Push: true };
    });
    // Some custom defaults
    state.delay.SMS = true;
    state.payment.Email = true;
    state.payment.SMS = true;
    return state;
  });

  const [frequencyState, setFrequencyState] = useState<FrequencyState>(() => {
    const state: FrequencyState = {};
    categories.forEach((cat) => { state[cat.id] = 'realtime'; });
    state.document = 'daily';
    state.system = 'daily';
    return state;
  });

  const [saved, setSaved] = useState(false);

  const toggleChannel = (catId: string, channel: string) => {
    setChannelState((prev) => ({
      ...prev,
      [catId]: { ...prev[catId], [channel]: !prev[catId][channel] },
    }));
    setSaved(false);
  };

  const setFrequency = (catId: string, freq: string) => {
    setFrequencyState((prev) => ({ ...prev, [catId]: freq }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notification Preferences</h1>
          <p className="text-sm text-slate-400">Configure how and when you receive notifications</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-500'
          }`}
        >
          {saved ? (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l3 3 7-7" />
              </svg>
              Saved
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Category Cards */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">{cat.label}</h3>
                <p className="mt-1 text-xs text-slate-500">{cat.description}</p>
              </div>

              {/* Frequency select */}
              <select
                value={frequencyState[cat.id]}
                onChange={(e) => setFrequency(cat.id, e.target.value)}
                className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs text-slate-300 outline-none transition-colors focus:border-blue-500/50 [&>option]:bg-[#161b22]"
              >
                {frequencies.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* Channel toggles */}
            <div className="mt-4 flex flex-wrap gap-3">
              {channels.map((ch) => {
                const isOn = channelState[cat.id]?.[ch] ?? false;
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(cat.id, ch)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`relative h-5 w-9 rounded-full transition-colors ${
                        isOn ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                          isOn ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isOn ? 'text-slate-200' : 'text-slate-500'}`}>{ch}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
