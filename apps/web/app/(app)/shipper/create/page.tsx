'use client';

import { useState } from 'react';

const equipmentTypes = [
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'intermodal', label: 'Intermodal' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'ltl', label: 'LTL' },
];

function InputField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-400">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
      />
    </div>
  );
}

export default function ShipperCreatePage() {
  const [form, setForm] = useState({
    pickupAddress: '',
    pickupCity: '',
    pickupState: '',
    pickupZip: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryZip: '',
    pickupDate: '',
    pickupWindow: '',
    deliveryDate: '',
    deliveryWindow: '',
    commodity: '',
    weight: '',
    equipmentType: 'dry_van',
    specialInstructions: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Shipment Request</h1>
        <p className="text-sm text-slate-400">Fill out the details to request a quote or book now</p>
      </div>

      <div className="space-y-6 rounded-xl border border-slate-800 bg-[#161b22] p-6">
        {/* Pickup Location */}
        <div>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400">1</span>
            Pickup Location
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <InputField label="Address" placeholder="Street address" value={form.pickupAddress} onChange={(v) => update('pickupAddress', v)} />
            </div>
            <InputField label="City" placeholder="City" value={form.pickupCity} onChange={(v) => update('pickupCity', v)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="State" placeholder="ST" value={form.pickupState} onChange={(v) => update('pickupState', v)} />
              <InputField label="ZIP" placeholder="00000" value={form.pickupZip} onChange={(v) => update('pickupZip', v)} />
            </div>
          </div>
        </div>

        {/* Delivery Location */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-xs font-bold text-emerald-400">2</span>
            Delivery Location
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <InputField label="Address" placeholder="Street address" value={form.deliveryAddress} onChange={(v) => update('deliveryAddress', v)} />
            </div>
            <InputField label="City" placeholder="City" value={form.deliveryCity} onChange={(v) => update('deliveryCity', v)} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="State" placeholder="ST" value={form.deliveryState} onChange={(v) => update('deliveryState', v)} />
              <InputField label="ZIP" placeholder="00000" value={form.deliveryZip} onChange={(v) => update('deliveryZip', v)} />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/20 text-xs font-bold text-indigo-400">3</span>
            Schedule
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InputField label="Pickup Date" type="date" value={form.pickupDate} onChange={(v) => update('pickupDate', v)} />
            <InputField label="Pickup Window" placeholder="e.g. 08:00 - 12:00" value={form.pickupWindow} onChange={(v) => update('pickupWindow', v)} />
            <InputField label="Delivery Date" type="date" value={form.deliveryDate} onChange={(v) => update('deliveryDate', v)} />
            <InputField label="Delivery Window" placeholder="e.g. 08:00 - 16:00" value={form.deliveryWindow} onChange={(v) => update('deliveryWindow', v)} />
          </div>
        </div>

        {/* Cargo Details */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">4</span>
            Cargo Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <InputField label="Commodity" placeholder="e.g. Steel Coils" value={form.commodity} onChange={(v) => update('commodity', v)} />
            <InputField label="Weight (lbs)" placeholder="e.g. 42000" type="number" value={form.weight} onChange={(v) => update('weight', v)} />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Equipment Type</label>
              <select
                value={form.equipmentType}
                onChange={(e) => update('equipmentType', e.target.value)}
                className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 outline-none transition-colors focus:border-blue-500/50 [&>option]:bg-[#161b22]"
              >
                {equipmentTypes.map((eq) => (
                  <option key={eq.value} value={eq.value}>{eq.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="border-t border-slate-800 pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600/20 text-xs font-bold text-orange-400">5</span>
            Special Instructions
          </h3>
          <textarea
            placeholder="Any special handling instructions, access codes, or notes..."
            value={form.specialInstructions}
            onChange={(e) => update('specialInstructions', e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg border border-slate-700 bg-[#0d1117] px-6 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Request Quote
          </button>
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
