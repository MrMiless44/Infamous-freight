'use client';

import { useState, useMemo } from 'react';
import FilterBar from '../../../_components/FilterBar';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  ipAddress: string;
  status: 'success' | 'failure' | 'warning';
}

const auditLogs: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2024-03-28 14:32:15', user: 'Alex Mercer', action: 'Login', resource: 'Auth System', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'AUD-002', timestamp: '2024-03-28 14:28:43', user: 'Rachel Torres', action: 'Create Load', resource: 'LD-2024-010', ipAddress: '192.168.1.101', status: 'success' },
  { id: 'AUD-003', timestamp: '2024-03-28 14:15:22', user: 'Alex Mercer', action: 'Update Settings', resource: 'System Settings', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'AUD-004', timestamp: '2024-03-28 13:45:10', user: 'Kevin Shaw', action: 'Assign Driver', resource: 'LD-2024-008', ipAddress: '192.168.1.102', status: 'success' },
  { id: 'AUD-005', timestamp: '2024-03-28 13:22:55', user: 'Unknown', action: 'Failed Login', resource: 'Auth System', ipAddress: '45.33.12.87', status: 'failure' },
  { id: 'AUD-006', timestamp: '2024-03-28 12:58:33', user: 'Greg Thompson', action: 'Upload Document', resource: 'DOC-008', ipAddress: '10.0.0.45', status: 'success' },
  { id: 'AUD-007', timestamp: '2024-03-28 12:30:18', user: 'Rachel Torres', action: 'Update Load', resource: 'LD-2024-004', ipAddress: '192.168.1.101', status: 'success' },
  { id: 'AUD-008', timestamp: '2024-03-28 11:55:42', user: 'Alex Mercer', action: 'Create User', resource: 'USR-012', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'AUD-009', timestamp: '2024-03-28 11:20:09', user: 'Maria Santos', action: 'Login', resource: 'Auth System', ipAddress: '10.0.0.78', status: 'success' },
  { id: 'AUD-010', timestamp: '2024-03-28 10:45:31', user: 'Alex Mercer', action: 'Deactivate User', resource: 'USR-010', ipAddress: '192.168.1.100', status: 'warning' },
  { id: 'AUD-011', timestamp: '2024-03-28 10:12:55', user: 'Kevin Shaw', action: 'Export Report', resource: 'Revenue Report', ipAddress: '192.168.1.102', status: 'success' },
  { id: 'AUD-012', timestamp: '2024-03-28 09:45:22', user: 'Rachel Torres', action: 'Create Load', resource: 'LD-2024-009', ipAddress: '192.168.1.101', status: 'success' },
  { id: 'AUD-013', timestamp: '2024-03-28 09:15:18', user: 'Alex Mercer', action: 'Update Permissions', resource: 'Role: Dispatcher', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'AUD-014', timestamp: '2024-03-28 08:50:44', user: 'Unknown', action: 'Failed Login', resource: 'Auth System', ipAddress: '88.142.56.23', status: 'failure' },
  { id: 'AUD-015', timestamp: '2024-03-28 08:30:12', user: 'Alex Mercer', action: 'Login', resource: 'Auth System', ipAddress: '192.168.1.100', status: 'success' },
  { id: 'AUD-016', timestamp: '2024-03-27 17:45:33', user: 'Rachel Torres', action: 'Cancel Load', resource: 'LD-2024-009', ipAddress: '192.168.1.101', status: 'warning' },
  { id: 'AUD-017', timestamp: '2024-03-27 16:22:11', user: 'Kevin Shaw', action: 'Update Carrier', resource: 'CAR-004', ipAddress: '192.168.1.102', status: 'success' },
  { id: 'AUD-018', timestamp: '2024-03-27 15:10:45', user: 'Greg Thompson', action: 'Login', resource: 'Auth System', ipAddress: '10.0.0.45', status: 'success' },
];

const actionOptions = [
  { value: 'Login', label: 'Login' },
  { value: 'Failed Login', label: 'Failed Login' },
  { value: 'Create Load', label: 'Create Load' },
  { value: 'Update Load', label: 'Update Load' },
  { value: 'Cancel Load', label: 'Cancel Load' },
  { value: 'Assign Driver', label: 'Assign Driver' },
  { value: 'Create User', label: 'Create User' },
  { value: 'Deactivate User', label: 'Deactivate User' },
  { value: 'Update Settings', label: 'Update Settings' },
  { value: 'Upload Document', label: 'Upload Document' },
  { value: 'Export Report', label: 'Export Report' },
  { value: 'Update Permissions', label: 'Update Permissions' },
  { value: 'Update Carrier', label: 'Update Carrier' },
];

const userOptions = [
  { value: 'Alex Mercer', label: 'Alex Mercer' },
  { value: 'Rachel Torres', label: 'Rachel Torres' },
  { value: 'Kevin Shaw', label: 'Kevin Shaw' },
  { value: 'Greg Thompson', label: 'Greg Thompson' },
  { value: 'Maria Santos', label: 'Maria Santos' },
];

const filters = [
  { id: 'action', label: 'All Actions', options: actionOptions },
  { id: 'user', label: 'All Users', options: userOptions },
];

const statusBadgeColors: Record<string, string> = {
  success: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  failure: 'bg-red-400/10 text-red-400 border-red-400/20',
  warning: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
};

export default function AuditPage() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !log.user.toLowerCase().includes(q) &&
          !log.action.toLowerCase().includes(q) &&
          !log.resource.toLowerCase().includes(q) &&
          !log.ipAddress.includes(q)
        ) return false;
      }
      if (activeFilters.action && log.action !== activeFilters.action) return false;
      if (activeFilters.user && log.user !== activeFilters.user) return false;
      return true;
    });
  }, [search, activeFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Audit Logs</h1>
          <p className="text-sm text-slate-400">{auditLogs.length} entries recorded</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12l-2 2V4a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H4z" />
          </svg>
          Export Logs
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search by user, action, resource, or IP..."
        onSearchChange={setSearch}
      />

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Timestamp</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">User</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Resource</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">IP Address</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="transition-colors hover:bg-slate-800/20">
                <td className="px-4 py-3 text-sm font-mono text-slate-400">{log.timestamp}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={log.user === 'Unknown' ? 'text-red-400' : 'font-medium text-slate-200'}>
                    {log.user}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{log.action}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{log.resource}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-500">{log.ipAddress}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${statusBadgeColors[log.status]}`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-500">
                  No audit logs match your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
