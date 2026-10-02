"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import type { Address } from "viem";
import { agentExecutorAbi, goalVaultFactoryAbi, savingsCircleFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";

export interface LastAgentAction {
  gasPriceWei: bigint;
  txHash: string;
  blockNumber: bigint;
  actionType: number;
}

/** Counts read straight from the chain for the selected network. Nothing here is typed in by hand. */
export function useLiveStats() {
  const { deployment, ready } = useDeployment();
  const publicClient = usePublicClient();

  const { data: circles } = useReadContract({
    address: deployment?.savingsCircleFactory as Address | undefined,
    abi: savingsCircleFactoryAbi,
    functionName: "getAllCircles",
    query: { enabled: ready },
  });
  const { data: vaults } = useReadContract({
    address: deployment?.goalVaultFactory as Address | undefined,
    abi: goalVaultFactoryAbi,
    functionName: "getAllVaults",
    query: { enabled: ready },
  });

  const [agent, setAgent] = useState<{ count: number; last?: LastAgentAction } | null>(null);

  useEffect(() => {
    if (!ready || !deployment || !publicClient) return;
    let cancelled = false;
    setAgent(null);

    publicClient
      .getLogs({
        address: deployment.agentExecutor as Address,
        event: agentExecutorAbi[0],
        fromBlock: BigInt(deployment.deploymentBlock ?? 0),
        toBlock: "latest",
      })
      .then((logs) => {
        if (cancelled) return;
        const last = logs[logs.length - 1] as
          | { args: { gasPriceWei: bigint; actionType: number }; transactionHash: string | null; blockNumber: bigint | null }
          | undefined;
        setAgent({
          count: logs.length,
          last: last
            ? {
                gasPriceWei: last.args.gasPriceWei,
                actionType: last.args.actionType,
                txHash: last.transactionHash ?? "",
                blockNumber: last.blockNumber ?? 0n,
              }
            : undefined,
        });
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setAgent({ count: 0 });
      });

    return () => {
      cancelled = true;
    };
  }, [ready, deployment, publicClient]);

  return {
    deployment,
    ready,
    circleCount: circles?.length,
    vaultCount: vaults?.length,
    agentActions: agent?.count,
    lastAgentAction: agent?.last,
  };
}
