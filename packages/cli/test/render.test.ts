import test from "node:test";
import assert from "node:assert/strict";
import { renderTemplateFiles } from "../src/templates/render.js";

test("renderTemplateFiles emits the expected files", () => {
  const files = renderTemplateFiles({
    projectName: "demo",
    profile: "standard",
    srcChain: "base-sepolia",
    dstChain: "arbitrum-sepolia",
    srcDVNs: ["0x0000000000000000000000000000000000000001"],
    dstDVNs: ["0x0000000000000000000000000000000000000002"],
  });
  const paths = Object.keys(files).sort();
  assert.deepEqual(paths, [
    ".env.example",
    ".gitignore",
    "README.md",
    "contracts/MyOApp.sol",
    "hardhat.config.ts",
    "package.json",
    "scripts/deploy.ts",
    "secure-oapp.config.json",
  ]);

  const cfg = JSON.parse(files["secure-oapp.config.json"]!);
  assert.equal(cfg.profile, "standard");
  assert.equal(cfg.lanes[0].srcChain, "base-sepolia");
  assert.equal(cfg.lanes[0].send.requiredDVNCount, 2);

  assert.match(files["contracts/MyOApp.sol"]!, /SecureOApp/);
  assert.match(files["hardhat.config.ts"]!, /"@secure-oapp\/hardhat"/);
});

test("paranoid template uses requiredDVNCount=3", () => {
  const files = renderTemplateFiles({
    projectName: "demo",
    profile: "paranoid",
    srcChain: "base",
    dstChain: "arbitrum",
    srcDVNs: [
      "0x0000000000000000000000000000000000000001",
      "0x0000000000000000000000000000000000000002",
      "0x0000000000000000000000000000000000000003",
    ],
    dstDVNs: [
      "0x0000000000000000000000000000000000000004",
      "0x0000000000000000000000000000000000000005",
      "0x0000000000000000000000000000000000000006",
    ],
  });
  const cfg = JSON.parse(files["secure-oapp.config.json"]!);
  assert.equal(cfg.lanes[0].send.requiredDVNCount, 3);
  assert.equal(cfg.lanes[0].send.confirmations, 30);
});
