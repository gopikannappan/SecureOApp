import test from "node:test";
import assert from "node:assert/strict";
import { defaultRegistry, listChains } from "../src/registry/index.js";

test("listChains includes expected mainnets and testnets", () => {
  const chains = listChains();
  assert.ok(chains.includes("ethereum"));
  assert.ok(chains.includes("arbitrum"));
  assert.ok(chains.includes("base"));
  assert.ok(chains.includes("bsc"));
  assert.ok(chains.includes("base-sepolia"));
  assert.ok(chains.includes("arbitrum-sepolia"));
});

test("defaultRegistry.forChain returns entries for known chains", () => {
  const r = defaultRegistry();
  const arb = r.forChain("arbitrum");
  assert.equal(arb.chainKey, "arbitrum");
  assert.ok(arb.dvns.length > 0);
  assert.ok(arb.dvns.some((d) => d.isZk), "expected at least one ZK DVN on arbitrum");
  assert.ok(arb.dvns.some((d) => d.operator === "layerzero-labs"));
});

test("forChain throws for unknown chain", () => {
  const r = defaultRegistry();
  assert.throws(() => r.forChain("not-a-chain"), /No registry entries/);
});

test("lookup finds registered DVN case-insensitively", () => {
  const r = defaultRegistry();
  const arb = r.forChain("arbitrum");
  const known = arb.dvns[0]!;
  const upper = known.address.toUpperCase() as `0x${string}`;
  assert.ok(r.lookup("arbitrum", upper.toLowerCase() as `0x${string}`));
});

test("isRegistered returns false for unknown addresses", () => {
  const r = defaultRegistry();
  const unknown = "0x000000000000000000000000000000000000dEaD";
  assert.equal(r.isRegistered("arbitrum", unknown), false);
});

test("suggestDVNs prioritizes ZK when required", () => {
  const r = defaultRegistry();
  const picks = r.suggestDVNs("arbitrum", { requireZk: true, count: 2 });
  assert.ok(picks.length >= 1, "should return at least one suggestion");
  assert.ok(picks.some((d) => d.isZk), "first selection should include a ZK DVN when requested");
});

test("suggestDVNs prefers operator diversity", () => {
  const r = defaultRegistry();
  const picks = r.suggestDVNs("ethereum", { requireZk: false, count: 3 });
  const operators = new Set(picks.map((d) => d.operator));
  assert.equal(operators.size, picks.length, "all suggested DVNs should be from distinct operators");
});

test("suggestDVNs returns up to `count` DVNs", () => {
  const r = defaultRegistry();
  const picks = r.suggestDVNs("arbitrum", { requireZk: true, count: 2 });
  assert.ok(picks.length <= 2);
});

test("tagOf throws for unregistered address", () => {
  const r = defaultRegistry();
  assert.throws(() => r.tagOf("arbitrum", "0x000000000000000000000000000000000000dEaD"), /not registered/);
});
