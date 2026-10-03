# Deployments

Every address below comes from an actual `forge script` broadcast (see `contracts/broadcast/`). None are hand-typed.

The same code base runs on Robinhood Chain mainnet (real USDG) and on two testnets. The testnet deployments below are the third generation. The first was replaced after a fund-recovery bug turned up on the live Sepolia circle, and the second after a review found that anyone could set an agent policy on someone else's vault. Both are written up in [Bugs found and fixed](#bugs-found-and-fixed-via-live-testnet-operation) below. The addresses in the tables are the current, fixed deployment. Every contract on the testnets is source-verified on its explorer, and every mainnet contract is an exact match on Sourcify.

## Arbitrum Sepolia (chain id 421614)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0x36A7e4945aa7b22F5E61Bc0055013D9Dbdd71c03` |
| PolicyManager | `0x28D4f7C79A26C7C8f23e39Bd57CB6e895bd59B69` |
| AgentExecutor | `0x2f00B3d6392D1D98069Ff6E1B355f812948E93B7` |
| SavingsCircleFactory | `0xAaB3F8C973b16207821C6C93c595fCaCa7D92842` |
| SavingsCircle (implementation) | `0x1F6c08839D8cF404C281306c3494817964511244` |
| GoalVaultFactory | `0x5863AF77A5e0978B7cF140F2D18081E08de2bB0d` |
| GoalVault (implementation) | `0xAa03F46F7297d59C4Db06FB07Aac66a2F002861e` |
| USDC (Circle, real) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| mUSDG (mock, see below) | `0x84C219D6C228F309061C8F44fab98648DE26A1c1` |

Explorer: https://sepolia.arbiscan.io

## Robinhood Chain Testnet (chain id 46630)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0x38036Fe3a1F7053d1195E56ac1EC00e003BE724e` |
| PolicyManager | `0xa806b5984FF3C55E5B4960c4f275f7B277a63AcC` |
| AgentExecutor | `0x3b0f0dAb4C018B9e994382Ec940d79cB462eB00F` |
| SavingsCircleFactory | `0x8EdeeD5342BC4088E5F05e730a64B8b6a82047aa` |
| SavingsCircle (implementation) | `0x8AFA00574e10c63727f9a897Cb31CCfF7731855e` |
| GoalVaultFactory | `0x7609Ad496606693a29121260EAD066CBA4e0Bf63` |
| GoalVault (implementation) | `0x10cAA192f724c6e56E21C38C37eC201A50e69FA9` |
| mUSDC (mock, see below) | `0xA849faDFb8dFCeD66060bbf71c103328c1a1E713` |
| mUSDG (mock, see below) | `0x1921513c9A1F29d178194B2e31DAB9F5f1687c5c` |

Explorer: https://explorer.testnet.chain.robinhood.com

## Robinhood Chain mainnet (chain id 4663)

Deployed on 3 October 2026 from `contracts/script/Deploy.s.sol` with `REAL_USDG_ADDRESS` set and both mock flags off, so Paxos' real USDG is the only token the registry accepts and no mock token exists on this chain. The agent role on the executor belongs to the dedicated agent address `0xa8D457Fe25146831de9b52F2041E5839A1EBe817`.

| Contract | Address |
|---|---|
| StablecoinRegistry | `0xAbEA0b38214B1A5FDAc725E63eb1c7EC6b381637` |
| PolicyManager | `0x52A0D9b9d96A03F318c8D07aC8068Aed5f2016c1` |
| AgentExecutor | `0x42ABF69d81425CAbd853a55170B2bAd86b8290Ca` |
| SavingsCircleFactory | `0xb29501e7D28a3dDB5c2c84D10916a628A5dD3514` |
| SavingsCircle (implementation) | `0xCBE1A63057f9E1a399CEc8cAfdcBb9DE3382aec8` |
| GoalVaultFactory | `0x0Dfe72134CCa08Bf346820F16e3467eaB03aa6C0` |
| GoalVault (implementation) | `0x8b0BD84cF5E2D482488b7c3850Be9bF588a55A1a` |
| USDG (Paxos, real) | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` |

Explorer: https://robinhoodchain.blockscout.com

Verification: all seven contracts are exact matches (creation and runtime) on Sourcify, for example `https://sourcify.dev/server/v2/contract/4663/0x0Dfe72134CCa08Bf346820F16e3467eaB03aa6C0`. The Blockscout API sits behind a bot challenge that blocks `forge verify-contract`, so Sourcify was used instead. The deployment is unaudited and holds real USDG, so use small amounts.
## Superseded deployments

