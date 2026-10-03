import Link from "next/link";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/PageHeader";
import { getDeployment } from "@/lib/deployments";

export const metadata = {
  title: "Docs | NairaFlow",
  description: "How NairaFlow savings circles, goal vaults and the agent work, with the exact rules and every deployed address.",
};

const repo = "https://github.com/angelraph/nairaflow";

const sections = [
  { id: "overview", title: "Overview" },
  { id: "circles", title: "Savings circles" },
  { id: "vaults", title: "Goal vaults" },
  { id: "agent", title: "The agent" },
  { id: "score", title: "Savings score" },
  { id: "networks", title: "Networks and tokens" },
  { id: "contracts", title: "Contracts" },
  { id: "security", title: "Security" },
  { id: "run", title: "Run it yourself" },
];

const networks = [
  { chainId: 421614, name: "Arbitrum Sepolia", explorer: "https://sepolia.arbiscan.io" },
  { chainId: 46630, name: "Robinhood Chain Testnet", explorer: "https://explorer.testnet.chain.robinhood.com" },
];

export default function DocsPage() {
  return (
    <div className="flex flex-col gap-14">
      <PageHeader
        tag="Docs"
        title="How it works, exactly."
        description="The rules below are the ones the contracts enforce. Where a detail is easy to get wrong, it is spelled out."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-20">
        <nav className="hidden lg:block" aria-label="Docs sections">
          <ul className="sticky top-8 flex flex-col gap-3 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-slate transition hover:text-ink">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-16">
          <Section id="overview" title="Overview">
            <p>
              NairaFlow has two products that share one security model. <b>Savings circles</b> are on-chain Ajo or Esusu
              for a group. <b>Goal vaults</b> are a personal lock. Both are non-custodial: money sits in a contract, and no
              person or company can move it outside that contract&apos;s rules.
            </p>
            <p>
              An optional <b>agent</b> can close due circle rounds and release vault allowances you approved. It can never
              go beyond limits you set, and you can revoke it at any time.
            </p>
            <p>
              A <b>savings score</b> shows how reliably any wallet pays into circles, read live from public events.
            </p>
          </Section>

          <Section id="circles" title="Savings circles">
            <p>
              Each circle is its own contract with its own address, created from a factory. Funds are never pooled between
              circles.
            </p>
            <H3>Setting one up</H3>
            <Table
              rows={[
                ["Stablecoin", "Any token on the allowed list for the network."],
                ["Contribution", "The amount every member pays each round."],
                ["Round length", "How long each round lasts. The form is in days. The contract requires at least one hour."],
                ["Members", "From 2 to 20."],
                ["Security deposit", "A multiple of one contribution, locked when you join. Zero is allowed."],
              ]}
            />
            <p>
              The creator joins automatically as the first member and posts the deposit. When the last seat fills, the circle
              starts by itself and the first round deadline is set from that moment.
            </p>
            <H3>Each round</H3>
            <ol className="list-decimal space-y-2 pl-5">
              <li>Every member contributes before the round deadline.</li>
              <li>After the deadline, anyone can close the round. The agent does it automatically when it is running.</li>
              <li>
                A member who did not pay loses their deposit into that round&apos;s pot and is marked defaulted. They are
                skipped for the rest of the circle.
              </li>
              <li>The next member in order is credited the whole pot. They collect it with a Withdraw button.</li>
            </ol>
            <H3>Order of payouts</H3>
            <p>
              Members are paid in join order, with no randomness. If someone leaves before the circle is full, the last
              member to join takes their place in the order. Once the circle is full the order is fixed.
            </p>
            <H3>Leaving, finishing and getting stuck</H3>
            <ul className="list-disc space-y-2 pl-5">
              <li>You can leave while the circle is still filling and your deposit comes straight back.</li>
              <li>If a circle never fills within 30 days, any member can cancel it and reclaim their deposit.</li>
              <li>When it finishes, deposits of members who never defaulted are returned.</li>
              <li>If every member defaulted, whatever is left is split between all members rather than locked forever.</li>
            </ul>
          </Section>

          <Section id="vaults" title="Goal vaults">
            <p>
              A vault belongs to one owner and holds one stablecoin. It is created with a destination address, an unlock
              date, and optionally a recurring allowance.
            </p>
            <Table
              rows={[
                ["Deposits", "Anyone can top a vault up, for example a relative funding your goal."],
                ["Before the unlock date", "Nothing can leave, unless you set an allowance. Then up to the allowance per period."],
                ["After the unlock date", "The owner can withdraw everything."],
                ["Allowance periods", "Fixed windows counted from the Unix epoch, so a one day period resets at midnight UTC. They are not rolling windows."],
                ["Destination", "Where agent releases go. The owner can change it, after which the agent policy must be set again."],
              ]}
            />
          </Section>

          <Section id="agent" title="The agent">
            <p>
              The agent is an off-chain service. It watches the chain and can call exactly two functions on a contract
              named AgentExecutor: close a due circle round, and release an allowance from a vault. It holds no funds and
              no token allowance.
            </p>
            <H3>The policy you grant</H3>
            <Table
              rows={[
                ["Allowed destination", "Must match the vault's destination."],
                ["Per transaction limit", "No single release can exceed it."],
                ["Per period limit", "Total released in a period cannot exceed it."],
                ["Period length", "The size of that period."],
                ["Expiry", "Optional. After it, the policy no longer works."],
              ]}
            />
            <p>
              Every call is checked against the policy on chain, and the vault checks its own unlock and allowance rules
              separately. Revoke the policy and the agent&apos;s next attempt reverts with <Code>policy inactive</Code>.
            </p>
            <H3>Gas and the activity log</H3>
            <p>
              For vault releases the agent may wait up to ten minutes for a lower gas price, then acts anyway so your
              schedule is honored. Every action emits an event with the gas price at that moment, and the Activity page reads
              those events back from the chain with a link to each transaction.
            </p>
            <H3>Who runs it</H3>
            <p>
              The agent is a program in the repository. It is set up to run on GitHub&apos;s servers on a schedule, with
              its own key that holds only testnet gas and the agent role, and it is also run directly by the project
              maintainers. GitHub treats schedules as best effort and can delay or skip runs, so a due round may wait,
              sometimes for hours. Nothing depends on it: any member can close a due round by hand, and a vault owner can
              always withdraw within the vault&apos;s own rules.
            </p>
          </Section>

          <Section id="score" title="Savings score">
            <p>
              The Score page reads four public events for a wallet: joined, contributed, defaulted and paid out. It shows
              contributions paid, rounds missed, payouts received and an on-time rate.
            </p>
            <Code block>on-time rate = contributions paid / (contributions paid + rounds missed)</Code>
            <p>
              Reliable is 90% or more, Mixed is 60% to 89%, and At risk is below 60%. It only counts NairaFlow circles on
              the network you are viewing. There is no stored score and no extra contract, so nobody can edit it.
            </p>
          </Section>

          <Section id="networks" title="Networks and tokens">
            <Table
              rows={[
                ["Arbitrum Sepolia", "Chain id 421614. Circle's official test USDC plus a mock mUSDG."],
                ["Robinhood Chain Testnet", "Chain id 46630. Mock mUSDC and mUSDG, because no official ones exist on this testnet."],
                ["Robinhood Chain mainnet", "Chain id 4663. Real USDG lives here at 0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168. NairaFlow is not deployed to mainnet yet."],
              ]}
            />
            <p>
              Mock tokens carry an <Code>m</Code> in their own on-chain symbol and have a public mint, so they can never be
              mistaken for the real ones. A Need test tokens card on the create pages mints them in one click.
            </p>
          </Section>

          <Section id="contracts" title="Contracts">
            <p>Every address below comes from a real deployment broadcast, and every contract is source-verified.</p>
            {networks.map((n) => {
              const d = getDeployment(n.chainId);
              if (!d) return null;
              const rows: [string, string][] = [
                ["StablecoinRegistry", d.stablecoinRegistry],
                ["PolicyManager", d.policyManager],
                ["AgentExecutor", d.agentExecutor],
                ["SavingsCircleFactory", d.savingsCircleFactory],
                ["GoalVaultFactory", d.goalVaultFactory],
              ];
              return (
                <div key={n.chainId} className="flex flex-col gap-3">
                  <H3>{n.name}</H3>
                  <div className="overflow-x-auto rounded-card border border-sand bg-surface">
                    <table className="w-full text-left text-sm">
                      <tbody className="divide-y divide-sand">
                        {rows.map(([name, addr]) => (
                          <tr key={name}>
                            <td className="whitespace-nowrap px-5 py-3 text-slate">{name}</td>
                            <td className="px-5 py-3 font-mono text-xs sm:text-sm">
                              <a className="break-all text-ink hover:text-accent" href={`${n.explorer}/address/${addr}`} target="_blank" rel="noopener noreferrer">
                                {addr}
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </Section>

          <Section id="security" title="Security">
            <ul className="list-disc space-y-2 pl-5">
              <li>22 unit tests and a funds-conservation invariant test that runs 128,000 random calls.</li>
              <li>Slither static analysis: no High or Medium findings. The 16 Low results are triaged in the security notes.</li>
              <li>Payouts are pull based, and state-changing functions are guarded against reentrancy.</li>
              <li>A platform admin can pause a circle or vault. It cannot move funds.</li>
              <li>Not audited by a professional firm. Testnet software.</li>
            </ul>
            <p>
              Three real bugs were found by operating and reviewing the deployed system and are written up in the{" "}
              <a className="text-accent hover:underline" href={`${repo}/blob/main/docs/DEPLOYMENTS.md`} target="_blank" rel="noopener noreferrer">
                deployments document
              </a>
              . Full notes are in{" "}
              <a className="text-accent hover:underline" href={`${repo}/blob/main/SECURITY.md`} target="_blank" rel="noopener noreferrer">
                SECURITY.md
              </a>
              .
            </p>
          </Section>

          <Section id="run" title="Run it yourself">
            <Code block>{`git clone ${repo}
cd nairaflow/contracts
npm ci
git clone --depth 1 https://github.com/foundry-rs/forge-std lib/forge-std
forge test

cd ../frontend
npm ci
npm run dev`}</Code>
            <p>
              The agent lives in the <Code>agent</Code> folder. Copy <Code>.env.example</Code> to <Code>.env</Code>, give it a
              funded testnet key that holds the agent role, then run <Code>npm start</Code>.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/faq" className="btn-secondary">
                Read the FAQ
              </Link>
              <a className="btn-secondary" href={repo} target="_blank" rel="noopener noreferrer">
                View the code
              </a>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="mb-6 text-3xl tracking-tight text-ink">{title}</h2>
      <div className="flex max-w-[760px] flex-col gap-5 leading-relaxed text-slate [&_b]:font-medium [&_b]:text-ink">{children}</div>
    </section>
  );
}

function H3({ children }: { children: ReactNode }) {
  return <h3 className="pt-2 text-lg tracking-tight text-ink">{children}</h3>;
}

function Code({ children, block }: { children: ReactNode; block?: boolean }) {
  if (block) {
    return (
      <pre className="overflow-x-auto rounded-[14px] border border-sand bg-carbon p-4 font-mono text-xs leading-relaxed text-ink sm:text-sm">
        <code>{children}</code>
      </pre>
    );
  }
  return <code className="break-all rounded-md bg-carbon px-1.5 py-0.5 font-mono text-[0.85em] text-ink">{children}</code>;
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-card border border-sand bg-surface">
      <table className="w-full text-left text-sm">
        <tbody className="divide-y divide-sand">
          {rows.map(([k, v]) => (
            <tr key={k} className="align-top">
              <td className="w-[34%] px-5 py-3 text-ink">{k}</td>
              <td className="px-5 py-3 text-slate">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
