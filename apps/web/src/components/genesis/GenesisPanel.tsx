import type { GenesisOutput } from "./genesisContract";
import { StatusPill } from "../ui/StatusPill";

const sample: GenesisOutput = {
  confidence: 92,
  impact: { timeSavedMinutes: 34, marginDeltaUsd: 180, riskDelta: "lower" },
  why: [
    "Driver availability matches ETA window",
    "Lower deadhead route",
    "Insurance risk score improves",
  ],
  actions: [
    { label: "Apply", actionId: "apply_route_opt" },
    { label: "Review", actionId: "review_details" },
    { label: "Dismiss", actionId: "dismiss" },
  ],
};

export function GenesisPanel() {
  const out = sample;

  return (
    <div className="rounded-2xl bg-surface p-6 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted">Genesis AI</div>
          <div className="text-lg font-semibold">Recommendation</div>
        </div>
        <StatusPill status={out.confidence >= 85 ? "Active" : "Needs Review"} />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-muted">Confidence</div>
          <div className="font-mono text-2xl">{out.confidence}</div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-muted">Impact</div>
          <div className="mt-1 text-sm">
            {out.impact.timeSavedMinutes
              ? `Time saved: ~${out.impact.timeSavedMinutes} min`
              : null}
            {out.impact.marginDeltaUsd
              ? ` • Margin: +$${out.impact.marginDeltaUsd}`
              : null}
            {out.impact.riskDelta ? ` • Risk: ${out.impact.riskDelta}` : null}
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4">
          <div className="text-xs text-muted">Why</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {out.why.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {out.actions.map((action) => (
          <button
            key={action.actionId}
            className={`rounded-2xl px-4 py-2 text-sm transition duration-base ease-premium ${
              action.label === "Apply"
                ? "bg-crimson-900 shadow-float hover:opacity-90"
                : "bg-white/5 text-muted hover:bg-white/10"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
