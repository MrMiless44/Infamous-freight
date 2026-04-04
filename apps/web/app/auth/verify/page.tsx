'use client';

import { FormEvent, useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...code];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setCode(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      router.push('/dashboard');
    } catch {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = () => {
    setTimer(60);
    setCode(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
          <h2 className="mb-1 text-center text-2xl font-bold text-white">Two-Factor Authentication</h2>
          <p className="mb-8 text-center text-sm text-slate-400">
            Enter the 6-digit code sent to your device.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Code inputs */}
            <div className="flex justify-center gap-3">
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="h-14 w-12 rounded-lg border border-slate-700 bg-[#0d1117] text-center text-xl font-bold text-white outline-none transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500/25"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          {/* Timer & Resend */}
          <div className="mt-6 text-center">
            {timer > 0 ? (
              <p className="text-sm text-slate-500">
                Resend code in <span className="font-medium text-slate-300">{formatTime(timer)}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={resendCode}
                className="text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Resend Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
