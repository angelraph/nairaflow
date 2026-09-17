// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {PolicyManager} from "./PolicyManager.sol";

interface IGoalVaultRelease {
    function executeRelease(uint256 amount) external;
    function destination() external view returns (address);
}

interface ISavingsCircleResolve {
    function resolveRound() external;
}

/// @notice The single entrypoint the off-chain agent calls. It never holds a token balance or
/// an ERC-20 allowance itself — every action it triggers moves funds directly from the target
/// vault/circle to a destination the owner configured, never to or through this contract. Every
/// action is tagged on-chain with the live gas price at execution time, so gas-aware timing can
/// be verified directly from the explorer rather than trusted from an off-chain log.
contract AgentExecutor is AccessControl {
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    PolicyManager public immutable policyManager;

    enum ActionType {
        VaultRelease,
        CircleResolve
    }

    event AgentExecuted(address indexed target, ActionType indexed actionType, uint256 amount, uint256 gasPriceWei, uint256 timestamp);

    constructor(address _policyManager, address admin, address agent) {
        require(_policyManager != address(0) && admin != address(0), "zero address");
        policyManager = PolicyManager(_policyManager);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        if (agent != address(0)) {
            _grantRole(AGENT_ROLE, agent);
        }
    }

    /// @notice Triggers a policy-gated release from a GoalVault. PolicyManager enforces the
    /// destination/amount limits the owner granted the agent; the vault itself independently
    /// enforces its own unlock/period rules — revoking the policy here never changes what the
    /// vault fundamentally allows, and vice versa.
    function executeVaultRelease(address vault, uint256 amount) external onlyRole(AGENT_ROLE) {
        address destination = IGoalVaultRelease(vault).destination();
        policyManager.checkAndConsume(vault, destination, amount);
        IGoalVaultRelease(vault).executeRelease(amount);
        emit AgentExecuted(vault, ActionType.VaultRelease, amount, tx.gasprice, block.timestamp);
    }

    /// @notice Triggers a due SavingsCircle round resolution. resolveRound() is permissionless
    /// by design and only ever follows the circle's own fixed rules, so this needs no policy
    /// check — routing it through here just gives every agent action one uniform, gas-tagged
    /// activity log for the frontend to read.
    function resolveCircleRound(address circle) external onlyRole(AGENT_ROLE) {
        ISavingsCircleResolve(circle).resolveRound();
        emit AgentExecuted(circle, ActionType.CircleResolve, 0, tx.gasprice, block.timestamp);
    }
}
