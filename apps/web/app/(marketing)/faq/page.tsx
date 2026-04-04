'use client';

import { useState } from 'react';
import type { Metadata } from 'next';

const faqs = [
  {
    q: 'What is Infæmous Freight?',
    a: 'Infæmous Freight is an intelligent freight operating system that connects shippers, carriers, dispatchers, and drivers on a single platform. It covers the entire freight lifecycle -- from load creation and carrier matching to real-time tracking, document management, and settlement.',
  },
  {
    q: 'Who is the platform designed for?',
    a: 'We serve freight brokerages, asset-based carriers, 3PLs, shippers, and owner-operators. Whether you manage 50 loads a month or 50,000, the platform scales to fit your operation.',
  },
  {
    q: 'How does carrier matching work?',
    a: 'Our AI-powered matching engine considers carrier proximity, equipment type, lane history, compliance status, performance score, and rate preferences. It ranks carriers and lets dispatchers accept a recommendation or override manually.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. All plans include a 14-day free trial with no credit card required. You get full access to every feature in your chosen tier.',
  },
  {
    q: 'Can I integrate with my existing TMS or ERP?',
    a: 'Absolutely. We support EDI (204, 214, 210), RESTful APIs, CSV imports, and pre-built integrations with popular TMS and accounting platforms. Enterprise customers get custom integration support.',
  },
  {
    q: 'How does real-time tracking work?',
    a: 'Tracking uses a combination of ELD/GPS integrations, carrier API connections, and our mobile driver app. Status updates are pushed automatically -- eliminating manual check calls.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We are SOC 2 Type II certified, encrypt all data at rest and in transit, and follow industry best practices for access control, logging, and incident response.',
  },
  {
    q: 'What kind of support do you offer?',
    a: 'Starter plans receive email support with next-business-day response. Professional plans get priority support with 4-hour response times. Enterprise customers have a dedicated account manager and custom SLAs.',
  },
  {
    q: 'Can drivers use the platform on their phones?',
    a: 'Yes. We offer a mobile-first driver experience for iOS and Android. Drivers can capture BOLs, submit proof of delivery, communicate with dispatch, and navigate to stops -- all from one app.',
  },
  {
    q: 'How do I get started?',
    a: 'Sign up for a free trial on our website, or contact our sales team for a personalized demo. Onboarding typically takes less than a week for Starter and Professional plans.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-slate-800">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="pr-4 font-semibold text-white">{q}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="pb-5 text-sm leading-relaxed text-slate-400">{a}</div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">FAQ</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Frequently asked questions
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Everything you need to know about Infæmous Freight. Can&apos;t find an answer?{' '}
            <a href="/contact" className="text-blue-400 hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>
      </section>

      {/* Accordion */}
      <section className="pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 px-8">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
