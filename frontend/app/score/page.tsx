"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient } from "wagmi";
import { getAddress, isAddress, type Address } from "viem";
import { savingsCircleAbi, savingsCircleFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { PageHeader } from "@/components/PageHeader";
import { getLogsSafe } from "@/lib/logs";
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
  if (rounds === 0) return { label: "No history yet", style: "border-white/20 bg-white/5 text-slate" };
  const rate = score.contributed / rounds;
  if (rate >= 0.9) return { label: "Reliable", style: "border-positive/40 bg-positive/10 text-positive" };
  if (rate >= 0.6) return { label: "Mixed", style: "border-warn/40 bg-warn/10 text-warn" };
  return { label: "At risk", style: "border-negative/40 bg-negative/10 text-negative" };
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

  // A link like /score?address=0x... opens straight to that wallet's record, so a score can be shared.
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get("address");
    if (fromLink && isAddress(fromLink)) {
      setInput(fromLink);
      setLookup(getAddress(fromLink));
    }
  }, []);

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
        const logs = await getLogsSafe(publicClient!, { address: circles, event, args, fromBlock, toBlock: "latest" });
        return logs as { address: Address }[];
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
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="Savings score"
        title="How reliably does a wallet pay in?"
        description="Read straight from on-chain events. Nothing is stored by NairaFlow and nobody can edit it. It is the start of a credit history for people who save in groups but have no bank record to show for it."
      />

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
      {input && !valid && <p className="-mt-6 text-xs text-negative">That is not a valid wallet address.</p>}

      {loading && <p className="text-sm text-slate">Reading on-chain history...</p>}
      {error && <p className="text-sm text-negative">{error}</p>}

      {score && tier && !loading && (
        <>
          <div className="card grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12">
            <ScoreRing rate={rate} label={tier.label} />
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="break-all font-mono text-xs text-slate sm:text-sm">{lookup}</span>
                <span className={`w-fit rounded-full border px-3 py-1 text-sm ${tier.style}`}>{tier.label}</span>
              </div>
              <dl className="grid grid-cols-3 gap-4">
                <Stat label="Paid" value={String(score.contributed)} />
                <Stat label="Missed" value={String(score.missed)} />
                <Stat label="Payouts" value={String(score.payouts)} />
              </dl>
              <p className="text-xs leading-relaxed text-slate">
                On-time rate = contributions paid / (contributions paid + rounds missed). Reliable is 90% or more, Mixed is
                60% to 89%, At risk is below 60%. Counted on {deployment?.name} only.
              </p>
            </div>
          </div>

          <div className="card p-0">
            <div className="border-b border-sand px-5 py-4 sm:px-6">
              <h2 className="text-lg tracking-tight text-ink">Circles</h2>
            </div>
            {score.circles.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate sm:px-6">This wallet has not joined a circle on this network.</p>
            ) : (
              <div className="flex flex-col divide-y divide-sand">
                {score.circles.map((c) => (
                  <div key={c.circle} className="flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <Link href={`/circles/${c.circle}`} className="font-mono text-ink transition hover:text-accent">
                      {formatAddress(c.circle)}
                    </Link>
                    <span className="text-slate">
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

// A ring gauge in the same concentric-ring language as the rest of the app.
function ScoreRing({ rate, label }: { rate: number | null; label: string }) {
  const r = 70;
  const circumference = 2 * Math.PI * r;
  const filled = rate === null ? 0 : (rate / 100) * circumference;
  const stroke = rate === null ? "#807f7f" : rate >= 90 ? "#22e2a8" : rate >= 60 ? "#f5b84a" : "#ff6b7a";

  return (
    <div className="relative mx-auto h-[200px] w-[200px]" role="img" aria-label={rate === null ? "No history yet" : `On-time rate ${rate} percent, ${label}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
        <circle cx="100" cy="100" r="92" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r={r} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="10" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={r}
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${filled} ${circumference}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.2, 0.7, 0.2, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num text-5xl text-ink">{rate === null ? "-" : `${rate}%`}</span>
        <span className="mt-1 text-xs tracking-wide text-slate">on-time rate</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="num text-3xl text-ink">{value}</dd>
      <dt className="mt-1 text-xs tracking-wide text-slate">{label}</dt>
    </div>
  );
}
