import type { Address } from "viem";
import type { ChainKey, ChainRegistry, DVNEntry } from "../types.js";

/**
 * Seed registry data. Every entry below was verified against LayerZero's live
 * metadata feed on 2026-04-21:
 *   https://metadata.layerzero-api.com/v1/metadata/dvns
 *   https://metadata.layerzero-api.com/v1/metadata
 *
 * Addresses are stored lowercase — we match case-insensitively in the lookup
 * path and viem's address validation is strict about checksums.
 *
 * When operators rotate addresses, update here and open a PR with a link to
 * the operator's announcement. The on-chain `DVNRegistry` contract is the
 * authoritative trust anchor; this file is the off-chain mirror the CLI
 * uses for pre-flight validation.
 */

type Seed = Omit<DVNEntry, "chainKey">;

function make(chainKey: ChainKey, lzEid: number, seeds: Seed[]): ChainRegistry {
  return {
    chainKey,
    lzEid,
    dvns: seeds.map((s) => ({ ...s, chainKey })),
  };
}

const addr = (s: string): Address => s.toLowerCase() as Address;

export const REGISTRY: Record<ChainKey, ChainRegistry> = {
  // ------------------------------------------------------------ mainnets
  ethereum: make("ethereum", 30101, [
    {
      address: addr("0x589dEDbD617e0CBcB916A9223F4d1300c294236b"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xf4064220871e3b94ca6ab3b0cee8e29178bf47de"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x2f0ba3dbb93cf087e32c15aab46726fdb4fb24cf"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x5fddd320a1e29bb466fa635661b125d51d976f92"),
      operator: "stablelab",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x8fafae7dd957044088b3d0f67359c327c6200d18"),
      operator: "stargate",
      isZk: false,
      verified: true,
    },
  ]),
  arbitrum: make("arbitrum", 30110, [
    {
      address: addr("0x2f55c492897526677c5b68fb199ea31e2c126416"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xa7b5189bca84cd304d8553977c7c614329750d99"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x5cff49d69d79d677dd3e5b38e048a0dcb6d86aaf"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  optimism: make("optimism", 30111, [
    {
      address: addr("0x6a02d83e8d433304bba74ef1c427913958187142"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xa7b5189bca84cd304d8553977c7c614329750d99"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x9e930731cb4a6bf7ecc11f695a295c60bdd212eb"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  base: make("base", 30184, [
    {
      address: addr("0x9e059a54699a285714207b43b055483e78faac25"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xcd37ca043f8479064e10635020c65ffc005d36f6"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x3a4636e9ab975d28d3af808b4e1c9fd936374e30"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  bsc: make("bsc", 30102, [
    {
      address: addr("0xfd6865c841c2d64565562fcc7e05e619a30615f0"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0x31f748a368a893bdb5abb67ec95f232507601a73"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x81d8516adae92b655acaf6a04c9526716baeb849"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xabc9b1819cc4d9846550f928b985993cf6240439"),
      operator: "stablelab",
      isZk: false,
      verified: true,
    },
  ]),
  polygon: make("polygon", 30109, [
    {
      address: addr("0x23de2fe932d9043291f870324b74f820e11dc81a"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0x31f748a368a893bdb5abb67ec95f232507601a73"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x5cff49d69d79d677dd3e5b38e048a0dcb6d86aaf"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xabc9b1819cc4d9846550f928b985993cf6240439"),
      operator: "stablelab",
      isZk: false,
      verified: true,
    },
  ]),
  avalanche: make("avalanche", 30106, [
    {
      address: addr("0x962f502a63f5fbeb44dc9ab932122648e8352959"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xa59ba433ac34d2927232918ef5b2eaafcf130ba5"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd56e4eab23cb81f43168f9f45211eb027b9ac7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x07c05eab7716acb6f83ebf6268f8eecda8892ba1"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x5fddd320a1e29bb466fa635661b125d51d976f92"),
      operator: "stablelab",
      isZk: false,
      verified: true,
    },
  ]),
  // ------------------------------------------------------------ testnets
  "ethereum-sepolia": make("ethereum-sepolia", 40161, [
    {
      address: addr("0x8eebf8b423b73bfca51a1db4b7354aa0bfca9193"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x8718ef0b818e23bd8a7400a4565a9bc717d2ddbf"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0x715a4451be19106bb7cefd81e507813e23c30768"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x4f675c48fad936cb4c3ca07d7cbf421ceeae0c75"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x843139c725c2fb9814de6a12fb890d8dbf3e1698"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xf21f0282b55b4143251d8e39d3d93e78a78389ab"),
      operator: "stablelab",
      isZk: false,
      verified: true,
    },
  ]),
  "arbitrum-sepolia": make("arbitrum-sepolia", 40231, [
    {
      address: addr("0x53f488e93b4f1b60e8e83aa374dbe1780a1ee8a8"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x3a74f7174709842d3b8a14ce60b4aa2499f2a2f2"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xc6cec4e6b8f3dc87e676d06a24864081311eda15"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "optimism-sepolia": make("optimism-sepolia", 40232, [
    {
      address: addr("0xd680ec569f269aa7015f7979b4f1239b5aa4582c"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x2d15d4e61558480a9300632772e68d8b5e7cc7e5"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xc041606700ef1ae6c0430d7a6f3013cb6aebdfdb"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "base-sepolia": make("base-sepolia", 40245, [
    {
      address: addr("0xe1a12515f9ab2764b887bf60b923ca494ebbb2d6"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xd9222cc3ccd1df7c070d700ea377d4ada2b86eb5"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xe1cdd37c13450bc256a39d27b1e1b5d1bc26dde2"),
      operator: "horizen-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "bsc-testnet": make("bsc-testnet", 40102, [
    {
      address: addr("0x0ee552262f7b562efcee442d9ab12e1ed18c3b38"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
};

/**
 * Canonical LayerZero V2 endpoint addresses per environment. Constant across
 * every chain in the same environment as of the April 2026 deployments.
 */
export const LZ_ENDPOINTS_V2 = {
  mainnet: "0x1a44076050125825900e736c501f859c50fE728c",
  testnet: "0x6EDCE65403992e310A62460808c4b910D972f10f",
} as const;

export function listChains(): ChainKey[] {
  return Object.keys(REGISTRY) as ChainKey[];
}
