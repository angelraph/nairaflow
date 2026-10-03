"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePublicClient } from "wagmi";
import type { Address, Log } from "viem";
import { agentExecutorAbi, savingsCircleFactoryAbi, goalVaultFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { PageHeader } from "@/components/PageHeader";
import { getLogsSafe } from "@/lib/logs";
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

const filters = [
  { id: "all", label: "Everything" },
  { id: "agent", label: "Agent" },
  { id: "circle-created", label: "Circles" },
  { id: "vault-created", label: "Vaults" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function formatGwei(wei: bigint): string {
  const gwei = Number(wei) / 1e9;
  return gwei < 1 ? gwei.toFixed(4) : gwei.toFixed(2);
}

export default function ActivityPage() {
  const { deployment, ready } = useDeployment();
  const publicClient = usePublicClient();
  const explorerUrl = publicClient?.chain?.blockExplorers?.default.url;
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");

  useEffect(() => {
    if (!ready || !deployment || !publicClient) return;

    let cancelled = false;
    setLoading(true);
    setFailed(false);

    async function load() {
      const fromBlock = BigInt(deployment!.deploymentBlock ?? 0);
      const [agentLogs, circleLogs, vaultLogs] = await Promise.all([
        getLogsSafe(publicClient!, {
          address: deployment!.agentExecutor as Address,
          event: agentExecutorAbi[0],
          fromBlock,
          toBlock: "latest",
        }),
        getLogsSafe(publicClient!, {
          address: deployment!.savingsCircleFactory as Address,
          event: savingsCircleFactoryAbi.find((f) => f.type === "event" && f.name === "CircleCreated")!,
          fromBlock,
          toBlock: "latest",
        }),
        getLogsSafe(publicClient!, {
          address: deployment!.goalVaultFactory as Address,
          event: goalVaultFactoryAbi.find((f) => f.type === "event" && f.name === "VaultCreated")!,
          fromBlock,
          toBlock: "latest",
        }),
      ]);

      const agentItems: ActivityItem[] = (agentLogs as (Log & { args: { target: Address; actionType: number; gasPriceWei: bigint } })[]).map(
        (log) => ({
          kind: "agent",
          blockNumber: log.blockNumber ?? 0n,
          txHash: log.transactionHash ?? "",
          label: actionTypeLabels[log.args.actionType] ?? "Agent action",
          target: log.args.target,
          href: log.args.actionType === 0 ? `/vaults/${log.args.target}` : `/circles/${log.args.target}`,
          meta: `Gas price when it acted: ${formatGwei(log.args.gasPriceWei)} gwei`,
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
        const all = [...agentItems, ...circleItems, ...vaultItems].sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0));
        setItems(all);
        setLoading(false);
      }
    }

    load().catch((err) => {
      console.error(err);
      if (!cancelled) {
        setFailed(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ready, deployment, publicClient]);

  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="Activity"
        title="Everything, straight from the chain."
        description="Every row is read from on-chain events. Nothing is simulated or stored off-chain, and each one links to its transaction."
      />

      <DeploymentBanner />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter activity">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={
              "rounded-full border px-4 py-1.5 text-sm transition " +
              (filter === f.id ? "border-accent bg-accent text-limeInk" : "border-sand text-slate hover:border-white/40 hover:text-ink")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-[84px] animate-pulse" />
          ))}
        </div>
      )}

      {failed && <p className="text-sm text-negative">Could not read the chain right now. Please reload in a moment.</p>}

      {!loading && !failed && ready && shown.length === 0 && (
        <p className="text-sm text-slate">{items.length === 0 ? "No activity on this network yet." : "Nothing matches this filter."}</p>
      )}

      {shown.length > 0 && (
        <ol className="flex flex-col gap-3">
          {shown.map((item, i) => (
            <li key={`${item.txHash}-${i}`} className="card flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <span
                  className={
                    "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full " +
                    (item.kind === "agent" ? "bg-positive" : item.kind === "circle-created" ? "bg-accent" : "bg-white/60")
                  }
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <Link href={item.href} className="text-lg tracking-tight text-ink transition hover:text-accent">
                    {item.kind === "agent" ? `Agent: ${item.label}` : item.label}
                  </Link>
                  <p className="font-mono text-xs text-slate">{formatAddress(item.target)}</p>
                  {item.meta && <p className="mt-1 text-xs text-slate">{item.meta}</p>}
                </div>
              </div>
              <span className="flex items-center gap-4 pl-6 text-xs text-slate sm:pl-0">
                <span className="num">block {item.blockNumber.toString()}</span>
                {explorerUrl && item.txHash && (
                  <a
                    href={`${explorerUrl}/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-sand px-3 py-1 text-accent transition hover:border-accent"
                  >
                    View tx
                  </a>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
