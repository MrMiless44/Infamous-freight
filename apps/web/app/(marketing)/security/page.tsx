import { PageAnalytics } from "../../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../../src/components/analytics/TrackedPrimaryButton";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { Skeleton } from "../../../src/components/ui/Skeleton";
import { Toast } from "../../../src/components/ui/Toast";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <PageAnalytics eventName="marketing_security_view" />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/5 bg-surface p-10 shadow-card">
          <div className="text-xs uppercase tracking-[0.3em] text-muted">Security</div>
          <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
            Audit-ready freight intelligence.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            Continuous monitoring, policy enforcement, and AI explainability keep
            Infæmous Freight Enterprise compliant across every lane.
          </p>
          <div className="mt-6">
            <TrackedPrimaryButton eventName="marketing_security_primary_cta">
              Request Security Brief
            </TrackedPrimaryButton>
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-surface p-6 shadow-card">
            <div className="text-sm text-muted">Loading State</div>
            <Skeleton className="mt-4 h-20" />
          </div>
          <EmptyState
            title="No audit reports"
            description="Connect your compliance feed to receive automated reports."
            ctaLabel="Connect Feed"
          />
          <div
            role="alert"
            className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
          >
            Error state ready: compliance report export failed.
          </div>
        </div>

        <div className="mt-8">
          <Toast
            title="Success"
            message="Security briefing request sent. A specialist will respond within 24 hours."
          />
        </div>
      </div>
    </div>
  );
}
