'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { loads } from '../../../../_data/mock-data';
import type { Load } from '../../../../_data/mock-data';

const equipmentOptions = [
  { value: '', label: 'Select Equipment Type' },
  { value: 'dry_van', label: 'Dry Van' },
  { value: 'reefer', label: 'Reefer' },
  { value: 'flatbed', label: 'Flatbed' },
  { value: 'step_deck', label: 'Step Deck' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'intermodal', label: 'Intermodal' },
  { value: 'box_truck', label: 'Box Truck' },
  { value: 'ltl', label: 'LTL' },
];

const rateTypeOptions = [
  { value: 'flat', label: 'Flat Rate' },
  { value: 'per_mile', label: 'Per Mile' },
];

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="mb-4 border-b border-slate-800 pb-2 text-lg font-semibold text-white">{title}</h2>
  );
}

function InputField({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="input-field w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="input-field w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80 [&>option]:bg-[#161b22]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input-field w-full rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
      />
    </div>
  );
}

export default function EditLoadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const load = loads.find((l) => l.id === id);

  // Shipment details
  const [commodity, setCommodity] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [weight, setWeight] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Origin
  const [originAddress, setOriginAddress] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [originZip, setOriginZip] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupWindow, setPickupWindow] = useState('');

  // Destination
  const [destAddress, setDestAddress] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');
  const [destZip, setDestZip] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');

  // Shipper info
  const [customerName, setCustomerName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Pricing
  const [rate, setRate] = useState('');
  const [rateType, setRateType] = useState('flat');
  const [distance, setDistance] = useState('');

  // Pre-fill form with existing load data
  useEffect(() => {
    if (load) {
      setCommodity(load.commodity);
      setEquipmentType(load.equipmentType);
      setWeight(String(load.weight));
      setSpecialInstructions(load.notes || '');
      setOriginAddress(load.origin.address);
      setOriginCity(load.origin.city);
      setOriginState(load.origin.state);
      setOriginZip(load.origin.zip);
      setPickupDate(load.pickupDate);
      setPickupWindow(load.pickupWindow);
      setDestAddress(load.destination.address);
      setDestCity(load.destination.city);
      setDestState(load.destination.state);
      setDestZip(load.destination.zip);
      setDeliveryDate(load.deliveryDate);
      setDeliveryWindow(load.deliveryWindow);
      setCustomerName(load.shipper.name);
      setContactName(load.shipper.contact);
      setRate(String(load.rate));
      setDistance(String(load.distance));
    }
  }, [load]);

  if (!load) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold text-white">Load Not Found</h1>
        <p className="mt-2 text-sm text-slate-400">The load &quot;{id}&quot; does not exist.</p>
        <Link href="/loads" className="mt-4 text-sm font-medium text-blue-400 hover:text-blue-300">
          Back to Loads
        </Link>
      </div>
    );
  }

  const handleSubmit = () => {
    alert('Load updated successfully');
    router.push(`/loads/${id}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back / header */}
      <div>
        <Link
          href={`/loads/${id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-200"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to {load.loadNumber}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white">Edit Load {load.loadNumber}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-8"
      >
        {/* Shipment Details */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
          <SectionHeading title="Shipment Details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Commodity" id="commodity" value={commodity} onChange={setCommodity} placeholder="e.g. Steel Coils" required />
            <SelectField label="Equipment Type" id="equipmentType" value={equipmentType} onChange={setEquipmentType} options={equipmentOptions} required />
            <InputField label="Weight (lbs)" id="weight" type="number" value={weight} onChange={setWeight} placeholder="e.g. 42000" required />
            <div className="sm:col-span-2">
              <TextAreaField label="Special Instructions" id="specialInstructions" value={specialInstructions} onChange={setSpecialInstructions} placeholder="Any special handling requirements..." />
            </div>
          </div>
        </div>

        {/* Origin */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
          <SectionHeading title="Origin" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InputField label="Address" id="originAddress" value={originAddress} onChange={setOriginAddress} placeholder="Street address" required />
            </div>
            <InputField label="City" id="originCity" value={originCity} onChange={setOriginCity} placeholder="City" required />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="State" id="originState" value={originState} onChange={setOriginState} placeholder="ST" required />
              <InputField label="ZIP" id="originZip" value={originZip} onChange={setOriginZip} placeholder="ZIP Code" required />
            </div>
            <InputField label="Pickup Date" id="pickupDate" type="date" value={pickupDate} onChange={setPickupDate} required />
            <InputField label="Pickup Window" id="pickupWindow" value={pickupWindow} onChange={setPickupWindow} placeholder="e.g. 08:00 - 12:00" />
          </div>
        </div>

        {/* Destination */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
          <SectionHeading title="Destination" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <InputField label="Address" id="destAddress" value={destAddress} onChange={setDestAddress} placeholder="Street address" required />
            </div>
            <InputField label="City" id="destCity" value={destCity} onChange={setDestCity} placeholder="City" required />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="State" id="destState" value={destState} onChange={setDestState} placeholder="ST" required />
              <InputField label="ZIP" id="destZip" value={destZip} onChange={setDestZip} placeholder="ZIP Code" required />
            </div>
            <InputField label="Delivery Date" id="deliveryDate" type="date" value={deliveryDate} onChange={setDeliveryDate} required />
            <InputField label="Delivery Window" id="deliveryWindow" value={deliveryWindow} onChange={setDeliveryWindow} placeholder="e.g. 08:00 - 16:00" />
          </div>
        </div>

        {/* Shipper Info */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
          <SectionHeading title="Shipper Information" />
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField label="Customer Name" id="customerName" value={customerName} onChange={setCustomerName} placeholder="Company name" required />
            <InputField label="Contact Name" id="contactName" value={contactName} onChange={setContactName} placeholder="Full name" required />
            <InputField label="Phone" id="phone" type="tel" value={phone} onChange={setPhone} placeholder="(555) 555-0100" />
            <InputField label="Email" id="email" type="email" value={email} onChange={setEmail} placeholder="contact@company.com" />
          </div>
        </div>

        {/* Pricing */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-6">
          <SectionHeading title="Pricing" />
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label="Rate ($)" id="rate" type="number" value={rate} onChange={setRate} placeholder="e.g. 4850" required />
            <SelectField label="Rate Type" id="rateType" value={rateType} onChange={setRateType} options={rateTypeOptions} />
            <InputField label="Distance (miles)" id="distance" type="number" value={distance} onChange={setDistance} placeholder="e.g. 1092" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-800 pt-6 sm:flex-row sm:justify-end">
          <Link
            href={`/loads/${id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/60 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
