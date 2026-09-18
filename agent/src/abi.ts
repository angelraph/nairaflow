import { parseAbi } from "viem";

// Minimal human-readable ABI fragments for exactly the calls the off-chain agent makes.
// Kept hand-written and small rather than syncing the full compiler output, since the agent
// only ever reads a few view functions and calls two AgentExecutor entrypoints. Parsed with
// viem's parseAbi so they're usable directly with getContract() / simulateContract().

export const agentExecutorAbi = parseAbi([
  "function AGENT_ROLE() view returns (bytes32)",
  "function executeVaultRelease(address vault, uint256 amount)",
  "function resolveCircleRound(address circle)",
  "event AgentExecuted(address indexed target, uint8 indexed actionType, uint256 amount, uint256 gasPriceWei, uint256 timestamp)",
]);

export const savingsCircleFactoryAbi = parseAbi([
  "function getAllCircles() view returns (address[])",
  "event CircleCreated(address indexed circle, address indexed creator, address indexed token, uint256 contributionAmount, uint256 maxMembers)",
]);

export const savingsCircleAbi = parseAbi([
  "function status() view returns (uint8)",
  "function roundDeadline() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function maxMembers() view returns (uint256)",
]);

export const goalVaultFactoryAbi = parseAbi([
  "function getAllVaults() view returns (address[])",
  "event VaultCreated(address indexed vault, address indexed owner, address indexed token, uint256 unlockDate)",
]);

export const goalVaultAbi = parseAbi([
  "function owner() view returns (address)",
  "function destination() view returns (address)",
  "function unlockDate() view returns (uint256)",
  "function maxPerPeriod() view returns (uint256)",
  "function periodLength() view returns (uint256)",
  "function availableNow() view returns (uint256)",
]);

export const policyManagerAbi = parseAbi([
  "function policies(address target) view returns (bool active, address owner, address allowedDestination, uint256 maxPerTx, uint256 maxPerPeriod, uint256 periodLength, uint256 expiry)",
]);
