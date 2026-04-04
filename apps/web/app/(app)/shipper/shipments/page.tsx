'use client';

import { useState, useMemo } from 'react';
import DataTable from '../../../_components/DataTable';
import StatusBadge from '../../../_components/StatusBadge';
import Tabs from '../../../_components/Tabs';
import FilterBar from '../../../_components/FilterBar';
import { loads } from '../../../_data/mock-data';

const tabs = [
  { id: 'all', label: 'All', count: loads.length },
  { id: 'active', label: 'Active', count: loads.filter((l) => ['in_transit', 'assigned', 'picked_up'].includes(l.status)).length },
  { id: 'completed', label: 'Completed', count: loads.filter((l) => l.status === 'delivered').length },
  { id: 'pending', label: 'Pending', count: loads.filter((l) => ['draft', 'posted'].includes(l.status)).length },
];

const filters = [
  {
    id: 'equipment',
    label: 'Equipment',
    options: [
      { value: 'dry_van', label: 'Dry Van' },
      { value: 'reefer', label: 'Reefer' },
      { value: 'flatbed', label: 'Flatbed' },
      { value: 'tanker', label: 'Tanker' },
      { value: 'step_deck', label: 'Step Deck' },
    ],
  },
  {
    id: 'date',
    label: 'Date Range',
    options: [
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' },
      { value: '90d', label: 'Last 90 Days' },
    ],
  },
];

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

type ShipmentRow = Record<string, unknown> & {
  tracking: string;
  origin: string;
  destination: string;
  status: string;
  date: string;
  carrier: string;
  rate: string;
  actions: string;
};

const tableColumns = [
  { key: 'tracking', label: 'Tracking #' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      const mapped = s === 'picked_up' ? 'at_pickup' : s === 'posted' ? 'pending' : s === 'draft' ? 'pending' : s;
      return <StatusBadge status={mapped as 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'} size="sm" />;
    },
  },
  { key: 'date', label: 'Date' },
  { key: 'carrier', label: 'Carrier' },
  { key: 'rate', label: 'Rate' },
  {
    key: 'actions',
    label: 'Actions',
    render: () => (
      <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300">
        View
      </button>
    ),
  },
];

export default function ShipperShipmentsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filteredLoads = useMemo(() => {
    let result = loads;

    if (activeTab === 'active') {
      result = result.filter((l) => ['in_transit', 'assigned', 'picked_up'].includes(l.status));
    } else if (activeTab === 'completed') {
      result = result.filter((l) => l.status === 'delivered');
    } else if (activeTab === 'pending') {
      result = result.filter((l) => ['draft', 'posted'].includes(l.status));
    }

    if (activeFilters.equipment) {
      result = result.filter((l) => l.equipmentType === activeFilters.equipment);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.loadNumber.toLowerCase().includes(q) ||
          l.origin.city.toLowerCase().includes(q) ||
          l.destination.city.toLowerCase().includes(q) ||
          (l.carrier?.name ?? '').toLowerCase().includes(q),
      );
    }

    return result;
  }, [activeTab, search, activeFilters]);

  const tableData: ShipmentRow[] = filteredLoads.map((l) => ({
    tracking: `IF-TRK-${l.id.replace('LD-2024-', '')}`,
    origin: `${l.origin.city}, ${l.origin.state}`,
    destination: `${l.destination.city}, ${l.destination.state}`,
    status: l.status,
    date: l.pickupDate,
    carrier: l.carrier?.name ?? 'Unassigned',
    rate: `$${l.rate.toLocaleString()}`,
    actions: '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Shipment History</h1>
          <p className="text-sm text-slate-400">View and manage all your shipments</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-[#161b22] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 8h8M8 4v8" />
          </svg>
          Export
        </button>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search shipments..."
        onSearchChange={setSearch}
      />

      <DataTable<ShipmentRow> columns={tableColumns} data={tableData} emptyMessage="No shipments found" />
    </div>
  );
}
