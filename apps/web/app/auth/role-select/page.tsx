'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: 'admin',
    title: 'Admin',
    description: 'Full platform access. Manage users, settings, billing, and all operations.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 9h6M9 12h6M9 15h3" />
      </svg>
    ),
  },
  {
    id: 'dispatcher',
    title: 'Dispatcher',
    description: 'Assign loads, manage routes, and coordinate between drivers and shippers.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12l5 5L18 7" />
        <path d="M12 3v4M12 17v4" />
      </svg>
    ),
  },
  {
    id: 'driver',
    title: 'Driver',
    description: 'View assigned loads, update delivery status, and manage your schedule.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    id: 'shipper',
    title: 'Shipper',
    description: 'Create shipments, track deliveries, and manage freight orders.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 9v12" />
      </svg>
    ),
  },
  {
    id: 'carrier',
    title: 'Carrier',
    description: 'Manage your fleet, accept load offers, and track driver performance.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="6" width="15" height="10" rx="1" />
        <path d="M16 10h4l3 4v3h-7" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="19" cy="17" r="2" />
      </svg>
    ),
  },
];

export default function RoleSelectPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onContinue = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b0e14] via-[#0d1117] to-[#101820] px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M2 9l7-7 7 7-7 7-7-7z" fill="white" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            Inf<span className="text-blue-400">ae</span>mous
            <span className="ml-1.5 font-medium text-slate-500">Freight</span>
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#161b22] p-8 shadow-2xl">
          <h2 className="mb-1 text-center text-2xl font-bold text-white">Select Your Role</h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            Choose the role that best describes how you will use the platform.
          </p>

          {/* Role Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            {roleOptions.map((role) => {
              const isSelected = selected === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelected(role.id)}
                  className={`flex items-start gap-4 rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/25'
                      : 'border-slate-700 bg-[#0d1117] hover:border-slate-600 hover:bg-slate-800/40'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${
                      isSelected ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-sm font-semibold ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                      {role.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{role.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Continue */}
          <button
            type="button"
            onClick={onContinue}
            disabled={!selected || loading}
            className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Setting up...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
