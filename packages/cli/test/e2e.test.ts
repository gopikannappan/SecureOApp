import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const CLI_BIN = resolve(__dirname, "..", "dist", "bin", "secure-oapp.js");

function ensureCliBuilt() {
  if (!existsSync(CLI_BIN)) {
    throw new Error(`CLI binary not built at ${CLI_BIN}. Run pnpm -r --filter secure-oapp build first.`);
  }
}

function runCli(args: string[], cwd?: string) {
  ensureCliBuilt();
  return spawnSync(process.execPath, [CLI_BIN, ...args], {
    cwd: cwd ?? process.cwd(),
    encoding: "utf8",
  });
}

test("--version prints the package version", () => {
  const r = runCli(["--version"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /\d+\.\d+\.\d+/);
});

test("registry chains lists mainnets and testnets", () => {
  const r = runCli(["registry", "chains"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /ethereum/);
  assert.match(r.stdout, /base-sepolia/);
});

test("registry list arbitrum shows DVN addresses with tags", () => {
  const r = runCli(["registry", "list", "arbitrum"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /0x/);
  assert.match(r.stdout, /layerzero-labs/);
});

test("quote prints a row for each profile", () => {
  const r = runCli(["quote", "--from", "base-sepolia", "--to", "arbitrum-sepolia"]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /standard/);
  assert.match(r.stdout, /paranoid/);
  assert.match(r.stdout, /lite/);
});

test("validate exits 0 on a valid config", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sec-e2e-ok-"));
  const cfgPath = join(dir, "secure-oapp.config.json");
  try {
    await writeFile(
      cfgPath,
      JSON.stringify({
        profile: "standard",
        lanes: [
          {
            srcChain: "ethereum",
            dstChain: "arbitrum",
            oappAddress: "0x0000000000000000000000000000000000000000",
            send: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: [
                "0x589dedbd617e0cbcb916a9223f4d1300c294236b",
                "0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc",
              ],
              optionalDVNs: [],
            },
            receive: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: [
                "0x2f55c492897526677c5b68fb199ea31e2c126416",
                "0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc",
              ],
              optionalDVNs: [],
            },
          },
        ],
      }),
    );
    const r = runCli(["validate", "--config", cfgPath]);
    assert.equal(r.status, 0, `expected exit 0, got ${r.status}\n${r.stdout}\n${r.stderr}`);
    assert.match(r.stdout, /All lanes pass/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("validate exits 1 on a 1/1 config and prints post-mortem", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sec-e2e-bad-"));
  const cfgPath = join(dir, "secure-oapp.config.json");
  try {
    await writeFile(
      cfgPath,
      JSON.stringify({
        profile: "standard",
        lanes: [
          {
            srcChain: "base",
            dstChain: "arbitrum",
            oappAddress: "0x0000000000000000000000000000000000000000",
            send: {
              confirmations: 15,
              requiredDVNCount: 1,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: ["0x9e059a54699a285714207b43b055483e78faac25"],
              optionalDVNs: [],
            },
            receive: {
              confirmations: 15,
              requiredDVNCount: 1,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: ["0x2f55c492897526677c5b68fb199ea31e2c126416"],
              optionalDVNs: [],
            },
          },
        ],
      }),
    );
    const r = runCli(["validate", "--config", cfgPath]);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /RequiredDVNCountTooLow/);
    assert.match(r.stdout, /Kelp/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("init scaffolds a project with all expected files", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sec-e2e-init-"));
  try {
    const r = runCli(
      [
        "init",
        "demo",
        "--profile",
        "standard",
        "--src-chain",
        "base-sepolia",
        "--dst-chain",
        "arbitrum-sepolia",
      ],
      dir,
    );
    assert.equal(r.status, 0, `init failed: ${r.stderr}`);
    const projectDir = join(dir, "demo");
    for (const f of [
      "package.json",
      "README.md",
      "hardhat.config.ts",
      "contracts/MyOApp.sol",
      "secure-oapp.config.json",
      "scripts/deploy.ts",
      ".env.example",
      ".gitignore",
    ]) {
      assert.ok(existsSync(join(projectDir, f)), `expected ${f} to exist`);
    }
    const cfg = JSON.parse(await readFile(join(projectDir, "secure-oapp.config.json"), "utf8"));
    assert.equal(cfg.profile, "standard");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("init --force overwrites an existing directory", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sec-e2e-force-"));
  try {
    const first = runCli(["init", "dup", "--src-chain", "base-sepolia", "--dst-chain", "arbitrum-sepolia"], dir);
    assert.equal(first.status, 0);
    const again = runCli(["init", "dup", "--src-chain", "base-sepolia", "--dst-chain", "arbitrum-sepolia"], dir);
    assert.notEqual(again.status, 0, "second init without --force should fail");
    const forced = runCli(
      ["init", "dup", "--force", "--src-chain", "base-sepolia", "--dst-chain", "arbitrum-sepolia"],
      dir,
    );
    assert.equal(forced.status, 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("deploy --dry-run writes security.md without invoking hardhat", async () => {
  const dir = await mkdtemp(join(tmpdir(), "sec-e2e-dry-"));
  const cfgPath = join(dir, "secure-oapp.config.json");
  const mdPath = join(dir, "security.md");
  try {
    await writeFile(
      cfgPath,
      JSON.stringify({
        profile: "standard",
        lanes: [
          {
            srcChain: "ethereum",
            dstChain: "arbitrum",
            oappAddress: "0x0000000000000000000000000000000000000000",
            send: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: [
                "0x589dedbd617e0cbcb916a9223f4d1300c294236b",
                "0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc",
              ],
              optionalDVNs: [],
            },
            receive: {
              confirmations: 15,
              requiredDVNCount: 2,
              optionalDVNCount: 0,
              optionalDVNThreshold: 0,
              requiredDVNs: [
                "0x2f55c492897526677c5b68fb199ea31e2c126416",
                "0xe014fe8c4d5c23edb7ac4011f226e869ac7ef5cc",
              ],
              optionalDVNs: [],
            },
          },
        ],
      }),
    );
    const r = runCli(["deploy", "--config", cfgPath, "--security-md", mdPath, "--dry-run"]);
    assert.equal(r.status, 0, `deploy --dry-run failed: ${r.stderr}\n${r.stdout}`);
    const md = await readFile(mdPath, "utf8");
    assert.match(md, /# Security configuration/);
    assert.match(md, /standard/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
