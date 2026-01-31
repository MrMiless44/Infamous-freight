"use client";

import { useState } from "react";

export default function ThreadSummaryButton({ threadId }: { threadId: string }) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) {
      return;
    }

    setBusy(true);
    await fetch("/api/actions/summarize-thread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thread_id: threadId }),
    });
    setBusy(false);
    window.location.reload();
  }

  return (
    <button
      className="btn btn-secondary"
      onClick={handleClick}
      type="button"
      disabled={busy}
    >
      {busy ? "Summarizing..." : "AI Summary"}
    </button>
  );
}
