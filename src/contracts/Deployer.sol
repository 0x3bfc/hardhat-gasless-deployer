// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@opengsn/contracts/src/ERC2771Recipient.sol";
import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";


contract Deployer is ERC2771Recipient {
    constructor(address forwarder) {
        _setTrustedForwarder(forwarder);
    }

    function deploy(
        uint256 value,
        bytes32 salt,
        bytes memory code
    ) public {
        Create2.deploy(value, salt, code);
    }

    function computeAddress(
        bytes32 salt,
        bytes32 codeHash
    ) public view returns (address) {
        return Create2.computeAddress(salt, codeHash);
    }
}