'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StatusBadge from '../../_components/StatusBadge';
import Tabs from '../../_components/Tabs';
import { shipments, loads } from '../../_data/mock-data';
import type { Shipment, LoadStatus } from '../../_data/mock-data';

/* ---------- Build extended shipments from loads + shipments ---------- */
interface TrackingShipment {
  id: string;
  trackingNumber: string;
  status: LoadStatus;
  origin: string;
  destination: string;
  progress: number;
  eta: string;
  carrier: string;
  driver: string;
  lastUpdate: string;
  equipment: string;
}

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

function buildTrackingList(): TrackingShipment[] {
  // Start with actual shipments
  const fromShipments: TrackingShipment[] = shipments.map((s) => {
    const load = loads.find((l) => l.id === s.loadId);
    return {
      id: s.id,
      trackingNumber: s.trackingNumber,
      status: s.status,
      origin: `${s.origin.city}, ${s.origin.state}`,
      destination: `${s.destination.city}, ${s.destination.state}`,
      progress: s.progress,
      eta: s.eta,
      carrier: s.carrier,
      driver: s.driver,
      lastUpdate: s.lastUpdate,
      equipment: load ? equipmentLabels[load.equipmentType] ?? load.equipmentType : 'Dry Van',
    };
  });

  // Add loads without shipments that have active statuses
  const shipmentLoadIds = new Set(shipments.map((s) => s.loadId));
  const fromLoads: TrackingShipment[] = loads
    .filter((l) => !shipmentLoadIds.has(l.id) && ['in_transit', 'picked_up', 'delivered', 'delayed', 'assigned'].includes(l.status))
    .map((l) => ({
      id: l.id,
      trackingNumber: `IF-TRK-${l.id.replace('LD-2024-', '9')}`,
      status: l.status,
      origin: `${l.origin.city}, ${l.origin.state}`,
      destination: `${l.destination.city}, ${l.destination.state}`,
      progress: l.status === 'delivered' ? 100 : l.status === 'picked_up' ? 25 : l.status === 'delayed' ? 45 : l.status === 'assigned' ? 10 : 50,
      eta: l.eta ?? l.deliveryDate,
      carrier: l.carrier?.name ?? 'Unassigned',
      driver: l.driver?.name ?? 'Unassigned',
      lastUpdate: l.updatedAt,
      equipment: equipmentLabels[l.equipmentType] ?? l.equipmentType,
    }));

  return [...fromShipments, ...fromLoads];
}

const allShipments = buildTrackingList();

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

const filterTabs = [
  { id: 'all', label: 'All', count: allShipments.length },
  { id: 'in_transit', label: 'In Transit', count: allShipments.filter((s) => s.status === 'in_transit').length },
  { id: 'picked_up', label: 'Picked Up', count: allShipments.filter((s) => s.status === 'picked_up').length },
  { id: 'delivered', label: 'Delivered', count: allShipments.filter((s) => s.status === 'delivered').length },
  { id: 'delayed', label: 'Delayed', count: allShipments.filter((s) => s.status === 'delayed').length },
];

export default function TrackingPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = allShipments;
    if (activeTab !== 'all') list = list.filter((s) => s.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.trackingNumber.toLowerCase().includes(q) ||
          s.origin.toLowerCase().includes(q) ||
          s.destination.toLowerCase().includes(q) ||
          s.driver.toLowerCase().includes(q) ||
          s.carrier.toLowerCase().includes(q),
      );
    }
    return list;
  }, [activeTab, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Shipment Tracking</h1>
          <p className="text-sm text-slate-400">Monitor all active and completed shipments</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Search by tracking number, city, driver, or carrier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-[#0d1117] py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Map placeholder */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-3 text-sm font-semibold text-white">Live Fleet Map</h3>
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
          <div className="text-center">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="mx-auto mb-2 text-slate-600"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="10" r="3" />
              <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
            </svg>
            <p className="text-sm text-slate-500">Live fleet map -- integration coming soon</p>
            <p className="mt-1 text-xs text-slate-600">{allShipments.filter((s) => s.status === 'in_transit').length} vehicles currently in transit</p>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <Tabs tabs={filterTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Shipment cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-slate-500">
            No shipments found matching your criteria.
          </div>
        ) : (
          filtered.map((s) => (
            <Link
              key={s.id}
              href={`/tracking/${s.id}`}
              className="block rounded-xl border border-slate-800 bg-[#161b22] p-5 transition-colors hover:border-slate-700 hover:bg-[#1c2128]"
            >
              {/* Top row: tracking # + status */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{s.trackingNumber}</span>
                <StatusBadge status={statusBadgeMap[s.status] ?? 'pending'} size="sm" />
              </div>

              {/* Route */}
              <div className="mb-3 flex items-center gap-2 text-xs text-slate-400">
                <span>{s.origin}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span>{s.destination}</span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-medium text-slate-300">{s.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all ${
                      s.status === 'delayed'
                        ? 'bg-orange-500'
                        : s.status === 'delivered'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <div>
                  <span className="text-slate-500">ETA</span>
                  <p className="mt-0.5 font-medium text-slate-300">{s.eta}</p>
                </div>
                <div>
                  <span className="text-slate-500">Equipment</span>
                  <p className="mt-0.5 font-medium text-slate-300">{s.equipment}</p>
                </div>
                <div>
                  <span className="text-slate-500">Carrier</span>
                  <p className="mt-0.5 font-medium text-slate-300">{s.carrier}</p>
                </div>
                <div>
                  <span className="text-slate-500">Driver</span>
                  <p className="mt-0.5 font-medium text-slate-300">{s.driver}</p>
                </div>
              </div>

              {/* Last update */}
              <div className="mt-3 border-t border-slate-800 pt-2 text-[11px] text-slate-500">
                Last update: {s.lastUpdate}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
