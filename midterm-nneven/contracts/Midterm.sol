//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IPausable {
    // Returns if the contract is currently paused
    function paused() external view returns (bool);
}

interface IMidterm {
    // solhint-disable ordering
    function addArrays(uint256[] calldata array0, uint256[] calldata array1)
        external
        pure
        returns (uint256[] memory);

    // Please make sure things are returned in order, else you will fail testing
    function getRangeSolutionDeposit()
        external
        view
        returns (
            uint256, // floor
            uint256, // ceiling
            bytes32, // solution hash
            uint256 // current deposit required
        );

    // Only the owner can set this when game is paused
    function setRangeSolutionDeposit(
        uint256 floor,
        uint256 ceiling,
        bytes32 solution,
        uint256 deposit
    ) external;

    // Can only run when game is not paused
    function guess(uint256 number) external payable;

    // Emitted when a player guesses (regardless of correctness)
    event DidGuess(address player, uint256 number);
    // Emitted when a player wins and the game pauses
    event DidResetGame(address winner);
}

contract Midterm is IPausable, IMidterm {
    // solhint-disable ordering
    function addArrays(uint256[] calldata array0, uint256[] calldata array1)
        external
        pure
        override
        returns (uint256[] memory)
    {
        uint256[] memory result = new uint256[](array0.length);
        for (uint256 i = 0; i < array0.length; i++) {
            result[i] = array0[i] + array1[i];
        }
        return result;
    }

    address private _owner;
    bool private _paused;
    uint256 private _floor;
    uint256 private _ceiling;
    bytes32 private _solution;
    uint256 private _nextDeposit;
    uint256 private _totalDeposited;

    constructor() {
        _owner = msg.sender;
        _paused = true;
    }

    function paused() external view override returns (bool) {
        return _paused;
    }

    function getRangeSolutionDeposit()
        external
        view
        override
        returns (
            uint256,
            uint256,
            bytes32,
            uint256
        )
    {
        return (_floor, _ceiling, _solution, _nextDeposit);
    }

    function setRangeSolutionDeposit(
        uint256 floor,
        uint256 ceiling,
        bytes32 solution,
        uint256 deposit
    ) external override {
        require(msg.sender == _owner, "Must be contract owner.");
        require(_paused, "Slavic Roulette is not paused.");
        _floor = floor;
        _ceiling = ceiling;
        _solution = solution;
        _nextDeposit = deposit;
        _totalDeposited = 0;
        _paused = false;
    }

    function guess(uint256 number) external payable override {
        if (_paused) revert("Paramaters not set");
        if (msg.value != _nextDeposit) {
            revert("Incorrect deposit amount");
        } else {
            _totalDeposited += msg.value;
        }
        if (hashNumber(number) == _solution) {
            payable(msg.sender).transfer(_totalDeposited);
            _paused = true;
            emit DidGuess(msg.sender, number);
            emit DidResetGame(msg.sender);
        } else {
            _nextDeposit *= 2;
            emit DidGuess(msg.sender, number);
        }
    }

    function hashNumber(uint256 number) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(number));
    }
}
