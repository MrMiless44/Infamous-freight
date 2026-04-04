'use client';

import ChartCard from '../../../_components/ChartCard';

/* ---------- Performance Scorecard ---------- */
const scorecard = [
  {
    title: 'On-Time Rate',
    value: '95%',
    networkAvg: '91%',
    color: 'text-emerald-400',
    barColor: 'bg-emerald-500',
    barPercent: 95,
  },
  {
    title: 'Safety Score',
    value: '92/100',
    networkAvg: '85/100',
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    barPercent: 92,
  },
  {
    title: 'Customer Rating',
    value: '4.7/5',
    networkAvg: '4.2/5',
    color: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    barPercent: 94,
  },
  {
    title: 'Load Acceptance Rate',
    value: '88%',
    networkAvg: '78%',
    color: 'text-purple-400',
    barColor: 'bg-purple-500',
    barPercent: 88,
  },
];

/* ---------- Monthly trends ---------- */
const monthlyData = [
  { month: 'Oct', onTime: 91, safety: 88, rating: 90 },
  { month: 'Nov', onTime: 93, safety: 89, rating: 92 },
  { month: 'Dec', onTime: 90, safety: 91, rating: 91 },
  { month: 'Jan', onTime: 94, safety: 90, rating: 93 },
  { month: 'Feb', onTime: 93, safety: 92, rating: 94 },
  { month: 'Mar', onTime: 95, safety: 92, rating: 94 },
];

/* ---------- Improvement areas ---------- */
const improvements = [
  {
    area: 'Late Pickups',
    description: '3 late pickups this month. Focus on departure time management.',
    severity: 'medium',
    color: 'border-yellow-500/30 bg-yellow-500/5',
    textColor: 'text-yellow-400',
  },
  {
    area: 'Document Upload Speed',
    description: 'Average POD upload time is 4.2 hours. Target is under 2 hours.',
    severity: 'low',
    color: 'border-blue-500/30 bg-blue-500/5',
    textColor: 'text-blue-400',
  },
  {
    area: 'Communication Response Time',
    description: 'Average response to dispatch messages is 45 minutes. Target is under 15 minutes.',
    severity: 'medium',
    color: 'border-orange-500/30 bg-orange-500/5',
    textColor: 'text-orange-400',
  },
];

export default function CarrierPerformancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance Metrics</h1>
        <p className="text-sm text-slate-400">Track your performance and compare against network averages</p>
      </div>

      {/* Performance Scorecard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scorecard.map((metric) => (
          <div key={metric.title} className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
            <p className="text-xs font-medium text-slate-400">{metric.title}</p>
            <p className={`mt-2 text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${metric.barColor} transition-all`}
                style={{ width: `${metric.barPercent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Network Avg: {metric.networkAvg}</span>
              {metric.barPercent >= 90 ? (
                <span className="text-emerald-400">Above avg</span>
              ) : (
                <span className="text-yellow-400">Below avg</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="On-Time Rate Trend" subtitle="Last 6 months">
          <div className="flex h-44 items-end gap-3 pt-4">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all hover:from-emerald-500 hover:to-emerald-300"
                    style={{ height: `${(d.onTime / 100) * 160}px` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Safety Score Trend" subtitle="Last 6 months">
          <div className="flex h-44 items-end gap-3 pt-4">
            {monthlyData.map((d) => (
              <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition-all hover:from-blue-500 hover:to-blue-300"
                    style={{ height: `${(d.safety / 100) * 160}px` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500">{d.month}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Network Comparison */}
      <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">Comparison vs. Network Average</h3>
        <div className="space-y-4">
          {scorecard.map((metric) => (
            <div key={metric.title} className="flex items-center gap-4">
              <p className="w-40 flex-shrink-0 text-xs text-slate-400">{metric.title}</p>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${metric.barColor}`} style={{ width: `${metric.barPercent}%` }} />
                  </div>
                  <span className={`w-12 text-right text-xs font-medium ${metric.color}`}>{metric.value}</span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-slate-600" style={{ width: `${parseInt(metric.networkAvg)}%` }} />
                  </div>
                  <span className="w-12 text-right text-[10px] text-slate-500">{metric.networkAvg}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Areas for Improvement</h3>
        <div className="space-y-3">
          {improvements.map((item) => (
            <div key={item.area} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={item.textColor}>
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v3M8 10.5h.01" />
                </svg>
                <p className={`text-sm font-medium ${item.textColor}`}>{item.area}</p>
              </div>
              <p className="mt-1 ml-6 text-xs text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
