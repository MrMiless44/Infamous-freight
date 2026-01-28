/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Home (Marketing)
 */

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

const trustItems = [
  "SOC2-lite ready",
  "Stripe secure billing",
  "Audit logs + RBAC",
  "99.9% uptime target",
];

const features = [
  {
    title: "AI Dispatch & Routing",
    description:
      "Route planning and dynamic rebalancing orchestrated by Genesis AI.",
  },
  {
    title: "Real-Time Fleet Control",
    description: "Live fleet health, availability, and next-action control.",
  },
  {
    title: "Automated Billing & Insurance",
    description: "Instant invoicing, metered billing, and embedded coverage.",
  },
];

const metrics = [
  { label: "Route time ↓", value: "22%" },
  { label: "Empty miles ↓", value: "18%" },
  { label: "Time-to-invoice ↓", value: "4x" },
];

const pricingPreview = [
  {
    title: "Starter",
    description: "Basics + limited AI",
    items: ["Dispatch workspace", "Basic analytics", "Up to 10 loads/day"],
  },
  {
    title: "Pro",
    description: "Full ops + metered AI + automations",
    items: [
      "Genesis AI command + chat",
      "Auto billing + insurance",
      "Team collaboration + RBAC",
    ],
    featured: true,
  },
  {
    title: "Enterprise",
    description: "SSO/SAML, SLA, custom RBAC, dedicated support",
    items: ["Custom onboarding", "Dedicated success", "Audit-grade controls"],
  },
];

export default function Home() {
  useEffect(() => {
    trackEvent("home_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Infæmous Freight Enterprise</p>
            <h1 className="hero-title">
              AI-Powered Freight. Autonomous. Scalable. Profitable.
            </h1>
            <p className="hero-copy">
              Dispatch, optimize, insure, and monetize operations with Genesis
              AI.
            </p>
            <div className="hero-actions">
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("home_start_free")}
              >
                Start Free
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Request Demo
              </Link>
              <Link href="/product" className="btn btn-tertiary">
                Learn more
              </Link>
            </div>
            <div className="trust-bar">
              {trustItems.map((item) => (
                <div key={item} className="trust-item">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="hero-card">
            <h3>Genesis AI Mission Control</h3>
            <p>
              Command the network with confidence, impact, and auditability.
              Every recommendation arrives with reasoning and one-click actions.
            </p>
            <div className="metric-grid">
              <div className="metric-card">
                <div className="metric-label">AI Optimization Score</div>
                <div className="metric-value">92</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Active Loads</div>
                <div className="metric-value">128</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Risk Alerts</div>
                <div className="metric-value">3</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Operations built for velocity</h2>
          <p className="section-subtitle">
            Replace manual dispatching with autonomous workflows, real-time fleet
            control, and compliant billing at scale.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {features.map((feature) => (
              <div key={feature.title} className="card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Proof in the numbers</h2>
          <p className="section-subtitle">
            Genesis optimizes margin, reduces empty miles, and accelerates
            billing cycles without sacrificing safety.
          </p>
          <div className="metric-grid" style={{ marginTop: "24px" }}>
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Pricing preview</h2>
          <p className="section-subtitle">
            Choose the tier that matches the pace of your network. Pro stays
            dominant for teams scaling fast.
          </p>
          <div className="pricing-grid" style={{ marginTop: "24px" }}>
            {pricingPreview.map((tier) => (
              <div
                key={tier.title}
                className={`card pricing-card${
                  tier.featured ? " is-featured" : ""
                }`}
              >
                {tier.featured ? (
                  <span className="pricing-badge">Most chosen</span>
                ) : null}
                <h3>{tier.title}</h3>
                <p className="pricing-meta">{tier.description}</p>
                <div className="pricing-list">
                  {tier.items.map((item) => (
                    <div key={item}>• {item}</div>
                  ))}
                </div>
                <Link href="/pricing" className="btn btn-secondary">
                  View pricing
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container callout">
          <h2 className="section-title">Get operational in 15 minutes.</h2>
          <p className="section-subtitle">
            Deploy Genesis AI across dispatch, billing, and risk with a guided
            onboarding experience.
          </p>
          <div className="hero-actions" style={{ marginTop: "24px" }}>
            <Link href="/signup" className="btn btn-primary">
              Start Free
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Request Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
