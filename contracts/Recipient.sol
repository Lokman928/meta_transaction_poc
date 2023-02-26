// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract Recipient is ERC2771Context {
    event Result(address msgSender, bytes msgData);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    function mockFunction() public {
        emit Result(_msgSender(), _msgData());
    }
}
