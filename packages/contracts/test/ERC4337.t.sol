// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SmartAccountFactory} from "../src/SmartAccountFactory.sol";
import {SessionKeyModule} from "../src/SessionKeyModule.sol";

contract ERC4337Test is Test {
    SmartAccountFactory public factory;
    SessionKeyModule public sessionModule;
    address public owner;
    address public alice;
    address public executor;
    address public uniswapRouter;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        executor = makeAddr("executor");
        uniswapRouter = makeAddr("uniswapRouter");

        factory = new SmartAccountFactory();
        sessionModule = new SessionKeyModule();
    }

    // ============ SmartAccountFactory: createAccount ============

    function test_CreateAccount_Deterministic_ReturnsCorrectAddress() public {
        address predicted = factory.getAddress(alice, 1);
        address actual = factory.createAccount(alice, 1);

        assertEq(predicted, actual);
        assertNotEq(actual, address(0));
    }

    function test_CreateAccount_DifferentSalts_DifferentAddresses() public {
        address acc1 = factory.createAccount(alice, 1);
        address acc2 = factory.createAccount(alice, 2);

        assertNotEq(acc1, acc2);
    }

    function test_CreateAccount_DifferentOwners_DifferentAddresses() public {
        address acc1 = factory.createAccount(alice, 1);
        address acc2 = factory.createAccount(owner, 1);

        assertNotEq(acc1, acc2);
    }

    function test_CreateAccount_SameParams_ReturnsSameAddress() public {
        address acc1 = factory.createAccount(alice, 1);
        address acc2 = factory.createAccount(alice, 1);

        assertEq(acc1, acc2);
    }

    function test_CreateAccount_EmitsEvent() public {
        address predicted = factory.getAddress(alice, 1);

        vm.expectEmit(true, true, false, false);
        emit SmartAccountFactory.AccountCreated(predicted, alice);

        factory.createAccount(alice, 1);
    }

    // ============ SessionKeyModule: grantSessionKey ============

    function test_GrantSessionKey_Owner_Succeeds() public {
        address[] memory targets = new address[](1);
        targets[0] = uniswapRouter;

        SessionKeyModule.SessionPermissions memory perms = SessionKeyModule.SessionPermissions({
            maxSpendPerTx: 500e6,
            maxTotalSpend: 2000e6,
            allowedTargets: targets,
            validUntil: block.timestamp + 7 days,
            validAfter: block.timestamp,
            totalSpent: 0
        });

        vm.expectEmit(true, false, false, true);
        emit SessionKeyModule.SessionKeyGranted(executor, block.timestamp + 7 days);

        sessionModule.grantSessionKey(executor, perms);

        assertTrue(sessionModule.isValidSessionKey(executor));
    }

    function test_GrantSessionKey_NotOwner_Reverts() public {
        address[] memory targets = new address[](1);
        targets[0] = uniswapRouter;

        SessionKeyModule.SessionPermissions memory perms = SessionKeyModule.SessionPermissions({
            maxSpendPerTx: 500e6,
            maxTotalSpend: 2000e6,
            allowedTargets: targets,
            validUntil: block.timestamp + 7 days,
            validAfter: block.timestamp,
            totalSpent: 0
        });

        vm.prank(alice);
        vm.expectRevert();
        sessionModule.grantSessionKey(executor, perms);
    }

    // ============ SessionKeyModule: revokeSessionKey ============

    function test_RevokeSessionKey_Granted_Succeeds() public {
        _grantDefaultKey();

        vm.expectEmit(true, false, false, false);
        emit SessionKeyModule.SessionKeyRevoked(executor);

        sessionModule.revokeSessionKey(executor);

        assertFalse(sessionModule.isValidSessionKey(executor));
    }

    function test_RevokeSessionKey_NotGranted_Reverts() public {
        vm.expectRevert(SessionKeyModule.SessionKeyNotFound.selector);
        sessionModule.revokeSessionKey(executor);
    }

    function test_RevokeSessionKey_NotOwner_Reverts() public {
        _grantDefaultKey();

        vm.prank(alice);
        vm.expectRevert();
        sessionModule.revokeSessionKey(executor);
    }

    // ============ SessionKeyModule: validateSessionOp ============

    function test_ValidateSessionOp_WithinLimits_ReturnsTrue() public {
        _grantDefaultKey();

        bool valid = sessionModule.validateSessionOp(executor, uniswapRouter, 100e6);
        assertTrue(valid);
    }

    function test_ValidateSessionOp_ExceedsPerTx_Reverts() public {
        _grantDefaultKey();

        vm.expectRevert(abi.encodeWithSelector(SessionKeyModule.SpendLimitExceeded.selector, 600e6, 500e6));
        sessionModule.validateSessionOp(executor, uniswapRouter, 600e6);
    }

    function test_ValidateSessionOp_ExceedsTotalSpend_Reverts() public {
        _grantDefaultKey();

        // Spend up to limit
        sessionModule.validateSessionOp(executor, uniswapRouter, 500e6);
        sessionModule.validateSessionOp(executor, uniswapRouter, 500e6);
        sessionModule.validateSessionOp(executor, uniswapRouter, 500e6);
        sessionModule.validateSessionOp(executor, uniswapRouter, 500e6);

        // Next should exceed total
        vm.expectRevert();
        sessionModule.validateSessionOp(executor, uniswapRouter, 500e6);
    }

    function test_ValidateSessionOp_DisallowedTarget_Reverts() public {
        _grantDefaultKey();
        address randomTarget = makeAddr("random");

        vm.expectRevert(abi.encodeWithSelector(SessionKeyModule.TargetNotAllowed.selector, randomTarget));
        sessionModule.validateSessionOp(executor, randomTarget, 100e6);
    }

    function test_ValidateSessionOp_Expired_Reverts() public {
        _grantDefaultKey();

        // Warp past validUntil
        vm.warp(block.timestamp + 8 days);

        vm.expectRevert(SessionKeyModule.SessionExpired.selector);
        sessionModule.validateSessionOp(executor, uniswapRouter, 100e6);
    }

    function test_ValidateSessionOp_NotStarted_Reverts() public {
        address[] memory targets = new address[](1);
        targets[0] = uniswapRouter;

        SessionKeyModule.SessionPermissions memory perms = SessionKeyModule.SessionPermissions({
            maxSpendPerTx: 500e6,
            maxTotalSpend: 2000e6,
            allowedTargets: targets,
            validUntil: block.timestamp + 14 days,
            validAfter: block.timestamp + 7 days,
            totalSpent: 0
        });

        sessionModule.grantSessionKey(executor, perms);

        vm.expectRevert(SessionKeyModule.SessionNotStarted.selector);
        sessionModule.validateSessionOp(executor, uniswapRouter, 100e6);
    }

    function test_ValidateSessionOp_EmitsEvent() public {
        _grantDefaultKey();

        vm.expectEmit(true, false, false, true);
        emit SessionKeyModule.SessionKeyUsed(executor, uniswapRouter, 100e6);

        sessionModule.validateSessionOp(executor, uniswapRouter, 100e6);
    }

    // ============ SessionKeyModule: getSessionKey ============

    function test_GetSessionKey_Granted_ReturnsPerms() public {
        _grantDefaultKey();

        SessionKeyModule.SessionPermissions memory perms = sessionModule.getSessionKey(executor);
        assertEq(perms.maxSpendPerTx, 500e6);
        assertEq(perms.maxTotalSpend, 2000e6);
        assertEq(perms.allowedTargets.length, 1);
        assertEq(perms.allowedTargets[0], uniswapRouter);
    }

    function test_GetSessionKey_NotGranted_Reverts() public {
        vm.expectRevert(SessionKeyModule.SessionKeyNotFound.selector);
        sessionModule.getSessionKey(executor);
    }

    // ============ SessionKeyModule: isValidSessionKey ============

    function test_IsValidSessionKey_ActiveKey_ReturnsTrue() public {
        _grantDefaultKey();
        assertTrue(sessionModule.isValidSessionKey(executor));
    }

    function test_IsValidSessionKey_ExpiredKey_ReturnsFalse() public {
        _grantDefaultKey();
        vm.warp(block.timestamp + 8 days);
        assertFalse(sessionModule.isValidSessionKey(executor));
    }

    function test_IsValidSessionKey_RevokedKey_ReturnsFalse() public {
        _grantDefaultKey();
        sessionModule.revokeSessionKey(executor);
        assertFalse(sessionModule.isValidSessionKey(executor));
    }

    function test_IsValidSessionKey_NonExistentKey_ReturnsFalse() public view {
        assertFalse(sessionModule.isValidSessionKey(executor));
    }

    // ============ Fuzz tests ============

    function test_ValidateSessionOp_FuzzSpend(uint256 amount) public {
        _grantDefaultKey();
        vm.assume(amount > 0 && amount <= 500e6);

        bool valid = sessionModule.validateSessionOp(executor, uniswapRouter, amount);
        assertTrue(valid);
    }

    // ============ Helpers ============

    function _grantDefaultKey() internal {
        address[] memory targets = new address[](1);
        targets[0] = uniswapRouter;

        SessionKeyModule.SessionPermissions memory perms = SessionKeyModule.SessionPermissions({
            maxSpendPerTx: 500e6,
            maxTotalSpend: 2000e6,
            allowedTargets: targets,
            validUntil: block.timestamp + 7 days,
            validAfter: block.timestamp,
            totalSpent: 0
        });

        sessionModule.grantSessionKey(executor, perms);
    }
}
