'use client';

import KPICard from '../../../_components/KPICard';
import { carriers } from '../../../_data/mock-data';

const complianceScore = 87;
const carriersCompliant = carriers.filter((c) => c.safetyScore >= 85).length;
const documentsExpiring = 4;
const outstandingIssues = 3;

const scorecardItems = [
  {
    title: 'Overall Score',
    value: `${complianceScore}%`,
    change: 2,
    changeType: 'up' as const,
    subtitle: 'compliance rate',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 1l2.5 6H19l-5.5 4 2 6.5L10 13.5 4.5 17.5l2-6.5L1 7h6.5z" />
      </svg>
    ),
  },
  {
    title: 'Carriers Compliant',
    value: `${carriersCompliant}/${carriers.length}`,
    change: 1,
    changeType: 'up' as const,
    subtitle: 'meeting standards',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10l5 5L17 5" /></svg>
    ),
  },
  {
    title: 'Documents Expiring',
    value: documentsExpiring,
    change: 2,
    changeType: 'up' as const,
    subtitle: 'within 90 days',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" /></svg>
    ),
  },
  {
    title: 'Outstanding Issues',
    value: outstandingIssues,
    change: 1,
    changeType: 'down' as const,
    subtitle: 'needs resolution',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="8" /><path d="M10 6v4M10 14h.01" /></svg>
    ),
  },
];

const carrierCompliance = carriers.map((c) => ({
  name: c.name,
  insuranceStatus: new Date(c.insuranceExpiry) > new Date() ? 'Valid' : 'Expired',
  insuranceExpiry: c.insuranceExpiry,
  mcAuthority: 'Active',
  safetyRating: c.safetyScore >= 90 ? 'Satisfactory' : c.safetyScore >= 80 ? 'Conditional' : 'Unsatisfactory',
  safetyScore: c.safetyScore,
  hazmatCert: c.name === 'Southern Tanker Lines' ? 'Certified' : 'N/A',
}));

const insuranceStatusColors: Record<string, string> = {
  Valid: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  Expired: 'bg-red-400/10 text-red-400 border-red-400/20',
};

const safetyRatingColors: Record<string, string> = {
  Satisfactory: 'text-emerald-400',
  Conditional: 'text-yellow-400',
  Unsatisfactory: 'text-red-400',
};

const hazmatColors: Record<string, string> = {
  Certified: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  'N/A': 'bg-slate-400/10 text-slate-500 border-slate-400/20',
};

// Documents expiring
const expiringDocuments = [
  { carrier: 'Great Plains Logistics', document: 'Insurance Certificate', expiresIn: 'Jun 30, 2025', daysLeft: 93, window: '90' },
  { carrier: 'Southern Tanker Lines', document: 'Insurance Certificate', expiresIn: 'Jul 10, 2025', daysLeft: 103, window: '90' },
  { carrier: 'Heartland Carriers Inc', document: 'Carrier Contract', expiresIn: 'Feb 15, 2025', daysLeft: -42, window: 'Expired' },
  { carrier: 'Southern Tanker Lines', document: 'HazMat Permit', expiresIn: 'Aug 20, 2024', daysLeft: 145, window: '90' },
];

// Action items
const actionItems = [
  { id: 1, priority: 'high', description: 'Renew Heartland Carriers Inc contract - expired 42 days ago', assignee: 'Alex Mercer' },
  { id: 2, priority: 'high', description: 'Review Southern Tanker Lines HazMat permit renewal', assignee: 'Rachel Torres' },
  { id: 3, priority: 'medium', description: 'Schedule Great Plains Logistics insurance review before June expiry', assignee: 'Kevin Shaw' },
  { id: 4, priority: 'medium', description: 'Audit Pacific Northwest Express safety records - score below 90', assignee: 'Alex Mercer' },
  { id: 5, priority: 'low', description: 'Update compliance documentation templates for Q2', assignee: 'Rachel Torres' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-red-400/10 text-red-400 border-red-400/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  low: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
};

function getWindowBadge(window: string): string {
  if (window === 'Expired') return 'bg-red-400/10 text-red-400 border-red-400/20';
  if (window === '30') return 'bg-red-400/10 text-red-400 border-red-400/20';
  if (window === '60') return 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20';
  return 'bg-blue-400/10 text-blue-400 border-blue-400/20';
}

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Compliance Overview</h1>
        <p className="text-sm text-slate-400">Regulatory compliance and carrier documentation</p>
      </div>

      {/* Scorecard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {scorecardItems.map((item) => (
          <KPICard key={item.title} {...item} />
        ))}
      </div>

      {/* Carrier Compliance Table */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-white">Carrier Compliance Status</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#161b22]">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Carrier</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Insurance</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">MC Authority</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Safety Rating</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Safety Score</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">HazMat Cert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {carrierCompliance.map((carrier) => (
                <tr key={carrier.name} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-medium text-slate-200">{carrier.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${insuranceStatusColors[carrier.insuranceStatus]}`}>
                        {carrier.insuranceStatus}
                      </span>
                      <span className="text-[10px] text-slate-500">Exp: {carrier.insuranceExpiry}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full border bg-emerald-400/10 border-emerald-400/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                      {carrier.mcAuthority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${safetyRatingColors[carrier.safetyRating]}`}>
                      {carrier.safetyRating}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-slate-800">
                        <div
                          className={`h-2 rounded-full ${carrier.safetyScore >= 90 ? 'bg-emerald-500' : carrier.safetyScore >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${carrier.safetyScore}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-300">{carrier.safetyScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${hazmatColors[carrier.hazmatCert]}`}>
                      {carrier.hazmatCert}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents Expiring + Action Items */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Documents Expiring */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Documents Expiring</h3>
          <div className="space-y-3">
            {expiringDocuments.map((doc, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-slate-800/60 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{doc.document}</p>
                  <p className="text-xs text-slate-400">{doc.carrier}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {doc.daysLeft < 0 ? `Expired ${Math.abs(doc.daysLeft)} days ago` : `Expires: ${doc.expiresIn}`}
                  </p>
                </div>
                <span className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getWindowBadge(doc.window)}`}>
                  {doc.window === 'Expired' ? 'Expired' : `${doc.daysLeft}d`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="rounded-xl border border-slate-800 bg-[#161b22] p-5">
          <h3 className="mb-4 text-sm font-semibold text-white">Action Items</h3>
          <div className="space-y-3">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-slate-800/60 p-3">
                <span className={`mt-0.5 inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityColors[item.priority]}`}>
                  {item.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300">{item.description}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Assigned to: {item.assignee}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
