// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { UlnConfig } from "../interfaces/IUlnConfig.sol";
import { Profile } from "./Profiles.sol";
import { IDVNRegistry, DVNTag } from "../registry/IDVNRegistry.sol";

/// @title DVNValidator
/// @notice Pure validation for a `UlnConfig` against a `Profile` and a chain-local
///         `IDVNRegistry`. Reverts with typed errors so a caller can surface the
///         specific reason a deployment was refused.
/// @dev This is the on-chain enforcement path. The TS tooling (`@secure-oapp/core`)
///      implements the same logic for pre-flight checks; both paths must agree.
library DVNValidator {
    error RequiredDVNCountTooLow(uint8 requiredDVNCount, uint8 minRequired);
    error EffectiveThresholdTooLow(uint8 effectiveThreshold, uint8 minThreshold);
    error ZkDVNCountTooLow(uint8 zkCount, uint8 minZk);
    error OperatorDiversityTooLow(uint8 distinctOperators, uint8 minDistinct);
    error DVNNotRegistered(address dvn);
    error DuplicateDVN(address dvn);
    error ConfirmationsTooLow(uint64 confirmations, uint64 minConfirmations);
    error InvalidOptionalThreshold(uint8 threshold, uint8 optionalCount);

    /// @notice Validate `c` against `p` using `registry` for tag lookup.
    ///         Reverts with the first violation found.
    function validate(UlnConfig memory c, Profile memory p, IDVNRegistry registry) internal view {
        _checkCounts(c, p);
        _checkConfirmations(c, p);
        (uint8 zkCount, uint8 distinctOperators) = _tallyTags(c, registry);
        if (zkCount < p.minZkDVNCount) revert ZkDVNCountTooLow(zkCount, p.minZkDVNCount);
        if (distinctOperators < p.minDistinctOperators) {
            revert OperatorDiversityTooLow(distinctOperators, p.minDistinctOperators);
        }
    }

    function _checkCounts(UlnConfig memory c, Profile memory p) private pure {
        if (c.requiredDVNCount < p.minRequiredDVNCount) {
            revert RequiredDVNCountTooLow(c.requiredDVNCount, p.minRequiredDVNCount);
        }
        if (c.optionalDVNThreshold > c.optionalDVNCount) {
            revert InvalidOptionalThreshold(c.optionalDVNThreshold, c.optionalDVNCount);
        }
        uint8 effective = c.requiredDVNCount + c.optionalDVNThreshold;
        if (effective < p.minEffectiveThreshold) {
            revert EffectiveThresholdTooLow(effective, p.minEffectiveThreshold);
        }
        _assertNoDuplicates(c.requiredDVNs);
        _assertNoDuplicates(c.optionalDVNs);
    }

    function _checkConfirmations(UlnConfig memory c, Profile memory p) private pure {
        if (c.confirmations < p.minConfirmations) {
            revert ConfirmationsTooLow(c.confirmations, p.minConfirmations);
        }
    }

    /// @dev Walks required + optional DVNs, counts ZK DVNs, and counts distinct
    ///      operator tags. An address must be present in `registry` — an
    ///      unregistered DVN is treated as untrusted and reverts.
    function _tallyTags(UlnConfig memory c, IDVNRegistry registry)
        private
        view
        returns (uint8 zkCount, uint8 distinctOperators)
    {
        uint256 total = c.requiredDVNs.length + c.optionalDVNs.length;
        bytes32[] memory seenOperators = new bytes32[](total);
        uint256 seenLen;

        for (uint256 i; i < c.requiredDVNs.length; ++i) {
            (zkCount, seenLen) = _ingest(c.requiredDVNs[i], registry, seenOperators, seenLen, zkCount);
        }
        for (uint256 i; i < c.optionalDVNs.length; ++i) {
            (zkCount, seenLen) = _ingest(c.optionalDVNs[i], registry, seenOperators, seenLen, zkCount);
        }

        distinctOperators = uint8(seenLen);
    }

    function _ingest(
        address dvn,
        IDVNRegistry registry,
        bytes32[] memory seenOperators,
        uint256 seenLen,
        uint8 zkCount
    ) private view returns (uint8, uint256) {
        if (!registry.isRegistered(dvn)) revert DVNNotRegistered(dvn);
        DVNTag memory tag = registry.tagOf(dvn);
        if (tag.isZk) zkCount += 1;
        bool seen = false;
        for (uint256 j; j < seenLen; ++j) {
            if (seenOperators[j] == tag.operator) {
                seen = true;
                break;
            }
        }
        if (!seen) {
            seenOperators[seenLen] = tag.operator;
            seenLen += 1;
        }
        return (zkCount, seenLen);
    }

    function _assertNoDuplicates(address[] memory list) private pure {
        for (uint256 i; i < list.length; ++i) {
            for (uint256 j = i + 1; j < list.length; ++j) {
                if (list[i] == list[j]) revert DuplicateDVN(list[i]);
            }
        }
    }
}
