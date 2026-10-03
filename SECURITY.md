# Security

NairaFlow is hackathon software running on testnets. It has not been professionally audited. Do not put real funds into the current deployments.

## Security model in one paragraph

Funds sit in per-instance contracts (one clone per savings circle, one per goal vault), never in a shared pool and never in the agent. The off-chain agent holds no funds and no token allowance. It can call exactly two functions on `AgentExecutor`, and every call is re-checked on chain: a vault release must satisfy the owner's `PolicyManager` policy (destination, per-transaction limit, per-period limit, expiry, active flag) and the vault's own unlock and allowance rules independently. Revoking a policy makes the agent's next call revert with `policy inactive`.

## What is tested

Foundry, 23 tests, all passing (`cd contracts && forge test`):

- 10 savings circle tests: rotation order, security deposit slashing, default handling, activation, leave and refund, double contribution, full circle, reentrancy on `withdrawPayout` using a malicious token, and recovery of the unclaimed pool when every member has defaulted.
- 12 goal vault and policy tests: unlock, periodic allowance, open top-ups, policy-gated agent release, revoked policy, a direct call from a non-agent, and five on policy ownership (a stranger cannot set a policy, cannot revoke the owner's, cannot take the slot after a revoke, a non-contract target fails, and the owner can still replace and revoke).
- 1 invariant test, `invariant_FundsConservation`: 256 runs, 128,000 random calls, 0 reverts. It checks that a circle always holds exactly what it owes.

## Static analysis

Slither 0.11.6, all 102 detectors, run on `contracts/src` excluding mocks and libraries:

| Severity | Count |
|---|---|
| High | 0 |
| Medium | 0 |
| Low | 16 |
| Informational | 21 |
| Optimization | 6 |

How the Low results were handled. Nothing was patched, because the deployed contracts are immutable clones and no result changed an outcome:

| Detector | Count | Assessment |
|---|---|---|
| `timestamp` | 6 | Intended. Round deadlines, unlock dates and policy expiry are time based by design. Miner drift of seconds does not matter for hour and day scale windows. |
| `reentrancy-events`, `reentrancy-benign` | 5 | The factories call `initialize` on the clone they just created, and both factories are `nonReentrant`. State written afterwards is only the registry list. No external party gets control. |
| `missing-zero-check` | 5 | Parameters set by the deploy script or an owner-only setter (`setExecutor`, `setAgentExecutor`) or supplied by the factory. A zero address here is an admin mistake, not an attack path. |

Informational and optimization results are naming style (`_param` initializer arguments), caching `members.length`, and loop cost. Circle size is capped at 20 members, so loops are bounded.

## Bugs found by running and reviewing it

Three real defects were found by operating or reviewing the deployed system, not by the original test suite. All are written up in [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md):

1. `distributeUnclaimedPool()` reverted when every member had defaulted, stranding the pool. Fixed with a fallback to all members, a regression test, and a redeploy on both chains. The old instance still holds about 6 test USDC and is disclosed.
2. The frontend's agent policy panel saved the wrong allowed destination, so every release authorized through the UI would have reverted. Fixed in the frontend. The contracts were correct.
3. `PolicyManager.setPolicy` let anyone create the first policy on any vault and become its policy owner, which locked the real owner out of revoking or replacing it. No funds were at risk, because releases always go to the vault's own destination, but it was an authorization hole. Fixed by requiring the caller to be the vault's owner, with five regression tests (four failed before the fix), and a second redeploy on both chains.

## Known limits and trust assumptions

- A platform admin (the deployer wallet) can pause circles and vaults and manage the stablecoin registry. This is an emergency brake, disclosed here as a centralization tradeoff. Production use would put it behind a timelocked multisig.
- The agent key is a plain hot key. It can only trigger actions the contracts already allow, but losing it lets an attacker trigger those same allowed actions early or repeatedly within policy limits. The scheduled cloud job (`.github/workflows/agent.yml`) uses its own dedicated key, stored as a GitHub repository secret, that holds only testnet gas and the agent role. Anyone with write access to the repository's workflows could read that secret, which is acceptable for a testnet key and would not be for a production one.
- Scheduled GitHub jobs are best effort. In practice the schedule ran far less often than its 10 minute setting, so the agent is a convenience and not something anyone should rely on for timing. Any member can close a due round by hand.
- `mUSDC` and `mUSDG` on Robinhood Chain testnet and `mUSDG` on Arbitrum Sepolia are NairaFlow's own test tokens with a public `mint`. Do not treat them as real stablecoins.
- Fee-on-transfer and rebasing tokens are not supported. The registry only allows tokens the owner has approved.
- A token that can freeze addresses (USDG can) could freeze one member's balance. Payouts are pull based, so one frozen address cannot block the rest of a circle.

## Reporting a problem

Open a private security advisory on the GitHub repository, or open an issue for anything that is not exploitable.
