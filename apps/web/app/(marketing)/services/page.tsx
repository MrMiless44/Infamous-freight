import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Services | Infæmous Freight',
  description:
    'Explore the full suite of freight management services offered by Infæmous Freight -- from load management to analytics.',
};

const services = [
  {
    title: 'Load Management',
    tagline: 'Full lifecycle load orchestration',
    desc: 'Create, edit, assign, and track loads from a single dashboard. Support for FTL, LTL, flatbed, reefer, and specialized freight types. Import loads via EDI, API, or CSV -- or enter them manually with guided forms.',
    features: [
      'Multi-stop and multi-commodity support',
      'Rate negotiation and confirmation workflows',
      'Automated reference number generation',
      'Load templates for recurring lanes',
      'Bulk upload and TMS integration',
    ],
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    title: 'Real-Time Tracking',
    tagline: 'Know where every load is, every second',
    desc: 'GPS-powered tracking with automatic status updates from pickup to delivery. Live map view, geofence alerts, ETA predictions, and exception notifications keep everyone informed without a single phone call.',
    features: [
      'Live map with multi-load view',
      'Automatic check-call elimination',
      'ETA prediction with machine learning',
      'Geofence-triggered status updates',
      'Customer-facing tracking portal',
    ],
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Dispatch Automation',
    tagline: 'Smart matching, instant assignments',
    desc: 'Our matching engine analyzes carrier proximity, equipment type, lane history, compliance status, and rate preferences to recommend the best carrier for every load. Accept recommendations or override manually.',
    features: [
      'AI-powered carrier recommendations',
      'One-click dispatch confirmation',
      'Carrier availability calendar',
      'Automated tender and counter-offer flows',
      'Fallback carrier waterfall logic',
    ],
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Carrier Management',
    tagline: 'Onboard, vet, and manage with confidence',
    desc: 'Streamline carrier onboarding with digital applications, automated insurance verification, FMCSA authority checks, and continuous compliance monitoring. Score carriers on performance to build a reliable network.',
    features: [
      'Digital onboarding portal',
      'Real-time insurance and authority monitoring',
      'Performance scorecards and ratings',
      'Preferred carrier lists and lane awards',
      'Automated re-verification workflows',
    ],
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: 'Driver Workflows',
    tagline: 'Mobile-first tools for the road',
    desc: 'Give drivers a purpose-built mobile experience for BOL capture, proof of delivery photos, electronic signatures, hours-of-service logging, and real-time chat with dispatch. No training required.',
    features: [
      'Photo-based document capture',
      'Electronic proof of delivery',
      'In-app messaging with dispatch',
      'Turn-by-turn navigation integration',
      'HOS and ELD compliance support',
    ],
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    title: 'Analytics & Reporting',
    tagline: 'Turn data into decisions',
    desc: 'Real-time dashboards, custom reports, and automated insights help you understand lane performance, carrier reliability, revenue trends, and operational bottlenecks at a glance.',
    features: [
      'Executive KPI dashboards',
      'Lane and carrier profitability analysis',
      'On-time performance tracking',
      'Custom report builder',
      'Scheduled report delivery via email',
    ],
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    title: 'Settlement & Billing',
    tagline: 'Get paid faster, pay carriers on time',
    desc: 'Automated invoice generation, payment processing, and settlement workflows eliminate manual accounting. Support for factoring integrations, QuickPay programs, and detailed financial reporting.',
    features: [
      'Automated invoice creation from POD',
      'Carrier settlement with configurable terms',
      'QuickPay and factoring integration',
      'Revenue and margin tracking',
      'Accounts receivable aging dashboards',
    ],
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Document Management',
    tagline: 'Paperless freight, fully compliant',
    desc: 'Centralized, searchable storage for every document in the freight lifecycle -- BOLs, rate confirmations, PODs, insurance certificates, and contracts. OCR-powered indexing and automated retention policies.',
    features: [
      'OCR-powered document indexing',
      'Automated document matching to loads',
      'Configurable retention policies',
      'Audit-ready compliance archives',
      'Bulk export and API access',
    ],
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-teal-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Services</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            A complete toolkit for{' '}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              freight excellence
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Every capability you need to manage loads, carriers, drivers, and finances -- in a
            single platform.
          </p>
        </div>
      </section>

      {/* Service Cards */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {services.map((s, i) => (
              <div
                key={s.title}
                className={`flex flex-col gap-12 lg:flex-row lg:items-center ${
                  i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Icon card */}
                <div className="flex shrink-0 items-center justify-center lg:w-80">
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/50">
                    <svg
                      className="h-16 w-16 text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-sm font-semibold text-teal-400">{s.tagline}</p>
                  <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{s.title}</h2>
                  <p className="mt-4 text-slate-400">{s.desc}</p>
                  <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to see it in action?</h2>
          <p className="mt-4 text-slate-400">
            Schedule a personalized demo and discover how Infæmous Freight can transform your
            operations.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
            >
              Request a Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 text-sm font-semibold text-white transition hover:border-slate-600"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
