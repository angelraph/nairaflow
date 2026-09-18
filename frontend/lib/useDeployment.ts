"use client";

import { useChainId } from "wagmi";
import { getDeployment, isDeploymentReady } from "./deployments";

export function useDeployment() {
  const chainId = useChainId();
  const deployment = getDeployment(chainId);
  const ready = isDeploymentReady(chainId);
  return { chainId, deployment, ready };
}
