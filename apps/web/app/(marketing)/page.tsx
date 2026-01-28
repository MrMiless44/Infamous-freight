import { PageAnalytics } from "../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../src/components/analytics/TrackedPrimaryButton";
import { EmptyState } from "../../src/components/ui/EmptyState";
import { Skeleton } from "../../src/components/ui/Skeleton";
import { Toast } from "../../src/components/ui/Toast";

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <PageAnalytics eventName="marketing_home_view" />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/5 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_60%)] p-10 shadow-card">
          <div className="text-xs uppercase tracking-[0.3em] text-muted">
            Infæmous Freight Enterprise
          </div>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Command the freight network with premium AI logistics.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            Genesis UX unifies dispatch, margins, and risk in a single enterprise-grade
            console. Every action is auditable, every recommendation is explainable.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <TrackedPrimaryButton eventName="marketing_home_primary_cta">
              Request Executive Demo
            </TrackedPrimaryButton>
            <a
              href="/pricing"
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-muted transition duration-base ease-premium hover:border-gold-500/70 hover:text-text"
            >
              View Pricing
            </a>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-surface p-6 shadow-card">
            <div className="text-sm text-muted">Loading State</div>
            <Skeleton className="mt-4 h-24" />
          </div>
          <EmptyState
            title="No enterprise playbooks yet"
            description="Save your first Genesis playbook to enable AI-driven dispatch workflows."
            ctaLabel="Create Playbook"
          />
          <div
            role="alert"
            className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
          >
            Error state ready: Genesis feed is temporarily unavailable.
          </div>
        </div>

        <div className="mt-8">
          <Toast
            title="Success"
            message="Genesis contract verified. Premium routing recommendations are live."
          />
        </div>
      </div>
    </div>
  );
}
