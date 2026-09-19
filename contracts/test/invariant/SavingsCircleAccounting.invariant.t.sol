// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {StablecoinRegistry} from "../../src/StablecoinRegistry.sol";
import {SavingsCircle} from "../../src/SavingsCircle.sol";
import {SavingsCircleFactory} from "../../src/SavingsCircleFactory.sol";
import {MockUSDC} from "../../src/mocks/MockUSDC.sol";

/// @notice Drives a single SavingsCircle through random join/contribute/resolve/withdraw
/// sequences (including members who never contribute, i.e. real defaults) and exposes only
/// those actions to the invariant fuzzer, so every sequence it finds is one the real contract
/// could actually encounter through its own public interface, never a hand-crafted scenario.
contract SavingsCircleHandler is Test {
    SavingsCircle public circle;
    MockUSDC public token;
    address[] public candidates;

    uint256 public constant CONTRIBUTION = 100e6;

    constructor(SavingsCircle _circle, MockUSDC _token, address[] memory _candidates) {
        circle = _circle;
        token = _token;
        candidates = _candidates;
    }

    function join(uint256 seed) external {
        if (circle.status() != SavingsCircle.Status.Created) return;
        address member = candidates[seed % candidates.length];
        if (circle.isMember(member)) return;

        token.mint(member, CONTRIBUTION * 10);
        vm.startPrank(member);
        token.approve(address(circle), CONTRIBUTION);
        try circle.join() {} catch {}
        vm.stopPrank();
    }

    function contribute(uint256 seed) external {
        if (circle.status() != SavingsCircle.Status.Active) return;
        address member = candidates[seed % candidates.length];
        if (!circle.isMember(member) || circle.defaulted(member)) return;

        token.mint(member, CONTRIBUTION);
        vm.startPrank(member);
        token.approve(address(circle), CONTRIBUTION);
        try circle.contribute() {} catch {}
        vm.stopPrank();
    }

    function resolveRound(uint256 warpSeed) external {
        if (circle.status() != SavingsCircle.Status.Active) return;
        vm.warp(block.timestamp + (warpSeed % 3 days) + 1 days + 1);
        try circle.resolveRound() {} catch {}
    }

    function withdrawPayout(uint256 seed) external {
        address member = candidates[seed % candidates.length];
        vm.prank(member);
        try circle.withdrawPayout() {} catch {}
    }

    function distributeUnclaimedPool() external {
        try circle.distributeUnclaimedPool() {} catch {}
    }
}

contract SavingsCircleInvariantTest is StdInvariant, Test {
    StablecoinRegistry registry;
    MockUSDC token;
    SavingsCircle implementation;
    SavingsCircleFactory factory;
    SavingsCircleHandler handler;
    SavingsCircle circle;

    address[] members;

    function setUp() public {
        address deployer = makeAddr("deployer");
        address platformAdmin = makeAddr("platformAdmin");
        address creator = makeAddr("creator");

        vm.prank(deployer);
        registry = new StablecoinRegistry(deployer);

        token = new MockUSDC();
        vm.prank(deployer);
        registry.registerToken(address(token));

        implementation = new SavingsCircle();
        factory = new SavingsCircleFactory(address(implementation), address(registry), platformAdmin, deployer);

        token.mint(creator, 1000e6);
        vm.startPrank(creator);
        token.approve(address(factory), 100e6);
        address circleAddr = factory.createCircle(address(token), 100e6, 1 days, 4, 1);
        vm.stopPrank();
        circle = SavingsCircle(circleAddr);

        for (uint256 i = 0; i < 6; i++) {
            members.push(makeAddr(string.concat("member", vm.toString(i))));
        }
        members.push(creator);

        handler = new SavingsCircleHandler(circle, token, members);
        targetContract(address(handler));
    }

    /// @notice The core funds-conservation property: at every point in the circle's lifetime,
    /// whatever the token contract says this circle holds must equal exactly what is still
    /// owed to someone (locked deposits of members who haven't been refunded/slashed, credited
    /// payouts not yet withdrawn, and any pool not yet claimed), nothing more, nothing less.
    /// If this ever fails, funds have either leaked out or become permanently unaccounted for.
    function invariant_FundsConservation() public view {
        uint256 trackedLiabilities = circle.unclaimedPool();

        for (uint256 i = 0; i < members.length; i++) {
            address member = members[i];
            trackedLiabilities += circle.depositBalance(member);
            trackedLiabilities += circle.pendingWithdrawal(member);
        }

        // While a round is still active, members may have already contributed into it without
        // resolveRound() having run yet. That money is real, sitting in the contract, and not
        // yet reflected in any of the mappings above. Once the circle is no longer active, its
        // last round has necessarily been resolved (resolution is what ends Active status), so
        // this term correctly drops out.
        if (circle.status() == SavingsCircle.Status.Active) {
            trackedLiabilities += circle.roundPool(circle.currentRound());
        }

        assertEq(token.balanceOf(address(circle)), trackedLiabilities);
    }
}
