type Status = "Active" | "At Risk" | "Needs Review";

const styles: Record<Status, string> = {
  Active: "bg-success-500/15 text-success-500",
  "At Risk": "bg-danger-500/15 text-danger-500",
  "Needs Review": "bg-warning-500/15 text-warning-500",
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs ${styles[status]}`}>
      {status}
    </span>
  );
}
