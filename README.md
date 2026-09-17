# NairaFlow

Non-custodial stablecoin savings for the African diaspora, built for the Arbitrum Open House Singapore Buildathon.

NairaFlow has two products sharing one security model:

**Savings Circles** — an on-chain Ajo/Esusu. A fixed group of members contributes a fixed stablecoin amount every round; each round's pool pays one member, in join order, until everyone has been paid once. A security deposit posted at join time backstops the group against a member who stops contributing, so one default never breaks the schedule for the rest of the group.

**Goal Vaults** — an individual, non-custodial lock. Deposit stablecoins that unlock at a future date, or release incrementally against a configured spending allowance.

Both are backed by the same guarantee: funds sit in a contract the user (or the circle's own rules) controls. An off-chain agent can be granted a narrow, revocable capability to trigger due actions — enforcing the owner's spending policy and timing gas-sensitive transactions against live network gas price — but it can never move funds to an arbitrary destination or exceed what the owner authorized.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design, the verified chain configuration for Arbitrum Sepolia and Robinhood Chain testnet, and the reasoning behind each security choice.

## Status

Contracts are written and unit/invariant tested against a local EVM (Foundry). Not yet deployed to a live testnet. Frontend and off-chain agent are scaffolded; agent logic is implemented against the on-chain interfaces but untested against a real deployment yet.

## Repository layout

`contracts/` — Foundry project: SavingsCircle, GoalVault, PolicyManager, AgentExecutor, StablecoinRegistry, and their factories, plus the test suite.

`agent/` — Node/TypeScript off-chain executor that watches for due circle rounds and policy-authorized vault releases.

`frontend/` — Next.js app.

`docs/` — architecture notes, deployment addresses (once live), demo script.

## Development

```bash
cd contracts
forge build
forge test
```

Copy `contracts/.env.example` to `contracts/.env` and fill in a testnet-only deployer key before running the deploy script.
