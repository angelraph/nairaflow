import { parseAbi } from "viem";

// Hand-written, human-readable ABI fragments covering exactly what the frontend reads and
// writes. Kept in sync with the Solidity sources under contracts/src. Parsed with viem's
// parseAbi so they're real Abi objects wagmi's hooks can use at runtime, not just strings.

export const erc20Abi = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
]);

export const stablecoinRegistryAbi = parseAbi([
  "function isAllowed(address token) view returns (bool)",
  "function allTokens() view returns (address[])",
  "function tokens(address token) view returns (bool allowed, uint8 decimals, string symbol)",
]);

export const savingsCircleFactoryAbi = parseAbi([
  "function createCircle(address token, uint256 contributionAmount, uint256 roundDuration, uint256 maxMembers, uint256 securityDepositMultiplier) returns (address)",
  "function getAllCircles() view returns (address[])",
  "function circleCount() view returns (uint256)",
  "event CircleCreated(address indexed circle, address indexed creator, address indexed token, uint256 contributionAmount, uint256 maxMembers)",
]);

export const savingsCircleAbi = parseAbi([
  "function token() view returns (address)",
  "function status() view returns (uint8)",
  "function contributionAmount() view returns (uint256)",
  "function securityDeposit() view returns (uint256)",
  "function roundDuration() view returns (uint256)",
  "function maxMembers() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function roundDeadline() view returns (uint256)",
  "function nextRecipientIndex() view returns (uint256)",
  "function unclaimedPool() view returns (uint256)",
  "function createdAt() view returns (uint256)",
  "function isMember(address account) view returns (bool)",
  "function defaulted(address account) view returns (bool)",
  "function depositBalance(address account) view returns (uint256)",
  "function pendingWithdrawal(address account) view returns (uint256)",
  "function hasContributed(uint256 round, address account) view returns (bool)",
  "function memberCount() view returns (uint256)",
  "function getMembers() view returns (address[])",
  "function join()",
  "function leave()",
  "function contribute()",
  "function resolveRound()",
  "function withdrawPayout()",
  "function distributeUnclaimedPool()",
  "function cancelStale()",
  "event MemberJoined(address indexed member, uint256 indexed index)",
  "event Contributed(address indexed member, uint256 indexed round, uint256 amount)",
  "event MemberDefaulted(address indexed member, uint256 indexed round, uint256 slashedAmount)",
  "event RoundResolved(uint256 indexed round, address indexed recipient, uint256 payout)",
  "event PayoutWithdrawn(address indexed member, uint256 amount)",
  "event CircleActivated(uint256 startTimestamp, uint256 firstRoundDeadline)",
  "event CircleFinished(uint256 timestamp)",
]);

export const goalVaultFactoryAbi = parseAbi([
  "function createVault(address token, address destination, uint256 unlockDate, uint256 maxPerPeriod, uint256 periodLength) returns (address)",
  "function getAllVaults() view returns (address[])",
  "function getVaultsByOwner(address account) view returns (address[])",
  "function vaultCount() view returns (uint256)",
  "event VaultCreated(address indexed vault, address indexed owner, address indexed token, uint256 unlockDate)",
]);

export const goalVaultAbi = parseAbi([
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function destination() view returns (address)",
  "function unlockDate() view returns (uint256)",
  "function maxPerPeriod() view returns (uint256)",
  "function periodLength() view returns (uint256)",
  "function totalDeposited() view returns (uint256)",
  "function totalWithdrawn() view returns (uint256)",
  "function availableNow() view returns (uint256)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function setDestination(address newDestination)",
  "event Deposited(address indexed from, uint256 amount)",
  "event Withdrawn(address indexed owner, uint256 amount)",
  "event Released(address indexed destination, uint256 amount)",
]);

export const policyManagerAbi = parseAbi([
  "function policies(address target) view returns (bool active, address owner, address allowedDestination, uint256 maxPerTx, uint256 maxPerPeriod, uint256 periodLength, uint256 expiry)",
  "function setPolicy(address target, address allowedDestination, uint256 maxPerTx, uint256 maxPerPeriod, uint256 periodLength, uint256 expiry)",
  "function revokePolicy(address target)",
  "event PolicySet(address indexed target, address indexed owner, address allowedDestination, uint256 maxPerTx, uint256 maxPerPeriod, uint256 periodLength, uint256 expiry)",
  "event PolicyRevoked(address indexed target, address indexed owner)",
]);

export const agentExecutorAbi = parseAbi([
  "event AgentExecuted(address indexed target, uint8 indexed actionType, uint256 amount, uint256 gasPriceWei, uint256 timestamp)",
]);

export const CircleStatus = {
  Created: 0,
  Active: 1,
  Finished: 2,
  Cancelled: 3,
} as const;
