// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { SecureConfigBase } from "./SecureConfigBase.sol";

/// @title SecureOApp
/// @notice Abstract base for a LayerZero OApp with enforced DVN configuration.
///         Developers should inherit this alongside their messaging logic. The
///         LayerZero OApp base (message handling, peer bookkeeping) is expected
///         to come from the user's chosen LayerZero version; we provide only
///         the config-enforcement mixin. See `SecureConfigBase` for the
///         enforcement contract surface.
abstract contract SecureOApp is SecureConfigBase {
    constructor(address endpoint_, address registry_, bytes32 profileId_, address admin_)
        SecureConfigBase(endpoint_, registry_, profileId_, admin_)
    {}
}
