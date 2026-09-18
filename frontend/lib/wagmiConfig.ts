import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet, walletConnectWallet, rainbowWallet } from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { supportedChains } from "./chains";

// A curated wallet list rather than RainbowKit's getDefaultConfig, which pulls in every
// supported wallet connector — including Coinbase's wallet connector, which pulls in Base
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

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors,
  transports: Object.fromEntries(supportedChains.map((chain) => [chain.id, http()])),
  ssr: true,
});
