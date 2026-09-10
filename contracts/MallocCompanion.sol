// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MallocCompanion
/// @notice One account-bound market companion per wallet.
contract MallocCompanion {
    string public constant name = "malloc companions";
    string public constant symbol = "MALLOC";

    address public owner;
    string public baseURI;
    uint256 public totalSupply;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _balanceOf;
    mapping(address => bool) public hasAdopted;
    mapping(uint256 => uint8) public temperament;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event CompanionAdopted(address indexed keeper, uint256 indexed tokenId, uint8 temperament);
    event BaseURIUpdated(string newBaseURI);

    error AlreadyAdopted();
    error InvalidTemperament();
    error NonTransferable();
    error NotAuthorized();
    error InvalidAddress();
    error TokenDoesNotExist();

    constructor(string memory initialBaseURI) {
        owner = msg.sender;
        baseURI = initialBaseURI;
    }

    function adopt(uint8 selectedTemperament) external returns (uint256 tokenId) {
        if (hasAdopted[msg.sender]) revert AlreadyAdopted();
        if (selectedTemperament > 3) revert InvalidTemperament();

        tokenId = ++totalSupply;
        hasAdopted[msg.sender] = true;
        _ownerOf[tokenId] = msg.sender;
        _balanceOf[msg.sender] = 1;
        temperament[tokenId] = selectedTemperament;

        emit Transfer(address(0), msg.sender, tokenId);
        emit CompanionAdopted(msg.sender, tokenId, selectedTemperament);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        address keeper = _ownerOf[tokenId];
        if (keeper == address(0)) revert TokenDoesNotExist();
        return keeper;
    }

    function balanceOf(address keeper) external view returns (uint256) {
        if (keeper == address(0)) revert InvalidAddress();
        return _balanceOf[keeper];
    }

    function tokenURI(uint256 tokenId) external view returns (string memory) {
        if (_ownerOf[tokenId] == address(0)) revert TokenDoesNotExist();
        return string.concat(baseURI, _toString(tokenId));
    }

    function setBaseURI(string calldata newBaseURI) external {
        if (msg.sender != owner) revert NotAuthorized();
        baseURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x01ffc9a7 || interfaceId == 0x80ac58cd || interfaceId == 0x5b5e139f;
    }

    function approve(address, uint256) external pure { revert NonTransferable(); }
    function setApprovalForAll(address, bool) external pure { revert NonTransferable(); }
    function transferFrom(address, address, uint256) external pure { revert NonTransferable(); }
    function safeTransferFrom(address, address, uint256) external pure { revert NonTransferable(); }
    function safeTransferFrom(address, address, uint256, bytes calldata) external pure { revert NonTransferable(); }
    function getApproved(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return false; }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 digits;
        uint256 temp = value;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(buffer);
    }
}
