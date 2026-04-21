import pc from "picocolors";
import type { ValidationResult } from "@secure-oapp/core";
import { formatValidationError } from "@secure-oapp/core";

export function banner(): string {
  return pc.cyan(pc.bold("secure-oapp")) + pc.dim(" — DVN configs that can't get you Kelp'd");
}

export function printHeader(title: string): void {
  console.log("");
  console.log(pc.bold(pc.cyan(title)));
  console.log(pc.dim("─".repeat(title.length)));
}

export function printSummary(r: ValidationResult): void {
  const s = r.summary;
  const status = r.ok ? pc.green("PASS") : pc.red("FAIL");
  console.log(`${status}  required=${s.requiredDVNCount}  optional=${s.optionalDVNCount} (threshold ${s.optionalDVNThreshold})  effective=${s.effectiveThreshold}  zk=${s.zkDVNCount}  operators=${s.distinctOperators}  confirmations=${s.confirmations.toString()}`);
}

export function printErrors(r: ValidationResult): void {
  if (r.ok) return;
  console.log("");
  console.log(pc.red(pc.bold(`${r.errors.length} violation${r.errors.length === 1 ? "" : "s"}:`)));
  for (const e of r.errors) {
    console.log("");
    console.log(pc.red("✗ ") + formatValidationError(e));
  }
}

export function okLine(msg: string): void {
  console.log(pc.green("✔ ") + msg);
}

export function warnLine(msg: string): void {
  console.log(pc.yellow("! ") + msg);
}

export function errLine(msg: string): void {
  console.log(pc.red("✗ ") + msg);
}

export function dimLine(msg: string): void {
  console.log(pc.dim(msg));
}
