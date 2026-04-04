'use client';

import { useState } from 'react';
import { messages } from '../../../_data/mock-data';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isMe: boolean;
}

const mockChats: Record<string, ChatMessage[]> = {
  'M-001': [
    { id: '1', sender: 'Greg Thompson', text: 'Driver reports clear roads ahead. Should arrive Houston by 10:30 AM tomorrow.', time: '15 min ago', isMe: false },
    { id: '2', sender: 'You', text: 'Copy that. Will update the shipper on revised ETA.', time: '10 min ago', isMe: true },
    { id: '3', sender: 'Greg Thompson', text: 'Sounds good. Let me know if you need anything else.', time: '5 min ago', isMe: false },
  ],
  'M-002': [
    { id: '1', sender: 'Marcus Johnson', text: 'Stopping at TA Travel Center for fuel and 30-min break. Back on road by 3:00 PM.', time: '45 min ago', isMe: true },
    { id: '2', sender: 'Dispatch Team', text: 'Acknowledged. Drive safe, Marcus.', time: '40 min ago', isMe: false },
  ],
  'M-004': [
    { id: '1', sender: 'Rick Dupree', text: 'NWS extended severe weather warning through tomorrow AM. Terrance will resume once cleared.', time: '3 hrs ago', isMe: false },
    { id: '2', sender: 'You', text: 'Thanks for the update. Safety first. Keep us posted.', time: '2 hrs ago', isMe: true },
  ],
};

export default function DriverMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const selected = messages.find((m) => m.id === selectedMessage);
  const chat = selectedMessage ? mockChats[selectedMessage] ?? [] : [];

  const handleSendReply = () => {
    if (!reply.trim()) return;
    setReply('');
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Messages</h1>

      {!selectedMessage ? (
        /* Message List */
        <div className="space-y-2">
          {messages.map((msg) => (
            <button
              key={msg.id}
              type="button"
              onClick={() => setSelectedMessage(msg.id)}
              className="flex w-full items-start gap-3 rounded-xl border border-slate-800 bg-[#161b22] p-4 text-left transition-colors hover:border-slate-700"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                {msg.from.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${msg.read ? 'text-slate-400' : 'text-white'}`}>
                    {msg.from.name}
                  </p>
                  <span className="flex-shrink-0 text-[11px] text-slate-600">{msg.time}</span>
                </div>
                <p className={`text-xs ${msg.read ? 'text-slate-500' : 'font-medium text-slate-300'}`}>
                  {msg.subject}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{msg.preview}</p>
              </div>
              {!msg.read && (
                <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      ) : (
        /* Chat View */
        <div className="flex flex-col">
          {/* Back + header */}
          <button
            type="button"
            onClick={() => setSelectedMessage(null)}
            className="mb-4 inline-flex items-center gap-1 self-start text-sm text-slate-400 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            Back to Messages
          </button>

          {selected && (
            <div className="mb-4 rounded-xl border border-slate-800 bg-[#161b22] p-3">
              <p className="text-sm font-medium text-white">{selected.subject}</p>
              <p className="text-xs text-slate-500">
                {selected.from.name} &middot; {selected.from.role}
              </p>
            </div>
          )}

          {/* Chat messages */}
          <div className="space-y-3 pb-4">
            {chat.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    msg.isMe
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-800 bg-[#161b22] text-slate-200'
                  }`}
                >
                  {!msg.isMe && (
                    <p className="mb-0.5 text-[10px] font-medium text-slate-400">{msg.sender}</p>
                  )}
                  <p className="text-sm">{msg.text}</p>
                  <p className={`mt-1 text-[10px] ${msg.isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply input */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#161b22] p-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-2 text-sm text-white placeholder-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSendReply}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
