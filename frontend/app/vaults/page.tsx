"use client";

import Link from "next/link";
import { useState } from "react";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { goalVaultFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { VaultCard } from "@/components/VaultCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, SkeletonCards } from "@/components/ListState";

export default function VaultsPage() {
  const { deployment, ready } = useDeployment();
  const [query, setQuery] = useState("");

  const { data: vaults, isLoading } = useReadContract({
    address: deployment?.goalVaultFactory as Address | undefined,
    abi: goalVaultFactoryAbi,
    functionName: "getAllVaults",
    query: { enabled: ready },
  });

  const all = vaults ? [...vaults].reverse() : [];
  const shown = query ? all.filter((a) => a.toLowerCase().includes(query.trim().toLowerCase())) : all;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="Goal vaults"
        title="Vaults on this network."
        description="A vault locks money until a date you choose. Anyone can top one up, and an agent can release an allowance only inside the limits its owner set."
        action={
          <Link href="/vaults/new" className="btn-primary">
            Open a vault
          </Link>
        }
      />

      <DeploymentBanner />

      {ready && all.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="input sm:max-w-sm"
            placeholder="Search by vault address"
            aria-label="Search vaults by address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="text-sm text-slate">
            {shown.length} of {all.length} vault{all.length === 1 ? "" : "s"} on {deployment?.name}
          </p>
        </div>
      )}

      {ready && isLoading && <SkeletonCards />}

      {ready && vaults && vaults.length === 0 && (
        <EmptyState
          title="No vaults here yet."
          body="Lock some savings toward something that matters, with an unlock date you pick."
          href="/vaults/new"
          cta="Open a vault"
        />
      )}

      {ready && vaults && vaults.length > 0 && shown.length === 0 && <p className="text-sm text-slate">No vault matches that address.</p>}

      {shown.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((address) => (
            <VaultCard key={address} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
