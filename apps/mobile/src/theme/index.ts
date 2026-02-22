// apps/mobile/src/theme/index.ts
// Centralized theme tokens for professional freight-grade UI.

export const colors = {
  primary: "#0f2a4a",
  primaryLight: "#1f3b62",
  primaryDark: "#091a2f",
  secondary: "#c49a3a",
  background: "#f3f5f7",
  surface: "#ffffff",
  surfaceAlt: "#f8fafc",
  text: "#0f172a",
  textSecondary: "#475569",
  border: "#e2e8f0",
  white: "#ffffff",
  black: "#0b1220",
  gray50: "#f8fafc",
  gray100: "#f1f5f9",
  gray200: "#e2e8f0",
  gray300: "#cbd5e1",
  gray400: "#94a3b8",
  gray500: "#64748b",
  gray600: "#475569",
  gray700: "#334155",
  gray800: "#1f2937",
  gray900: "#111827",
  success: "#16a34a",
  successLight: "#dcfce7",
  warning: "#d97706",
  warningLight: "#fff7ed",
  info: "#2563eb",
  danger: "#dc2626",
  dangerLight: "#fee2e2",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
  },
  button: {
    fontSize: 14,
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
};
