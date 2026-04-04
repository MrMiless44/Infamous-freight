'use client';

import { use } from 'react';
import Link from 'next/link';
import StatusBadge from '../../../../_components/StatusBadge';
import { loads, documents } from '../../../../_data/mock-data';

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

function mapStatus(status: string) {
  if (status === 'picked_up') return 'at_pickup';
  if (status === 'posted') return 'pending';
  return status;
}

export default function LoadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const load = loads.find((l) => l.id === id);
  const loadDocs = documents.filter((d) => d.loadId === id);

  if (!load) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-slate-400">Load not found.</p>
        <Link href="/driver/loads" className="mt-4 inline-block text-sm text-blue-400 hover:underline">
          Back to Loads
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-8">
      {/* Back */}
      <Link href="/driver/loads" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 12L6 8l4-4" />
        </svg>
        Back to Loads
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{load.loadNumber}</h1>
          <p className="text-xs text-slate-500">Updated {load.updatedAt}</p>
        </div>
        <StatusBadge status={mapStatus(load.status) as any} />
      </div>

      {/* Route Card */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Route</h2>
        <div className="relative space-y-4 pl-6">
          {/* Origin */}
          <div className="relative">
            <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <p className="text-sm font-medium text-white">
              {load.origin.city}, {load.origin.state} {load.origin.zip}
            </p>
            <p className="text-xs text-slate-500">{load.origin.address}</p>
          </div>
          {/* Connector */}
          <div className="absolute left-[-16px] top-5 h-[calc(100%-24px)] w-px bg-slate-700" />
          {/* Destination */}
          <div className="relative">
            <span className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-400" />
            </span>
            <p className="text-sm font-medium text-white">
              {load.destination.city}, {load.destination.state} {load.destination.zip}
            </p>
            <p className="text-xs text-slate-500">{load.destination.address}</p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Schedule</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Pickup</p>
            <p className="text-sm text-white">{load.pickupDate}</p>
            <p className="text-xs text-slate-400">{load.pickupWindow}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Delivery</p>
            <p className="text-sm text-white">{load.deliveryDate}</p>
            <p className="text-xs text-slate-400">{load.deliveryWindow}</p>
          </div>
        </div>
      </div>

      {/* Load Details */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Load Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Equipment</p>
            <p className="text-white">{equipmentLabels[load.equipmentType] ?? load.equipmentType}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Weight</p>
            <p className="text-white">{load.weight.toLocaleString()} lbs</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Commodity</p>
            <p className="text-white">{load.commodity}</p>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase text-slate-500">Distance</p>
            <p className="text-white">{load.distance} mi</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {load.status === 'assigned' && (
          <Link
            href="/driver/pickup"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Confirm Pickup
          </Link>
        )}
        {load.status === 'picked_up' && (
          <button
            type="button"
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Start Route
          </button>
        )}
        {load.status === 'in_transit' && (
          <Link
            href="/driver/delivery"
            className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            Confirm Delivery
          </Link>
        )}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-[#0d1117] px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          Contact Dispatcher
        </button>
      </div>

      {/* Documents */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Documents</h2>
          <Link href="/driver/documents" className="text-xs text-blue-400 hover:underline">
            Upload
          </Link>
        </div>
        {loadDocs.length === 0 ? (
          <p className="text-xs text-slate-500">No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {loadDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-[#0d1117] p-3"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M4 1h7l4 4v11a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M11 1v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">{doc.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {doc.type.toUpperCase()} &middot; {doc.fileSize}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
