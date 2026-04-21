import test from "node:test";
import assert from "node:assert/strict";
import { encodeUlnConfig, decodeUlnConfig, CONFIG_TYPE_ULN } from "../src/encoding.js";
import { paranoidConfig, liteConfig, standardConfig } from "./fixtures.js";

test("CONFIG_TYPE_ULN constant equals LayerZero's config type 2", () => {
  assert.equal(CONFIG_TYPE_ULN, 2);
});

test("encode → decode round-trip for standard config", () => {
  const raw = encodeUlnConfig(standardConfig);
  const back = decodeUlnConfig(raw);
  assert.equal(back.confirmations, standardConfig.confirmations);
  assert.equal(back.requiredDVNCount, standardConfig.requiredDVNCount);
  assert.equal(back.optionalDVNCount, standardConfig.optionalDVNCount);
  assert.equal(back.optionalDVNThreshold, standardConfig.optionalDVNThreshold);
  assert.deepEqual(
    back.requiredDVNs.map((a) => a.toLowerCase()),
    standardConfig.requiredDVNs.map((a) => a.toLowerCase()),
  );
  assert.deepEqual(
    back.optionalDVNs.map((a) => a.toLowerCase()),
    standardConfig.optionalDVNs.map((a) => a.toLowerCase()),
  );
});

test("encode → decode round-trip preserves paranoid config exactly", () => {
  const raw = encodeUlnConfig(paranoidConfig);
  const back = decodeUlnConfig(raw);
  assert.equal(back.confirmations, paranoidConfig.confirmations);
  assert.equal(back.requiredDVNCount, 3);
  assert.equal(back.optionalDVNCount, 2);
  assert.equal(back.optionalDVNThreshold, 1);
  assert.equal(back.requiredDVNs.length, 3);
  assert.equal(back.optionalDVNs.length, 2);
});

test("encode → decode round-trip for lite config with empty optional", () => {
  const raw = encodeUlnConfig(liteConfig);
  const back = decodeUlnConfig(raw);
  assert.equal(back.optionalDVNs.length, 0);
  assert.equal(back.optionalDVNCount, 0);
});

test("encoded output is deterministic for the same input", () => {
  const raw1 = encodeUlnConfig(standardConfig);
  const raw2 = encodeUlnConfig(standardConfig);
  assert.equal(raw1, raw2);
});

test("encoded output starts with 0x and has even length", () => {
  const raw = encodeUlnConfig(standardConfig);
  assert.match(raw, /^0x[0-9a-fA-F]+$/);
  assert.equal(raw.length % 2, 0);
});
