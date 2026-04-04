'use client';

import Link from 'next/link';

interface MobileNavProps {
  currentPath: string;
}

interface NavTab {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const tabs: NavTab[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 9l8-6 8 6v9a1 1 0 01-1 1h-4v-5h-6v5H4a1 1 0 01-1-1V9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Loads',
    href: '/loads',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="5" width="18" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 16v2M16 16v2M2 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: 'Track',
    href: '/tracking',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="9" r="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M11 19s-6-4.35-6-9a6 6 0 1112 0c0 4.65-6 9-6 9z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path
          d="M3 4h16a1 1 0 011 1v10a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/settings',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 19c0-3 3-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MobileNav({ currentPath }: MobileNavProps) {
  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
    return currentPath.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0d1117]/95 backdrop-blur-sm md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                active ? 'text-blue-400' : 'text-slate-500'
              }`}
            >
              <span className={active ? 'text-blue-400' : 'text-slate-500'}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
