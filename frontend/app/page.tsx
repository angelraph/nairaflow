"use client";

import Link from "next/link";
import { CirclePlanner } from "@/components/CirclePlanner";
import { CountUp } from "@/components/CountUp";
import { HeroRing } from "@/components/HeroRing";
import { LogoMark } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { useLiveStats } from "@/lib/useLiveStats";

const steps = [
  {
    n: "01",
    title: "Join with a deposit",
    body: "Each member locks one contribution as a security deposit. You get it back when the circle ends.",
  },
  {
    n: "02",
    title: "Pay in every round",
    body: "Everyone pays the same amount. The pot builds up inside the contract, never in someone's pocket.",
  },
  {
    n: "03",
    title: "Take your turn",
    body: "One member takes the pot each round, in join order. Miss a payment and your deposit covers it.",
  },
];

// Rotating savings circles exist under many names. Showing them is the point: this is an old, trusted idea.
const names = ["Ajo", "Esusu", "Susu", "Tanda", "Hui", "Chit fund", "Chama", "Stokvel", "Arisan", "Tontine", "Paluwagan", "Kameti"];

export default function HomePage() {
  const stats = useLiveStats();

  return (
    <div className="flex flex-col gap-28 md:gap-40">
      {/* 1. Hero */}
      <section className="grid items-center gap-12 lg:min-h-[72vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="flex flex-col gap-8">
          <p
            className="hero-in inline-flex w-fit items-center gap-2.5 rounded-full border border-sand px-3.5 py-1.5 text-xs tracking-wide text-slate"
            style={{ animationDelay: "0ms" }}
          >
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-positive" />
            Live on Robinhood Chain mainnet and two testnets
          </p>
          <h1
            className="hero-in text-[2.6rem] font-medium leading-[1.06] tracking-tight text-ink sm:text-6xl lg:text-[4.4rem]"
            style={{ animationDelay: "90ms" }}
          >
            Your Ajo circle, on chain.
            <span className="block text-slate">Nobody holds the money.</span>
          </h1>
          <p
            className="hero-in max-w-[520px] text-base leading-relaxed text-slate sm:text-lg"
            style={{ animationDelay: "190ms" }}
          >
            Save with your group in stablecoins. Everyone pays in, one person takes the pot each round, and the contract
            makes sure the next turn always comes.
          </p>
          <div className="hero-in flex flex-wrap gap-3" style={{ animationDelay: "290ms" }}>
            <Link href="/circles/new" className="btn-primary">
              Start a circle
            </Link>
            <Link href="/docs" className="btn-secondary">
              How it works &rsaquo;
            </Link>
          </div>
        </div>

        <div className="hero-in" style={{ animationDelay: "200ms" }}>
          <HeroRing />
        </div>
      </section>

      {/* 2. Ticker and live numbers */}
      <section className="flex flex-col gap-12">
        <div className="relative overflow-hidden border-y border-sand py-5" aria-label="Rotating savings circles go by many names">
          <div className="animate-marquee flex w-max gap-12 whitespace-nowrap text-2xl tracking-wide text-ink/30 sm:text-3xl" aria-hidden="true">
            {[...names, ...names].map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
          <p className="sr-only">Ajo, Esusu, Susu, Tanda, Hui, Chit fund, Chama, Stokvel, Arisan, Tontine, Paluwagan and Kameti are all rotating savings circles.</p>
        </div>

        <Reveal>
          <dl className="grid grid-cols-3 gap-6">
            {[
              { label: "circles started", value: stats.circleCount },
              { label: "goal vaults", value: stats.vaultCount },
              { label: "agent actions on chain", value: stats.agentActions },
            ].map((s) => (
              <div key={s.label}>
                <dd className="num text-4xl text-ink sm:text-6xl">
                  <CountUp value={s.value} />
                </dd>
                <dt className="mt-2 text-xs tracking-wide text-slate sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-slate">
            Read live from {stats.deployment?.name ?? "the selected network"}. Nothing here is typed in by hand.
          </p>
        </Reveal>
      </section>

      {/* 3. Planner */}
      <section className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <Reveal className="flex flex-col gap-6">
          <p className="tag">Plan it first</p>
          <h2 className="text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            See your circle before you start it.
          </h2>
          <p className="max-w-[500px] leading-relaxed text-slate">
            Pick how many people, how much each pays and how long a round lasts. You will see who gets what and when,
            with no wallet and no commitment.
          </p>
          <ul className="flex flex-col gap-3 text-sm text-ink/80">
            {["Every member pays the same amount", "Each round, one member takes the whole pot", "A missed payment is covered by that member's deposit"].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {t}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={120}>
          <CirclePlanner />
        </Reveal>
      </section>

      {/* 4. How it works */}
      <section className="flex flex-col gap-14">
        <Reveal className="flex flex-col gap-4">
          <p className="tag">How it works</p>
          <h2 className="max-w-[700px] text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            The Ajo you already know. The contract keeps the order.
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <div className="card flex h-full min-h-[280px] flex-col justify-between gap-10 transition hover:border-white/30">
                <span className="num text-6xl text-ink/15">{s.n}</span>
                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl tracking-tight text-ink">{s.title}</h3>
                  <p className="text-sm leading-relaxed text-slate">{s.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* 5. Two ways to save */}
      <section className="flex flex-col gap-12">
        <Reveal className="flex flex-col gap-4">
          <p className="tag">Two ways to save</p>
          <h2 className="max-w-[700px] text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
            With people you trust, or on your own.
          </h2>
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2">
          <Reveal>
            <Link href="/circles" className="group card relative flex h-full min-h-[340px] flex-col justify-between gap-8 overflow-hidden transition hover:border-white/40">
              <div className="flex flex-col gap-4">
                <p className="tag">With a group</p>
                <h3 className="text-3xl tracking-tight text-ink">Savings circles</h3>
                <p className="max-w-md text-sm leading-relaxed text-slate">
                  A fixed group, a fixed amount, one payout per round until everyone has been paid. Each circle is its
                  own contract with its own address you can inspect.
                </p>
              </div>
              <span className="text-sm text-accent transition group-hover:translate-x-1.5">Browse circles &rsaquo;</span>
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/vaults" className="group card relative flex h-full min-h-[340px] flex-col justify-between gap-8 overflow-hidden transition hover:border-white/40">
              <div className="flex flex-col gap-4">
                <p className="tag">On your own</p>
                <h3 className="text-3xl tracking-tight text-ink">Goal vaults</h3>
                <p className="max-w-md text-sm leading-relaxed text-slate">
                  Lock money until a date you choose, or release a small allowance on a schedule. Anyone can top a vault
                  up, which suits family funding your goal.
                </p>
              </div>
              <span className="text-sm text-accent transition group-hover:translate-x-1.5">Browse vaults &rsaquo;</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* 6. Closing */}
      <Reveal>
        <section className="rounded-hero border border-sand bg-surface px-6 py-16 text-center sm:px-12 sm:py-24">
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-7">
            <LogoMark height={64} />
            <h2 className="text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
              Start with people you trust.
            </h2>
            <p className="leading-relaxed text-slate">
              It takes a wallet and a few minutes. Try everything with play money on a testnet first, then use real USDG on Robinhood Chain.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/circles/new" className="btn-primary">
                Start a circle
              </Link>
              <Link href="/faq" className="btn-secondary">
                Read the FAQ
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
