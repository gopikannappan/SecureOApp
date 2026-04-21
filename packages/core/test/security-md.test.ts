import test from "node:test";
import assert from "node:assert/strict";
import { getProfile } from "../src/profiles.js";
import { validate } from "../src/validator.js";
import { renderSecurityMd } from "../src/security-md.js";
import { testRegistry, standardConfig, paranoidConfig } from "./fixtures.js";

test("renderSecurityMd emits header, profile, and both configs", () => {
  const registry = testRegistry();
  const profile = getProfile("standard");
  const send = validate({ config: standardConfig, profile, chainKey: "test-chain", registry });
  const recv = validate({ config: standardConfig, profile, chainKey: "test-chain", registry });
  assert.equal(send.ok, true);
  assert.equal(recv.ok, true);
  if (!send.ok || !recv.ok) return;

  const md = renderSecurityMd({
    projectName: "demo-oapp",
    profile,
    generatedAt: new Date("2026-04-21T00:00:00Z"),
    registry,
    toolVersion: "secure-oapp/test",
    deployments: [
      {
        srcChain: "test-chain",
        dstChain: "test-chain",
        oappAddress: "0x00000000000000000000000000000000000000ff",
        sendConfig: standardConfig,
        receiveConfig: standardConfig,
        summarySend: send.summary,
        summaryRecv: recv.summary,
      },
    ],
  });

  assert.match(md, /# Security configuration — demo-oapp/);
  assert.match(md, /Profile:.*standard/);
  assert.match(md, /Required DVN count \| 2/);
  assert.match(md, /test-chain → test-chain/);
  assert.match(md, /Send config/);
  assert.match(md, /Receive config/);
  assert.match(md, /polyhedra/);
  assert.match(md, /secure-oapp\/test/);
});

test("renderSecurityMd annotates unregistered DVNs", () => {
  const registry = testRegistry();
  const profile = getProfile("paranoid");
  const send = validate({ config: paranoidConfig, profile, chainKey: "test-chain", registry });
  assert.equal(send.ok, true);
  if (!send.ok) return;

  const md = renderSecurityMd({
    projectName: "demo",
    profile,
    registry,
    deployments: [
      {
        srcChain: "test-chain",
        dstChain: "test-chain",
        oappAddress: "0x00000000000000000000000000000000000000ff",
        sendConfig: { ...paranoidConfig, requiredDVNs: ["0x00000000000000000000000000000000000000dead", ...paranoidConfig.requiredDVNs.slice(1)] },
        receiveConfig: paranoidConfig,
        summarySend: send.summary,
        summaryRecv: send.summary,
      },
    ],
  });

  assert.match(md, /UNREGISTERED/);
});
