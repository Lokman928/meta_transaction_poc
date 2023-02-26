// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract Forwarder is EIP712 {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 nonce;
        bytes data;
    }

    bytes32 internal constant _TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 nonce,bytes data)"
        );

    mapping(address => uint256) private _nonces;

    event ForwardedRequest(
        ForwardRequest forwardRequest,
        bool isSuccess,
        bytes data
    );

    constructor() EIP712("Forwarder", "1.0") {}

    function verify(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public view returns (bool) {
        address signer = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    _TYPEHASH,
                    req.from,
                    req.to,
                    req.nonce,
                    keccak256(req.data)
                )
            )
        ).recover(signature);
        return _nonces[req.from] == req.nonce && signer == req.from;
    }

    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public payable returns (bool success, bytes memory res) {
        require(verify(req, signature), "EIP712: fail to verify");
        _nonces[req.from] = _nonces[req.from] + 1;

        (success, res) = req.to.call(abi.encodePacked(req.data, req.from));
        emit ForwardedRequest(req, success, res);

        if (!success) {
            revert("Forwarder: Fail to call");
        }

        return (success, res);
    }

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }
}
