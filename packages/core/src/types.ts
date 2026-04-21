import type { Address, Hex } from "viem";

/** Matches `UlnConfig` in contracts/src/interfaces/IUlnConfig.sol. */
export interface UlnConfig {
  confirmations: bigint;
  requiredDVNCount: number;
  optionalDVNCount: number;
  optionalDVNThreshold: number;
  requiredDVNs: Address[];
  optionalDVNs: Address[];
}

/** Matches `Profile` in contracts/src/libraries/Profiles.sol. */
export interface Profile {
  id: Hex;
  name: ProfileName;
  minRequiredDVNCount: number;
  minEffectiveThreshold: number;
  minZkDVNCount: number;
  minDistinctOperators: number;
  minConfirmations: bigint;
}

export type ProfileName = "standard" | "paranoid" | "lite";

/** Matches `DVNTag` in contracts/src/registry/IDVNRegistry.sol. */
export interface DVNTag {
  operator: OperatorId;
  isZk: boolean;
  verified: boolean;
}

export type OperatorId =
  | "layerzero-labs"
  | "polyhedra"
  | "succinct"
  | "nethermind"
  | "google-cloud"
  | "animoca"
  | "horizen-labs"
  | "stargate"
  | (string & {});

export interface DVNEntry extends DVNTag {
  address: Address;
  chainKey: ChainKey;
  notes?: string;
}

/**
 * Chain identifier used by the registry. Distinct from LayerZero's `eid`
 * because the registry is keyed by execution chain, not by LZ endpoint.
 */
export type ChainKey =
  | "ethereum"
  | "arbitrum"
  | "optimism"
  | "base"
  | "bsc"
  | "polygon"
  | "avalanche"
  | "ethereum-sepolia"
  | "arbitrum-sepolia"
  | "optimism-sepolia"
  | "base-sepolia"
  | "bsc-testnet"
  | (string & {});

export interface ChainRegistry {
  chainKey: ChainKey;
  lzEid: number;
  dvns: DVNEntry[];
}
