// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test-only ERC20 whose transfer()/transferFrom() re-enters a configured target before
/// completing, used to prove SavingsCircle/GoalVault's nonReentrant guards hold even against a
/// malicious or ERC777-style callback token. Never deployed outside the test suite.
contract MaliciousReentrantToken is ERC20 {
    address public attackTarget;
    bytes public attackCalldata;
    bool public armed;

    constructor() ERC20("Malicious", "EVIL") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function arm(address target, bytes calldata data) external {
        attackTarget = target;
        attackCalldata = data;
        armed = true;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        _maybeReenter();
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        _maybeReenter();
        return super.transferFrom(from, to, amount);
    }

    function _maybeReenter() internal {
        if (armed) {
            armed = false;
            (bool success,) = attackTarget.call(attackCalldata);
            success;
        }
    }
}
