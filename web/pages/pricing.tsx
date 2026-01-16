import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { getLocaleFromRouter, t } from "../lib/i18n/t";
import { GetStaticProps } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Plan = {
  key: string;
  label: string;
  priceId?: string;
};

type PricingProps = {
  initialPlans: Plan[];
  initialConfigured: boolean;
};

export default function Pricing({ initialPlans, initialConfigured }: PricingProps) {
  const router = useRouter();
  const locale = getLocaleFromRouter(router.locale);

  const [plans, setPlans] = useState<Plan[]>(initialPlans || []);
  const [configured, setConfigured] = useState(initialConfigured || false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Client-side refresh (optional, for real-time updates)
  useEffect(() => {
    fetch(`${apiBase}/v1/billing/plans`)
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans || []);
        setConfigured(!!d.configured);
      })
      .catch(() => setErr("Failed to load plans"));
  }, []);

  async function checkout(planKey: string) {
    setBusy(planKey);
    setErr(null);
    try {
      // Use dev token if no auth yet
      const token = localStorage.getItem("genesisToken") || "dev-token";
      const res = await fetch(`${apiBase}/v1/billing/checkout`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-user-id": "demo-user",
        },
        body: JSON.stringify({ planKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e: any) {
      setErr(e?.message ?? "Checkout failed");
    } finally {
      setBusy(null);
    }
  }

  const card: React.CSSProperties = {
    borderRadius: 18,
    border: "1px solid rgba(255,0,0,0.25)",
    background: "rgba(255,0,0,0.02)",
    padding: 16,
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ margin: 0, color: "rgb(180,0,0)" }}>Pricing</h1>
      <p style={{ opacity: 0.85 }}>
        Choose a plan. If Stripe is not configured yet, checkout will show a
        clear setup message.
      </p>

      {err ? (
        <div
          style={{
            ...card,
            border: "1px solid rgba(255,0,0,0.45)",
            background: "rgba(255,0,0,0.06)",
          }}
        >
          <strong style={{ color: "rgb(180,0,0)" }}>Error:</strong> {err}
        </div>
      ) : null}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginTop: 14,
        }}
      >
        {plans.map((p) => (
          <section key={p.key} style={card}>
            <h2 style={{ marginTop: 0 }}>{p.label}</h2>
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              planKey: <code>{p.key}</code>
            </div>
            <div style={{ marginTop: 8, opacity: 0.8, fontSize: 12 }}>
              Stripe priceId: <code>{p.priceId ?? "not set"}</code>
            </div>

            <button
              onClick={() => checkout(p.key)}
              disabled={busy === p.key}
              style={{
                marginTop: 12,
                width: "100%",
                padding: "12px 12px",
                borderRadius: 14,
                border: "1px solid rgba(255,0,0,0.45)",
                background: "rgba(255,0,0,0.10)",
                cursor: busy === p.key ? "not-allowed" : "pointer",
              }}
            >
              {busy === p.key ? "Redirecting..." : "Checkout"}
            </button>
          </section>
        ))}
      </div>

      <div style={{ marginTop: 14, opacity: 0.8, fontSize: 12 }}>
        Stripe configured: <strong>{configured ? "YES" : "NO"}</strong> •{" "}
        <Link href="/account/billing">Manage Billing</Link>
      </div>
    </main>
  );
}

/**
 * ISR (Incremental Static Regeneration)
 * - Page is pre-rendered at build time
 * - Revalidates every 60 seconds
 * - Serves stale content while regenerating
 */
export const getStaticProps: GetStaticProps = async () => {
  try {
    const apiUrl = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/v1/billing/plans`, {
      headers: { 'User-Agent': 'Next.js-ISR' },
    });
    
    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }
    
    const data = await res.json();
    
    return {
      props: {
        initialPlans: data.plans || [],
        initialConfigured: !!data.configured,
      },
      // Revalidate every 60 seconds (ISR)
      revalidate: 60,
    };
  } catch (error) {
    console.warn('ISR: Failed to fetch plans, using fallback', error);
    
    // Fallback to empty state on error
    return {
      props: {
        initialPlans: [],
        initialConfigured: false,
      },
      revalidate: 60,
    };
  }
};
