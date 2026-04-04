'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DataTable from '../../../_components/DataTable';
import StatusBadge from '../../../_components/StatusBadge';
import { loads } from '../../../_data/mock-data';

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

const statusBadgeMap: Record<string, 'pending' | 'assigned' | 'in_transit' | 'at_pickup' | 'at_delivery' | 'delivered' | 'cancelled' | 'delayed'> = {
  in_transit: 'in_transit',
  picked_up: 'at_pickup',
  delivered: 'delivered',
  delayed: 'delayed',
  assigned: 'assigned',
  posted: 'pending',
  draft: 'pending',
  cancelled: 'cancelled',
};

type LoadRow = Record<string, unknown> & {
  loadNumber: string;
  origin: string;
  destination: string;
  equipment: string;
  weight: string;
  rate: string;
  ratePerMile: string;
  postedDate: string;
  status: string;
  id: string;
};

const tableColumns = [
  { key: 'loadNumber', label: 'Load #' },
  { key: 'origin', label: 'Origin' },
  { key: 'destination', label: 'Destination' },
  {
    key: 'status',
    label: 'Status',
    render: (val: unknown) => {
      const s = val as string;
      return <StatusBadge status={statusBadgeMap[s] ?? 'pending'} size="sm" />;
    },
  },
  { key: 'equipment', label: 'Equipment' },
  { key: 'weight', label: 'Weight' },
  { key: 'rate', label: 'Rate' },
  { key: 'ratePerMile', label: 'Rate/Mile' },
  { key: 'postedDate', label: 'Posted Date' },
  {
    key: 'actions',
    label: 'Actions',
    render: (_val: unknown, row: LoadRow) => {
      const s = row.status as string;
      if (s === 'posted' || s === 'draft') {
        return (
          <button
            type="button"
            className="rounded border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
          >
            Assign
          </button>
        );
      }
      return (
        <span className="text-xs text-slate-500">--</span>
      );
    },
  },
];

type SortKey = 'rate' | 'postedDate' | 'weight' | 'distance';
type SortDir = 'asc' | 'desc';

export default function LoadBoardPage() {
  const [search, setSearch] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('postedDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Only show posted/unassigned/draft/assigned loads
  const eligibleLoads = loads.filter((l) =>
    ['posted', 'draft', 'assigned'].includes(l.status),
  );

  const filteredRows = useMemo(() => {
    let list = eligibleLoads;

    if (statusFilter !== 'all') {
      list = list.filter((l) => l.status === statusFilter);
    }
    if (equipmentFilter !== 'all') {
      list = list.filter((l) => l.equipmentType === equipmentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.loadNumber.toLowerCase().includes(q) ||
          l.origin.city.toLowerCase().includes(q) ||
          l.destination.city.toLowerCase().includes(q) ||
          l.commodity.toLowerCase().includes(q),
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'rate':
          cmp = a.rate - b.rate;
          break;
        case 'weight':
          cmp = a.weight - b.weight;
          break;
        case 'postedDate':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'distance':
          cmp = a.distance - b.distance;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list.map<LoadRow>((l) => ({
      id: l.id,
      loadNumber: l.loadNumber,
      origin: `${l.origin.city}, ${l.origin.state}`,
      destination: `${l.destination.city}, ${l.destination.state}`,
      equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
      weight: `${l.weight.toLocaleString()} lbs`,
      rate: `$${l.rate.toLocaleString()}`,
      ratePerMile: `$${(l.rate / l.distance).toFixed(2)}`,
      postedDate: l.createdAt,
      status: l.status,
    }));
  }, [search, equipmentFilter, statusFilter, sortKey, sortDir, eligibleLoads]);

  const uniqueEquipment = [...new Set(loads.map((l) => l.equipmentType))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/dispatch" className="text-slate-400 hover:text-white transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white">Load Board</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">All posted and unassigned loads available for dispatch</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            {filteredRows.length} loads
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search loads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#0d1117] py-2 pl-9 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="posted">Posted</option>
          <option value="draft">Draft</option>
          <option value="assigned">Assigned</option>
        </select>

        {/* Equipment filter */}
        <select
          value={equipmentFilter}
          onChange={(e) => setEquipmentFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Equipment</option>
          {uniqueEquipment.map((eq) => (
            <option key={eq} value={eq}>{equipmentLabels[eq] ?? eq}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={`${sortKey}-${sortDir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split('-') as [SortKey, SortDir];
            setSortKey(key);
            setSortDir(dir);
          }}
          className="rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="postedDate-desc">Newest First</option>
          <option value="postedDate-asc">Oldest First</option>
          <option value="rate-desc">Highest Rate</option>
          <option value="rate-asc">Lowest Rate</option>
          <option value="weight-desc">Heaviest</option>
          <option value="weight-asc">Lightest</option>
        </select>
      </div>

      {/* Table */}
      <DataTable<LoadRow> columns={tableColumns} data={filteredRows} emptyMessage="No loads match your filters." />
    </div>
  );
}
