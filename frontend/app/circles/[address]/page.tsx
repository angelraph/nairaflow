"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useConfig, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { Address } from "viem";
import { savingsCircleAbi, erc20Abi, CircleStatus } from "@/lib/abi";
import { formatToken, formatAddress, formatCountdown } from "@/lib/format";

const statusLabels: Record<number, string> = {
  [CircleStatus.Created]: "Filling up",
  [CircleStatus.Active]: "Active",
  [CircleStatus.Finished]: "Finished",
  [CircleStatus.Cancelled]: "Cancelled",
};

export default function CircleDetailPage() {
  const params = useParams();
  const address = params.address as Address;
  const { address: account } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);

  const { data, refetch } = useReadContracts({
    contracts: [
      { address, abi: savingsCircleAbi, functionName: "status" },
      { address, abi: savingsCircleAbi, functionName: "token" },
      { address, abi: savingsCircleAbi, functionName: "contributionAmount" },
      { address, abi: savingsCircleAbi, functionName: "securityDeposit" },
      { address, abi: savingsCircleAbi, functionName: "maxMembers" },
      { address, abi: savingsCircleAbi, functionName: "currentRound" },
      { address, abi: savingsCircleAbi, functionName: "roundDeadline" },
      { address, abi: savingsCircleAbi, functionName: "unclaimedPool" },
      { address, abi: savingsCircleAbi, functionName: "getMembers" },
    ],
    query: { refetchInterval: 8000 },
  });

  const [status, token, contributionAmount, securityDeposit, maxMembers, currentRound, roundDeadline, unclaimedPool, members] =
    data ?? [];

  const tokenAddress = token?.result as Address | undefined;
  const memberList = (members?.result as Address[]) ?? [];
  const statusValue = status?.result as number | undefined;
  const currentRoundValue = Number(currentRound?.result ?? 0);

  const { data: tokenMeta } = useReadContracts({
    contracts: tokenAddress ? [{ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }, { address: tokenAddress, abi: erc20Abi, functionName: "decimals" }] : [],
    query: { enabled: Boolean(tokenAddress) },
  });
  const symbol = (tokenMeta?.[0]?.result as string) ?? "";
  const decimals = (tokenMeta?.[1]?.result as number) ?? 6;

  const { data: memberData } = useReadContracts({
    contracts: memberList.flatMap((m) => [
      { address, abi: savingsCircleAbi, functionName: "defaulted", args: [m] } as const,
      { address, abi: savingsCircleAbi, functionName: "depositBalance", args: [m] } as const,
      { address, abi: savingsCircleAbi, functionName: "pendingWithdrawal", args: [m] } as const,
      { address, abi: savingsCircleAbi, functionName: "hasContributed", args: [BigInt(currentRoundValue), m] } as const,
    ]),
    query: { enabled: memberList.length > 0 },
  });

  const { data: myAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && tokenAddress ? [account, address] : undefined,
    query: { enabled: Boolean(account && tokenAddress) },
  });

  const isMember = account ? memberList.some((m) => m.toLowerCase() === account.toLowerCase()) : false;
  const myPendingWithdrawal =
    account && memberData
      ? (memberData[memberList.findIndex((m) => m.toLowerCase() === account.toLowerCase()) * 4 + 2]?.result as bigint | undefined)
      : undefined;

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

  async function handleJoin() {
    if (!tokenAddress || !securityDeposit?.result) return;
    const depositAmount = securityDeposit.result as bigint;
    if (depositAmount > 0n && (myAllowance ?? 0n) < depositAmount) {
      await run("approve", () =>
        writeContractAsync({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [address, depositAmount] })
      );
    }
    await run("join", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "join" }));
  }

  async function handleContribute() {
    if (!tokenAddress || !contributionAmount?.result) return;
    const amount = contributionAmount.result as bigint;
    if ((myAllowance ?? 0n) < amount) {
      await run("approve", () =>
        writeContractAsync({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [address, amount] })
      );
    }
    await run("contribute", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "contribute" }));
  }

  if (!data) {
    return <p className="text-sm text-ink/60">Loading circle...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono text-sm text-ink/50">{address}</h1>
          <p className="mt-1 text-2xl font-semibold text-ink">
            {formatToken(contributionAmount?.result as bigint, decimals)} {symbol} / round
          </p>
        </div>
        {statusValue !== undefined && (
          <span className="rounded-full bg-naira/10 px-3 py-1 text-sm font-medium text-naira">{statusLabels[statusValue]}</span>
        )}
      </div>

      <div className="card grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Members" value={`${memberList.length} / ${maxMembers?.result?.toString() ?? "-"}`} />
        <Stat label="Round" value={statusValue === CircleStatus.Active ? `${currentRoundValue + 1} of ${maxMembers?.result}` : "-"} />
        <Stat
          label="Round closes"
          value={statusValue === CircleStatus.Active ? formatCountdown(Number(roundDeadline?.result ?? 0), Math.floor(Date.now() / 1000)) : "-"}
        />
        <Stat label="Unclaimed pool" value={`${formatToken(unclaimedPool?.result as bigint, decimals)} ${symbol}`} />
      </div>

      <div className="card flex flex-wrap gap-3">
        {statusValue === CircleStatus.Created && !isMember && (
          <button className="btn-primary" disabled={pending !== null} onClick={handleJoin}>
            {pending ? "Working..." : "Join circle"}
          </button>
        )}
        {statusValue === CircleStatus.Created && isMember && (
          <button
            className="btn-secondary"
            disabled={pending !== null}
            onClick={() => run("leave", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "leave" }))}
          >
            Leave circle
          </button>
        )}
        {statusValue === CircleStatus.Active && isMember && (
          <button className="btn-primary" disabled={pending !== null} onClick={handleContribute}>
            {pending ? "Working..." : "Contribute this round"}
          </button>
        )}
        {statusValue === CircleStatus.Active && (
          <button
            className="btn-secondary"
            disabled={pending !== null}
            onClick={() => run("resolve", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "resolveRound" }))}
          >
            Resolve round
          </button>
        )}
        {myPendingWithdrawal !== undefined && myPendingWithdrawal > 0n && (
          <button
            className="btn-primary"
            disabled={pending !== null}
            onClick={() => run("withdraw", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "withdrawPayout" }))}
          >
            Withdraw {formatToken(myPendingWithdrawal, decimals)} {symbol}
          </button>
        )}
        {statusValue === CircleStatus.Finished && Boolean(unclaimedPool?.result) && (unclaimedPool?.result as bigint) > 0n && (
          <button
            className="btn-secondary"
            disabled={pending !== null}
            onClick={() => run("distribute", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "distributeUnclaimedPool" }))}
          >
            Distribute unclaimed pool
          </button>
        )}
      </div>

      <div className="card">
        <h2 className="mb-3 text-lg font-semibold text-ink">Members</h2>
        <div className="flex flex-col divide-y divide-sand">
          {memberList.map((member, i) => {
            const defaulted = memberData?.[i * 4]?.result as boolean | undefined;
            const deposit = memberData?.[i * 4 + 1]?.result as bigint | undefined;
            const owed = memberData?.[i * 4 + 2]?.result as bigint | undefined;
            const contributed = memberData?.[i * 4 + 3]?.result as boolean | undefined;

            return (
              <div key={member} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-ink/70">{formatAddress(member)}</span>
                  {account?.toLowerCase() === member.toLowerCase() && (
                    <span className="rounded bg-naira/10 px-1.5 py-0.5 text-xs text-naira">you</span>
                  )}
                  {defaulted && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">defaulted</span>}
                  {statusValue === CircleStatus.Active && !defaulted && (
                    <span className={contributed ? "text-xs text-naira" : "text-xs text-ink/40"}>
                      {contributed ? "contributed" : "not yet"}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-ink/60">
                  <span>deposit {formatToken(deposit, decimals)}</span>
                  {owed !== undefined && owed > 0n && <span className="text-naira">owed {formatToken(owed, decimals)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
