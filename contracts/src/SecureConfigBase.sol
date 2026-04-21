// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { ILayerZeroEndpointV2, SetConfigParam } from "./interfaces/ILayerZeroEndpointV2.sol";
import { UlnConfig, UlnConfigCodec, CONFIG_TYPE_ULN } from "./interfaces/IUlnConfig.sol";
import { Profile, Profiles } from "./libraries/Profiles.sol";
import { DVNValidator } from "./libraries/DVNValidator.sol";
import { IDVNRegistry } from "./registry/IDVNRegistry.sol";

/// @title SecureConfigBase
/// @notice Mixin for LayerZero OApps that enforces a security profile on
///         every ULN DVN config change. Exposes `setSecureSendConfig` and
///         `setSecureReceiveConfig`. Refuses to forward a config to the
///         endpoint unless the DVN set satisfies the profile.
/// @dev Inherit this alongside your OApp and wire the constructor with the
///      endpoint, registry, and profile ID. Do not expose alternative
///      endpoint config paths from derived contracts — doing so breaks the
///      enforcement guarantee.
abstract contract SecureConfigBase {
    event SecureConfigEnforced(uint32 indexed eid, bool isSend, bytes32 profileId);
    event ProfileOverride(bytes32 previousProfileId, bytes32 newProfileId, string justification);

    error NotAdmin();
    error ZeroAddress();

    ILayerZeroEndpointV2 public immutable ENDPOINT;
    IDVNRegistry public immutable DVN_REGISTRY;

    bytes32 public profileId;
    address public secureAdmin;

    modifier onlySecureAdmin() {
        if (msg.sender != secureAdmin) revert NotAdmin();
        _;
    }

    constructor(address endpoint_, address registry_, bytes32 profileId_, address admin_) {
        if (endpoint_ == address(0) || registry_ == address(0) || admin_ == address(0)) {
            revert ZeroAddress();
        }
        // Sanity: revert if profileId_ is not a recognized preset. Custom profiles
        // must be added to `Profiles.fromId` via a contract upgrade to be usable here.
        Profiles.fromId(profileId_);
        ENDPOINT = ILayerZeroEndpointV2(endpoint_);
        DVN_REGISTRY = IDVNRegistry(registry_);
        profileId = profileId_;
        secureAdmin = admin_;
    }

    /// @notice Validate and forward a ULN send config to the LayerZero endpoint.
    /// @param dstEid destination endpoint ID (where messages sent by this OApp terminate).
    /// @param rawUlnConfig ABI-encoded `UlnConfig`.
    function setSecureSendConfig(uint32 dstEid, bytes calldata rawUlnConfig) external onlySecureAdmin {
        address lib = ENDPOINT.getSendLibrary(address(this), dstEid);
        _validateAndSet(dstEid, rawUlnConfig, lib, true);
    }

    /// @notice Validate and forward a ULN receive config to the LayerZero endpoint.
    function setSecureReceiveConfig(uint32 srcEid, bytes calldata rawUlnConfig) external onlySecureAdmin {
        (address lib,) = ENDPOINT.getReceiveLibrary(address(this), srcEid);
        _validateAndSet(srcEid, rawUlnConfig, lib, false);
    }

    /// @notice Emergency-only profile change. Logged on-chain with a human-readable
    ///         justification. This does not relax any past config — it changes the
    ///         profile used for future validations.
    function overrideProfile(bytes32 newProfileId, string calldata justification) external onlySecureAdmin {
        Profiles.fromId(newProfileId);
        emit ProfileOverride(profileId, newProfileId, justification);
        profileId = newProfileId;
    }

    function transferSecureAdmin(address newAdmin) external onlySecureAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();
        secureAdmin = newAdmin;
    }

    function currentProfile() public view returns (Profile memory) {
        return Profiles.fromId(profileId);
    }

    function _validateAndSet(uint32 eid, bytes calldata raw, address lib, bool isSend) private {
        UlnConfig memory c = UlnConfigCodec.decode(raw);
        DVNValidator.validate(c, currentProfile(), DVN_REGISTRY);

        SetConfigParam[] memory params = new SetConfigParam[](1);
        params[0] = SetConfigParam({ eid: eid, configType: CONFIG_TYPE_ULN, config: raw });
        ENDPOINT.setConfig(address(this), lib, params);

        emit SecureConfigEnforced(eid, isSend, profileId);
    }
}
