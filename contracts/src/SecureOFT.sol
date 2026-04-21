// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { SecureConfigBase } from "./SecureConfigBase.sol";

/// @title SecureOFT
/// @notice Abstract base for a LayerZero OFT with enforced DVN configuration.
///         Inherit alongside the OFT base from your LayerZero version. The
///         enforcement surface is identical to `SecureOApp` — an OFT is just
///         an OApp that moves tokens, and DVN validation is independent of
///         payload semantics.
abstract contract SecureOFT is SecureConfigBase {
    constructor(address endpoint_, address registry_, bytes32 profileId_, address admin_)
        SecureConfigBase(endpoint_, registry_, profileId_, admin_)
    {}
}
