import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1115",
        paper: "#faf8f4",
        naira: "#0a7d4f",
        nairaDark: "#065a38",
        sand: "#e8e2d6",
      },
    },
  },
  plugins: [],
};

export default config;
