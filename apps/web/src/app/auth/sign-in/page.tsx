"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      return;
    }

    router.push(next);
  }

  return (
    <div className="marketplace-auth">
      <h1 className="marketplace-title">Sign in</h1>
      <form onSubmit={onSubmit} className="form-grid marketplace-form">
        <div className="form-control">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        <div className="form-control">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
        </div>
        {err && <p className="status-message error">{err}</p>}
        <button className="btn btn-primary" type="submit">
          Sign in
        </button>
      </form>
      <p className="marketplace-muted">
        No account? <Link href="/auth/sign-up">Create one</Link>
      </p>
    </div>
  );
}
