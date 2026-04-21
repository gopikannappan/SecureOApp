// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Test } from "forge-std/Test.sol";
import { DVNRegistry, DVNOperators } from "../src/registry/DVNRegistry.sol";
import { DVNTag, IDVNRegistry } from "../src/registry/IDVNRegistry.sol";

contract DVNRegistryTest is Test {
    DVNRegistry registry;

    function setUp() public {
        registry = new DVNRegistry(address(this));
    }

    function test_registerAndRead() public {
        registry.register(address(0xA), DVNOperators.LAYERZERO, false);
        assertTrue(registry.isRegistered(address(0xA)));
        DVNTag memory tag = registry.tagOf(address(0xA));
        assertEq(tag.operator, DVNOperators.LAYERZERO);
        assertFalse(tag.isZk);
        assertTrue(tag.verified);
    }

    function test_cannotDoubleRegister() public {
        registry.register(address(0xA), DVNOperators.LAYERZERO, false);
        vm.expectRevert(abi.encodeWithSelector(DVNRegistry.AlreadyRegistered.selector, address(0xA)));
        registry.register(address(0xA), DVNOperators.POLYHEDRA, true);
    }

    function test_remove() public {
        registry.register(address(0xA), DVNOperators.LAYERZERO, false);
        registry.remove(address(0xA));
        assertFalse(registry.isRegistered(address(0xA)));
    }

    function test_onlyOwnerCanRegister() public {
        address stranger = address(0xBEEF);
        vm.prank(stranger);
        vm.expectRevert(DVNRegistry.NotOwner.selector);
        registry.register(address(0xA), DVNOperators.LAYERZERO, false);
    }

    function test_registerBatch() public {
        address[] memory dvns = new address[](2);
        dvns[0] = address(0xA);
        dvns[1] = address(0xB);
        bytes32[] memory ops = new bytes32[](2);
        ops[0] = DVNOperators.LAYERZERO;
        ops[1] = DVNOperators.POLYHEDRA;
        bool[] memory zk = new bool[](2);
        zk[0] = false;
        zk[1] = true;

        registry.registerBatch(dvns, ops, zk);
        assertTrue(registry.isRegistered(address(0xA)));
        assertTrue(registry.isRegistered(address(0xB)));
        assertTrue(registry.tagOf(address(0xB)).isZk);
    }

    function test_tagOf_unknownReverts() public {
        vm.expectRevert(abi.encodeWithSelector(IDVNRegistry.UnknownDVN.selector, address(0x1)));
        registry.tagOf(address(0x1));
    }

    function test_transferOwnership() public {
        address next = address(0xCAFE);
        registry.transferOwnership(next);
        assertEq(registry.owner(), next);

        vm.expectRevert(DVNRegistry.NotOwner.selector);
        registry.register(address(0xA), DVNOperators.LAYERZERO, false);
    }
}
