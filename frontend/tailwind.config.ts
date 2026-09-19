import type { Config } from "tailwindcss";

// Institutional dark palette: recommended for product/dashboard surfaces per the design
// system spec. Token names kept stable where possible (ink, paper, sand) so existing
// opacity-modifier usage (text-ink/60, border-sand, etc.) keeps working unchanged; only the
// underlying values and the accent/positive split are new.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#0F1115", // main background
        surface: "#181B21", // cards, panels
        elevated: "#1F232B", // modals, hover states
        sand: "#2A2F38", // borders/dividers
        ink: "#F1F3F5", // primary text
        accent: "#3B82F6", // primary actions, links, info
        accentDark: "#2563EB", // accent hover/active
        positive: "#22C55E", // success/active/unlocked states
        negative: "#EF4444", // errors, defaulted states
        warn: "#F59E0B", // caution, locked states
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
