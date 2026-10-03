import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";

export const metadata = {
  title: "FAQ | NairaFlow",
  description: "Plain answers about NairaFlow savings circles, goal vaults, the agent, and the testnet.",
};

const groups: { title: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    title: "The basics",
    items: [
      {
        q: "What is a savings circle?",
        a: "It is the Ajo or Esusu many families already use. A fixed group agrees on an amount. Every round, everyone pays in, and one member takes the whole pot. It repeats until everyone has had a turn. Under other names it is hui, tanda, susu, chama, stokvel or a chit fund.",
      },
      {
        q: "What does NairaFlow add?",
        a: "A contract holds the pot and enforces the order, so nobody has to be trusted with the money. A treasurer cannot run off with it, and a member who stops paying cannot break the schedule for everyone else.",
      },
      {
        q: "What is a goal vault?",
        a: "A personal lock. You deposit stablecoins that stay locked until a date you choose, and you can allow a small recurring allowance if you want some access sooner. Anyone can top a vault up, which suits a family member funding your goal.",
      },
      {
        q: "Is this real money?",
        a: "On the two testnets, no: everything is play money. On Robinhood Chain mainnet it is real USDG. The contracts have tests and static analysis but no professional audit, so only use an amount you can afford to lose.",
      },
    ],
  },
  {
    title: "Your money and the rules",
    items: [
      {
        q: "Who holds the money?",
        a: "The circle's own contract. Each circle and each vault is a separate contract with its own address, so funds are never pooled with anyone else's. NairaFlow does not hold your funds and has no function that moves them to itself.",
      },
      {
        q: "What if someone stops paying?",
        a: "Every member locks a security deposit when they join. If a member misses a round, their deposit is moved into that round's pot so the recipient is paid in full. The member is marked as defaulted and skipped for the rest of the circle. Everyone else carries on.",
      },
      {
        q: "Do I get my deposit back?",
        a: "Yes, if you pay every round. When the circle finishes, deposits of members who did not default are returned and appear as an amount you can withdraw. A member who defaulted forfeits theirs.",
      },
      {
        q: "In what order do members get paid?",
        a: "In join order. There is no randomness. One detail: if someone leaves before the circle is full, the last member to join takes their place in the order. Once the circle is full and running, the order is fixed.",
      },
      {
        q: "Can I leave a circle?",
        a: "Yes, any time before it fills up, and your deposit is returned straight away. After it starts you are committed, which is what protects everyone else. If a circle never fills within 30 days, any member can cancel it and reclaim their deposit.",
      },
      {
        q: "What if every member defaults?",
        a: "The money left in the circle is split between all members instead of getting stuck. We found this case on our own live circle, fixed it, and wrote it up in the deployments document.",
      },
      {
        q: "Why do I have to click withdraw?",
        a: "Payouts are credited to a balance and you collect them yourself. That way one broken or blocked address can never stop a round from closing for everyone else.",
      },
    ],
  },
  {
    title: "The agent",
    items: [
      {
        q: "What does the agent do?",
        a: "Two things only. It closes a circle round when the deadline has passed, and it releases an allowance from a goal vault when you have approved it to. It holds no funds and has no allowance over your tokens.",
      },
      {
        q: "Can the agent take my money?",
        a: "No. For a vault, money moves from the vault straight to the destination you set, within the per-transaction and per-period limits you chose. The contract checks those limits on every call, so a bug or a stolen agent key cannot go beyond them.",
      },
      {
        q: "How do I stop it?",
        a: "Press Revoke agent access on the vault page. It takes effect immediately. The agent's next attempt fails on chain with the message policy inactive. We tested this live.",
      },
      {
        q: "What does gas-aware mean?",
        a: "For vault releases the agent may wait, up to ten minutes, for a lower gas price before it acts. Each action is logged on chain with the gas price at that moment, so you can check it on the Activity page instead of taking our word.",
      },
      {
        q: "Is the agent always running?",
        a: "Not guaranteed. In this demo it is run by the maintainers and also has a scheduled cloud job, but GitHub treats schedules as best effort and can delay or skip runs, so a due round may wait. It is a convenience and nothing depends on it. If it is ever late, you can close the round yourself.",
      },
      {
        q: "Can I close a round myself?",
        a: "Yes. Closing a due round is open to anyone, not just the agent. The agent is a convenience, so a round never sits waiting.",
      },
    ],
  },
  {
    title: "Networks and tokens",
    items: [
      {
        q: "Which networks are supported?",
        a: "Robinhood Chain mainnet (real USDG), plus Arbitrum Sepolia and Robinhood Chain testnet for practice. Switch between them from the wallet button in the top bar.",
      },
      {
        q: "Which tokens can I use?",
        a: "On Robinhood Chain mainnet, Paxos' real USDG. On Arbitrum Sepolia, Circle's official test USDC plus a mock mUSDG. On Robinhood Chain testnet, mock mUSDC and mUSDG, because no official ones exist there. The m is part of each mock token's own symbol, so they can never be mistaken for the real ones.",
      },
      {
        q: "Is USDG real or a mock?",
        a: "Both. On Robinhood Chain mainnet NairaFlow is deployed with the real USDG and no mock token at all. The testnets have no USDG, so there it is a clearly labelled mock (mUSDG) that anyone can mint.",
      },
      {
        q: "How do I get test tokens?",
        a: "On a testnet, connect your wallet and open Start a circle or Open a goal vault. A Need test tokens card lets you mint mock tokens in one click, with links to the gas and USDC faucets. On mainnet you use real USDG from your own wallet.",
      },
      {
        q: "What does it cost to use?",
        a: "Only network gas, paid in ETH (testnet ETH on the testnets). There is no platform fee.",
      },
    ],
  },
  {
    title: "Trust and safety",
    items: [
      {
        q: "Has it been audited?",
        a: (
          <>
            Not by a professional firm. It has 22 unit tests and a funds-conservation invariant test that runs 128,000 random calls, plus a Slither scan with no High or Medium findings. The{" "}
            <a className="text-accent hover:underline" href="https://github.com/angelraph/nairaflow/blob/main/SECURITY.md" target="_blank" rel="noopener noreferrer">
              security notes
            </a>{" "}
            list what was tested and what is still trusted.
          </>
        ),
      },
      {
        q: "What do you still ask me to trust?",
        a: "A platform admin can pause a circle or vault in an emergency. Pausing can delay activity but cannot redirect funds. On a production network this would sit behind a timelocked multisig. The agent also uses a hot key, which is why its power is limited by the contracts rather than by trust.",
      },
      {
        q: "Does it work on my phone?",
        a: "Yes. Every page is built for small screens. The simplest way is to open the site inside your wallet app's built-in browser, such as MetaMask or Rainbow.",
      },
      {
        q: "What is the savings score?",
        a: "A record of how reliably a wallet pays into circles, computed live from public events: contributions paid, rounds missed and payouts received. Nothing is stored by us and nobody can edit it.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        tag="FAQ"
        title="Plain answers."
        description="What a circle is, where your money sits, what the agent can and cannot do, and what is still on trust."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
        <nav className="hidden lg:block" aria-label="FAQ sections">
          <ul className="sticky top-8 flex flex-col gap-3 text-sm">
            {groups.map((g) => (
              <li key={g.title}>
                <a href={`#${slug(g.title)}`} className="text-slate transition hover:text-ink">
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-14">
          {groups.map((g) => (
            <section key={g.title} id={slug(g.title)} className="scroll-mt-8">
              <h2 className="mb-5 text-2xl tracking-tight text-ink">{g.title}</h2>
              <div className="flex flex-col divide-y divide-sand rounded-card border border-sand bg-surface">
                {g.items.map((item) => (
                  <details key={item.q} className="group px-5 py-1 sm:px-6">
                    <summary className="flex cursor-pointer items-center justify-between gap-6 py-4 text-ink outline-none focus-visible:text-accent">
                      <span className="text-base sm:text-lg">{item.q}</span>
                      <span className="faq-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-sand text-lg leading-none text-slate" aria-hidden="true">
                        +
                      </span>
                    </summary>
                    <div className="pb-5 pr-10 text-sm leading-relaxed text-slate sm:text-base">{item.a}</div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <div className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg text-ink">Still have a question?</p>
              <p className="mt-1 text-sm text-slate">The docs go through every rule in detail, and the code is open.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/docs" className="btn-primary">
                Read the docs
              </Link>
              <a className="btn-secondary" href="https://github.com/angelraph/nairaflow" target="_blank" rel="noopener noreferrer">
                View the code
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
