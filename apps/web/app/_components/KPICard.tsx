import type { ReactNode } from 'react';

type ChangeType = 'up' | 'down' | 'neutral';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: ChangeType;
  icon?: ReactNode;
  subtitle?: string;
}

const changeConfig: Record<ChangeType, { color: string; arrow: string }> = {
  up: { color: 'text-emerald-400', arrow: '\u2191' },
  down: { color: 'text-red-400', arrow: '\u2193' },
  neutral: { color: 'text-slate-400', arrow: '\u2192' },
};

export default function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  subtitle,
}: KPICardProps) {
  const config = changeConfig[changeType];

  return (
    <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5 transition-colors hover:border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{value}</p>

          {(change != null || subtitle) && (
            <div className="mt-2 flex items-center gap-2">
              {change != null && (
                <span className={`flex items-center gap-0.5 text-sm font-medium ${config.color}`}>
                  <span>{config.arrow}</span>
                  <span>{Math.abs(change)}%</span>
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-slate-500">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
