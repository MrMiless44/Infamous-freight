'use client';

import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  notificationCount?: number;
  messageCount?: number;
  userName?: string;
  userRole?: string;
  userInitials?: string;
}

export default function Header({
  notificationCount = 3,
  messageCount = 5,
  userName = 'John Doe',
  userRole = 'Dispatcher',
  userInitials = 'JD',
}: HeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#0d1117] px-4 md:px-6">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <div
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
            searchFocused
              ? 'border-blue-500/50 bg-slate-800/80'
              : 'border-slate-700/50 bg-slate-800/40'
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="flex-shrink-0 text-slate-500"
          >
            <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search loads, drivers, carriers..."
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline-block">
            /
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Notification Bell */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          aria-label="Notifications"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a5 5 0 00-5 5v3l-1.5 2.5a.5.5 0 00.43.75h12.14a.5.5 0 00.43-.75L15 10V7a5 5 0 00-5-5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M8 14a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* Messages Icon */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          aria-label="Messages"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-3 3V5a1 1 0 011-1z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {messageCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {messageCount > 9 ? '9+' : messageCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-6 w-px bg-slate-800 md:block" />

        {/* Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-800 md:gap-3 md:px-3 md:py-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
              {userInitials}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-slate-200">{userName}</p>
              <p className="text-xs text-slate-500">{userRole}</p>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              className={`hidden text-slate-500 transition-transform md:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            >
              <path
                d="M3 5l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-56 overflow-hidden rounded-lg border border-slate-800 bg-[#161b22] shadow-xl">
              <div className="border-b border-slate-800 px-4 py-3">
                <p className="text-sm font-medium text-slate-200">{userName}</p>
                <p className="text-xs text-slate-500">{userRole}</p>
              </div>
              <div className="py-1">
                {[
                  { label: 'Your Profile', href: '/profile' },
                  { label: 'Settings', href: '/settings' },
                  { label: 'Help & Support', href: '/support' },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-slate-200"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
              <div className="border-t border-slate-800 py-1">
                <button
                  type="button"
                  className="block w-full px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-slate-800/60"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
