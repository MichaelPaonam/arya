// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC7857Metadata, IntelligentData} from "./interfaces/IERC7857Metadata.sol";
import {IERC7857Authorize} from "./interfaces/IERC7857Authorize.sol";
import {IAgentRegistry} from "./interfaces/IAgentRegistry.sol";

contract YieldSwarmRegistry is ERC721, Ownable, IERC7857Metadata, IERC7857Authorize, IAgentRegistry {
    struct Decision {
        uint256 agentId;
        bytes32 strategyHash;
        string recommendation;
        uint256 timestamp;
    }

    error InvalidAgentType();
    error AgentNotFound();
    error NotAgentOwner();
    error InvalidDelegate();
    error SwarmAlreadyProvisioned();

    event AgentRegistered(uint256 indexed tokenId, string agentType, address indexed user);
    event DecisionRecorded(uint256 indexed agentId, bytes32 strategyHash, uint256 timestamp);

    uint256 private _nextTokenId;

    mapping(uint256 => AgentInfo) private _agents;
    mapping(address => uint256[]) private _userAgents;
    mapping(address => address) private _delegates;
    mapping(uint256 => address[]) private _authorizedUsers;
    mapping(uint256 => mapping(address => bool)) private _hasAuthorization;

    constructor() ERC721("ARYA Swarm Agent", "ARYA") Ownable(msg.sender) {}

    // ─── Registration ────────────────────────────────────────────────────

    function registerAgent(
        string calldata agentType,
        string calldata metadataURI,
        address user
    ) external onlyOwner returns (uint256) {
        if (!_isValidAgentType(agentType)) revert InvalidAgentType();

        uint256 tokenId = ++_nextTokenId;
        _mint(msg.sender, tokenId);

        _agents[tokenId] = AgentInfo({
            tokenId: tokenId,
            agentType: agentType,
            metadataURI: metadataURI,
            registeredAt: block.timestamp,
            user: user
        });
        _userAgents[user].push(tokenId);

        emit AgentRegistered(tokenId, agentType, user);
        return tokenId;
    }

    function requestSwarm() external returns (uint256[4] memory tokenIds) {
        if (_userAgents[msg.sender].length > 0) revert SwarmAlreadyProvisioned();

        string[4] memory types = ["scout", "risk", "orchestrator", "executor"];

        for (uint256 i; i < 4; i++) {
            uint256 tokenId = ++_nextTokenId;
            _mint(owner(), tokenId);

            _agents[tokenId] = AgentInfo({
                tokenId: tokenId,
                agentType: types[i],
                metadataURI: "",
                registeredAt: block.timestamp,
                user: msg.sender
            });
            _userAgents[msg.sender].push(tokenId);
            tokenIds[i] = tokenId;

            _authorizedUsers[tokenId].push(msg.sender);
            _hasAuthorization[tokenId][msg.sender] = true;

            emit AgentRegistered(tokenId, types[i], msg.sender);
            emit Authorization(owner(), msg.sender, tokenId);
        }
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    function getAgent(uint256 tokenId) external view returns (AgentInfo memory) {
        if (_agents[tokenId].registeredAt == 0) revert AgentNotFound();
        return _agents[tokenId];
    }

    function getSwarmMembers(address user) external view returns (AgentInfo[] memory) {
        uint256[] storage tokenIds = _userAgents[user];
        AgentInfo[] memory members = new AgentInfo[](tokenIds.length);
        for (uint256 i; i < tokenIds.length; i++) {
            members[i] = _agents[tokenIds[i]];
        }
        return members;
    }

    // ─── Decision Audit Trail ────────────────────────────────────────────

    function recordDecision(
        uint256 agentId,
        bytes32 strategyHash,
        string calldata recommendation
    ) external onlyOwner {
        if (_agents[agentId].registeredAt == 0) revert AgentNotFound();
        emit DecisionRecorded(agentId, strategyHash, block.timestamp);
    }

    // ─── ERC-7857 Metadata ───────────────────────────────────────────────

    function intelligentDatasOf(uint256 tokenId) external view override returns (IntelligentData[] memory) {
        if (_agents[tokenId].registeredAt == 0) revert AgentNotFound();

        AgentInfo storage agent = _agents[tokenId];
        IntelligentData[] memory data = new IntelligentData[](1);
        data[0] = IntelligentData({
            dataDescription: string.concat("ARYA ", agent.agentType, " agent intelligence"),
            dataHash: keccak256(abi.encodePacked(agent.metadataURI, agent.registeredAt))
        });
        return data;
    }

    // ─── Delegation ──────────────────────────────────────────────────────

    function delegateAccess(address assistant) external {
        if (assistant == address(0)) revert InvalidDelegate();
        _delegates[msg.sender] = assistant;
    }

    function getDelegateAccess(address user) external view returns (address) {
        return _delegates[user];
    }

    // ─── ERC-7857 Authorization ──────────────────────────────────────────

    function authorizeUsage(uint256 tokenId, address user) external override {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner();
        if (_hasAuthorization[tokenId][user]) revert AlreadyAuthorized();

        _authorizedUsers[tokenId].push(user);
        _hasAuthorization[tokenId][user] = true;

        emit Authorization(msg.sender, user, tokenId);
    }

    function revokeAuthorization(uint256 tokenId, address user) external override {
        if (ownerOf(tokenId) != msg.sender) revert NotAgentOwner();
        if (!_hasAuthorization[tokenId][user]) revert NotAuthorized();

        _hasAuthorization[tokenId][user] = false;
        _removeFromAuthorizedList(tokenId, user);

        emit AuthorizationRevoked(msg.sender, user, tokenId);
    }

    function authorizedUsersOf(uint256 tokenId) external view override returns (address[] memory) {
        return _authorizedUsers[tokenId];
    }

    // ─── Internal ────────────────────────────────────────────────────────

    function _isValidAgentType(string calldata agentType) private pure returns (bool) {
        bytes32 typeHash = keccak256(bytes(agentType));
        return typeHash == keccak256("scout")
            || typeHash == keccak256("risk")
            || typeHash == keccak256("executor")
            || typeHash == keccak256("orchestrator");
    }

    function _removeFromAuthorizedList(uint256 tokenId, address user) private {
        address[] storage users = _authorizedUsers[tokenId];
        for (uint256 i; i < users.length; i++) {
            if (users[i] == user) {
                users[i] = users[users.length - 1];
                users.pop();
                return;
            }
        }
    }
}
