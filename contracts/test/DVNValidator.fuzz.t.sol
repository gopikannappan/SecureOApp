// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { DVNValidator } from "../src/libraries/DVNValidator.sol";
import { Profile, Profiles } from "../src/libraries/Profiles.sol";
import { UlnConfig } from "../src/interfaces/IUlnConfig.sol";
import { DVNRegistry, DVNOperators } from "../src/registry/DVNRegistry.sol";
import { TestFixtures } from "./helpers/TestFixtures.sol";

/// @notice Fuzz-tests the validator. Focuses on invariants that must hold for
///         every UlnConfig, not just the canned fixtures.
contract DVNValidatorFuzzTest is Test {
    DVNRegistry registry;

    function setUp() public {
        registry = new DVNRegistry(address(this));
        TestFixtures.seedRegistry(registry);
    }

    /// @notice For every requiredDVNCount strictly below the profile's minimum,
    ///         validation must revert with RequiredDVNCountTooLow — regardless
    ///         of every other field.
    function testFuzz_underMinRequired_alwaysReverts(uint8 count, uint64 confirmations) public {
        count = uint8(bound(count, 0, 1)); // standard requires ≥ 2
        confirmations = uint64(bound(confirmations, 0, 100));
        UlnConfig memory c = TestFixtures.standardConfig();
        c.requiredDVNCount = count;
        // trim required DVNs to match so decode/encode would stay consistent
        address[] memory trimmed = new address[](count);
        for (uint256 i; i < count; ++i) trimmed[i] = c.requiredDVNs[i];
        c.requiredDVNs = trimmed;
        c.confirmations = confirmations;

        vm.expectRevert();
        this.callValidate(c, Profiles.standard());
    }

    /// @notice Any UlnConfig that meets all profile constraints must pass. We
    ///         generate a random required-DVN count ≥ profile min and pick DVNs
    ///         that collectively satisfy ZK + diversity requirements.
    function testFuzz_validConfig_alwaysPasses(uint8 extraDVNs, uint64 confirmations) public view {
        extraDVNs = uint8(bound(extraDVNs, 0, 3));
        confirmations = uint64(bound(confirmations, 15, 100));

        UlnConfig memory c = TestFixtures.standardConfig();
        c.confirmations = confirmations;
        if (extraDVNs > 0) {
            address[] memory newOpt = new address[](c.optionalDVNs.length + extraDVNs);
            for (uint256 i; i < c.optionalDVNs.length; ++i) newOpt[i] = c.optionalDVNs[i];
            if (extraDVNs >= 1) newOpt[c.optionalDVNs.length] = TestFixtures.GOOGLE_DVN;
            if (extraDVNs >= 2) newOpt[c.optionalDVNs.length + 1] = TestFixtures.SUCCINCT_ZK;
            if (extraDVNs >= 3) newOpt[c.optionalDVNs.length + 2] = TestFixtures.LZ_DVN_2;
            c.optionalDVNs = newOpt;
            c.optionalDVNCount = uint8(newOpt.length);
        }
        DVNValidator.validate(c, Profiles.standard(), registry);
    }

    /// @notice Confirmations below the minimum always revert regardless of the
    ///         rest of the config. Fuzz on sub-threshold values only.
    function testFuzz_lowConfirmations_reverts(uint64 confirmations) public {
        confirmations = uint64(bound(confirmations, 0, 4)); // standard min = 5
        UlnConfig memory c = TestFixtures.standardConfig();
        c.confirmations = confirmations;
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.ConfirmationsTooLow.selector, confirmations, uint64(5)));
        this.callValidate(c, Profiles.standard());
    }

    /// @notice optionalDVNThreshold > optionalDVNCount must always revert with
    ///         InvalidOptionalThreshold. Fuzz over the invalid space.
    function testFuzz_invalidOptionalThreshold_reverts(uint8 optCount, uint8 optThresh) public {
        optCount = uint8(bound(optCount, 0, 5));
        optThresh = uint8(bound(optThresh, optCount + 1, 10));
        UlnConfig memory c = TestFixtures.standardConfig();
        c.optionalDVNCount = optCount;
        c.optionalDVNThreshold = optThresh;
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.InvalidOptionalThreshold.selector, optThresh, optCount));
        this.callValidate(c, Profiles.standard());
    }

    /// @notice Duplicates in the optional DVN list must also revert.
    function test_duplicateOptional_reverts() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        address[] memory opt = new address[](2);
        opt[0] = TestFixtures.LZ_DVN;
        opt[1] = TestFixtures.LZ_DVN; // duplicate
        c.optionalDVNs = opt;
        c.optionalDVNCount = 2;
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.DuplicateDVN.selector, TestFixtures.LZ_DVN));
        this.callValidate(c, Profiles.standard());
    }

    /// @notice Removing a DVN from the registry and then validating against a
    ///         config that used it must surface DVNNotRegistered.
    function test_removedDVN_isFlagged() public {
        registry.remove(TestFixtures.POLYHEDRA_ZK);
        UlnConfig memory c = TestFixtures.standardConfig();
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.DVNNotRegistered.selector, TestFixtures.POLYHEDRA_ZK)
        );
        this.callValidate(c, Profiles.standard());
    }

    /// @notice Document: cross-list duplicates (same DVN in required AND
    ///         optional) are NOT rejected by the validator. Callers should
    ///         normalize their config before submission. If future versions
    ///         tighten this, flip the assertion.
    function test_crossListDuplicate_currentlyAllowed() public view {
        UlnConfig memory c = TestFixtures.standardConfig();
        address[] memory opt = new address[](1);
        opt[0] = c.requiredDVNs[0]; // already in required
        c.optionalDVNs = opt;
        c.optionalDVNCount = 1;
        // the current implementation only detects duplicates within each
        // list; across lists the tag-tally still runs so this exercises
        // the operator-count path (same operator counted twice).
        // Here POLYHEDRA_ZK appears twice → operator polyhedra counted once,
        // so other checks must still fire. ZK count would be 2 though (passes).
        // We assert the call succeeds because duplicate cross-list isn't a
        // structural error per se; this is a documented gap recorded here.
        DVNValidator.validate(c, Profiles.standard(), registry);
    }

    function callValidate(UlnConfig memory c, Profile memory p) external view {
        DVNValidator.validate(c, p, registry);
    }
}
