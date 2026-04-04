import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Infæmous Freight | The Intelligent Freight Operating System',
  description:
    'Move freight smarter, deliver faster, and scale fearlessly with the intelligent freight operating system built for modern logistics companies.',
};

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */
function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
      {/* animated gradient bg */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[128px]" />
        <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-teal-500/15 blur-[128px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-600/10 blur-[128px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Now serving 850+ carriers nationwide
        </div>

        <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl">
          Move Freight Smarter.{' '}
          <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Deliver Faster.
          </span>{' '}
          Scale Fearlessly.
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
          The intelligent freight operating system that connects shippers, carriers, and
          dispatchers on a single platform -- giving you real-time visibility, automated
          workflows, and the confidence to grow.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
          >
            Request a Demo
          </Link>
          <Link
            href="/solutions"
            className="inline-flex h-12 items-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 text-sm font-semibold text-white transition hover:border-slate-600 hover:bg-slate-800"
          >
            Track a Shipment
          </Link>
          <Link
            href="/register"
            className="inline-flex h-12 items-center rounded-lg px-8 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
          >
            Get Started Free &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Key Metrics                                                       */
/* ------------------------------------------------------------------ */
const metrics = [
  { value: '12,000+', label: 'Loads Managed' },
  { value: '850+', label: 'Active Carriers' },
  { value: '99.2%', label: 'On-Time Rate' },
  { value: '$2.4B', label: 'Freight Moved' },
];

function KeyMetrics() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        {metrics.map((m) => (
          <div key={m.label} className="text-center">
            <p className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {m.value}
            </p>
            <p className="mt-1 text-sm text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Services Overview                                                 */
/* ------------------------------------------------------------------ */
const services = [
  {
    title: 'Load Management',
    desc: 'Create, assign, and track loads from origin to destination with full lifecycle visibility.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    title: 'Real-Time Tracking',
    desc: 'GPS-powered tracking with live ETA updates, geofence alerts, and automated status notifications.',
    icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    title: 'Dispatch Automation',
    desc: 'Smart matching algorithms pair loads with the best available carriers based on proximity, capacity, and history.',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    title: 'Carrier Management',
    desc: 'Onboard, vet, and manage your carrier network with compliance tracking and performance scoring.',
    icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10 M17 16V8a1 1 0 00-1-1h-2l-3 3v6',
  },
  {
    title: 'Driver Workflows',
    desc: 'Mobile-first tools for drivers -- BOL capture, proof of delivery, hours tracking, and instant communication.',
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
  },
  {
    title: 'Analytics & Reporting',
    desc: 'Dashboards and reports that turn operational data into actionable insights for smarter decision-making.',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
];

function ServicesOverview() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Everything you need to move freight</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Six core capabilities that power the entire freight lifecycle -- from booking to
            final delivery.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-8 transition hover:border-slate-700 hover:bg-slate-900"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-500/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                      */
/* ------------------------------------------------------------------ */
const steps = [
  { num: '01', title: 'Post Your Load', desc: 'Enter load details or import from your TMS. Our system validates and enriches every entry.' },
  { num: '02', title: 'Match & Assign', desc: 'Smart algorithms find the best carrier match based on lane history, capacity, rate, and compliance.' },
  { num: '03', title: 'Track in Real-Time', desc: 'Monitor every shipment on a live map with automatic status updates, ETAs, and exception alerts.' },
  { num: '04', title: 'Deliver & Settle', desc: 'Capture proof of delivery, auto-generate invoices, and settle payments -- all in one workflow.' },
];

function HowItWorks() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">How it works</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            From load creation to final delivery in four streamlined steps.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.num} className="relative">
              <span className="text-5xl font-black text-slate-800">{step.num}</span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Platform Modules                                                  */
/* ------------------------------------------------------------------ */
const modules = [
  { name: 'Load Board', desc: 'Centralized marketplace for available loads' },
  { name: 'Rate Engine', desc: 'Dynamic pricing based on market conditions' },
  { name: 'Document Vault', desc: 'Secure storage for BOLs, PODs, and contracts' },
  { name: 'Compliance Hub', desc: 'Insurance, authority, and safety monitoring' },
  { name: 'Fleet Manager', desc: 'Vehicle maintenance, inspections, and scheduling' },
  { name: 'Settlement Center', desc: 'Automated invoicing and payment processing' },
  { name: 'Route Optimizer', desc: 'AI-powered routing for fuel and time savings' },
  { name: 'Customer Portal', desc: 'Self-service tracking and reporting for shippers' },
];

function PlatformModules() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Platform modules</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            A modular architecture so you can start with what you need and expand as you grow.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((m) => (
            <div
              key={m.name}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-blue-500/30 hover:bg-slate-900/80"
            >
              <h3 className="font-semibold text-white">{m.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Why Choose                                                        */
/* ------------------------------------------------------------------ */
const reasons = [
  {
    title: 'Built for Freight, Not Adapted',
    desc: 'Unlike generic logistics tools, every feature was designed from the ground up for the unique demands of freight brokerage and trucking operations.',
  },
  {
    title: 'Real-Time Visibility',
    desc: 'Know where every load is at every moment. Our tracking infrastructure delivers sub-minute updates with carrier-grade reliability.',
  },
  {
    title: 'Scales With You',
    desc: 'From 50 loads a month to 50,000 -- the platform grows with your business without requiring migration or re-implementation.',
  },
  {
    title: 'Security & Compliance First',
    desc: 'SOC 2 Type II certified, FMCSA-integrated, and built with enterprise-grade security so your data and operations are always protected.',
  },
];

function WhyChoose() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Why choose Infæmous Freight?</h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-400">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                      */
/* ------------------------------------------------------------------ */
const testimonials = [
  {
    quote: 'Infæmous Freight cut our load-matching time by 60%. We went from spending hours on the phone to having carriers confirmed in minutes.',
    name: 'Sarah Mitchell',
    role: 'VP of Operations, Summit Logistics',
  },
  {
    quote: 'The real-time tracking alone justified the switch. Our customer complaints about shipment visibility dropped to nearly zero.',
    name: 'Marcus Rivera',
    role: 'Dispatch Manager, CrossCountry Carriers',
  },
  {
    quote: 'We scaled from 200 to 2,000 loads per month without adding headcount. The automation in this platform is a game-changer.',
    name: 'James Chen',
    role: 'CEO, Pacific Freight Solutions',
  },
];

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Trusted by freight professionals</h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8"
            >
              <p className="text-sm leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 border-t border-slate-800 pt-4">
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-slate-400">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Industry Coverage                                                 */
/* ------------------------------------------------------------------ */
const industries = [
  'Dry Van', 'Flatbed', 'Refrigerated', 'LTL', 'Intermodal',
  'Hazmat', 'Oversize / Heavy Haul', 'Last-Mile Delivery',
];

function IndustryCoverage() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Serving every mode, every lane</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Whatever you haul and wherever it goes, the platform adapts to your freight type and
            service requirements.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {industries.map((ind) => (
            <span
              key={ind}
              className="rounded-full border border-slate-700 bg-slate-800/50 px-5 py-2 text-sm text-slate-300"
            >
              {ind}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                         */
/* ------------------------------------------------------------------ */
function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-teal-500 p-12 text-center sm:p-16">
          <div className="pointer-events-none absolute inset-0 -z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnYyaDR2MmgtdnptMC0xNmg0djJoLTR2LTJ6bS0xNiAxNmg0djJoLTR2LTJ6bTE2IDBWMThoMnYxNmgtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          <h2 className="relative text-3xl font-extrabold text-white sm:text-4xl">
            Ready to modernize your freight operations?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-blue-100">
            Join hundreds of logistics companies that are moving more freight with less effort.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-lg bg-white px-8 text-sm font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
            >
              Start Free Trial
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg border border-white/30 px-8 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  return (
    <>
      <Hero />
      <KeyMetrics />
      <ServicesOverview />
      <HowItWorks />
      <PlatformModules />
      <WhyChoose />
      <Testimonials />
      <IndustryCoverage />
      <FinalCTA />
    </>
  );
}
