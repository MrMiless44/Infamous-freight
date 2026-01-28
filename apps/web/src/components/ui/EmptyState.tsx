import { PrimaryButton } from "./PrimaryButton";

export function EmptyState({
  title,
  description,
  ctaLabel,
  onCta,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onCta?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-card">
      <div className="text-lg font-semibold">{title}</div>
      <div className="mt-2 text-sm text-muted">{description}</div>
      <div className="mt-4">
        <PrimaryButton onClick={onCta}>{ctaLabel}</PrimaryButton>
      </div>
    </div>
  );
}
