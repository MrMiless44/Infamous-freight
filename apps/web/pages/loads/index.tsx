import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { api } from "../../lib/api";
import { getToken } from "../../lib/session";
import { isGetTrucknEnabled } from "../../lib/feature-flags";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

type Load = {
  id: string;
  reference: string;
  pickupCity: string;
  dropoffCity: string;
  miles: number;
  payoutCents: number;
};

const VISIBLE_BATCH = 100;

type LoadRowProps = {
  load: Load;
  busy: boolean;
  onAccept: (load: Load) => void;
};

const LoadRow = memo(function LoadRow({ load, busy, onAccept }: LoadRowProps) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{load.reference}</strong>
        <span style={{ color: "#ef4444", fontWeight: 700 }}>Æ</span>
      </div>
      <p style={{ marginTop: 8, color: "var(--muted-400)" }}>
        {load.pickupCity} → {load.dropoffCity}
      </p>
      <p style={{ marginTop: 4, color: "var(--muted-400)" }}>
        {load.miles} mi • ${(load.payoutCents / 100).toFixed(2)}
      </p>
      <button
        onClick={() => onAccept(load)}
        disabled={busy}
        className="btn btn-primary"
        style={{ marginTop: 12, width: "100%" }}
      >
        {busy ? "Accepting..." : "Accept (Get Truck’N)"}
      </button>
    </div>
  );
});

export default function LoadsPage(): React.ReactElement {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [loads, setLoads] = useState<Load[]>([]);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH);
  const [busyId, setBusyId] = useState<string | null>(null);
  const getTrucknEnabled = isGetTrucknEnabled();
  const debouncedQuery = useDebouncedValue(query, 180);
  const acceptInFlight = useRef(false);

  useEffect(() => setToken(getToken()), []);

  useEffect(() => {
    if (!token || !getTrucknEnabled) return;
    let cancelled = false;
    api("/loads", {}, token)
      .then((r) => {
        if (cancelled) return;
        setLoads(r.loads ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e instanceof Error ? e.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, [token, getTrucknEnabled]);

  const filteredLoads = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return loads;
    return loads.filter((l) => {
      return (
        l.reference.toLowerCase().includes(q) ||
        l.pickupCity.toLowerCase().includes(q) ||
        l.dropoffCity.toLowerCase().includes(q)
      );
    });
  }, [loads, debouncedQuery]);

  useEffect(() => {
    setVisibleCount(VISIBLE_BATCH);
  }, [debouncedQuery]);

  const visibleLoads = useMemo(
    () => filteredLoads.slice(0, visibleCount),
    [filteredLoads, visibleCount],
  );

  const accept = useCallback(
    async (load: Load) => {
      if (acceptInFlight.current) return;
      acceptInFlight.current = true;
      setBusyId(load.id);
      setErr("");
      try {
        const res = await api(`/loads/${load.id}/accept`, { method: "POST" }, token);
        localStorage.setItem(
          "active_assignment",
          JSON.stringify({
            assignmentId: res.assignment.id,
            loadId: load.id,
            reference: load.reference,
            pickupCity: load.pickupCity,
            dropoffCity: load.dropoffCity,
            miles: load.miles,
            payoutCents: load.payoutCents,
          }),
        );
        router.push("/loads/active");
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to accept load");
      } finally {
        setBusyId(null);
        acceptInFlight.current = false;
      }
    },
    [router, token],
  );

  return (
    <div className="page">
      <section className="section">
        <div className="container" style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Link href="/" className="btn btn-tertiary">
              ← Back
            </Link>
            <Link href="/loads/active" className="btn btn-secondary">
              Active Load
            </Link>
          </div>
          <h1 className="section-title" style={{ marginTop: 16 }}>
            Available Loads
          </h1>

          {!getTrucknEnabled ? (
            <div className="card">Get Truck’N marketplace is currently disabled.</div>
          ) : null}
          {err ? (
            <div
              className="card"
              style={{
                borderColor: "rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.08)",
                color: "#fca5a5",
              }}
            >
              {err}
            </div>
          ) : null}

          {getTrucknEnabled ? (
            <>
              <label htmlFor="loads-search" style={{ display: "block", marginTop: 16 }}>
                <span className="sr-only">Filter loads</span>
                <input
                  id="loads-search"
                  type="search"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter by reference or city"
                  aria-label="Filter loads"
                  className="input"
                  style={{ width: "100%", padding: 12, borderRadius: 12 }}
                />
              </label>
              <div className="grid" style={{ marginTop: 16 }}>
                {visibleLoads.map((l) => (
                  <LoadRow
                    key={l.id}
                    load={l}
                    busy={busyId === l.id}
                    onAccept={accept}
                  />
                ))}
              </div>
              {filteredLoads.length > visibleCount ? (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setVisibleCount((c) => c + VISIBLE_BATCH)}
                  >
                    Show more ({filteredLoads.length - visibleCount} remaining)
                  </button>
                </div>
              ) : null}
              {filteredLoads.length === 0 && loads.length > 0 ? (
                <div className="card" style={{ marginTop: 16 }}>
                  No loads match "{debouncedQuery}".
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