Earlier deployments stay on chain but are no longer used by the app. Their addresses are in the git history of this file. The second Sepolia generation, for reference: factories `0xa806b5984FF3C55E5B4960c4f275f7B277a63AcC` (circles) and `0x719124726A1A481d3beDFEE96144D4b97F5B0b67` (vaults).

## Real USDG

Robinhood's own token page lists the canonical USDG at `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`, and reading that address on chain returns symbol `USDG` with 6 decimals on Robinhood Chain mainnet (chain id 4663) and no code at all on the testnet. The deploy script registers it directly when `REAL_USDG_ADDRESS` is set, and `DEPLOY_MOCK_USDC=false` keeps every mock off a mainnet deployment. That is how the mainnet deployment above was made.

## Why some stablecoins here are mocks

Robinhood Chain's testnet is permissionless, so anyone can deploy a token calling itself "USDC" or "USDG". Querying its Blockscout API turned up a dozen or more impostors with those symbols and no canonical marker distinguishing an official one, so rather than gamble on pointing the demo at the wrong contract, NairaFlow deploys its own `mUSDC`/`mUSDG` there instead. The `m` prefix is baked into the on-chain `symbol()` itself, not just a UI label, so it can never be confused for the real token anywhere it's displayed. Arbitrum Sepolia has a confirmed, official Circle-issued USDC, used directly. No public USDG testnet faucet was found on either chain, so `mUSDG` stands in on both.

## Live walkthrough transactions

