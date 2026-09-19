# NairaFlow: Architecture

## What this is

NairaFlow is a non-custodial stablecoin savings platform for the African diaspora, built for the Arbitrum Open House Singapore Buildathon. It has two products sharing one security model:

1. **Savings Circles** (headline feature): an on-chain Ajo/Esusu. A fixed group of members contributes a fixed stablecoin amount every round; one member is paid the full pot each round, in join order, until everyone has been paid once. Non-contribution is handled by a posted security deposit, so one defaulter never breaks the schedule for the rest of the group.
2. **Goal Vaults** (secondary feature): an individual lock. A user deposits stablecoins that unlock at a future date, or release incrementally against a spending-limit policy.

Both are backed by the same non-custodial guarantee: user funds sit in a contract the user (or the circle's own rules) controls. An off-chain agent can be granted a narrow, revocable capability to trigger due actions. It can never move funds to an arbitrary destination or exceed the policy the user set.

## Where this sits next to similar ideas in this event

CommitCircle, also submitted to this buildathon, locks a group's USDC in a vault that unlocks by quorum vote or by a deadline. That's a genuinely different mechanic from a rotating savings circle: one shared pool, for one shared goal, released together, once, by agreement. NairaFlow's SavingsCircle is a continuous rotation: a fixed group contributes every round, and one member receives the full pot each round in a known, guaranteed order, exactly how Ajo and Esusu actually run in Nigeria and across the West African diaspora today. Nobody votes on who gets paid next. That's not a missing feature, it's the point: a rotating circle only works because every member already knows exactly when their turn comes. That's also why the security-deposit and default-forfeiture logic exists here and wouldn't make sense in a quorum-unlock model: an unreliable member in a rotation has to be handled automatically and immediately, not put to a vote.

The "agent enforces an on-chain spending policy" pattern behind PolicyManager and AgentExecutor also shows up, independently, in several other AI-agent-focused submissions to this event (Agent Guardian, Fieldcast Buyer Agent, and others). That convergence is a reasonable signal the pattern itself is sound, but it means the pattern alone isn't what NairaFlow is betting on. What none of those projects share with NairaFlow is a named population and a named, already-practiced financial ritual behind the product decisions, not an abstract "agentic finance" pitch.

## Why these design choices

- **Factory + EIP-1167 minimal-proxy clones**, not one ID-keyed contract. Each circle/vault gets isolated storage in its own address. This removes an entire class of cross-circle accounting bugs, keeps per-circle deploys cheap (around 45k gas vs. 1-2M for a full contract), and gives judges and explorers a clean, individually-inspectable contract per circle.
- **FIFO rotation, not randomized.** No dependency on on-chain randomness (blockhash or VRF), which may not be available on a brand-new Orbit testnet. Deterministic and fully testable.
- **Pull-over-push payouts.** Round resolution credits a `pendingWithdrawal` balance; the recipient calls `withdrawPayout()` separately. A malicious or non-standard recipient can never block round closure for the rest of the group.
- **Plain on-chain `AccessControl` plus `PolicyManager` and `AgentExecutor`, not ERC-4337/ZeroDev**, for the agent's execution capability. Robinhood Chain does have first-class ERC-4337 support through Alchemy, but committing to bundler and paymaster infrastructure on a brand-new Orbit testnet, alongside Arbitrum Sepolia, is unnecessary integration risk for the guarantee actually needed: a scoped, revocable, non-custodial trigger. The simple pattern delivers the same guarantee and is easier for a judge to audit by reading the contract directly. The trade-off is that users pay their own gas (no gasless UX), an explicit, disclosed choice rather than an oversight.
- **Gas-awareness is verifiable, not decorative.** `AgentExecutor` emits `AgentExecuted(id, actionType, gasPriceWei, timestamp)` on every action, so a judge can pull this straight off the explorer.

## Verified chain configuration

Confirmed directly from the hackathon's official Resources page and Robinhood Chain's own developer docs (docs.robinhood.com/chain), not assumed from memory.

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

- **USDC (primary)**: Circle's official testnet contract on Arbitrum Sepolia is `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`, confirmed via developers.circle.com (Arbitrum Sepolia row). Faucet: `https://faucet.circle.com`.
- **mUSDC / mUSDG on Robinhood Chain testnet**: Robinhood Chain's testnet is permissionless, so anyone can deploy a token named "USDC" or "USDG". Querying the Blockscout API turned up a dozen or more tokens using those symbols (`Mock USDG`, `USD Gold (testnet)`, `Global Dollar`, and others) with no canonical or verified marker distinguishing an official one. Rather than guess and risk pointing the demo at an impostor token, NairaFlow deploys its own mock stablecoins on Robinhood Chain testnet, with symbols `mUSDC` and `mUSDG` so the `m` prefix is baked into the on-chain symbol itself and can never be confused for the real token anywhere it's displayed.
- **USDG on mainnet**: Paxos confirms USDG is issued on Robinhood Chain mainnet, per docs.robinhood.com and globaldollar.com, and is the ecosystem's flagship stablecoin, listed as Robinhood Chain's stablecoin infrastructure partner and bridgeable via LayerZero OFT. No public USDG testnet faucet was found during research. `StablecoinRegistry` is token-agnostic by design, so registering the real address later is a config change, not a contract change.

## Repository layout

```
Nairaflow/
  contracts/     Foundry project: SavingsCircle, GoalVault, PolicyManager, AgentExecutor, registries, tests
  agent/         Node/TypeScript off-chain executor (viem)
  frontend/      Next.js app
  docs/          this file, DEPLOYMENTS.md, DEMO_SCRIPT.md
```
