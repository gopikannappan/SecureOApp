import test from "node:test";
import assert from "node:assert/strict";
import { resolveSecureOAppConfig } from "../src/resolve";

test("resolveSecureOAppConfig fills defaults", () => {
  const r = resolveSecureOAppConfig({ profile: "standard" });
  assert.equal(r.profile, "standard");
  assert.equal(r.configPath, "./secure-oapp.config.json");
  assert.equal(r.securityMdPath, "./security.md");
});

test("resolveSecureOAppConfig preserves overrides", () => {
  const r = resolveSecureOAppConfig({
    profile: "paranoid",
    configPath: "./foo.json",
    securityMdPath: "./audit/security.md",
  });
  assert.equal(r.profile, "paranoid");
  assert.equal(r.configPath, "./foo.json");
  assert.equal(r.securityMdPath, "./audit/security.md");
});

test("resolveSecureOAppConfig throws without user config", () => {
  assert.throws(() => resolveSecureOAppConfig(undefined), /secureOApp/);
});
