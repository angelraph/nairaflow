# Demo Script

This walkthrough has been run in full against a local Anvil chain with real transactions (no mocked calls) — see the local-deployment section of each step. The same sequence gets re-run against Arbitrum Sepolia and Robinhood Chain Testnet once deployed, with real explorer links replacing the local ones below.

## Savings Circle

1. Creator (account A) approves the factory for one security deposit, then calls `createCircle(usdc, 100 USDC, 1 hour, 3 members, 1x deposit)`. The creator is automatically the circle's first member.
2. Members B and C each approve and call `join()`. The circle auto-activates the instant the third member joins.
3. All three members `contribute()` their round-0 amount.
4. Once the round deadline passes, the agent calls `AgentExecutor.resolveCircleRound(circle)` — this is permissionless by design, but routing it through the agent tags the action with the live gas price. Member A (round-0 recipient in join order) is credited the full pool.
5. Member A calls `withdrawPayout()` and receives real USDC.
6. Round 1 repeats; this time it's demonstrated as **fully autonomous** — the off-chain agent (`agent/scripts/local-test.ts`, the same logic path as the production watcher) detects the overdue round on its own and resolves it without any manual trigger.

Verified locally: creator auto-join deposit, third-join auto-activation, contribution accounting, agent-resolved payout (300 USDC to the round-0 recipient), real withdrawal, and a second round resolved entirely autonomously by the agent's own due-action detection.

## Goal Vault + Agent Policy

1. Owner creates a vault with a 1-year unlock date but a 40–50 USDC/day early-withdrawal allowance.
2. Owner deposits USDC into the vault.
3. Owner authorizes the agent via `PolicyManager.setPolicy(vault, destination, maxPerTx, maxPerPeriod, periodLength, expiry)`.
4. Agent calls `AgentExecutor.executeVaultRelease(vault, amount)` — verified on-chain to move funds directly from the vault to the owner's configured destination, respecting both the policy's limits and the vault's own period allowance independently.
5. **Revocation demo**: owner calls `PolicyManager.revokePolicy(vault)`. The agent's next `executeVaultRelease` call reverts on-chain with `"policy inactive"` — proven, not simulated.
6. Autonomous detection: a second vault, funded and policy-authorized, is picked up and released by the agent's own polling loop with zero manual intervention.

Verified locally: deposit, agent-triggered release (40 USDC), live policy revocation blocking the very next agent attempt, and one vault release triggered entirely autonomously by the agent.

## Two bugs this walkthrough actually caught

Running the real agent code against a real chain — rather than trusting the code by inspection — surfaced two genuine bugs before they could reach a testnet:

- The agent's ABI definitions were plain human-readable strings, not parsed through viem's `parseAbi`, which fails at runtime (`getContract(...).read.getAllCircles` was `undefined`) in both the agent and the frontend.
- `findDueCircleRounds` compared a round's deadline against the local machine's wall clock instead of the chain's own block timestamp — invisible in normal operation but caught immediately once the local chain's time was fast-forwarded ahead of real time.

Both are fixed in `agent/src/abi.ts`, `frontend/lib/abi.ts`, and `agent/src/executor.ts`.
