// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {StrategyVault} from "../src/StrategyVault.sol";
import {YieldSwarmRegistry} from "../src/YieldSwarmRegistry.sol";

contract StrategyVaultTest is Test {
    StrategyVault public vault;
    YieldSwarmRegistry public registry;
    address public owner;
    address public alice;
    address public agent;
    uint256 public agentTokenId;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        agent = makeAddr("agent");

        registry = new YieldSwarmRegistry();
        vault = new StrategyVault();
        vault.setRegistry(address(registry));

        agentTokenId = registry.registerAgent("executor", "ipfs://executor", agent);
    }

    function _createAction(address target, uint256 value, bytes memory data) internal pure returns (StrategyVault.SwapAction memory) {
        return StrategyVault.SwapAction({
            target: target,
            value: value,
            calldata_: data,
            minAmountOut: 0
        });
    }

    function _proposeDefault() internal returns (bytes32) {
        bytes32 strategyId = keccak256("strategy-1");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vault.proposeStrategy(strategyId, actions, 500, 5);
        return strategyId;
    }

    // ============ proposeStrategy ============

    function test_ProposeStrategy_ValidInput_Succeeds() public {
        bytes32 strategyId = keccak256("strategy-1");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vm.expectEmit(true, false, false, true);
        emit StrategyVault.StrategyProposed(strategyId, 500, 5);

        vault.proposeStrategy(strategyId, actions, 500, 5);

        StrategyVault.Strategy memory s = vault.getStrategy(strategyId);
        assertEq(uint8(s.status), uint8(StrategyVault.StrategyStatus.Proposed));
        assertEq(s.estimatedAPY, 500);
        assertEq(s.riskScore, 5);
    }

    function test_ProposeStrategy_RiskAboveThreshold_Reverts() public {
        vault.setRiskThreshold(5);

        bytes32 strategyId = keccak256("strategy-high-risk");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vm.expectRevert(abi.encodeWithSelector(StrategyVault.RiskThresholdExceeded.selector, 8, 5));
        vault.proposeStrategy(strategyId, actions, 500, 8);
    }

    function test_ProposeStrategy_InvalidRiskScore_Reverts() public {
        bytes32 strategyId = keccak256("strategy-bad");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vm.expectRevert(StrategyVault.InvalidRiskScore.selector);
        vault.proposeStrategy(strategyId, actions, 500, 0);
    }

    function test_ProposeStrategy_RiskScoreAbove10_Reverts() public {
        bytes32 strategyId = keccak256("strategy-bad");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vm.expectRevert(StrategyVault.InvalidRiskScore.selector);
        vault.proposeStrategy(strategyId, actions, 500, 11);
    }

    function test_ProposeStrategy_EmptyActions_Reverts() public {
        bytes32 strategyId = keccak256("strategy-empty");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](0);

        vm.expectRevert();
        vault.proposeStrategy(strategyId, actions, 500, 5);
    }

    // ============ approveStrategy ============

    function test_ApproveStrategy_Proposed_Succeeds() public {
        bytes32 strategyId = _proposeDefault();

        vm.expectEmit(true, false, false, true);
        emit StrategyVault.StrategyApproved(strategyId, owner);

        vault.approveStrategy(strategyId);

        StrategyVault.Strategy memory s = vault.getStrategy(strategyId);
        assertEq(uint8(s.status), uint8(StrategyVault.StrategyStatus.Approved));
    }

    function test_ApproveStrategy_NotOwner_Reverts() public {
        bytes32 strategyId = _proposeDefault();

        vm.prank(alice);
        vm.expectRevert();
        vault.approveStrategy(strategyId);
    }

    function test_ApproveStrategy_NotProposed_Reverts() public {
        bytes32 strategyId = _proposeDefault();
        vault.approveStrategy(strategyId);

        vm.expectRevert(
            abi.encodeWithSelector(
                StrategyVault.InvalidStatus.selector,
                StrategyVault.StrategyStatus.Approved,
                StrategyVault.StrategyStatus.Proposed
            )
        );
        vault.approveStrategy(strategyId);
    }

    function test_ApproveStrategy_NonExistent_Reverts() public {
        vm.expectRevert(StrategyVault.StrategyNotFound.selector);
        vault.approveStrategy(keccak256("nonexistent"));
    }

    // ============ rejectStrategy ============

    function test_RejectStrategy_Proposed_Succeeds() public {
        bytes32 strategyId = _proposeDefault();

        vm.expectEmit(true, false, false, true);
        emit StrategyVault.StrategyRejected(strategyId, "too risky");

        vault.rejectStrategy(strategyId, "too risky");

        StrategyVault.Strategy memory s = vault.getStrategy(strategyId);
        assertEq(uint8(s.status), uint8(StrategyVault.StrategyStatus.Rejected));
    }

    function test_RejectStrategy_NotOwner_Reverts() public {
        bytes32 strategyId = _proposeDefault();

        vm.prank(alice);
        vm.expectRevert();
        vault.rejectStrategy(strategyId, "no");
    }

    function test_RejectStrategy_AlreadyExecuted_Reverts() public {
        bytes32 strategyId = _proposeDefault();
        vault.approveStrategy(strategyId);
        vault.executeStrategy(strategyId);

        vm.expectRevert(
            abi.encodeWithSelector(
                StrategyVault.InvalidStatus.selector,
                StrategyVault.StrategyStatus.Executed,
                StrategyVault.StrategyStatus.Proposed
            )
        );
        vault.rejectStrategy(strategyId, "too late");
    }

    // ============ executeStrategy ============

    function test_ExecuteStrategy_Approved_Succeeds() public {
        // Deploy a mock target that accepts calls
        MockTarget target = new MockTarget();
        bytes32 strategyId = keccak256("strategy-exec");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(target), 0, abi.encodeWithSelector(MockTarget.doSomething.selector));

        vault.proposeStrategy(strategyId, actions, 500, 5);
        vault.approveStrategy(strategyId);

        vm.expectEmit(true, false, false, false);
        emit StrategyVault.StrategyExecuted(strategyId);

        vault.executeStrategy(strategyId);

        StrategyVault.Strategy memory s = vault.getStrategy(strategyId);
        assertEq(uint8(s.status), uint8(StrategyVault.StrategyStatus.Executed));
        assertGt(s.executedAt, 0);
        assertTrue(target.called());
    }

    function test_ExecuteStrategy_NotApproved_Reverts() public {
        bytes32 strategyId = _proposeDefault();

        vm.expectRevert(
            abi.encodeWithSelector(
                StrategyVault.InvalidStatus.selector,
                StrategyVault.StrategyStatus.Proposed,
                StrategyVault.StrategyStatus.Approved
            )
        );
        vault.executeStrategy(strategyId);
    }

    function test_ExecuteStrategy_NotOwner_Reverts() public {
        bytes32 strategyId = _proposeDefault();
        vault.approveStrategy(strategyId);

        vm.prank(alice);
        vm.expectRevert();
        vault.executeStrategy(strategyId);
    }

    function test_ExecuteStrategy_FailedCall_Reverts() public {
        // Target that reverts
        RevertingTarget target = new RevertingTarget();
        bytes32 strategyId = keccak256("strategy-fail");
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(target), 0, abi.encodeWithSelector(RevertingTarget.fail.selector));

        vault.proposeStrategy(strategyId, actions, 500, 5);
        vault.approveStrategy(strategyId);

        vm.expectRevert(abi.encodeWithSelector(StrategyVault.ExecutionFailed.selector, 0));
        vault.executeStrategy(strategyId);
    }

    // ============ setRiskThreshold ============

    function test_SetRiskThreshold_Owner_Succeeds() public {
        vault.setRiskThreshold(7);
        assertEq(vault.riskThreshold(), 7);
    }

    function test_SetRiskThreshold_NotOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setRiskThreshold(7);
    }

    function test_SetRiskThreshold_Zero_Reverts() public {
        vm.expectRevert(StrategyVault.InvalidRiskScore.selector);
        vault.setRiskThreshold(0);
    }

    function test_SetRiskThreshold_Above10_Reverts() public {
        vm.expectRevert(StrategyVault.InvalidRiskScore.selector);
        vault.setRiskThreshold(11);
    }

    // ============ getActiveStrategies ============

    function test_GetActiveStrategies_MixedStatuses_ReturnsOnlyActive() public {
        bytes32 id1 = keccak256("s1");
        bytes32 id2 = keccak256("s2");
        bytes32 id3 = keccak256("s3");

        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vault.proposeStrategy(id1, actions, 500, 5);
        vault.proposeStrategy(id2, actions, 600, 3);
        vault.proposeStrategy(id3, actions, 700, 4);

        vault.approveStrategy(id1);
        vault.rejectStrategy(id3, "no");

        bytes32[] memory active = vault.getActiveStrategies();
        // Should include proposed (id2) and approved (id1), but not rejected (id3)
        assertEq(active.length, 2);
    }

    // ============ Fuzz tests ============

    function test_ProposeStrategy_FuzzRiskScore(uint8 riskScore) public {
        vm.assume(riskScore >= 1 && riskScore <= 10);

        bytes32 strategyId = keccak256(abi.encodePacked("fuzz-", riskScore));
        StrategyVault.SwapAction[] memory actions = new StrategyVault.SwapAction[](1);
        actions[0] = _createAction(address(0x1), 0, "");

        vault.proposeStrategy(strategyId, actions, 500, riskScore);

        StrategyVault.Strategy memory s = vault.getStrategy(strategyId);
        assertEq(s.riskScore, riskScore);
    }
}

// Helper contracts for testing executeStrategy
contract MockTarget {
    bool public called;

    function doSomething() external {
        called = true;
    }
}

contract RevertingTarget {
    function fail() external pure {
        revert("intentional failure");
    }
}
