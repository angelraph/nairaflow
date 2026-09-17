// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IStablecoinRegistry} from "./interfaces/IStablecoinRegistry.sol";
import {GoalVault} from "./GoalVault.sol";

/// @notice Deploys cheap EIP-1167 minimal-proxy clones of the GoalVault implementation.
contract GoalVaultFactory is Ownable, Pausable {
    address public immutable implementation;
    IStablecoinRegistry public immutable registry;
    address public platformAdmin;
    address public agentExecutor;

    address[] public allVaults;
    mapping(address => address[]) public vaultsByOwner;

    event VaultCreated(address indexed vault, address indexed owner, address indexed token, uint256 unlockDate);
    event PlatformAdminUpdated(address indexed newAdmin);
    event AgentExecutorUpdated(address indexed newAgentExecutor);

    constructor(address _implementation, address _registry, address _platformAdmin, address _owner) Ownable(_owner) {
        require(_implementation != address(0) && _registry != address(0) && _platformAdmin != address(0), "zero address");
        implementation = _implementation;
        registry = IStablecoinRegistry(_registry);
        platformAdmin = _platformAdmin;
    }

    function createVault(address token, address destination, uint256 unlockDate, uint256 maxPerPeriod, uint256 periodLength)
        external
        whenNotPaused
        returns (address vault)
    {
        require(registry.isAllowed(token), "token not allowed");

        vault = Clones.clone(implementation);
        GoalVault(vault).initialize(
            msg.sender, token, address(registry), platformAdmin, agentExecutor, destination, unlockDate, maxPerPeriod, periodLength
        );

        allVaults.push(vault);
        vaultsByOwner[msg.sender].push(vault);
        emit VaultCreated(vault, msg.sender, token, unlockDate);
    }

    function setPlatformAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "zero address");
        platformAdmin = newAdmin;
        emit PlatformAdminUpdated(newAdmin);
    }

    /// @dev Must be called before any vaults are created for those vaults to pick up the
    /// correct executor — each vault records the executor address at creation time.
    function setAgentExecutor(address newAgentExecutor) external onlyOwner {
        agentExecutor = newAgentExecutor;
        emit AgentExecutorUpdated(newAgentExecutor);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function vaultCount() external view returns (uint256) {
        return allVaults.length;
    }

    function getAllVaults() external view returns (address[] memory) {
        return allVaults;
    }

    function getVaultsByOwner(address account) external view returns (address[] memory) {
        return vaultsByOwner[account];
    }
}
