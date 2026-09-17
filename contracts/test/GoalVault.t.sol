// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StablecoinRegistry} from "../src/StablecoinRegistry.sol";
import {GoalVault} from "../src/GoalVault.sol";
import {GoalVaultFactory} from "../src/GoalVaultFactory.sol";
import {PolicyManager} from "../src/PolicyManager.sol";
import {AgentExecutor} from "../src/AgentExecutor.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";

contract GoalVaultTest is Test {
    StablecoinRegistry registry;
    MockUSDC usdc;
    GoalVault implementation;
    GoalVaultFactory factory;
    PolicyManager policyManager;
    AgentExecutor agentExecutor;

    address platformAdmin = makeAddr("platformAdmin");
    address deployer = makeAddr("deployer");
    address agentKey = makeAddr("agentKey");
    address alice = makeAddr("alice");
    address recipient = makeAddr("recipient");

    function setUp() public {
        vm.startPrank(deployer);
        registry = new StablecoinRegistry(deployer);
        usdc = new MockUSDC();
        registry.registerToken(address(usdc));

        policyManager = new PolicyManager(deployer);
        agentExecutor = new AgentExecutor(address(policyManager), deployer, agentKey);
        policyManager.setExecutor(address(agentExecutor));

        implementation = new GoalVault();
        factory = new GoalVaultFactory(address(implementation), address(registry), platformAdmin, deployer);
        factory.setAgentExecutor(address(agentExecutor));
        vm.stopPrank();

        usdc.mint(alice, 10_000e6);
    }

    function _createVault(uint256 unlockDate, uint256 maxPerPeriod, uint256 periodLength) internal returns (GoalVault vault) {
        vm.prank(alice);
        address v = factory.createVault(address(usdc), recipient, unlockDate, maxPerPeriod, periodLength);
        vault = GoalVault(v);
    }

    function test_Deposit_AnyoneCanFund() public {
        GoalVault vault = _createVault(block.timestamp + 30 days, 0, 0);
        address stranger = makeAddr("stranger");
        usdc.mint(stranger, 1_000e6);

        vm.startPrank(stranger);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);
        vm.stopPrank();

        assertEq(usdc.balanceOf(address(vault)), 1_000e6);
        assertEq(vault.totalDeposited(), 1_000e6);
    }

    function test_RevertWhen_WithdrawBeforeUnlockWithNoPeriodAllowance() public {
        GoalVault vault = _createVault(block.timestamp + 30 days, 0, 0);
        vm.startPrank(alice);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);
        vm.expectRevert(bytes("locked"));
        vault.withdraw(100e6);
        vm.stopPrank();
    }

    function test_Withdraw_SucceedsAfterUnlock() public {
        GoalVault vault = _createVault(block.timestamp + 1 days, 0, 0);
        vm.startPrank(alice);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 1);

        uint256 balanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        vault.withdraw(1_000e6);
        assertEq(usdc.balanceOf(alice), balanceBefore + 1_000e6);
    }

    function test_PeriodAllowance_CapsEarlyWithdrawal() public {
        GoalVault vault = _createVault(block.timestamp + 365 days, 100e6, 1 days);
        vm.startPrank(alice);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);

        vault.withdraw(100e6);
        vm.expectRevert(bytes("exceeds period allowance"));
        vault.withdraw(1);
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days + 1);
        vm.prank(alice);
        vault.withdraw(100e6); // new period, allowance resets
    }

    function test_AgentRelease_RespectsPolicyAndVaultRules() public {
        GoalVault vault = _createVault(block.timestamp + 365 days, 500e6, 1 days);
        vm.startPrank(alice);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);
        vm.stopPrank();

        vm.prank(alice);
        policyManager.setPolicy(address(vault), recipient, 200e6, 400e6, 1 days, 0);

        uint256 balanceBefore = usdc.balanceOf(recipient);
        vm.prank(agentKey);
        agentExecutor.executeVaultRelease(address(vault), 200e6);
        assertEq(usdc.balanceOf(recipient), balanceBefore + 200e6);
    }

    function test_RevokedPolicy_BlocksAgent() public {
        GoalVault vault = _createVault(block.timestamp + 365 days, 500e6, 1 days);
        vm.startPrank(alice);
        usdc.approve(address(vault), 1_000e6);
        vault.deposit(1_000e6);
        vm.stopPrank();

        vm.prank(alice);
        policyManager.setPolicy(address(vault), recipient, 200e6, 400e6, 1 days, 0);

        vm.prank(alice);
        policyManager.revokePolicy(address(vault));

        vm.prank(agentKey);
        vm.expectRevert(bytes("policy inactive"));
        agentExecutor.executeVaultRelease(address(vault), 200e6);
    }

    function test_RevertWhen_NonAgentCallsExecuteReleaseDirectly() public {
        GoalVault vault = _createVault(block.timestamp + 365 days, 500e6, 1 days);
        vm.prank(alice);
        vm.expectRevert(bytes("not agent executor"));
        vault.executeRelease(100e6);
    }
}
