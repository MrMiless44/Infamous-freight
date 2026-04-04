'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StatusBadge from '../../_components/StatusBadge';
import DataTable from '../../_components/DataTable';
import FilterBar from '../../_components/FilterBar';
import Tabs from '../../_components/Tabs';
import { loads } from '../../_data/mock-data';
import type { Load, LoadStatus, EquipmentType } from '../../_data/mock-data';

const equipmentLabels: Record<EquipmentType, string> = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  tanker: 'Tanker',
  intermodal: 'Intermodal',
  box_truck: 'Box Truck',
  ltl: 'LTL',
};

const statusLabels: Record<LoadStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
};

const statusToBadge: Record<LoadStatus, string> = {
  draft: 'pending',
  posted: 'pending',
  assigned: 'assigned',
  picked_up: 'at_pickup',
  in_transit: 'in_transit',
  delivered: 'delivered',
  delayed: 'delayed',
  cancelled: 'cancelled',
};

const filters = [
  {
    id: 'status',
    label: 'All Statuses',
    options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
  },
  {
    id: 'equipment',
    label: 'Equipment Type',
    options: Object.entries(equipmentLabels).map(([value, label]) => ({ value, label })),
  },
  {
    id: 'dateRange',
    label: 'Date Range',
    options: [
      { value: 'today', label: 'Today' },
      { value: 'this_week', label: 'This Week' },
      { value: 'this_month', label: 'This Month' },
      { value: 'last_30', label: 'Last 30 Days' },
    ],
  },
];

type TabId = 'all' | 'active' | 'completed' | 'drafts';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

function formatWeight(weight: number): string {
  return new Intl.NumberFormat('en-US').format(weight) + ' lbs';
}

export default function LoadsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLoads = useMemo(() => {
    let result = [...loads];

    // Tab filter
    if (activeTab === 'active') {
      result = result.filter((l) =>
        ['posted', 'assigned', 'picked_up', 'in_transit', 'delayed'].includes(l.status),
      );
    } else if (activeTab === 'completed') {
      result = result.filter((l) => l.status === 'delivered');
    } else if (activeTab === 'drafts') {
      result = result.filter((l) => l.status === 'draft');
    }

    // Dropdown filters
    if (activeFilters.status) {
      result = result.filter((l) => l.status === activeFilters.status);
    }
    if (activeFilters.equipment) {
      result = result.filter((l) => l.equipmentType === activeFilters.equipment);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.loadNumber.toLowerCase().includes(q) ||
          l.shipper.name.toLowerCase().includes(q) ||
          l.origin.city.toLowerCase().includes(q) ||
          l.destination.city.toLowerCase().includes(q) ||
          l.commodity.toLowerCase().includes(q),
      );
    }

    return result;
  }, [activeTab, activeFilters, searchQuery]);

  const tabCounts = useMemo(() => {
    const active = loads.filter((l) =>
      ['posted', 'assigned', 'picked_up', 'in_transit', 'delayed'].includes(l.status),
    ).length;
    const completed = loads.filter((l) => l.status === 'delivered').length;
    const drafts = loads.filter((l) => l.status === 'draft').length;
    return { all: loads.length, active, completed, drafts };
  }, []);

  const tabs = [
    { id: 'all', label: 'All Loads', count: tabCounts.all },
    { id: 'active', label: 'Active', count: tabCounts.active },
    { id: 'completed', label: 'Completed', count: tabCounts.completed },
    { id: 'drafts', label: 'Drafts', count: tabCounts.drafts },
  ];

  const columns = [
    {
      key: 'loadNumber',
      label: 'Load #',
      render: (_: unknown, row: Load) => (
        <span className="font-medium text-blue-400">{row.loadNumber}</span>
      ),
    },
    {
      key: 'shipper',
      label: 'Customer',
      render: (_: unknown, row: Load) => row.shipper.name,
    },
    {
      key: 'origin',
      label: 'Origin \u2192 Destination',
      render: (_: unknown, row: Load) => (
        <span>
          {row.origin.city}, {row.origin.state}{' '}
          <span className="text-slate-500">\u2192</span>{' '}
          {row.destination.city}, {row.destination.state}
        </span>
      ),
    },
    {
      key: 'equipmentType',
      label: 'Equipment',
      render: (_: unknown, row: Load) => equipmentLabels[row.equipmentType],
    },
    {
      key: 'weight',
      label: 'Weight',
      render: (_: unknown, row: Load) => formatWeight(row.weight),
    },
    {
      key: 'rate',
      label: 'Rate',
      render: (_: unknown, row: Load) => (
        <span className="font-medium text-emerald-400">{formatCurrency(row.rate)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (_: unknown, row: Load) => (
        <StatusBadge status={statusToBadge[row.status] as never} size="sm" />
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (_: unknown, row: Load) => row.driver?.name ?? <span className="text-slate-500">Unassigned</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_: unknown, row: Load) => (
        <Link
          href={`/loads/${row.id}`}
          className="text-xs font-medium text-blue-400 hover:text-blue-300"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </Link>
      ),
    },
  ];

  // Cast filtered loads to the expected Record<string, unknown> shape
  const tableData = filteredLoads as unknown as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Load Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            {filteredLoads.length} load{filteredLoads.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link
          href="/loads/create"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Create Load
        </Link>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFilterChange={(filterId, value) =>
          setActiveFilters((prev) => ({ ...prev, [filterId]: value }))
        }
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search loads, customers, cities..."
      />

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabId)}
      />

      {/* Table */}
      <DataTable
        columns={columns as never}
        data={tableData}
        onRowClick={(row) => {
          const load = row as unknown as Load;
          router.push(`/loads/${load.id}`);
        }}
        emptyMessage="No loads found matching your criteria."
      />
    </div>
  );
}
