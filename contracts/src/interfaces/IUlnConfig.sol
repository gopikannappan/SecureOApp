// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice ULN (Ultra-Light Node) DVN configuration for LayerZero V2.
/// @dev Mirrors the canonical struct used by LayerZero's MessageLib for config type 2.
///      Kept in our own interface file so this package does not depend on the
///      LayerZero monorepo. If LZ changes the struct, we update this single file.
struct UlnConfig {
    uint64 confirmations;
    uint8 requiredDVNCount;
    uint8 optionalDVNCount;
    uint8 optionalDVNThreshold;
    address[] requiredDVNs;
    address[] optionalDVNs;
}

// Config type constant for ULN config used with `endpoint.setConfig`.
uint32 constant CONFIG_TYPE_ULN = 2;

library UlnConfigCodec {
    error InvalidUlnConfigEncoding();

    /// @dev ABI-encoded shape matches what LayerZero's MessageLib expects.
    function encode(UlnConfig memory c) internal pure returns (bytes memory) {
        return abi.encode(c);
    }

    function decode(bytes memory raw) internal pure returns (UlnConfig memory c) {
        if (raw.length == 0) revert InvalidUlnConfigEncoding();
        c = abi.decode(raw, (UlnConfig));
    }
}
