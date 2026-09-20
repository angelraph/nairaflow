# Deployments

Every address below comes from an actual `forge script` broadcast (see `contracts/broadcast/`). None are hand-typed.

Both chains were redeployed once, on 2026-09-20, after a real fund-recovery bug turned up on the live Sepolia circle. See [Bug found and fixed via live testnet operation](#bug-found-and-fixed-via-live-testnet-operation) below for the full story. The addresses below are the current, fixed deployment.

## Arbitrum Sepolia (chain id 421614)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0x073e33Ecf5d8Dc043f15a02d77AbB7b9891A3556` |
| PolicyManager | `0xA849faDFb8dFCeD66060bbf71c103328c1a1E713` |
| AgentExecutor | `0x1142461050763B62DC065eCe1aa65628F9b32249` |
| SavingsCircleFactory | `0xa806b5984FF3C55E5B4960c4f275f7B277a63AcC` |
| GoalVaultFactory | `0x719124726A1A481d3beDFEE96144D4b97F5B0b67` |
| USDC (Circle, real) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| mUSDG (mock, see below) | `0x755f53B1331B55002fE117F052f8F6f70Ba0E3fd` |

Explorer: https://sepolia.arbiscan.io

## Robinhood Chain Testnet (chain id 46630)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0x8F035Fdf816BAabC173c175eb3f17f81e39980Fd` |
| PolicyManager | `0x9bFf4eFe3Fc4723Fc8446f2A930bff656C9157F8` |
| AgentExecutor | `0x93474EE2Bf6bE343873bc64Ee337c31c60feAB15` |
| SavingsCircleFactory | `0xcEE896f1C3d576849e1CCB575e11D8F3Ee722E6D` |
| GoalVaultFactory | `0xbf1CbC409cc10B197355da66a3E9C83451441dAf` |
| mUSDC (mock, see below) | `0xa3517A96D3f4560aEA46749C80c45Ff344Cf4d3c` |
| mUSDG (mock, see below) | `0x8dDa2CE498922180B553034e2308b6D3111Bc316` |

Explorer: https://explorer.testnet.chain.robinhood.com

## Why some stablecoins here are mocks

Robinhood Chain's testnet is permissionless, so anyone can deploy a token calling itself "USDC" or "USDG". Querying its Blockscout API turned up a dozen or more impostors with those symbols and no canonical marker distinguishing an official one, so rather than gamble on pointing the demo at the wrong contract, NairaFlow deploys its own `mUSDC`/`mUSDG` there instead. The `m` prefix is baked into the on-chain `symbol()` itself, not just a UI label, so it can never be confused for the real token anywhere it's displayed. Arbitrum Sepolia has a confirmed, official Circle-issued USDC, used directly. No public USDG testnet faucet was found on either chain, so `mUSDG` stands in on both.

## Live walkthrough transactions

A real 3-member savings circle and a policy-gated goal vault were run end to end on both chains, with the production agent (not a local script) autonomously executing the gas-aware release and the live policy revocation blocking its very next attempt.

### Arbitrum Sepolia

- Circle created (2 USDC/round, 3 members): [`0x8179989a36a69A72719d5197d28F0067c5f375F2`](https://sepolia.arbiscan.io/address/0x8179989a36a69A72719d5197d28F0067c5f375F2), creation tx [`0xc5613279`](https://sepolia.arbiscan.io/tx/0xc5613279c0bd1d7d7e948aae50eda3975ba68130ff2963c95f4c71d02ebf8c30)
- Goal vault created: [`0x2560d7C929C046420772139D35d19cd7F977aA1d`](https://sepolia.arbiscan.io/address/0x2560d7C929C046420772139D35d19cd7F977aA1d)
- Agent-triggered vault release (autonomous, no manual trigger): [`0xa7229b43`](https://sepolia.arbiscan.io/tx/0xa7229b43fa4ce6421f8c3c9f971a55679bc8b73ef644cbc1569c7ea8ec4a3f3c)
- Policy revoked live: [`0x045cafab`](https://sepolia.arbiscan.io/tx/0x045cafabb467ba53f67fa9d6d854ef0fa48ca061652aa74e7cee2264498d844e). The agent's next `executeVaultRelease` call reverted on-chain with `"policy inactive"`, confirmed via `eth_estimateGas`.
- Round 0 resolved by the agent through `AgentExecutor.resolveCircleRound`, once the real 1-hour minimum round length actually elapsed: [`0xf4c0759a`](https://sepolia.arbiscan.io/tx/0xf4c0759a9339882898c089d495d3206fcb2bd766098d10b122facaf53ff67b6f), crediting 6 USDC to the round-0 recipient. Withdrawn for real: [`0xc82f9723`](https://sepolia.arbiscan.io/tx/0xc82f9723fa2b730a1ab47231c0e06c395d14c44b47cd89362447094b1f1b3e2a).

### Robinhood Chain Testnet

- Circle created (2 mUSDC/round, 3 members): [`0x426748E2715c39402E48464770AD4cef88C91b46`](https://explorer.testnet.chain.robinhood.com/address/0x426748E2715c39402E48464770AD4cef88C91b46)
- Goal vault created: [`0xDEABC011FD58Cd7E34A9B2eE82DbB4A7a6653FA5`](https://explorer.testnet.chain.robinhood.com/address/0xDEABC011FD58Cd7E34A9B2eE82DbB4A7a6653FA5)
- Agent-triggered vault release (autonomous, no manual trigger): [`0xcdd17ef6`](https://explorer.testnet.chain.robinhood.com/tx/0xcdd17ef6124328eb149c68bb4518f8068ea77cf2fa697525b4a7800bbc7af36c)
- Policy revoked live: [`0xd2a4bc9a`](https://explorer.testnet.chain.robinhood.com/tx/0xd2a4bc9acc711f0e7d834765c4bda247c394cc1b0e99e4b45e45af42a5b12dad). The agent's next `executeVaultRelease` call reverted on-chain with `"policy inactive"`, confirmed via `eth_estimateGas`.
- Round 0 resolved by the agent through `AgentExecutor.resolveCircleRound`, once the real 1-hour minimum round length actually elapsed: [`0xc553af38`](https://explorer.testnet.chain.robinhood.com/tx/0xc553af38cb5f1472ba685ae72443479e9aa2e0d9a2b4446fa471c02cbd7710b6), crediting 6 mUSDC to the round-0 recipient. Withdrawn for real: [`0x9f8fb223`](https://explorer.testnet.chain.robinhood.com/tx/0x9f8fb2231ac4b16661e1a9c37a872983e7d6194f25bc56e547d4bfaea40cb6a7).

The agent's first attempt at the Sepolia resolution actually failed with a nonce error, because I was independently sending transactions from the same funded account through `cast` at the same time the agent's own wallet client was tracking nonces for it. The agent logged the failure and picked the round back up cleanly on its next poll cycle with no manual intervention, a real (if accidental) proof that a transient failure doesn't take the agent down.

One real, notable difference between the two chains surfaced here: Robinhood Chain's gas price stayed perfectly flat across every sample (its sequencing model is first-come-first-served rather than fee-auction based, per its own docs), so the agent's gas-timing logic never finds a "cheaper" moment there and always falls back to executing once the maximum wait elapses. Arbitrum Sepolia's gas price does fluctuate slightly, giving the gas-aware comparison something real to work with.

## Bug found and fixed via live testnet operation

Running the Sepolia circle for real, past round 0, surfaced a genuine smart contract bug that no unit test had caught.

`distributeUnclaimedPool()` was meant to sweep any dust or forfeited deposits left in a finished circle out to members still in good standing. It computed `goodStanding` by counting members who had never defaulted, then required `goodStanding > 0` before splitting the pool. That assumption broke on the actual deployed circle: after round 0 resolved, members B and C never went on to contribute to rounds 1 and 2 (a real gap in how far the walkthrough had been driven, not a contrived test setup), so by the time the circle reached `Finished`, every member had defaulted at least once. `goodStanding` was `0`, the `require` reverted, and the unclaimed pool became permanently unreachable in that contract instance, since a minimal-proxy clone's logic can't be patched after deployment.

Fix: when `goodStanding == 0`, `distributeUnclaimedPool()` now falls back to splitting the pool across all members instead of reverting. A member who defaulted still contributed real funds to the circle at some point, so including them in the fallback split is the correct outcome, not a workaround. Added a regression test, `test_UnclaimedPool_FallsBackToAllMembersWhenNobodyInGoodStanding()`, that reproduces this exact scenario (every member defaults, pool must still be claimable). Full suite (17 tests) and the funds-conservation invariant test (128,000 fuzzed calls) both pass with the fix in place. New implementation and factory contracts were then deployed to both chains, replacing the addresses in this document.

Honest disclosure: the original Sepolia circle instance, `0x8179989a36a69A72719d5197d28F0067c5f375F2`, still has roughly 6 USDC of testnet play money locked in it. That instance's bytecode is immutable, so the fix cannot reach it retroactively; the funds are stuck there permanently. No real value was lost since this is testnet USDC, but it is left as-is rather than hidden, as direct evidence of the bug that was found and fixed.

## Local (Anvil, chain id 31337)

Used only for development smoke-testing, never referenced in the submission.
