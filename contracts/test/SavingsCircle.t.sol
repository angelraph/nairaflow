// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StablecoinRegistry} from "../src/StablecoinRegistry.sol";
import {SavingsCircle} from "../src/SavingsCircle.sol";
import {SavingsCircleFactory} from "../src/SavingsCircleFactory.sol";
import {MockUSDC} from "../src/mocks/MockUSDC.sol";
import {MaliciousReentrantToken} from "./mocks/MaliciousReentrantToken.sol";

contract SavingsCircleTest is Test {
    StablecoinRegistry registry;
    MockUSDC usdc;
    SavingsCircle implementation;
    SavingsCircleFactory factory;

    address platformAdmin = makeAddr("platformAdmin");
    address deployer = makeAddr("deployer");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    uint256 constant CONTRIBUTION = 100e6; // 100 USDC (6 decimals)
    uint256 constant ROUND_DURATION = 1 days;
    uint256 constant MAX_MEMBERS = 3;
    uint256 constant DEPOSIT_MULTIPLIER = 1;

    function setUp() public {
        vm.prank(deployer);
        registry = new StablecoinRegistry(deployer);

        usdc = new MockUSDC();
        vm.prank(deployer);
        registry.registerToken(address(usdc));

        implementation = new SavingsCircle();
        factory = new SavingsCircleFactory(address(implementation), address(registry), platformAdmin, deployer);

        usdc.mint(alice, 10_000e6);
        usdc.mint(bob, 10_000e6);
        usdc.mint(carol, 10_000e6);
    }

    function _createCircle() internal returns (SavingsCircle circle) {
        vm.startPrank(alice);
        usdc.approve(address(factory), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        address circleAddr = factory.createCircle(address(usdc), CONTRIBUTION, ROUND_DURATION, MAX_MEMBERS, DEPOSIT_MULTIPLIER);
        vm.stopPrank();
        circle = SavingsCircle(circleAddr);
    }

    function _joinAsMember(SavingsCircle circle, address member) internal {
        vm.startPrank(member);
        usdc.approve(address(circle), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        circle.join();
        vm.stopPrank();
    }

    // Creator joins automatically at creation, funded via the factory in the same transaction.
    function test_CreateCircle_CreatorAutoJoinsWithDeposit() public {
        SavingsCircle circle = _createCircle();

        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Created));
        assertTrue(circle.isMember(alice));
        assertEq(circle.memberCount(), 1);
        assertEq(circle.depositBalance(alice), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(usdc.balanceOf(address(circle)), CONTRIBUTION * DEPOSIT_MULTIPLIER);
    }

    function test_CircleActivatesWhenFull() public {
        SavingsCircle circle = _createCircle();
        _joinAsMember(circle, bob);

        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Created));

        _joinAsMember(circle, carol);

        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Active));
        assertEq(circle.memberCount(), MAX_MEMBERS);
        assertGt(circle.roundDeadline(), block.timestamp);
    }

    function test_RevertWhen_JoiningFullCircle() public {
        SavingsCircle circle = _createCircle();
        _joinAsMember(circle, bob);
        _joinAsMember(circle, carol);

        address dave = makeAddr("dave");
        usdc.mint(dave, 10_000e6);
        vm.startPrank(dave);
        usdc.approve(address(circle), CONTRIBUTION);
        // The circle auto-activates the instant it reaches maxMembers (see _recordJoin), so a
        // later joiner always hits the "not open" gate rather than "full" — the length check
        // exists as defense-in-depth but is unreachable in practice given that invariant.
        vm.expectRevert(bytes("not open"));
        circle.join();
        vm.stopPrank();
    }

    function test_Leave_RefundsDepositBeforeActivation() public {
        SavingsCircle circle = _createCircle();
        _joinAsMember(circle, bob);

        uint256 balanceBefore = usdc.balanceOf(bob);
        vm.prank(bob);
        circle.leave();

        assertEq(usdc.balanceOf(bob), balanceBefore + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertFalse(circle.isMember(bob));
        assertEq(circle.memberCount(), 1);
    }

    function _activateThreeMemberCircle() internal returns (SavingsCircle circle) {
        circle = _createCircle();
        _joinAsMember(circle, bob);
        _joinAsMember(circle, carol);
    }

    function test_FullHappyPathRotation_NoDefaults() public {
        SavingsCircle circle = _activateThreeMemberCircle();

        // Round 0: everyone contributes, alice (join index 0) is paid.
        _contributeAll(circle);
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();

        assertEq(circle.pendingWithdrawal(alice), CONTRIBUTION * MAX_MEMBERS);
        assertEq(uint256(circle.currentRound()), 1);

        // Round 1: bob is paid.
        _contributeAll(circle);
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();
        assertEq(circle.pendingWithdrawal(bob), CONTRIBUTION * MAX_MEMBERS);

        // Round 2: carol is paid, circle finishes and refunds all deposits. Both happen inside
        // this same resolveRound() call, so carol's pendingWithdrawal already reflects her
        // payout plus her own deposit refund by the time it returns.
        _contributeAll(circle);
        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();
        assertEq(circle.pendingWithdrawal(carol), CONTRIBUTION * MAX_MEMBERS + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Finished));

        // Deposits refunded on top of the payout already credited for the round they won.
        assertEq(circle.pendingWithdrawal(alice), CONTRIBUTION * MAX_MEMBERS + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(circle.pendingWithdrawal(bob), CONTRIBUTION * MAX_MEMBERS + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(circle.pendingWithdrawal(carol), CONTRIBUTION * MAX_MEMBERS + CONTRIBUTION * DEPOSIT_MULTIPLIER);

        uint256 aliceBalanceBefore = usdc.balanceOf(alice);
        vm.prank(alice);
        circle.withdrawPayout();
        assertEq(usdc.balanceOf(alice), aliceBalanceBefore + CONTRIBUTION * MAX_MEMBERS + CONTRIBUTION * DEPOSIT_MULTIPLIER);

        // Full funds-conservation check: contract should hold exactly what's still unclaimed.
        uint256 stillOwed = circle.pendingWithdrawal(bob) + circle.pendingWithdrawal(carol);
        assertEq(usdc.balanceOf(address(circle)), stillOwed);
    }

    function test_DefaultingMember_ForfeitsDepositAndIsSkipped() public {
        SavingsCircle circle = _activateThreeMemberCircle();

        // Round 0: bob doesn't contribute.
        vm.prank(alice);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(alice);
        circle.contribute();

        vm.prank(carol);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(carol);
        circle.contribute();

        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();

        assertTrue(circle.defaulted(bob));
        assertEq(circle.depositBalance(bob), 0);
        // Pool = 2 contributions + bob's forfeited deposit, paid to alice (recipient of round 0).
        assertEq(circle.pendingWithdrawal(alice), CONTRIBUTION * 2 + CONTRIBUTION * DEPOSIT_MULTIPLIER);

        // Round 1: bob is skipped entirely — no longer required to contribute, not eligible to
        // receive. Recipient should be carol (next non-defaulted member after alice).
        vm.prank(alice);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(alice);
        circle.contribute();
        vm.prank(carol);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(carol);
        circle.contribute();

        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();

        assertEq(circle.pendingWithdrawal(carol), CONTRIBUTION * 2);
        // The circle still runs a fixed maxMembers (3) rounds regardless of defaults — round 2
        // has no eligible recipient left (both alice and carol already had their turn), so its
        // pool becomes unclaimed rather than finishing the circle one round early.
        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Active));

        // Round 2: alice and carol contribute again; no eligible recipient remains, so the pool
        // is tracked as unclaimed and the circle finishes (deposit refunds still fire).
        vm.prank(alice);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(alice);
        circle.contribute();
        vm.prank(carol);
        usdc.approve(address(circle), CONTRIBUTION);
        vm.prank(carol);
        circle.contribute();

        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();

        assertEq(uint256(circle.status()), uint256(SavingsCircle.Status.Finished));
        assertEq(circle.unclaimedPool(), CONTRIBUTION * 2);
        // alice and carol each already hold their deposit refund on top of their round payout.
        assertEq(circle.pendingWithdrawal(alice), CONTRIBUTION * 3 + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(circle.pendingWithdrawal(carol), CONTRIBUTION * 2 + CONTRIBUTION * DEPOSIT_MULTIPLIER);

        // The unclaimed pool splits evenly between the two members who finished in good
        // standing — bob, having defaulted, is excluded.
        circle.distributeUnclaimedPool();
        assertEq(circle.unclaimedPool(), 0);
        assertEq(circle.pendingWithdrawal(alice), CONTRIBUTION * 4 + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(circle.pendingWithdrawal(carol), CONTRIBUTION * 3 + CONTRIBUTION * DEPOSIT_MULTIPLIER);
        assertEq(circle.pendingWithdrawal(bob), 0);
    }

    function test_ResolveRound_RevertsBeforeDeadline() public {
        SavingsCircle circle = _activateThreeMemberCircle();
        vm.expectRevert(bytes("round still open"));
        circle.resolveRound();
    }

    function test_RevertWhen_DoubleContributing() public {
        SavingsCircle circle = _activateThreeMemberCircle();
        vm.startPrank(alice);
        usdc.approve(address(circle), CONTRIBUTION * 2);
        circle.contribute();
        vm.expectRevert(bytes("already contributed"));
        circle.contribute();
        vm.stopPrank();
    }

    function test_Reentrancy_WithdrawPayoutBlocked() public {
        MaliciousReentrantToken evilToken = new MaliciousReentrantToken();

        vm.prank(deployer);
        registry.registerToken(address(evilToken));

        evilToken.mint(alice, 10_000e6);
        evilToken.mint(bob, 10_000e6);
        evilToken.mint(carol, 10_000e6);

        vm.startPrank(alice);
        evilToken.approve(address(factory), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        address circleAddr = factory.createCircle(address(evilToken), CONTRIBUTION, ROUND_DURATION, MAX_MEMBERS, DEPOSIT_MULTIPLIER);
        vm.stopPrank();
        SavingsCircle circle = SavingsCircle(circleAddr);

        vm.startPrank(bob);
        evilToken.approve(address(circle), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        circle.join();
        vm.stopPrank();

        vm.startPrank(carol);
        evilToken.approve(address(circle), CONTRIBUTION * DEPOSIT_MULTIPLIER);
        circle.join();
        vm.stopPrank();

        vm.startPrank(alice);
        evilToken.approve(address(circle), CONTRIBUTION);
        circle.contribute();
        vm.stopPrank();
        vm.startPrank(bob);
        evilToken.approve(address(circle), CONTRIBUTION);
        circle.contribute();
        vm.stopPrank();
        vm.startPrank(carol);
        evilToken.approve(address(circle), CONTRIBUTION);
        circle.contribute();
        vm.stopPrank();

        vm.warp(block.timestamp + ROUND_DURATION + 1);
        circle.resolveRound();

        // Arm the token to re-enter withdrawPayout() from within its own transfer() call, which
        // fires during alice's first, legitimate withdrawPayout(). The reentrant inner call
        // must revert (nonReentrant), while the outer call still succeeds exactly once.
        evilToken.arm(address(circle), abi.encodeWithSelector(SavingsCircle.withdrawPayout.selector));

        uint256 owed = circle.pendingWithdrawal(alice);
        uint256 balanceBefore = evilToken.balanceOf(alice);

        vm.prank(alice);
        circle.withdrawPayout();

        assertEq(evilToken.balanceOf(alice), balanceBefore + owed);
        assertEq(circle.pendingWithdrawal(alice), 0);
    }

    function _contributeAll(SavingsCircle circle) internal {
        address[3] memory ms = [alice, bob, carol];
        for (uint256 i = 0; i < ms.length; i++) {
            vm.startPrank(ms[i]);
            usdc.approve(address(circle), CONTRIBUTION);
            circle.contribute();
            vm.stopPrank();
        }
    }
}
