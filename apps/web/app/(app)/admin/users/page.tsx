'use client';

import { useState, useMemo } from 'react';
import DataTable from '../../../_components/DataTable';
import FilterBar from '../../../_components/FilterBar';
import Modal from '../../../_components/Modal';
import { users } from '../../../_data/mock-data';
import type { User } from '../../../_data/mock-data';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'dispatcher', label: 'Dispatcher' },
  { value: 'driver', label: 'Driver' },
  { value: 'shipper', label: 'Shipper' },
  { value: 'carrier', label: 'Carrier' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const filters = [
  { id: 'role', label: 'All Roles', options: roleOptions },
  { id: 'status', label: 'All Statuses', options: statusOptions },
];

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  dispatcher: 'Dispatcher',
  driver: 'Driver',
  shipper: 'Shipper',
  carrier: 'Carrier',
};

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  dispatcher: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  driver: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  shipper: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  carrier: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
};

const statusBadgeColors: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  inactive: 'bg-red-400/10 text-red-400 border-red-400/20',
};

// Extend mock users to have more entries
const allUsers: (User & Record<string, unknown>)[] = [
  ...users,
  { id: 'USR-008', name: 'Marcus Johnson', email: 'marcus.j@infamousfreight.com', role: 'driver' as const, phone: '(312) 555-0147', status: 'active' as const, lastActive: '5 min ago' },
  { id: 'USR-009', name: 'Elena Rodriguez', email: 'elena.r@infamousfreight.com', role: 'driver' as const, phone: '(831) 555-0165', status: 'active' as const, lastActive: '1 hr ago' },
  { id: 'USR-010', name: 'Tommy Nguyen', email: 'tommy.n@infamousfreight.com', role: 'driver' as const, phone: '(408) 555-0184', status: 'inactive' as const, lastActive: '3 days ago' },
  { id: 'USR-011', name: 'Dave Wilson', email: 'dave.w@pnwexpress.com', role: 'carrier' as const, phone: '(503) 555-0167', company: 'Pacific Northwest Express', status: 'active' as const, lastActive: '30 min ago' },
  { id: 'USR-012', name: 'Rick Dupree', email: 'rick.d@southerntanker.com', role: 'carrier' as const, phone: '(504) 555-0138', company: 'Southern Tanker Lines', status: 'active' as const, lastActive: '2 hrs ago' },
];

type UserRow = Record<string, unknown> & {
  name: string;
  email: string;
  role: string;
  company: string;
  status: string;
  lastActive: string;
};

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState<{ type: string; user: UserRow } | null>(null);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
      }
      if (activeFilters.role && u.role !== activeFilters.role) return false;
      if (activeFilters.status && u.status !== activeFilters.status) return false;
      return true;
    });
  }, [search, activeFilters]);

  const tableData: UserRow[] = filteredUsers.map((u) => ({
    name: u.name,
    email: u.email,
    role: u.role,
    company: u.company ?? '-',
    status: u.status,
    lastActive: u.lastActive,
  }));

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (val: unknown) => (
        <span className="font-medium text-slate-200">{val as string}</span>
      ),
    },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (val: unknown) => {
        const role = val as string;
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${roleBadgeColors[role] ?? ''}`}>
            {roleLabels[role] ?? role}
          </span>
        );
      },
    },
    { key: 'company', label: 'Company' },
    {
      key: 'status',
      label: 'Status',
      render: (val: unknown) => {
        const status = val as string;
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeColors[status] ?? ''}`}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    { key: 'lastActive', label: 'Last Active' },
    {
      key: 'name',
      label: 'Actions',
      render: (_val: unknown, row: UserRow) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowActionModal({ type: 'edit', user: row }); }}
            className="rounded-lg px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-400/10"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowActionModal({ type: 'deactivate', user: row }); }}
            className="rounded-lg px-2 py-1 text-xs text-yellow-400 transition-colors hover:bg-yellow-400/10"
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowActionModal({ type: 'reset', user: row }); }}
            className="rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-400/10"
          >
            Reset PW
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">User Management</h1>
          <p className="text-sm text-slate-400">{allUsers.length} total users</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add User
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search by name or email..."
        onSearchChange={setSearch}
      />

      {/* Table */}
      <DataTable<UserRow> columns={columns} data={tableData} emptyMessage="No users match your filters" />

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Full Name</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="John Doe" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input type="email" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="john@example.com" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Role</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                <option value="">Select role...</option>
                {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Company</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="Company name (optional)" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Phone</label>
              <input type="tel" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="(555) 000-0000" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">Create User</button>
          </div>
        </form>
      </Modal>

      {/* Action Modal */}
      <Modal
        isOpen={!!showActionModal}
        onClose={() => setShowActionModal(null)}
        title={
          showActionModal?.type === 'edit' ? `Edit User: ${showActionModal.user.name}` :
          showActionModal?.type === 'deactivate' ? `${showActionModal.user.status === 'active' ? 'Deactivate' : 'Activate'} User` :
          'Reset Password'
        }
        size="sm"
      >
        {showActionModal?.type === 'edit' && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowActionModal(null); }}>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Full Name</label>
              <input type="text" defaultValue={showActionModal.user.name} className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
              <input type="email" defaultValue={showActionModal.user.email} className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Role</label>
              <select defaultValue={showActionModal.user.role} className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setShowActionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800">Cancel</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">Save Changes</button>
            </div>
          </form>
        )}
        {showActionModal?.type === 'deactivate' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to {showActionModal.user.status === 'active' ? 'deactivate' : 'activate'}{' '}
              <span className="font-semibold text-white">{showActionModal.user.name}</span>?
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setShowActionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800">Cancel</button>
              <button type="button" onClick={() => setShowActionModal(null)} className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-500">Confirm</button>
            </div>
          </div>
        )}
        {showActionModal?.type === 'reset' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Send a password reset email to{' '}
              <span className="font-semibold text-white">{showActionModal.user.email}</span>?
            </p>
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setShowActionModal(null)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800">Cancel</button>
              <button type="button" onClick={() => setShowActionModal(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">Send Reset</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
