import { defineChain } from "viem";
import { arbitrumSepolia } from "viem/chains";

// Robinhood Chain Testnet. Chain ID, RPC and explorer confirmed directly against
// docs.robinhood.com/chain/connecting, not assumed.
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ROBINHOOD_TESTNET_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com"] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: "https://explorer.testnet.chain.robinhood.com" },
  },
  testnet: true,
});

// Local Anvil node, used only during development to prove the full stack works against a
// real, freshly-deployed EVM before ever touching a public testnet. Never enabled in a
// production build.
export const localAnvil = defineChain({
  id: 31337,
  name: "Local (dev)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
});

export { arbitrumSepolia };

const enableLocalChain = process.env.NEXT_PUBLIC_ENABLE_LOCAL_CHAIN === "true";

export const supportedChains = enableLocalChain
  ? ([localAnvil, arbitrumSepolia, robinhoodTestnet] as const) // local first only for dev testing
  : ([arbitrumSepolia, robinhoodTestnet] as const);
