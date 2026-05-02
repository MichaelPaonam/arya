// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StrategyVault is Ownable, ReentrancyGuard {
    enum StrategyStatus { Proposed, Approved, Executed, Rejected }

    struct SwapAction {
        address target;
        uint256 value;
        bytes calldata_;
        uint256 minAmountOut;
    }

    struct Strategy {
        bytes32 strategyId;
        SwapAction[] actions;
        uint256 estimatedAPY;
        uint8 riskScore;
        StrategyStatus status;
        uint256 proposedAt;
        uint256 executedAt;
        address proposedBy;
    }

    error StrategyNotFound();
    error InvalidStatus(StrategyStatus current, StrategyStatus expected);
    error RiskThresholdExceeded(uint8 score, uint8 threshold);
    error ExecutionFailed(uint256 actionIndex);
    error InvalidRiskScore();
    error EmptyActions();
    error NotRegisteredAgent();

    event StrategyProposed(bytes32 indexed strategyId, uint256 estimatedAPY, uint8 riskScore);
    event StrategyApproved(bytes32 indexed strategyId, address approver);
    event StrategyExecuted(bytes32 indexed strategyId);
    event StrategyRejected(bytes32 indexed strategyId, string reason);

    uint8 public riskThreshold = 10;
    address public registry;

    mapping(bytes32 => Strategy) private _strategies;
    bytes32[] private _strategyIds;

    constructor() Ownable(msg.sender) {}

    // ─── Configuration ───────────────────────────────────────────────────

    function setRegistry(address registry_) external onlyOwner {
        registry = registry_;
    }

    function setRiskThreshold(uint8 maxRisk) external onlyOwner {
        if (maxRisk == 0 || maxRisk > 10) revert InvalidRiskScore();
        riskThreshold = maxRisk;
    }

    // ─── Strategy Lifecycle ──────────────────────────────────────────────

    function proposeStrategy(
        bytes32 strategyId,
        SwapAction[] calldata actions,
        uint256 estimatedAPY,
        uint8 riskScore
    ) external {
        if (actions.length == 0) revert EmptyActions();
        if (riskScore == 0 || riskScore > 10) revert InvalidRiskScore();
        if (riskScore > riskThreshold) revert RiskThresholdExceeded(riskScore, riskThreshold);

        Strategy storage s = _strategies[strategyId];
        s.strategyId = strategyId;
        s.estimatedAPY = estimatedAPY;
        s.riskScore = riskScore;
        s.status = StrategyStatus.Proposed;
        s.proposedAt = block.timestamp;
        s.proposedBy = msg.sender;

        for (uint256 i; i < actions.length; i++) {
            s.actions.push(actions[i]);
        }

        _strategyIds.push(strategyId);

        emit StrategyProposed(strategyId, estimatedAPY, riskScore);
    }

    function approveStrategy(bytes32 strategyId) external {
        Strategy storage s = _getExistingStrategy(strategyId);
        if (s.status != StrategyStatus.Proposed) {
            revert InvalidStatus(s.status, StrategyStatus.Proposed);
        }

        s.status = StrategyStatus.Approved;
        emit StrategyApproved(strategyId, msg.sender);
    }

    function rejectStrategy(bytes32 strategyId, string calldata reason) external {
        Strategy storage s = _getExistingStrategy(strategyId);
        if (s.status != StrategyStatus.Proposed) {
            revert InvalidStatus(s.status, StrategyStatus.Proposed);
        }

        s.status = StrategyStatus.Rejected;
        emit StrategyRejected(strategyId, reason);
    }

    function executeStrategy(bytes32 strategyId) external onlyOwner nonReentrant {
        Strategy storage s = _getExistingStrategy(strategyId);
        if (s.status != StrategyStatus.Approved) {
            revert InvalidStatus(s.status, StrategyStatus.Approved);
        }

        for (uint256 i; i < s.actions.length; i++) {
            SwapAction storage action = s.actions[i];
            (bool success,) = action.target.call{value: action.value}(action.calldata_);
            if (!success) revert ExecutionFailed(i);
        }

        s.status = StrategyStatus.Executed;
        s.executedAt = block.timestamp;
        emit StrategyExecuted(strategyId);
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    function getStrategy(bytes32 strategyId) external view returns (Strategy memory) {
        return _strategies[strategyId];
    }

    function getActiveStrategies() external view returns (bytes32[] memory) {
        uint256 count;
        for (uint256 i; i < _strategyIds.length; i++) {
            StrategyStatus status = _strategies[_strategyIds[i]].status;
            if (status == StrategyStatus.Proposed || status == StrategyStatus.Approved) {
                count++;
            }
        }

        bytes32[] memory active = new bytes32[](count);
        uint256 idx;
        for (uint256 i; i < _strategyIds.length; i++) {
            StrategyStatus status = _strategies[_strategyIds[i]].status;
            if (status == StrategyStatus.Proposed || status == StrategyStatus.Approved) {
                active[idx++] = _strategyIds[i];
            }
        }
        return active;
    }

    // ─── Internal ────────────────────────────────────────────────────────

    function _getExistingStrategy(bytes32 strategyId) private view returns (Strategy storage) {
        Strategy storage s = _strategies[strategyId];
        if (s.proposedAt == 0) revert StrategyNotFound();
        return s;
    }
}
