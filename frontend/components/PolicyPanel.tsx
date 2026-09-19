"use client";

import { useState } from "react";
import { useAccount, useConfig, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { Address } from "viem";
import { policyManagerAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { formatToken, parseToken } from "@/lib/format";

export function PolicyPanel({ target, decimals, symbol }: { target: Address; decimals: number; symbol: string }) {
  const { address: account } = useAccount();
  const { deployment } = useDeployment();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);

  const [maxPerTx, setMaxPerTx] = useState("50");
  const [maxPerPeriod, setMaxPerPeriod] = useState("100");
  const [periodDays, setPeriodDays] = useState("7");

  const { data: policy, refetch } = useReadContract({
    address: deployment?.policyManager as Address | undefined,
    abi: policyManagerAbi,
    functionName: "policies",
    args: [target],
    query: { enabled: Boolean(deployment?.policyManager), refetchInterval: 8000 },
  });

  const [active, owner] = policy ?? [];
  const isOwner = account && owner && (owner as string).toLowerCase() === account.toLowerCase();

  async function handleSetPolicy() {
    if (!deployment?.policyManager) return;
    setPending(true);
    try {
      const hash = await writeContractAsync({
        address: deployment.policyManager as Address,
        abi: policyManagerAbi,
        functionName: "setPolicy",
        args: [
          target,
          target, // allowedDestination: the vault enforces its own fixed destination already
          parseToken(maxPerTx, decimals),
          parseToken(maxPerPeriod, decimals),
          BigInt(Number(periodDays) * 86400),
          0n,
        ],
      });
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  }

  async function handleRevoke() {
    if (!deployment?.policyManager) return;
    setPending(true);
    try {
      const hash = await writeContractAsync({
        address: deployment.policyManager as Address,
        abi: policyManagerAbi,
        functionName: "revokePolicy",
        args: [target],
      });
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setPending(false);
    }
  }

  if (!isOwner) return null;

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Agent policy</h2>
        <p className="text-sm text-ink/70">
          Let the off-chain agent trigger scheduled releases within these limits. It can never exceed them or send
          funds anywhere but this vault&apos;s own destination, and you can revoke this instantly.
        </p>
      </div>

      {active ? (
        <div className="flex flex-col gap-3 rounded-lg bg-positive/5 p-4 text-sm">
          <p className="text-positive">Agent is authorized on this vault.</p>
          <div className="grid grid-cols-2 gap-2 text-ink/70">
            <span>
              Per-tx limit: {formatToken(policy?.[3], decimals)} {symbol}
            </span>
            <span>
              Per-period limit: {formatToken(policy?.[4], decimals)} {symbol}
            </span>
          </div>
          <button className="btn-secondary w-fit" disabled={pending} onClick={handleRevoke}>
            {pending ? "Revoking..." : "Revoke agent access"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Max per transaction</label>
              <input className="input" type="number" min="0" value={maxPerTx} onChange={(e) => setMaxPerTx(e.target.value)} />
            </div>
            <div>
              <label className="label">Max per period</label>
              <input className="input" type="number" min="0" value={maxPerPeriod} onChange={(e) => setMaxPerPeriod(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Period length (days)</label>
            <input className="input" type="number" min="1" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} />
          </div>
          <button className="btn-primary w-fit" disabled={pending} onClick={handleSetPolicy}>
            {pending ? "Authorizing..." : "Authorize agent"}
          </button>
        </div>
      )}
    </div>
  );
}
