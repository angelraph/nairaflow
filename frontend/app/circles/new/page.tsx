"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConfig, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { decodeEventLog, type Address } from "viem";
import { savingsCircleFactoryAbi as factoryAbi, erc20Abi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { TokenSelect } from "@/components/TokenSelect";
import { parseToken } from "@/lib/format";

export default function NewCirclePage() {
  const router = useRouter();
  const { address: account } = useAccount();
  const { deployment, ready } = useDeployment();

  const [token, setToken] = useState<Address | "">("");
  const [decimals, setDecimals] = useState(6);
  const [contribution, setContribution] = useState("100");
  const [roundDays, setRoundDays] = useState("7");
  const [maxMembers, setMaxMembers] = useState("5");
  const [depositMultiplier, setDepositMultiplier] = useState("1");
  const [step, setStep] = useState<"idle" | "approving" | "creating">("idle");

  const contributionAmount = parseToken(contribution, decimals);
  const securityDeposit = contributionAmount * BigInt(depositMultiplier || "0");

  const { data: allowance } = useReadContract({
    address: token || undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && deployment ? [account, deployment.savingsCircleFactory as Address] : undefined,
    query: { enabled: Boolean(token && account && deployment) },
  });

  const { writeContractAsync } = useWriteContract();
  const config = useConfig();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !deployment || !account) return;

    try {
      const needsApproval = allowance === undefined || allowance < securityDeposit;
      if (needsApproval) {
        setStep("approving");
        const approveHash = await writeContractAsync({
          address: token,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.savingsCircleFactory as Address, securityDeposit],
        });
        await waitForTransactionReceipt(config, { hash: approveHash });
      }

      setStep("creating");
      const hash = await writeContractAsync({
        address: deployment.savingsCircleFactory as Address,
        abi: factoryAbi,
        functionName: "createCircle",
        args: [token, contributionAmount, BigInt(Number(roundDays) * 86400), BigInt(maxMembers), BigInt(depositMultiplier)],
      });
      const receipt = await waitForTransactionReceipt(config, { hash });

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({ abi: factoryAbi, data: log.data, topics: log.topics });
          if (decoded.eventName === "CircleCreated") {
            const circleAddress = (decoded.args as { circle: Address }).circle;
            router.push(`/circles/${circleAddress}`);
            return;
          }
        } catch {
          // not this event, keep looking
        }
      }
      setStep("idle");
    } catch (err) {
      console.error(err);
      setStep("idle");
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold text-ink">Start a savings circle</h1>
      <DeploymentBanner />

      {ready && (
        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <div>
            <label className="label">Stablecoin</label>
            <TokenSelect
              value={token}
              onChange={(address, dec) => {
                setToken(address);
                setDecimals(dec);
              }}
            />
          </div>

          <div>
            <label className="label">Contribution per round</label>
            <input className="input" type="number" min="0" step="any" value={contribution} onChange={(e) => setContribution(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Round length (days)</label>
              <input className="input" type="number" min="1" value={roundDays} onChange={(e) => setRoundDays(e.target.value)} />
            </div>
            <div>
              <label className="label">Members</label>
              <input
                className="input"
                type="number"
                min="2"
                max="20"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Security deposit (multiple of one contribution)</label>
            <input
              className="input"
              type="number"
              min="0"
              value={depositMultiplier}
              onChange={(e) => setDepositMultiplier(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink/50">
              Forfeited if you miss a round — this is what lets the circle keep going without you.
            </p>
          </div>

          <button type="submit" className="btn-primary" disabled={!token || step !== "idle"}>
            {step === "approving" ? "Approving..." : step === "creating" ? "Creating..." : "Create circle & join as member 1"}
          </button>
        </form>
      )}
    </div>
  );
}
