import { Logo } from "@/components/Logo";

const repo = "https://github.com/angelraph/nairaflow";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Savings circles", href: "/circles" },
      { label: "Goal vaults", href: "/vaults" },
      { label: "Savings score", href: "/score" },
      { label: "Agent activity", href: "/activity" },
    ],
  },
  {
    title: "Learn",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "FAQ", href: "/faq" },
      { label: "Deployed contracts", href: `${repo}/blob/main/docs/DEPLOYMENTS.md` },
      { label: "Security and tests", href: `${repo}/blob/main/SECURITY.md` },
      { label: "Architecture", href: `${repo}/blob/main/docs/ARCHITECTURE.md` },
    ],
  },
  {
    title: "Code",
    links: [
      { label: "GitHub", href: repo },
      { label: "MIT license", href: `${repo}/blob/main/LICENSE` },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-sand bg-carbon">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-10">
        <div className="flex flex-col gap-4">
          <Logo size="lg" />
          <p className="text-sm tracking-[0.18em] text-ink/80">
            Save <span className="text-positive">&bull;</span> Rotate <span className="text-positive">&bull;</span> Grow
          </p>
          <p className="max-w-xs text-sm leading-relaxed text-slate">
            Non-custodial savings circles and goal vaults in stablecoins. Live on Robinhood Chain with real USDG, and on
            Arbitrum Sepolia and Robinhood testnet with play money. Not audited: only use what you can afford to lose.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-positive/80">African roots &bull; Global access</p>
        </div>
        {columns.map((col) => (
          <div key={col.title} className="flex flex-col gap-3">
            <p className="tag">{col.title}</p>
            {col.links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="text-sm text-ink/80 transition hover:text-accent"
              >
                {l.label}
              </a>
            ))}
          </div>
        ))}
      </div>
    </footer>
  );
}
