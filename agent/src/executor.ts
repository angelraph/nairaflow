import { type Address, type PublicClient, type WalletClient, getContract } from "viem";
import {
  agentExecutorAbi,
  goalVaultAbi,
  goalVaultFactoryAbi,
  policyManagerAbi,
  savingsCircleAbi,
  savingsCircleFactoryAbi,
} from "./abi.js";
import type { Deployment } from "./config.js";

const CIRCLE_STATUS_ACTIVE = 1;

export interface DueVaultRelease {
  vault: Address;
  amount: bigint;
  /** Has a fixed deadline it must honor regardless of gas price (unlockDate already reached and
   * this is the owner's own configured cutoff), vs. still inside its flexible window. Goal
   * vaults don't currently have a separate "hard" flag distinct from availableNow > 0, so v1
   * simply treats every due release as gas-timeable within a short window — see watcher.ts. */
}

/** Circles whose current round's contribution deadline has passed and are waiting to be
 * resolved. Reads every circle the factory has ever created — fine at hackathon scale, would
 * move to indexed event queries or a subgraph before this needed to handle thousands. */
export async function findDueCircleRounds(publicClient: PublicClient, deployment: Deployment): Promise<Address[]> {
  const factory = getContract({ address: deployment.savingsCircleFactory, abi: savingsCircleFactoryAbi, client: publicClient });
  const circles = await factory.read.getAllCircles();

  const due: Address[] = [];
  const now = BigInt(Math.floor(Date.now() / 1000));

  for (const circle of circles) {
    const c = getContract({ address: circle, abi: savingsCircleAbi, client: publicClient });
    const status = await c.read.status();
    if (status !== CIRCLE_STATUS_ACTIVE) continue;
    const deadline = await c.read.roundDeadline();
    if (now > deadline) due.push(circle);
  }
  return due;
}

/** Goal vaults with an active agent policy and a currently-available scheduled release. */
export async function findDueVaultReleases(publicClient: PublicClient, deployment: Deployment): Promise<DueVaultRelease[]> {
  const factory = getContract({ address: deployment.goalVaultFactory, abi: goalVaultFactoryAbi, client: publicClient });
  const vaults = await factory.read.getAllVaults();
  const policyManager = getContract({ address: deployment.policyManager, abi: policyManagerAbi, client: publicClient });

  const due: DueVaultRelease[] = [];
  for (const vault of vaults) {
    const policy = await policyManager.read.policies([vault]);
    if (!policy.active) continue;

    const v = getContract({ address: vault, abi: goalVaultAbi, client: publicClient });
    const available = await v.read.availableNow();
    if (available === 0n) continue;

    const amount = available < policy.maxPerTx ? available : policy.maxPerTx;
    if (amount > 0n) due.push({ vault, amount });
  }
  return due;
}

export async function executeVaultRelease(
  walletClient: WalletClient,
  publicClient: PublicClient,
  deployment: Deployment,
  vault: Address,
  amount: bigint
) {
  const { request } = await publicClient.simulateContract({
    address: deployment.agentExecutor,
    abi: agentExecutorAbi,
    functionName: "executeVaultRelease",
    args: [vault, amount],
    account: walletClient.account,
  });
  return walletClient.writeContract(request);
}

export async function executeCircleResolution(
  walletClient: WalletClient,
  publicClient: PublicClient,
  deployment: Deployment,
  circle: Address
) {
  const { request } = await publicClient.simulateContract({
    address: deployment.agentExecutor,
    abi: agentExecutorAbi,
    functionName: "resolveCircleRound",
    args: [circle],
    account: walletClient.account,
  });
  return walletClient.writeContract(request);
}
