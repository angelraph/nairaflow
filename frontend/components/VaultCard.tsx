"use client";

import Link from "next/link";
import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { goalVaultAbi, erc20Abi } from "@/lib/abi";
import { formatToken, formatAddress, formatDate } from "@/lib/format";

export function VaultCard({ address }: { address: Address }) {
  const { data } = useReadContracts({
    contracts: [
      { address, abi: goalVaultAbi, functionName: "token" },
      { address, abi: goalVaultAbi, functionName: "unlockDate" },
      { address, abi: goalVaultAbi, functionName: "totalDeposited" },
      { address, abi: goalVaultAbi, functionName: "owner" },
    ],
  });

  const [token, unlockDate, totalDeposited, owner] = data ?? [];
  const tokenAddress = token?.result as Address | undefined;

  const { data: tokenMeta } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: erc20Abi, functionName: "symbol" },
          { address: tokenAddress, abi: erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: Boolean(tokenAddress) },
  });

  const symbol = (tokenMeta?.[0]?.result as string) ?? "";
  const decimals = (tokenMeta?.[1]?.result as number) ?? 6;
  const unlocked = unlockDate?.result ? Number(unlockDate.result) * 1000 <= Date.now() : false;

  return (
    <Link href={`/vaults/${address}`} className="card flex flex-col gap-3 transition hover:border-naira/40">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink/50">{formatAddress(address)}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${unlocked ? "bg-naira/10 text-naira" : "bg-amber-100 text-amber-800"}`}>
          {unlocked ? "unlocked" : "locked"}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-ink">{formatToken(totalDeposited?.result as bigint, decimals)}</span>
        <span className="text-sm text-ink/60">{symbol} deposited</span>
      </div>
      <div className="flex justify-between text-sm text-ink/70">
        <span>owner {owner?.result ? formatAddress(owner.result as string) : "-"}</span>
        <span>unlocks {unlockDate?.result ? formatDate(Number(unlockDate.result)) : "-"}</span>
      </div>
    </Link>
  );
}
