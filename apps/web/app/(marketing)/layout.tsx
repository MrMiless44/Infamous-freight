import Link from 'next/link';

function MarketingHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/50 bg-[#0b0e14]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-400">
            <span className="text-sm font-black text-white">IF</span>
          </div>
          <span className="text-lg font-bold text-white">Infæmous <span className="text-blue-400">Freight</span></span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/about" className="text-sm text-slate-400 transition hover:text-white">About</Link>
          <Link href="/services" className="text-sm text-slate-400 transition hover:text-white">Services</Link>
          <Link href="/solutions" className="text-sm text-slate-400 transition hover:text-white">Solutions</Link>
          <Link href="/pricing" className="text-sm text-slate-400 transition hover:text-white">Pricing</Link>
          <Link href="/contact" className="text-sm text-slate-400 transition hover:text-white">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost hidden sm:inline-flex">Sign In</Link>
          <Link href="/register" className="btn-primary">Get Started</Link>
        </div>
      </div>
    </header>
  );
}

function MarketingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-[#080b10]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-teal-400">
                <span className="text-sm font-black text-white">IF</span>
              </div>
              <span className="text-lg font-bold text-white">Infæmous Freight</span>
            </div>
            <p className="mt-4 text-sm text-slate-400">The intelligent freight operating system for modern logistics companies.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Platform</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/solutions" className="text-sm text-slate-400 hover:text-white">Load Management</Link></li>
              <li><Link href="/solutions" className="text-sm text-slate-400 hover:text-white">Dispatch</Link></li>
              <li><Link href="/solutions" className="text-sm text-slate-400 hover:text-white">Tracking</Link></li>
              <li><Link href="/solutions" className="text-sm text-slate-400 hover:text-white">Analytics</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Company</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/about" className="text-sm text-slate-400 hover:text-white">About</Link></li>
              <li><Link href="/careers" className="text-sm text-slate-400 hover:text-white">Careers</Link></li>
              <li><Link href="/blog" className="text-sm text-slate-400 hover:text-white">Blog</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/faq" className="text-sm text-slate-400 hover:text-white">FAQ</Link></li>
              <li><Link href="/case-studies" className="text-sm text-slate-400 hover:text-white">Case Studies</Link></li>
              <li><Link href="/legal/privacy-policy" className="text-sm text-slate-400 hover:text-white">Privacy</Link></li>
              <li><Link href="/legal/terms-of-service" className="text-sm text-slate-400 hover:text-white">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Support</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white">Help Center</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white">API Docs</Link></li>
              <li><Link href="/contact" className="text-sm text-slate-400 hover:text-white">Status</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">&copy; 2024 Infæmous Freight. All rights reserved.</p>
          <div className="mt-4 flex gap-4 md:mt-0">
            <span className="text-sm text-slate-500">Built for the road ahead.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      <MarketingHeader />
      <main className="pt-16">{children}</main>
      <MarketingFooter />
    </div>
  );
}
