import type { Address } from "viem";
import type { ChainKey, ChainRegistry, DVNEntry } from "../types.js";

/**
 * Seed registry data for v0.1. Sourced from LayerZero's published DVN docs
 * as of April 2026. Addresses are canonical at time of writing but operators
 * rotate addresses; `secure-oapp update-registry` regenerates this file
 * against the live LayerZero metadata feed.
 *
 * DO NOT rely on these addresses without running `secure-oapp validate`
 * against the live registry — this constant is the fallback, not the truth.
 */

type Seed = Omit<DVNEntry, "chainKey">;

function make(
  chainKey: ChainKey,
  lzEid: number,
  seeds: Seed[],
): ChainRegistry {
  return {
    chainKey,
    lzEid,
    dvns: seeds.map((s) => ({ ...s, chainKey })),
  };
}

const addr = (s: string): Address => s as Address;

export const REGISTRY: Record<ChainKey, ChainRegistry> = {
  ethereum: make("ethereum", 30101, [
    {
      address: addr("0x589dEDbD617e0CBcB916A9223F4d1300c294236b"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
      notes: "LayerZero Labs canonical DVN",
    },
    {
      address: addr("0x8FafAE7Dd957044088b3d0F67359C327c6200d18"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
      notes: "Polyhedra zkBridge DVN",
    },
    {
      address: addr("0xa59BA433ac34D2927232918Ef5B2eaAfcF130BA5"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xD56e4eAb23cb81f43168F9F45211Eb027b9aC7cc"),
      operator: "google-cloud",
      isZk: false,
      verified: true,
    },
  ]),
  arbitrum: make("arbitrum", 30110, [
    {
      address: addr("0x2f55C492897526677C5B68fb199ea31E2c126416"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x8FafAE7Dd957044088b3d0F67359C327c6200d18"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xa7b5189bcA84Cd304D8553977c7C614329750d99"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
  ]),
  optimism: make("optimism", 30111, [
    {
      address: addr("0x6A02D83e8d433304bba74EF1c427913958187142"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0xa7b5189bcA84Cd304D8553977c7C614329750d99"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
  ]),
  base: make("base", 30184, [
    {
      address: addr("0x9e059a54699a285714207b43B055483E78FAac25"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x8FafAE7Dd957044088b3d0F67359C327c6200d18"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
    {
      address: addr("0xcd37CA043f8479064e10635020c65FfC005d36f6"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
  ]),
  bnb: make("bnb", 30102, [
    {
      address: addr("0xfD6865c841c2d64565562fCc7e05e619A30615f0"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x31F748a368a893Bdb5aBB67ec95F232507601A73"),
      operator: "nethermind",
      isZk: false,
      verified: true,
    },
    {
      address: addr("0x247624e2143504730aeC22912ed41F092498bEf2"),
      operator: "polyhedra",
      isZk: true,
      verified: true,
    },
  ]),
  polygon: make("polygon", 30109, [
    {
      address: addr("0x23DE2FE932d9043291f870324B74F820e11dc81A"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  avalanche: make("avalanche", 30106, [
    {
      address: addr("0x962F502A63F5FBeB44DC9ab932122648E8352959"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  // --- Testnets (verification deferred; developers deploying testnet OApps
  //     should update these via secure-oapp register). ---
  "ethereum-sepolia": make("ethereum-sepolia", 40161, [
    {
      address: addr("0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "arbitrum-sepolia": make("arbitrum-sepolia", 40231, [
    {
      address: addr("0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "optimism-sepolia": make("optimism-sepolia", 40232, [
    {
      address: addr("0xd680ec569f269aa7015F7979b4f1239b5aa4582C"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "base-sepolia": make("base-sepolia", 40245, [
    {
      address: addr("0xe1a12515F9AB2764b887bF60192924C815d62A81"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
  "bnb-testnet": make("bnb-testnet", 40102, [
    {
      address: addr("0x0eE552262f7B562eFCEE442d9aB12E1ED18c3B38"),
      operator: "layerzero-labs",
      isZk: false,
      verified: true,
    },
  ]),
};

export function listChains(): ChainKey[] {
  return Object.keys(REGISTRY) as ChainKey[];
}
