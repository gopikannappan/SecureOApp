// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { MockSecureOApp } from "./mocks/MockSecureOApp.sol";
import { MockEndpoint } from "./mocks/MockEndpoint.sol";
import { DVNRegistry } from "../src/registry/DVNRegistry.sol";
import { ProfileIds } from "../src/libraries/Profiles.sol";
import { UlnConfig, UlnConfigCodec, CONFIG_TYPE_ULN } from "../src/interfaces/IUlnConfig.sol";
import { DVNValidator } from "../src/libraries/DVNValidator.sol";
import { SecureConfigBase } from "../src/SecureConfigBase.sol";
import { TestFixtures } from "./helpers/TestFixtures.sol";

contract SecureOAppTest is Test {
    MockEndpoint endpoint;
    DVNRegistry registry;
    MockSecureOApp oapp;
    address admin = address(0xA11CE);

    function setUp() public {
        endpoint = new MockEndpoint();
        endpoint.setLibraries(address(0x5EDD), address(0x12EC));
        registry = new DVNRegistry(address(this));
        TestFixtures.seedRegistry(registry);
        oapp = new MockSecureOApp(address(endpoint), address(registry), ProfileIds.STANDARD, admin);
    }

    function test_secureSendConfig_forwardsWhenValid() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());

        vm.prank(admin);
        oapp.setSecureSendConfig(30101, raw);

        assertEq(endpoint.callCount(), 1);
        bytes memory stored = endpoint.getConfig(address(oapp), address(0x5EDD), 30101, CONFIG_TYPE_ULN);
        assertEq(keccak256(stored), keccak256(raw));
    }

    function test_secureSendConfig_revertsOn_1of1() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.insecureSingleConfig());
        vm.prank(admin);
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(1), uint8(2))
        );
        oapp.setSecureSendConfig(30101, raw);

        assertEq(endpoint.callCount(), 0, "endpoint must not be called");
    }

    function test_secureSendConfig_onlyAdmin() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());
        vm.prank(address(0xBAD));
        vm.expectRevert(SecureConfigBase.NotAdmin.selector);
        oapp.setSecureSendConfig(30101, raw);
    }

    function test_secureReceiveConfig_forwardsWhenValid() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());
        vm.prank(admin);
        oapp.setSecureReceiveConfig(30110, raw);

        bytes memory stored = endpoint.getConfig(address(oapp), address(0x12EC), 30110, CONFIG_TYPE_ULN);
        assertEq(keccak256(stored), keccak256(raw));
    }

    function test_overrideProfile_changesEnforcement() public {
        // Start: standard profile rejects homogeneous config. Override to `lite`:
        // still rejects homogeneous because `lite` requires 2 distinct operators.
        // This test confirms the override is applied, not that it relaxes everything.
        bytes memory paranoidRaw = UlnConfigCodec.encode(TestFixtures.paranoidConfig());

        // paranoid config fails standard profile's "2 required + threshold ≥ 2" only
        // if it is sized below. It actually passes standard (3 req ≥ 2, 2 zk ≥ 1).
        // So we go the other way: standard config fails paranoid.
        bytes memory standardRaw = UlnConfigCodec.encode(TestFixtures.standardConfig());

        vm.startPrank(admin);
        oapp.overrideProfile(ProfileIds.PARANOID, "test: tighten to paranoid");
        vm.expectRevert(
            abi.encodeWithSelector(DVNValidator.RequiredDVNCountTooLow.selector, uint8(2), uint8(3))
        );
        oapp.setSecureSendConfig(30101, standardRaw);

        // Paranoid config passes under the new profile.
        oapp.setSecureSendConfig(30101, paranoidRaw);
        vm.stopPrank();
    }

    function test_constructor_rejectsUnknownProfile() public {
        vm.expectRevert();
        new MockSecureOApp(address(endpoint), address(registry), keccak256("nonsense"), admin);
    }

    function test_constructor_rejectsZeroAddress() public {
        vm.expectRevert(SecureConfigBase.ZeroAddress.selector);
        new MockSecureOApp(address(0), address(registry), ProfileIds.STANDARD, admin);
    }
}
