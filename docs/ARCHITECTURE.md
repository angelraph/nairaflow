# NairaFlow: Architecture

## What this is

NairaFlow is a non-custodial stablecoin savings platform for the African diaspora, built for the Arbitrum Open House Singapore Buildathon. It has two products sharing one security model:

1. **Savings Circles** (headline feature): an on-chain Ajo/Esusu. A fixed group of members contributes a fixed stablecoin amount every round; one member is paid the full pot each round, in join order, until everyone has been paid once. Non-contribution is handled by a posted security deposit, so one defaulter never breaks the schedule for the rest of the group.
2. **Goal Vaults** (secondary feature): an individual lock. A user deposits stablecoins that unlock at a future date, or release incrementally against a spending-limit policy.

Both are backed by the same non-custodial guarantee: user funds sit in a contract the user (or the circle's own rules) controls. An off-chain agent can be granted a narrow, revocable capability to trigger due actions. It can never move funds to an arbitrary destination or exceed the policy the user set.

## Where this sits next to similar ideas in this event

A scan of the 163 projects in the gallery on 2 October 2026 found four that touch the same ground. They are named here so a reader can compare them directly.

**Potluck** is the closest and the strongest. It is a rotating savings circle (hui, arisan, tanda, chit fund) with collateral, a winner's bond, discount auctions, and an on-chain savings record. It has CI, Slither notes, invariant tests, and a "try it alone" mode where in-browser bots let one judge play a whole circle. It is deployed on Robinhood Chain testnet with a test USDG. Where it is ahead of NairaFlow: auction pricing of the pot, and a dedicated reputation registry contract. NairaFlow's savings score is derived from existing events rather than a separate contract, so it is lighter but not equivalent.

**CommitCircle** locks a group's USDC in one vault that unlocks by quorum vote or deadline. That is a different mechanic from a rotation: one pool, one goal, released once by agreement. **Baraza Protocol** is arbitration for chamas and ROSCAs, which sits next to a circle rather than replacing it. **CommitX** is individual stake-to-commit.

What NairaFlow does that none of these do together:

- **Circles and goal vaults in one product,** under one security model. Group saving and personal saving use the same revocable agent policy.
- **A working agent, not a diagram.** The agent resolves due circle rounds and releases policy-approved vault allowances on its own, and every action is logged on chain with the gas price at execution. The Activity page reads this back from the chain. Across three consecutive vault releases on Arbitrum Sepolia that recorded price fell from about 103M to 75M to 59M wei.
- **Two chains with identical contracts,** all verified on both explorers, so it qualifies for both the Arbitrum and the Robinhood Chain slots.
- **Bugs found by operating it,** not only by tests. Two are documented with transaction links in [DEPLOYMENTS.md](DEPLOYMENTS.md), one of which stranded funds in the first Sepolia circle.
- **A named population.** The product decisions come from how Ajo and Esusu actually run in Nigeria and across the West African diaspora, where every member knows when their turn comes. That is why a missed round is handled automatically by a deposit rather than put to a vote.

The "agent enforces an on-chain spending policy" pattern behind PolicyManager and AgentExecutor also shows up, independently, in about a dozen other submissions (Agent Guardian, AgentVault, Vigiles, Spendkit and others). That convergence suggests the pattern is sound, but it means the pattern alone is not what NairaFlow is betting on.

## Savings score

The Score page (`/score`) reads `MemberJoined`, `Contributed`, `MemberDefaulted` and `RoundResolved` events for any wallet and shows contributions paid, rounds missed, payouts received and an on-time rate. Nothing is stored or editable, and there is no extra contract. The tiers are Reliable at 90% or more, Mixed from 60% to 89%, and At risk below 60%. It is the first step toward a portable credit history for people who save in groups and have no bank record. It only counts NairaFlow circles on the selected network.

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
- **USDG on mainnet**: Robinhood's own token contracts page (docs.robinhood.com/chain/contracts) lists the canonical USDG on Robinhood Chain mainnet (chain id 4663) at `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`. Reading that address on chain returns symbol `USDG` and 6 decimals on mainnet, and no code at all on the testnet, which is why the testnet uses `mUSDG`. No public USDG testnet faucet was found. `StablecoinRegistry` is token-agnostic by design, so using the real token is a config change, not a contract change: the deploy script takes `REAL_USDG_ADDRESS` and `DEPLOY_MOCK_USDC=false` so a mainnet deploy registers only the canonical token and no mocks.

## Repository layout

```
Nairaflow/
  contracts/     Foundry project: SavingsCircle, GoalVault, PolicyManager, AgentExecutor, registries, tests
  agent/         Node/TypeScript off-chain executor (viem)
  frontend/      Next.js app
  docs/          this file, DEPLOYMENTS.md, DEMO_SCRIPT.md
```
