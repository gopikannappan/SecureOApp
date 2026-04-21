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
  UNKNOWN_DVN,
} from "./fixtures.js";

const chainKey = "test-chain";
const registry = testRegistry();

test("standard config passes standard profile", () => {
  const r = validate({ config: standardConfig, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, true);
});

test("1/1 config fails standard (RequiredDVNCountTooLow)", () => {
  const r = validate({ config: insecureSingleConfig, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.kind === "RequiredDVNCountTooLow"));
});

test("homogeneous config fails standard for ZK and operator diversity", () => {
  const r = validate({ config: homogeneousConfig, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  const kinds = r.errors.map((e) => e.kind);
  assert.ok(kinds.includes("ZkDVNCountTooLow"));
  assert.ok(kinds.includes("OperatorDiversityTooLow"));
});

test("homogeneous config fails lite for operator diversity only", () => {
  const r = validate({ config: homogeneousConfig, profile: getProfile("lite"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  const kinds = r.errors.map((e) => e.kind);
  assert.ok(kinds.includes("OperatorDiversityTooLow"));
  assert.ok(!kinds.includes("ZkDVNCountTooLow"));
});

test("paranoid config passes paranoid profile", () => {
  const r = validate({ config: paranoidConfig, profile: getProfile("paranoid"), chainKey, registry });
  assert.equal(r.ok, true);
});

test("lite config passes lite profile", () => {
  const r = validate({ config: liteConfig, profile: getProfile("lite"), chainKey, registry });
  assert.equal(r.ok, true);
});

test("standard config fails paranoid profile (count + threshold + zk)", () => {
  const r = validate({ config: standardConfig, profile: getProfile("paranoid"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  const kinds = r.errors.map((e) => e.kind);
  assert.ok(kinds.includes("RequiredDVNCountTooLow"));
  assert.ok(kinds.includes("EffectiveThresholdTooLow"));
  assert.ok(kinds.includes("ZkDVNCountTooLow"));
});

test("unregistered DVN is flagged", () => {
  const cfg = { ...standardConfig, requiredDVNs: [UNKNOWN_DVN, standardConfig.requiredDVNs[1]!] };
  const r = validate({ config: cfg, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.kind === "DVNNotRegistered"));
});

test("duplicate DVN is flagged", () => {
  const cfg = { ...standardConfig, requiredDVNs: [standardConfig.requiredDVNs[0]!, standardConfig.requiredDVNs[0]!] };
  const r = validate({ config: cfg, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.kind === "DuplicateDVN"));
});

test("low confirmations flagged", () => {
  const cfg = { ...standardConfig, confirmations: 1n };
  const r = validate({ config: cfg, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.kind === "ConfirmationsTooLow"));
});

test("invalid optional threshold flagged", () => {
  const cfg = { ...standardConfig, optionalDVNCount: 1, optionalDVNThreshold: 2 };
  const r = validate({ config: cfg, profile: getProfile("standard"), chainKey, registry });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errors.some((e) => e.kind === "InvalidOptionalThreshold"));
});

test("summary reports effective threshold and zk count", () => {
  const r = validate({ config: paranoidConfig, profile: getProfile("paranoid"), chainKey, registry });
  assert.equal(r.ok, true);
  assert.equal(r.summary.effectiveThreshold, 4);
  assert.equal(r.summary.zkDVNCount, 2);
  assert.equal(r.summary.distinctOperators, 5);
});
