import { PageAnalytics } from "../../../src/components/analytics/PageAnalytics";
import { TrackedPrimaryButton } from "../../../src/components/analytics/TrackedPrimaryButton";
import { GenesisPanel } from "../../../src/components/genesis/GenesisPanel";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { KPIStat } from "../../../src/components/ui/KPIStat";
import { Skeleton } from "../../../src/components/ui/Skeleton";
import { Toast } from "../../../src/components/ui/Toast";

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <PageAnalytics eventName="app_dashboard_view" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted">
            Operations
          </div>
          <div className="text-2xl font-semibold">Dispatch Dashboard</div>
        </div>
        <TrackedPrimaryButton eventName="app_dashboard_primary_cta">
          Launch Dispatch Run
        </TrackedPrimaryButton>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <KPIStat label="Revenue Today" value="$12,480" delta="+$840" hint="vs yesterday" />
        <KPIStat label="Active Loads" value="24" delta="+3" />
        <KPIStat label="On-time %" value="96.2%" delta="+0.8%" />
        <KPIStat label="AI Score" value="92" delta="+4" />
        <KPIStat label="Risk Alerts" value="2" delta="-1" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="text-lg font-semibold">Loads Needing Attention</div>
          <div className="mt-2 text-sm text-muted">Queue view (table goes here).</div>
        </div>
        <GenesisPanel />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-surface p-6 shadow-card">
          <div className="text-sm text-muted">Loading State</div>
          <Skeleton className="mt-4 h-24" />
        </div>
        <EmptyState
          title="No optimization runs"
          description="Genesis will appear here after the first dispatch simulation."
          ctaLabel="Start Simulation"
        />
        <div
          role="alert"
          className="rounded-2xl border border-danger-500/30 bg-danger-500/10 p-6 text-sm text-danger-500"
        >
          Error state ready: dispatch telemetry failed to update.
        </div>
      </div>

      <Toast
        title="Success"
        message="Dispatch plan saved. Genesis will monitor variance in real time."
      />
    </div>
  );
}
