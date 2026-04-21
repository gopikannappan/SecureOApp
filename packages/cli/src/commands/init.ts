import { Command } from "commander";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { getProfile, defaultRegistry, type ProfileName } from "@secure-oapp/core";
import { printHeader, okLine, dimLine, warnLine } from "../ui.js";
import { renderTemplateFiles } from "../templates/render.js";

interface InitOptions {
  profile: ProfileName;
  srcChain: string;
  dstChain: string;
  force: boolean;
}

export function registerInitCommand(program: Command): void {
  program
    .command("init [name]")
    .description("Scaffold a new LayerZero OApp project with SecureOApp defaults.")
    .option("-p, --profile <name>", "security profile: standard | paranoid | lite", "standard")
    .option("--src-chain <key>", "default source chain", "base-sepolia")
    .option("--dst-chain <key>", "default destination chain", "arbitrum-sepolia")
    .option("--force", "overwrite existing files", false)
    .action(async (nameArg: string | undefined, opts: InitOptions) => {
      const name = nameArg ?? "my-secure-oapp";
      const target = resolve(process.cwd(), name);
      const profile = getProfile(opts.profile);

      printHeader(`Scaffolding ${name}`);
      dimLine(`profile: ${profile.name}  src: ${opts.srcChain}  dst: ${opts.dstChain}`);

      if (existsSync(target) && !opts.force) {
        throw new Error(`${target} already exists. Pass --force to overwrite.`);
      }
      await mkdir(target, { recursive: true });

      const registry = defaultRegistry();
      const srcSuggest = registry.suggestDVNs(opts.srcChain, {
        requireZk: profile.minZkDVNCount > 0,
        count: profile.minRequiredDVNCount,
      });
      const dstSuggest = registry.suggestDVNs(opts.dstChain, {
        requireZk: profile.minZkDVNCount > 0,
        count: profile.minRequiredDVNCount,
      });

      if (srcSuggest.length < profile.minRequiredDVNCount || dstSuggest.length < profile.minRequiredDVNCount) {
        warnLine(
          "Not enough registered DVNs on one of the selected chains to satisfy this profile. " +
            "Template will be generated with placeholders you must fill in.",
        );
      }

      const files = renderTemplateFiles({
        projectName: name,
        profile: profile.name,
        srcChain: opts.srcChain,
        dstChain: opts.dstChain,
        srcDVNs: srcSuggest.map((d) => d.address),
        dstDVNs: dstSuggest.map((d) => d.address),
      });

      for (const [relPath, content] of Object.entries(files)) {
        const full = join(target, relPath);
        await mkdir(resolve(full, ".."), { recursive: true });
        await writeFile(full, content);
      }

      console.log("");
      okLine(`Created ${name}/`);
      dimLine("Next steps:");
      dimLine(`  cd ${name}`);
      dimLine("  pnpm install");
      dimLine("  secure-oapp validate");
      dimLine(`  secure-oapp deploy --network ${opts.srcChain}`);
    });
}
