// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {
    struct AgentInfo {
        uint256 tokenId;
        string agentType;
        string metadataURI;
        uint256 registeredAt;
        address user;
    }

    function registerAgent(string calldata agentType, string calldata metadataURI, address user) external returns (uint256);
    function getAgent(uint256 tokenId) external view returns (AgentInfo memory);
    function getSwarmMembers(address user) external view returns (AgentInfo[] memory);
    function recordDecision(uint256 agentId, bytes32 strategyHash, string calldata recommendation) external;
}
