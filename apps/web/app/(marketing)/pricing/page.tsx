import { PageAnalytics } from "../../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../../src/components/analytics/TrackedPrimaryButton";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { Skeleton } from "../../../src/components/ui/Skeleton";
import { Toast } from "../../../src/components/ui/Toast";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <PageAnalytics eventName="marketing_pricing_view" />
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-muted">
              Pricing
            </div>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
              Enterprise control, transparent cost.
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Align dispatch, finance, and compliance with Genesis-backed
              recommendations and premium support.
            </p>
          </div>
          <TrackedPrimaryButton eventName="marketing_pricing_primary_cta">
            Schedule Pricing Review
          </TrackedPrimaryButton>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            "Core Command",
            "Genesis Elite",
            "Global Enterprise",
          ].map((tier) => (
            <div
              key={tier}
              className="rounded-2xl border border-white/5 bg-surface p-6 shadow-card"
            >
              <div className="text-sm text-muted">{tier}</div>
              <div className="mt-3 text-3xl font-semibold">Custom</div>
              <div className="mt-2 text-xs text-muted">
                Annual agreements tailored to fleet size and region.
              </div>
              <div className="mt-4 rounded-2xl bg-white/5 p-3 text-xs text-muted">
                Includes Genesis UX, compliance monitoring, and 24/7 response.
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-surface p-6 shadow-card">
            <div className="text-sm text-muted">Loading State</div>
            <Skeleton className="mt-4 h-20" />
          </div>
          <EmptyState
            title="No quotes yet"
            description="Kick off an intake to receive a tailored enterprise plan."
            ctaLabel="Start Intake"
          />
          <div
            role="alert"
            className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
          >
            Error state ready: pricing comparison failed to load.
          </div>
        </div>

        <div className="mt-8">
          <Toast
            title="Success"
            message="Pricing request delivered to the Infæmous Freight enterprise team."
          />
        </div>
      </div>
    </div>
  );
}
