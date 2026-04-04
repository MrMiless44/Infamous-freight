'use client';

import { useState } from 'react';
import Tabs from '../../_components/Tabs';
import { notifications } from '../../_data/mock-data';

/* ---------- Tabs ---------- */
const notifTabs = [
  { id: 'all', label: 'All', count: notifications.length },
  { id: 'shipment', label: 'Shipment', count: notifications.filter((n) => n.type === 'shipment').length },
  { id: 'payment', label: 'Payment', count: notifications.filter((n) => n.type === 'payment').length },
  { id: 'system', label: 'System', count: notifications.filter((n) => n.type === 'system').length },
  { id: 'delay', label: 'Delay', count: notifications.filter((n) => n.type === 'delay').length },
  { id: 'document', label: 'Document', count: notifications.filter((n) => n.type === 'document').length },
];

/* ---------- Type icon config ---------- */
const typeIcons: Record<string, { bg: string; icon: JSX.Element }> = {
  shipment: {
    bg: 'bg-blue-500/20 text-blue-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="10" height="7" rx="1" />
        <path d="M11 7h2.5l2 2.5V11h-4.5" />
        <circle cx="4.5" cy="12" r="1.5" /><circle cx="12.5" cy="12" r="1.5" />
      </svg>
    ),
  },
  payment: {
    bg: 'bg-emerald-500/20 text-emerald-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1v14M5 4c0-1.5 6-1.5 6 0s-6 1.5-6 3 6 1.5 6 0" />
      </svg>
    ),
  },
  system: {
    bg: 'bg-slate-500/20 text-slate-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="3" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
      </svg>
    ),
  },
  delay: {
    bg: 'bg-orange-500/20 text-orange-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 1" />
      </svg>
    ),
  },
  document: {
    bg: 'bg-purple-500/20 text-purple-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 1h7l3 3v10a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
        <path d="M11 1v3h3" />
      </svg>
    ),
  },
  message: {
    bg: 'bg-cyan-500/20 text-cyan-400',
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h12v8H4l-2 2V3z" />
      </svg>
    ),
  },
};

/* ---------- Priority colors ---------- */
const priorityColors: Record<string, string> = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [readState, setReadState] = useState<Record<string, boolean>>(
    Object.fromEntries(notifications.map((n) => [n.id, n.read]))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const markAllRead = () => {
    setReadState((prev) => {
      const next = { ...prev };
      notifications.forEach((n) => { next[n.id] = true; });
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    setReadState((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Notifications</h1>
          <p className="text-sm text-slate-400">Stay updated on shipments, payments, and system events</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8l3 3 7-7" />
          </svg>
          Mark All Read
        </button>
      </div>

      {/* Tabs */}
      <Tabs tabs={notifTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Notification List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-slate-800 bg-[#161b22] py-12 text-sm text-slate-500">
            No notifications in this category
          </div>
        ) : (
          filtered.map((n) => {
            const isRead = readState[n.id] ?? n.read;
            const isExpanded = expandedId === n.id;
            const typeIcon = typeIcons[n.type] ?? typeIcons.system;

            return (
              <button
                key={n.id}
                type="button"
                onClick={() => toggleExpand(n.id)}
                className={`w-full rounded-xl border text-left transition-colors ${
                  isExpanded
                    ? 'border-blue-500/30 bg-blue-600/5'
                    : isRead
                      ? 'border-slate-800 bg-[#161b22] hover:bg-slate-800/60'
                      : 'border-slate-700 bg-[#1c2333] hover:bg-[#1e2638]'
                } p-4`}
              >
                <div className="flex items-start gap-3">
                  {/* Priority dot */}
                  <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${priorityColors[n.priority] ?? 'bg-slate-500'}`} />

                  {/* Type icon */}
                  <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${typeIcon.bg}`}>
                    {typeIcon.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${isRead ? 'text-slate-400' : 'text-white'}`}>{n.title}</p>
                      <span className="flex-shrink-0 text-[11px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{n.message}</p>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Priority: <span className={`font-semibold capitalize ${n.priority === 'urgent' ? 'text-red-400' : n.priority === 'high' ? 'text-orange-400' : 'text-slate-300'}`}>{n.priority}</span></span>
                          <span>Type: <span className="font-semibold capitalize text-slate-300">{n.type}</span></span>
                          <span>Time: <span className="font-semibold text-slate-300">{n.time}</span></span>
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{n.message}</p>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {!isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