These come from the first deployment, which has since been superseded but is still on chain, so every link below still works. A real 3-member savings circle and a policy-gated goal vault were run end to end on both chains, with the production agent (not a local script) autonomously executing the gas-aware release and the live policy revocation blocking its very next attempt. The same flow was run again on the current deployment, see [Walkthrough on the current deployment](#walkthrough-on-the-current-deployment).

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

## Bugs found and fixed via live testnet operation

Three real defects were found by operating or reviewing the deployed system rather than by the original test suite. Each one got a regression test and, where the contracts were involved, a redeploy.

### 1. Unclaimed pool stranded when every member defaulted

Running the Sepolia circle for real, past round 0, surfaced a genuine smart contract bug that no unit test had caught.

`distributeUnclaimedPool()` was meant to sweep any dust or forfeited deposits left in a finished circle out to members still in good standing. It computed `goodStanding` by counting members who had never defaulted, then required `goodStanding > 0` before splitting the pool. That assumption broke on the actual deployed circle: after round 0 resolved, members B and C never went on to contribute to rounds 1 and 2 (a real gap in how far the walkthrough had been driven, not a contrived test setup), so by the time the circle reached `Finished`, every member had defaulted at least once. `goodStanding` was `0`, the `require` reverted, and the unclaimed pool became permanently unreachable in that contract instance, since a minimal-proxy clone's logic can't be patched after deployment.

Fix: when `goodStanding == 0`, `distributeUnclaimedPool()` now falls back to splitting the pool across all members instead of reverting. A member who defaulted still contributed real funds to the circle at some point, so including them in the fallback split is the correct outcome, not a workaround. Added a regression test, `test_UnclaimedPool_FallsBackToAllMembersWhenNobodyInGoodStanding()`, that reproduces this exact scenario (every member defaults, pool must still be claimable). Full suite (17 tests) and the funds-conservation invariant test (128,000 fuzzed calls) both pass with the fix in place. New implementation and factory contracts were then deployed to both chains, replacing the addresses in this document.

Honest disclosure: the original Sepolia circle instance, `0x8179989a36a69A72719d5197d28F0067c5f375F2`, still has roughly 6 USDC of testnet play money locked in it. That instance's bytecode is immutable, so the fix cannot reach it retroactively; the funds are stuck there permanently. No real value was lost since this is testnet USDC, but it is left as-is rather than hidden, as direct evidence of the bug that was found and fixed.

### 2. The policy panel saved the wrong allowed destination

Caught while preparing the demo. While staging the demo vault through the same steps the web app performs, the agent's release reverted with `destination not allowed`. The frontend's Agent policy panel was saving the vault's own address as the policy's allowed destination, but `AgentExecutor` compares that field against the vault's real destination (the owner's wallet). Any policy authorized through the UI would have made every agent release revert. The contracts were correct; the earlier command-line walkthrough set the policy properly, which is why only a UI-driven run exposed it. The panel now passes the vault's actual destination. The staged vault's policy was corrected on chain and the agent then released it on its own: [`0xc94e0122`](https://sepolia.arbiscan.io/tx/0xc94e01224b7a71387c611fc5c1752ce7b3ab871f83a9ae3c54258e76c910802c).

### 3. Anyone could set an agent policy on someone else's vault

Found by review while wiring the vault page's policy panel. The panel hid itself on any vault that had no policy yet, because it decided who the owner was from the policy's stored owner, which is empty until a first policy exists. Chasing that led back to `PolicyManager`, where `setPolicy` only checked the caller against the existing policy's owner and let anyone create the first policy for any vault. That caller then became the policy owner. The real vault owner could neither revoke it nor replace it, and could not undo a wrong allowed destination, which would make every scheduled release revert. After an owner revoked a policy, anyone could grab the empty slot again.

No funds could be stolen: an agent release always goes to the vault's own destination and stays inside the vault's own unlock and allowance rules. It was still a lockout and griefing hole in an authorization check, and the contract's own comment claimed the owner always made the call.

Fix: `setPolicy` and `revokePolicy` now require the caller to be the owner of the target vault, read from the vault itself. Five new tests cover it: a stranger cannot set a policy, cannot revoke the owner's policy, cannot take the slot after a revoke, setting a policy on a non-contract fails, and the owner can still replace and revoke. Before the fix four of them failed, which is how the hole was confirmed. After it, the suite is 23 tests, all passing, including the 128,000 call invariant. Both chains were redeployed and every contract re-verified.

## Walkthrough on the current deployment

The same flow was staged again on the current contracts. Each circle has 2 members, a 0.5 contribution, 1 hour rounds and a 1x deposit, and both members paid round 0. Each vault holds 2 tokens with a 1 per day allowance and an agent policy set by its owner. Results from the agent are added below as they land on chain.

**Arbitrum Sepolia**

- Circle: [`0x2a67F765…D125f`](https://sepolia.arbiscan.io/address/0x2a67F7654533C9daeaf9134436C9B66fa62D125f), created in [`0x043718e7`](https://sepolia.arbiscan.io/tx/0x043718e710b8cd1f32ad05050d65ee5aea1894287d8de90791472db38dcb6c15)
- Vault: [`0x8AC9D9e2…7DFC`](https://sepolia.arbiscan.io/address/0x8AC9D9e27727eC157C770534B935d134979b7DFC), created in [`0xd3428bb8`](https://sepolia.arbiscan.io/tx/0xd3428bb89ce3fe16121ccc1b26cd89d147858bc4889d15bcd86323611d83c94f)
- Owner sets the agent policy: [`0x9d9e3095`](https://sepolia.arbiscan.io/tx/0x9d9e3095bd40b30e46347b33a51485788ea0738a8946f8fd137986df6ac344df)

**Robinhood Chain Testnet**

- Circle: [`0x4ca62b3A…3AbF`](https://explorer.testnet.chain.robinhood.com/address/0x4ca62b3A01a57fFE0112bC91ed0684dD0F513AbF), created in [`0xb2e5d086`](https://explorer.testnet.chain.robinhood.com/tx/0xb2e5d08681ea5f19c77ce0e2ba945598fa07e426b5c3b08eb5602303f255dbf4)
- Vault: [`0x7eA6F38d…32b7`](https://explorer.testnet.chain.robinhood.com/address/0x7eA6F38d082572Cf663867AB7bF658eE5A8432b7), created in [`0xf0296a12`](https://explorer.testnet.chain.robinhood.com/tx/0xf0296a125b6a226e86e9cd19ee4f7742d75a238ee5c67644626603c57d4bf382)
- Owner sets the agent policy: [`0xbdfd3be1`](https://explorer.testnet.chain.robinhood.com/tx/0xbdfd3be11081426d143432de44454d4ac01f4bf968e5457630a666831fa69976)

**The ownership fix, on chain.** On both networks a second wallet that does not own the vault tried to call `setPolicy` and `revokePolicy` on it. Both calls reverted with `not target owner`.

## Local (Anvil, chain id 31337)

Used only for development smoke-testing, never referenced in the submission.
