import type { ChainKey, Profile, UlnConfig } from "./types.js";
import { DVNRegistryClient, defaultRegistry } from "./registry/index.js";
import type { ValidationError } from "./errors.js";

export type ValidationResult =
  | { ok: true; summary: ValidationSummary }
  | { ok: false; errors: ValidationError[]; summary: ValidationSummary };

export interface ValidationSummary {
  requiredDVNCount: number;
  optionalDVNCount: number;
  optionalDVNThreshold: number;
  effectiveThreshold: number;
  zkDVNCount: number;
  distinctOperators: number;
  confirmations: bigint;
}

export interface ValidateOptions {
  config: UlnConfig;
  profile: Profile;
  chainKey: ChainKey;
  registry?: DVNRegistryClient;
}

/**
 * Pure validation. Mirrors `DVNValidator.validate` in Solidity. Collects all
 * violations instead of short-circuiting on the first one — the CLI surfaces
 * every issue at once so the developer can fix them in a single pass.
 */
export function validate({ config, profile, chainKey, registry = defaultRegistry() }: ValidateOptions): ValidationResult {
  const errors: ValidationError[] = [];

  if (config.requiredDVNCount < profile.minRequiredDVNCount) {
    errors.push({
      kind: "RequiredDVNCountTooLow",
      actual: config.requiredDVNCount,
      min: profile.minRequiredDVNCount,
    });
  }

  if (config.optionalDVNThreshold > config.optionalDVNCount) {
    errors.push({
      kind: "InvalidOptionalThreshold",
      threshold: config.optionalDVNThreshold,
      optionalCount: config.optionalDVNCount,
    });
  }

  const effectiveThreshold = config.requiredDVNCount + config.optionalDVNThreshold;
  if (effectiveThreshold < profile.minEffectiveThreshold) {
    errors.push({
      kind: "EffectiveThresholdTooLow",
      actual: effectiveThreshold,
      min: profile.minEffectiveThreshold,
    });
  }

  if (config.confirmations < profile.minConfirmations) {
    errors.push({
      kind: "ConfirmationsTooLow",
      actual: config.confirmations,
      min: profile.minConfirmations,
    });
  }

  const seen = new Set<string>();
  for (const dvn of [...config.requiredDVNs, ...config.optionalDVNs]) {
    const key = dvn.toLowerCase();
    if (seen.has(key)) errors.push({ kind: "DuplicateDVN", dvn });
    seen.add(key);
  }

  let zkDVNCount = 0;
  const operators = new Set<string>();
  for (const dvn of [...config.requiredDVNs, ...config.optionalDVNs]) {
    if (!registry.isRegistered(chainKey, dvn)) {
      errors.push({ kind: "DVNNotRegistered", dvn });
      continue;
    }
    const tag = registry.tagOf(chainKey, dvn);
    if (tag.isZk) zkDVNCount += 1;
    operators.add(tag.operator);
  }

  if (zkDVNCount < profile.minZkDVNCount) {
    errors.push({ kind: "ZkDVNCountTooLow", actual: zkDVNCount, min: profile.minZkDVNCount });
  }

  if (operators.size < profile.minDistinctOperators) {
    errors.push({
      kind: "OperatorDiversityTooLow",
      actual: operators.size,
      min: profile.minDistinctOperators,
    });
  }

  const summary: ValidationSummary = {
    requiredDVNCount: config.requiredDVNCount,
    optionalDVNCount: config.optionalDVNCount,
    optionalDVNThreshold: config.optionalDVNThreshold,
    effectiveThreshold,
    zkDVNCount,
    distinctOperators: operators.size,
    confirmations: config.confirmations,
  };

  if (errors.length > 0) return { ok: false, errors, summary };
  return { ok: true, summary };
}
