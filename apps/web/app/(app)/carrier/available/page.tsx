'use client';

import { useState, useMemo } from 'react';
import DataTable from '../../../_components/DataTable';
import FilterBar from '../../../_components/FilterBar';
import { loads } from '../../../_data/mock-data';

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
    id: 'region',
    label: 'Origin Region',
    options: [
      { value: 'west', label: 'West' },
      { value: 'midwest', label: 'Midwest' },
      { value: 'south', label: 'South' },
      { value: 'northeast', label: 'Northeast' },
    ],
  },
  {
    id: 'rate',
    label: 'Min Rate',
    options: [
      { value: '1000', label: '$1,000+' },
      { value: '2500', label: '$2,500+' },
      { value: '4000', label: '$4,000+' },
    ],
  },
];

const equipmentLabels: Record<string, string> = {
  dry_van: 'Dry Van', reefer: 'Reefer', flatbed: 'Flatbed', step_deck: 'Step Deck',
  tanker: 'Tanker', intermodal: 'Intermodal', box_truck: 'Box Truck', ltl: 'LTL',
};

type LoadRow = Record<string, unknown> & {
  loadNumber: string;
  route: string;
  equipment: string;
  weight: string;
  rate: string;
  ratePerMile: string;
  postedDate: string;
  actions: string;
};

const columns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'route', label: 'Origin / Dest' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'weight', label: 'Weight' },
  {
    key: 'rate',
    label: 'Rate',
    render: (val: unknown) => <span className="font-medium text-emerald-400">{val as string}</span>,
  },
  { key: 'ratePerMile', label: '$/Mile' },
  { key: 'postedDate', label: 'Posted' },
  {
    key: 'actions',
    label: '',
    render: () => (
      <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-500">
        Accept Load
      </button>
    ),
  },
];

export default function CarrierAvailablePage() {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const availableLoads = useMemo(() => {
    let result = loads.filter((l) => l.status === 'posted' || l.status === 'draft');

    if (activeFilters.equipment) {
      result = result.filter((l) => l.equipmentType === activeFilters.equipment);
    }
    if (activeFilters.rate) {
      const minRate = parseInt(activeFilters.rate);
      result = result.filter((l) => l.rate >= minRate);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.loadNumber.toLowerCase().includes(q) ||
          l.origin.city.toLowerCase().includes(q) ||
          l.destination.city.toLowerCase().includes(q),
      );
    }

    return result;
  }, [search, activeFilters]);

  const tableData: LoadRow[] = availableLoads.map((l) => ({
    loadNumber: l.loadNumber,
    route: `${l.origin.city}, ${l.origin.state} \u2192 ${l.destination.city}, ${l.destination.state}`,
    equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
    weight: `${(l.weight / 1000).toFixed(0)}K lbs`,
    rate: `$${l.rate.toLocaleString()}`,
    ratePerMile: `$${(l.rate / l.distance).toFixed(2)}`,
    postedDate: l.createdAt,
    actions: '',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Available Loads</h1>
        <p className="text-sm text-slate-400">Browse and accept available loads on the board</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">Available</p>
          <p className="text-lg font-bold text-white">{availableLoads.length}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-[#161b22] px-4 py-2">
          <p className="text-xs text-slate-500">Avg Rate</p>
          <p className="text-lg font-bold text-emerald-400">
            ${availableLoads.length > 0 ? Math.round(availableLoads.reduce((s, l) => s + l.rate, 0) / availableLoads.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={(id, val) => setActiveFilters((prev) => ({ ...prev, [id]: val }))}
        searchPlaceholder="Search loads..."
        onSearchChange={setSearch}
      />

      <DataTable<LoadRow> columns={columns} data={tableData} emptyMessage="No available loads matching your criteria" />
    </div>
  );
}
