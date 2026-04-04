'use client';

import { useState } from 'react';
import { messages } from '../../_data/mock-data';

/* ---------- Quick filters ---------- */
const quickFilters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'driver', label: 'From Drivers' },
  { id: 'carrier', label: 'From Carriers' },
  { id: 'shipper', label: 'From Shippers' },
];

/* ---------- Thread messages (mock conversation) ---------- */
const threadMessages = [
  {
    id: 't1',
    sender: 'Greg Thompson',
    role: 'carrier',
    text: 'Hey dispatch, just wanted to confirm that Unit #1042 has completed maintenance. Driver Marcus is ready to roll.',
    time: '9:15 AM',
    isOwn: false,
  },
  {
    id: 't2',
    sender: 'You',
    role: 'dispatcher',
    text: 'Great to hear! Can Marcus pick up the steel coils shipment from Chicago today?',
    time: '9:22 AM',
    isOwn: true,
  },
  {
    id: 't3',
    sender: 'Greg Thompson',
    role: 'carrier',
    text: 'Absolutely. He can be at the pickup location by 10:00 AM. I\'ll send him the details now.',
    time: '9:30 AM',
    isOwn: false,
  },
  {
    id: 't4',
    sender: 'Greg Thompson',
    role: 'carrier',
    text: 'Driver reports clear roads ahead. Should arrive Houston by 10:30 AM tomorrow.',
    time: '10:45 AM',
    isOwn: false,
  },
];

/* ---------- Role color config ---------- */
const roleColors: Record<string, string> = {
  driver: 'bg-blue-500',
  carrier: 'bg-emerald-500',
  shipper: 'bg-purple-500',
  dispatcher: 'bg-cyan-500',
  admin: 'bg-orange-500',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

export default function MessagesPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(messages[0]?.id ?? '');
  const [reply, setReply] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  const filteredMessages = messages.filter((m) => {
    if (activeFilter === 'unread') return !m.read;
    if (activeFilter === 'driver') return m.from.role === 'driver';
    if (activeFilter === 'carrier') return m.from.role === 'carrier';
    if (activeFilter === 'shipper') return m.from.role === 'shipper';
    return true;
  });

  const selected = messages.find((m) => m.id === selectedMessage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Messages</h1>
          <p className="text-sm text-slate-400">Communication center for drivers, carriers, and shippers</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCompose(!showCompose)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Compose
        </button>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 overflow-x-auto">
        {quickFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === f.id
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'border border-slate-700/50 text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={{ minHeight: '600px' }}>
        {/* Message List */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] lg:col-span-1 overflow-hidden">
          <div className="divide-y divide-slate-800/60 max-h-[600px] overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-slate-500">No messages found</div>
            ) : (
              filteredMessages.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMessage(m.id)}
                  className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                    selectedMessage === m.id
                      ? 'bg-blue-600/10 border-l-2 border-blue-500'
                      : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${roleColors[m.from.role] ?? 'bg-slate-600'}`}>
                    {getInitials(m.from.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`truncate text-sm font-medium ${!m.read ? 'text-white' : 'text-slate-300'}`}>{m.from.name}</p>
                      <span className="flex-shrink-0 text-[11px] text-slate-500">{m.time}</span>
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${!m.read ? 'font-semibold text-slate-200' : 'text-slate-400'}`}>{m.subject}</p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500">{m.preview}</p>
                  </div>
                  {!m.read && <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] lg:col-span-2 flex flex-col overflow-hidden">
          {selected ? (
            <>
              {/* Conversation Header */}
              <div className="border-b border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${roleColors[selected.from.role] ?? 'bg-slate-600'}`}>
                    {getInitials(selected.from.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selected.from.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{selected.from.role}</p>
                  </div>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-300">{selected.subject}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {threadMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                      msg.isOwn
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-200'
                    }`}>
                      {!msg.isOwn && (
                        <p className="mb-1 text-[11px] font-semibold text-slate-400">{msg.sender}</p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`mt-1 text-[10px] ${msg.isOwn ? 'text-blue-200' : 'text-slate-500'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <div className="border-t border-slate-800 px-5 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/40 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-500"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2L7 9M14 2l-4.5 12-2.5-5-5-2.5L14 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Select a message to view the conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
