import type { Config } from "tailwindcss";

// Three references mixed on purpose:
//  - Cosmos style file: near-black flat canvas, graphite cards, hairline borders, no shadows,
//    ghost pill controls, one weight with wide tracking.
//  - Wise: plain human language, big readable numerals, and a lime pill for the one primary action.
//  - Aave: a live stat strip in large numerals at the top of every dashboard view.
// Token names (paper, surface, sand, ink, accent) are kept so existing utility classes still work.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#000000", // canvas (Void)
        carbon: "#181818", // nav, footer, inputs
        surface: "#1e1f20", // cards (Graphite)
        elevated: "#262728", // hover states
        sand: "#333333", // hairline borders (Iron)
        slate: "#807f7f", // muted text
        ink: "#ffffff", // primary text
        accent: "#9fe870", // the one primary action color (Wise lime)
        accentDark: "#b4ef8f", // accent hover
        limeInk: "#163300", // text on the lime pill
        positive: "#22e2a8", // live and active state only (Signal Mint)
        negative: "#ff6b7a", // errors, defaulted
        warn: "#f5b84a", // caution, locked
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "20px",
        hero: "30px",
      },
      letterSpacing: {
        tightcaps: "0.08em",
      },
    },
  },
  plugins: [],
};

export default config;
