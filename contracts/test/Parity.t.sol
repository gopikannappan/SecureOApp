// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { DVNValidator } from "../src/libraries/DVNValidator.sol";
import { Profile, Profiles } from "../src/libraries/Profiles.sol";
import { UlnConfig } from "../src/interfaces/IUlnConfig.sol";
import { DVNRegistry } from "../src/registry/DVNRegistry.sol";
import { TestFixtures } from "./helpers/TestFixtures.sol";

/// @notice Parity matrix — mirrors `packages/core/test/parity.test.ts`. Every
///         row must produce the same outcome on both sides. See
///         docs/parity-matrix.md for the authoritative table.
contract ParityTest is Test {
    DVNRegistry registry;

    function setUp() public {
        registry = new DVNRegistry(address(this));
        TestFixtures.seedRegistry(registry);
    }

    // -------------------------------------------------------------------- P1
    function test_P1_standardPassesStandard() public view {
        DVNValidator.validate(TestFixtures.standardConfig(), Profiles.standard(), registry);
    }

    // -------------------------------------------------------------------- P2
    function test_P2_insecure1of1_failsRequiredDVNCountTooLow() public {
        UlnConfig memory c = TestFixtures.insecureSingleConfig();
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(1), uint8(2))
        );
        this.callValidate(c, Profiles.standard());
    }

    // -------------------------------------------------------------------- P3
    function test_P3_homogeneousTwoLZ_failsBothZkAndOperatorDiversity() public {
        UlnConfig memory c = TestFixtures.homogeneousConfig();
        // Zk check runs before operator diversity; first-violation semantics apply.
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.ZkDVNCountTooLow.selector, uint8(0), uint8(1)));
        this.callValidate(c, Profiles.standard());
    }

    // -------------------------------------------------------------------- P4
    function test_P4_twoOperatorsNoZk_failsZkDVNCountTooLow() public {
        // 2 required DVNs, 2 distinct operators, no ZK.
        address[] memory req = new address[](2);
        req[0] = TestFixtures.LZ_DVN;
        req[1] = TestFixtures.NETHERMIND_DVN;
        UlnConfig memory c = UlnConfig({
            confirmations: 15,
            requiredDVNCount: 2,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: req,
            optionalDVNs: new address[](0)
        });
        vm.expectRevert(abi.encodeWithSelector(DVNValidator.ZkDVNCountTooLow.selector, uint8(0), uint8(1)));
        this.callValidate(c, Profiles.standard());
    }

    // -------------------------------------------------------------------- P5
    function test_P5_paranoidPassesParanoid() public view {
        DVNValidator.validate(TestFixtures.paranoidConfig(), Profiles.paranoid(), registry);
    }

    // -------------------------------------------------------------------- P6
    function test_P6_standardFailsParanoid_RequiredDVNCountTooLow() public {
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(2), uint8(3))
        );
        this.callValidate(TestFixtures.standardConfig(), Profiles.paranoid());
    }

    // -------------------------------------------------------------------- P7
    function test_P7_litePassesLite() public view {
        DVNValidator.validate(TestFixtures.liteConfig(), Profiles.lite(), registry);
    }

    // -------------------------------------------------------------------- P8
    function test_P8_homogeneousFailsLite_OperatorDiversityTooLow() public {
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.OperatorDiversityTooLow.selector, uint8(1), uint8(2))
        );
        this.callValidate(TestFixtures.homogeneousConfig(), Profiles.lite());
    }

    // -------------------------------------------------------------------- P9
    function test_P9_lowConfirmations_failsConfirmationsTooLow() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.confirmations = 1;
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.ConfirmationsTooLow.selector, uint64(1), uint64(5))
        );
        this.callValidate(c, Profiles.standard());
    }

    // -------------------------------------------------------------------- P10
    function test_P10_unregisteredDVN_failsDVNNotRegistered() public {
        UlnConfig memory c = TestFixtures.standardConfig();
        c.requiredDVNs[0] = TestFixtures.UNKNOWN_DVN;
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.DVNNotRegistered.selector, TestFixtures.UNKNOWN_DVN)
        );
        this.callValidate(c, Profiles.standard());
    }

    function callValidate(UlnConfig memory c, Profile memory p) external view {
        DVNValidator.validate(c, p, registry);
    }
}
