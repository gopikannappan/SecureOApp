import { Command } from "commander";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { getProfile, validate, renderSecurityMd } from "@secure-oapp/core";
import { loadConfigFile, toUlnConfig } from "../config-loader.js";
import { printHeader, okLine, errLine, warnLine, dimLine } from "../ui.js";

interface DeployOptions {
  config: string;
  network: string;
  skipValidate: boolean;
  dryRun: boolean;
  securityMd: string;
}

export function registerDeployCommand(program: Command): void {
  program
    .command("deploy")
    .description("Validate + deploy. Refuses to deploy unless every lane passes the profile.")
    .option("-c, --config <path>", "path to secure-oapp.config.json", "./secure-oapp.config.json")
    .option("-n, --network <name>", "hardhat network name")
    .option("--dry-run", "validate, render security.md, but do not invoke hardhat deploy", false)
    .option("--skip-validate", "DANGER — skip validation. For recovery only.", false)
    .option("--security-md <path>", "path to emit security.md", "./security.md")
    .action(async (opts: DeployOptions) => {
      printHeader("secure-oapp deploy");

      if (opts.skipValidate) {
        warnLine("--skip-validate is set. DVN validation will not be run. This mode is for recovery only.");
      }

      const file = await loadConfigFile(opts.config);
      const profile = getProfile(file.profile);

      type Deployments = Parameters<typeof renderSecurityMd>[0]["deployments"];
      const deployments: Array<Deployments[number]> = [];
      let allOk = true;

      for (const lane of file.lanes) {
        const send = toUlnConfig(lane.send);
        const recv = toUlnConfig(lane.receive);
        if (!opts.skipValidate) {
          const s = validate({ config: send, profile, chainKey: lane.srcChain });
          const r = validate({ config: recv, profile, chainKey: lane.dstChain });
          if (!s.ok || !r.ok) {
            errLine(`${lane.srcChain} → ${lane.dstChain}: validation FAILED`);
            allOk = false;
            continue;
          }
          deployments.push({
            srcChain: lane.srcChain,
            dstChain: lane.dstChain,
            oappAddress: lane.oappAddress,
            sendConfig: send,
            receiveConfig: recv,
            summarySend: s.summary,
            summaryRecv: r.summary,
          });
        }
      }

      if (!opts.skipValidate && !allOk) {
        errLine("Refusing to deploy. Run `secure-oapp validate` for full details.");
        process.exit(1);
      }

      const md = renderSecurityMd({
        projectName: "oapp",
        profile,
        deployments,
      });
      await writeFile(opts.securityMd, md);
      okLine(`Wrote ${opts.securityMd}`);

      if (opts.dryRun) {
        dimLine("Dry run — skipping hardhat deploy.");
        return;
      }

      if (!opts.network) {
        errLine("--network is required unless --dry-run is set.");
        process.exit(1);
      }

      dimLine(`Invoking: npx hardhat deploy --network ${opts.network}`);
      await runCmd("npx", ["hardhat", "deploy", "--network", opts.network]);
    });
}

function runCmd(cmd: string, args: string[]): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("close", (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`${cmd} exited with code ${code}`));
    });
  });
}
