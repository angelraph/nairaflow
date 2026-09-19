"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import type { Address, Log } from "viem";
import { agentExecutorAbi, savingsCircleFactoryAbi, goalVaultFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { formatAddress } from "@/lib/format";

interface ActivityItem {
  kind: "agent" | "circle-created" | "vault-created";
  blockNumber: bigint;
  txHash: string;
  label: string;
  target: Address;
  href: string;
  meta?: string;
}

const actionTypeLabels = ["Vault release", "Circle round resolved"];

export default function ActivityPage() {
  const { deployment, ready } = useDeployment();
  const publicClient = usePublicClient();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || !deployment || !publicClient) return;

    let cancelled = false;
    setLoading(true);

    async function load() {
      const [agentLogs, circleLogs, vaultLogs] = await Promise.all([
        publicClient!.getLogs({
          address: deployment!.agentExecutor as Address,
          event: agentExecutorAbi[0],
          fromBlock: 0n,
          toBlock: "latest",
        }),
        publicClient!.getLogs({
          address: deployment!.savingsCircleFactory as Address,
          event: savingsCircleFactoryAbi.find((f) => f.type === "event" && f.name === "CircleCreated")!,
          fromBlock: 0n,
          toBlock: "latest",
        }),
        publicClient!.getLogs({
          address: deployment!.goalVaultFactory as Address,
          event: goalVaultFactoryAbi.find((f) => f.type === "event" && f.name === "VaultCreated")!,
          fromBlock: 0n,
          toBlock: "latest",
        }),
      ]);

      const agentItems: ActivityItem[] = (agentLogs as (Log & { args: { target: Address; actionType: number; gasPriceWei: bigint } })[]).map(
        (log) => ({
          kind: "agent",
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? "",
          label: `Agent: ${actionTypeLabels[log.args.actionType] ?? "action"}`,
          target: log.args.target,
          href: log.args.actionType === 0 ? `/vaults/${log.args.target}` : `/circles/${log.args.target}`,
          meta: `gas price at execution: ${log.args.gasPriceWei.toString()} wei`,
        })
      );

      const circleItems: ActivityItem[] = (circleLogs as (Log & { args: { circle: Address } })[]).map((log) => ({
        kind: "circle-created",
        blockNumber: log.blockNumber ?? 0n,
        txHash: log.transactionHash ?? "",
        label: "Circle created",
        target: log.args.circle,
        href: `/circles/${log.args.circle}`,
      }));

      const vaultItems: ActivityItem[] = (vaultLogs as (Log & { args: { vault: Address } })[]).map((log) => ({
        kind: "vault-created",
        blockNumber: log.blockNumber ?? 0n,
        txHash: log.transactionHash ?? "",
        label: "Vault created",
        target: log.args.vault,
        href: `/vaults/${log.args.vault}`,
      }));

      if (!cancelled) {
        const all = [...agentItems, ...circleItems, ...vaultItems].sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : -1));
        setItems(all);
        setLoading(false);
      }
    }

    load().catch((err) => {
      console.error(err);
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [ready, deployment, publicClient]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Activity</h1>
      <p className="text-sm text-ink/60">
        Every item here is read directly from on-chain events. Nothing here is simulated or stored off-chain.
      </p>

      <DeploymentBanner />

      {loading && <p className="text-sm text-ink/60">Loading on-chain history...</p>}

      {!loading && ready && items.length === 0 && <p className="text-sm text-ink/60">No activity yet.</p>}

      <div className="flex flex-col divide-y divide-sand">
        {items.map((item, i) => (
          <div key={`${item.txHash}-${i}`} className="flex items-center justify-between py-3 text-sm">
            <div>
              <Link href={item.href} className="font-medium text-ink hover:text-accent">
                {item.label}
              </Link>
              <p className="font-mono text-xs text-ink/50">{formatAddress(item.target)}</p>
              {item.meta && <p className="text-xs text-ink/40">{item.meta}</p>}
            </div>
            <span className="text-xs text-ink/50">block {item.blockNumber.toString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
