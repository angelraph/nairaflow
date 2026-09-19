// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only mintable stand-in for USDC, used solely on chains where no canonical,
/// verifiably-official USDC token could be confirmed (see docs/ARCHITECTURE.md). The symbol
/// itself carries the "mock" label. The frontend only ever displays a token's symbol(), never
/// its full name(), so a real-looking "USDC" symbol here would silently misrepresent this as
/// the genuine Circle token everywhere it's shown (dropdowns, circle/vault cards, detail
/// pages). Never deployed to mainnet.
contract MockUSDC is ERC20 {
    constructor() ERC20("NairaFlow Mock USDC", "mUSDC") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
