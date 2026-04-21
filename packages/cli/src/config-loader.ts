import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Address } from "viem";
import type { ChainKey, ProfileName, UlnConfig } from "@secure-oapp/core";

export interface SecureOAppConfigFile {
  profile: ProfileName;
  lanes: LaneConfigFile[];
}

export interface LaneConfigFile {
  srcChain: ChainKey;
  dstChain: ChainKey;
  oappAddress: Address;
  send: UlnConfigSerialized;
  receive: UlnConfigSerialized;
}

export interface UlnConfigSerialized {
  confirmations: number | string;
  requiredDVNCount: number;
  optionalDVNCount: number;
  optionalDVNThreshold: number;
  requiredDVNs: Address[];
  optionalDVNs: Address[];
}

export async function loadConfigFile(path: string): Promise<SecureOAppConfigFile> {
  const abs = resolve(process.cwd(), path);
  const raw = await readFile(abs, "utf8");
  const json = JSON.parse(raw) as SecureOAppConfigFile;
  validateShape(json, abs);
  return json;
}

export function toUlnConfig(c: UlnConfigSerialized): UlnConfig {
  return {
    confirmations: BigInt(c.confirmations),
    requiredDVNCount: c.requiredDVNCount,
    optionalDVNCount: c.optionalDVNCount,
    optionalDVNThreshold: c.optionalDVNThreshold,
    requiredDVNs: c.requiredDVNs,
    optionalDVNs: c.optionalDVNs,
  };
}

function validateShape(c: SecureOAppConfigFile, path: string): void {
  if (!c || typeof c !== "object") throw new Error(`${path}: invalid config`);
  if (!c.profile) throw new Error(`${path}: missing "profile"`);
  if (!Array.isArray(c.lanes)) throw new Error(`${path}: "lanes" must be an array`);
  for (const [i, lane] of c.lanes.entries()) {
    if (!lane.srcChain) throw new Error(`${path}: lane[${i}] missing srcChain`);
    if (!lane.dstChain) throw new Error(`${path}: lane[${i}] missing dstChain`);
    if (!lane.oappAddress) throw new Error(`${path}: lane[${i}] missing oappAddress`);
    if (!lane.send || !lane.receive) throw new Error(`${path}: lane[${i}] missing send/receive`);
  }
}
