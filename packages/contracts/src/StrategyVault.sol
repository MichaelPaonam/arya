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
    error NotRegisteredAgent();

    event StrategyProposed(bytes32 indexed strategyId, uint256 estimatedAPY, uint8 riskScore);
    event StrategyApproved(bytes32 indexed strategyId, address approver);
    event StrategyExecuted(bytes32 indexed strategyId);
    event StrategyRejected(bytes32 indexed strategyId, string reason);

    function proposeStrategy(
        bytes32 strategyId,
        SwapAction[] calldata actions,
        uint256 estimatedAPY,
        uint8 riskScore
    ) external {}

    function approveStrategy(bytes32 strategyId) external {}
    function rejectStrategy(bytes32 strategyId, string calldata reason) external {}
    function executeStrategy(bytes32 strategyId) external {}
    function setRiskThreshold(uint8 maxRisk) external {}
    function setRegistry(address registry) external {}
    function getStrategy(bytes32 strategyId) external view returns (Strategy memory) {}
    function getActiveStrategies() external view returns (bytes32[] memory) {}
    function riskThreshold() external view returns (uint8) {}

    constructor() Ownable(msg.sender) {}
}
