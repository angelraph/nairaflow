// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IStablecoinRegistry} from "./interfaces/IStablecoinRegistry.sol";

/// @notice Owner-managed allowlist of stablecoins a given deployment of NairaFlow will accept.
/// Deployed once per chain. SavingsCircle and GoalVault clones consult it at creation time so
/// a circle/vault can never be created against an unvetted token.
contract StablecoinRegistry is Ownable, IStablecoinRegistry {
    struct TokenInfo {
        bool allowed;
        uint8 decimals;
        string symbol;
    }

    mapping(address => TokenInfo) public tokens;
    address[] public tokenList;

    event TokenRegistered(address indexed token, string symbol, uint8 decimals);
    event TokenRemoved(address indexed token);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerToken(address token) external onlyOwner {
        require(token != address(0), "zero address");
        require(!tokens[token].allowed, "already registered");

        uint8 dec = IERC20Metadata(token).decimals();
        string memory sym = IERC20Metadata(token).symbol();

        tokens[token] = TokenInfo({allowed: true, decimals: dec, symbol: sym});
        tokenList.push(token);

        emit TokenRegistered(token, sym, dec);
    }

    function removeToken(address token) external onlyOwner {
        require(tokens[token].allowed, "not registered");
        tokens[token].allowed = false;
        emit TokenRemoved(token);
    }

    function isAllowed(address token) external view returns (bool) {
        return tokens[token].allowed;
    }

    function allTokens() external view returns (address[] memory) {
        return tokenList;
    }
}
