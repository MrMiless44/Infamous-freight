'use client';

import { useState } from 'react';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
}

const sections: SettingsSection[] = [
  { id: 'general', title: 'General', description: 'Company information and preferences' },
  { id: 'notifications', title: 'Notifications', description: 'Manage alert preferences' },
  { id: 'integrations', title: 'Integrations', description: 'Connect third-party services' },
  { id: 'security', title: 'Security', description: 'Password policies and authentication' },
  { id: 'api', title: 'API', description: 'API keys and webhook configuration' },
];

const integrations = [
  { name: 'ELD Provider', description: 'Electronic logging device integration', status: 'connected', provider: 'KeepTruckin' },
  { name: 'TMS System', description: 'Transportation management system', status: 'disconnected', provider: null },
  { name: 'Accounting', description: 'Accounting and invoicing sync', status: 'connected', provider: 'QuickBooks' },
];

const integrationStatusColors: Record<string, string> = {
  connected: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  disconnected: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
};

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState<string | null>(null);

  const handleSave = (section: string) => {
    setSaved(section);
    setTimeout(() => setSaved(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-sm text-slate-400">Configure platform preferences and integrations</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Section Nav */}
        <nav className="space-y-1 lg:col-span-1">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`w-full rounded-lg px-4 py-3 text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-300 border border-transparent'
              }`}
            >
              <p className="text-sm font-medium">{section.title}</p>
              <p className="text-[11px] opacity-60">{section.description}</p>
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* General */}
          {activeSection === 'general' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">General Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Company Name</label>
                  <input type="text" defaultValue="Infamous Freight" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Company Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                    <button type="button" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-800">Upload Logo</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Timezone</label>
                    <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                      <option>America/Chicago (CST)</option>
                      <option>America/New_York (EST)</option>
                      <option>America/Denver (MST)</option>
                      <option>America/Los_Angeles (PST)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Currency</label>
                    <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                      <option>USD ($)</option>
                      <option>CAD (C$)</option>
                      <option>EUR</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => handleSave('general')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                    {saved === 'general' ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Notification Settings</h3>
              <div className="space-y-4">
                {[
                  { label: 'Email Notifications', description: 'Receive email alerts for load updates, delays, and invoices', defaultChecked: true },
                  { label: 'SMS Alerts', description: 'Send SMS notifications for urgent delays and critical system events', defaultChecked: true },
                  { label: 'System Alerts', description: 'Show in-app notifications for all system events', defaultChecked: true },
                  { label: 'Daily Digest', description: 'Receive a daily summary of all activity and key metrics', defaultChecked: false },
                  { label: 'Driver ETA Updates', description: 'Notify shippers when driver ETA changes significantly', defaultChecked: true },
                  { label: 'Payment Alerts', description: 'Alert when invoices are overdue or payments are received', defaultChecked: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-800/60 p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-slate-700 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => handleSave('notifications')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                    {saved === 'notifications' ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations */}
          {activeSection === 'integrations' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Third-Party Integrations</h3>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.name} className="flex items-center justify-between rounded-lg border border-slate-800/60 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{integration.name}</p>
                          <p className="text-xs text-slate-500">{integration.description}</p>
                          {integration.provider && (
                            <p className="text-[11px] text-slate-600">Connected via {integration.provider}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${integrationStatusColors[integration.status]}`}>
                          {integration.status}
                        </span>
                        <button type="button" className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          integration.status === 'connected'
                            ? 'border border-slate-700 text-slate-300 hover:bg-slate-800'
                            : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}>
                          {integration.status === 'connected' ? 'Configure' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Minimum Password Length</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                    <option>8 characters</option>
                    <option>10 characters</option>
                    <option>12 characters</option>
                    <option>16 characters</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Session Timeout</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>4 hours</option>
                    <option>8 hours</option>
                  </select>
                </div>
                {[
                  { label: 'Enforce 2FA', description: 'Require two-factor authentication for all users', defaultChecked: true },
                  { label: 'Require Special Characters', description: 'Passwords must contain at least one special character', defaultChecked: true },
                  { label: 'Password Expiry', description: 'Force password reset every 90 days', defaultChecked: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-slate-800/60 p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" defaultChecked={item.defaultChecked} className="peer sr-only" />
                      <div className="h-6 w-11 rounded-full bg-slate-700 transition-colors after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-slate-400 after:transition-all peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:bg-white" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => handleSave('security')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                    {saved === 'security' ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API */}
          {activeSection === 'api' && (
            <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
              <h3 className="mb-4 text-sm font-semibold text-white">API Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">API Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value="sk-inf-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      readOnly
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm font-mono text-slate-200 outline-none"
                    />
                    <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800">
                      Reveal
                    </button>
                    <button type="button" className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800">
                      Regenerate
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Rate Limit</label>
                  <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                    <option>1,000 requests/hour</option>
                    <option>5,000 requests/hour</option>
                    <option>10,000 requests/hour</option>
                    <option>Unlimited</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Webhook URL</label>
                  <input
                    type="url"
                    defaultValue="https://hooks.infamousfreight.com/api/v1/webhook"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="rounded-lg border border-slate-800/60 p-4">
                  <p className="text-xs font-medium text-slate-400">API Usage Today</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">12,412</span>
                    <span className="text-xs text-slate-500">/ 50,000 requests</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-800">
                    <div className="h-2 rounded-full bg-blue-500" style={{ width: '24.8%' }} />
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button type="button" onClick={() => handleSave('api')} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">
                    {saved === 'api' ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
