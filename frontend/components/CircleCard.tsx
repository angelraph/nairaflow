"use client";

import Link from "next/link";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { savingsCircleAbi, erc20Abi, CircleStatus } from "@/lib/abi";
import { formatToken, formatAddress, formatCountdown } from "@/lib/format";
import { circleStatusLabels, circleStatusStyles } from "@/lib/circleStatus";

export function CircleCard({ address }: { address: Address }) {
  const { data } = useReadContracts({
    contracts: [
      { address, abi: savingsCircleAbi, functionName: "status" },
      { address, abi: savingsCircleAbi, functionName: "contributionAmount" },
      { address, abi: savingsCircleAbi, functionName: "maxMembers" },
      { address, abi: savingsCircleAbi, functionName: "memberCount" },
      { address, abi: savingsCircleAbi, functionName: "roundDeadline" },
      { address, abi: savingsCircleAbi, functionName: "currentRound" },
      { address, abi: savingsCircleAbi, functionName: "token" },
    ],
  });

  const [status, contributionAmount, maxMembers, memberCount, roundDeadline, currentRound, token] = data ?? [];
  const tokenAddress = token?.result as Address | undefined;

  const { data: tokenData } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: erc20Abi, functionName: "symbol" },
          { address: tokenAddress, abi: erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: Boolean(tokenAddress) },
  });

  const [symbolResult, decimalsResult] = tokenData ?? [];
  const symbol = (symbolResult?.result as string) ?? "";
  const decimals = (decimalsResult?.result as number) ?? 6;
  const statusValue = status?.result as number | undefined;

  return (
    <Link href={`/circles/${address}`} className="card flex flex-col gap-3 transition hover:border-accent/40">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink/50">{formatAddress(address)}</span>
        {statusValue !== undefined && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${circleStatusStyles[statusValue]}`}>
            {circleStatusLabels[statusValue]}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-ink">{formatToken(contributionAmount?.result as bigint, decimals)}</span>
        <span className="text-sm text-ink/60">{symbol} / round</span>
      </div>
      <div className="flex justify-between text-sm text-ink/70">
        <span>
          {memberCount?.result?.toString() ?? "-"} / {maxMembers?.result?.toString() ?? "-"} members
        </span>
        {statusValue === CircleStatus.Active && (
          <span>
            round {currentRound?.result?.toString()} · {formatCountdown(Number(roundDeadline?.result ?? 0), Math.floor(Date.now() / 1000))}
          </span>
        )}
      </div>
    </Link>
  );
}
