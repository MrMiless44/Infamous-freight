import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers | Infæmous Freight',
  description:
    'Join the team building the future of freight. Explore open positions at Infæmous Freight.',
};

const benefits = [
  { title: 'Competitive Compensation', desc: 'Top-of-market salary, equity, and performance bonuses.' },
  { title: 'Remote-First Culture', desc: 'Work from anywhere in the US or Canada with optional co-working stipends.' },
  { title: 'Health & Wellness', desc: 'Comprehensive medical, dental, and vision coverage plus mental health support.' },
  { title: 'Unlimited PTO', desc: 'Take the time you need. We trust you to manage your schedule.' },
  { title: 'Learning Budget', desc: '$2,000 annual stipend for conferences, courses, and books.' },
  { title: '401(k) Match', desc: 'We match 4% of your contributions from day one.' },
];

const positions = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Product Designer', team: 'Design', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Backend Engineer -- Tracking Systems', team: 'Engineering', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Technical Account Manager', team: 'Customer Success', location: 'Chicago, IL', type: 'Full-time' },
  { title: 'Data Scientist -- Route Optimization', team: 'Data Science', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Enterprise Sales Executive', team: 'Sales', location: 'Dallas, TX / Remote', type: 'Full-time' },
  { title: 'DevOps / SRE Engineer', team: 'Infrastructure', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Content Marketing Manager', team: 'Marketing', location: 'Remote (US)', type: 'Full-time' },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-teal-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Careers</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Help us move the world&apos;s freight{' '}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              into the future
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            We are a team of engineers, designers, and logistics experts on a mission to modernize
            a $900 billion industry. Come build with us.
          </p>
        </div>
      </section>

      {/* Culture */}
      <section className="border-y border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold">Our Culture</h2>
              <div className="mt-6 space-y-4 text-slate-400">
                <p>
                  We believe great products come from teams that are empowered, curious, and
                  genuinely invested in the problems they solve. At Infæmous Freight, every team
                  member has a voice in shaping the product and the company.
                </p>
                <p>
                  We are remote-first but deeply connected -- through weekly all-hands, quarterly
                  off-sites, and a culture of asynchronous communication that respects everyone&apos;s
                  time and timezone.
                </p>
                <p>
                  We move fast, ship often, and measure everything. But we also know that
                  sustainable pace beats burnout every time.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {benefits.map((b) => (
                <div key={b.title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <h3 className="text-sm font-semibold">{b.title}</h3>
                  <p className="mt-1 text-xs text-slate-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Open Positions</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-slate-400">
            Don&apos;t see a perfect fit? Send us your resume at{' '}
            <a href="mailto:careers@infaemousfreight.com" className="text-blue-400 hover:underline">
              careers@infaemousfreight.com
            </a>
          </p>

          <div className="mt-12 space-y-3">
            {positions.map((p) => (
              <div
                key={p.title}
                className="group flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold group-hover:text-blue-400 transition">{p.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {p.team} &middot; {p.location} &middot; {p.type}
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex h-10 shrink-0 items-center rounded-lg border border-slate-700 bg-slate-800/50 px-5 text-sm font-semibold text-white transition hover:border-slate-600"
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to make an impact?</h2>
          <p className="mt-4 text-slate-400">
            Join a team that is redefining how freight moves across North America.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
