// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SessionKeyModule is Ownable {
    struct SessionPermissions {
        uint256 maxSpendPerTx;
        uint256 maxTotalSpend;
        address[] allowedTargets;
        uint256 validUntil;
        uint256 validAfter;
        uint256 totalSpent;
    }

    error SessionExpired();
    error SessionNotStarted();
    error SpendLimitExceeded(uint256 attempted, uint256 limit);
    error TargetNotAllowed(address target);
    error SessionKeyNotFound();

    event SessionKeyGranted(address indexed key, uint256 validUntil);
    event SessionKeyRevoked(address indexed key);
    event SessionKeyUsed(address indexed key, address target, uint256 value);

    mapping(address => SessionPermissions) private _sessions;
    mapping(address => bool) private _exists;
    mapping(address => mapping(address => bool)) private _allowedTarget;

    constructor() Ownable(msg.sender) {}

    // ─── Management ──────────────────────────────────────────────────────

    function grantSessionKey(address key, SessionPermissions calldata perms) external {
        SessionPermissions storage s = _sessions[key];
        s.maxSpendPerTx = perms.maxSpendPerTx;
        s.maxTotalSpend = perms.maxTotalSpend;
        s.validUntil = perms.validUntil;
        s.validAfter = perms.validAfter;
        s.totalSpent = 0;

        delete s.allowedTargets;
        for (uint256 i; i < perms.allowedTargets.length; i++) {
            s.allowedTargets.push(perms.allowedTargets[i]);
            _allowedTarget[key][perms.allowedTargets[i]] = true;
        }

        _exists[key] = true;

        emit SessionKeyGranted(key, perms.validUntil);
    }

    function revokeSessionKey(address key) external {
        if (!_exists[key]) revert SessionKeyNotFound();

        address[] storage targets = _sessions[key].allowedTargets;
        for (uint256 i; i < targets.length; i++) {
            _allowedTarget[key][targets[i]] = false;
        }

        delete _sessions[key];
        _exists[key] = false;

        emit SessionKeyRevoked(key);
    }

    // ─── Validation ──────────────────────────────────────────────────────

    function validateSessionOp(address key, address target, uint256 value) external returns (bool) {
        if (!_exists[key]) revert SessionKeyNotFound();

        SessionPermissions storage s = _sessions[key];

        if (block.timestamp >= s.validUntil) revert SessionExpired();
        if (block.timestamp < s.validAfter) revert SessionNotStarted();
        if (!_allowedTarget[key][target]) revert TargetNotAllowed(target);
        if (value > s.maxSpendPerTx) revert SpendLimitExceeded(value, s.maxSpendPerTx);
        if (s.totalSpent + value > s.maxTotalSpend) revert SpendLimitExceeded(value, s.maxTotalSpend - s.totalSpent);

        s.totalSpent += value;

        emit SessionKeyUsed(key, target, value);
        return true;
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    function getSessionKey(address key) external view returns (SessionPermissions memory) {
        if (!_exists[key]) revert SessionKeyNotFound();
        return _sessions[key];
    }

    function isValidSessionKey(address key) external view returns (bool) {
        if (!_exists[key]) return false;
        SessionPermissions storage s = _sessions[key];
        if (block.timestamp >= s.validUntil) return false;
        if (block.timestamp < s.validAfter) return false;
        return true;
    }
}
