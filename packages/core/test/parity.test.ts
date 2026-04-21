import test from "node:test";
import assert from "node:assert/strict";
import { getProfile } from "../src/profiles.js";
import { validate } from "../src/validator.js";
import {
  testRegistry,
  standardConfig,
  insecureSingleConfig,
  homogeneousConfig,
  paranoidConfig,
  liteConfig,
  LZ_DVN,
  NETHERMIND_DVN,
  UNKNOWN_DVN,
} from "./fixtures.js";
import type { UlnConfig, ProfileName } from "../src/types.js";
import type { ValidationError } from "../src/errors.js";

const chainKey = "test-chain";
const registry = testRegistry();

interface ParityCase {
  id: string;
  profile: ProfileName;
  config: UlnConfig;
  expect: "pass" | ValidationError["kind"];
}

/**
 * Parity matrix — mirrors `contracts/test/Parity.t.sol`. If you change a case
 * here without changing it there, the parity guarantee breaks. See
 * `docs/parity-matrix.md` for the authoritative table.
 */
const PARITY_CASES: ParityCase[] = [
  { id: "P1", profile: "standard", config: standardConfig, expect: "pass" },
  { id: "P2", profile: "standard", config: insecureSingleConfig, expect: "RequiredDVNCountTooLow" },
  {
    id: "P3",
    profile: "standard",
    config: homogeneousConfig,
    expect: "ZkDVNCountTooLow",
  },
  {
    id: "P4",
    profile: "standard",
    config: {
      confirmations: 15n,
      requiredDVNCount: 2,
      optionalDVNCount: 0,
      optionalDVNThreshold: 0,
      requiredDVNs: [LZ_DVN, NETHERMIND_DVN],
      optionalDVNs: [],
    },
    expect: "ZkDVNCountTooLow",
  },
  { id: "P5", profile: "paranoid", config: paranoidConfig, expect: "pass" },
  { id: "P6", profile: "paranoid", config: standardConfig, expect: "RequiredDVNCountTooLow" },
  { id: "P7", profile: "lite", config: liteConfig, expect: "pass" },
  { id: "P8", profile: "lite", config: homogeneousConfig, expect: "OperatorDiversityTooLow" },
  {
    id: "P9",
    profile: "standard",
    config: { ...standardConfig, confirmations: 1n },
    expect: "ConfirmationsTooLow",
  },
  {
    id: "P10",
    profile: "standard",
    config: {
      ...standardConfig,
      requiredDVNs: [UNKNOWN_DVN, standardConfig.requiredDVNs[1]!],
    },
    expect: "DVNNotRegistered",
  },
];

for (const c of PARITY_CASES) {
  test(`parity ${c.id}: ${c.profile} profile → ${c.expect}`, () => {
    const result = validate({
      config: c.config,
      profile: getProfile(c.profile),
      chainKey,
      registry,
    });
    if (c.expect === "pass") {
      assert.equal(result.ok, true, `expected PASS but got ${JSON.stringify((result as { errors?: unknown }).errors)}`);
    } else {
      assert.equal(result.ok, false, `expected FAIL(${c.expect}) but config passed`);
      if (!result.ok) {
        const kinds = result.errors.map((e) => e.kind);
        assert.ok(
          kinds.includes(c.expect),
          `expected error kind ${c.expect} to be present. Got: ${kinds.join(", ")}`,
        );
      }
    }
  });
}
