import { createPublicClient, createWalletClient, http, type Address, type PublicClient, type WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { AGENT_PRIVATE_KEY, GAS_PRICE_TARGET_RATIO, POLL_INTERVAL_MS, targets, type Deployment } from "./config.js";
import { GasOracle } from "./gasOracle.js";
import { executeCircleResolution, executeVaultRelease, findDueCircleRounds, findDueVaultReleases } from "./executor.js";

// Don't stall a due, policy-authorized vault release waiting for cheaper gas beyond this —
// honoring the schedule the user set always wins over saving gas.
const MAX_WAIT_MS = 10 * 60 * 1000;

interface ChainState {
  name: string;
  deployment: Deployment;
  publicClient: PublicClient;
  walletClient: WalletClient;
  gasOracle: GasOracle;
  firstSeenDue: Map<Address, number>;
}

function setupChainStates(account: ReturnType<typeof privateKeyToAccount>): ChainState[] {
  return targets.map((target) => {
    const deployment = target.deployment();
    const publicClient = createPublicClient({ chain: target.chain, transport: http() });
    const walletClient = createWalletClient({ account, chain: target.chain, transport: http() });
    return {
      name: deployment.name,
      deployment,
      publicClient,
      walletClient,
      gasOracle: new GasOracle(publicClient),
      firstSeenDue: new Map<Address, number>(),
    };
  });
}

async function pollChain(state: ChainState) {
  const { name, deployment, publicClient, walletClient, gasOracle, firstSeenDue } = state;
  const currentGasPrice = await gasOracle.sample();

  // SavingsCircle rounds are only ever "due" once their deadline has already passed — there is
  // no earlier window worth waiting inside, so resolve them as soon as they're seen.
  const dueCircles = await findDueCircleRounds(publicClient, deployment);
  for (const circle of dueCircles) {
    try {
      const hash = await executeCircleResolution(walletClient, publicClient, deployment, circle);
      console.log(`[${name}] resolved circle round ${circle} -> ${hash}`);
    } catch (err) {
      console.error(`[${name}] failed to resolve circle ${circle}:`, err);
    }
  }

  // GoalVault releases have a flexible window (available until the period resets or the vault
  // unlocks further), so it's worth waiting briefly for cheaper gas here.
  const dueVaults = await findDueVaultReleases(publicClient, deployment);
  const stillDue = new Set<Address>();

  for (const { vault, amount } of dueVaults) {
    stillDue.add(vault);
    const seenAt = firstSeenDue.get(vault) ?? Date.now();
    firstSeenDue.set(vault, seenAt);

    const waitedTooLong = Date.now() - seenAt > MAX_WAIT_MS;
    const favorable = gasOracle.isFavorable(currentGasPrice, GAS_PRICE_TARGET_RATIO);

    if (!favorable && !waitedTooLong) {
      console.log(
        `[${name}] vault ${vault} release due (${amount}), waiting for better gas — ` +
          `current ${currentGasPrice} wei, baseline ${gasOracle.baseline()} wei`
      );
      continue;
    }

    try {
      const hash = await executeVaultRelease(walletClient, publicClient, deployment, vault, amount);
      console.log(`[${name}] released ${amount} from vault ${vault} -> ${hash}`);
      firstSeenDue.delete(vault);
    } catch (err) {
      console.error(`[${name}] failed to release vault ${vault}:`, err);
    }
  }

  for (const vault of firstSeenDue.keys()) {
    if (!stillDue.has(vault)) firstSeenDue.delete(vault);
  }
}

async function main() {
  if (!AGENT_PRIVATE_KEY) {
    throw new Error(
      "AGENT_PRIVATE_KEY is not set — the agent needs its own funded testnet key with AGENT_ROLE granted on AgentExecutor."
    );
  }
  const account = privateKeyToAccount(AGENT_PRIVATE_KEY);
  const states = setupChainStates(account);

  console.log(`NairaFlow agent starting on ${states.length} chain(s). Poll interval: ${POLL_INTERVAL_MS}ms`);

  for (;;) {
    for (const state of states) {
      try {
        await pollChain(state);
      } catch (err) {
        console.error(`[${state.name}] poll error:`, err);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

main();
