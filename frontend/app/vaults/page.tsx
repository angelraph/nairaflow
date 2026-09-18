"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { goalVaultFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { VaultCard } from "@/components/VaultCard";

export default function VaultsPage() {
  const { deployment, ready } = useDeployment();

  const { data: vaults } = useReadContract({
    address: deployment?.goalVaultFactory as Address | undefined,
    abi: goalVaultFactoryAbi,
    functionName: "getAllVaults",
    query: { enabled: ready },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Goal Vaults</h1>
        <Link href="/vaults/new" className="btn-primary">
          Create a vault
        </Link>
      </div>

      <DeploymentBanner />

      {ready && vaults && vaults.length === 0 && <p className="text-sm text-ink/60">No vaults yet. Create the first one.</p>}

      {ready && vaults && vaults.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...vaults].reverse().map((address) => (
            <VaultCard key={address} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
