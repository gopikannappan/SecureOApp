import { Command } from "commander";
import { PROFILES, defaultRegistry, type ChainKey, type ProfileName } from "@secure-oapp/core";
import { printHeader, dimLine } from "../ui.js";

interface QuoteOptions {
  from: ChainKey;
  to: ChainKey;
  profiles: string;
}

export function registerQuoteCommand(program: Command): void {
  program
    .command("quote")
    .description("Estimated message fee comparison across profiles. Heuristic pricing pending live RPC integration.")
    .requiredOption("--from <chainKey>", "source chain")
    .requiredOption("--to <chainKey>", "destination chain")
    .option("--profiles <list>", "comma-separated profile names", "standard,paranoid,lite")
    .action((opts: QuoteOptions) => {
      printHeader(`Fee comparison: ${opts.from} → ${opts.to}`);
      const registry = defaultRegistry();
      const selected = opts.profiles.split(",").map((s) => s.trim()) as ProfileName[];

      const header = ["profile", "required", "zk", "operators", "est. fee (rel.)"].join(" | ");
      console.log(header);
      console.log("-".repeat(header.length));

      for (const name of selected) {
        const p = PROFILES[name];
        if (!p) {
          console.log(`${name} | UNKNOWN PROFILE`);
          continue;
        }
        const suggested = registry.suggestDVNs(opts.from, {
          requireZk: p.minZkDVNCount > 0,
          count: p.minRequiredDVNCount,
        });
        const relFee = estimateRelativeFee(p.minRequiredDVNCount, p.minZkDVNCount);
        console.log(
          [
            p.name.padEnd(8),
            String(p.minRequiredDVNCount).padEnd(8),
            String(p.minZkDVNCount).padEnd(3),
            String(Math.max(p.minDistinctOperators, suggested.length)).padEnd(9),
            `${relFee.toFixed(2)}x`,
          ].join(" | "),
        );
      }

      console.log("");
      dimLine("Relative fees are a heuristic based on per-DVN verification cost.");
      dimLine("Run on Base Sepolia / Arbitrum Sepolia to capture live `quoteSend` numbers:");
      dimLine("  secure-oapp quote --from base-sepolia --to arbitrum-sepolia --live <RPC_URL>");
      dimLine("(live flag is planned for v0.2)");
    });
}

/**
 * Relative cost model: 1.0x baseline = 1 non-ZK DVN. Each additional DVN
 * adds 0.9x, each ZK DVN adds 1.4x. This is a rough UI signal until live
 * `quoteSend` integration lands — real pricing will replace it.
 */
function estimateRelativeFee(requiredCount: number, zkCount: number): number {
  const nonZk = Math.max(requiredCount - zkCount, 0);
  return 1 + (nonZk - 1) * 0.9 + zkCount * 1.4;
}
