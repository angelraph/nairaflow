"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useConfig, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { Address } from "viem";
import { goalVaultAbi, erc20Abi } from "@/lib/abi";
import { formatToken, formatAddress, formatDate, parseToken } from "@/lib/format";
import { PolicyPanel } from "@/components/PolicyPanel";

export default function VaultDetailPage() {
  const params = useParams();
  const address = params.address as Address;
  const { address: account } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("50");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data, refetch } = useReadContracts({
    contracts: [
      { address, abi: goalVaultAbi, functionName: "token" },
      { address, abi: goalVaultAbi, functionName: "owner" },
      { address, abi: goalVaultAbi, functionName: "destination" },
      { address, abi: goalVaultAbi, functionName: "unlockDate" },
      { address, abi: goalVaultAbi, functionName: "maxPerPeriod" },
      { address, abi: goalVaultAbi, functionName: "periodLength" },
      { address, abi: goalVaultAbi, functionName: "totalDeposited" },
      { address, abi: goalVaultAbi, functionName: "totalWithdrawn" },
      { address, abi: goalVaultAbi, functionName: "availableNow" },
    ],
    query: { refetchInterval: 8000 },
  });

  const [token, owner, destination, unlockDate, maxPerPeriod, periodLength, totalDeposited, totalWithdrawn, availableNow] = data ?? [];
  const tokenAddress = token?.result as Address | undefined;
  const isOwner = account && owner?.result && (owner.result as string).toLowerCase() === account.toLowerCase();

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

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && tokenAddress ? [account, address] : undefined,
    query: { enabled: Boolean(account && tokenAddress) },
  });

  async function run(key: string, fn: () => Promise<`0x${string}`>) {
    setPending(key);
    try {
      const hash = await fn();
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(null);
    }
  }

  async function handleDeposit() {
    if (!tokenAddress) return;
    const amount = parseToken(depositAmount, decimals);
    if ((allowance ?? 0n) < amount) {
      await run("approve", () => writeContractAsync({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [address, amount] }));
    }
    await run("deposit", () => writeContractAsync({ address, abi: goalVaultAbi, functionName: "deposit", args: [amount] }));
  }

  async function handleWithdraw() {
    const amount = parseToken(withdrawAmount, decimals);
    await run("withdraw", () => writeContractAsync({ address, abi: goalVaultAbi, functionName: "withdraw", args: [amount] }));
  }

  if (!data) {
    return <p className="text-sm text-ink/60">Loading vault...</p>;
  }

  const unlocked = unlockDate?.result ? Number(unlockDate.result) * 1000 <= Date.now() : false;
  const hasAllowance = Boolean(maxPerPeriod?.result && (maxPerPeriod.result as bigint) > 0n);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-sm text-ink/50">{address}</h1>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatToken(totalDeposited?.result as bigint, decimals)} {symbol} deposited
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${unlocked ? "bg-positive/10 text-positive" : "bg-warn/10 text-warn"}`}>
          {unlocked ? "unlocked" : "locked"}
        </span>
      </div>

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Owner" value={owner?.result ? formatAddress(owner.result as string) : "-"} />
        <Stat label="Destination" value={destination?.result ? formatAddress(destination.result as string) : "-"} />
        <Stat label="Unlocks" value={unlockDate?.result ? formatDate(Number(unlockDate.result)) : "-"} />
        <Stat label="Available now" value={`${formatToken(availableNow?.result as bigint, decimals)} ${symbol}`} />
      </div>

      {hasAllowance && (
        <p className="text-sm text-ink/60">
          Early withdrawals allowed up to {formatToken(maxPerPeriod?.result as bigint, decimals)} {symbol} every{" "}
          {Number(periodLength?.result ?? 0) / 86400} days.
        </p>
      )}

      <div className="card flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink">Top up this vault</h2>
        <div className="flex gap-3">
          <input className="input" type="number" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
          <button className="btn-primary" disabled={pending !== null} onClick={handleDeposit}>
            {pending ? "Working..." : `Deposit ${symbol}`}
          </button>
        </div>
        <p className="text-xs text-ink/50">Anyone can fund this vault, which is useful if you&apos;re sending savings to someone else.</p>
      </div>

      {isOwner && (
        <div className="card flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-ink">Withdraw</h2>
          <div className="flex gap-3">
            <input className="input" type="number" min="0" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            <button className="btn-primary" disabled={pending !== null || !withdrawAmount} onClick={handleWithdraw}>
              {pending ? "Working..." : "Withdraw"}
            </button>
          </div>
        </div>
      )}

      <PolicyPanel target={address} decimals={decimals} symbol={symbol} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink/50">{label}</p>
      <p className="text-lg font-medium text-ink">{value}</p>
    </div>
  );
}
