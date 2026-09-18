// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only mintable stand-in for Paxos' USDG, used solely on chains where no
/// public USDG testnet faucet could be confirmed (see docs/ARCHITECTURE.md). The symbol itself
/// carries the "mock" label — the frontend only ever displays a token's symbol(), never its
/// full name(), so a real-looking "USDG" symbol here would silently misrepresent this as the
/// genuine Paxos token everywhere it's shown (dropdowns, circle/vault cards, detail pages).
/// Never deployed to mainnet.
contract MockUSDG is ERC20 {
    constructor() ERC20("NairaFlow Mock USDG", "mUSDG") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
