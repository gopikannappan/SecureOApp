// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice Tag for a registered DVN. `operator` identifies the running org
///         (e.g. keccak256("layerzero-labs"), keccak256("polyhedra")). `isZk`
///         marks ZK-based verifiers. `verified` means the registry maintainer
///         has confirmed the address matches the operator's published address.
struct DVNTag {
    bytes32 operator;
    bool isZk;
    bool verified;
}

interface IDVNRegistry {
    error UnknownDVN(address dvn);

    function tagOf(address dvn) external view returns (DVNTag memory);

    function isRegistered(address dvn) external view returns (bool);
}
