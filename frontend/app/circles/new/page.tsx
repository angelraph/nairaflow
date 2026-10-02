"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConfig, useReadContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { decodeEventLog, type Address } from "viem";
import { savingsCircleFactoryAbi as factoryAbi, erc20Abi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { TokenSelect } from "@/components/TokenSelect";
import { TestFaucet } from "@/components/TestFaucet";
import { PageHeader } from "@/components/PageHeader";
import { formatToken, parseToken } from "@/lib/format";

// A number input still lets people type things like 1e5, which the amount parser rejects. Treat that as zero
// so the form shows a message instead of crashing.
function safeParse(value: string, decimals: number): bigint {
  try {
    return parseToken(value, decimals);
  } catch {
    return 0n;
  }
}

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
  const [error, setError] = useState<string | null>(null);

  // The planner on the home page links here with its numbers, so nobody has to type them twice.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const m = p.get("members");
    const a = p.get("amount");
    const d = p.get("days");
    if (m && Number.isFinite(Number(m))) setMaxMembers(String(Math.min(20, Math.max(2, Math.floor(Number(m))))));
    if (a && Number(a) > 0) setContribution(String(Number(a)));
    if (d && Number.isFinite(Number(d))) setRoundDays(String(Math.max(1, Math.floor(Number(d)))));
  }, []);

  const membersNum = Number(maxMembers);
  const daysNum = Number(roundDays);
  const multiplierNum = Number(depositMultiplier);
  const contributionAmount = safeParse(contribution, decimals);

  const problem =
    contributionAmount <= 0n
      ? "Enter a plain amount above zero, like 100."
      : !Number.isInteger(membersNum) || membersNum < 2 || membersNum > 20
        ? "A circle needs between 2 and 20 members."
        : !Number.isInteger(daysNum) || daysNum < 1
          ? "A round must last at least 1 day."
          : !Number.isInteger(multiplierNum) || multiplierNum < 0
            ? "The deposit multiple must be a whole number, zero or more."
            : null;

  const securityDeposit = contributionAmount * BigInt(Number.isInteger(multiplierNum) && multiplierNum >= 0 ? multiplierNum : 0);
  const pot = contributionAmount * BigInt(Number.isInteger(membersNum) && membersNum >= 2 ? membersNum : 0);

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
    if (!token || !deployment || !account || problem) return;
    setError(null);

    try {
      const needsApproval = securityDeposit > 0n && (allowance === undefined || allowance < securityDeposit);
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
        args: [token, contributionAmount, BigInt(daysNum * 86400), BigInt(membersNum), BigInt(multiplierNum)],
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
      setError("The transaction was cancelled or failed. Nothing was created. Check your balance and try again.");
      setStep("idle");
    }
  }

  const symbolHint = token ? "" : "Pick a stablecoin first.";

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="New circle"
        title="Start a savings circle."
        description="You join as the first member and lock your deposit. When the last seat fills, the circle starts by itself."
      />
      <DeploymentBanner />

      {ready && (
        <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="card flex flex-col gap-6">
            <div>
              <label className="label" htmlFor="c-token">
                Stablecoin
              </label>
              <TokenSelect
                value={token}
                onChange={(address, dec) => {
                  setToken(address);
                  setDecimals(dec);
                }}
              />
            </div>

            <div>
              <label className="label" htmlFor="c-amount">
                Each member pays, per round
              </label>
              <input id="c-amount" className="input num" type="number" min="0" step="any" value={contribution} onChange={(e) => setContribution(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="c-days">
                  Round length (days)
                </label>
                <input id="c-days" className="input num" type="number" min="1" value={roundDays} onChange={(e) => setRoundDays(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="c-members">
                  Members
                </label>
                <input id="c-members" className="input num" type="number" min="2" max="20" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="c-deposit">
                Security deposit (times one contribution)
              </label>
              <input id="c-deposit" className="input num" type="number" min="0" value={depositMultiplier} onChange={(e) => setDepositMultiplier(e.target.value)} />
              <p className="mt-2 text-xs leading-relaxed text-slate">
                If a member misses a round, their deposit covers it. That is what lets the circle keep going without them.
              </p>
            </div>

            {problem && <p className="text-sm text-negative">{problem}</p>}
            {error && <p className="text-sm text-negative">{error}</p>}

            <button type="submit" className="btn-primary" disabled={!token || !!problem || step !== "idle"}>
              {step === "approving" ? "Approving deposit..." : step === "creating" ? "Creating circle..." : "Create circle and join"}
            </button>
            {symbolHint && <p className="-mt-3 text-xs text-slate">{symbolHint}</p>}
          </form>

          <div className="flex flex-col gap-5">
            <div className="card flex flex-col gap-5">
              <p className="tag">What this means</p>
              <div>
                <p className="text-sm text-slate">The member whose turn it is takes</p>
                <p className="num mt-1 text-4xl text-ink">{problem ? "-" : formatToken(pot, decimals)}</p>
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">You lock now as a deposit</dt>
                  <dd className="num text-ink">{problem ? "-" : formatToken(securityDeposit, decimals)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Everyone has had a turn after</dt>
                  <dd className="num text-ink">{problem ? "-" : `${daysNum * membersNum} days`}</dd>
                </div>
              </dl>
              <p className="text-xs leading-relaxed text-slate">
                Creating takes two wallet confirmations: one to allow the deposit, one to create the circle.
              </p>
            </div>
            <TestFaucet />
          </div>
        </div>
      )}
    </div>
  );
}
