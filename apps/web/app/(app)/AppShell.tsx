'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '../_components/Sidebar';
import Header from '../_components/Header';
import MobileNav from '../_components/MobileNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';

  return (
    <div className="flex h-screen bg-[#0b0e14]">
      <Sidebar currentPath={pathname} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <MobileNav currentPath={pathname} />
    </div>
  );
}
