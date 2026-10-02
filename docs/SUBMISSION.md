# Submission copy

Paste-ready text for the HackQuest project profile and the submission form. Every address here is copied from [DEPLOYMENTS.md](DEPLOYMENTS.md). The demo video link is the one item still to add after recording.

## Project profile

**Name:** NairaFlow

**One line:** Non-custodial stablecoin savings circles and goal vaults for the African diaspora, with an agent that can only act inside limits you set and can be revoked in one click.

**Categories:** DeFi, SocialFi, Infra

**Tech stack:** Solidity, Foundry, OpenZeppelin, TypeScript, viem, wagmi, Next.js, Tailwind

**GitHub:** https://github.com/angelraph/nairaflow

**Live app:** https://nairaflow-angelraphs-projects.vercel.app

**Demo video:** add after recording

## Description

Millions of people in Nigeria and across the African diaspora save through Ajo or Esusu: a group puts money in every round and one member takes the whole pot, in turn, until everyone has been paid. It runs on trust, and it breaks when someone stops paying or the person holding the money disappears.

NairaFlow puts that exact system on Arbitrum, in stablecoins, with no one holding the money.

**Savings Circles.** Each circle is its own contract. Members post a security deposit when they join. If someone misses a round, their deposit covers the pot automatically, they are marked defaulted, and the circle carries on. Payouts are pull based, so one bad address can never block everyone else.

**Goal Vaults.** A personal lock that opens on a date you choose, with an optional recurring allowance. Anyone can top it up, which suits a family member funding someone else's goal.

**A revocable agent.** An off-chain agent resolves due circle rounds and releases vault allowances you have approved. It holds no funds and no token allowance. Every call is re-checked on chain against your policy (destination, per-transaction limit, per-period limit, expiry), and revoking the policy makes its next attempt revert with "policy inactive". Each action is logged with the gas price at execution, so the gas-aware timing claim can be checked on the explorer.

**Savings score.** Any wallet's on-time rate, payouts and per-circle record, read live from on-chain events. It is the start of a credit history for people who save in groups but have no bank record.

## Progress during the hackathon

Everything was built during the buildathon window.

- Contracts: SavingsCircle, GoalVault, PolicyManager, AgentExecutor, StablecoinRegistry and two EIP-1167 clone factories. Deployed and source-verified on Arbitrum Sepolia and Robinhood Chain testnet.
- Tests: 22 unit tests plus a funds-conservation invariant test (256 runs, 128,000 random calls, 0 reverts). Slither: 0 High, 0 Medium. CI runs on every push.
- Off-chain agent in TypeScript, run against both chains. It resolved circle rounds and released vault allowances on its own, and a live policy revocation blocked its very next attempt.
- Frontend: circles, vaults, agent policy panel, activity feed read from chain events, and the savings score page. Mobile responsive.
- Three real bugs found by operating and reviewing the deployed system, all fixed and written up: a pool-recovery revert that stranded funds in the first Sepolia circle, a policy panel that saved the wrong allowed destination, and a missing ownership check that let anyone set an agent policy on someone else's vault (fixed in the contract, with regression tests and a redeploy on both chains).

## Form answers

**Prize tracks:** Overall Prize, Promising Products Track

**Link to frontend:** https://nairaflow-angelraphs-projects.vercel.app

**Core protocol contracts (258 characters):**
ArbSepolia PolicyManager 0x28D4f7C79A26C7C8f23e39Bd57CB6e895bd59B69 AgentExecutor 0x2f00B3d6392D1D98069Ff6E1B355f812948E93B7 | Robinhood testnet PolicyManager 0xa806b5984FF3C55E5B4960c4f275f7B277a63AcC AgentExecutor 0x3b0f0dAb4C018B9e994382Ec940d79cB462eB00F

**Factory contracts (248 characters):**
ArbSepolia CircleFactory 0xAaB3F8C973b16207821C6C93c595fCaCa7D92842 VaultFactory 0x5863AF77A5e0978B7cF140F2D18081E08de2bB0d | Robinhood CircleFactory 0x8EdeeD5342BC4088E5F05e730a64B8b6a82047aa VaultFactory 0x7609Ad496606693a29121260EAD066CBA4e0Bf63

**Token contracts (249 characters):**
ArbSepolia USDC (Circle) 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d, mUSDG (test) 0x84C219D6C228F309061C8F44fab98648DE26A1c1 | Robinhood mUSDC 0xA849faDFb8dFCeD66060bbf71c103328c1a1E713, mUSDG 0x1921513c9A1F29d178194B2e31DAB9F5f1687c5c (test tokens)

**Code produced during the buildathon (180 characters):**
All of it. Contracts, tests, the off-chain agent, the frontend and the docs were written during the buildathon. Third-party code is limited to OpenZeppelin contracts and forge-std.

**Sponsor technologies used:** Robinhood Chain, OpenZeppelin. Do not tick Paxos/USDG unless the mainnet USDG deployment is completed and demonstrated.
