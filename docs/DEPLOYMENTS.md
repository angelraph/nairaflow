# Deployments

Every address below comes from an actual `forge script` broadcast (see `contracts/broadcast/`). None are hand-typed.

## Arbitrum Sepolia (chain id 421614)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0xf941EbebF08638f537041b4896358134A69F704e` |
| PolicyManager | `0x33b7Cc399e36dB444a2b27B09f04f05920EcC6A7` |
| AgentExecutor | `0x59fe770a3aaD6046550DC4780C30f71b0C9610A2` |
| SavingsCircle (implementation) | `0xF1BbC96E7277a62421B6135c7EB56d5C1F080afF` |
| SavingsCircleFactory | `0xc3f833a6F79b663498d044aC9e962554EF414131` |
| GoalVault (implementation) | `0xAb5f547d6046213Ba9A38c3c0d49088e032500D1` |
| GoalVaultFactory | `0x383538B565BD553C95597f8250E5dE058d2E97f1` |
| USDC (Circle, real) | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| mUSDG (mock, see below) | `0x6c6a52510867d76Abc04717953D74CF1223a9a41` |

Explorer: https://sepolia.arbiscan.io

## Robinhood Chain Testnet (chain id 46630)

| Contract | Address |
|---|---|
| StablecoinRegistry | `0x23AFA712DB6BfD3D5376DA73c57493913aB8d3D1` |
| PolicyManager | `0x290ab68fFCEaCE40DE43098436967dA2BaC436F6` |
| AgentExecutor | `0xCBE1A63057f9E1a399CEc8cAfdcBb9DE3382aec8` |
| SavingsCircle (implementation) | `0x8b0BD84cF5E2D482488b7c3850Be9bF588a55A1a` |
| SavingsCircleFactory | `0x0Dfe72134CCa08Bf346820F16e3467eaB03aa6C0` |
| GoalVault (implementation) | `0x480341560FECcfa19FAa19A4f4Cb452593C4ee2c` |
| GoalVaultFactory | `0xE52dc486e528a6506d702748bfA598b57cD08967` |
| mUSDC (mock, see below) | `0xAbEA0b38214B1A5FDAc725E63eb1c7EC6b381637` |
| mUSDG (mock, see below) | `0x52A0D9b9d96A03F318c8D07aC8068Aed5f2016c1` |

Explorer: https://explorer.testnet.chain.robinhood.com

## Why some stablecoins here are mocks

Robinhood Chain's testnet is permissionless, so anyone can deploy a token calling itself "USDC" or "USDG". Querying its Blockscout API turned up a dozen or more impostors with those symbols and no canonical marker distinguishing an official one, so rather than gamble on pointing the demo at the wrong contract, NairaFlow deploys its own `mUSDC`/`mUSDG` there instead. The `m` prefix is baked into the on-chain `symbol()` itself, not just a UI label, so it can never be confused for the real token anywhere it's displayed. Arbitrum Sepolia has a confirmed, official Circle-issued USDC, used directly. No public USDG testnet faucet was found on either chain, so `mUSDG` stands in on both.

## Live walkthrough transactions

A real 3-member savings circle and a policy-gated goal vault were run end to end on both chains, with the production agent (not a local script) autonomously executing the gas-aware release and the live policy revocation blocking its very next attempt.

### Arbitrum Sepolia

- Circle created (2 USDC/round, 3 members): [`0x8179989a36a69A72719d5197d28F0067c5f375F2`](https://sepolia.arbiscan.io/address/0x8179989a36a69A72719d5197d28F0067c5f375F2), creation tx [`0xc5613279`](https://sepolia.arbiscan.io/tx/0xc5613279c0bd1d7d7e948aae50eda3975ba68130ff2963c95f4c71d02ebf8c30)
- Goal vault created: [`0x2560d7C929C046420772139D35d19cd7F977aA1d`](https://sepolia.arbiscan.io/address/0x2560d7C929C046420772139D35d19cd7F977aA1d)
- Agent-triggered release (autonomous, no manual trigger): [`0xa7229b43`](https://sepolia.arbiscan.io/tx/0xa7229b43fa4ce6421f8c3c9f971a55679bc8b73ef644cbc1569c7ea8ec4a3f3c)
- Policy revoked live: [`0x045cafab`](https://sepolia.arbiscan.io/tx/0x045cafabb467ba53f67fa9d6d854ef0fa48ca061652aa74e7cee2264498d844e). The agent's next `executeVaultRelease` call reverted on-chain with `"policy inactive"`, confirmed via `eth_estimateGas`.

### Robinhood Chain Testnet

- Circle created (2 mUSDC/round, 3 members): [`0x426748E2715c39402E48464770AD4cef88C91b46`](https://explorer.testnet.chain.robinhood.com/address/0x426748E2715c39402E48464770AD4cef88C91b46)
- Goal vault created: [`0xDEABC011FD58Cd7E34A9B2eE82DbB4A7a6653FA5`](https://explorer.testnet.chain.robinhood.com/address/0xDEABC011FD58Cd7E34A9B2eE82DbB4A7a6653FA5)
- Agent-triggered release (autonomous, no manual trigger): [`0xcdd17ef6`](https://explorer.testnet.chain.robinhood.com/tx/0xcdd17ef6124328eb149c68bb4518f8068ea77cf2fa697525b4a7800bbc7af36c)
- Policy revoked live: [`0xd2a4bc9a`](https://explorer.testnet.chain.robinhood.com/tx/0xd2a4bc9acc711f0e7d834765c4bda247c394cc1b0e99e4b45e45af42a5b12dad). The agent's next `executeVaultRelease` call reverted on-chain with `"policy inactive"`, confirmed via `eth_estimateGas`.

One real, notable difference between the two chains surfaced here: Robinhood Chain's gas price stayed perfectly flat across every sample (its sequencing model is first-come-first-served rather than fee-auction based, per its own docs), so the agent's gas-timing logic never finds a "cheaper" moment there and always falls back to executing once the maximum wait elapses. Arbitrum Sepolia's gas price does fluctuate slightly, giving the gas-aware comparison something real to work with.

## Local (Anvil, chain id 31337)

Used only for development smoke-testing, never referenced in the submission.
