import type { Address } from "viem";
import type { ChainRegistry, UlnConfig, ChainKey } from "../src/types.js";
import { DVNRegistryClient } from "../src/registry/index.js";

export const LZ_DVN: Address = "0x00000000000000000000000000000000000000A0";
export const LZ_DVN_2: Address = "0x00000000000000000000000000000000000000A1";
export const NETHERMIND_DVN: Address = "0x00000000000000000000000000000000000000B0";
export const POLYHEDRA_ZK: Address = "0x00000000000000000000000000000000000000C0";
export const SUCCINCT_ZK: Address = "0x00000000000000000000000000000000000000D0";
export const GOOGLE_DVN: Address = "0x00000000000000000000000000000000000000E0";
export const UNKNOWN_DVN: Address = "0x000000000000000000000000000000000000dEaD";

export function testRegistry(): DVNRegistryClient {
  const chain: ChainRegistry = {
    chainKey: "test-chain",
    lzEid: 999999,
    dvns: [
      { chainKey: "test-chain", address: LZ_DVN, operator: "layerzero-labs", isZk: false, verified: true },
      { chainKey: "test-chain", address: LZ_DVN_2, operator: "layerzero-labs", isZk: false, verified: true },
      { chainKey: "test-chain", address: NETHERMIND_DVN, operator: "nethermind", isZk: false, verified: true },
      { chainKey: "test-chain", address: POLYHEDRA_ZK, operator: "polyhedra", isZk: true, verified: true },
      { chainKey: "test-chain", address: SUCCINCT_ZK, operator: "succinct", isZk: true, verified: true },
      { chainKey: "test-chain", address: GOOGLE_DVN, operator: "google-cloud", isZk: false, verified: true },
    ],
  };
  return new DVNRegistryClient({ "test-chain": chain } as unknown as Record<ChainKey, ChainRegistry>);
}

export const standardConfig: UlnConfig = {
  confirmations: 15n,
  requiredDVNCount: 2,
  optionalDVNCount: 1,
  optionalDVNThreshold: 0,
  requiredDVNs: [POLYHEDRA_ZK, NETHERMIND_DVN],
  optionalDVNs: [LZ_DVN],
};

export const insecureSingleConfig: UlnConfig = {
  confirmations: 15n,
  requiredDVNCount: 1,
  optionalDVNCount: 0,
  optionalDVNThreshold: 0,
  requiredDVNs: [LZ_DVN],
  optionalDVNs: [],
};

export const homogeneousConfig: UlnConfig = {
  confirmations: 15n,
  requiredDVNCount: 2,
  optionalDVNCount: 0,
  optionalDVNThreshold: 0,
  requiredDVNs: [LZ_DVN, LZ_DVN_2],
  optionalDVNs: [],
};

export const paranoidConfig: UlnConfig = {
  confirmations: 30n,
  requiredDVNCount: 3,
  optionalDVNCount: 2,
  optionalDVNThreshold: 1,
  requiredDVNs: [POLYHEDRA_ZK, SUCCINCT_ZK, NETHERMIND_DVN],
  optionalDVNs: [LZ_DVN, GOOGLE_DVN],
};

export const liteConfig: UlnConfig = {
  confirmations: 1n,
  requiredDVNCount: 2,
  optionalDVNCount: 0,
  optionalDVNThreshold: 0,
  requiredDVNs: [LZ_DVN, NETHERMIND_DVN],
  optionalDVNs: [],
};
