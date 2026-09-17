# NairaFlow — Architecture

## What this is

NairaFlow is a non-custodial stablecoin savings platform for the African diaspora, built for the Arbitrum Open House Singapore Buildathon. It has two products sharing one security model:

1. **Savings Circles** (headline feature) — an on-chain Ajo/Esusu: a fixed group of members contributes a fixed stablecoin amount every round; one member is paid the full pot each round, in join order, until everyone has been paid once. Non-contribution is handled by a posted security deposit, so one defaulter never breaks the schedule for the rest of the group.
2. **Goal Vaults** (secondary feature) — an individual lock: a user deposits stablecoins that unlock at a future date, or release incrementally against a spending-limit policy.

Both are backed by the same non-custodial guarantee: user funds sit in a contract the user (or the circle's own rules) controls. An off-chain agent can be granted a narrow, revocable capability to trigger due actions — it can never move funds to an arbitrary destination or exceed the policy the user set.

## Why these design choices

- **Factory + EIP-1167 minimal-proxy clones**, not one ID-keyed contract. Each circle/vault gets isolated storage in its own address — this removes an entire class of cross-circle accounting bugs, keeps per-circle deploys cheap (~45k gas vs. 1-2M for a full contract), and gives judges/explorers a clean, individually-inspectable contract per circle.
- **FIFO rotation, not randomized.** No dependency on on-chain randomness (blockhash or VRF), which may not be available on a brand-new Orbit testnet. Deterministic and fully testable.
- **Pull-over-push payouts.** Round resolution credits a `pendingWithdrawal` balance; the recipient calls `withdrawPayout()` separately. A malicious or non-standard recipient can never block round closure for the rest of the group.
- **Plain on-chain `AccessControl` + `PolicyManager` + `AgentExecutor`, not ERC-4337/ZeroDev**, for the agent's execution capability. Robinhood Chain does have first-class ERC-4337 support via Alchemy, but committing to bundler/paymaster infrastructure on a brand-new Orbit testnet (alongside Arbitrum Sepolia) is unnecessary integration risk for the guarantee actually needed: a scoped, revocable, non-custodial trigger. The simple pattern delivers the same guarantee and is easier for a judge to audit by reading the contract directly. Trade-off: users pay their own gas (no gasless UX) — an explicit, disclosed choice, not an oversight.
- **Gas-awareness is verifiable, not decorative.** `AgentExecutor` emits `AgentExecuted(id, actionType, gasPriceWei, timestamp)` on every action — a judge can pull this straight off the explorer.

## Verified chain configuration

Confirmed directly from the hackathon's official Resources page and Robinhood Chain's own developer docs (docs.robinhood.com/chain) — not assumed from memory.

| Property | Arbitrum Sepolia | Robinhood Chain Testnet |
|---|---|---|
| Chain ID | 421614 | 46630 |
| Public RPC | `https://sepolia-rollup.arbitrum.io/rpc` | `https://rpc.testnet.chain.robinhood.com` |
| Recommended RPC | Alchemy / Infura / QuickNode | Alchemy (`https://robinhood-testnet.g.alchemy.com/v2/{API_KEY}`) |
| Block Explorer | `https://sepolia.arbiscan.io` | `https://explorer.testnet.chain.robinhood.com` (Blockscout) |
| Gas token | ETH | ETH |
| Gas faucet | `https://arbitrum.faucet.dev/`, `https://www.l2faucet.com/arbitrum` | `https://faucet.testnet.chain.robinhood.com` |
| Verification | Etherscan/Arbiscan API | `forge verify-contract --verifier blockscout --verifier-url https://explorer.testnet.chain.robinhood.com/api/` |

## Stablecoins

- **USDC (primary)**: Circle's official testnet contract on Arbitrum Sepolia is `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` (confirmed via developers.circle.com — Arbitrum Sepolia row). Faucet: `https://faucet.circle.com`.
- **USDC / USDG on Robinhood Chain testnet**: Robinhood Chain's testnet is permissionless — anyone can deploy a token named "USDC" or "USDG". Querying the Blockscout API turned up a dozen+ tokens using those symbols (`Mock USDG`, `USD Gold (testnet)`, `Global Dollar`, etc.) with no canonical/verified marker distinguishing an official one. Rather than guess and risk pointing the demo at an impostor token, NairaFlow deploys its own `MockUSDC`/`MockUSDG` on Robinhood Chain testnet, clearly labeled in the UI as "testnet mock — no canonical faucet token confirmed."
- **USDG on mainnet**: Paxos confirms USDG is issued on Robinhood Chain mainnet (per docs.robinhood.com and globaldollar.com) and is the ecosystem's flagship stablecoin (listed as Robinhood Chain's stablecoin infrastructure partner; bridgeable via LayerZero OFT). No public USDG testnet faucet was found during research — `StablecoinRegistry` is token-agnostic by design, so registering the real address later is a config change, not a contract change.

## Repository layout

```
Nairaflow/
  contracts/     Foundry project — SavingsCircle, GoalVault, PolicyManager, AgentExecutor, registries, tests
  agent/         Node/TypeScript off-chain executor (viem)
  frontend/      Next.js app
  docs/          this file, DEPLOYMENTS.md, DEMO_SCRIPT.md
```

See `C:\Users\Admin\.claude\plans\here-nyc-open-houselondon-robust-cosmos.md` for the full day-by-day build plan, contract-by-contract design, and cut order if time runs short.
