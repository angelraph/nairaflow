import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";

// Robinhood Chain Testnet. Chain ID, RPC and explorer confirmed directly against
// docs.robinhood.com/chain/connecting (2026-09-17), not assumed.
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

// Robinhood Chain mainnet (docs.robinhood.com/chain/connecting).
export const robinhoodMainnet = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.ROBINHOOD_MAINNET_RPC_URL ?? "https://rpc.mainnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://robinhoodchain.blockscout.com" },
  },
});

export { arbitrumSepolia };

export const supportedChains = [arbitrumSepolia, robinhoodTestnet, robinhoodMainnet] as const;
