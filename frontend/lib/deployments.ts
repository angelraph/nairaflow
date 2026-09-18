import type { Address } from "viem";
import deployment421614 from "@/deployments/421614.json";
import deployment46630 from "@/deployments/46630.json";
import deployment31337 from "@/deployments/31337.json";

export interface Deployment {
  chainId: number;
  name: string;
  stablecoinRegistry: Address | "";
  policyManager: Address | "";
  agentExecutor: Address | "";
  savingsCircleFactory: Address | "";
  goalVaultFactory: Address | "";
  usdc: Address | "";
  usdg: Address | "";
}

const deployments: Record<number, Deployment> = {
  421614: deployment421614 as Deployment,
  46630: deployment46630 as Deployment,
  31337: deployment31337 as Deployment,
};

export function getDeployment(chainId: number): Deployment | undefined {
  return deployments[chainId];
}

/** True once every core contract address has been filled in by a real deploy for this chain. */
export function isDeploymentReady(chainId: number): boolean {
  const d = deployments[chainId];
  if (!d) return false;
  return Boolean(d.stablecoinRegistry && d.policyManager && d.agentExecutor && d.savingsCircleFactory && d.goalVaultFactory);
}
