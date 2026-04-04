'use client';

import DataTable from '../../../_components/DataTable';
import StatusBadge from '../../../_components/StatusBadge';
import { loads } from '../../../_data/mock-data';

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed', step_deck: 'Step Deck',
  tanker: 'Tanker', intermodal: 'Intermodal', box_truck: 'Box Truck', ltl: 'LTL',
};

type LoadRow = Record<string, unknown> & {
  loadNumber: string;
  route: string;
  status: string;
  driver: string;
  equipment: string;
  eta: string;
  actions: string;
};

const columns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'route', label: 'Route' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const mapped = s === 'picked_up' ? 'at_pickup' : s === 'posted' ? 'pending' : s;
      return <StatusBadge status={mapped as 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'} size="sm" />;
    },
  },
  { key: 'driver', label: 'Driver' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'eta', label: 'ETA' },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300">
        Details
      </button>
    ),
  },
];

const carrierLoads = loads.filter(
  (l) => l.carrier?.name === 'Great Plains Logistics' && ['in_transit', 'assigned', 'picked_up', 'delayed'].includes(l.status),
);

const tableData: LoadRow[] = carrierLoads.map((l) => ({
  loadNumber: l.loadNumber,
  route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
  status: l.status,
  driver: l.driver?.name ?? 'Unassigned',
  equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
  eta: l.eta ?? '-',
  actions: '',
}));

export default function CarrierLoadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Assigned Loads</h1>
        <p className="text-sm text-slate-400">Active loads assigned to your fleet</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">In Transit</p>
          <p className="text-lg font-bold text-blue-400">{carrierLoads.filter((l) => l.status === 'in_transit').length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">Assigned</p>
          <p className="text-lg font-bold text-indigo-400">{carrierLoads.filter((l) => l.status === 'assigned').length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">At Pickup</p>
          <p className="text-lg font-bold text-cyan-400">{carrierLoads.filter((l) => l.status === 'picked_up').length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">Delayed</p>
          <p className="text-lg font-bold text-orange-400">{carrierLoads.filter((l) => l.status === 'delayed').length}</p>
        </div>
      </div>

      <DataTable<LoadRow> columns={columns} data={tableData} emptyMessage="No assigned loads" />
    </div>
  );
}
