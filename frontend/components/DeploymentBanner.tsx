"use client";

import { useAccount } from "wagmi";
import { useDeployment } from "@/lib/useDeployment";

export function DeploymentBanner() {
  const { isConnected } = useAccount();
  const { deployment, ready } = useDeployment();

  if (!isConnected) {
    return (
      <div className="card mb-6 border-naira/30 bg-naira/5 text-sm text-ink/80">
        Connect a wallet to create or view circles and vaults.
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="card mb-6 border-red-200 bg-red-50 text-sm text-red-800">
        This network isn't one NairaFlow supports. Switch to Arbitrum Sepolia or Robinhood Chain Testnet.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card mb-6 border-amber-200 bg-amber-50 text-sm text-amber-800">
        NairaFlow hasn't been deployed to {deployment.name} yet. Run the deploy script and fill in{" "}
        <code>frontend/deployments/{deployment.chainId}.json</code>.
      </div>
    );
  }

  return null;
}
