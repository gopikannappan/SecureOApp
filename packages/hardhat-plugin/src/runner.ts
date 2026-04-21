import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  ChainKey,
  ProfileName,
  UlnConfig,
  SecurityMdInput,
} from "@secure-oapp/core";

type Address = `0x${string}`;

export interface SecureConfigFile {
  profile: ProfileName;
  lanes: Array<{
    srcChain: ChainKey;
    dstChain: ChainKey;
    oappAddress: Address;
    send: Serialized;
    receive: Serialized;
  }>;
}

export interface Serialized {
  confirmations: number | string;
  requiredDVNCount: number;
  optionalDVNCount: number;
  optionalDVNThreshold: number;
  requiredDVNs: Address[];
  optionalDVNs: Address[];
}

export interface RunOutcome {
  ok: boolean;
  lanes: Array<{ lane: string; ok: boolean; errors: string[] }>;
  securityMd: string;
}

/**
 * Loaded dynamically because `@secure-oapp/core` is ESM-only and this
 * package compiles to CJS (Hardhat v2 is CJS). Keeping the import lazy
 * means the runner can live in a module-system-agnostic shape.
 */
async function core() {
  return await import("@secure-oapp/core");
}

export async function loadAndValidate(params: {
  configPath: string;
  profileOverride?: ProfileName;
  projectName?: string;
}): Promise<RunOutcome> {
  const { getProfile, validate, renderSecurityMd, formatValidationError } = await core();

  const raw = await readFile(resolve(params.configPath), "utf8");
  const file = JSON.parse(raw) as SecureConfigFile;
  const profile = getProfile(params.profileOverride ?? file.profile);

  const deployments: SecurityMdInput["deployments"][number][] = [];
  const laneResults: RunOutcome["lanes"] = [];
  let allOk = true;

  for (const lane of file.lanes) {
    const laneLabel = `${lane.srcChain} → ${lane.dstChain}`;
    const send = toUln(lane.send);
    const recv = toUln(lane.receive);
    const s = validate({ config: send, profile, chainKey: lane.srcChain });
    const r = validate({ config: recv, profile, chainKey: lane.dstChain });

    const errors: string[] = [];
    if (!s.ok) for (const e of s.errors) errors.push(`send: ${formatValidationError(e)}`);
    if (!r.ok) for (const e of r.errors) errors.push(`recv: ${formatValidationError(e)}`);

    const laneOk = s.ok && r.ok;
    laneResults.push({ lane: laneLabel, ok: laneOk, errors });

    if (laneOk && s.ok && r.ok) {
      deployments.push({
        srcChain: lane.srcChain,
        dstChain: lane.dstChain,
        oappAddress: lane.oappAddress,
        sendConfig: send,
        receiveConfig: recv,
        summarySend: s.summary,
        summaryRecv: r.summary,
      });
    }
    if (!laneOk) allOk = false;
  }

  const securityMd = renderSecurityMd({
    projectName: params.projectName ?? "hardhat-oapp",
    profile,
    deployments,
  });

  return { ok: allOk, lanes: laneResults, securityMd };
}

export async function writeSecurityMd(path: string, md: string): Promise<void> {
  await writeFile(resolve(path), md);
}

function toUln(s: Serialized): UlnConfig {
  return {
    confirmations: BigInt(s.confirmations),
    requiredDVNCount: s.requiredDVNCount,
    optionalDVNCount: s.optionalDVNCount,
    optionalDVNThreshold: s.optionalDVNThreshold,
    requiredDVNs: s.requiredDVNs,
    optionalDVNs: s.optionalDVNs,
  };
}
