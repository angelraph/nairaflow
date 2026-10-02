"use client";

import { useState } from "react";
import { useAccount, useConfig, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useDeployment } from "@/lib/useDeployment";
import { erc20Abi } from "@/lib/abi";
import { useTokenList } from "@/components/TokenSelect";
import { formatToken } from "@/lib/format";

const gasFaucets: Record<number, { label: string; href: string }> = {
  421614: { label: "Get testnet ETH for gas", href: "https://arbitrum.faucet.dev/" },
  46630: { label: "Get testnet ETH for gas", href: "https://faucet.testnet.chain.robinhood.com" },
};

// Mock tokens (symbol starts with "m") have a public mint, so anyone can get play money here. Real USDC on
// Arbitrum Sepolia comes from Circle's own faucet. This is testnet only and never shown against real tokens.
export function TestFaucet() {
  const { address: account, isConnected } = useAccount();
  const { chainId, deployment, ready } = useDeployment();
  const tokens = useTokenList();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: balances, refetch } = useReadContracts({
    contracts: account ? tokens.map((t) => ({ address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [account] }) as const) : [],
    query: { enabled: Boolean(account) && tokens.length > 0, refetchInterval: 10000 },
  });

  if (!isConnected || !ready || !deployment || tokens.length === 0) return null;

  const mocks = tokens.filter((t) => t.symbol.startsWith("m"));
  const hasRealUsdc = tokens.some((t) => t.symbol === "USDC");
  const gas = gasFaucets[chainId];

  async function mint(index: number) {
    const token = tokens[index];
    if (!account) return;
    setPending(token.address);
    setError(null);
    try {
      const hash = await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: "mint",
        args: [account, 1000n * 10n ** BigInt(token.decimals)],
      });
      await waitForTransactionReceipt(config, { hash });
      await refetch();
    } catch (err) {
      console.error(err);
      setError("The mint did not go through. Check you have testnet ETH for gas and try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="card flex flex-col gap-4">
      <div>
        <p className="tag">Need test tokens?</p>
        <p className="mt-1.5 text-sm leading-relaxed text-slate">
          This is a testnet, so everything here is play money. Grab some below and try the app end to end.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {mocks.map((t) => {
          const index = tokens.findIndex((x) => x.address === t.address);
          const balance = balances?.[index]?.result as bigint | undefined;
          return (
            <div key={t.address} className="flex flex-col gap-3 rounded-[14px] border border-sand bg-carbon p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-ink">{t.symbol}</p>
                <p className="num text-sm text-slate">You hold {formatToken(balance, t.decimals)}</p>
              </div>
              <button className="btn-secondary" disabled={pending !== null} onClick={() => mint(index)}>
                {pending === t.address ? "Minting..." : `Get 1,000 ${t.symbol}`}
              </button>
            </div>
          );
        })}
        {hasRealUsdc && (
          <a className="btn-secondary w-fit" href="https://faucet.circle.com/" target="_blank" rel="noopener noreferrer">
            Get Circle test USDC &rsaquo;
          </a>
        )}
        {gas && (
          <a className="text-sm text-accent hover:underline" href={gas.href} target="_blank" rel="noopener noreferrer">
            {gas.label} &rsaquo;
          </a>
        )}
      </div>
      {error && <p className="text-sm text-negative">{error}</p>}
    </div>
  );
}
