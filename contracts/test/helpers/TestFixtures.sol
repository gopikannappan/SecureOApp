// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { DVNRegistry, DVNOperators } from "../../src/registry/DVNRegistry.sol";
import { UlnConfig } from "../../src/interfaces/IUlnConfig.sol";

library TestFixtures {
    // Deterministic test DVN addresses. Not real addresses — for unit tests only.
    address internal constant LZ_DVN = address(0xA0);
    address internal constant NETHERMIND_DVN = address(0xB0);
    address internal constant POLYHEDRA_ZK = address(0xC0);
    address internal constant SUCCINCT_ZK = address(0xD0);
    address internal constant GOOGLE_DVN = address(0xE0);
    address internal constant LZ_DVN_2 = address(0xA1); // second LZ DVN — same operator
    address internal constant UNKNOWN_DVN = address(0xDEAD);

    function seedRegistry(DVNRegistry r) internal {
        r.register(LZ_DVN, DVNOperators.LAYERZERO, false);
        r.register(LZ_DVN_2, DVNOperators.LAYERZERO, false);
        r.register(NETHERMIND_DVN, DVNOperators.NETHERMIND, false);
        r.register(POLYHEDRA_ZK, DVNOperators.POLYHEDRA, true);
        r.register(SUCCINCT_ZK, DVNOperators.SUCCINCT, true);
        r.register(GOOGLE_DVN, DVNOperators.GOOGLE_CLOUD, false);
    }

    /// @dev 2/3 with ZK — satisfies `standard` profile.
    function standardConfig() internal pure returns (UlnConfig memory) {
        address[] memory req = new address[](2);
        req[0] = POLYHEDRA_ZK;
        req[1] = NETHERMIND_DVN;
        address[] memory opt = new address[](1);
        opt[0] = LZ_DVN;
        return UlnConfig({
            confirmations: 15,
            requiredDVNCount: 2,
            optionalDVNCount: 1,
            optionalDVNThreshold: 0,
            requiredDVNs: req,
            optionalDVNs: opt
        });
    }

    /// @dev 1/1 — the classic insecure config.
    function insecureSingleConfig() internal pure returns (UlnConfig memory) {
        address[] memory req = new address[](1);
        req[0] = LZ_DVN;
        address[] memory opt = new address[](0);
        return UlnConfig({
            confirmations: 15,
            requiredDVNCount: 1,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: req,
            optionalDVNs: opt
        });
    }

    /// @dev 2/2 homogeneous — two LZ DVNs, no diversity.
    function homogeneousConfig() internal pure returns (UlnConfig memory) {
        address[] memory req = new address[](2);
        req[0] = LZ_DVN;
        req[1] = LZ_DVN_2;
        address[] memory opt = new address[](0);
        return UlnConfig({
            confirmations: 15,
            requiredDVNCount: 2,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: req,
            optionalDVNs: opt
        });
    }

    /// @dev 3/5 with two ZK — satisfies `paranoid` profile.
    function paranoidConfig() internal pure returns (UlnConfig memory) {
        address[] memory req = new address[](3);
        req[0] = POLYHEDRA_ZK;
        req[1] = SUCCINCT_ZK;
        req[2] = NETHERMIND_DVN;
        address[] memory opt = new address[](2);
        opt[0] = LZ_DVN;
        opt[1] = GOOGLE_DVN;
        return UlnConfig({
            confirmations: 30,
            requiredDVNCount: 3,
            optionalDVNCount: 2,
            optionalDVNThreshold: 1,
            requiredDVNs: req,
            optionalDVNs: opt
        });
    }

    /// @dev 2/2 no ZK — satisfies `lite` profile.
    function liteConfig() internal pure returns (UlnConfig memory) {
        address[] memory req = new address[](2);
        req[0] = LZ_DVN;
        req[1] = NETHERMIND_DVN;
        address[] memory opt = new address[](0);
        return UlnConfig({
            confirmations: 1,
            requiredDVNCount: 2,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: req,
            optionalDVNs: opt
        });
    }
}
