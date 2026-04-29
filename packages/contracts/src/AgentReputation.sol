// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

contract AgentReputation is Ownable {
    enum Tier { Bronze, Silver, Gold, Platinum }

    struct SwarmScore {
        address user;
        uint256 totalStrategies;
        uint256 winCount;
        uint256 cumulativeProfit;
        uint256 lastUpdated;
        uint256 lastActiveTimestamp;
    }

    error UserNotRegistered();
    error OnlyOrchestrator();

    event OutcomeRecorded(address indexed user, bytes32 indexed strategyId, bool win);
    event TierPromoted(address indexed user, Tier newTier);

    uint256 private constant ACTIVE_THRESHOLD = 7 days;
    uint256 private constant MIN_LEADERBOARD_STRATEGIES = 20;

    address public orchestrator;
    IAgentRegistry public registry;

    mapping(address => SwarmScore) private _scores;
    address[] private _users;
    mapping(address => bool) private _hasScore;

    constructor() Ownable(msg.sender) {}

    // ─── Configuration ───────────────────────────────────────────────────

    function setRegistry(address registry_) external onlyOwner {
        registry = IAgentRegistry(registry_);
    }

    function setOrchestrator(address orchestrator_) external onlyOwner {
        orchestrator = orchestrator_;
    }

    // ─── Core ────────────────────────────────────────────────────────────

    function recordOutcome(
        address user,
        bytes32 strategyId,
        uint256 predictedReturnBps,
        uint256 actualReturnBps
    ) external {
        if (msg.sender != orchestrator) revert OnlyOrchestrator();
        if (!_isRegisteredUser(user)) revert UserNotRegistered();

        Tier tierBefore = _computeTier(user);

        bool win = actualReturnBps >= (predictedReturnBps * 90) / 100;

        SwarmScore storage score = _scores[user];
        if (!_hasScore[user]) {
            score.user = user;
            _users.push(user);
            _hasScore[user] = true;
        }

        score.totalStrategies++;
        if (win) score.winCount++;
        if (actualReturnBps > predictedReturnBps) {
            score.cumulativeProfit += actualReturnBps - predictedReturnBps;
        }
        score.lastUpdated = block.timestamp;
        score.lastActiveTimestamp = block.timestamp;

        emit OutcomeRecorded(user, strategyId, win);

        Tier tierAfter = _computeTier(user);
        if (tierAfter > tierBefore) {
            emit TierPromoted(user, tierAfter);
        }
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    function getReputation(address user) external view returns (SwarmScore memory) {
        if (!_isRegisteredUser(user)) revert UserNotRegistered();
        return _scores[user];
    }

    function getTier(address user) external view returns (Tier) {
        return _computeTier(user);
    }

    function isActive(address user) external view returns (bool) {
        uint256 lastActive = _scores[user].lastActiveTimestamp;
        if (lastActive == 0) return false;
        return (block.timestamp - lastActive) <= ACTIVE_THRESHOLD;
    }

    function staleDays(address user) external view returns (uint256) {
        uint256 lastActive = _scores[user].lastActiveTimestamp;
        if (lastActive == 0) return type(uint256).max;
        return (block.timestamp - lastActive) / 1 days;
    }

    function getLeaderboard(uint256 limit) external view returns (SwarmScore[] memory) {
        uint256 eligibleCount;
        for (uint256 i; i < _users.length; i++) {
            if (_scores[_users[i]].totalStrategies >= MIN_LEADERBOARD_STRATEGIES) {
                eligibleCount++;
            }
        }

        SwarmScore[] memory eligible = new SwarmScore[](eligibleCount);
        uint256 idx;
        for (uint256 i; i < _users.length; i++) {
            if (_scores[_users[i]].totalStrategies >= MIN_LEADERBOARD_STRATEGIES) {
                eligible[idx++] = _scores[_users[i]];
            }
        }

        _sortByWinRate(eligible);

        uint256 resultLength = limit < eligible.length ? limit : eligible.length;
        SwarmScore[] memory result = new SwarmScore[](resultLength);
        for (uint256 i; i < resultLength; i++) {
            result[i] = eligible[i];
        }
        return result;
    }

    // ─── Internal ────────────────────────────────────────────────────────

    function _isRegisteredUser(address user) private view returns (bool) {
        return registry.getSwarmMembers(user).length > 0;
    }

    function _computeTier(address user) private view returns (Tier) {
        SwarmScore storage score = _scores[user];
        if (score.totalStrategies == 0) return Tier.Bronze;

        uint256 winRate = (score.winCount * 100) / score.totalStrategies;

        if (winRate > 90 && score.totalStrategies >= 200) return Tier.Platinum;
        if (winRate > 80 && score.totalStrategies >= 150) return Tier.Gold;
        if (winRate > 70 && score.totalStrategies >= 100) return Tier.Silver;
        return Tier.Bronze;
    }

    function _sortByWinRate(SwarmScore[] memory arr) private pure {
        if (arr.length <= 1) return;
        _quickSort(arr, 0, int256(arr.length - 1));
    }

    function _quickSort(SwarmScore[] memory arr, int256 left, int256 right) private pure {
        if (left >= right) return;

        uint256 pivotRate = _winRate(arr[uint256((left + right) / 2)]);
        int256 i = left;
        int256 j = right;

        while (i <= j) {
            while (_winRate(arr[uint256(i)]) > pivotRate) i++;
            while (_winRate(arr[uint256(j)]) < pivotRate) j--;
            if (i <= j) {
                SwarmScore memory temp = arr[uint256(i)];
                arr[uint256(i)] = arr[uint256(j)];
                arr[uint256(j)] = temp;
                i++;
                j--;
            }
        }

        if (left < j) _quickSort(arr, left, j);
        if (i < right) _quickSort(arr, i, right);
    }

    function _winRate(SwarmScore memory score) private pure returns (uint256) {
        return (score.winCount * 10000) / score.totalStrategies;
    }
}
