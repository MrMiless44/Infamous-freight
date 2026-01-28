import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

export default function LoginPage() {
  useEffect(() => {
    trackEvent("login_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Request Demo</p>
            <h1 className="hero-title">See Genesis AI with your network.</h1>
            <p className="hero-copy">
              The team will configure a live walk-through tailored to your
              fleet, routes, and billing workflows.
            </p>
            <div className="hero-actions">
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("login_start_free")}
              >
                Start Free
              </Link>
              <Link href="/pricing" className="btn btn-secondary">
                View pricing
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Demo checklist</h3>
            <p>What to expect when the demo kicks off:</p>
            <div className="pricing-list">
              <div>• Genesis recommendations in real time</div>
              <div>• Dispatch + billing workflow review</div>
              <div>• Security + compliance walkthrough</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
