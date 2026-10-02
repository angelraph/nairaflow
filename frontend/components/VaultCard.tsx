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
    <Link href={`/vaults/${address}`} className="group card flex flex-col gap-6 transition hover:border-white/40">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-slate">{formatAddress(address)}</span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs ${
            unlocked ? "border-positive/40 bg-positive/10 text-positive" : "border-warn/40 bg-warn/10 text-warn"
          }`}
        >
          {unlocked ? "Unlocked" : "Locked"}
        </span>
      </div>

      <div>
        <p className="num text-4xl text-ink">
          {formatToken(totalDeposited?.result as bigint, decimals)}
          <span className="ml-2 text-base text-slate">{symbol}</span>
        </p>
        <p className="mt-1 text-sm text-slate">deposited</p>
      </div>

      <div className="flex flex-col gap-1 border-t border-sand pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-slate">
          Owner <span className="font-mono text-ink/80">{owner?.result ? formatAddress(owner.result as string) : "-"}</span>
        </span>
        <span className="text-slate">
          Unlocks <span className="text-ink/80">{unlockDate?.result ? formatDate(Number(unlockDate.result)) : "-"}</span>
        </span>
      </div>
    </Link>
  );
}
