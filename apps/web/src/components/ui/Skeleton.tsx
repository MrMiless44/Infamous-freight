export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/5 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
        backgroundSize: "800px 100%",
        animation: "shimmer 1.2s infinite linear",
      }}
    />
  );
}
