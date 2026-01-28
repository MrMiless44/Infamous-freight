import { PrimaryButton } from "../ui/PrimaryButton";

export function TopBar() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-muted">Operational Overview</div>
        <div className="text-xl font-semibold">Command Center</div>
      </div>
      <div className="flex items-center gap-2">
        <a className="text-sm text-muted hover:text-text" href="/genesis">
          Open Genesis
        </a>
        <PrimaryButton>Start Free</PrimaryButton>
      </div>
    </div>
  );
}
