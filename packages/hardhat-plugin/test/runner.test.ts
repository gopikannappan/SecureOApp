import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAndValidate } from "../src/runner";

test("loadAndValidate flags 1/1 config as failing", async () => {
  const dir = await mkdtemp(join(tmpdir(), "secoapp-plugin-"));
  const cfgPath = join(dir, "cfg.json");
  await writeFile(
    cfgPath,
    JSON.stringify({
      profile: "standard",
      lanes: [
        {
          srcChain: "base-sepolia",
          dstChain: "arbitrum-sepolia",
          oappAddress: "0x0000000000000000000000000000000000000001",
          send: {
            confirmations: 5,
            requiredDVNCount: 1,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: ["0xe1a12515F9AB2764b887bF60192924C815d62A81"],
            optionalDVNs: [],
          },
          receive: {
            confirmations: 5,
            requiredDVNCount: 1,
            optionalDVNCount: 0,
            optionalDVNThreshold: 0,
            requiredDVNs: ["0x53f488E93b4f1b60E8E83aa374dBe1780A1EE8a8"],
            optionalDVNs: [],
          },
        },
      ],
    }),
  );
  try {
    const out = await loadAndValidate({ configPath: cfgPath });
    assert.equal(out.ok, false);
    assert.equal(out.lanes[0]!.ok, false);
    assert.ok(out.lanes[0]!.errors.some((e) => e.includes("RequiredDVNCountTooLow")));
    assert.match(out.securityMd, /# Security configuration/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
