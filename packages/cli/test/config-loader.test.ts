import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfigFile, toUlnConfig } from "../src/config-loader.js";

async function withTempFile(body: (path: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "sec-cli-"));
  try {
    const path = join(dir, "cfg.json");
    await body(path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("loadConfigFile parses a valid config", async () => {
  await withTempFile(async (path) => {
    await writeFile(
      path,
      JSON.stringify({
        profile: "standard",
        lanes: [
          {
            srcChain: "base",
            dstChain: "arbitrum",
            oappAddress: "0x0000000000000000000000000000000000000000",
            send: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: ["0x0000000000000000000000000000000000000001"],
              optionalDVNs: [],
            },
            receive: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: ["0x0000000000000000000000000000000000000002"],
              optionalDVNs: [],
            },
          },
        ],
      }),
    );
    const cfg = await loadConfigFile(path);
    assert.equal(cfg.profile, "standard");
    assert.equal(cfg.lanes.length, 1);
    assert.equal(cfg.lanes[0]!.srcChain, "base");
  });
});

test("loadConfigFile rejects missing profile", async () => {
  await withTempFile(async (path) => {
    await writeFile(path, JSON.stringify({ lanes: [] }));
    await assert.rejects(loadConfigFile(path), /missing "profile"/);
  });
});

test("loadConfigFile rejects non-array lanes", async () => {
  await withTempFile(async (path) => {
    await writeFile(path, JSON.stringify({ profile: "standard", lanes: "nope" }));
    await assert.rejects(loadConfigFile(path), /lanes.*array/);
  });
});

test("loadConfigFile rejects lane missing srcChain", async () => {
  await withTempFile(async (path) => {
    await writeFile(
      path,
      JSON.stringify({
        profile: "standard",
        lanes: [
          {
            dstChain: "arbitrum",
            oappAddress: "0x0",
            send: {},
            receive: {},
          },
        ],
      }),
    );
    await assert.rejects(loadConfigFile(path), /missing srcChain/);
  });
});

test("loadConfigFile propagates JSON parse errors", async () => {
  await withTempFile(async (path) => {
    await writeFile(path, "{not json");
    await assert.rejects(loadConfigFile(path));
  });
});

test("toUlnConfig converts numeric confirmations to bigint", () => {
  const c = toUlnConfig({
    confirmations: 15,
    requiredDVNCount: 2,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: [],
    optionalDVNs: [],
  });
  assert.equal(c.confirmations, 15n);
});

test("toUlnConfig accepts string confirmations for large numbers", () => {
  const c = toUlnConfig({
    confirmations: "1000000",
    requiredDVNCount: 2,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: [],
    optionalDVNs: [],
  });
  assert.equal(c.confirmations, 1000000n);
});
