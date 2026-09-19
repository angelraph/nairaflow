# NairaFlow

Non-custodial stablecoin savings for the African diaspora, built for the Arbitrum Open House Singapore Buildathon.

NairaFlow has two products sharing one security model:

**Savings Circles**: an on-chain Ajo/Esusu. A fixed group of members contributes a fixed stablecoin amount every round; each round's pool pays one member, in join order, until everyone has been paid once. A security deposit posted at join time backstops the group against a member who stops contributing, so one default never breaks the schedule for the rest of the group.

**Goal Vaults**: an individual, non-custodial lock. Deposit stablecoins that unlock at a future date, or release incrementally against a configured spending allowance.

Both are backed by the same guarantee: funds sit in a contract the user (or the circle's own rules) controls. An off-chain agent can be granted a narrow, revocable capability to trigger due actions, enforcing the owner's spending policy and timing gas-sensitive transactions against live network gas price, but it can never move funds to an arbitrary destination or exceed what the owner authorized.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design, the verified chain configuration for Arbitrum Sepolia and Robinhood Chain testnet, and the reasoning behind each security choice, including how this differs from the other group-savings and agent-policy projects submitted to the same event.

## Status

Live on Arbitrum Sepolia and Robinhood Chain testnet. Addresses are in [docs/DEPLOYMENTS.md](docs/DEPLOYMENTS.md). Contracts have a full unit and invariant test suite (Foundry). The off-chain agent and frontend are both built and have been run against real transactions on both testnets, not just against local tests.

## Repository layout

`contracts/` is the Foundry project: SavingsCircle, GoalVault, PolicyManager, AgentExecutor, StablecoinRegistry, and their factories, plus the test suite.

`agent/` is the Node/TypeScript off-chain executor that watches for due circle rounds and policy-authorized vault releases.

`frontend/` is the Next.js app.

`docs/` holds architecture notes, live deployment addresses, and the demo script.

## Development

```bash
cd contracts
forge build
forge test
```

Copy `contracts/.env.example` to `contracts/.env` and fill in a testnet-only deployer key before running the deploy script.

```bash
cd frontend
npm install
npm run dev
```

Copy `frontend/.env.example` to `frontend/.env.local` if you need to override the default RPC URLs or add a WalletConnect project ID.
