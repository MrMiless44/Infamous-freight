'use client';

import { useState } from 'react';
import { messages } from '../../../_data/mock-data';

const faqLinks = [
  { title: 'How to create a shipment request', href: '#' },
  { title: 'Understanding tracking statuses', href: '#' },
  { title: 'Invoice and payment FAQ', href: '#' },
  { title: 'Document requirements for shipments', href: '#' },
  { title: 'How to dispute a charge', href: '#' },
];

export default function ShipperSupportPage() {
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const shipperMessages = messages.filter(
    (m) => m.from.role === 'shipper' || m.to.role === 'shipper' || m.from.role === 'dispatcher',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Support &amp; Messages</h1>
        <p className="text-sm text-slate-400">Contact support or view message history</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Message Threads */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Message Threads</h3>
          <div className="space-y-3">
            {shipperMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl border bg-[#161b22] p-4 transition-colors hover:border-slate-700 ${
                  msg.read ? 'border-slate-800' : 'border-blue-500/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                      {msg.from.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-200">{msg.from.name}</p>
                        {!msg.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </div>
                      <p className="text-xs text-slate-500">{msg.from.role}</p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-[11px] text-slate-600">{msg.time}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-300">{msg.subject}</p>
                <p className="mt-1 text-xs text-slate-500">{msg.preview}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] text-slate-600">{msg.thread} messages in thread</span>
                  <button type="button" className="ml-auto text-xs font-medium text-blue-400 hover:text-blue-300">
                    Reply
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* New Message Form */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">New Message</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50"
              />
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={4}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Panel */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-white">Frequently Asked Questions</h3>
          <div className="space-y-2">
            {faqLinks.map((faq) => (
              <a
                key={faq.title}
                href={faq.href}
                className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#161b22] p-3 text-sm text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0 text-blue-400">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M6 6.5a2 2 0 013.5 1.5c0 1-1.5 1.5-1.5 1.5M8 11.5h.01" />
                </svg>
                {faq.title}
              </a>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h4 className="text-sm font-semibold text-white">Need Help?</h4>
            <p className="mt-1 text-xs text-slate-500">Our support team is available 24/7</p>
            <div className="mt-3 space-y-2">
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="1" y="3" width="12" height="8" rx="1" />
                  <path d="M1 4l6 4 6-4" />
                </svg>
                support@infamousfreight.com
              </p>
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 2h4l1.5 3L4 7s1 3 4 4l2-2.5 3 1.5v4s-6 1-10-3S1 2 1 2z" />
                </svg>
                1-800-FREIGHT
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
