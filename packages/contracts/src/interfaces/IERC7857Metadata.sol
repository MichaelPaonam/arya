// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

struct IntelligentData {
    string dataDescription;
    bytes32 dataHash;
}

interface IERC7857Metadata {
    function intelligentDatasOf(uint256 tokenId) external view returns (IntelligentData[] memory);
}
