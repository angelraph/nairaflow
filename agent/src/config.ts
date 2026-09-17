import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";
import type { Address } from "viem";
import { arbitrumSepolia, robinhoodTestnet } from "./chains.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface Deployment {
  chainId: number;
  name: string;
  stablecoinRegistry: Address;
  policyManager: Address;
  agentExecutor: Address;
  savingsCircleFactory: Address;
  goalVaultFactory: Address;
  usdc: Address;
  usdg: Address;
}

function loadDeployment(chainId: number): Deployment {
  const path = join(__dirname, "..", "deployments", `${chainId}.json`);
  const raw = JSON.parse(readFileSync(path, "utf-8"));

  const required: (keyof Deployment)[] = [
    "stablecoinRegistry",
    "policyManager",
    "agentExecutor",
    "savingsCircleFactory",
    "goalVaultFactory",
  ];
  const missing = required.filter((key) => !raw[key]);
  if (missing.length > 0) {
    throw new Error(
      `deployments/${chainId}.json is missing ${missing.join(", ")} — run the real deploy script for this chain ` +
        `and fill in the resulting addresses before starting the agent. The agent refuses to run against a chain ` +
        `it hasn't actually been deployed to, rather than silently doing nothing.`
    );
  }

  return raw as Deployment;
}

export const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY as `0x${string}` | undefined;
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 30_000);

// Agent v1 gas-awareness: for actions still inside their flexible window, wait for the current
// gas price to drop at or below this fraction of the agent's own rolling baseline before
// executing. 1.0 = execute at or below the recent average; lower is more patient.
export const GAS_PRICE_TARGET_RATIO = Number(process.env.GAS_PRICE_TARGET_RATIO ?? 0.9);

export const targets = [
  { chain: arbitrumSepolia, deployment: () => loadDeployment(arbitrumSepolia.id) },
  { chain: robinhoodTestnet, deployment: () => loadDeployment(robinhoodTestnet.id) },
];
