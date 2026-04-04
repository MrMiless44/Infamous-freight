'use client';

import { useState } from 'react';
import KPICard from '../../../_components/KPICard';
import DataTable from '../../../_components/DataTable';
import Modal from '../../../_components/Modal';
import { vehicles } from '../../../_data/mock-data';

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

const statusBadgeColors: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  maintenance: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  out_of_service: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  out_of_service: 'Out of Service',
};

const activeCount = vehicles.filter((v) => v.status === 'active').length;
const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;
const outOfServiceCount = vehicles.filter((v) => v.status === 'out_of_service').length;

const maintenanceSchedule = [
  { vehicle: 'Unit #5009', type: 'Oil Change & Inspection', date: 'Apr 5, 2024', priority: 'high' },
  { vehicle: 'Unit #8022', type: 'Brake Replacement', date: 'Apr 8, 2024', priority: 'high' },
  { vehicle: 'Unit #1042', type: 'Tire Rotation', date: 'Apr 15, 2024', priority: 'medium' },
  { vehicle: 'Unit #2078', type: 'Transmission Service', date: 'Apr 20, 2024', priority: 'medium' },
  { vehicle: 'Unit #7044', type: 'Full DOT Inspection', date: 'Apr 25, 2024', priority: 'low' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-red-400/10 text-red-400 border-red-400/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  low: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
};

type VehicleRow = Record<string, unknown> & {
  unitNumber: string;
  type: string;
  makeModel: string;
  year: number;
  status: string;
  mileage: string;
  driver: string;
  nextService: string;
  location: string;
};

export default function FleetPage() {
  const [showAddModal, setShowAddModal] = useState(false);

  const tableData: VehicleRow[] = vehicles.map((v) => ({
    unitNumber: `Unit #${v.unitNumber}`,
    type: equipmentLabels[v.type] ?? v.type,
    makeModel: `${v.make} ${v.model}`,
    year: v.year,
    status: v.status,
    mileage: `${v.mileage.toLocaleString()} mi`,
    driver: v.driver ?? 'Unassigned',
    nextService: v.nextService,
    location: v.location ? `${v.location.city}, ${v.location.state}` : '-',
  }));

  const columns = [
    {
      key: 'unitNumber',
      label: 'Unit #',
      render: (val: unknown) => <span className="font-medium text-slate-200">{val as string}</span>,
    },
    { key: 'type', label: 'Type' },
    { key: 'makeModel', label: 'Make / Model' },
    { key: 'year', label: 'Year' },
    {
      key: 'status',
      label: 'Status',
      render: (val: unknown) => {
        const status = val as string;
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadgeColors[status] ?? ''}`}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80" />
            {statusLabels[status] ?? status}
          </span>
        );
      },
    },
    { key: 'mileage', label: 'Mileage' },
    { key: 'driver', label: 'Driver' },
    { key: 'nextService', label: 'Next Service' },
    { key: 'location', label: 'Location' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Fleet Management</h1>
          <p className="text-sm text-slate-400">Vehicle overview and maintenance</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Vehicles"
          value={vehicles.length}
          subtitle="in fleet"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="12" height="8" rx="1" /><path d="M13 9h3l2.5 3V14h-5.5" /><circle cx="5.5" cy="15" r="1.5" /><circle cx="15.5" cy="15" r="1.5" /></svg>}
        />
        <KPICard
          title="Active"
          value={activeCount}
          change={5}
          changeType="up"
          subtitle="on the road"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10l5 5L17 5" /></svg>}
        />
        <KPICard
          title="Maintenance"
          value={maintenanceCount}
          subtitle="in shop"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0L3 12v3h3z" /><path d="M12.3 7.7l2 2" /></svg>}
        />
        <KPICard
          title="Out of Service"
          value={outOfServiceCount}
          subtitle="needs attention"
          icon={<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 6v4M10 14h.01" /></svg>}
        />
      </div>

      {/* Vehicle Table */}
      <DataTable<VehicleRow> columns={columns} data={tableData} />

      {/* Maintenance Schedule */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Upcoming Maintenance</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Vehicle</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Service Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {maintenanceSchedule.map((item) => (
                <tr key={item.vehicle + item.type} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-medium text-slate-200">{item.vehicle}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{item.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{item.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${priorityColors[item.priority]}`}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Vehicle Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Vehicle" size="lg">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Unit Number</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="e.g. 9001" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Equipment Type</label>
              <select className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none focus:border-blue-500/50 [&>option]:bg-[#161b22]">
                <option value="">Select type...</option>
                {Object.entries(equipmentLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Make</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="e.g. Peterbilt" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Model</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="e.g. 579" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Year</label>
              <input type="number" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="2024" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">VIN</label>
              <input type="text" className="w-full rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500/50" placeholder="Vehicle ID number" />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800">Cancel</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500">Add Vehicle</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
