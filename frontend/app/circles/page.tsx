"use client";

import Link from "next/link";
import { useState } from "react";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { savingsCircleFactoryAbi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";
import { DeploymentBanner } from "@/components/DeploymentBanner";
import { CircleCard } from "@/components/CircleCard";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState, SkeletonCards } from "@/components/ListState";

export default function CirclesPage() {
  const { deployment, ready } = useDeployment();
  const [query, setQuery] = useState("");

  const { data: circles, isLoading } = useReadContract({
    address: deployment?.savingsCircleFactory as Address | undefined,
    abi: savingsCircleFactoryAbi,
    functionName: "getAllCircles",
    query: { enabled: ready },
  });

  const all = circles ? [...circles].reverse() : [];
  const shown = query ? all.filter((a) => a.toLowerCase().includes(query.trim().toLowerCase())) : all;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        tag="Savings circles"
        title="Circles on this network."
        description="Every circle is its own contract. Open one to see its members, the round clock and who is owed what."
        action={
          <Link href="/circles/new" className="btn-primary">
            Start a circle
          </Link>
        }
      />

      <DeploymentBanner />

      {ready && all.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            className="input sm:max-w-sm"
            placeholder="Search by circle address"
            aria-label="Search circles by address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <p className="text-sm text-slate">
            {shown.length} of {all.length} circle{all.length === 1 ? "" : "s"} on {deployment?.name}
          </p>
        </div>
      )}

      {ready && isLoading && <SkeletonCards />}

      {ready && circles && circles.length === 0 && (
        <EmptyState
          title="No circles here yet."
          body="Be the first. Pick the people, the amount and the round length, and you will see the whole schedule before you sign."
          href="/circles/new"
          cta="Start a circle"
        />
      )}

      {ready && circles && circles.length > 0 && shown.length === 0 && (
        <p className="text-sm text-slate">No circle matches that address.</p>
      )}

      {shown.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((address) => (
            <CircleCard key={address} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
