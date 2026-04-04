'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b0e14] via-[#0d1117] to-[#101820] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <svg width="24" height="24" viewBox="0 0 18 18" fill="none">
              <path d="M2 9l7-7 7 7-7 7-7-7z" fill="white" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">
            Inf<span className="text-blue-400">ae</span>mous
            <span className="ml-1.5 font-medium text-slate-500">Freight</span>
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#161b22] p-8 shadow-2xl">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-white">Check Your Email</h2>
              <p className="mb-6 text-sm text-slate-400">
                We sent a password reset link to <span className="font-medium text-slate-300">{email}</span>
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-1 text-2xl font-bold text-white">Forgot Password</h2>
              <p className="mb-6 text-sm text-slate-400">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full rounded-lg border border-slate-700 bg-[#0d1117] px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-400">
                <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
