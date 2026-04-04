'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  currentPath: string;
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="2" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="2" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="11" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Loads',
        href: '/loads',
        badge: 12,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="16" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 14v2M14 14v2M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Tracking',
        href: '/tracking',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 11c-4 0-6 2-6 4v1h12v-1c0-2-2-4-6-4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
        ),
      },
      {
        label: 'Dispatch',
        href: '/dispatch',
        badge: 3,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10l5 5L17 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 3v4M10 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        label: 'Drivers',
        href: '/drivers',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 17c0-3 3-5.5 7-5.5s7 2.5 7 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Carriers',
        href: '/carriers',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="6" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M13 9h3l2.5 3V14h-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="5.5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15.5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Shippers',
        href: '/shippers',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 8h14M8 8v9" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        label: 'Fleet',
        href: '/fleet',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="8" width="16" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="6" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 8V6a2 2 0 012-2h8a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        label: 'Billing',
        href: '/billing',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Invoices',
        href: '/invoices',
        badge: 5,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 2h7l4 4v12a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 2v4h4M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Analytics',
        href: '/analytics',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 17V10M8 17V6M13 17V8M18 17V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Documents',
        href: '/documents',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 2h8l4 4v12a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 2v4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Messages',
        href: '/messages',
        badge: 8,
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: 'Settings',
        href: '/settings',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Admin',
        href: '/admin',
        icon: (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7h6M7 10h6M7 13h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
];

export default function Sidebar({ currentPath }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
    return currentPath.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#0d1117] text-slate-300">
      {/* Logo / Brand */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 9l7-7 7 7-7 7-7-7z" fill="white" />
          </svg>
        </div>
        <div>
          <span className="text-base font-bold tracking-tight text-white">
            Inf<span className="text-blue-400">ae</span>mous
          </span>
          <span className="ml-1 text-xs font-medium text-slate-500">Freight</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-blue-600/10 text-blue-400'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span
                        className={`flex-shrink-0 ${
                          active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            active
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Profile Mini Card */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-800/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
            JD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-slate-200">John Doe</p>
            <p className="truncate text-xs text-slate-500">Dispatcher</p>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0 text-slate-500"
          >
            <path
              d="M4 6l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-lg bg-slate-800 p-2 text-slate-400 shadow-lg md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 flex-shrink-0 border-r border-slate-800 md:block">
        {sidebarContent}
      </aside>
    </>
  );
}
