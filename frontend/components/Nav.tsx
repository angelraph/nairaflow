"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const links = [
  { href: "/circles", label: "Circles" },
  { href: "/vaults", label: "Vaults" },
  { href: "/activity", label: "Activity" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-sand bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4 md:px-16">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink">
          NairaFlow
        </Link>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname?.startsWith(link.href) ? "text-sm font-medium text-accent" : "text-sm font-medium text-ink/60 hover:text-ink"
              }
            >
              {link.label}
            </Link>
          ))}
          <ConnectButton showBalance={false} />
        </nav>
      </div>
    </header>
  );
}
