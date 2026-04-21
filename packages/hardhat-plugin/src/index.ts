import { extendConfig, task, types } from "hardhat/config";
import type { HardhatConfig, HardhatUserConfig } from "hardhat/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types/runtime";
import { resolveSecureOAppConfig } from "./resolve";
import { loadAndValidate, writeSecurityMd } from "./runner";

import "./type-extensions";

/**
 * Resolve `secureOApp` at config time so every task sees canonical defaults.
 */
extendConfig((config: HardhatConfig, userConfig: Readonly<HardhatUserConfig>) => {
  if (!userConfig.secureOApp) return;
  config.secureOApp = resolveSecureOAppConfig(userConfig.secureOApp);
});

task("secure-oapp:validate", "Validate secure-oapp.config.json against the declared profile.")
  .addOptionalParam("configPath", "Path to secure-oapp.config.json", undefined, types.string)
  .setAction(async (args: { configPath?: string }, hre: HardhatRuntimeEnvironment) => {
    const cfg = resolveSecureOAppConfig(hre.config.secureOApp);
    const outcome = await loadAndValidate({
      configPath: args.configPath ?? cfg.configPath,
      projectName: hre.config.paths.root,
    });
    report(outcome);
    if (!outcome.ok) throw new Error("secure-oapp: one or more lanes failed validation.");
  });

task("secure-oapp:write-security-md", "Write security.md based on the current config.").setAction(
  async (_args, hre: HardhatRuntimeEnvironment) => {
    const cfg = resolveSecureOAppConfig(hre.config.secureOApp);
    const outcome = await loadAndValidate({ configPath: cfg.configPath });
    await writeSecurityMd(cfg.securityMdPath, outcome.securityMd);
    console.log(`Wrote ${cfg.securityMdPath}`);
    if (!outcome.ok) {
      console.warn("Validation failed — security.md was still written but reflects invalid lanes.");
    }
  },
);

task("secure-oapp:deploy", "Validate, emit security.md, then run the project deploy script.")
  .addParam("network", "Hardhat network name")
  .addOptionalParam("script", "Path to deploy script", "scripts/deploy.ts", types.string)
  .setAction(
    async (args: { network: string; script: string }, hre: HardhatRuntimeEnvironment) => {
      const cfg = resolveSecureOAppConfig(hre.config.secureOApp);
      const outcome = await loadAndValidate({ configPath: cfg.configPath });
      report(outcome);
      if (!outcome.ok) throw new Error("secure-oapp:deploy aborted — validation failed.");
      await writeSecurityMd(cfg.securityMdPath, outcome.securityMd);
      await hre.run("run", { script: args.script, network: args.network });
    },
  );

function report(outcome: Awaited<ReturnType<typeof loadAndValidate>>): void {
  for (const l of outcome.lanes) {
    if (l.ok) {
      console.log(`  [ok] ${l.lane}`);
    } else {
      console.log(`  [FAIL] ${l.lane}`);
      for (const e of l.errors) console.log(`    ${e}`);
    }
  }
}

export { resolveSecureOAppConfig, loadAndValidate, writeSecurityMd };
export type { SecureOAppHardhatUserConfig } from "./type-extensions";
