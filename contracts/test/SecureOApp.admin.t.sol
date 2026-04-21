// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test, Vm } from "forge-std/Test.sol";
import { MockSecureOApp } from "./mocks/MockSecureOApp.sol";
import { MockEndpoint } from "./mocks/MockEndpoint.sol";
import { DVNRegistry } from "../src/registry/DVNRegistry.sol";
import { ProfileIds } from "../src/libraries/Profiles.sol";
import { UlnConfig, UlnConfigCodec } from "../src/interfaces/IUlnConfig.sol";
import { SecureConfigBase } from "../src/SecureConfigBase.sol";
import { TestFixtures } from "./helpers/TestFixtures.sol";

contract SecureOAppAdminTest is Test {
    MockEndpoint endpoint;
    DVNRegistry registry;
    MockSecureOApp oapp;
    address admin = address(0xA11CE);
    address alice = address(0xA71CE);
    address bob = address(0xB0B);

    function setUp() public {
        endpoint = new MockEndpoint();
        endpoint.setLibraries(address(0x5EDD), address(0x12EC));
        registry = new DVNRegistry(address(this));
        TestFixtures.seedRegistry(registry);
        oapp = new MockSecureOApp(address(endpoint), address(registry), ProfileIds.STANDARD, admin);
    }

    function test_transferSecureAdmin_rotatesControl() public {
        vm.prank(admin);
        oapp.transferSecureAdmin(alice);
        assertEq(oapp.secureAdmin(), alice, "admin must rotate to alice");

        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());
        // old admin is now locked out
        vm.prank(admin);
        vm.expectRevert(SecureConfigBase.NotAdmin.selector);
        oapp.setSecureSendConfig(30101, raw);

        // new admin can act
        vm.prank(alice);
        oapp.setSecureSendConfig(30101, raw);
    }

    function test_transferSecureAdmin_rejectsZeroAddress() public {
        vm.prank(admin);
        vm.expectRevert(SecureConfigBase.ZeroAddress.selector);
        oapp.transferSecureAdmin(address(0));
    }

    function test_transferSecureAdmin_onlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert(SecureConfigBase.NotAdmin.selector);
        oapp.transferSecureAdmin(bob);
    }

    function test_overrideProfile_onlyAdmin() public {
        vm.prank(alice);
        vm.expectRevert(SecureConfigBase.NotAdmin.selector);
        oapp.overrideProfile(ProfileIds.PARANOID, "unauthorized");
    }

    function test_overrideProfile_emitsEvent() public {
        vm.prank(admin);
        vm.recordLogs();
        oapp.overrideProfile(ProfileIds.LITE, "downgrade for testnet");
        Vm.Log[] memory logs = vm.getRecordedLogs();
        assertTrue(logs.length > 0, "expected a ProfileOverride event");
    }

    function test_overrideProfile_rejectsUnknownId() public {
        vm.prank(admin);
        vm.expectRevert();
        oapp.overrideProfile(keccak256("unknown-profile"), "fuzzing");
    }

    function test_secureConfig_storedOnEndpoint() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());
        vm.prank(admin);
        oapp.setSecureSendConfig(30101, raw);
        // MockEndpoint records one call with one param matching our raw bytes
        assertEq(endpoint.callCount(), 1);
    }

    function test_rapidSequenceOfSetConfigs() public {
        bytes memory raw = UlnConfigCodec.encode(TestFixtures.standardConfig());
        vm.startPrank(admin);
        oapp.setSecureSendConfig(30101, raw);
        oapp.setSecureReceiveConfig(30110, raw);
        oapp.setSecureSendConfig(30184, raw);
        vm.stopPrank();
        assertEq(endpoint.callCount(), 3);
    }
}
