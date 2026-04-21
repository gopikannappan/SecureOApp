import test from "node:test";
import assert from "node:assert/strict";
import { keccak256, toBytes } from "viem";
import { PROFILE_IDS, PROFILES, profileNameFromId } from "../src/profiles.js";

test("profile ids match Solidity keccak of canonical version string", () => {
  assert.equal(PROFILE_IDS.standard, keccak256(toBytes("secure-oapp.profile.standard.v1")));
  assert.equal(PROFILE_IDS.paranoid, keccak256(toBytes("secure-oapp.profile.paranoid.v1")));
  assert.equal(PROFILE_IDS.lite, keccak256(toBytes("secure-oapp.profile.lite.v1")));
});

test("profile ids reverse to names", () => {
  assert.equal(profileNameFromId(PROFILE_IDS.standard), "standard");
  assert.equal(profileNameFromId(PROFILE_IDS.paranoid), "paranoid");
  assert.equal(profileNameFromId(PROFILE_IDS.lite), "lite");
});

test("profile constants are monotonic in severity", () => {
  assert.ok(PROFILES.paranoid.minRequiredDVNCount >= PROFILES.standard.minRequiredDVNCount);
  assert.ok(PROFILES.paranoid.minZkDVNCount >= PROFILES.standard.minZkDVNCount);
  assert.ok(PROFILES.paranoid.minConfirmations >= PROFILES.standard.minConfirmations);
  assert.ok(PROFILES.standard.minRequiredDVNCount >= PROFILES.lite.minRequiredDVNCount);
  assert.ok(PROFILES.standard.minZkDVNCount >= PROFILES.lite.minZkDVNCount);
});
