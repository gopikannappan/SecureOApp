import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerValidateCommand } from "./commands/validate.js";
import { registerDeployCommand } from "./commands/deploy.js";
import { registerQuoteCommand } from "./commands/quote.js";
import { registerRegistryCommand } from "./commands/registry.js";

export const VERSION = "0.1.0";

export async function main(argv: string[]): Promise<void> {
  const program = new Command();
  program
    .name("secure-oapp")
    .description("Secure-by-default LayerZero OApp/OFT scaffold and validator.")
    .version(VERSION);

  registerInitCommand(program);
  registerValidateCommand(program);
  registerDeployCommand(program);
  registerQuoteCommand(program);
  registerRegistryCommand(program);

  await program.parseAsync(argv);
}
