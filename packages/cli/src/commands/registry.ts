import { Command } from "commander";
import { defaultRegistry, listChains } from "@secure-oapp/core";
import { printHeader, dimLine } from "../ui.js";

export function registerRegistryCommand(program: Command): void {
  const reg = program.command("registry").description("Inspect the bundled DVN registry.");

  reg
    .command("chains")
    .description("List every chain in the registry.")
    .action(() => {
      printHeader("Chains in registry");
      for (const c of listChains()) {
        console.log(`  ${c}`);
      }
    });

  reg
    .command("list <chainKey>")
    .description("List DVNs registered on a chain.")
    .action((chainKey: string) => {
      const r = defaultRegistry();
      const chain = r.forChain(chainKey);
      printHeader(`DVNs on ${chainKey} (eid ${chain.lzEid})`);
      for (const d of chain.dvns) {
        const tags = [d.operator];
        if (d.isZk) tags.push("ZK");
        if (d.verified) tags.push("verified");
        console.log(`  ${d.address}  [${tags.join(", ")}]`);
        if (d.notes) dimLine(`    ${d.notes}`);
      }
    });
}
