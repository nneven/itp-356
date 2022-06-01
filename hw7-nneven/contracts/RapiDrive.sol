//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./RPD.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IRapiDrive {
    /// @notice Emits event when a driver enters a RapiDrive ramp
    event EnterRamp(address user, string rampName);
    /// @notice Emits event when a driver exits a RapiDrive ramp
    event ExitRamp(address user, string rampName);
    /// @notice Emits event when a RapiDrive ramp pair is updated
    event RampPairUpdated(string ramp1, string ramp2, uint256 fee);

    /// @notice A driver enters a RapiDrive ramp
    /// @param user The address of the driver entering the ramp
    /// @param rampName The name of the ramp the driver enters
    function enterRamp(address user, string memory rampName) external;
    
    /// @notice A driver exits a RapiDrive ramp
    /// @param user The address of the driver exits the ramp
    /// @param rampName The name of the ramp the driver exits
    function exitRamp(address user, string memory rampName) external payable;

    /// @notice Updates a ramp pair with a fee
    /// @dev Set fee to -1 to invalidate the ramp pair, else default fee is 0 RPD
    /// @dev If ramp pair already exists, overwrites with new fee value
    /// @param ramp1 The name of the first ramp in the pair
    /// @param ramp2 The name of the second ramp in the pair
    /// @param fee The fee the driver pays in RPD to enter at ramp1 and exit at ramp2
    function updateRampPair(string memory ramp1, string memory ramp2, uint256 fee) external;
}

contract RapiDrive is Ownable, Pausable, IRapiDrive {

    RPD private _rpd;
    mapping(string => mapping(string => uint256)) private _rampPairs;
    mapping(address => string) private _currentDrivers;

    constructor (address rpd) {
        _rpd = RPD(rpd);
    }

    /// @notice A driver enters a RapiDrive ramp
    /// @param user The address of the driver entering the ramp
    /// @param rampName The name of the ramp the driver enters
    function enterRamp(address user, string memory rampName) external override {
        require(_rpd.balanceOf(user) >= 10 * (10 ** 18), "RPD balance insufficient");
        require(_rpd.allowance(user, address(this)) >= 10 * (10 ** 18), "RPD allowance insufficient");
        _currentDrivers[user] = rampName;
        emit EnterRamp(user, rampName);
    }
    
    /// @notice A driver exits a RapiDrive ramp
    /// @param user The address of the driver exits the ramp
    /// @param rampName The name of the ramp the driver exits
    function exitRamp(address user, string memory rampName) external payable override {
        string memory entryRamp = _currentDrivers[user];
        // require(_rampPairs[entryRamp][rampName] > 0, "Invalid ramp pair fee");
        require(bytes(entryRamp).length > 0, "User has not entered ramp");
        _rpd.transferFrom(user, address(this), _rampPairs[entryRamp][rampName]);
        _currentDrivers[user] = "";
        emit ExitRamp(user, rampName);
    }

    /// @notice Updates a ramp pair with a fee
    /// @dev Set fee to -1 to invalidate the ramp pair, else default fee is 0 RPD
    /// @dev If ramp pair already exists, overwrites with new fee value
    /// @param ramp1 The name of the first ramp in the pair
    /// @param ramp2 The name of the second ramp in the pair
    /// @param fee The fee the driver pays in RPD to enter at ramp1 and exit at ramp2
    function updateRampPair(string memory ramp1, string memory ramp2, uint256 fee) external override {
        _rampPairs[ramp1][ramp2] = fee;
        emit RampPairUpdated(ramp1, ramp2, fee);
    }
}
