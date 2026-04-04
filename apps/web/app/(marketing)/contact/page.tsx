import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Infæmous Freight',
  description:
    'Get in touch with the Infæmous Freight team. Request a demo, ask a question, or find our office locations.',
};

const offices = [
  { city: 'Chicago, IL', address: '233 S Wacker Dr, Suite 4200', label: 'Headquarters' },
  { city: 'Dallas, TX', address: '2711 N Haskell Ave, Suite 1200', label: 'Regional Office' },
  { city: 'Atlanta, GA', address: '3344 Peachtree Rd NE, Suite 800', label: 'Regional Office' },
];

const contactMethods = [
  { label: 'Sales', value: 'sales@infaemousfreight.com', desc: 'Talk to our sales team about pricing and demos.' },
  { label: 'Support', value: 'support@infaemousfreight.com', desc: 'Get help with your account or platform questions.' },
  { label: 'Phone', value: '+1 (312) 555-0199', desc: 'Mon-Fri, 7AM-7PM CT.' },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Contact</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Let&apos;s talk freight
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Whether you are ready to get started, have a question, or want a personalized demo --
            we are here to help.
          </p>
        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
                <h2 className="text-xl font-bold">Send us a message</h2>
                <p className="mt-2 text-sm text-slate-400">Fill out the form and our team will get back to you within 24 hours.</p>
                <form className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">Full Name</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="mb-1.5 block text-sm font-medium text-slate-300">Company</label>
                    <input
                      id="company"
                      name="company"
                      type="text"
                      className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Acme Logistics"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-slate-300">Your Role</label>
                    <select
                      id="role"
                      name="role"
                      className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select a role</option>
                      <option value="shipper">Shipper</option>
                      <option value="carrier">Carrier</option>
                      <option value="broker">Broker / 3PL</option>
                      <option value="dispatcher">Dispatcher</option>
                      <option value="driver">Driver / Owner-Operator</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-300">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="block w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Tell us about your freight operations and how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-12 items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-8 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-10 lg:col-span-2">
              <div>
                <h2 className="text-xl font-bold">Contact Information</h2>
                <div className="mt-6 space-y-6">
                  {contactMethods.map((m) => (
                    <div key={m.label}>
                      <p className="text-sm font-semibold text-blue-400">{m.label}</p>
                      <p className="mt-1 text-sm text-white">{m.value}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold">Our Offices</h2>
                <div className="mt-6 space-y-6">
                  {offices.map((o) => (
                    <div key={o.city} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{o.label}</p>
                      <p className="mt-1 font-semibold">{o.city}</p>
                      <p className="mt-0.5 text-sm text-slate-400">{o.address}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
