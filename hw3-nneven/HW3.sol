// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

// @title Homework 3
// @author Nicolas Neven
contract HW3 {

    // STANDALONE FUNCTIONS //

    function doMath(int256 a, int256 b) public pure returns (int256) {
        a *= 2;
        b *= 2;
        return a + b;
    }

    function getMax(uint256[] memory numbers) public pure returns (uint256) {
        uint256 max = 0;
        for (uint256 i = 0; i < numbers.length; i++) {
            if (numbers[i] > max) {
                max = numbers[i];
            }
        }
        return max;
    }

    function hashStringArray(string[] memory hashStrings) public pure returns (bytes32[] memory result) {
        uint256 size = hashStrings.length;
        bytes32[] memory hashes = new bytes32[](size);
        for (uint i = 0; i < size; i++) {
            hashes[i] = keccak256(abi.encode(hashStrings[i]));
        }
        return hashes;
    }

    // CONTACT BOOK //

    mapping(address => uint256) internal contactCounter;
    mapping(address => mapping(uint256 => address)) internal contactBook;

    // Returns a list of contacts for a given address
    function getContacts(address caller) external view returns (address[] memory) {
        uint256 contactCount = contactCounter[caller];
        address[] memory contacts = new address[](contactCount);
        for (uint256 i = 0; i < contactCount; i++) {
            contacts[i] = contactBook[caller][i+1];
        }
        return contacts;
    }

    // Adds an address to the caller's list of contacts
    function addContact(address contact) external {
        contactCounter[msg.sender] += 1;
        uint256 contactCount = contactCounter[msg.sender];
        contactBook[msg.sender][contactCount] = contact;
    }

    // Replaces the caller's existing list of contacts with the input parameter
    function setContacts(address[] calldata contacts) external {
        contactCounter[msg.sender] = contacts.length;
        for (uint256 i = 0; i < contacts.length; i++) {
            contactBook[msg.sender][i+1] = contacts[i];
        }
    }
}