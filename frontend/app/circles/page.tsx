"use client";

import Link from "next/link";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { savingsCircleFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { CircleCard } from "@/components/CircleCard";

export default function CirclesPage() {
  const { deployment, ready } = useDeployment();

  const { data: circles } = useReadContract({
    address: deployment?.savingsCircleFactory as Address | undefined,
    abi: savingsCircleFactoryAbi,
    functionName: "getAllCircles",
    query: { enabled: ready },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">Savings Circles</h1>
        <Link href="/circles/new" className="btn-primary">
          Start a circle
        </Link>
      </div>

      <DeploymentBanner />

      {ready && circles && circles.length === 0 && (
        <p className="text-sm text-ink/60">No circles yet. Be the first to start one.</p>
      )}

      {ready && circles && circles.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...circles].reverse().map((address) => (
            <CircleCard key={address} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
