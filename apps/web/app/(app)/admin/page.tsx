'use client';

import { useState } from 'react';
import KPICard from '../../_components/KPICard';
import ChartCard from '../../_components/ChartCard';
import { users } from '../../_data/mock-data';

const systemHealthCards = [
  {
    title: 'Total Users',
    value: 47,
    change: 8,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="7" cy="6" r="3" />
        <path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" />
        <circle cx="15" cy="6" r="2" />
        <path d="M15 11c2 0 4 1.5 4 3.5" />
      </svg>
    ),
  },
  {
    title: 'Active Sessions',
    value: 23,
    change: 12,
    changeType: 'up' as const,
    subtitle: 'currently online',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="10" cy="10" r="3" />
        <path d="M5.5 5.5a7 7 0 019 0M3.5 3.5a10 10 0 0113 0" />
      </svg>
    ),
  },
  {
    title: 'System Uptime',
    value: '99.97%',
    change: 0.02,
    changeType: 'up' as const,
    subtitle: 'last 30 days',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="3" width="16" height="12" rx="2" />
        <path d="M6 19h8M10 15v4" />
      </svg>
    ),
  },
  {
    title: 'API Calls Today',
    value: '12.4K',
    change: 18,
    changeType: 'up' as const,
    subtitle: 'vs yesterday',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M3 17V10M8 17V6M13 17V8M18 17V3" />
      </svg>
    ),
  },
];

const revenueCards = [
  {
    title: 'MTD Revenue',
    value: '$847,200',
    change: 15,
    changeType: 'up' as const,
    subtitle: 'vs last month',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10 2v16M6 6c0-2 8-2 8 0s-8 2-8 4 8 2 8 0" />
      </svg>
    ),
  },
  {
    title: 'vs Last Month',
    value: '+15%',
    change: 15,
    changeType: 'up' as const,
    subtitle: 'growth rate',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17l5-5 3 3 6-8" />
        <path d="M14 7h3v3" />
      </svg>
    ),
  },
  {
    title: 'Outstanding Invoices',
    value: '$34,800',
    change: 5,
    changeType: 'down' as const,
    subtitle: '12 invoices pending',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 2h8l4 4v12a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path d="M13 2v4h4M7 10h6M7 14h4" />
      </svg>
    ),
  },
];

const activityData = [
  { label: 'Mon', value: 65 },
  { label: 'Tue', value: 80 },
  { label: 'Wed', value: 55 },
  { label: 'Thu', value: 90 },
  { label: 'Fri', value: 70 },
  { label: 'Sat', value: 40 },
  { label: 'Sun', value: 30 },
];

const recentRegistrations = [
  { name: 'Diana Foster', email: 'diana.f@shipper.com', role: 'Shipper', date: 'Mar 28, 2024', status: 'Active' },
  { name: 'Ryan Brooks', email: 'ryan.b@carrier.com', role: 'Carrier', date: 'Mar 27, 2024', status: 'Active' },
  { name: 'Lisa Tran', email: 'lisa.t@infamousfreight.com', role: 'Dispatcher', date: 'Mar 26, 2024', status: 'Active' },
  { name: 'Carlos Mendez', email: 'carlos.m@driver.com', role: 'Driver', date: 'Mar 25, 2024', status: 'Pending' },
  { name: 'Amy Nguyen', email: 'amy.n@shipper.com', role: 'Shipper', date: 'Mar 24, 2024', status: 'Active' },
];

const systemAlerts = [
  { id: 1, severity: 'high', message: 'SSL certificate expires in 14 days - renewal required', time: '2 hrs ago' },
  { id: 2, severity: 'medium', message: 'Database storage at 78% capacity - consider scaling', time: '5 hrs ago' },
  { id: 3, severity: 'low', message: 'Scheduled maintenance window: Sunday 2:00-4:00 AM EST', time: '1 day ago' },
];

const quickLinks = [
  { title: 'User Management', href: '/admin/users', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  )},
  { title: 'Fleet Management', href: '/admin/fleet', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="6" width="15" height="10" rx="1" /><path d="M16 10h4l3 4v3h-7" /><circle cx="7" cy="17" r="2" /><circle cx="19" cy="17" r="2" />
    </svg>
  )},
  { title: 'Revenue Analytics', href: '/admin/revenue', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 20V10M8 20V6M13 20V8M18 20V3" />
    </svg>
  )},
  { title: 'Carriers', href: '/admin/carriers', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  )},
  { title: 'System Settings', href: '/admin/settings', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  )},
  { title: 'Audit Logs', href: '/admin/audit', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  )},
];

const severityColors: Record<string, string> = {
  high: 'bg-red-500/10 text-red-400 border-red-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const statusColors: Record<string, string> = {
  Active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Pending: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
};

export default function AdminDashboardPage() {
  const [, setSelectedLink] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <p className="text-sm text-slate-400">System overview and management</p>
      </div>

      {/* System Health */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">System Health</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {systemHealthCards.map((card) => (
            <KPICard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* Revenue Overview */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Revenue Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {revenueCards.map((card) => (
            <KPICard key={card.title} {...card} />
          ))}
        </div>
      </div>

      {/* User Activity Chart + System Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCard title="User Activity" subtitle="Active sessions per day (last 7 days)">
            <div className="flex h-44 items-end gap-3 pt-4">
              {activityData.map((d) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
                      style={{ height: `${d.value * 1.6}px` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{d.label}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">System Alerts</h3>
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-3 ${severityColors[alert.severity]}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium">{alert.message}</p>
                  <span className="inline-flex flex-shrink-0 rounded-full bg-current/10 px-2 py-0.5 text-[10px] font-semibold uppercase opacity-80">
                    {alert.severity}
                  </span>
                </div>
                <p className="mt-1 text-[10px] opacity-60">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent User Registrations */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Recent User Registrations</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentRegistrations.map((user) => (
                <tr key={user.email} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-medium text-slate-200">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{user.role}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{user.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusColors[user.status]}`}>
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Admin Links */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickLinks.map((link) => (
            <a
              key={link.title}
              href={link.href}
              onClick={() => setSelectedLink(link.href)}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-800 bg-[#161b22] p-4 transition-colors hover:border-blue-500/40 hover:bg-blue-500/5"
            >
              <span className="text-slate-400">{link.icon}</span>
              <span className="text-center text-xs font-medium text-slate-300">{link.title}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
