"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState } from "react";
import { wagmiConfig } from "@/lib/wagmiConfig";

// Matches the app's own dark institutional palette (see tailwind.config.ts) rather than
// RainbowKit's default light theme, which otherwise looks jarring against the rest of the app.
const rainbowKitTheme = darkTheme({
  accentColor: "#3B82F6",
  accentColorForeground: "#FFFFFF",
  borderRadius: "medium",
  fontStack: "system",
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rainbowKitTheme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
