// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Per-target (vault or circle) spending policy: which destination and limits a user
/// has authorized the off-chain agent to act within. Owner-set, instantly revocable, and
/// deliberately independent of the target's own unlock/period rules — this only governs
/// whether the AGENT is currently allowed to trigger an action at all, not what the target
/// contract's own business logic separately permits.
contract PolicyManager is Ownable {
    struct Policy {
        bool active;
        address owner;
        address allowedDestination; // address(0) = any destination the target itself would use
        uint256 maxPerTx;
        uint256 maxPerPeriod;
        uint256 periodLength;
        uint256 expiry; // 0 = no expiry
    }

    address public executor;

    mapping(address => Policy) public policies; // target (vault/circle) => policy
    mapping(address => mapping(uint256 => uint256)) public spentInPeriod; // target => periodIndex => spent

    event ExecutorUpdated(address indexed newExecutor);
    event PolicySet(
        address indexed target,
        address indexed owner,
        address allowedDestination,
        uint256 maxPerTx,
        uint256 maxPerPeriod,
        uint256 periodLength,
        uint256 expiry
    );
    event PolicyRevoked(address indexed target, address indexed owner);

    modifier onlyExecutor() {
        require(msg.sender == executor, "not executor");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setExecutor(address newExecutor) external onlyOwner {
        executor = newExecutor;
        emit ExecutorUpdated(newExecutor);
    }

    /// @notice Grants (or replaces) a policy for `target`. Only the current policy owner (or,
    /// if none exists yet, anyone establishing the first one) may set it — in practice this is
    /// always called by the vault/circle owner from the frontend.
    function setPolicy(
        address target,
        address allowedDestination,
        uint256 maxPerTx,
        uint256 maxPerPeriod,
        uint256 periodLength,
        uint256 expiry
    ) external {
        Policy storage existing = policies[target];
        require(!existing.active || existing.owner == msg.sender, "not policy owner");
        require(maxPerTx > 0 && maxPerPeriod > 0 && periodLength > 0, "bad limits");

        policies[target] = Policy({
            active: true,
            owner: msg.sender,
            allowedDestination: allowedDestination,
            maxPerTx: maxPerTx,
            maxPerPeriod: maxPerPeriod,
            periodLength: periodLength,
            expiry: expiry
        });

        emit PolicySet(target, msg.sender, allowedDestination, maxPerTx, maxPerPeriod, periodLength, expiry);
    }

    /// @notice Instantly revokes the agent's authority over `target`. The next agent attempt
    /// reverts in checkAndConsume — this is the "revoke live" demo moment.
    function revokePolicy(address target) external {
        Policy storage p = policies[target];
        require(p.active, "no active policy");
        require(p.owner == msg.sender, "not policy owner");
        p.active = false;
        emit PolicyRevoked(target, msg.sender);
    }

    /// @notice Called by AgentExecutor immediately before acting. Reverts loudly on any policy
    /// violation rather than returning false, and records the spend against the current period
    /// bucket so limits are enforced across multiple calls.
    function checkAndConsume(address target, address destination, uint256 amount) external onlyExecutor {
        Policy storage p = policies[target];
        require(p.active, "policy inactive");
        require(p.expiry == 0 || block.timestamp <= p.expiry, "policy expired");
        require(p.allowedDestination == address(0) || p.allowedDestination == destination, "destination not allowed");
        require(amount <= p.maxPerTx, "exceeds per-tx limit");

        uint256 periodIndex = block.timestamp / p.periodLength;
        uint256 spent = spentInPeriod[target][periodIndex];
        require(spent + amount <= p.maxPerPeriod, "exceeds period limit");
        spentInPeriod[target][periodIndex] = spent + amount;
    }
}
