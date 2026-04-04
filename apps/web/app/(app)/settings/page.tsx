'use client';

import { useState } from 'react';

/* ---------- Settings sections ---------- */
const sections = [
  { id: 'company', label: 'Company Profile', icon: 'M3 3h14v14H3V3z' },
  { id: 'user', label: 'User Profile', icon: 'M12 8a4 4 0 11-8 0 4 4 0 018 0zM4 18c0-3 2.5-5 4-5s4 2 4 5' },
  { id: 'team', label: 'Team Management', icon: 'M9 5a3 3 0 11-6 0 3 3 0 016 0zM16 6a2 2 0 11-4 0 2 2 0 014 0zM3 16c0-2.5 2-4 3-4s3 1.5 3 4M13 15c0-2 1.5-3 2.5-3s2.5 1 2.5 3' },
  { id: 'notifications', label: 'Notifications', icon: 'M8 2a6 6 0 016 6v3l2 2H2l2-2V8a6 6 0 016-6zM6 13v1a2 2 0 004 0v-1' },
  { id: 'branding', label: 'Branding', icon: 'M2 6l6-4 6 4v8l-6 4-6-4V6z' },
  { id: 'api', label: 'API & Integrations', icon: 'M4 8h8M8 4v8M2 2h4v4H2V2zM10 2h4v4h-4V2zM2 10h4v4H2v-4zM10 10h4v4h-4v-4z' },
  { id: 'security', label: 'Security', icon: 'M8 1l6 3v4c0 4.5-2.5 7.5-6 9-3.5-1.5-6-4.5-6-9V4L8 1z' },
];

/* ---------- Team members ---------- */
const teamMembers = [
  { id: 1, name: 'John Mitchell', email: 'john.m@infamousfreight.com', role: 'Admin', status: 'active', lastActive: '2 min ago' },
  { id: 2, name: 'Sarah Rodriguez', email: 'sarah.r@infamousfreight.com', role: 'Dispatcher', status: 'active', lastActive: '15 min ago' },
  { id: 3, name: 'Mike Chen', email: 'mike.c@infamousfreight.com', role: 'Dispatcher', status: 'active', lastActive: '1 hr ago' },
  { id: 4, name: 'Lisa Anderson', email: 'lisa.a@infamousfreight.com', role: 'Billing', status: 'active', lastActive: '3 hrs ago' },
  { id: 5, name: 'Tom Baker', email: 'tom.b@infamousfreight.com', role: 'Operations', status: 'inactive', lastActive: '2 days ago' },
];

/* ---------- Active sessions ---------- */
const activeSessions = [
  { id: 1, device: 'Chrome on MacOS', ip: '192.168.1.42', location: 'Chicago, IL', lastActive: 'Current session', current: true },
  { id: 2, device: 'Safari on iPhone', ip: '10.0.0.15', location: 'Chicago, IL', lastActive: '2 hrs ago', current: false },
  { id: 3, device: 'Firefox on Windows', ip: '172.16.0.8', location: 'Remote VPN', lastActive: '1 day ago', current: false },
];

