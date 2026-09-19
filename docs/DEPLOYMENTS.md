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

## Local (Anvil, chain id 31337)

Used only for development smoke-testing, never referenced in the submission.
