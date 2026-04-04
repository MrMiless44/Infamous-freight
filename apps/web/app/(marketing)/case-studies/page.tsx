import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Case Studies | Infæmous Freight',
  description:
    'See how logistics companies use Infæmous Freight to reduce costs, increase efficiency, and scale their operations.',
};

const caseStudies = [
  {
    company: 'Summit Logistics',
    industry: 'Freight Brokerage',
    logo: 'SL',
    headline: 'Cut load-matching time by 60% and doubled monthly volume',
    challenge:
      'Summit Logistics was a mid-size brokerage handling 1,200 loads per month with a team of 8 dispatchers. Carrier matching was entirely manual -- dispatchers spent an average of 22 minutes per load making calls and checking availability. Growth was capped by headcount.',
    solution:
      'Summit deployed Infæmous Freight\'s AI-powered carrier matching and automated tendering workflows. Dispatchers shifted from phone-based sourcing to a one-click assignment model with intelligent fallback logic.',
    results: [
      { metric: '60%', label: 'Reduction in load-matching time' },
      { metric: '2x', label: 'Monthly load volume (1,200 to 2,400)' },
      { metric: '0', label: 'Additional dispatchers hired' },
      { metric: '34%', label: 'Improvement in carrier acceptance rate' },
    ],
    quote: 'Infæmous Freight didn\'t just save us time -- it fundamentally changed how we operate. Our dispatchers are now strategists, not phone jockeys.',
    quotee: 'Sarah Mitchell, VP of Operations',
    color: 'blue',
  },
  {
    company: 'CrossCountry Carriers',
    industry: 'Asset-Based Carrier',
    logo: 'CC',
    headline: 'Achieved 99.4% on-time delivery with real-time tracking',
    challenge:
      'CrossCountry Carriers ran a fleet of 150 trucks across the Midwest and Southeast. Their biggest pain point: customer complaints about shipment visibility. Check calls were consuming 30% of dispatch time, and late deliveries were averaging 8% per month.',
    solution:
      'CrossCountry implemented Infæmous Freight\'s real-time tracking with ELD integration and customer-facing tracking portal. Automated geofence alerts replaced manual check calls, and ML-powered ETA predictions gave customers confidence.',
    results: [
      { metric: '99.4%', label: 'On-time delivery rate (up from 92%)' },
      { metric: '85%', label: 'Reduction in inbound customer calls' },
      { metric: '30%', label: 'Dispatch time recovered from check calls' },
      { metric: '$420K', label: 'Annual savings from reduced detention' },
    ],
    quote: 'The visibility alone justified the switch. Our customer complaints about shipment status dropped to nearly zero within the first month.',
    quotee: 'Marcus Rivera, Dispatch Manager',
    color: 'teal',
  },
  {
    company: 'Pacific Freight Solutions',
    industry: '3PL / Freight Brokerage',
    logo: 'PF',
    headline: 'Scaled from 200 to 2,000 loads/month without adding headcount',
    challenge:
      'Pacific Freight Solutions was a fast-growing 3PL that had outgrown their cobbled-together stack of spreadsheets, email, and a legacy TMS. Every new customer meant more manual work, and their technology couldn\'t keep up with their sales team.',
    solution:
      'Pacific migrated their entire operation to Infæmous Freight -- from load management and carrier onboarding to settlement and analytics. The API integration connected their existing CRM, and the platform\'s automation handled the operational complexity that used to require manual effort.',
    results: [
      { metric: '10x', label: 'Load volume growth in 18 months' },
      { metric: '45%', label: 'Improvement in gross margin' },
      { metric: '3 days', label: 'Average carrier settlement time (was 14)' },
      { metric: '12', label: 'Systems replaced by one platform' },
    ],
    quote: 'We went from duct-taping systems together to running a modern, scalable operation. Infæmous Freight is the backbone of everything we do now.',
    quotee: 'James Chen, CEO',
    color: 'indigo',
  },
  {
    company: 'Heartland Express Co.',
    industry: 'Regional Carrier',
    logo: 'HE',
    headline: 'Reduced empty miles by 22% with smart backhaul matching',
    challenge:
      'Heartland Express operated 80 trucks focused on refrigerated freight in the central US. Empty miles were their biggest margin killer -- trucks were deadheading an average of 18% of total miles driven, eating into profitability on every lane.',
    solution:
      'Heartland used Infæmous Freight\'s backhaul and continuous-move suggestions, combined with the load board\'s smart matching. The system analyzed their fleet positions and upcoming availability to proactively surface profitable return loads.',
    results: [
      { metric: '22%', label: 'Reduction in empty miles' },
      { metric: '$680K', label: 'Annual fuel cost savings' },
      { metric: '15%', label: 'Increase in revenue per truck per week' },
      { metric: '94%', label: 'Driver satisfaction score (up from 71%)' },
    ],
    quote: 'Our drivers are happier because they are earning more, and our finance team is happier because our margins have never been better.',
    quotee: 'Patricia Dunn, COO',
    color: 'emerald',
  },
];

const colorMap: Record<string, { gradient: string; text: string; bg: string }> = {
  blue: { gradient: 'from-blue-500 to-blue-600', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  teal: { gradient: 'from-teal-500 to-teal-600', text: 'text-teal-400', bg: 'bg-teal-500/10' },
  indigo: { gradient: 'from-indigo-500 to-indigo-600', text: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  emerald: { gradient: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

export default function CaseStudiesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Case Studies</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Real results from{' '}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              real freight companies
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            See how brokerages, carriers, and 3PLs use Infæmous Freight to transform their
            operations.
          </p>
        </div>
      </section>

      {/* Case Studies */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-24">
          {caseStudies.map((cs) => {
            const c = colorMap[cs.color];
            return (
              <article
                key={cs.company}
                className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-8 py-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} text-sm font-black text-white`}>
                    {cs.logo}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{cs.company}</h2>
                    <p className="text-sm text-slate-400">{cs.industry}</p>
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-2xl font-bold">{cs.headline}</h3>

                  <div className="mt-8 grid gap-8 lg:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Challenge</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{cs.challenge}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Solution</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{cs.solution}</p>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {cs.results.map((r) => (
                      <div key={r.label} className={`rounded-xl ${c.bg} p-5 text-center`}>
                        <p className={`text-2xl font-extrabold ${c.text}`}>{r.metric}</p>
                        <p className="mt-1 text-xs text-slate-400">{r.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="mt-8 border-l-2 border-slate-700 pl-6">
                    <p className="text-sm italic leading-relaxed text-slate-300">
                      &ldquo;{cs.quote}&rdquo;
                    </p>
                    <cite className="mt-2 block text-sm not-italic text-slate-500">-- {cs.quotee}</cite>
                  </blockquote>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Ready to write your success story?</h2>
          <p className="mt-4 text-slate-400">
            Join the logistics companies already transforming their operations with Infæmous Freight.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
            >
              Request a Demo
            </Link>
            <Link
              href="/register"
              className="inline-flex h-12 items-center rounded-lg border border-slate-700 bg-slate-800/50 px-8 text-sm font-semibold text-white transition hover:border-slate-600"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
