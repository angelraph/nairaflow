"use client";

import { useAccount } from "wagmi";
import { useDeployment } from "@/lib/useDeployment";

export function DeploymentBanner() {
  const { isConnected } = useAccount();
  const { deployment, ready } = useDeployment();

  if (!isConnected) {
    return (
      <div className="card mb-6 border-accent/30 bg-accent/5 text-sm text-ink/80">
        Connect a wallet to create or view circles and vaults.
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="card mb-6 border-negative/30 bg-negative/5 text-sm text-negative">
        This network isn't one NairaFlow supports. Switch to Arbitrum Sepolia or Robinhood Chain Testnet.
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="card mb-6 border-warn/30 bg-warn/5 text-sm text-warn">
        NairaFlow hasn't been deployed to {deployment.name} yet. Run the deploy script and fill in{" "}
        <code>frontend/deployments/{deployment.chainId}.json</code>.
      </div>
    );
  }

  return null;
}
