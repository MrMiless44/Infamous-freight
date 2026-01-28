type KPIStatProps = {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
};

export function KPIStat({ label, value, delta, hint }: KPIStatProps) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-card transition duration-base ease-premium">
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="font-mono text-3xl">{value}</div>
        {delta ? <div className="text-sm text-muted">{delta}</div> : null}
      </div>
      {hint ? <div className="mt-2 text-xs text-muted">{hint}</div> : null}
    </div>
  );
}
