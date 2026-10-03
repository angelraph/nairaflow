import type { PublicClient } from "viem";

// Public RPC endpoints cap how many blocks one eth_getLogs call may span (some at 10 million, some at 50,000).
// Try the whole range first. If the endpoint refuses, read it in windows that every endpoint accepts.
const WINDOW = 40_000n;

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getLogsSafe(client: PublicClient, params: any): Promise<any[]> {
  try {
    return (await client.getLogs(params)) as any[];
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    if (!/range|limit|exceed|too many|too large|10000|50000/i.test(msg)) throw err;

    const from = BigInt(params.fromBlock ?? 0);
    const latest = await client.getBlockNumber();
    const windows: [bigint, bigint][] = [];
    for (let start = from; start <= latest; start += WINDOW + 1n) {
      const end = start + WINDOW > latest ? latest : start + WINDOW;
      windows.push([start, end]);
    }

    const out: any[] = [];
    for (let i = 0; i < windows.length; i += 4) {
      const batch = await Promise.all(
        windows.slice(i, i + 4).map(([a, b]) => client.getLogs({ ...params, fromBlock: a, toBlock: b }))
      );
      out.push(...batch.flat());
    }
    return out;
  }
}
