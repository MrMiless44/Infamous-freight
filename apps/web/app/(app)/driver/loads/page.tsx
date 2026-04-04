'use client';

import { useState } from 'react';
import Link from 'next/link';
import Tabs from '../../../_components/Tabs';
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

const activeLoads = loads.filter((l) =>
  ['in_transit', 'picked_up', 'at_pickup', 'at_delivery'].includes(l.status),
);
const upcomingLoads = loads.filter((l) => l.status === 'assigned');
const completedLoads = loads.filter((l) => l.status === 'delivered');

const tabs = [
  { id: 'active', label: 'Active', count: activeLoads.length },
  { id: 'upcoming', label: 'Upcoming', count: upcomingLoads.length },
  { id: 'completed', label: 'Completed', count: completedLoads.length },
];

function mapStatus(status: string) {
  if (status === 'picked_up') return 'at_pickup';
  if (status === 'posted') return 'pending';
  return status;
}

export default function DriverLoadsPage() {
  const [activeTab, setActiveTab] = useState('active');

  const displayed =
    activeTab === 'active'
      ? activeLoads
      : activeTab === 'upcoming'
        ? upcomingLoads
        : completedLoads;

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">My Loads</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {displayed.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-500">No loads found.</div>
      )}

      <div className="space-y-3">
        {displayed.map((load) => (
          <Link
            key={load.id}
            href={`/driver/loads/${load.id}`}
            className="block rounded-xl border border-slate-800 bg-[#161b22] p-4 transition-colors hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">{load.loadNumber}</span>
              <StatusBadge
                status={mapStatus(load.status) as any}
                size="sm"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-white">
              {load.origin.city}, {load.origin.state}
              <span className="mx-2 text-slate-500">&rarr;</span>
              {load.destination.city}, {load.destination.state}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              <span>Pickup: {load.pickupDate}</span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5">
                {equipmentLabels[load.equipmentType] ?? load.equipmentType}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
