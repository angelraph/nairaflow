// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStablecoinRegistry} from "./interfaces/IStablecoinRegistry.sol";
import {SavingsCircle} from "./SavingsCircle.sol";

/// @notice Deploys cheap EIP-1167 minimal-proxy clones of the SavingsCircle implementation.
/// Handles the creator's initial deposit itself, since the clone's address doesn't exist for
/// the creator to approve against until after it's created.
contract SavingsCircleFactory is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public immutable implementation;
    IStablecoinRegistry public immutable registry;
    address public platformAdmin;

    address[] public allCircles;

    event CircleCreated(
        address indexed circle, address indexed creator, address indexed token, uint256 contributionAmount, uint256 maxMembers
    );
    event PlatformAdminUpdated(address indexed newAdmin);

    constructor(address _implementation, address _registry, address _platformAdmin, address _owner) Ownable(_owner) {
        require(_implementation != address(0) && _registry != address(0) && _platformAdmin != address(0), "zero address");
        implementation = _implementation;
        registry = IStablecoinRegistry(_registry);
        platformAdmin = _platformAdmin;
    }

    function createCircle(
        address token,
        uint256 contributionAmount,
        uint256 roundDuration,
        uint256 maxMembers,
        uint256 securityDepositMultiplier
    ) external nonReentrant whenNotPaused returns (address clone) {
        require(registry.isAllowed(token), "token not allowed");

        clone = Clones.clone(implementation);

        uint256 deposit = contributionAmount * securityDepositMultiplier;
        if (deposit > 0) {
            IERC20(token).safeTransferFrom(msg.sender, clone, deposit);
        }

        SavingsCircle(clone).initialize(
            token, address(registry), platformAdmin, msg.sender, contributionAmount, roundDuration, maxMembers, securityDepositMultiplier
        );

        allCircles.push(clone);
        emit CircleCreated(clone, msg.sender, token, contributionAmount, maxMembers);
    }

    function setPlatformAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "zero address");
        platformAdmin = newAdmin;
        emit PlatformAdminUpdated(newAdmin);
    }

    /// @notice Emergency circuit breaker: stops new circle creation. Does not affect existing
    /// circles, which are paused/unpaused individually by `platformAdmin`.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function circleCount() external view returns (uint256) {
        return allCircles.length;
    }

    function getAllCircles() external view returns (address[] memory) {
        return allCircles;
    }
}
