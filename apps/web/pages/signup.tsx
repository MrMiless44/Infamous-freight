import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";

export default function SignupPage() {
  useEffect(() => {
    trackEvent("signup_view");
  }, []);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <p className="section-subtitle">Start Free</p>
            <h1 className="hero-title">Launch operations in 15 minutes.</h1>
            <p className="hero-copy">
              Activate Genesis AI, configure dispatch, and start billing without
              a heavy setup cycle.
            </p>
            <div className="hero-actions">
              <Link
                href="/pricing"
                className="btn btn-primary"
                onClick={() => trackEvent("signup_view_pricing")}
              >
                Choose a plan
              </Link>
              <Link href="/security" className="btn btn-secondary">
                Security posture
              </Link>
            </div>
          </div>
          <div className="hero-card">
            <h3>Onboarding steps</h3>
            <div className="pricing-list">
              <div>• Connect dispatch workflows</div>
              <div>• Import fleet + driver roster</div>
              <div>• Configure billing + insurance</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
