type LoadStatus =
  | 'draft'
  | 'posted'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'delayed'
  | 'cancelled';

type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  },
  posted: {
    label: 'Posted',
    classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  assigned: {
    label: 'Assigned',
    classes: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/20',
  },
  picked_up: {
    label: 'Picked Up',
    classes: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
  },
  in_transit: {
    label: 'In Transit',
    classes: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  delivered: {
    label: 'Delivered',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  delayed: {
    label: 'Delayed',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-gray-400/10 text-gray-400 border-gray-400/20',
  },
  pending: {
    label: 'Pending',
    classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  },
  invoiced: {
    label: 'Invoiced',
    classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  paid: {
    label: 'Paid',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  overdue: {
    label: 'Overdue',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
  active: {
    label: 'Active',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  inactive: {
    label: 'Inactive',
    classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  },
  suspended: {
    label: 'Suspended',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
  available: {
    label: 'Available',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  on_route: {
    label: 'On Route',
    classes: 'bg-amber-400/10 text-amber-400 border-amber-400/20',
  },
  off_duty: {
    label: 'Off Duty',
    classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  },
  resting: {
    label: 'Resting',
    classes: 'bg-purple-400/10 text-purple-400 border-purple-400/20',
  },
  maintenance: {
    label: 'Maintenance',
    classes: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
  },
  out_of_service: {
    label: 'Out of Service',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
  valid: {
    label: 'Valid',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
  pending_review: {
    label: 'Pending Review',
    classes: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  },
  uploaded: {
    label: 'Uploaded',
    classes: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
  },
  verified: {
    label: 'Verified',
    classes: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20',
  },
  missing: {
    label: 'Missing',
    classes: 'bg-red-400/10 text-red-400 border-red-400/20',
  },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    classes: 'bg-slate-400/10 text-slate-400 border-slate-400/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${config.classes} ${sizeClasses[size]}`}
    >
      <span
        className={`mr-1.5 inline-block rounded-full ${
          size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'
        } bg-current opacity-80`}
      />
      {config.label}
    </span>
  );
}
