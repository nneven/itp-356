//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RPD is ERC20 {
    constructor() ERC20("RapiDrive", "RPD") {

    }

    function mintRPD() public payable {
        // require(msg.value >= 10 ** uint256(decimals()), "Must transfer 1 ETH minimum");
        _mint(msg.sender, msg.value);
    }
}
