"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useConfig, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { Address } from "viem";
import { savingsCircleAbi, erc20Abi, CircleStatus } from "@/lib/abi";
import { formatToken, formatAddress, formatCountdown } from "@/lib/format";
import { circleStatusLabels, circleStatusStyles } from "@/lib/circleStatus";

export default function CircleDetailPage() {
  const params = useParams();
  const address = params.address as Address;
  const { address: account } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient();
  const explorer = publicClient?.chain?.blockExplorers?.default.url;
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const maxMembersValue = Number(maxMembers?.result ?? 0);

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

  const myIndex = account ? memberList.findIndex((m) => m.toLowerCase() === account.toLowerCase()) : -1;
  const isMember = myIndex >= 0;
  const myPendingWithdrawal = myIndex >= 0 && memberData ? (memberData[myIndex * 4 + 2]?.result as bigint | undefined) : undefined;
  const iContributed = myIndex >= 0 && memberData ? (memberData[myIndex * 4 + 3]?.result as boolean | undefined) : undefined;
  const iDefaulted = myIndex >= 0 && memberData ? (memberData[myIndex * 4]?.result as boolean | undefined) : undefined;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const deadline = Number(roundDeadline?.result ?? 0);
  const roundOpen = statusValue === CircleStatus.Active && nowSeconds <= deadline;
  const roundDue = statusValue === CircleStatus.Active && nowSeconds > deadline;

  async function run(key: string, fn: () => Promise<`0x${string}`>) {
    setPending(key);
    setError(null);
    try {
      const hash = await fn();
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
      setError("That transaction was cancelled or failed. Nothing changed.");
    } finally {
      setPending(null);
    }
  }

  async function handleJoin() {
    if (!tokenAddress || securityDeposit?.result === undefined) return;
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
    return <p className="text-sm text-slate">Loading circle...</p>;
  }

  const roundProgress = maxMembersValue > 0 && statusValue === CircleStatus.Active ? Math.round((currentRoundValue / maxMembersValue) * 100) : statusValue === CircleStatus.Finished ? 100 : 0;

  // A plain sentence about what the connected wallet should do next.
  let hint: string | null = null;
  if (account) {
    if (statusValue === CircleStatus.Created && !isMember) hint = "This circle is still filling up. Join to lock your deposit and take a seat.";
    else if (statusValue === CircleStatus.Created && isMember) hint = "You are in. The circle starts the moment the last seat fills. You can still leave until then.";
    else if (statusValue === CircleStatus.Active && isMember && iDefaulted) hint = "You missed a round, so you are marked as defaulted and skipped for the rest of the circle.";
    else if (roundOpen && isMember && iContributed === false) hint = "You have not paid this round yet. Contribute before the round closes.";
    else if (roundOpen && isMember && iContributed) hint = "You have paid this round. Waiting for the round to close.";
    else if (roundDue) hint = "This round has ended. Anyone can close it, and the agent does it automatically when it is running.";
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="hero-in flex flex-col gap-6 border-b border-sand pb-10 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="tag">Savings circle</p>
          <p className="num mt-3 text-5xl text-ink sm:text-6xl">
            {formatToken(contributionAmount?.result as bigint, decimals)}
            <span className="ml-3 text-xl text-slate">{symbol} / round</span>
          </p>
          <p className="mt-4 break-all font-mono text-xs text-slate sm:text-sm">
            {explorer ? (
              <a className="hover:text-ink" href={`${explorer}/address/${address}`} target="_blank" rel="noopener noreferrer">
                {address}
              </a>
            ) : (
              address
            )}
          </p>
        </div>
        {statusValue !== undefined && (
          <span className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm ${circleStatusStyles[statusValue]}`}>
            {statusValue === CircleStatus.Active && <span className="live-dot h-1.5 w-1.5 rounded-full bg-positive" />}
            {circleStatusLabels[statusValue]}
          </span>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Stat label="Members" value={`${memberList.length} / ${maxMembersValue || "-"}`} />
        <Stat label="Round" value={statusValue === CircleStatus.Active ? `${currentRoundValue + 1} of ${maxMembersValue}` : "-"} />
        <Stat label="Round closes" value={statusValue === CircleStatus.Active ? formatCountdown(deadline, nowSeconds) : "-"} />
        <Stat label="Unclaimed pool" value={`${formatToken(unclaimedPool?.result as bigint, decimals)} ${symbol}`} />
      </dl>

      {(statusValue === CircleStatus.Active || statusValue === CircleStatus.Finished) && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-slate">
            <span>Rounds completed</span>
            <span className="num">
              {statusValue === CircleStatus.Finished ? maxMembersValue : currentRoundValue} of {maxMembersValue}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={roundProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Rounds completed">
            <div className="h-full rounded-full bg-accent transition-all duration-700" style={{ width: `${roundProgress}%` }} />
          </div>
        </div>
      )}

      <div className="card flex flex-col gap-5">
        <div className="flex flex-wrap gap-3">
          {statusValue === CircleStatus.Created && !isMember && (
            <button className="btn-primary" disabled={pending !== null || !account} onClick={handleJoin}>
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
          {statusValue === CircleStatus.Active && isMember && !iDefaulted && (
            <button className="btn-primary" disabled={pending !== null || !roundOpen || iContributed === true} onClick={handleContribute}>
              {pending ? "Working..." : iContributed ? "Paid this round" : "Contribute this round"}
            </button>
          )}
          {statusValue === CircleStatus.Active && (
            <button
              className="btn-secondary"
              disabled={pending !== null || !roundDue || !account}
              title={roundDue ? "Close the finished round and pay the next member" : "Available once the round deadline has passed"}
              onClick={() => run("resolve", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "resolveRound" }))}
            >
              Close round
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
              disabled={pending !== null || !account}
              onClick={() => run("distribute", () => writeContractAsync({ address, abi: savingsCircleAbi, functionName: "distributeUnclaimedPool" }))}
            >
              Distribute unclaimed pool
            </button>
          )}
          {!account && <p className="text-sm text-slate">Connect a wallet to take part.</p>}
        </div>
        {hint && <p className="text-sm leading-relaxed text-slate">{hint}</p>}
        {error && <p className="text-sm text-negative">{error}</p>}
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-sand px-5 py-4 sm:px-6">
          <h2 className="text-lg tracking-tight text-ink">Members</h2>
          <span className="text-sm text-slate">in payout order</span>
        </div>
        <div className="flex flex-col divide-y divide-sand">
          {memberList.length === 0 && <p className="px-5 py-6 text-sm text-slate sm:px-6">No members yet.</p>}
          {memberList.map((member, i) => {
            const defaulted = memberData?.[i * 4]?.result as boolean | undefined;
            const deposit = memberData?.[i * 4 + 1]?.result as bigint | undefined;
            const owed = memberData?.[i * 4 + 2]?.result as bigint | undefined;
            const contributed = memberData?.[i * 4 + 3]?.result as boolean | undefined;
            const isNext = statusValue === CircleStatus.Active && !defaulted && i >= 0 && i === nextRecipient(memberList.length, currentRoundValue);

            return (
              <div key={member} className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="num w-5 text-slate">{i + 1}</span>
                  <span className="font-mono text-ink">{formatAddress(member)}</span>
                  {account?.toLowerCase() === member.toLowerCase() && (
                    <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-xs text-accent">you</span>
                  )}
                  {isNext && <span className="rounded-full border border-white/25 px-2 py-0.5 text-xs text-ink/80">gets this round</span>}
                  {defaulted && <span className="rounded-full border border-negative/40 bg-negative/10 px-2 py-0.5 text-xs text-negative">defaulted</span>}
                  {statusValue === CircleStatus.Active && !defaulted && (
                    <span className={contributed ? "text-xs text-positive" : "text-xs text-slate"}>{contributed ? "paid this round" : "not paid yet"}</span>
                  )}
                </div>
                <div className="flex gap-5 text-slate">
                  <span>
                    deposit <span className="num text-ink/80">{formatToken(deposit, decimals)}</span>
                  </span>
                  {owed !== undefined && owed > 0n && (
                    <span className="text-positive">
                      owed <span className="num">{formatToken(owed, decimals)}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate">
        New here?{" "}
        <Link className="text-accent hover:underline" href="/docs#circles">
          Read how circles work
        </Link>
        .
      </p>
    </div>
  );
}

// Members are paid in list order and defaulted members are skipped, so the true next recipient depends on
// who defaulted. This marker is only a hint for the common case, the round index, and is never used to move money.
function nextRecipient(memberCount: number, round: number) {
  return round < memberCount ? round : -1;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="num text-2xl text-ink sm:text-3xl">{value}</dd>
      <dt className="mt-1 text-xs tracking-wide text-slate">{label}</dt>
    </div>
  );
}
