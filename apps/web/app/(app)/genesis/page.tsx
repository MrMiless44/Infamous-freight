import { PageAnalytics } from "../../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../../src/components/analytics/TrackedPrimaryButton";
import { GenesisPanel } from "../../../src/components/genesis/GenesisPanel";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { Skeleton } from "../../../src/components/ui/Skeleton";
import { Toast } from "../../../src/components/ui/Toast";

export default function GenesisPage() {
  return (
    <div className="grid gap-6">
      <PageAnalytics eventName="app_genesis_view" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted">
            Genesis AI
          </div>
          <div className="text-2xl font-semibold">Recommendation Engine</div>
        </div>
        <TrackedPrimaryButton eventName="app_genesis_primary_cta">
          Apply Recommendation
        </TrackedPrimaryButton>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <GenesisPanel />
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold">Genesis Contract</div>
          <div className="mt-2 text-sm text-muted">
            Confidence scores, impact deltas, and recommended actions are enforced
            per contract.
          </div>
          <div className="mt-4 rounded-2xl bg-white/5 p-4 text-xs text-muted">
            Output schema locked: confidence, impact, rationale, and action list.
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="text-sm text-muted">Loading State</div>
          <Skeleton className="mt-4 h-24" />
        </div>
        <EmptyState
          title="No recommendations"
          description="Connect the live telemetry feed to enable Genesis suggestions."
          ctaLabel="Connect Telemetry"
        />
        <div
          role="alert"
          className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
        >
          Error state ready: Genesis confidence feed delayed.
        </div>
      </div>

      <Toast
        title="Success"
        message="Genesis output applied. Dispatch optimization is now live."
      />
    </div>
  );
}
