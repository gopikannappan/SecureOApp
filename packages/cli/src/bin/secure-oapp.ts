#!/usr/bin/env node
import { main } from "../index.js";

main(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
