// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentReputation} from "../src/AgentReputation.sol";
import {YieldSwarmRegistry} from "../src/YieldSwarmRegistry.sol";

contract AgentReputationTest is Test {
    AgentReputation public reputation;
    YieldSwarmRegistry public registry;
    address public owner;
    address public orchestrator;
    address public alice;
    address public bob;

    function setUp() public {
        owner = address(this);
        orchestrator = makeAddr("orchestrator");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        registry = new YieldSwarmRegistry();
        reputation = new AgentReputation();
        reputation.setRegistry(address(registry));
        reputation.setOrchestrator(orchestrator);

        // Register a swarm for alice (she's a valid user)
        registry.registerAgent("scout", "ipfs://scout", alice);
        registry.registerAgent("risk", "ipfs://risk", alice);
        registry.registerAgent("executor", "ipfs://exec", alice);
        registry.registerAgent("orchestrator", "ipfs://orch", alice);
    }

    // ============ recordOutcome ============

    function test_RecordOutcome_Win_UpdatesStats() public {
        vm.prank(orchestrator);
        // Predicted +250 bps (2.5%), actual +310 bps (3.1%) → win
        reputation.recordOutcome(alice, keccak256("s1"), 250, 310);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.totalStrategies, 1);
        assertEq(score.winCount, 1);
        assertGt(score.lastUpdated, 0);
    }

    function test_RecordOutcome_Loss_UpdatesStats() public {
        vm.prank(orchestrator);
        // Predicted +500 bps (5%), actual +100 bps (1%) → loss (actual < predicted * 0.9)
        reputation.recordOutcome(alice, keccak256("s1"), 500, 100);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.totalStrategies, 1);
        assertEq(score.winCount, 0);
    }

    function test_RecordOutcome_MarginalWin_Succeeds() public {
        vm.prank(orchestrator);
        // Predicted +1000 bps, actual +900 bps → win (exactly 90% of predicted)
        reputation.recordOutcome(alice, keccak256("s1"), 1000, 900);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.winCount, 1);
    }

    function test_RecordOutcome_JustBelowThreshold_IsLoss() public {
        vm.prank(orchestrator);
        // Predicted +1000 bps, actual +899 bps → loss (below 90% of predicted)
        reputation.recordOutcome(alice, keccak256("s1"), 1000, 899);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.winCount, 0);
    }

    function test_RecordOutcome_EmitsEvent() public {
        vm.prank(orchestrator);
        vm.expectEmit(true, true, false, true);
        emit AgentReputation.OutcomeRecorded(alice, keccak256("s1"), true);

        reputation.recordOutcome(alice, keccak256("s1"), 250, 310);
    }

    function test_RecordOutcome_NotOrchestrator_Reverts() public {
        vm.prank(alice);
        vm.expectRevert(AgentReputation.OnlyOrchestrator.selector);
        reputation.recordOutcome(alice, keccak256("s1"), 250, 310);
    }

    function test_RecordOutcome_UnregisteredUser_Reverts() public {
        vm.prank(orchestrator);
        vm.expectRevert(AgentReputation.UserNotRegistered.selector);
        reputation.recordOutcome(makeAddr("nobody"), keccak256("s1"), 250, 310);
    }

    function test_RecordOutcome_MultipleOutcomes_AccumulatesCorrectly() public {
        vm.startPrank(orchestrator);
        // 3 wins, 1 loss
        reputation.recordOutcome(alice, keccak256("s1"), 250, 310);  // win
        reputation.recordOutcome(alice, keccak256("s2"), 180, 200);  // win
        reputation.recordOutcome(alice, keccak256("s3"), 500, 100);  // loss
        reputation.recordOutcome(alice, keccak256("s4"), 300, 350);  // win
        vm.stopPrank();

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.totalStrategies, 4);
        assertEq(score.winCount, 3);
    }

    // ============ getTier ============

    function test_GetTier_NoOutcomes_ReturnsBronze() public view {
        assertEq(uint8(reputation.getTier(alice)), uint8(AgentReputation.Tier.Bronze));
    }

    function test_GetTier_Silver_Threshold() public {
        // Silver: >70% win rate, 100+ strategies
        vm.startPrank(orchestrator);
        for (uint256 i = 0; i < 100; i++) {
            bytes32 sid = keccak256(abi.encodePacked("s", i));
            if (i < 75) {
                reputation.recordOutcome(alice, sid, 200, 250);
            } else {
                reputation.recordOutcome(alice, sid, 200, 50);
            }
        }
        vm.stopPrank();

        assertEq(uint8(reputation.getTier(alice)), uint8(AgentReputation.Tier.Silver));
    }

    function test_GetTier_Gold_Threshold() public {
        // Gold: >80% win rate, 150+ strategies
        vm.startPrank(orchestrator);
        for (uint256 i = 0; i < 150; i++) {
            bytes32 sid = keccak256(abi.encodePacked("s", i));
            if (i < 125) {
                reputation.recordOutcome(alice, sid, 200, 250);
            } else {
                reputation.recordOutcome(alice, sid, 200, 50);
            }
        }
        vm.stopPrank();

        assertEq(uint8(reputation.getTier(alice)), uint8(AgentReputation.Tier.Gold));
    }

    function test_GetTier_Platinum_Threshold() public {
        // Platinum: >90% win rate, 200+ strategies
        vm.startPrank(orchestrator);
        for (uint256 i = 0; i < 200; i++) {
            bytes32 sid = keccak256(abi.encodePacked("s", i));
            if (i < 185) {
                reputation.recordOutcome(alice, sid, 200, 250);
            } else {
                reputation.recordOutcome(alice, sid, 200, 50);
            }
        }
        vm.stopPrank();

        assertEq(uint8(reputation.getTier(alice)), uint8(AgentReputation.Tier.Platinum));
    }

    function test_GetTier_TierPromotion_EmitsEvent() public {
        // Reach Silver threshold (100 strategies, >70% win)
        vm.startPrank(orchestrator);
        for (uint256 i = 0; i < 99; i++) {
            reputation.recordOutcome(alice, keccak256(abi.encodePacked("s", i)), 200, 250);
        }

        vm.expectEmit(true, false, false, true);
        emit AgentReputation.TierPromoted(alice, AgentReputation.Tier.Silver);

        reputation.recordOutcome(alice, keccak256("s100"), 200, 250);
        vm.stopPrank();
    }

    // ============ getReputation ============

    function test_GetReputation_UnregisteredUser_Reverts() public {
        vm.expectRevert(AgentReputation.UserNotRegistered.selector);
        reputation.getReputation(makeAddr("nobody"));
    }

    function test_GetReputation_SeparateUsers_IndependentScores() public {
        // Register bob's swarm
        registry.registerAgent("scout", "ipfs://scout2", bob);

        vm.startPrank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);
        reputation.recordOutcome(alice, keccak256("s2"), 200, 250);
        reputation.recordOutcome(bob, keccak256("s1"), 200, 50);
        vm.stopPrank();

        AgentReputation.SwarmScore memory aliceScore = reputation.getReputation(alice);
        AgentReputation.SwarmScore memory bobScore = reputation.getReputation(bob);

        assertEq(aliceScore.totalStrategies, 2);
        assertEq(aliceScore.winCount, 2);
        assertEq(bobScore.totalStrategies, 1);
        assertEq(bobScore.winCount, 0);
    }

    // ============ getLeaderboard ============

    function test_GetLeaderboard_MultipleUsers_SortedByWinRate() public {
        // Register bob's swarm
        registry.registerAgent("scout", "ipfs://scout2", bob);

        address carol = makeAddr("carol");
        registry.registerAgent("scout", "ipfs://scout3", carol);

        vm.startPrank(orchestrator);
        // alice: 15 wins out of 20 (75%)
        for (uint256 i = 0; i < 20; i++) {
            bytes32 sid = keccak256(abi.encodePacked("a", i));
            if (i < 15) {
                reputation.recordOutcome(alice, sid, 200, 250);
            } else {
                reputation.recordOutcome(alice, sid, 200, 50);
            }
        }

        // bob: 20 wins out of 20 (100%)
        for (uint256 i = 0; i < 20; i++) {
            reputation.recordOutcome(bob, keccak256(abi.encodePacked("b", i)), 200, 250);
        }

        // carol: 12 wins out of 20 (60%)
        for (uint256 i = 0; i < 20; i++) {
            bytes32 sid = keccak256(abi.encodePacked("c", i));
            if (i < 12) {
                reputation.recordOutcome(carol, sid, 200, 250);
            } else {
                reputation.recordOutcome(carol, sid, 200, 50);
            }
        }
        vm.stopPrank();

        AgentReputation.SwarmScore[] memory board = reputation.getLeaderboard(3);
        assertEq(board.length, 3);
        // Best swarm first
        assertEq(board[0].user, bob);
        assertEq(board[1].user, alice);
        assertEq(board[2].user, carol);
    }

    function test_GetLeaderboard_UserBelowMinStrategies_Excluded() public {
        // Register bob's swarm
        registry.registerAgent("scout", "ipfs://scout2", bob);

        vm.startPrank(orchestrator);
        // alice: 20 strategies (eligible)
        for (uint256 i = 0; i < 20; i++) {
            reputation.recordOutcome(alice, keccak256(abi.encodePacked("a", i)), 200, 250);
        }

        // bob: only 5 strategies (not eligible)
        for (uint256 i = 0; i < 5; i++) {
            reputation.recordOutcome(bob, keccak256(abi.encodePacked("b", i)), 200, 250);
        }
        vm.stopPrank();

        AgentReputation.SwarmScore[] memory board = reputation.getLeaderboard(10);
        assertEq(board.length, 1);
        assertEq(board[0].user, alice);
    }

    function test_GetLeaderboard_UserAtExactMinimum_Included() public {
        vm.startPrank(orchestrator);
        // Exactly 20 strategies — should be included
        for (uint256 i = 0; i < 20; i++) {
            reputation.recordOutcome(alice, keccak256(abi.encodePacked("s", i)), 200, 250);
        }
        vm.stopPrank();

        AgentReputation.SwarmScore[] memory board = reputation.getLeaderboard(10);
        assertEq(board.length, 1);
        assertEq(board[0].user, alice);
    }

    function test_GetLeaderboard_LimitExceedsUsers_ReturnsAll() public {
        vm.startPrank(orchestrator);
        for (uint256 i = 0; i < 20; i++) {
            reputation.recordOutcome(alice, keccak256(abi.encodePacked("s", i)), 200, 250);
        }
        vm.stopPrank();

        AgentReputation.SwarmScore[] memory board = reputation.getLeaderboard(10);
        assertEq(board.length, 1);
    }

    // ============ Freshness & Staleness ============

    function test_IsActive_RecentOutcome_ReturnsTrue() public {
        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        assertTrue(reputation.isActive(alice));
    }

    function test_IsActive_NoOutcomeFor7Days_ReturnsFalse() public {
        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        vm.warp(block.timestamp + 8 days);

        assertFalse(reputation.isActive(alice));
    }

    function test_IsActive_NoOutcomes_ReturnsFalse() public view {
        assertFalse(reputation.isActive(alice));
    }

    function test_StaleDays_RecentOutcome_ReturnsZero() public {
        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        assertEq(reputation.staleDays(alice), 0);
    }

    function test_StaleDays_After10Days_Returns10() public {
        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        vm.warp(block.timestamp + 10 days);

        assertEq(reputation.staleDays(alice), 10);
    }

    function test_StaleDays_NoOutcomes_ReturnsMaxStaleness() public view {
        // No outcomes ever recorded — swarm has never been active
        assertGt(reputation.staleDays(alice), 0);
    }

    function test_LastActiveTimestamp_UpdatedOnOutcome() public {
        uint256 ts = block.timestamp;
        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.lastActiveTimestamp, ts);
    }

    function test_LastActiveTimestamp_MultipleOutcomes_UsesLatest() public {
        vm.startPrank(orchestrator);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);

        vm.warp(block.timestamp + 2 days);
        uint256 latestTs = block.timestamp;
        reputation.recordOutcome(alice, keccak256("s2"), 200, 250);
        vm.stopPrank();

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.lastActiveTimestamp, latestTs);
    }

    // ============ setOrchestrator ============

    function test_SetOrchestrator_Owner_Succeeds() public {
        address newOrch = makeAddr("newOrch");
        reputation.setOrchestrator(newOrch);

        vm.prank(newOrch);
        reputation.recordOutcome(alice, keccak256("s1"), 200, 250);
        // If it doesn't revert, new orchestrator works
    }

    function test_SetOrchestrator_NotOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert();
        reputation.setOrchestrator(alice);
    }

    // ============ Fuzz tests ============

    function test_RecordOutcome_FuzzReturnBps(uint256 predicted, uint256 actual) public {
        vm.assume(predicted > 0 && predicted < type(uint128).max);
        vm.assume(actual < type(uint128).max);

        vm.prank(orchestrator);
        reputation.recordOutcome(alice, keccak256(abi.encodePacked(predicted, actual)), predicted, actual);

        AgentReputation.SwarmScore memory score = reputation.getReputation(alice);
        assertEq(score.totalStrategies, 1);
    }
}
