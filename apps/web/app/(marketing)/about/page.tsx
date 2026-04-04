import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About | Infæmous Freight',
  description:
    'Learn about the team and mission behind Infæmous Freight -- the intelligent freight operating system built for modern logistics.',
};

/* ------------------------------------------------------------------ */
/*  Hero                                                              */
/* ------------------------------------------------------------------ */
function AboutHero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">About Us</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          We are building the operating system for{' '}
          <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            modern freight
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-400">
          Infæmous Freight was founded on a simple observation: the freight industry runs on phone
          calls, spreadsheets, and gut instinct. We believe it deserves better.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Our Story                                                         */
/* ------------------------------------------------------------------ */
function OurStory() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Our Story</h2>
            <div className="mt-6 space-y-4 text-slate-400">
              <p>
                In 2021, our founding team -- veterans of both freight brokerage and enterprise
                software -- watched as supply chain disruptions exposed just how fragile the
                industry&apos;s technology stack really was.
              </p>
              <p>
                Dispatchers were toggling between a dozen tabs. Carriers had no visibility into
                upcoming opportunities. Shippers waited days for updates that should have been
                instant. We knew there had to be a better way.
              </p>
              <p>
                So we built Infæmous Freight: a single, unified platform that brings every
                stakeholder in the freight lifecycle onto one intelligent system. From load creation
                to final settlement, every step is connected, automated, and transparent.
              </p>
              <p>
                Today, we serve hundreds of logistics companies across North America, managing
                billions of dollars in freight annually. And we are just getting started.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-3xl font-extrabold text-blue-400">2021</p>
              <p className="mt-1 text-sm text-slate-400">Founded</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-3xl font-extrabold text-blue-400">120+</p>
              <p className="mt-1 text-sm text-slate-400">Team Members</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-3xl font-extrabold text-blue-400">$2.4B</p>
              <p className="mt-1 text-sm text-slate-400">Freight Managed</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <p className="text-3xl font-extrabold text-blue-400">850+</p>
              <p className="mt-1 text-sm text-slate-400">Carrier Partners</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Mission                                                           */
/* ------------------------------------------------------------------ */
function Mission() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold">Our Mission</h2>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-300">
          To eliminate friction from every freight transaction so that goods move faster, carriers
          earn more, and shippers gain complete confidence in their supply chains.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Values                                                            */
/* ------------------------------------------------------------------ */
const values = [
  {
    title: 'Relentless Transparency',
    desc: 'We believe every stakeholder deserves real-time truth -- about load status, pricing, and performance.',
  },
  {
    title: 'Carrier-Centric Design',
    desc: 'Carriers are the backbone of freight. We build tools that respect their time, maximize their earnings, and simplify their work.',
  },
  {
    title: 'Automation Over Busywork',
    desc: 'If a process can be automated without losing quality, we automate it. People should focus on decisions, not data entry.',
  },
  {
    title: 'Security as a Foundation',
    desc: 'Financial data, compliance records, and shipment details demand enterprise-grade protection. Security is never an afterthought.',
  },
  {
    title: 'Continuous Improvement',
    desc: 'Logistics never stands still and neither do we. Weekly releases, constant feedback loops, and measurable outcomes drive everything we build.',
  },
  {
    title: 'Community First',
    desc: 'We win when the industry wins. We share knowledge, support open standards, and partner transparently with every customer.',
  },
];

function Values() {
  return (
    <section className="border-y border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold">Our Values</h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <h3 className="text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Leadership                                                        */
/* ------------------------------------------------------------------ */
const team = [
  { name: 'Daniel Okoye', role: 'Co-Founder & CEO', bio: 'Former VP of Product at a top-10 freight brokerage. 15+ years in logistics technology.' },
  { name: 'Maria Santos', role: 'Co-Founder & CTO', bio: 'Previously staff engineer at a Fortune 500 supply-chain platform. Distributed systems expert.' },
  { name: 'Kevin Park', role: 'VP of Engineering', bio: 'Built the real-time tracking infrastructure used by three major carriers. Loves hard problems.' },
  { name: 'Aisha Johnson', role: 'VP of Sales', bio: '12 years selling into freight and 3PL. Passionate about helping brokers modernize.' },
  { name: 'Thomas Reeves', role: 'Head of Product', bio: 'Former dispatcher turned product leader. Builds tools he wishes he had on the operations floor.' },
  { name: 'Lin Wei', role: 'Head of Data Science', bio: 'PhD in Operations Research. Leads the AI models behind carrier matching and rate prediction.' },
];

function Leadership() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold">Leadership Team</h2>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((t) => (
            <div key={t.name} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-teal-500/20 text-xl font-bold text-blue-400">
                {t.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="text-sm text-blue-400">{t.role}</p>
              <p className="mt-2 text-sm text-slate-400">{t.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OurStory />
      <Mission />
      <Values />
      <Leadership />
    </>
  );
}
