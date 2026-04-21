import { keccak256, toBytes } from "viem";
import type { Profile, ProfileName } from "./types.js";

const id = (s: string) => keccak256(toBytes(s));

/**
 * Profile IDs must match the Solidity side exactly — these constants are
 * shared between on-chain enforcement and off-chain validation via keccak
 * of a canonical version string.
 */
export const PROFILE_IDS = {
  standard: id("secure-oapp.profile.standard.v1"),
  paranoid: id("secure-oapp.profile.paranoid.v1"),
  lite: id("secure-oapp.profile.lite.v1"),
} as const satisfies Record<ProfileName, `0x${string}`>;

export const PROFILES: Record<ProfileName, Profile> = {
  standard: {
    id: PROFILE_IDS.standard,
    name: "standard",
    minRequiredDVNCount: 2,
    minEffectiveThreshold: 2,
    minZkDVNCount: 1,
    minDistinctOperators: 2,
    minConfirmations: 5n,
  },
  paranoid: {
    id: PROFILE_IDS.paranoid,
    name: "paranoid",
    minRequiredDVNCount: 3,
    minEffectiveThreshold: 3,
    minZkDVNCount: 2,
    minDistinctOperators: 3,
    minConfirmations: 15n,
  },
  lite: {
    id: PROFILE_IDS.lite,
    name: "lite",
    minRequiredDVNCount: 2,
    minEffectiveThreshold: 2,
    minZkDVNCount: 0,
    minDistinctOperators: 2,
    minConfirmations: 1n,
  },
};

export function getProfile(name: ProfileName): Profile {
  const p = PROFILES[name];
  if (!p) throw new Error(`Unknown profile: ${name}`);
  return p;
}

export function profileNameFromId(id: `0x${string}`): ProfileName {
  for (const [name, profile] of Object.entries(PROFILES) as [ProfileName, Profile][]) {
    if (profile.id.toLowerCase() === id.toLowerCase()) return name;
  }
  throw new Error(`Unknown profile id: ${id}`);
}
