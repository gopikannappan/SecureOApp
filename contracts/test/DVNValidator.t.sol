// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { DVNValidator } from "../src/libraries/DVNValidator.sol";
import { Profile, Profiles } from "../src/libraries/Profiles.sol";
import { UlnConfig } from "../src/interfaces/IUlnConfig.sol";
import { DVNRegistry } from "../src/registry/DVNRegistry.sol";
import { TestFixtures } from "./helpers/TestFixtures.sol";

contract DVNValidatorTest is Test {
    DVNRegistry registry;

    function setUp() public {
        registry = new DVNRegistry(address(this));
        TestFixtures.seedRegistry(registry);
    }

    function test_standardConfig_passesStandardProfile() public view {
        UlnConfig memory c = TestFixtures.standardConfig();
        DVNValidator.validate(c, Profiles.standard(), registry);
    }

    function test_insecureSingle_failsStandard_withRequiredDVNCountTooLow() public {
        UlnConfig memory c = TestFixtures.insecureSingleConfig();
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(1), uint8(2))
        );
        this.callValidate(c, Profiles.standard());
    }

    function test_homogeneous_failsStandard_withOperatorDiversityTooLow() public {
        UlnConfig memory c = TestFixtures.homogeneousConfig();
        // counts pass (2/2), zkCount = 0 < 1 → fails zk check first.
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.ZkDVNCountTooLow.selector, uint8(0), uint8(1)));
        this.callValidate(c, Profiles.standard());
    }

    function test_homogeneous_failsLite_withOperatorDiversityTooLow() public {
        UlnConfig memory c = TestFixtures.homogeneousConfig();
        // `lite` doesn't require ZK but does require 2 distinct operators.
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.OperatorDiversityTooLow.selector, uint8(1), uint8(2))
        );
        this.callValidate(c, Profiles.lite());
    }

    function test_paranoidConfig_passesParanoid() public view {
        UlnConfig memory c = TestFixtures.paranoidConfig();
        DVNValidator.validate(c, Profiles.paranoid(), registry);
    }

    function test_liteConfig_passesLite() public view {
        UlnConfig memory c = TestFixtures.liteConfig();
        DVNValidator.validate(c, Profiles.lite(), registry);
    }

    function test_standardConfig_failsParanoid_withEffectiveThresholdTooLow() public {
        // `standard` fixture has requiredDVNCount=2, optThreshold=0 → effective=2 < 3.
        UlnConfig memory c = TestFixtures.standardConfig();
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(2), uint8(3))
        );
        this.callValidate(c, Profiles.paranoid());
    }

    function test_unregisteredDVN_reverts() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.requiredDVNs[0] = TestFixtures.UNKNOWN_DVN;
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.DVNNotRegistered.selector, TestFixtures.UNKNOWN_DVN));
        this.callValidate(c, Profiles.standard());
    }

    function test_duplicateRequired_reverts() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.requiredDVNs[1] = c.requiredDVNs[0];
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.DuplicateDVN.selector, c.requiredDVNs[0]));
        this.callValidate(c, Profiles.standard());
    }

    function test_confirmationsTooLow_reverts() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.confirmations = 1;
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.ConfirmationsTooLow.selector, uint64(1), uint64(5)));
        this.callValidate(c, Profiles.standard());
    }

    function test_invalidOptionalThreshold_reverts() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.optionalDVNCount = 1;
        c.optionalDVNThreshold = 2; // threshold > count
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.InvalidOptionalThreshold.selector, uint8(2), uint8(1)));
        this.callValidate(c, Profiles.standard());
    }

    // Exposes the internal library call to `this.` so we can use `vm.expectRevert`
    // cleanly (cheat code attaches to the next external call).
    function callValidate(UlnConfig memory c, Profile memory p) external view {
        DVNValidator.validate(c, p, registry);
    }
}
