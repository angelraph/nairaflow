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

  const members = Number(memberCount?.result ?? 0);
  const max = Number(maxMembers?.result ?? 0);
  const fill = max > 0 ? Math.min(100, Math.round((members / max) * 100)) : 0;

  return (
    <Link href={`/circles/${address}`} className="group card flex flex-col gap-6 transition hover:border-white/40">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-slate">{formatAddress(address)}</span>
        {statusValue !== undefined && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs ${circleStatusStyles[statusValue]}`}>
            {statusValue === CircleStatus.Active && <span className="live-dot h-1.5 w-1.5 rounded-full bg-positive" />}
            {circleStatusLabels[statusValue]}
          </span>
        )}
      </div>

      <div>
        <p className="num text-4xl text-ink">
          {formatToken(contributionAmount?.result as bigint, decimals)}
          <span className="ml-2 text-base text-slate">{symbol}</span>
        </p>
        <p className="mt-1 text-sm text-slate">each round</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="h-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={fill} aria-valuemin={0} aria-valuemax={100} aria-label="Seats filled">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${fill}%` }} />
        </div>
        <div className="flex items-center justify-between text-sm text-slate">
          <span>
            {memberCount?.result?.toString() ?? "-"} of {maxMembers?.result?.toString() ?? "-"} members
          </span>
          {statusValue === CircleStatus.Active && (
            <span className="text-ink/80">
              round {Number(currentRound?.result ?? 0) + 1} &middot; {formatCountdown(Number(roundDeadline?.result ?? 0), Math.floor(Date.now() / 1000))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
