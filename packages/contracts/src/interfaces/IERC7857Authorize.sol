// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC7857Authorize {
    event Authorization(address indexed authorizer, address indexed authorized, uint256 indexed tokenId);
    event AuthorizationRevoked(address indexed revoker, address indexed revoked, uint256 indexed tokenId);

    error AlreadyAuthorized();
    error NotAuthorized();

    function authorizeUsage(uint256 tokenId, address user) external;
    function revokeAuthorization(uint256 tokenId, address user) external;
    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory);
}
