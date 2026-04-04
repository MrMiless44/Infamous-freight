import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Solutions | Infæmous Freight',
  description:
    'See how Infæmous Freight solves unique challenges for shippers, carriers, dispatchers, drivers, and brokers.',
};

const roles = [
  {
    role: 'Shippers',
    tagline: 'Ship with confidence, not complexity',
    desc: 'Get your freight where it needs to go -- on time, every time. Infæmous Freight gives shippers complete visibility, competitive rates, and the reliability of a vetted carrier network.',
    benefits: [
      'Instant quoting and load booking',
      'Real-time shipment tracking with ETA alerts',
      'Self-service customer portal',
      'Automated freight bill auditing',
      'Dedicated account management',
      'Historical analytics and lane optimization',
    ],
    color: 'blue',
  },
  {
    role: 'Carriers',
    tagline: 'More loads, less empty miles',
    desc: 'Access a steady stream of quality freight matched to your lanes, equipment, and preferences. Get paid fast with transparent settlement and build your reputation through performance scoring.',
    benefits: [
      'Smart load matching by lane and equipment',
      'Instant rate confirmation and booking',
      'QuickPay and same-day settlement options',
      'Performance-based preferred status',
      'Digital document submission',
      'Backhaul and continuous-move suggestions',
    ],
    color: 'teal',
  },
  {
    role: 'Dispatchers',
    tagline: 'Dispatch smarter, not harder',
    desc: 'Replace the chaos of phone calls and spreadsheets with a unified dispatch board. Assign loads, track progress, and manage exceptions from a single screen purpose-built for speed.',
    benefits: [
      'Unified dispatch dashboard',
      'One-click carrier assignment',
      'Automated check-call elimination',
      'Exception and delay alerting',
      'Multi-load timeline and Gantt view',
      'Customizable status workflows',
    ],
    color: 'indigo',
  },
  {
    role: 'Drivers',
    tagline: 'Everything you need on the road',
    desc: 'A mobile experience designed for drivers -- capture documents, communicate with dispatch, navigate to stops, and log hours without switching between apps.',
    benefits: [
      'Mobile-first document capture',
      'Turn-by-turn navigation',
      'In-app messaging with dispatch',
      'Electronic proof of delivery',
      'HOS and ELD integration',
      'Trip and earnings summary',
    ],
    color: 'emerald',
  },
  {
    role: 'Brokers',
    tagline: 'Scale your brokerage without the overhead',
    desc: 'Manage more freight with fewer people. Automated workflows handle the repetitive tasks so your team can focus on relationships, strategy, and closing deals.',
    benefits: [
      'End-to-end load lifecycle management',
      'Automated carrier sourcing and tendering',
      'Margin visibility on every transaction',
      'Compliance and audit-ready documentation',
      'CRM integration for shipper relationships',
      'Scalable infrastructure for rapid growth',
    ],
    color: 'purple',
  },
];

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  blue: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-300' },
  teal: { border: 'border-teal-500/30', bg: 'bg-teal-500/10', text: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-300' },
  indigo: { border: 'border-indigo-500/30', bg: 'bg-indigo-500/10', text: 'text-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300' },
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300' },
  purple: { border: 'border-purple-500/30', bg: 'bg-purple-500/10', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-300' },
};

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Solutions</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            One platform,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              every role covered
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Whether you are shipping product, hauling freight, dispatching loads, driving the
            truck, or brokering the deal -- Infæmous Freight is purpose-built for you.
          </p>
        </div>
      </section>

      {/* Role Sections */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">
          {roles.map((r, i) => {
            const c = colorMap[r.color];
            return (
              <div
                key={r.role}
                className={`flex flex-col gap-12 lg:flex-row lg:items-start ${
                  i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-1">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${c.badge}`}>
                    For {r.role}
                  </span>
                  <h2 className="mt-4 text-2xl font-bold sm:text-3xl">{r.tagline}</h2>
                  <p className="mt-4 text-slate-400">{r.desc}</p>
                  <ul className="mt-6 space-y-3">
                    {r.benefits.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className={`mt-0.5 h-4 w-4 shrink-0 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`flex h-64 w-full items-center justify-center rounded-2xl border ${c.border} ${c.bg} lg:w-96`}>
                  <span className={`text-6xl font-black ${c.text} opacity-30`}>{r.role}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Find the right solution for your team</h2>
          <p className="mt-4 text-slate-400">
            Talk to our team about which plan and configuration fits your operation best.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
            >
              Contact Sales
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 text-sm font-semibold text-white transition hover:border-slate-600"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
