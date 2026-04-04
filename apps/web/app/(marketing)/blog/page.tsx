import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Infæmous Freight',
  description:
    'Insights, trends, and best practices from the Infæmous Freight team on freight logistics, technology, and operations.',
};

const posts = [
  {
    slug: '#',
    title: 'Why Visibility Is the New Currency in Freight',
    excerpt: 'In an industry built on phone calls and check-ins, real-time tracking is no longer a nice-to-have -- it is the foundation of trust between shippers, brokers, and carriers.',
    date: 'March 28, 2024',
    category: 'Industry Trends',
    readTime: '6 min read',
  },
  {
    slug: '#',
    title: 'The True Cost of Manual Dispatch: A Data-Driven Analysis',
    excerpt: 'We analyzed 50,000 loads to quantify how much time and revenue brokerages lose to manual carrier matching, phone-based tendering, and spreadsheet tracking.',
    date: 'March 15, 2024',
    category: 'Data & Insights',
    readTime: '8 min read',
  },
  {
    slug: '#',
    title: '5 Carrier Onboarding Mistakes That Cost You Loads',
    excerpt: 'From slow insurance verification to missing compliance checks, these common onboarding pitfalls lead to delayed shipments and compliance risk.',
    date: 'March 4, 2024',
    category: 'Best Practices',
    readTime: '5 min read',
  },
  {
    slug: '#',
    title: 'How AI Is Reshaping Freight Rate Negotiation',
    excerpt: 'Machine learning models can now predict market rates with 94% accuracy. Here is how forward-thinking brokerages are using AI to win more bids at better margins.',
    date: 'February 22, 2024',
    category: 'Technology',
    readTime: '7 min read',
  },
  {
    slug: '#',
    title: 'Building a Driver-First Mobile Experience',
    excerpt: 'A behind-the-scenes look at how we designed our driver app -- from ride-alongs with OTR truckers to usability testing at truck stops across the Midwest.',
    date: 'February 10, 2024',
    category: 'Product',
    readTime: '6 min read',
  },
  {
    slug: '#',
    title: 'Compliance in 2024: What Every Broker Needs to Know',
    excerpt: 'FMCSA regulations, insurance requirements, and safety scoring are evolving. Here is a practical guide to staying compliant without slowing down your operation.',
    date: 'January 30, 2024',
    category: 'Compliance',
    readTime: '9 min read',
  },
];

const categories = ['All', 'Industry Trends', 'Data & Insights', 'Best Practices', 'Technology', 'Product', 'Compliance'];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-[128px]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">Blog</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Insights for modern{' '}
            <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              freight operators
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            Trends, best practices, and product updates from the Infæmous Freight team.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-4">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-sm transition ${
                  cat === 'All'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'border border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.title}
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-slate-400">{post.category}</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className="mt-4 text-lg font-semibold leading-snug group-hover:text-blue-400 transition">
                  <Link href={post.slug}>{post.title}</Link>
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{post.excerpt}</p>
                <p className="mt-4 text-xs text-slate-500">{post.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="border-t border-slate-800 bg-[#090c12] py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Stay in the loop</h2>
          <p className="mt-4 text-slate-400">
            Get the latest freight industry insights delivered to your inbox every two weeks.
          </p>
          <div className="mx-auto mt-8 flex max-w-md gap-3">
            <input
              type="email"
              placeholder="you@company.com"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-gradient-to-r from-blue-500 to-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40"
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
