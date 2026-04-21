// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { Script, console2 } from "forge-std/Script.sol";
import { DVNRegistry, DVNOperators } from "../src/registry/DVNRegistry.sol";

/// @notice Deploys a DVNRegistry on the target chain and seeds it with the
///         known-good DVN addresses for that chain. One-shot script — the
///         registry contract is per-chain, so you run this once per chain
///         with the chain-appropriate address list.
///
/// Usage:
///   SEED_CHAIN=base-sepolia forge script script/DeployRegistry.s.sol \
///     --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $DEPLOYER_PK --broadcast
///
/// The registry owner is set to the broadcaster (the address derived from
/// --private-key). If you want a separate owner, pass DVN_OWNER=0x... in
/// the env — it overrides the default.
///
/// Supported SEED_CHAIN values: ethereum, arbitrum, base, base-sepolia,
/// arbitrum-sepolia, optimism-sepolia, ethereum-sepolia.
contract DeployRegistry is Script {
    struct Entry {
        address dvn;
        bytes32 operator;
        bool isZk;
    }

    function run() external {
        string memory chain = vm.envString("SEED_CHAIN");

        Entry[] memory entries = _seedFor(chain);
        require(entries.length > 0, "DeployRegistry: no entries for SEED_CHAIN");

        vm.startBroadcast();
        // The broadcaster signs the deploy tx; tx.origin inside the broadcast
        // is that address. Use it as the registry owner so register() calls
        // below succeed without needing a second signer. Override by setting
        // DVN_OWNER env if you want ownership to diverge.
        address owner = vm.envOr("DVN_OWNER", tx.origin);
        DVNRegistry registry = new DVNRegistry(owner);
        for (uint256 i; i < entries.length; ++i) {
            registry.register(entries[i].dvn, entries[i].operator, entries[i].isZk);
        }
        vm.stopBroadcast();

        console2.log("DVNRegistry deployed:", address(registry));
        console2.log("Owner:", owner);
        console2.log("Entries registered:", entries.length);
    }

    /// @dev Kept in a single function so the supported chains are discoverable
    ///      by grep. When the TS registry in packages/core is updated, mirror
    ///      the change here.
    function _seedFor(string memory chain) private pure returns (Entry[] memory) {
        bytes32 k = keccak256(bytes(chain));

        if (k == keccak256("base-sepolia")) {
            Entry[] memory e = new Entry[](3);
            e[0] = Entry(0xe1a12515F9AB2764b887bF60B923Ca494EBbB2d6, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0xd9222CC3Ccd1DF7c070d700EA377D4aDA2B86Eb5, DVNOperators.NETHERMIND, false);
            e[2] = Entry(0xe1cdD37c13450bc256A39D27B1e1B5d1BC26ddE2, DVNOperators.HORIZEN, false);
            return e;
        }
        if (k == keccak256("arbitrum-sepolia")) {
            Entry[] memory e = new Entry[](3);
            e[0] = Entry(0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0x3a74F7174709842d3b8a14ce60B4AA2499F2A2F2, DVNOperators.NETHERMIND, false);
            e[2] = Entry(0xc6cec4e6b8F3DC87E676D06A24864081311EDa15, DVNOperators.HORIZEN, false);
            return e;
        }
        if (k == keccak256("optimism-sepolia")) {
            Entry[] memory e = new Entry[](3);
            e[0] = Entry(0xd680ec569f269aa7015F7979b4f1239b5aa4582C, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0x2d15d4e61558480A9300632772E68d8b5e7Cc7e5, DVNOperators.NETHERMIND, false);
            e[2] = Entry(0xC041606700EF1Ae6C0430d7a6f3013cb6AeBdfdB, DVNOperators.HORIZEN, false);
            return e;
        }
        if (k == keccak256("ethereum-sepolia")) {
            Entry[] memory e = new Entry[](6);
            e[0] = Entry(0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0x8718Ef0b818e23bd8A7400a4565A9bc717D2ddBf, DVNOperators.POLYHEDRA, true);
            e[2] = Entry(0x715A4451Be19106BB7CefD81e507813E23C30768, DVNOperators.NETHERMIND, false);
            e[3] = Entry(0x4F675c48FaD936cb4c3cA07d7cBF421CeeAE0C75, DVNOperators.GOOGLE_CLOUD, false);
            e[4] = Entry(0x843139c725c2FB9814dE6A12fB890D8dBf3e1698, DVNOperators.HORIZEN, false);
            e[5] = Entry(0xF21f0282B55B4143251D8e39D3d93E78A78389ab, DVNOperators.STARGATE, false);
            return e;
        }

        // --- mainnets ---
        if (k == keccak256("ethereum")) {
            Entry[] memory e = new Entry[](6);
            e[0] = Entry(0x589dEDbD617e0CBcB916A9223F4d1300c294236b, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0xE014fe8c4d5C23EDB7AC4011F226e869ac7Ef5CC, DVNOperators.POLYHEDRA, true);
            e[2] = Entry(0xF4064220871e3B94Ca6aB3b0CEE8e29178bF47dE, DVNOperators.NETHERMIND, false);
            e[3] = Entry(0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc, DVNOperators.GOOGLE_CLOUD, false);
            e[4] = Entry(0x2f0BA3DbB93CF087e32c15Aab46726FDb4Fb24cf, DVNOperators.HORIZEN, false);
            e[5] = Entry(0x8FafAE7Dd957044088b3d0F67359C327c6200d18, DVNOperators.STARGATE, false);
            return e;
        }
        if (k == keccak256("arbitrum")) {
            Entry[] memory e = new Entry[](5);
            e[0] = Entry(0x2f55C492897526677C5B68fb199ea31E2c126416, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0xE014fe8c4d5C23EDB7AC4011F226e869ac7Ef5CC, DVNOperators.POLYHEDRA, true);
            e[2] = Entry(0xa7b5189bcA84Cd304D8553977c7C614329750d99, DVNOperators.NETHERMIND, false);
            e[3] = Entry(0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc, DVNOperators.GOOGLE_CLOUD, false);
            e[4] = Entry(0x5cfF49d69D79d677Dd3E5B38E048A0DCB6d86aaf, DVNOperators.HORIZEN, false);
            return e;
        }
        if (k == keccak256("base")) {
            Entry[] memory e = new Entry[](5);
            e[0] = Entry(0x9e059a54699a285714207b43B055483E78FAac25, DVNOperators.LAYERZERO, false);
            e[1] = Entry(0xE014fe8c4d5C23EDB7AC4011F226e869ac7Ef5CC, DVNOperators.POLYHEDRA, true);
            e[2] = Entry(0xcd37CA043f8479064e10635020c65FfC005d36f6, DVNOperators.NETHERMIND, false);
            e[3] = Entry(0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc, DVNOperators.GOOGLE_CLOUD, false);
            e[4] = Entry(0x3a4636E9AB975d28d3Af808b4e1c9fd936374E30, DVNOperators.HORIZEN, false);
            return e;
        }

        return new Entry[](0);
    }
}
