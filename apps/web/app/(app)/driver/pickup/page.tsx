'use client';

import { useState } from 'react';
import Link from 'next/link';
import { loads } from '../../../_data/mock-data';

const load = loads.find((l) => l.status === 'assigned') ?? loads[0];

const checklistItems = [
  { id: 'count', label: 'Verified load count and description' },
  { id: 'equipment', label: 'Checked equipment condition' },
  { id: 'secured', label: 'Secured cargo properly' },
  { id: 'bol', label: 'Signed Bill of Lading (BOL)' },
];

export default function PickupConfirmationPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const allChecked = checklistItems.every((item) => checked[item.id]);

  const handleToggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePhotoUpload = () => {
    // Simulate adding a photo
    setPhotos((prev) => [...prev, `pickup-photo-${prev.length + 1}.jpg`]);
  };

  const handleConfirm = () => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Pickup Confirmed</h1>
        <p className="mt-2 text-sm text-slate-400">Load {load.loadNumber} has been picked up successfully.</p>
        <Link
          href="/driver/loads"
          className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
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

      <h1 className="text-xl font-bold text-white">Confirm Pickup</h1>

      {/* Load Info Summary */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <p className="text-xs font-medium text-slate-400">{load.loadNumber}</p>
        <p className="mt-1 text-sm font-medium text-white">
          {load.origin.city}, {load.origin.state}
          <span className="mx-2 text-slate-500">&rarr;</span>
          {load.destination.city}, {load.destination.state}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {load.commodity} &middot; {load.weight.toLocaleString()} lbs
        </p>
      </div>

      {/* Checklist */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Pickup Checklist</h2>
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <label key={item.id} className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                onClick={() => handleToggle(item.id)}
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                  checked[item.id]
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-600 bg-transparent'
                }`}
              >
                {checked[item.id] && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 3L4.5 8.5 2 6" />
                  </svg>
                )}
              </button>
              <span className={`text-sm ${checked[item.id] ? 'text-slate-300' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Photo Upload */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Pickup Photos</h2>
        <button
          type="button"
          onClick={handlePhotoUpload}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-[#0d1117] px-4 py-6 text-sm text-slate-400 transition-colors hover:border-slate-600 hover:text-slate-300"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          Take Photo or Upload
        </button>
        {photos.length > 0 && (
          <div className="mt-3 space-y-2">
            {photos.map((photo) => (
              <div key={photo} className="flex items-center gap-2 rounded-lg bg-[#0d1117] px-3 py-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                  <path d="M13.5 2.5l-7 7-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs text-slate-300">{photo}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-4">
        <h2 className="mb-3 text-sm font-semibold text-white">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any pickup notes..."
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Confirm Button */}
      <button
        type="button"
        disabled={!allChecked}
        onClick={handleConfirm}
        className={`flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
          allChecked
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'cursor-not-allowed bg-slate-700 text-slate-500'
        }`}
      >
        Confirm Pickup
      </button>
      {!allChecked && (
        <p className="text-center text-xs text-slate-500">Complete all checklist items to confirm</p>
      )}
    </div>
  );
}
