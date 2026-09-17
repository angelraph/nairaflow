// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Testnet-only mintable stand-in for Paxos' USDG, used solely on chains where no
/// public USDG testnet faucet could be confirmed (see docs/ARCHITECTURE.md). Labeled as a mock
/// everywhere it appears in the frontend. Never deployed to mainnet.
contract MockUSDG is ERC20 {
    constructor() ERC20("NairaFlow Mock USDG", "USDG") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
