"use client";
import { useState } from "react";

export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <h1>Infæmous Freight – Deprecated Frontend</h1>
      <p style={{ maxWidth: 600, marginTop: 16, lineHeight: 1.5 }}>
        This <code>frontend/</code> app is deprecated and no longer used as the primary UI.
        The canonical production frontend lives in the <code>web/</code> workspace
        (Next.js 14 with full monitoring, auth, and styling) and is the only implementation
        that should be modified or deployed.
      </p>
      <p style={{ maxWidth: 600, marginTop: 16, lineHeight: 1.5 }}>
        Please open the <code>web/</code> app for all development and testing, or visit the
        deployed site at:
      </p>
      <p style={{ marginTop: 8 }}>
        <a
          href="https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app"
          target="_blank"
          rel="noreferrer"
        >
          https://infamous-freight-enterprises-git-f34b9b-santorio-miles-projects.vercel.app
        </a>
      </p>
    </main>
  );
}
