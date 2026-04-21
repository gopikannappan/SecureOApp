import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadAndValidate, writeSecurityMd } from "../src/runner";

const validLane = {
  srcChain: "ethereum",
  dstChain: "arbitrum",
  oappAddress: "0x0000000000000000000000000000000000000000",
  send: {
    confirmations: 15,
    requiredDVNCount: 2,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: [
      "0x589dEDbD617e0CBcB916A9223F4d1300c294236b",
      "0x8FafAE7Dd957044088b3d0F67359C327c6200d18",
    ],
    optionalDVNs: [],
  },
  receive: {
    confirmations: 15,
    requiredDVNCount: 2,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: [
      "0x2f55C492897526677C5B68fb199ea31E2c126416",
      "0x8FafAE7Dd957044088b3d0F67359C327c6200d18",
    ],
    optionalDVNs: [],
  },
};

async function withConfig(cfg: unknown, body: (path: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "sec-plugin-happy-"));
  const path = join(dir, "cfg.json");
  try {
    await writeFile(path, JSON.stringify(cfg));
    await body(path);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("loadAndValidate returns ok:true for a valid standard config", async () => {
  await withConfig({ profile: "standard", lanes: [validLane] }, async (path) => {
    const out = await loadAndValidate({ configPath: path });
    assert.equal(out.ok, true);
    assert.equal(out.lanes[0]!.ok, true);
    assert.equal(out.lanes[0]!.errors.length, 0);
  });
});

test("security.md contains profile summary and DVN annotations", async () => {
  await withConfig({ profile: "standard", lanes: [validLane] }, async (path) => {
    const out = await loadAndValidate({ configPath: path, projectName: "happy-path" });
    assert.match(out.securityMd, /happy-path/);
    assert.match(out.securityMd, /standard/);
    assert.match(out.securityMd, /Required DVN count \| 2/);
    assert.match(out.securityMd, /polyhedra/);
  });
});

test("profileOverride lets a standard config be validated against paranoid (and fail)", async () => {
  await withConfig({ profile: "standard", lanes: [validLane] }, async (path) => {
    const out = await loadAndValidate({ configPath: path, profileOverride: "paranoid" });
    assert.equal(out.ok, false);
    assert.match(out.lanes[0]!.errors.join("\n"), /RequiredDVNCountTooLow/);
  });
});

test("multi-lane config reports each lane independently", async () => {
  const bad = {
    ...validLane,
    send: { ...validLane.send, requiredDVNCount: 1, requiredDVNs: [validLane.send.requiredDVNs[0]!] },
  };
  await withConfig({ profile: "standard", lanes: [validLane, bad] }, async (path) => {
    const out = await loadAndValidate({ configPath: path });
    assert.equal(out.ok, false);
    assert.equal(out.lanes.length, 2);
    assert.equal(out.lanes[0]!.ok, true);
    assert.equal(out.lanes[1]!.ok, false);
    assert.match(out.lanes[1]!.errors.join("\n"), /RequiredDVNCountTooLow/);
  });
});

test("writeSecurityMd persists the rendered markdown to disk", async () => {
  await withConfig({ profile: "standard", lanes: [validLane] }, async (path) => {
    const out = await loadAndValidate({ configPath: path });
    const dir = await mkdtemp(join(tmpdir(), "sec-plugin-md-"));
    const mdPath = join(dir, "security.md");
    try {
      await writeSecurityMd(mdPath, out.securityMd);
      assert.ok(existsSync(mdPath));
      const written = await readFile(mdPath, "utf8");
      assert.equal(written, out.securityMd);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

test("loadAndValidate throws on missing config file", async () => {
  await assert.rejects(loadAndValidate({ configPath: "/nonexistent/path.json" }));
});

test("loadAndValidate throws on unknown profile", async () => {
  await withConfig(
    { profile: "nonsense", lanes: [validLane] },
    async (path) => {
      await assert.rejects(loadAndValidate({ configPath: path }), /Unknown profile/);
    },
  );
});
