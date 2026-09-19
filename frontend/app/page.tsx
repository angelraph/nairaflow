import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Save together. Save on your terms.</h1>
        <p className="max-w-2xl text-lg text-ink/70">
          NairaFlow is a non-custodial way to run savings circles and goal-locked savings in stablecoins, built for
          the African diaspora and settled on Arbitrum. Your funds sit in a contract you control. An off-chain agent
          can only ever act within limits you set, and you can revoke it instantly.
        </p>
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="card flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Savings Circles</h2>
          <p className="text-sm text-ink/70">
            An on-chain Ajo/Esusu. A fixed group contributes every round; each round pays one member, in join order,
            until everyone has been paid once. A posted security deposit means one person missing a contribution
            never breaks the schedule for the rest of the group.
          </p>
          <Link href="/circles" className="btn-primary mt-2 w-fit">
            View circles
          </Link>
        </div>

        <div className="card flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">Goal Vaults</h2>
          <p className="text-sm text-ink/70">
            Lock stablecoins that unlock on a date you choose, or release in small amounts on a schedule. Anyone can
            top up a vault, which is useful when a family member is funding someone else's goal.
          </p>
          <Link href="/vaults" className="btn-primary mt-2 w-fit">
            View vaults
          </Link>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-2 text-lg font-semibold text-ink">How the agent stays honest</h2>
        <p className="text-sm text-ink/70">
          You grant the agent a narrow, revocable policy: a spending limit, a destination, an expiry. It never holds
          your funds or an allowance over them; every action it triggers moves money directly from your circle or
          vault under that contract's own rules. Revoke the policy at any time and its next attempt reverts on-chain.
          Every action it takes is tagged with the live gas price at execution time, so you can check its timing
          claims on the explorer instead of just trusting them.
        </p>
      </section>
    </div>
  );
}
