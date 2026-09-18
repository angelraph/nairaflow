// Dev-only smoke test: runs the real watcher logic (findDueVaultReleases,
// executeVaultRelease, findDueCircleRounds, executeCircleResolution) against a local Anvil
// deployment, so the agent's actual code path is proven end-to-end before it's ever pointed
// at a public testnet. Not part of the shipped agent — invoked manually during development.
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import "dotenv/config";
import { findDueVaultReleases, executeVaultRelease, findDueCircleRounds, executeCircleResolution } from "../src/executor.js";
import { GasOracle } from "../src/gasOracle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const localAnvil = defineChain({
  id: 31337,
  name: "Local (dev)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["http://127.0.0.1:8545"] } },
  testnet: true,
});

const deployment = JSON.parse(readFileSync(join(__dirname, "..", "deployments", "31337.json"), "utf-8"));

async function main() {
  const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY as `0x${string}`);
  const publicClient = createPublicClient({ chain: localAnvil, transport: http() });
  const walletClient = createWalletClient({ account, chain: localAnvil, transport: http() });
  const gasOracle = new GasOracle(publicClient);

  console.log("Agent account:", account.address);
  await gasOracle.sample();

  const dueCircles = await findDueCircleRounds(publicClient, deployment);
  console.log("Due circle rounds:", dueCircles);
  for (const circle of dueCircles) {
    const hash = await executeCircleResolution(walletClient, publicClient, deployment, circle);
    console.log(`Resolved circle ${circle} -> ${hash}`);
  }

  const dueVaults = await findDueVaultReleases(publicClient, deployment);
  console.log("Due vault releases:", dueVaults);
  for (const { vault, amount } of dueVaults) {
    const hash = await executeVaultRelease(walletClient, publicClient, deployment, vault, amount);
    console.log(`Released ${amount} from vault ${vault} -> ${hash}`);
  }

  if (dueCircles.length === 0 && dueVaults.length === 0) {
    console.log("Nothing due right now.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
