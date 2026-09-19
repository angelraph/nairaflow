import type { PublicClient } from "viem";

const SAMPLE_WINDOW = 20;

/**
 * Agent v1's gas-awareness: keeps a small rolling window of recent `eth_gasPrice` samples per
 * chain and decides whether "now" is a favorable time to execute a time-flexible action. This
 * is the only thing standing in for the original pitch's "AI watches the rate" idea, but
 * gas price is real, on-chain, and verifiable (unlike a fabricated NGN/USD rate), and every
 * decision this makes is stamped into the resulting AgentExecuted event via tx.gasprice, so it
 * can be checked against the explorer after the fact.
 */
export class GasOracle {
  private samples: bigint[] = [];

  constructor(private client: PublicClient) {}

  async sample(): Promise<bigint> {
    const price = await this.client.getGasPrice();
    this.samples.push(price);
    if (this.samples.length > SAMPLE_WINDOW) this.samples.shift();
    return price;
  }

  baseline(): bigint | null {
    if (this.samples.length === 0) return null;
    const sum = this.samples.reduce((a, b) => a + b, 0n);
    return sum / BigInt(this.samples.length);
  }

  /** Is `price` at or below `ratio` of the current rolling baseline? */
  isFavorable(price: bigint, ratio: number): boolean {
    const base = this.baseline();
    if (base === null) return true; // no baseline yet, don't block the very first sample
    const ratioBps = BigInt(Math.round(ratio * 10_000));
    return price * 10_000n <= base * ratioBps;
  }
}
