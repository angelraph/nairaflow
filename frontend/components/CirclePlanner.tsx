"use client";

import Link from "next/link";
import { useState } from "react";
import { RotationRing } from "@/components/RotationRing";

function clampInt(value: string, min: number, max: number, fallback: number) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

// Pure arithmetic, nothing is read from or written to a chain. It shows what a circle with these
// settings would do so the numbers are clear before anyone signs a transaction.
export function CirclePlanner() {
  const [members, setMembers] = useState("5");
  const [amount, setAmount] = useState("100");
  const [days, setDays] = useState("7");

  const m = clampInt(members, 2, 20, 5);
  const a = Math.max(0, Number(amount) || 0);
  const d = clampInt(days, 1, 90, 7);

  const pot = m * a;
  const totalDays = m * d;

  const query = new URLSearchParams({ members: String(m), amount: String(a), days: String(d) }).toString();

  return (
    <div className="rounded-hero border border-sand bg-surface p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="tag">Plan a circle</p>
          <p className="mt-1 text-sm text-slate">See what your group would do before you sign anything.</p>
        </div>
        <div className="hidden shrink-0 sm:block">
          <RotationRing members={m} size={132} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="plan-members">
            People
          </label>
          <input id="plan-members" className="input num" type="number" min={2} max={20} value={members} onChange={(e) => setMembers(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="plan-amount">
            Each pays
          </label>
          <input id="plan-amount" className="input num" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="plan-days">
            Days / round
          </label>
          <input id="plan-days" className="input num" type="number" min={1} max={90} value={days} onChange={(e) => setDays(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 border-t border-sand pt-5">
        <p className="text-sm text-slate">The person whose turn it is takes</p>
        <p className="num mt-1 text-4xl text-ink sm:text-5xl">
          {fmt(pot)} <span className="text-lg text-slate sm:text-xl">stablecoin</span>
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
        <div>
          <dt className="text-slate">Everyone has had a turn after</dt>
          <dd className="num mt-0.5 text-lg text-ink">{totalDays} days</dd>
        </div>
        <div>
          <dt className="text-slate">You pay in, each round</dt>
          <dd className="num mt-0.5 text-lg text-ink">{fmt(a)}</dd>
        </div>
        <div>
          <dt className="text-slate">Security deposit</dt>
          <dd className="num mt-0.5 text-lg text-ink">{fmt(a)} (returned)</dd>
        </div>
        <div>
          <dt className="text-slate">If someone skips a round</dt>
          <dd className="mt-0.5 text-lg text-ink">Their deposit covers it</dd>
        </div>
      </dl>

      <Link href={`/circles/new?${query}`} className="btn-primary mt-6 w-full">
        Start this circle
      </Link>
    </div>
  );
}
