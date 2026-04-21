// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

/// @notice Security profile constraints for DVN validation.
/// @dev `minEffectiveThreshold` = required DVNs + optional DVN threshold.
///      A 2/3 config means `requiredDVNCount = 2`, `optionalDVNCount = 0`, `optionalDVNThreshold = 0`,
///      and `minEffectiveThreshold = 2`. A 2-required + 1-optional-with-threshold-1 config has
///      effective threshold 3.
struct Profile {
    bytes32 id;
    uint8 minRequiredDVNCount;
    uint8 minEffectiveThreshold;
    uint8 minZkDVNCount;
    uint8 minDistinctOperators;
    uint64 minConfirmations;
}

/// @notice Canonical profile identifiers. Shared with the TS tooling via fixtures.
library ProfileIds {
    bytes32 internal constant STANDARD = keccak256("secure-oapp.profile.standard.v1");
    bytes32 internal constant PARANOID = keccak256("secure-oapp.profile.paranoid.v1");
    bytes32 internal constant LITE = keccak256("secure-oapp.profile.lite.v1");
}

/// @notice Preset profile constructors. Pure functions so the library compiles
///         into call sites without needing a separate deployment.
library Profiles {
    function standard() internal pure returns (Profile memory) {
        return Profile({
            id: ProfileIds.STANDARD,
            minRequiredDVNCount: 2,
            minEffectiveThreshold: 2,
            minZkDVNCount: 1,
            minDistinctOperators: 2,
            minConfirmations: 5
        });
    }

    function paranoid() internal pure returns (Profile memory) {
        return Profile({
            id: ProfileIds.PARANOID,
            minRequiredDVNCount: 3,
            minEffectiveThreshold: 3,
            minZkDVNCount: 2,
            minDistinctOperators: 3,
            minConfirmations: 15
        });
    }

    function lite() internal pure returns (Profile memory) {
        return Profile({
            id: ProfileIds.LITE,
            minRequiredDVNCount: 2,
            minEffectiveThreshold: 2,
            minZkDVNCount: 0,
            minDistinctOperators: 2,
            minConfirmations: 1
        });
    }

    function fromId(bytes32 id) internal pure returns (Profile memory) {
        if (id == ProfileIds.STANDARD) return standard();
        if (id == ProfileIds.PARANOID) return paranoid();
        if (id == ProfileIds.LITE) return lite();
        revert UnknownProfile(id);
    }

    error UnknownProfile(bytes32 id);
}
