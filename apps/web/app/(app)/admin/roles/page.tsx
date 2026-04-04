'use client';

import { useState } from 'react';

interface Role {
  name: string;
  key: string;
  usersCount: number;
  description: string;
}

const roles: Role[] = [
  { name: 'Admin', key: 'admin', usersCount: 3, description: 'Full system access including user management, billing, and system settings' },
  { name: 'Dispatcher', key: 'dispatcher', usersCount: 8, description: 'Manage loads, assign drivers, and coordinate shipments' },
  { name: 'Driver', key: 'driver', usersCount: 24, description: 'View assigned loads, update delivery status, and upload documents' },
  { name: 'Shipper', key: 'shipper', usersCount: 7, description: 'Create loads, track shipments, and manage invoices' },
  { name: 'Carrier', key: 'carrier', usersCount: 5, description: 'Manage fleet, accept loads, and view carrier-specific analytics' },
];

const permissions = [
  'Manage Users',
  'View Loads',
  'Create Loads',
  'Assign Drivers',
  'View Analytics',
  'Manage Billing',
  'System Settings',
  'View Documents',
  'Upload Documents',
  'Manage Fleet',
  'View Tracking',
  'Manage Carriers',
  'Export Data',
  'Audit Logs',
];

const permissionMatrix: Record<string, string[]> = {
  admin: permissions, // Admin has all
  dispatcher: ['View Loads', 'Create Loads', 'Assign Drivers', 'View Analytics', 'View Documents', 'Upload Documents', 'Manage Fleet', 'View Tracking', 'Manage Carriers', 'Export Data'],
  driver: ['View Loads', 'View Documents', 'Upload Documents', 'View Tracking'],
  shipper: ['View Loads', 'Create Loads', 'View Analytics', 'Manage Billing', 'View Documents', 'View Tracking', 'Export Data'],
  carrier: ['View Loads', 'View Analytics', 'View Documents', 'Upload Documents', 'Manage Fleet', 'View Tracking', 'Export Data'],
};

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  dispatcher: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  driver: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  shipper: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  carrier: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
};

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Role Permissions</h1>
        <p className="text-sm text-slate-400">Manage role-based access control</p>
      </div>

      {/* Roles Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Roles Overview</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Users</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Description</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {roles.map((role) => (
                <tr key={role.key} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadgeColors[role.key]}`}>
                      {role.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{role.usersCount} users</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{role.description}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedRole(selectedRole === role.key ? null : role.key)}
                      className="rounded-lg px-3 py-1 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-400/10"
                    >
                      {selectedRole === role.key ? 'Hide Permissions' : 'View Permissions'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Permissions Matrix</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="sticky left-0 bg-[#161b22] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Permission</th>
                {roles.map((role) => (
                  <th key={role.key} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissions.map((perm) => (
                <tr key={perm} className="transition-colors hover:bg-slate-800/20">
                  <td className="sticky left-0 bg-[#161b22] px-4 py-3 text-sm font-medium text-slate-300">{perm}</td>
                  {roles.map((role) => {
                    const hasPermission = permissionMatrix[role.key]?.includes(perm);
                    return (
                      <td key={role.key} className="px-4 py-3 text-center">
                        {hasPermission ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/10">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                              <path d="M2.5 7l3 3L11.5 4" />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/40">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-600">
                              <path d="M4 4l6 6M10 4l-6 6" />
                            </svg>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
