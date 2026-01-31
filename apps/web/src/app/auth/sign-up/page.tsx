"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"shipper" | "carrier" | "owner_operator">(
    "owner_operator",
  );
  const [displayName, setDisplayName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const supabase = supabaseBrowser();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErr(error.message);
      return;
    }
    if (!data.user) {
      setErr("Missing user after signup.");
      return;
    }

    const { error: pErr } = await supabase.from("profiles").upsert({
      id: data.user.id,
      role,
      display_name: displayName || null,
    });

    if (pErr) {
      setErr(pErr.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="marketplace-auth">
      <h1 className="marketplace-title">Create account</h1>
      <form onSubmit={onSubmit} className="form-grid marketplace-form">
        <div className="form-control">
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
          />
        </div>
        <div className="form-control">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as "shipper" | "carrier" | "owner_operator")}
          >
            <option value="owner_operator">Owner-Operator</option>
            <option value="carrier">Carrier</option>
            <option value="shipper">Shipper</option>
          </select>
        </div>
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
          Sign up
        </button>
      </form>
    </div>
  );
}
