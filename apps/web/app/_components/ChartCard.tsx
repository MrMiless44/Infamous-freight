import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/** Simple bar-chart visual built from divs, used when no children are provided. */
function PlaceholderBarChart() {
  const bars = [40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 68];
  return (
    <div className="flex h-40 items-end gap-1.5 pt-4">
      {bars.map((height, i) => (
        <div key={i} className="flex-1">
          <div
            className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
            style={{ height: `${height}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export default function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        )}
      </div>

      {/* Content */}
      <div>{children ?? <PlaceholderBarChart />}</div>
    </div>
  );
}
