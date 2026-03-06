import type { GenesisAvatarProps } from "../types/genesis.types";

export function GenesisAvatar({
  title = "Genesis",
  subtitle = "Infamous Freight Assistant",
  status = "idle"
}: GenesisAvatarProps) {
  return (
    <div
      style={{
        borderRadius: 24,
        padding: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #22c55e, #14532d)"
        }}
      />
      <div>
        <div style={{ fontWeight: 700 }}>{title}</div>
        <div style={{ opacity: 0.8, fontSize: 14 }}>{subtitle}</div>
        <div style={{ opacity: 0.65, fontSize: 12 }}>Status: {status}</div>
      </div>
    </div>
  );
}
