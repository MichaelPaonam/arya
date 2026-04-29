// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {YieldSwarmRegistry} from "../src/YieldSwarmRegistry.sol";
import {IntelligentData} from "../src/interfaces/IERC7857Metadata.sol";

contract YieldSwarmRegistryTest is Test {
    YieldSwarmRegistry public registry;
    address public owner;
    address public alice;
    address public bob;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        registry = new YieldSwarmRegistry();
    }

    // ============ registerAgent ============

    function test_RegisterAgent_ValidScout_MintsAndEmits() public {
        vm.expectEmit(true, false, true, true);
        emit YieldSwarmRegistry.AgentRegistered(1, "scout", alice);

        uint256 tokenId = registry.registerAgent("scout", "ipfs://metadata1", alice);

        assertEq(tokenId, 1);
        assertEq(registry.ownerOf(tokenId), owner);
    }

    function test_RegisterAgent_AllTypesForUser_Succeeds() public {
        string[4] memory types = ["scout", "risk", "executor", "orchestrator"];
        for (uint256 i = 0; i < types.length; i++) {
            uint256 tokenId = registry.registerAgent(types[i], "ipfs://meta", alice);
            assertEq(tokenId, i + 1);
        }
    }

    function test_RegisterAgent_InvalidType_Reverts() public {
        vm.expectRevert(YieldSwarmRegistry.InvalidAgentType.selector);
        registry.registerAgent("invalid", "ipfs://meta", alice);
    }

    function test_RegisterAgent_NotOwner_Reverts() public {
        vm.prank(alice);
        vm.expectRevert();
        registry.registerAgent("scout", "ipfs://meta", alice);
    }

    function test_RegisterAgent_EmptyMetadataURI_Succeeds() public {
        uint256 tokenId = registry.registerAgent("scout", "", alice);
        assertEq(tokenId, 1);
    }

    function test_RegisterAgent_MultipleUsersHaveSeparateSwarms() public {
        registry.registerAgent("scout", "ipfs://1", alice);
        registry.registerAgent("risk", "ipfs://2", alice);
        registry.registerAgent("scout", "ipfs://3", bob);

        YieldSwarmRegistry.AgentInfo[] memory aliceSwarm = registry.getSwarmMembers(alice);
        YieldSwarmRegistry.AgentInfo[] memory bobSwarm = registry.getSwarmMembers(bob);

        assertEq(aliceSwarm.length, 2);
        assertEq(bobSwarm.length, 1);
        assertEq(aliceSwarm[0].agentType, "scout");
        assertEq(aliceSwarm[1].agentType, "risk");
        assertEq(bobSwarm[0].agentType, "scout");
    }

    function test_RegisterAgent_UserFieldStoredCorrectly() public {
        uint256 tokenId = registry.registerAgent("executor", "ipfs://exec", alice);

        YieldSwarmRegistry.AgentInfo memory info = registry.getAgent(tokenId);
        assertEq(info.user, alice);
    }

    // ============ getAgent ============

    function test_GetAgent_Registered_ReturnsInfo() public {
        uint256 tokenId = registry.registerAgent("risk", "ipfs://risk-meta", alice);

        YieldSwarmRegistry.AgentInfo memory info = registry.getAgent(tokenId);

        assertEq(info.tokenId, tokenId);
        assertEq(info.agentType, "risk");
        assertEq(info.metadataURI, "ipfs://risk-meta");
        assertEq(info.user, alice);
        assertGt(info.registeredAt, 0);
    }

    function test_GetAgent_NotExists_Reverts() public {
        vm.expectRevert(YieldSwarmRegistry.AgentNotFound.selector);
        registry.getAgent(999);
    }

    // ============ getSwarmMembers (per-user) ============

    function test_GetSwarmMembers_UserWithAgents_ReturnsOnlyTheirs() public {
        registry.registerAgent("scout", "ipfs://1", alice);
        registry.registerAgent("risk", "ipfs://2", alice);
        registry.registerAgent("executor", "ipfs://3", alice);
        registry.registerAgent("scout", "ipfs://4", bob);

        YieldSwarmRegistry.AgentInfo[] memory members = registry.getSwarmMembers(alice);

        assertEq(members.length, 3);
        assertEq(members[0].agentType, "scout");
        assertEq(members[1].agentType, "risk");
        assertEq(members[2].agentType, "executor");
    }

    function test_GetSwarmMembers_NoAgents_ReturnsEmptyArray() public view {
        YieldSwarmRegistry.AgentInfo[] memory members = registry.getSwarmMembers(alice);
        assertEq(members.length, 0);
    }

    function test_GetSwarmMembers_ZeroAddress_ReturnsEmpty() public view {
        YieldSwarmRegistry.AgentInfo[] memory members = registry.getSwarmMembers(address(0));
        assertEq(members.length, 0);
    }

    // ============ recordDecision ============

    function test_RecordDecision_ValidAgent_EmitsEvent() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);
        bytes32 strategyHash = keccak256("strategy-1");

        vm.expectEmit(true, false, false, true);
        emit YieldSwarmRegistry.DecisionRecorded(tokenId, strategyHash, block.timestamp);

        registry.recordDecision(tokenId, strategyHash, "buy ETH/USDC pool");
    }

    function test_RecordDecision_NonExistentAgent_Reverts() public {
        vm.expectRevert(YieldSwarmRegistry.AgentNotFound.selector);
        registry.recordDecision(999, keccak256("x"), "rec");
    }

    function test_RecordDecision_NotOwner_Reverts() public {
        registry.registerAgent("scout", "ipfs://meta", alice);
        vm.prank(alice);
        vm.expectRevert();
        registry.recordDecision(1, keccak256("x"), "rec");
    }

    // ============ intelligentDatasOf (ERC-7857 Metadata) ============

    function test_IntelligentDatasOf_RegisteredAgent_ReturnsData() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://scout-meta", alice);

        IntelligentData[] memory data = registry.intelligentDatasOf(tokenId);

        assertGt(data.length, 0);
        assertGt(bytes(data[0].dataDescription).length, 0);
        assertNotEq(data[0].dataHash, bytes32(0));
    }

    function test_IntelligentDatasOf_NonExistent_Reverts() public {
        vm.expectRevert(YieldSwarmRegistry.AgentNotFound.selector);
        registry.intelligentDatasOf(999);
    }

    // ============ delegateAccess ============

    function test_DelegateAccess_Owner_Succeeds() public {
        registry.registerAgent("scout", "ipfs://meta", alice);

        registry.delegateAccess(alice);

        assertEq(registry.getDelegateAccess(owner), alice);
    }

    function test_DelegateAccess_ZeroAddress_Reverts() public {
        registry.registerAgent("scout", "ipfs://meta", alice);
        vm.expectRevert();
        registry.delegateAccess(address(0));
    }

    // ============ authorizeUsage (ERC-7857 Authorize) ============

    function test_AuthorizeUsage_Owner_GrantsAccess() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);

        registry.authorizeUsage(tokenId, alice);

        address[] memory users = registry.authorizedUsersOf(tokenId);
        assertEq(users.length, 1);
        assertEq(users[0], alice);
    }

    function test_AuthorizeUsage_MultipleUsers_AllGranted() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);

        registry.authorizeUsage(tokenId, alice);
        registry.authorizeUsage(tokenId, bob);

        address[] memory users = registry.authorizedUsersOf(tokenId);
        assertEq(users.length, 2);
    }

    function test_AuthorizeUsage_DuplicateUser_Reverts() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);
        registry.authorizeUsage(tokenId, alice);

        vm.expectRevert();
        registry.authorizeUsage(tokenId, alice);
    }

    function test_AuthorizeUsage_NotContractOwner_Reverts() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);

        vm.prank(alice);
        vm.expectRevert(YieldSwarmRegistry.NotAgentOwner.selector);
        registry.authorizeUsage(tokenId, bob);
    }

    // ============ revokeAuthorization ============

    function test_RevokeAuthorization_AuthorizedUser_Succeeds() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);
        registry.authorizeUsage(tokenId, alice);

        registry.revokeAuthorization(tokenId, alice);

        address[] memory users = registry.authorizedUsersOf(tokenId);
        assertEq(users.length, 0);
    }

    function test_RevokeAuthorization_NotAuthorized_Reverts() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);

        vm.expectRevert();
        registry.revokeAuthorization(tokenId, alice);
    }

    function test_RevokeAuthorization_NotContractOwner_Reverts() public {
        uint256 tokenId = registry.registerAgent("scout", "ipfs://meta", alice);
        registry.authorizeUsage(tokenId, alice);

        vm.prank(bob);
        vm.expectRevert(YieldSwarmRegistry.NotAgentOwner.selector);
        registry.revokeAuthorization(tokenId, alice);
    }

    // ============ ERC-721 base ============

    function test_SupportsInterface_ERC721_ReturnsTrue() public view {
        assertTrue(registry.supportsInterface(0x80ac58cd)); // ERC-721
    }

    function test_Name_ReturnsCorrect() public view {
        assertEq(registry.name(), "ARYA Swarm Agent");
    }

    function test_Symbol_ReturnsCorrect() public view {
        assertEq(registry.symbol(), "ARYA");
    }
}
