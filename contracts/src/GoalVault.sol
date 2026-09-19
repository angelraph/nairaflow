// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "./utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStablecoinRegistry} from "./interfaces/IStablecoinRegistry.sol";

/// @title GoalVault
/// @notice An individual, non-custodial savings lock. The owner deposits a stablecoin that
/// unlocks fully at `unlockDate`, or releases early in bounded increments against a configured
/// per-period allowance. An authorized AgentExecutor can trigger a scheduled release, but only
/// ever directly to `destination`, never through the agent itself, and only within the same
/// unlock/period rules that govern the owner's own withdrawals.
contract GoalVault is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    IERC20 public token;
    IStablecoinRegistry public registry;
    address public platformAdmin;
    address public agentExecutor;

    address public owner;
    address public destination;
    uint256 public unlockDate;
    uint256 public maxPerPeriod;
    uint256 public periodLength;

    mapping(uint256 => uint256) public withdrawnInPeriod;
    uint256 public totalDeposited;
    uint256 public totalWithdrawn;

    event VaultInitialized(
        address indexed owner, address indexed token, address destination, uint256 unlockDate, uint256 maxPerPeriod, uint256 periodLength
    );
    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed owner, uint256 amount);
    event Released(address indexed destination, uint256 amount);
    event DestinationUpdated(address indexed newDestination);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyPlatformAdmin() {
        require(msg.sender == platformAdmin, "not admin");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _owner,
        address _token,
        address _registry,
        address _platformAdmin,
        address _agentExecutor,
        address _destination,
        uint256 _unlockDate,
        uint256 _maxPerPeriod,
        uint256 _periodLength
    ) external initializer {
        require(_owner != address(0) && _destination != address(0), "zero address");
        require(IStablecoinRegistry(_registry).isAllowed(_token), "token not allowed");
        require(_maxPerPeriod == 0 || _periodLength > 0, "bad period");

        __ReentrancyGuard_init();
        __Pausable_init();

        owner = _owner;
        token = IERC20(_token);
        registry = IStablecoinRegistry(_registry);
        platformAdmin = _platformAdmin;
        agentExecutor = _agentExecutor;
        destination = _destination;
        unlockDate = _unlockDate;
        maxPerPeriod = _maxPerPeriod;
        periodLength = _periodLength;

        emit VaultInitialized(_owner, _token, _destination, _unlockDate, _maxPerPeriod, _periodLength);
    }

    /// @notice Anyone can top up a vault, e.g. a family member funding a relative's goal.
    function deposit(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "zero amount");
        totalDeposited += amount;
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant whenNotPaused onlyOwner {
        _spend(amount);
        token.safeTransfer(owner, amount);
        emit Withdrawn(owner, amount);
    }

    /// @notice Called only by the configured AgentExecutor to release funds directly to
    /// `destination`, subject to the same unlock/period rules as a manual owner withdrawal.
    function executeRelease(uint256 amount) external nonReentrant whenNotPaused {
        require(msg.sender == agentExecutor, "not agent executor");
        _spend(amount);
        token.safeTransfer(destination, amount);
        emit Released(destination, amount);
    }

    function setDestination(address newDestination) external onlyOwner {
        require(newDestination != address(0), "zero address");
        destination = newDestination;
        emit DestinationUpdated(newDestination);
    }

    function pause() external onlyPlatformAdmin {
        _pause();
    }

    function unpause() external onlyPlatformAdmin {
        _unpause();
    }

    function availableNow() external view returns (uint256) {
        uint256 balance = token.balanceOf(address(this));
        if (block.timestamp >= unlockDate) return balance;
        if (maxPerPeriod == 0) return 0;
        uint256 periodIndex = block.timestamp / periodLength;
        uint256 used = withdrawnInPeriod[periodIndex];
        uint256 remaining = used >= maxPerPeriod ? 0 : maxPerPeriod - used;
        return remaining < balance ? remaining : balance;
    }

    function _spend(uint256 amount) internal {
        require(amount > 0, "zero amount");
        if (block.timestamp < unlockDate) {
            require(maxPerPeriod > 0, "locked");
            uint256 periodIndex = block.timestamp / periodLength;
            uint256 used = withdrawnInPeriod[periodIndex];
            require(used + amount <= maxPerPeriod, "exceeds period allowance");
            withdrawnInPeriod[periodIndex] = used + amount;
        }
        totalWithdrawn += amount;
    }
}
