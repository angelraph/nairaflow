"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAccount, useConfig, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { isAddress, type Address } from "viem";
import { NotFoundNote } from "@/components/NotFoundNote";
import { goalVaultAbi, erc20Abi } from "@/lib/abi";
import { formatToken, formatAddress, formatDate, parseToken } from "@/lib/format";
import { PolicyPanel } from "@/components/PolicyPanel";

function safeParse(value: string, decimals: number): bigint {
  try {
    return parseToken(value, decimals);
  } catch {
    return 0n;
  }
}

export default function VaultDetailPage() {
  const params = useParams();
  const address = params.address as Address;
  const { address: account } = useAccount();
  const config = useConfig();
  const publicClient = usePublicClient();
  const explorer = publicClient?.chain?.blockExplorers?.default.url;
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState("50");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data, refetch } = useReadContracts({
    contracts: [
      { address, abi: goalVaultAbi, functionName: "token" },
      { address, abi: goalVaultAbi, functionName: "owner" },
      { address, abi: goalVaultAbi, functionName: "destination" },
      { address, abi: goalVaultAbi, functionName: "unlockDate" },
      { address, abi: goalVaultAbi, functionName: "maxPerPeriod" },
      { address, abi: goalVaultAbi, functionName: "periodLength" },
      { address, abi: goalVaultAbi, functionName: "totalDeposited" },
      { address, abi: goalVaultAbi, functionName: "totalWithdrawn" },
      { address, abi: goalVaultAbi, functionName: "availableNow" },
    ],
    query: { refetchInterval: 8000 },
  });

  const [token, owner, destination, unlockDate, maxPerPeriod, periodLength, totalDeposited, totalWithdrawn, availableNow] = data ?? [];
  const tokenAddress = token?.result as Address | undefined;
  const isOwner = Boolean(account && owner?.result && (owner.result as string).toLowerCase() === account.toLowerCase());

  const { data: tokenMeta } = useReadContracts({
    contracts: tokenAddress
      ? [
          { address: tokenAddress, abi: erc20Abi, functionName: "symbol" },
          { address: tokenAddress, abi: erc20Abi, functionName: "decimals" },
        ]
      : [],
    query: { enabled: Boolean(tokenAddress) },
  });
  const symbol = (tokenMeta?.[0]?.result as string) ?? "";
  const decimals = (tokenMeta?.[1]?.result as number) ?? 6;

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && tokenAddress ? [account, address] : undefined,
    query: { enabled: Boolean(account && tokenAddress) },
  });

  async function run(key: string, fn: () => Promise<`0x${string}`>) {
    setPending(key);
    setError(null);
    try {
      const hash = await fn();
      await waitForTransactionReceipt(config, { hash });
      await Promise.all([refetch(), refetchAllowance()]);
    } catch (err) {
      console.error(err);
      setError("That transaction was cancelled or failed. Nothing changed.");
    } finally {
      setPending(null);
    }
  }

  const depositParsed = safeParse(depositAmount, decimals);
  const withdrawParsed = safeParse(withdrawAmount, decimals);
  const availableValue = availableNow?.result as bigint | undefined;

  async function handleDeposit() {
    if (!tokenAddress || depositParsed <= 0n) return;
    if ((allowance ?? 0n) < depositParsed) {
      await run("approve", () => writeContractAsync({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [address, depositParsed] }));
    }
    await run("deposit", () => writeContractAsync({ address, abi: goalVaultAbi, functionName: "deposit", args: [depositParsed] }));
  }

  async function handleWithdraw() {
    if (withdrawParsed <= 0n) return;
    await run("withdraw", () => writeContractAsync({ address, abi: goalVaultAbi, functionName: "withdraw", args: [withdrawParsed] }));
    setWithdrawAmount("");
  }

  if (!isAddress(address ?? "")) {
    return <NotFoundNote what="vault" reason="That is not a valid contract address." backHref="/vaults" backLabel="Browse vaults" />;
  }

  if (!data) {
    return <p className="text-sm text-slate">Loading vault...</p>;
  }

  if (token?.error) {
    return (
      <NotFoundNote
        what="vault"
        reason="We could not read a NairaFlow vault at this address on the network your wallet is using. It may be on the other network, so try switching from the wallet button in the top bar."
        backHref="/vaults"
        backLabel="Browse vaults"
      />
    );
  }

  const unlocked = unlockDate?.result ? Number(unlockDate.result) * 1000 <= Date.now() : false;
  const hasAllowance = Boolean(maxPerPeriod?.result && (maxPerPeriod.result as bigint) > 0n);
  const withdrawTooMuch = availableValue !== undefined && withdrawParsed > availableValue;

  return (
    <div className="flex flex-col gap-10">
      <header className="hero-in flex flex-col gap-6 border-b border-sand pb-10 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="tag">Goal vault</p>
          <p className="num mt-3 text-5xl text-ink sm:text-6xl">
            {formatToken(totalDeposited?.result as bigint, decimals)}
            <span className="ml-3 text-xl text-slate">{symbol} deposited</span>
          </p>
          <p className="mt-4 break-all font-mono text-xs text-slate sm:text-sm">
            {explorer ? (
              <a className="hover:text-ink" href={`${explorer}/address/${address}`} target="_blank" rel="noopener noreferrer">
                {address}
              </a>
            ) : (
              address
            )}
          </p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-sm ${
            unlocked ? "border-positive/40 bg-positive/10 text-positive" : "border-warn/40 bg-warn/10 text-warn"
          }`}
        >
          {unlocked ? "Unlocked" : "Locked"}
        </span>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
        <Stat label="Available now" value={`${formatToken(availableValue, decimals)} ${symbol}`} />
        <Stat label="Unlocks" value={unlockDate?.result ? formatDate(Number(unlockDate.result)) : "-"} />
        <Stat label="Owner" value={owner?.result ? formatAddress(owner.result as string) : "-"} mono />
        <Stat label="Releases go to" value={destination?.result ? formatAddress(destination.result as string) : "-"} mono />
      </dl>

      {hasAllowance && (
        <p className="rounded-card border border-sand bg-surface px-5 py-4 text-sm leading-relaxed text-slate">
          Early withdrawals are allowed up to{" "}
          <span className="num text-ink">
            {formatToken(maxPerPeriod?.result as bigint, decimals)} {symbol}
          </span>{" "}
          every {Number(periodLength?.result ?? 0) / 86400} day(s). Periods are fixed windows, so a 1 day period resets at midnight UTC.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="card flex flex-col gap-4">
          <div>
            <h2 className="text-lg tracking-tight text-ink">Top up this vault</h2>
            <p className="mt-1 text-sm text-slate">Anyone can fund it, which suits family saving toward your goal.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input className="input num" type="number" min="0" step="any" aria-label="Amount to deposit" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            <button className="btn-primary whitespace-nowrap" disabled={pending !== null || !account || depositParsed <= 0n} onClick={handleDeposit}>
              {pending === "approve" ? "Approving..." : pending ? "Working..." : `Deposit ${symbol}`}
            </button>
          </div>
          {!account && <p className="text-xs text-slate">Connect a wallet to deposit.</p>}
        </div>

        {isOwner && (
          <div className="card flex flex-col gap-4">
            <div>
              <h2 className="text-lg tracking-tight text-ink">Withdraw</h2>
              <p className="mt-1 text-sm text-slate">
                {unlocked ? "The vault is unlocked, so you can take everything." : hasAllowance ? "Still locked. You can take up to your allowance." : "Locked until the unlock date."}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input className="input num" type="number" min="0" step="any" aria-label="Amount to withdraw" placeholder={`Up to ${formatToken(availableValue, decimals)}`} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              <button className="btn-primary" disabled={pending !== null || withdrawParsed <= 0n || withdrawTooMuch} onClick={handleWithdraw}>
                {pending === "withdraw" ? "Working..." : "Withdraw"}
              </button>
            </div>
            {withdrawTooMuch && <p className="text-xs text-negative">That is more than is available right now.</p>}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-negative">{error}</p>}

      {destination?.result && owner?.result ? (
        <PolicyPanel
          target={address}
          vaultOwner={owner.result as Address}
          destination={destination.result as Address}
          decimals={decimals}
          symbol={symbol}
        />
      ) : null}

      <p className="text-xs text-slate">
        Want the details?{" "}
        <Link className="text-accent hover:underline" href="/docs#vaults">
          Read how vaults and the agent work
        </Link>
        .
      </p>
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dd className={`${mono ? "font-mono text-xl sm:text-2xl" : "num text-2xl sm:text-3xl"} text-ink`}>{value}</dd>
      <dt className="mt-1 text-xs tracking-wide text-slate">{label}</dt>
    </div>
  );
}
