// Minimal human-readable ABI fragments for exactly the calls the off-chain agent makes.
// Kept hand-written and small rather than syncing the full compiler output, since the agent
// only ever reads a few view functions and calls two AgentExecutor entrypoints.

export const agentExecutorAbi = [
  "function AGENT_ROLE() view returns (bytes32)",
  "function executeVaultRelease(address vault, uint256 amount)",
  "function resolveCircleRound(address circle)",
  "event AgentExecuted(address indexed target, uint8 indexed actionType, uint256 amount, uint256 gasPriceWei, uint256 timestamp)",
] as const;

export const savingsCircleFactoryAbi = [
  "function getAllCircles() view returns (address[])",
  "event CircleCreated(address indexed circle, address indexed creator, address indexed token, uint256 contributionAmount, uint256 maxMembers)",
] as const;

export const savingsCircleAbi = [
  "function status() view returns (uint8)",
  "function roundDeadline() view returns (uint256)",
  "function currentRound() view returns (uint256)",
  "function maxMembers() view returns (uint256)",
] as const;

export const goalVaultFactoryAbi = [
  "function getAllVaults() view returns (address[])",
  "event VaultCreated(address indexed vault, address indexed owner, address indexed token, uint256 unlockDate)",
] as const;

export const goalVaultAbi = [
  "function owner() view returns (address)",
  "function destination() view returns (address)",
  "function unlockDate() view returns (uint256)",
  "function maxPerPeriod() view returns (uint256)",
  "function periodLength() view returns (uint256)",
  "function availableNow() view returns (uint256)",
] as const;

export const policyManagerAbi = [
  "function policies(address target) view returns (bool active, address owner, address allowedDestination, uint256 maxPerTx, uint256 maxPerPeriod, uint256 periodLength, uint256 expiry)",
] as const;
