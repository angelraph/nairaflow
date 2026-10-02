"use client";

import { useState } from "react";
import { useAccount, useConfig, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { Address } from "viem";
import { policyManagerAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { formatDate, formatToken, parseToken } from "@/lib/format";

function safeParse(value: string, decimals: number): bigint {
  try {
    return parseToken(value, decimals);
  } catch {
    return 0n;
  }
}

export function PolicyPanel({
  target,
  vaultOwner,
  destination,
  decimals,
  symbol,
}: {
  target: Address;
  vaultOwner: Address;
  destination: Address;
  decimals: number;
  symbol: string;
}) {
  const { address: account } = useAccount();
  const { deployment } = useDeployment();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<"set" | "revoke" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [maxPerTx, setMaxPerTx] = useState("50");
  const [maxPerPeriod, setMaxPerPeriod] = useState("100");
  const [periodDays, setPeriodDays] = useState("7");
  const [expiryDays, setExpiryDays] = useState("30");

  const { data: policy, refetch } = useReadContract({
    address: deployment?.policyManager as Address | undefined,
    abi: policyManagerAbi,
    functionName: "policies",
    args: [target],
    query: { enabled: Boolean(deployment?.policyManager), refetchInterval: 8000 },
  });

  // The vault's own owner decides who may grant or revoke access. The policy's stored owner is not used here,
  // because it is empty until the first policy exists.
  const isOwner = Boolean(account && account.toLowerCase() === vaultOwner.toLowerCase());
  const active = Boolean(policy?.[0]);
  const expiry = Number(policy?.[6] ?? 0);
  const expired = active && expiry > 0 && expiry * 1000 < Date.now();

  const perTx = safeParse(maxPerTx, decimals);
  const perPeriod = safeParse(maxPerPeriod, decimals);
  const periodNum = Number(periodDays);
  const expiryNum = Number(expiryDays);

  const problem =
    perTx <= 0n
      ? "Max per transaction must be a plain amount above zero."
      : perPeriod <= 0n
        ? "Max per period must be a plain amount above zero."
        : perTx > perPeriod
          ? "The per transaction limit cannot be larger than the per period limit."
          : !Number.isInteger(periodNum) || periodNum < 1
            ? "The period must be at least 1 day."
            : !Number.isInteger(expiryNum) || expiryNum < 0
              ? "Expiry must be a whole number of days, or 0 for none."
              : null;

  async function send(kind: "set" | "revoke") {
    if (!deployment?.policyManager) return;
    setPending(kind);
    setError(null);
    try {
      const hash =
        kind === "set"
          ? await writeContractAsync({
              address: deployment.policyManager as Address,
              abi: policyManagerAbi,
              functionName: "setPolicy",
              args: [
                target,
                destination,
                perTx,
                perPeriod,
                BigInt(periodNum * 86400),
                expiryNum > 0 ? BigInt(Math.floor(Date.now() / 1000) + expiryNum * 86400) : 0n,
              ],
            })
          : await writeContractAsync({
              address: deployment.policyManager as Address,
              abi: policyManagerAbi,
              functionName: "revokePolicy",
              args: [target],
            });
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
      setError("That transaction was cancelled or failed. Nothing changed.");
    } finally {
      setPending(null);
    }
  }

  if (!isOwner) return null;

  return (
    <div className="card flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-[560px]">
          <p className="tag">The agent</p>
          <h2 className="mt-2 text-2xl tracking-tight text-ink">Agent policy</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Let the automated agent release your allowance on schedule. It can never go beyond these limits or send money
            anywhere but this vault&apos;s destination, and you can revoke it in one click.
          </p>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-sm ${
            active && !expired ? "border-positive/40 bg-positive/10 text-positive" : "border-white/20 bg-white/5 text-slate"
          }`}
        >
          {active && !expired && <span className="live-dot h-1.5 w-1.5 rounded-full bg-positive" />}
          {active && !expired ? "Agent authorized" : expired ? "Policy expired" : "Not authorized"}
        </span>
      </div>

      {active ? (
        <div className="flex flex-col gap-5">
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs tracking-wide text-slate">Per transaction</dt>
              <dd className="num mt-1 text-xl text-ink">
                {formatToken(policy?.[3] as bigint, decimals)} {symbol}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-slate">Per period</dt>
              <dd className="num mt-1 text-xl text-ink">
                {formatToken(policy?.[4] as bigint, decimals)} {symbol}
              </dd>
            </div>
            <div>
              <dt className="text-xs tracking-wide text-slate">Expires</dt>
              <dd className="num mt-1 text-xl text-ink">{expiry > 0 ? formatDate(expiry) : "Never"}</dd>
            </div>
          </dl>
          <button className="btn-secondary w-fit" disabled={pending !== null} onClick={() => send("revoke")}>
            {pending === "revoke" ? "Revoking..." : "Revoke agent access"}
          </button>
          <p className="text-xs text-slate">After you revoke, the agent&apos;s next attempt fails on chain with the message &ldquo;policy inactive&rdquo;.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-tx">
                Max per transaction
              </label>
              <input id="p-tx" className="input num" type="number" min="0" step="any" value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="p-period">
                Max per period
              </label>
              <input id="p-period" className="input num" type="number" min="0" step="any" value={maxPerPeriod} onChange={(e) => setMaxPerPeriod(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="p-days">
                Period length (days)
              </label>
              <input id="p-days" className="input num" type="number" min="1" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="p-expiry">
                Expires after (days, 0 for never)
              </label>
              <input id="p-expiry" className="input num" type="number" min="0" value={expiryDays} onChange={(e) => setExpiryDays(e.target.value)} />
            </div>
          </div>
          {problem && <p className="text-sm text-negative">{problem}</p>}
          <button className="btn-primary w-fit" disabled={pending !== null || !!problem} onClick={() => send("set")}>
            {pending === "set" ? "Authorizing..." : "Authorize agent"}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
