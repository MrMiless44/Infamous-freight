"use client";

import React, { useState, useEffect } from "react";

interface TestMetric {
  name: string;
  control: number;
  treatment: number;
  improvement: number;
  significant: boolean;
}

interface TestResult {
  testId: string;
  testName: string;
  metrics: TestMetric[];
  winner: "Control" | "Treatment" | "No Winner";
  confidence: number;
}

export default function ABTestingDashboard() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/ab-tests`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const data = await response.json();
        setTests(data.data);
      } catch (error) {
        console.error("Failed to fetch A/B tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      <h1>A/B Testing Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
        {/* Test List */}
        <div style={{ backgroundColor: "#f9f9f9", padding: "20px", borderRadius: "8px" }}>
          <h2>Active Tests</h2>
          <div style={{ gap: "10px", display: "flex", flexDirection: "column" }}>
            {tests.map((test) => (
              <div
                key={test.testId}
                onClick={() => setSelectedTest(test.testId)}
                style={{
                  padding: "15px",
                  backgroundColor: selectedTest === test.testId ? "#e3f2fd" : "white",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{test.testName}</div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                  Winner: <span style={{ color: "#d32f2f" }}>{test.winner}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  Confidence: {test.confidence}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Details */}
        <div
          style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #ddd",
          }}
        >
          {selectedTest ? (
            (() => {
              const test = tests.find((t) => t.testId === selectedTest);
              return test ? (
                <>
                  <h2>{test.testName}</h2>
                  <p style={{ color: "#666" }}>
                    Winner:{" "}
                    <strong style={{ color: test.winner === "Treatment" ? "#4caf50" : "#d32f2f" }}>
                      {test.winner}
                    </strong>
                  </p>

                  <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "10px", textAlign: "left" }}>Metric</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>Control</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>Treatment</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>Improvement</th>
                        <th style={{ padding: "10px", textAlign: "center" }}>Significant?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {test.metrics.map((metric, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "10px" }}>{metric.name}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            {metric.control.toFixed(2)}%
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            {metric.treatment.toFixed(2)}%
                          </td>
                          <td
                            style={{
                              padding: "10px",
                              textAlign: "center",
                              color: metric.improvement > 0 ? "#4caf50" : "#d32f2f",
                            }}
                          >
                            {metric.improvement > 0 ? "+" : ""}
                            {metric.improvement.toFixed(1)}%
                          </td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            {metric.significant ? "✓" : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null;
            })()
          ) : (
            <p>Select a test to view details</p>
          )}
        </div>
      </div>
    </div>
  );
}
