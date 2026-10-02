"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Logo } from "@/components/Logo";

const links = [
  { href: "/circles", label: "Circles" },
  { href: "/vaults", label: "Vaults" },
  { href: "/score", label: "Score" },
  { href: "/activity", label: "Activity" },
  { href: "/docs", label: "Docs" },
  { href: "/faq", label: "FAQ" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand bg-carbon">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:px-10 lg:py-4">
        <Link href="/" aria-label="NairaFlow home">
          <Logo priority />
        </Link>
        <div className="sm:order-3">
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
        <nav className="flex w-full items-center gap-7 overflow-x-auto sm:order-2 sm:w-auto" aria-label="Main">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  "whitespace-nowrap py-1 text-sm tracking-wide transition " +
                  (active ? "text-accent" : "text-slate hover:text-ink")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
