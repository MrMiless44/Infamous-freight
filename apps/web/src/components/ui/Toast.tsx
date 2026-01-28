type ToastProps = {
  title: string;
  message: string;
  variant?: "success" | "info" | "warning" | "danger";
};

const variants: Record<NonNullable<ToastProps["variant"]>, string> = {
  success: "border-success-500/40 bg-success-500/10 text-success-500",
  info: "border-info-500/40 bg-info-500/10 text-info-500",
  warning: "border-warning-500/40 bg-warning-500/10 text-warning-500",
  danger: "border-danger-500/40 bg-danger-500/10 text-danger-500",
};

export function Toast({ title, message, variant = "success" }: ToastProps) {
  return (
    <div
      role="status"
      className={`rounded-2xl border p-4 text-sm shadow-card ${variants[variant]}`}
    >
      <div className="text-xs uppercase tracking-wide">{title}</div>
      <div className="mt-1 text-sm text-text">{message}</div>
    </div>
  );
}
