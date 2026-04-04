'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import StatusBadge from '../../../_components/StatusBadge';
import Timeline from '../../../_components/Timeline';
import { shipments, loads } from '../../../_data/mock-data';
import type { LoadStatus } from '../../../_data/mock-data';

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

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Find shipment
  const shipment = shipments.find((s) => s.id === id);
  const load = shipment ? loads.find((l) => l.id === shipment.loadId) : loads.find((l) => l.id === id);

  if (!shipment && !load) {
    return (
      <div className="space-y-6">
        <Link href="/tracking" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back to Tracking
        </Link>
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-[#161b22]">
          <div className="text-center">
            <p className="text-lg font-semibold text-white">Shipment Not Found</p>
            <p className="mt-1 text-sm text-slate-400">The shipment ID &quot;{id}&quot; could not be located.</p>
          </div>
        </div>
      </div>
    );
  }

  // Build unified data
  const trackingNumber = shipment?.trackingNumber ?? `IF-TRK-${load!.id.replace('LD-2024-', '9')}`;
  const status: LoadStatus = shipment?.status ?? load!.status;
  const progress = shipment?.progress ?? (load!.status === 'delivered' ? 100 : load!.status === 'picked_up' ? 25 : load!.status === 'delayed' ? 45 : 50);
  const originCity = shipment ? `${shipment.origin.city}, ${shipment.origin.state}` : `${load!.origin.city}, ${load!.origin.state}`;
  const destCity = shipment ? `${shipment.destination.city}, ${shipment.destination.state}` : `${load!.destination.city}, ${load!.destination.state}`;
  const originAddress = load?.origin.address ?? '';
  const destAddress = load?.destination.address ?? '';
  const eta = shipment?.eta ?? load?.eta ?? load?.deliveryDate ?? 'N/A';
  const carrier = shipment?.carrier ?? load?.carrier?.name ?? 'Unassigned';
  const driver = shipment?.driver ?? load?.driver?.name ?? 'Unassigned';
  const currentLocation = shipment?.currentLocation;
  const lastUpdate = shipment?.lastUpdate ?? load?.updatedAt ?? '';

  const milestones = shipment?.milestones ?? [
    { label: 'Order Created', time: load!.createdAt, completed: true },
    { label: 'Carrier Assigned', time: load!.updatedAt, completed: !!load!.carrier },
    { label: 'Picked Up', time: load!.pickupDate, completed: ['picked_up', 'in_transit', 'delivered'].includes(status) },
    { label: 'In Transit', time: '', completed: ['in_transit', 'delivered'].includes(status) },
    { label: 'Out for Delivery', time: '', completed: status === 'delivered' },
    { label: 'Delivered', time: '', completed: status === 'delivered' },
  ];

  const timelineSteps = milestones.map((m, i) => {
    const nextUncompleted = milestones.findIndex((ms) => !ms.completed);
    return {
      label: m.label,
      time: m.time || undefined,
      completed: m.completed,
      active: i === nextUncompleted,
    };
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link href="/tracking" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
        Back to Tracking
      </Link>

      {/* Title row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-white">{trackingNumber}</h1>
          <StatusBadge status={statusBadgeMap[status] ?? 'pending'} />
        </div>
        <p className="text-sm text-slate-400">Last updated: {lastUpdate}</p>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">Shipment Progress</span>
          <span className="font-semibold text-white">{progress}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className={`h-full rounded-full transition-all ${
              status === 'delayed' ? 'bg-orange-500' : status === 'delivered' ? 'bg-emerald-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Route card */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Route Information</h3>
            <div className="flex items-start gap-4">
              {/* Origin */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                  </span>
                  <span className="text-xs font-medium uppercase text-slate-500">Origin</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{originCity}</p>
                {originAddress && <p className="mt-0.5 text-xs text-slate-400">{originAddress}</p>}
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center pt-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-600">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                {load && (
                  <span className="mt-1 text-[10px] text-slate-600">{load.distance} mi</span>
                )}
              </div>

              {/* Destination */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                  </span>
                  <span className="text-xs font-medium uppercase text-slate-500">Destination</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{destCity}</p>
                {destAddress && <p className="mt-0.5 text-xs text-slate-400">{destAddress}</p>}
              </div>
            </div>
          </div>

          {/* Current location card with map placeholder */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Current Location</h3>
            <div className="mb-3 flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-800/30">
              <div className="text-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-1 text-slate-600" strokeLinecap="round">
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 21s-7-5.5-7-11a7 7 0 1114 0c0 5.5-7 11-7 11z" />
                </svg>
                <p className="text-xs text-slate-500">Map integration coming soon</p>
              </div>
            </div>
            {currentLocation && (
              <p className="text-sm text-slate-300">
                Currently near <span className="font-semibold text-white">{currentLocation.city}, {currentLocation.state}</span>
              </p>
            )}
          </div>

          {/* ETA + Carrier/Driver info */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Shipment Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500">ETA</span>
                <p className="mt-0.5 font-medium text-white">{eta}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Carrier</span>
                <p className="mt-0.5 font-medium text-white">{carrier}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Driver</span>
                <p className="mt-0.5 font-medium text-white">{driver}</p>
              </div>
              {load && (
                <div>
                  <span className="text-xs text-slate-500">Load #</span>
                  <p className="mt-0.5 font-medium text-white">{load.loadNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Timeline */}
          <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <h3 className="mb-4 text-sm font-semibold text-white">Tracking Timeline</h3>
            <Timeline steps={timelineSteps} />
          </div>

          {/* Exceptions panel */}
          {status === 'delayed' && load?.delayReason && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-orange-400">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <h3 className="text-sm font-semibold text-orange-400">Exception / Delay</h3>
              </div>
              <p className="text-sm text-orange-300">{load.delayReason}</p>
              <p className="mt-2 text-xs text-orange-400/70">Updated ETA: {eta}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: shipment details */}
      {load && (
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Cargo Information</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
            <div>
              <span className="text-xs text-slate-500">Weight</span>
              <p className="mt-0.5 font-medium text-white">{load.weight.toLocaleString()} lbs</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Equipment</span>
              <p className="mt-0.5 font-medium text-white">{equipmentLabels[load.equipmentType] ?? load.equipmentType}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Commodity</span>
              <p className="mt-0.5 font-medium text-white">{load.commodity}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Distance</span>
              <p className="mt-0.5 font-medium text-white">{load.distance.toLocaleString()} miles</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Pickup Date</span>
              <p className="mt-0.5 font-medium text-white">{load.pickupDate}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Pickup Window</span>
              <p className="mt-0.5 font-medium text-white">{load.pickupWindow}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Delivery Date</span>
              <p className="mt-0.5 font-medium text-white">{load.deliveryDate}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Delivery Window</span>
              <p className="mt-0.5 font-medium text-white">{load.deliveryWindow}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
