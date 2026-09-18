"use client";

import { useReadContract, useReadContracts } from "wagmi";
import type { Address } from "viem";
import { stablecoinRegistryAbi, erc20Abi } from "@/lib/abi";
import { useDeployment } from "@/lib/useDeployment";

export function useTokenList() {
  const { deployment, ready } = useDeployment();

  const { data: tokens } = useReadContract({
    address: deployment?.stablecoinRegistry as Address | undefined,
    abi: stablecoinRegistryAbi,
    functionName: "allTokens",
    query: { enabled: ready },
  });

  const list = tokens ?? [];

  const { data: symbols } = useReadContracts({
    contracts: list.map((address) => ({ address, abi: erc20Abi, functionName: "symbol" }) as const),
    query: { enabled: list.length > 0 },
  });

  const { data: decimalsList } = useReadContracts({
    contracts: list.map((address) => ({ address, abi: erc20Abi, functionName: "decimals" }) as const),
    query: { enabled: list.length > 0 },
  });

  return list.map((address, i) => ({
    address,
    symbol: (symbols?.[i]?.result as string) ?? "?",
    decimals: (decimalsList?.[i]?.result as number) ?? 6,
  }));
}

export function TokenSelect({
  value,
  onChange,
}: {
  value: Address | "";
  onChange: (address: Address, decimals: number) => void;
}) {
  const tokens = useTokenList();

  return (
    <select
      className="input"
      value={value}
      onChange={(e) => {
        const token = tokens.find((t) => t.address === e.target.value);
        if (token) onChange(token.address, token.decimals);
      }}
    >
      <option value="" disabled>
        Select a stablecoin
      </option>
      {tokens.map((token) => (
        <option key={token.address} value={token.address}>
          {token.symbol}
        </option>
      ))}
    </select>
  );
}
