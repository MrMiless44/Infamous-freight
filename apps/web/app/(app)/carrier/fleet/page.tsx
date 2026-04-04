'use client';

import DataTable from '../../../_components/DataTable';
import { vehicles } from '../../../_data/mock-data';

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed', step_deck: 'Step Deck',
  tanker: 'Tanker', intermodal: 'Intermodal', box_truck: 'Box Truck', ltl: 'LTL',
};

const statusClasses: Record<string, string> = {
  active: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  maintenance: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  out_of_service: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  maintenance: 'Maintenance',
  out_of_service: 'Out of Service',
};

type VehicleRow = Record<string, unknown> & {
  unit: string;
  vehicle: string;
  type: string;
  status: string;
  driver: string;
  mileage: string;
  nextService: string;
  location: string;
};

const columns = [
  { key: 'unit', label: 'Unit #' },
  { key: 'vehicle', label: 'Vehicle' },
  { key: 'type', label: 'Type' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClasses[s] ?? ''}`}>
          <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
          {statusLabels[s] ?? s}
        </span>
      );
    },
  },
  { key: 'driver', label: 'Driver' },
  { key: 'mileage', label: 'Mileage' },
  { key: 'nextService', label: 'Next Service' },
  { key: 'location', label: 'Location' },
];

const tableData: VehicleRow[] = vehicles.map((v) => ({
  unit: v.unitNumber,
  vehicle: `${v.year} ${v.make} ${v.model}`,
  type: equipmentLabels[v.type] ?? v.type,
  status: v.status,
  driver: v.driver ?? 'Unassigned',
  mileage: `${v.mileage.toLocaleString()} mi`,
  nextService: v.nextService,
  location: v.location ? `${v.location.city}, ${v.location.state}` : '-',
}));

const utilizationStats = [
  { label: 'Active', count: vehicles.filter((v) => v.status === 'active').length, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
  { label: 'Maintenance', count: vehicles.filter((v) => v.status === 'maintenance').length, color: 'bg-orange-500', textColor: 'text-orange-400' },
  { label: 'Out of Service', count: vehicles.filter((v) => v.status === 'out_of_service').length, color: 'bg-red-500', textColor: 'text-red-400' },
];

export default function CarrierFleetPage() {
  const utilRate = Math.round((vehicles.filter((v) => v.status === 'active').length / vehicles.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Fleet Overview</h1>
        <p className="text-sm text-slate-400">Manage your vehicles, drivers, and maintenance</p>
      </div>

      {/* Fleet Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Total Vehicles</p>
          <p className="mt-1 text-2xl font-bold text-white">{vehicles.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <p className="text-xs font-medium text-slate-400">Utilization Rate</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{utilRate}%</p>
        </div>
        {utilizationStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <p className="text-xs font-medium text-slate-400">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.textColor}`}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Maintenance Schedule */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Upcoming Maintenance</h3>
        <div className="space-y-2">
          {vehicles
            .filter((v) => v.nextService)
            .sort((a, b) => a.nextService.localeCompare(b.nextService))
            .slice(0, 3)
            .map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-[#0d1117] px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-400">
                    {v.unitNumber}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{v.make} {v.model}</p>
                    <p className="text-[11px] text-slate-500">{v.mileage.toLocaleString()} miles</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{v.nextService}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Vehicle Table */}
      <DataTable<VehicleRow> columns={columns} data={tableData} emptyMessage="No vehicles found" />
    </div>
  );
}
