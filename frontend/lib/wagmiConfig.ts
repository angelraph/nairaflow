import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, walletConnectWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, fallback, http, type Transport } from "wagmi";
import { supportedChains } from "./chains";

// A curated wallet list rather than RainbowKit's getDefaultConfig, which pulls in every
// supported wallet connector. That includes Coinbase's wallet connector, which pulls in Base
// Account's x402 payment-protocol dependency chain (@coinbase/cdp-sdk -> @x402/evm/upto/client),
// a package that isn't actually published and breaks the webpack build. Coinbase Wallet users
// can still connect via WalletConnect or the browser-injected connector below.
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "nairaflow-dev";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rainbowWallet, walletConnectWallet, injectedWallet],
    },
  ],
  {
    appName: "NairaFlow",
    projectId,
  }
);

// Built dynamically since supportedChains' length depends on NEXT_PUBLIC_ENABLE_LOCAL_CHAIN.
// wagmi's createConfig wants a transports record keyed by the exact chain-id literal union,
// which Object.fromEntries can't express statically, so the shape is asserted here instead.
// Public RPC endpoints rate-limit, stall and occasionally go down, so Arbitrum Sepolia tries two independent public
// endpoints in turn, each with a short timeout, and the chain's default endpoint last.
// NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL (for example an Alchemy URL) takes priority when set.
const sepoliaRpcs: (string | undefined)[] = [
  process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || undefined,
  "https://arbitrum-sepolia-rpc.publicnode.com",
  undefined,
].filter((url, i) => i !== 0 || Boolean(url));

const transports = Object.fromEntries(
  supportedChains.map((chain) => [
    chain.id,
    chain.id === 421614 ? fallback(sepoliaRpcs.map((url) => http(url, { timeout: 8_000 }))) : http(undefined, { timeout: 12_000 }),
  ])
) as Record<
  (typeof supportedChains)[number]["id"],
  Transport
>;

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports,
  ssr: true,
});
