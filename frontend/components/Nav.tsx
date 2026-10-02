"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { href: "/circles", label: "Circles" },
  { href: "/vaults", label: "Vaults" },
  { href: "/score", label: "Score" },
  { href: "/activity", label: "Activity" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand bg-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 md:px-16 md:py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          NairaFlow
        </Link>
        <div className="sm:order-3">
          <ConnectButton
            showBalance={false}
            chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
            accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
          />
        </div>
        <nav className="flex w-full items-center gap-6 overflow-x-auto sm:order-2 sm:w-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                (pathname?.startsWith(link.href) ? "text-accent" : "text-ink/60 hover:text-ink") +
                " py-1 text-sm font-medium whitespace-nowrap"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
