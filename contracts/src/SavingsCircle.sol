// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "./utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IStablecoinRegistry} from "./interfaces/IStablecoinRegistry.sol";

/// @title SavingsCircle
/// @notice An on-chain Ajo/Esusu: a fixed-size group of members each contribute a fixed amount
/// of a stablecoin every round; each round's pool is paid to one member, in join order, until
/// everyone has been paid once. A security deposit posted at join time backstops the group
/// against a member who stops contributing. A default never blocks the schedule for anyone
/// else. This contract is deployed once as an implementation and reused via EIP-1167 minimal
/// proxy clones (see SavingsCircleFactory); each clone has fully isolated storage.
contract SavingsCircle is Initializable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    using SafeERC20 for IERC20;

    enum Status {
        Created,
        Active,
        Finished,
        Cancelled
    }

    uint256 public constant STALE_TIMEOUT = 30 days;

    IERC20 public token;
    IStablecoinRegistry public registry;
    address public platformAdmin;

    uint256 public contributionAmount;
    uint256 public securityDeposit;
    uint256 public roundDuration;
    uint256 public maxMembers;
    uint256 public createdAt;

    Status public status;

    address[] public members;
    mapping(address => bool) public isMember;
    mapping(address => bool) public defaulted;
    mapping(address => uint256) public depositBalance;

    uint256 public currentRound;
    uint256 public roundDeadline;
    uint256 public nextRecipientIndex;
    uint256 public unclaimedPool;

    mapping(uint256 => mapping(address => bool)) public hasContributed;
    mapping(uint256 => uint256) public roundPool;
    mapping(address => uint256) public pendingWithdrawal;

    event CircleInitialized(
        address indexed token, uint256 contributionAmount, uint256 roundDuration, uint256 maxMembers, uint256 securityDeposit
    );
    event MemberJoined(address indexed member, uint256 indexed index);
    event MemberLeft(address indexed member);
    event CircleActivated(uint256 startTimestamp, uint256 firstRoundDeadline);
    event Contributed(address indexed member, uint256 indexed round, uint256 amount);
    event MemberDefaulted(address indexed member, uint256 indexed round, uint256 slashedAmount);
    event RoundResolved(uint256 indexed round, address indexed recipient, uint256 payout);
    event PayoutWithdrawn(address indexed member, uint256 amount);
    event DepositRefunded(address indexed member, uint256 amount);
    event CircleFinished(uint256 timestamp);
    event CircleCancelled(uint256 timestamp);
    event UnclaimedPoolDistributed(uint256 amount, uint256 recipientCount);

    modifier onlyPlatformAdmin() {
        require(msg.sender == platformAdmin, "not admin");
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @dev Called once by SavingsCircleFactory immediately after cloning. If a security
    /// deposit is required, the factory transfers the creator's deposit directly to this
    /// clone in the same transaction (the clone's address doesn't exist for the creator to
    /// approve against until after `Clones.clone()` returns), so this function only records
    /// the bookkeeping rather than pulling funds itself for the creator's join.
    function initialize(
        address _token,
        address _registry,
        address _platformAdmin,
        address _creator,
        uint256 _contributionAmount,
        uint256 _roundDuration,
        uint256 _maxMembers,
        uint256 _securityDepositMultiplier
    ) external initializer {
        require(_maxMembers >= 2 && _maxMembers <= 20, "bad member count");
        require(_contributionAmount > 0, "bad amount");
        require(_roundDuration >= 1 hours, "round too short");
        require(IStablecoinRegistry(_registry).isAllowed(_token), "token not allowed");

        __ReentrancyGuard_init();
        __Pausable_init();

        token = IERC20(_token);
        registry = IStablecoinRegistry(_registry);
        platformAdmin = _platformAdmin;
        contributionAmount = _contributionAmount;
        roundDuration = _roundDuration;
        maxMembers = _maxMembers;
        securityDeposit = _contributionAmount * _securityDepositMultiplier;
        createdAt = block.timestamp;

        emit CircleInitialized(_token, _contributionAmount, _roundDuration, _maxMembers, securityDeposit);

        if (securityDeposit > 0) {
            require(token.balanceOf(address(this)) >= securityDeposit, "deposit not received");
        }
        _recordJoin(_creator);
    }

    /// @notice Join an open circle. Requires prior ERC-20 approval for `securityDeposit`.
    function join() external nonReentrant whenNotPaused {
        require(status == Status.Created, "not open");
        require(!isMember[msg.sender], "already member");
        require(members.length < maxMembers, "full");

        if (securityDeposit > 0) {
            token.safeTransferFrom(msg.sender, address(this), securityDeposit);
        }
        _recordJoin(msg.sender);
    }

    /// @notice Leave a circle that hasn't filled up yet, reclaiming your deposit.
    function leave() external nonReentrant {
        require(status == Status.Created, "cannot leave now");
        require(isMember[msg.sender], "not member");

        uint256 len = members.length;
        for (uint256 i = 0; i < len; i++) {
            if (members[i] == msg.sender) {
                members[i] = members[len - 1];
                members.pop();
                break;
            }
        }
        isMember[msg.sender] = false;

        uint256 amount = depositBalance[msg.sender];
        if (amount > 0) {
            depositBalance[msg.sender] = 0;
            token.safeTransfer(msg.sender, amount);
        }
        emit MemberLeft(msg.sender);
    }

    /// @notice If a circle never fills up, any member can reclaim their deposit after the
    /// stale timeout instead of it being locked forever.
    function cancelStale() external nonReentrant {
        require(status == Status.Created, "not pending");
        require(block.timestamp > createdAt + STALE_TIMEOUT, "not stale yet");

        status = Status.Cancelled;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            uint256 amount = depositBalance[member];
            if (amount > 0) {
                depositBalance[member] = 0;
                pendingWithdrawal[member] += amount;
            }
        }
        emit CircleCancelled(block.timestamp);
    }

    /// @notice Contribute this round's fixed amount. Every active, non-defaulted member
    /// contributes every round (including the round's recipient). This keeps every round's
    /// pool the same size and the accounting simple and auditable.
    function contribute() external nonReentrant whenNotPaused {
        require(status == Status.Active, "not active");
        require(isMember[msg.sender], "not member");
        require(!defaulted[msg.sender], "defaulted");
        require(!hasContributed[currentRound][msg.sender], "already contributed");
        require(block.timestamp <= roundDeadline, "round closed");

        hasContributed[currentRound][msg.sender] = true;
        roundPool[currentRound] += contributionAmount;
        token.safeTransferFrom(msg.sender, address(this), contributionAmount);

        emit Contributed(msg.sender, currentRound, contributionAmount);
    }

    /// @notice Resolves the current round once its deadline has passed: any member who didn't
    /// contribute forfeits their entire remaining security deposit into the round's pool and is
    /// marked defaulted (excluded from all future rounds), the pool is paid to the next
    /// non-defaulted member in join order, and the circle advances to the next round.
    /// Callable by anyone, including the off-chain agent, but with no special privilege: it
    /// can only trigger logic that was already going to happen on schedule, never move funds
    /// outside this contract's own rules.
    function resolveRound() external nonReentrant whenNotPaused {
        require(status == Status.Active, "not active");
        require(block.timestamp > roundDeadline, "round still open");

        uint256 round = currentRound;
        uint256 pool = roundPool[round];

        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (defaulted[member] || hasContributed[round][member]) continue;

            uint256 slash = depositBalance[member];
            if (slash > 0) {
                depositBalance[member] = 0;
                pool += slash;
            }
            defaulted[member] = true;
            emit MemberDefaulted(member, round, slash);
        }

        address recipient = address(0);
        for (uint256 i = nextRecipientIndex; i < members.length; i++) {
            if (!defaulted[members[i]]) {
                recipient = members[i];
                nextRecipientIndex = i + 1;
                break;
            }
        }

        if (pool > 0) {
            if (recipient != address(0)) {
                pendingWithdrawal[recipient] += pool;
            } else {
                // Every remaining member has defaulted (including, possibly, this round's own
                // designated recipient defaulting on their own round). Rather than let the
                // pool sit unaccounted, it is tracked and later split pro-rata among whichever
                // members finish the circle in good standing (see distributeUnclaimedPool).
                unclaimedPool += pool;
            }
        }

        emit RoundResolved(round, recipient, pool);

        currentRound++;
        if (currentRound >= maxMembers) {
            _finish();
        } else {
            roundDeadline = block.timestamp + roundDuration;
        }
    }

    /// @notice Withdraw any payout(s) credited to you. Pull-based so a malicious or
    /// non-standard recipient can never block round resolution for the rest of the group.
    function withdrawPayout() external nonReentrant {
        uint256 amount = pendingWithdrawal[msg.sender];
        require(amount > 0, "nothing to withdraw");
        pendingWithdrawal[msg.sender] = 0;
        token.safeTransfer(msg.sender, amount);
        emit PayoutWithdrawn(msg.sender, amount);
    }

    /// @notice Splits any orphaned pool (from the all-remaining-members-defaulted edge case)
    /// evenly among members who completed the circle without ever defaulting. Callable once
    /// the circle is finished. Any integer-division remainder (at most goodStanding-1 wei)
    /// stays in unclaimedPool and can be swept again in a later call.
    function distributeUnclaimedPool() external nonReentrant {
        require(status == Status.Finished, "not finished");
        uint256 pool = unclaimedPool;
        require(pool > 0, "nothing to distribute");

        uint256 goodStanding = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!defaulted[members[i]]) goodStanding++;
        }
        require(goodStanding > 0, "no eligible members");

        uint256 share = pool / goodStanding;
        if (share == 0) return;

        uint256 distributed = 0;
        for (uint256 i = 0; i < members.length; i++) {
            if (!defaulted[members[i]]) {
                pendingWithdrawal[members[i]] += share;
                distributed += share;
            }
        }
        unclaimedPool -= distributed;
        emit UnclaimedPoolDistributed(distributed, goodStanding);
    }

    function pause() external onlyPlatformAdmin {
        _pause();
    }

    function unpause() external onlyPlatformAdmin {
        _unpause();
    }

    function memberCount() external view returns (uint256) {
        return members.length;
    }

    function getMembers() external view returns (address[] memory) {
        return members;
    }

    function _recordJoin(address account) internal {
        isMember[account] = true;
        depositBalance[account] = securityDeposit;
        members.push(account);
        emit MemberJoined(account, members.length - 1);

        if (members.length == maxMembers) {
            _activate();
        }
    }

    function _activate() internal {
        status = Status.Active;
        roundDeadline = block.timestamp + roundDuration;
        emit CircleActivated(block.timestamp, roundDeadline);
    }

    function _finish() internal {
        status = Status.Finished;
        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            if (!defaulted[member] && depositBalance[member] > 0) {
                uint256 amount = depositBalance[member];
                depositBalance[member] = 0;
                pendingWithdrawal[member] += amount;
                emit DepositRefunded(member, amount);
            }
        }
        emit CircleFinished(block.timestamp);
    }
}
