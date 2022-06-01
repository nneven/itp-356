//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IOwnable {
    // Event emitted when ownership is transferred
    event OwnershipTransferred(address newOwner);

    // Transfers ownership to a new address
    function transferOwnership(address newOwner) external;

    // Returns the current owner of this contract
    function owner() external view returns (address);
}

interface IPausable {
    // Toggles the pause status of the contract
    // Hint: Who should be able to call this?
    function togglePause() external;

    // Returns if the contract is currently paused
    function paused() external view returns (bool);
}

interface ISplitter {
    // Event emitted when funds are deposited and split
    event DidDepositFunds(uint256 amount, address[] recipients);
    // Event emitted when funds are withdrawn
    event DidWithdrawFunds(uint256 amount, address recipient);

    // The caller deposits some amount of Ether and splits it among recipients evenly
    // This function cannot be called if the contract is paused
    function deposit(address[] calldata recipients) external payable;

    // The caller can withdraw a valid amount of Ether from the contract
    // This function cannot be called if the contract is paused
    function withdraw(uint256 amount) external;

    // Returns the current balance of an address
    function balanceOf(address addr) external view returns (uint256);
}

// REGRADE CHANGES :: 03/08/2022
// Code with _EDIT_ comments were added during regrade to resolve issues
contract HW4 is IOwnable, IPausable, ISplitter {
    // solhint-disable ordering
    function getMax(uint256[] calldata array) external pure returns (uint256) {
        // Sets max to zero
        uint256 max = 0;
        // Iterate through each array value O(n)
        for (uint256 i = 0; i < array.length; i++) {
            // If element value is greater than current max, assign as new max
            if (array[i] > max) {
                max = array[i];
            }
        }
        // Return result (max)
        return max;
    }

    // EDIT: added private keyword(s) to member variables
    // Keeps track if contract is paused
    bool private _paused;
    // Keeps tracks of contract owner
    address private _owner;
    // Keeps track of users and balances
    mapping(address => uint256) private _balances;

    constructor() {
        // When the contract is created, starts _not_ paused
        _paused = false;
        // Set contract owner to address of message (transaction) sender
        _owner = msg.sender;
    }

    function transferOwnership(address newOwner) external override {
        // EDIT: requires current owner to transfer ownership
        require(msg.sender == _owner, "Must be owner.");
        // Transfers ownership to new owner address
        _owner = newOwner;
        // EDIT: emits event that ownership was transferred
        emit OwnershipTransferred(newOwner);
    }

    function togglePause() external override {
        // Requires owner to transfer ownership
        require(msg.sender == _owner, "Must be owner.");
        // Toggles the paused state
        _paused = !_paused;
    }

    function deposit(address[] calldata recipients) external payable override {
        // Requires that the contract is not paused
        require(!_paused, "Contract is paused.");
        // Splits up the amount sent (message value) to recipients
        for (uint256 i = 0; i < recipients.length; i++) {
            _balances[recipients[i]] += msg.value / recipients.length;
        }
        // EDIT: emits event that funds were deposited
        emit DidDepositFunds(msg.value, recipients);
    }

    function withdraw(uint256 amount) external override {
        // Requires that the contract is not paused
        require(!_paused, "Contract is paused.");
        // EDIT: requires that amount is valid, above 0 and below caller's balance
        require(
            0 < amount && amount <= _balances[msg.sender],
            "Not a valid amount."
        );
        // EDIT: transfers valid amount of funds to message sender
        payable(msg.sender).transfer(amount);
        // EDIT: subtracts withdrawn amount from balance tracker
        _balances[msg.sender] -= amount;
        // EDIT: emits event that funds were withdrawn
        emit DidWithdrawFunds(amount, msg.sender);
    }

    function owner() external view override returns (address) {
        // returns owner of contract
        return _owner;
    }

    function paused() external view override returns (bool) {
        // returns contract paused state
        return _paused;
    }

    function balanceOf(address addr) external view override returns (uint256) {
        // EDIT: returns balance of given adderess in contract
        return _balances[addr];
    }
}
