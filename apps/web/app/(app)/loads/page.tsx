import { PageAnalytics } from "../../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../../src/components/analytics/TrackedPrimaryButton";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { Skeleton } from "../../../src/components/ui/Skeleton";
import { Toast } from "../../../src/components/ui/Toast";

export default function LoadsPage() {
  return (
    <div className="grid gap-6">
      <PageAnalytics eventName="app_loads_view" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted">
            Loads
          </div>
          <div className="text-2xl font-semibold">Active Freight Queue</div>
        </div>
        <TrackedPrimaryButton eventName="app_loads_primary_cta">
          Create Load
        </TrackedPrimaryButton>
      </div>

      <div className="rounded-2xl bg-surface p-6 shadow-card">
        <div className="text-lg font-semibold">Priority Dispatch</div>
        <div className="mt-2 text-sm text-muted">
          Pipeline summary and lane performance analytics.
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="text-sm text-muted">Loading State</div>
          <Skeleton className="mt-4 h-24" />
        </div>
        <EmptyState
          title="No loads queued"
          description="Create a load or import a CSV to begin dispatch operations."
          ctaLabel="Import Loads"
        />
        <div
          role="alert"
          className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
        >
          Error state ready: load queue sync failed.
        </div>
      </div>

      <Toast
        title="Success"
        message="Load manifest locked. Notifications sent to dispatch partners."
      />
    </div>
  );
}
