import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing | Infæmous Freight',
  description:
    'Simple, transparent pricing for freight brokerages, carriers, and logistics companies of every size.',
};

const tiers = [
  {
    name: 'Starter',
    price: '$299',
    period: '/mo',
    desc: 'For small brokerages and carriers getting started with digital freight management.',
    features: [
      'Up to 200 loads per month',
      '5 team members',
      'Load management & dispatch',
      'Basic real-time tracking',
      'Carrier onboarding portal',
      'Standard reporting',
      'Email support',
    ],
    cta: 'Start Free Trial',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$799',
    period: '/mo',
    desc: 'For growing operations that need automation, analytics, and advanced carrier management.',
    features: [
      'Up to 2,000 loads per month',
      '25 team members',
      'Everything in Starter, plus:',
      'AI-powered carrier matching',
      'Advanced analytics & dashboards',
      'Document management with OCR',
      'Settlement & billing automation',
      'Driver mobile app',
      'API access',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    href: '/register',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large-scale operations requiring unlimited capacity, dedicated infrastructure, and custom integrations.',
    features: [
      'Unlimited loads',
      'Unlimited team members',
      'Everything in Professional, plus:',
      'Dedicated infrastructure',
      'Custom integrations (EDI, TMS, ERP)',
      'SSO & advanced security',
      'Custom SLAs',
      'Dedicated account manager',
      'On-site onboarding & training',
      'Custom reporting & BI',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlight: false,
  },
];

function PricingCards() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? 'border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/10'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 px-4 py-1 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                {tier.period && <span className="text-slate-400">{tier.period}</span>}
              </div>
              <p className="mt-4 text-sm text-slate-400">{tier.desc}</p>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`mt-8 flex h-12 items-center justify-center rounded-lg text-sm font-semibold transition ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
                    : 'border border-slate-700 bg-slate-800/50 text-white hover:border-slate-600'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature Comparison                                                */
/* ------------------------------------------------------------------ */
const comparisonCategories = [
  {
    category: 'Load Management',
    rows: [
      { feature: 'Monthly load limit', starter: '200', pro: '2,000', enterprise: 'Unlimited' },
      { feature: 'Multi-stop loads', starter: true, pro: true, enterprise: true },
      { feature: 'Load templates', starter: false, pro: true, enterprise: true },
      { feature: 'Bulk import (CSV/EDI)', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Tracking & Visibility',
    rows: [
      { feature: 'Real-time GPS tracking', starter: true, pro: true, enterprise: true },
      { feature: 'ETA predictions (ML)', starter: false, pro: true, enterprise: true },
      { feature: 'Geofence alerts', starter: false, pro: true, enterprise: true },
      { feature: 'Customer tracking portal', starter: false, pro: true, enterprise: true },
    ],
  },
  {
    category: 'Automation & AI',
    rows: [
      { feature: 'AI carrier matching', starter: false, pro: true, enterprise: true },
      { feature: 'Automated tendering', starter: false, pro: true, enterprise: true },
      { feature: 'Settlement automation', starter: false, pro: true, enterprise: true },
      { feature: 'Custom workflow rules', starter: false, pro: false, enterprise: true },
    ],
  },
  {
    category: 'Support & Security',
    rows: [
      { feature: 'Email support', starter: true, pro: true, enterprise: true },
      { feature: 'Priority support', starter: false, pro: true, enterprise: true },
      { feature: 'Dedicated account manager', starter: false, pro: false, enterprise: true },
      { feature: 'SSO / SAML', starter: false, pro: false, enterprise: true },
      { feature: 'Custom SLA', starter: false, pro: false, enterprise: true },
    ],
  },
];

function renderCell(val: boolean | string) {
  if (typeof val === 'string') return <span className="text-sm text-slate-300">{val}</span>;
  return val ? (
    <svg className="mx-auto h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <span className="mx-auto block h-0.5 w-4 bg-slate-700" />
  );
}

function FeatureComparison() {
  return (
    <section className="border-t border-slate-800 bg-[#090c12] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold">Feature comparison</h2>
        <div className="mt-16 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="pb-4 pr-4 text-sm font-semibold text-slate-400">Feature</th>
                <th className="pb-4 text-center text-sm font-semibold">Starter</th>
                <th className="pb-4 text-center text-sm font-semibold text-blue-400">Professional</th>
                <th className="pb-4 text-center text-sm font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonCategories.map((cat) => (
                <>
                  <tr key={cat.category}>
                    <td colSpan={4} className="pb-2 pt-8 text-sm font-semibold uppercase tracking-wider text-slate-500">
                      {cat.category}
                    </td>
                  </tr>
                  {cat.rows.map((row) => (
                    <tr key={row.feature} className="border-b border-slate-800/50">
                      <td className="py-3 pr-4 text-sm text-slate-300">{row.feature}</td>
                      <td className="py-3 text-center">{renderCell(row.starter)}</td>
                      <td className="py-3 text-center">{renderCell(row.pro)}</td>
                      <td className="py-3 text-center">{renderCell(row.enterprise)}</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                               */
/* ------------------------------------------------------------------ */
const faqs = [
  { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.' },
  { q: 'Is there a free trial?', a: 'Absolutely. All plans come with a 14-day free trial -- no credit card required.' },
  { q: 'What happens if I exceed my load limit?', a: 'We will notify you as you approach your limit. You can upgrade mid-cycle or purchase additional load packs.' },
  { q: 'Do you offer annual billing?', a: 'Yes. Annual plans receive a 20% discount compared to monthly billing.' },
];

function PricingFAQ() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold">Pricing FAQ</h2>
        <dl className="mt-12 space-y-8">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-sm text-slate-400">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Pricing</p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Start free, scale as you grow. No hidden fees, no long-term contracts.
          </p>
        </div>
      </section>

      <PricingCards />
      <FeatureComparison />
      <PricingFAQ />
    </>
  );
}
