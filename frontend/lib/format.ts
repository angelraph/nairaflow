import { formatUnits, parseUnits } from "viem";

export function formatToken(amount: bigint | undefined, decimals: number, maxFractionDigits = 2): string {
  if (amount === undefined) return "-";
  const formatted = formatUnits(amount, decimals);
  const [whole, frac = ""] = formatted.split(".");
  const trimmedFrac = frac.slice(0, maxFractionDigits).replace(/0+$/, "");
  const withThousands = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return trimmedFrac ? `${withThousands}.${trimmedFrac}` : withThousands;
}

export function parseToken(amount: string, decimals: number): bigint {
  return parseUnits(amount || "0", decimals);
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "0m";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (days === 0 && minutes > 0) parts.push(`${minutes}m`);
  return parts.length ? parts.join(" ") : "<1m";
}

export function formatCountdown(targetTimestamp: number, nowSeconds: number): string {
  const diff = targetTimestamp - nowSeconds;
  if (diff <= 0) return "due now";
  return `in ${formatDuration(diff)}`;
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDate(timestampSeconds: number): string {
  if (!timestampSeconds) return "-";
  return new Date(timestampSeconds * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
