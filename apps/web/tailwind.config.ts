import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: { "2xl": "16px", "3xl": "24px" },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.28)",
        float: "0 18px 60px rgba(0,0,0,0.35)",
      },
      colors: {
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        crimson: { 900: "#8B0000" },
        gold: { 500: "#D4AF37" },
        violet: { 600: "#6A0DAD" },
        success: { 500: "#22C55E" },
        warning: { 500: "#F59E0B" },
        danger: { 500: "#EF4444" },
        info: { 500: "#3B82F6" },
      },
      transitionTimingFunction: { premium: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      transitionDuration: { fast: "150ms", base: "220ms" },
    },
  },
  plugins: [],
} satisfies Config;
