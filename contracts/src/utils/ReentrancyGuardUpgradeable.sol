// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/// @notice Minimal storage-based reentrancy guard for Initializable clone targets, mirroring
/// OpenZeppelin's own long-standing ReentrancyGuard implementation exactly (NOT_ENTERED /
/// ENTERED sentinel pattern). Written in-repo because the installed OpenZeppelin
/// contracts-upgradeable 5.7.0 npm package does not publish a ReentrancyGuardUpgradeable —
/// only a transient-storage variant (ReentrancyGuardTransient) exists, and only in the
/// non-upgradeable package. That variant was deliberately not used here: it depends on
/// EIP-1153 (TSTORE/TLOAD) support, which was not confirmed for Robinhood Chain testnet during
/// research, and getting this wrong would mean every state-changing call reverts on that
/// chain. A plain storage slot has no such dependency.
abstract contract ReentrancyGuardUpgradeable is Initializable {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    function __ReentrancyGuard_init() internal onlyInitializing {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }
}
