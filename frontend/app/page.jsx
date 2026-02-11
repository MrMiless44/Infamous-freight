"use client";
import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState(null);

  async function getQuote() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
    const res = await fetch(`${apiBaseUrl}/load/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ miles: 800, weight: 30000 })
    });
    setResult(await res.json());
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>🚛 Infæmous Freight</h1>
      <button onClick={getQuote}>Run Load Optimization</button>
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
