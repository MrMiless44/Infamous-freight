'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DataTable from '../../../_components/DataTable';
import StatusBadge from '../../../_components/StatusBadge';
import { vehicles, drivers } from '../../../_data/mock-data';

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  tanker: 'Tanker',
  intermodal: 'Intermodal',
  box_truck: 'Box Truck',
  ltl: 'LTL',
};

const vehicleStatusConfig: Record<string, { label: string; badge: 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed' }> = {
  active: { label: 'Active', badge: 'in_transit' },
  maintenance: { label: 'Maintenance', badge: 'delayed' },
  out_of_service: { label: 'Out of Service', badge: 'cancelled' },
};

// Fleet status summary
const fleetSummary = [
  {
    label: 'Available',
    count: drivers.filter((d) => d.status === 'available').length,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    label: 'On Route',
    count: drivers.filter((d) => d.status === 'on_route').length,
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'Off Duty',
    count: drivers.filter((d) => d.status === 'off_duty').length,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  {
    label: 'Maintenance',
    count: vehicles.filter((v) => v.status === 'maintenance').length,
    color: 'bg-red-500',
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
];

type VehicleRow = Record<string, unknown> & {
  unitNumber: string;
  type: string;
  makeModel: string;
  driver: string;
  status: string;
  location: string;
  mileage: string;
  nextService: string;
};

const tableColumns = [
  { key: 'unitNumber', label: 'Unit #' },
  { key: 'type', label: 'Type' },
  { key: 'makeModel', label: 'Make / Model' },
  { key: 'driver', label: 'Driver' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const config = vehicleStatusConfig[s] ?? vehicleStatusConfig.active;
      return <StatusBadge status={config.badge} size="sm" />;
    },
  },
  { key: 'location', label: 'Location' },
  { key: 'mileage', label: 'Mileage' },
  { key: 'nextService', label: 'Next Service' },
];

export default function FleetPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const rows = useMemo(() => {
    let list = vehicles;

    if (statusFilter !== 'all') {
      list = list.filter((v) => v.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.unitNumber.toLowerCase().includes(q) ||
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          (v.driver ?? '').toLowerCase().includes(q) ||
          (v.location ? `${v.location.city} ${v.location.state}`.toLowerCase().includes(q) : false),
      );
    }

    return list.map<VehicleRow>((v) => ({
      unitNumber: `#${v.unitNumber}`,
      type: equipmentLabels[v.type] ?? v.type,
      makeModel: `${v.year} ${v.make} ${v.model}`,
      driver: v.driver ?? 'Unassigned',
      status: v.status,
      location: v.location ? `${v.location.city}, ${v.location.state}` : 'Unknown',
      mileage: `${v.mileage.toLocaleString()} mi`,
      nextService: v.nextService,
    }));
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dispatch" className="text-slate-400 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Fleet Utilization</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">Monitor vehicle status, locations, and maintenance schedules</p>
        </div>
      </div>

      {/* Fleet status summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {fleetSummary.map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{item.label}</p>
                <p className="mt-1 text-3xl font-bold text-white">{item.count}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${item.bgColor}`}>
                <span className={`h-3 w-3 rounded-full ${item.color}`} />
              </div>
            </div>
            <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${item.color}`}
                style={{ width: `${(item.count / vehicles.length) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-600">
              {((item.count / vehicles.length) * 100).toFixed(0)}% of fleet
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search by unit, make, driver, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#0d1117] py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_service">Out of Service</option>
        </select>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
          {rows.length} vehicles
        </span>
      </div>

      {/* Vehicle table */}
      <DataTable<VehicleRow> columns={tableColumns} data={rows} emptyMessage="No vehicles match your filters." />
    </div>
  );
}