/* ---------- Integration cards ---------- */
const integrations = [
  { id: 'eld', name: 'ELD Integration', description: 'Connect electronic logging devices for HOS compliance', status: 'connected', icon: 'M3 8l4-4 4 4M3 8h8' },
  { id: 'tms', name: 'TMS System', description: 'Transportation Management System integration', status: 'connected', icon: 'M2 2h12v12H2V2zM2 6h12M6 2v12' },
  { id: 'accounting', name: 'Accounting Software', description: 'Sync invoices and payments with your accounting platform', status: 'disconnected', icon: 'M8 1v14M4 5c0-2 8-2 8 0s-8 2-8 4 8 2 8 0' },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('company');
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-sm text-slate-400">Manage your account, team, and platform preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1 rounded-xl border border-slate-800 bg-[#161b22] p-2">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-blue-600/15 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Company Profile */}
          {activeSection === 'company' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h2 className="text-lg font-semibold text-white">Company Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Update your company information and branding</p>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Company Name</label>
                    <input type="text" defaultValue="Infæmous Freight Inc." className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone</label>
                    <input type="text" defaultValue="(312) 555-0100" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Address</label>
                  <input type="text" defaultValue="1200 Logistics Blvd, Suite 400, Chicago, IL 60601" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
                  <input type="email" defaultValue="info@infamousfreight.com" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Company Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30 text-slate-500">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <button type="button" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800">Upload Logo</button>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {/* User Profile */}
          {activeSection === 'user' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h2 className="text-lg font-semibold text-white">User Profile</h2>
              <p className="mt-1 text-sm text-slate-500">Manage your personal account settings</p>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Full Name</label>
                    <input type="text" defaultValue="John Mitchell" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Email</label>
                    <input type="email" defaultValue="john.m@infamousfreight.com" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Phone</label>
                    <input type="text" defaultValue="(312) 555-0142" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Role</label>
                    <input type="text" defaultValue="Admin" readOnly className="w-full rounded-lg border border-slate-700/50 bg-slate-800/20 px-3 py-2.5 text-sm text-slate-400 outline-none cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Change Password</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input type="password" placeholder="New password" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50" />
                    <input type="password" placeholder="Confirm password" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">Save Profile</button>
                </div>
              </div>
            </div>
          )}

          {/* Team Management */}
          {activeSection === 'team' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Team Management</h2>
                  <p className="mt-1 text-sm text-slate-500">Manage team members and their roles</p>
                </div>
                <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M8 3v10M3 8h10" />
                  </svg>
                  Invite Member
                </button>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Last Active</th>
                      <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {teamMembers.map((m) => (
                      <tr key={m.id}>
                        <td className="py-3 text-sm font-medium text-slate-200">{m.name}</td>
                        <td className="py-3 text-sm text-slate-400">{m.email}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-blue-600/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400">{m.role}</span>
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs ${m.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${m.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-500">{m.lastActive}</td>
                        <td className="py-3">
                          <button type="button" className="text-xs text-slate-400 hover:text-slate-200">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
              <p className="mt-1 text-sm text-slate-500">Configure your notification delivery preferences</p>
              <div className="mt-6">
                <a
                  href="/notifications/settings"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
                >
                  Open Notification Settings
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 3l5 5-5 5" />
                  </svg>
                </a>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeSection === 'branding' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h2 className="text-lg font-semibold text-white">Branding</h2>
              <p className="mt-1 text-sm text-slate-500">Customize the look and feel of your platform</p>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-600 border border-slate-700" />
                      <input type="text" defaultValue="#2563EB" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500 border border-slate-700" />
                      <input type="text" defaultValue="#10B981" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">Logo</label>
                  <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
                    <div className="text-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-2 text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <p className="text-xs text-slate-500">Upload your logo (PNG, SVG)</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <button type="button" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500">Save Branding</button>
                </div>
              </div>
            </div>
          )}

          {/* API & Integrations */}
          {activeSection === 'api' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
                <h2 className="text-lg font-semibold text-white">API Configuration</h2>
                <p className="mt-1 text-sm text-slate-500">Manage API keys and webhook endpoints</p>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">API Key</label>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value="sk_live_************************************7x9K" className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/20 px-3 py-2.5 text-sm text-slate-400 outline-none font-mono" />
                      <button type="button" className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800">Copy</button>
                      <button type="button" className="rounded-lg border border-red-700/30 bg-red-600/10 px-3 py-2.5 text-sm text-red-400 hover:bg-red-600/20">Regenerate</button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Webhook URL</label>
                    <input type="url" defaultValue="https://api.infamousfreight.com/webhooks/v1" className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
                <h2 className="text-lg font-semibold text-white">Integrations</h2>
                <div className="mt-4 space-y-3">
                  {integrations.map((intg) => (
                    <div key={intg.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1117] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d={intg.icon} />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{intg.name}</p>
                          <p className="text-xs text-slate-500">{intg.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        intg.status === 'connected'
                          ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                          : 'bg-slate-400/10 text-slate-400 border border-slate-400/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${intg.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {intg.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
                <h2 className="text-lg font-semibold text-white">Security Settings</h2>
                <p className="mt-1 text-sm text-slate-500">Manage passwords, two-factor authentication, and sessions</p>
                <div className="mt-6 space-y-4">
                  {/* Change Password */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-300">Change Password</h3>
                    <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <input type="password" placeholder="Current password" className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50" />
                      <input type="password" placeholder="New password" className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50" />
                      <input type="password" placeholder="Confirm new password" className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500/50" />
                    </div>
                    <button type="button" className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Update Password</button>
                  </div>

                  {/* 2FA */}
                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-slate-300">Two-Factor Authentication</h3>
                        <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTwoFaEnabled(!twoFaEnabled)}
                        className="flex items-center gap-2"
                      >
                        <div className={`relative h-6 w-11 rounded-full transition-colors ${twoFaEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}>
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${twoFaEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                        </div>
                        <span className={`text-sm font-medium ${twoFaEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {twoFaEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
                <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your active login sessions</p>
                <div className="mt-4 space-y-3">
                  {activeSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-[#0d1117] p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="12" height="9" rx="1" />
                            <path d="M5 15h6M8 12v3" />
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-200">{s.device}</p>
                            {s.current && (
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{s.ip} - {s.location} - {s.lastActive}</p>
                        </div>
                      </div>
                      {!s.current && (
                        <button type="button" className="text-xs font-medium text-red-400 hover:text-red-300">Revoke</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
