// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SessionKeyModule} from "./SessionKeyModule.sol";

contract SmartAccount {
    address public owner;
    address public sessionModule;

    error NotOwnerOrSessionKey();
    error ExecutionFailed(uint256 index);

    event Executed(address indexed target, uint256 value, bytes data);

    constructor(address owner_) {
        owner = owner_;
    }

    function setSessionModule(address module) external {
        require(msg.sender == owner, "Not owner");
        sessionModule = module;
    }

    function execute(address target, uint256 value, bytes calldata data) external returns (bytes memory) {
        if (msg.sender == owner) {
            // Owner can execute anything
        } else if (sessionModule != address(0)) {
            SessionKeyModule(sessionModule).validateSessionOp(msg.sender, target, value);
        } else {
            revert NotOwnerOrSessionKey();
        }

        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) revert ExecutionFailed(0);

        emit Executed(target, value, data);
        return result;
    }

    receive() external payable {}
}

contract SmartAccountFactory {
    event AccountCreated(address indexed account, address indexed owner);

    mapping(address => bool) private _deployed;

    function createAccount(address owner, uint256 salt) external returns (address) {
        bytes32 combinedSalt = keccak256(abi.encodePacked(owner, salt));
        address existing = _computeAddress(owner, combinedSalt);

        if (_deployed[existing]) return existing;

        SmartAccount account = new SmartAccount{salt: combinedSalt}(owner);
        _deployed[address(account)] = true;

        emit AccountCreated(address(account), owner);
        return address(account);
    }

    function getAddress(address owner, uint256 salt) external view returns (address) {
        bytes32 combinedSalt = keccak256(abi.encodePacked(owner, salt));
        return _computeAddress(owner, combinedSalt);
    }

    function _computeAddress(address owner, bytes32 combinedSalt) private view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SmartAccount).creationCode,
            abi.encode(owner)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), combinedSalt, keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
