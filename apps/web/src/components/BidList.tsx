"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: string;
  message: string | null;
  created_at: string;
};

export default function BidList({ bids, canAccept }: { bids: BidRow[]; canAccept: boolean }): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const inFlight = useRef(false);

  const acceptBid = useCallback(
    async (bidId: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(bidId);
      setErr(null);
      setOk(null);

      try {
        const res = await fetch("/api/actions/accept-bid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bid_id: bidId }),
        });

        const json = await res.json();

        if (!json.ok) {
          setErr(json.error || "Failed");
          return;
        }

        setOk("Bid accepted. Assignment created.");
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      } finally {
        setBusy(null);
        inFlight.current = false;
      }
    },
    [router],
  );

  return (
    <div className="card marketplace-card">
      <div className="marketplace-card-title">Bids</div>
      {err && <p className="status-message error">{err}</p>}
      {ok && <p className="status-message success">{ok}</p>}
      <div className="marketplace-stack">
        {bids.map((b) => (
          <div key={b.id} className="marketplace-bid">
            <div className="marketplace-bid-info">
              <div className="marketplace-bid-amount">
                ${(b.amount_cents / 100).toFixed(2)} - {b.status}
              </div>
              {b.message && <div className="marketplace-muted">{b.message}</div>}
              <div className="marketplace-muted">carrier: {b.carrier_id}</div>
            </div>
            {canAccept && b.status === "pending" && (
              <button
                className="btn btn-primary"
                disabled={busy !== null}
                onClick={() => acceptBid(b.id)}
                type="button"
              >
                {busy === b.id ? "Accepting..." : "Accept"}
              </button>
            )}
          </div>
        ))}
        {bids.length === 0 && <div className="marketplace-muted">No bids yet.</div>}
      </div>
    </div>
  );
}
