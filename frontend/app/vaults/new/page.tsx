"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { decodeEventLog, isAddress, type Address } from "viem";
import { goalVaultFactoryAbi as factoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { TokenSelect } from "@/components/TokenSelect";
import { TestFaucet } from "@/components/TestFaucet";
import { PageHeader } from "@/components/PageHeader";
import { parseToken } from "@/lib/format";

function safeParse(value: string, decimals: number): bigint {
  try {
    return parseToken(value, decimals);
  } catch {
    return 0n;
  }
}

export default function NewVaultPage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const { deployment, ready } = useDeployment();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [token, setToken] = useState<Address | "">("");
  const [decimals, setDecimals] = useState(6);
  const [destination, setDestination] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [enableAllowance, setEnableAllowance] = useState(false);
  const [maxPerPeriod, setMaxPerPeriod] = useState("50");
  const [periodDays, setPeriodDays] = useState("7");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account && !destination) setDestination(account);
  }, [account, destination]);

  const unlockMs = unlockDate ? new Date(unlockDate).getTime() : NaN;
  const allowanceAmount = enableAllowance ? safeParse(maxPerPeriod, decimals) : 0n;
  const periodNum = Number(periodDays);

  const problem = !isAddress(destination)
    ? "Enter a valid destination address."
    : !unlockDate || Number.isNaN(unlockMs)
      ? "Choose an unlock date."
      : unlockMs <= Date.now()
        ? "The unlock date must be in the future."
        : enableAllowance && allowanceAmount <= 0n
          ? "The allowance must be a plain amount above zero."
          : enableAllowance && (!Number.isInteger(periodNum) || periodNum < 1)
            ? "The allowance period must be at least 1 day."
            : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !deployment || problem) return;

    setCreating(true);
    setError(null);
    try {
      const unlockTimestamp = BigInt(Math.floor(unlockMs / 1000));
      const periodLengthValue = enableAllowance ? BigInt(periodNum * 86400) : 0n;

      const hash = await writeContractAsync({
        address: deployment.goalVaultFactory as Address,
        abi: factoryAbi,
        functionName: "createVault",
        args: [token, destination as Address, unlockTimestamp, allowanceAmount, periodLengthValue],
      });
      const receipt = await waitForTransactionReceipt(config, { hash });

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics });
          if (decoded.eventName === "VaultCreated") {
            const vaultAddress = (decoded.args as { vault: Address }).vault;
            router.push(`/vaults/${vaultAddress}`);
            return;
          }
        } catch {
          // not this event
        }
      }
    } catch (err) {
      console.error(err);
      setError("The transaction was cancelled or failed. Nothing was created.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="New vault"
        title="Open a goal vault."
        description="Money in a vault stays locked until the date you pick. You can allow a small recurring allowance if you want some access sooner."
      />
      <DeploymentBanner />

      {ready && (
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
            <div>
              <label className="label" htmlFor="v-token">
                Stablecoin
              </label>
              <TokenSelect
                id="v-token"
                value={token}
                onChange={(address, dec) => {
                  setToken(address);
                  setDecimals(dec);
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="v-dest">
                Where released money goes
              </label>
              <input id="v-dest" className="input font-mono" value={destination} onChange={(e) => setDestination(e.target.value.trim())} placeholder="0x..." />
              <p className="mt-2 text-xs leading-relaxed text-slate">Used for withdrawals and agent releases. It defaults to your own wallet.</p>
            </div>

            <div>
              <label className="label" htmlFor="v-unlock">
                Unlocks on
              </label>
              <input id="v-unlock" className="input" type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />
            </div>

            <label className="flex cursor-pointer items-start gap-3 text-sm text-ink/80">
              <input className="mt-1 h-4 w-4 accent-[#9fe870]" type="checkbox" checked={enableAllowance} onChange={(e) => setEnableAllowance(e.target.checked)} />
              <span>
                Allow early withdrawals within a recurring allowance
                <span className="mt-1 block text-xs text-slate">Periods are fixed windows, so a 1 day period resets at midnight UTC.</span>
              </span>
            </label>

            {enableAllowance && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="v-allow">
                    Amount per period
                  </label>
                  <input id="v-allow" className="input num" type="number" min="0" step="any" value={maxPerPeriod} onChange={(e) => setMaxPerPeriod(e.target.value)} />
                </div>
                <div>
                  <label className="label" htmlFor="v-period">
                    Period (days)
                  </label>
                  <input id="v-period" className="input num" type="number" min="1" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} />
                </div>
              </div>
            )}

            {problem && (token || unlockDate) && <p className="text-sm text-negative">{problem}</p>}
            {error && <p className="text-sm text-negative">{error}</p>}

            <button type="submit" className="btn-primary" disabled={!token || !!problem || creating}>
              {creating ? "Creating vault..." : "Create vault"}
            </button>
            {!token && <p className="-mt-3 text-xs text-slate">Pick a stablecoin first.</p>}
          </form>

          <TestFaucet />
        </div>
      )}
    </div>
  );
}
