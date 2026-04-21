import { Command } from "commander";
import { getProfile, validate, type ValidationResult } from "@secure-oapp/core";
import { loadConfigFile, toUlnConfig } from "../config-loader.js";
import { printHeader, printSummary, printErrors, okLine, errLine } from "../ui.js";

interface ValidateOptions {
  config: string;
}

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate a secure-oapp.config.json against its declared profile.")
    .option("-c, --config <path>", "path to secure-oapp.config.json", "./secure-oapp.config.json")
    .action(async (opts: ValidateOptions) => {
      const file = await loadConfigFile(opts.config);
      const profile = getProfile(file.profile);
      printHeader(`Validating ${opts.config} (profile: ${file.profile})`);

      let ok = true;
      for (const lane of file.lanes) {
        const send: ValidationResult = validate({
          config: toUlnConfig(lane.send),
          profile,
          chainKey: lane.srcChain,
        });
        const recv: ValidationResult = validate({
          config: toUlnConfig(lane.receive),
          profile,
          chainKey: lane.dstChain,
        });

        console.log("");
        console.log(`${lane.srcChain} → ${lane.dstChain}  (${lane.oappAddress})`);
        console.log("  SEND   ");
        printSummary(send);
        printErrors(send);
        console.log("  RECV   ");
        printSummary(recv);
        printErrors(recv);

        if (!send.ok || !recv.ok) ok = false;
      }

      console.log("");
      if (ok) {
        okLine("All lanes pass. You can proceed to deploy.");
        process.exit(0);
      } else {
        errLine("One or more lanes failed validation. Fix the violations above before deploying.");
        process.exit(1);
      }
    });
}
