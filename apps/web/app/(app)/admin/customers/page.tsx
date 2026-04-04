'use client';

import { useState, useMemo } from 'react';
import FilterBar from '../../../_components/FilterBar';
import { loads } from '../../../_data/mock-data';

// Build customer data from loads
const customerMap = new Map<string, { company: string; contact: string; email: string; activeLoads: number; totalLoads: number; revenue: number; status: string }>();

loads.forEach((load) => {
  const key = load.shipper.name;
  const existing = customerMap.get(key);
  const isActive = ['in_transit', 'assigned', 'picked_up', 'posted'].includes(load.status);
  if (existing) {
    existing.totalLoads += 1;
    if (isActive) existing.activeLoads += 1;
    existing.revenue += load.rate;
  } else {
    customerMap.set(key, {
      company: load.shipper.name,
      contact: load.shipper.contact,
      email: `${load.shipper.contact.split(' ')[0].toLowerCase()}@${load.shipper.name.toLowerCase().replace(/\s+/g, '')}.com`,
      activeLoads: isActive ? 1 : 0,
      totalLoads: 1,
      revenue: load.rate,
      status: 'active',
    });
  }
});

// Add extra customers
customerMap.set('Global Freight Solutions', {
  company: 'Global Freight Solutions',
  contact: 'Patricia Hayes',
  email: 'patricia@globalfreight.com',
  activeLoads: 0,
  totalLoads: 34,
  revenue: 125400,
  status: 'active',
});
customerMap.set('Premier Logistics Co', {
  company: 'Premier Logistics Co',
  contact: 'Steven Burke',
  email: 'steven@premierlogistics.com',
  activeLoads: 0,
  totalLoads: 12,
  revenue: 48600,
  status: 'inactive',
});

const customers = Array.from(customerMap.values());

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const filters = [
  { id: 'status', label: 'All Statuses', options: statusOptions },
];

const statusBadgeColors: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  inactive: 'bg-red-400/10 text-red-400 border-red-400/20',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.company.toLowerCase().includes(q) && !c.contact.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
      }
      if (activeFilters.status && c.status !== activeFilters.status) return false;
      return true;
    });
  }, [search, activeFilters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Customer Management</h1>
          <p className="text-sm text-slate-400">{customers.length} registered customers</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search by company, contact, or email..."
        onSearchChange={setSearch}
      />

      {/* Customer Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Company</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Contact</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Active Loads</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Total Loads</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Revenue</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredCustomers.map((customer) => (
              <tr key={customer.company} className="transition-colors hover:bg-slate-800/20">
                <td className="px-4 py-3 text-sm font-medium text-slate-200">{customer.company}</td>
                <td className="px-4 py-3 text-sm text-slate-300">{customer.contact}</td>
                <td className="px-4 py-3 text-sm text-slate-400">{customer.email}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={customer.activeLoads > 0 ? 'font-semibold text-blue-400' : 'text-slate-400'}>
                    {customer.activeLoads}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{customer.totalLoads}</td>
                <td className="px-4 py-3 text-sm font-medium text-emerald-400">
                  ${customer.revenue.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeColors[customer.status]}`}>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                    {customer.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-lg px-2 py-1 text-xs text-blue-400 transition-colors hover:bg-blue-400/10">
                      View
                    </button>
                    <button type="button" className="rounded-lg px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-400/10">
                      Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
