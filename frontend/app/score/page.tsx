"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { getAddress, isAddress, type Address } from "viem";
import { savingsCircleAbi, savingsCircleFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { formatAddress } from "@/lib/format";

interface CircleRecord {
  circle: Address;
  contributed: number;
  missed: number;
  payouts: number;
}

interface Score {
  circles: CircleRecord[];
  contributed: number;
  missed: number;
  payouts: number;
}

type Tier = { label: string; style: string };

function tierFor(score: Score): Tier {
  const rounds = score.contributed + score.missed;
  if (rounds === 0) return { label: "No history yet", style: "bg-elevated text-ink/60" };
  const rate = score.contributed / rounds;
  if (rate >= 0.9) return { label: "Reliable", style: "bg-positive/10 text-positive" };
  if (rate >= 0.6) return { label: "Mixed", style: "bg-warn/10 text-warn" };
  return { label: "At risk", style: "bg-negative/10 text-negative" };
}

export default function ScorePage() {
  const { address: connected } = useAccount();
  const { deployment, ready } = useDeployment();
  const publicClient = usePublicClient();

  const [input, setInput] = useState("");
  const [lookup, setLookup] = useState<Address | null>(null);
  const [score, setScore] = useState<Score | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected && !input) {
      setInput(connected);
      setLookup(connected);
    }
  }, [connected, input]);

  useEffect(() => {
    if (!lookup || !ready || !deployment || !publicClient) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const circles = (await publicClient!.readContract({
        address: deployment!.savingsCircleFactory as Address,
        abi: savingsCircleFactoryAbi,
        functionName: "getAllCircles",
      })) as Address[];

      if (circles.length === 0) {
        if (!cancelled) setScore({ circles: [], contributed: 0, missed: 0, payouts: 0 });
        return;
      }

      const eventLogs = async (name: string, args: Record<string, Address>) => {
        const event = savingsCircleAbi.find((f) => f.type === "event" && f.name === name)!;
        const fromBlock = BigInt(deployment!.deploymentBlock ?? 0);
        const logs = await publicClient!.getLogs({ address: circles, event, args, fromBlock, toBlock: "latest" } as never);
        return logs as unknown as { address: Address }[];
      };
      const [joined, contributedLogs, defaultedLogs, payoutLogs] = await Promise.all([
        eventLogs("MemberJoined", { member: lookup! }),
        eventLogs("Contributed", { member: lookup! }),
        eventLogs("MemberDefaulted", { member: lookup! }),
        eventLogs("RoundResolved", { recipient: lookup! }),
      ]);

      const byCircle = new Map<string, CircleRecord>();
      const record = (addr: string) => {
        const key = addr.toLowerCase();
        if (!byCircle.has(key)) byCircle.set(key, { circle: getAddress(addr), contributed: 0, missed: 0, payouts: 0 });
        return byCircle.get(key)!;
      };
      joined.forEach((l) => record(l.address));
      contributedLogs.forEach((l) => (record(l.address).contributed += 1));
      defaultedLogs.forEach((l) => (record(l.address).missed += 1));
      payoutLogs.forEach((l) => (record(l.address).payouts += 1));

      const list = [...byCircle.values()];
      if (!cancelled) {
        setScore({
          circles: list,
          contributed: list.reduce((n, c) => n + c.contributed, 0),
          missed: list.reduce((n, c) => n + c.missed, 0),
          payouts: list.reduce((n, c) => n + c.payouts, 0),
        });
      }
    }

    load()
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("Could not read on-chain history. Try again in a moment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [lookup, ready, deployment, publicClient]);

  const valid = isAddress(input);
  const tier = score ? tierFor(score) : null;
  const rounds = score ? score.contributed + score.missed : 0;
  const rate = score && rounds > 0 ? Math.round((score.contributed / rounds) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Savings score</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink/70">
          A record of how reliably any wallet pays into savings circles, read straight from on-chain events. Nothing is
          stored by NairaFlow and nobody can edit it. It is the start of a credit history for people who save in groups
          but have no bank record to show for it.
        </p>
      </div>

      <DeploymentBanner />

      <form
        className="card flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) setLookup(input as Address);
        }}
      >
        <input
          className="input font-mono"
          placeholder="0x... wallet address"
          value={input}
          onChange={(e) => setInput(e.target.value.trim())}
          aria-label="Wallet address"
        />
        <button type="submit" className="btn-primary" disabled={!valid || !ready}>
          Check score
        </button>
      </form>
      {input && !valid && <p className="text-xs text-negative">That is not a valid wallet address.</p>}

      {loading && <p className="text-sm text-ink/60">Reading on-chain history...</p>}
      {error && <p className="text-sm text-negative">{error}</p>}

      {score && tier && !loading && (
        <>
          <div className="card flex flex-col gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-all font-mono text-xs text-ink/50 sm:text-sm">{lookup}</span>
              <span className={`w-fit rounded-full px-3 py-1 text-sm font-medium ${tier.style}`}>{tier.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="On-time rate" value={rate === null ? "-" : `${rate}%`} />
              <Stat label="Contributions paid" value={String(score.contributed)} />
              <Stat label="Rounds missed" value={String(score.missed)} />
              <Stat label="Payouts received" value={String(score.payouts)} />
            </div>
            <p className="text-xs text-ink/50">
              On-time rate = contributions paid / (contributions paid + rounds missed). Reliable is 90% or more, Mixed is
              60% to 89%, At risk is below 60%. Counted on {deployment?.name} only.
            </p>
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold text-ink">Circles</h2>
            {score.circles.length === 0 ? (
              <p className="text-sm text-ink/60">This wallet has not joined a circle on this network.</p>
            ) : (
              <div className="flex flex-col divide-y divide-sand">
                {score.circles.map((c) => (
                  <div key={c.circle} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <Link href={`/circles/${c.circle}`} className="font-mono text-ink hover:text-accent">
                      {formatAddress(c.circle)}
                    </Link>
                    <span className="text-ink/60">
                      {c.contributed} paid, {c.missed} missed, {c.payouts} payout{c.payouts === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
