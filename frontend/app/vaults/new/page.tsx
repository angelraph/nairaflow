"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { decodeEventLog, type Address } from "viem";
import { goalVaultFactoryAbi as factoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { TokenSelect } from "@/components/TokenSelect";

export default function NewVaultPage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const { deployment, ready } = useDeployment();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();

  const [token, setToken] = useState<Address | "">("");
  const [destination, setDestination] = useState("");
  const [unlockDate, setUnlockDate] = useState("");
  const [enableAllowance, setEnableAllowance] = useState(false);
  const [maxPerPeriod, setMaxPerPeriod] = useState("50");
  const [periodDays, setPeriodDays] = useState("7");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (account && !destination) setDestination(account);
  }, [account, destination]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !deployment || !unlockDate) return;

    setCreating(true);
    try {
      const unlockTimestamp = BigInt(Math.floor(new Date(unlockDate).getTime() / 1000));
      const maxPerPeriodValue = enableAllowance ? BigInt(Math.floor(Number(maxPerPeriod) * 1e6)) : 0n;
      const periodLengthValue = enableAllowance ? BigInt(Number(periodDays) * 86400) : 0n;

      const hash = await writeContractAsync({
        address: deployment.goalVaultFactory as Address,
        abi: factoryAbi,
        functionName: "createVault",
        args: [token, destination as Address, unlockTimestamp, maxPerPeriodValue, periodLengthValue],
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
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Create a goal vault</h1>
      <DeploymentBanner />

      {ready && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="label">Stablecoin</label>
            <TokenSelect value={token} onChange={(address) => setToken(address)} />
          </div>

          <div>
            <label className="label">Destination on release</label>
            <input className="input font-mono" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="0x..." />
            <p className="mt-1 text-xs text-ink/50">Where funds go on withdrawal or an agent-triggered release. Defaults to you.</p>
          </div>

          <div>
            <label className="label">Unlocks on</label>
            <input className="input" type="datetime-local" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={enableAllowance} onChange={(e) => setEnableAllowance(e.target.checked)} />
            Allow early withdrawals within a recurring allowance
          </label>

          {enableAllowance && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount per period</label>
                <input className="input" type="number" min="0" value={maxPerPeriod} onChange={(e) => setMaxPerPeriod(e.target.value)} />
              </div>
              <div>
                <label className="label">Period (days)</label>
                <input className="input" type="number" min="1" value={periodDays} onChange={(e) => setPeriodDays(e.target.value)} />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={!token || !destination || !unlockDate || creating}>
            {creating ? "Creating..." : "Create vault"}
          </button>
        </form>
      )}
    </div>
  );
}
