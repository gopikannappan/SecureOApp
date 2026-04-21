import type { Address } from "viem";
import type { ChainKey, ChainRegistry, DVNEntry, DVNTag } from "../types.js";
import { REGISTRY } from "./defaults.js";

export { REGISTRY, listChains } from "./defaults.js";

/**
 * Read-only lookup over the bundled registry. The CLI loads a possibly-
 * augmented copy from `~/.secure-oapp/registry.json` if present, but this
 * module always falls back to the compiled defaults.
 */
export class DVNRegistryClient {
  constructor(private readonly data: Record<ChainKey, ChainRegistry> = REGISTRY) {}

  forChain(chainKey: ChainKey): ChainRegistry {
    const r = this.data[chainKey];
    if (!r) throw new Error(`No registry entries for chain: ${chainKey}`);
    return r;
  }

  lookup(chainKey: ChainKey, address: Address): DVNEntry | undefined {
    const lower = address.toLowerCase();
    return this.forChain(chainKey).dvns.find((d) => d.address.toLowerCase() === lower);
  }

  tagOf(chainKey: ChainKey, address: Address): DVNTag {
    const entry = this.lookup(chainKey, address);
    if (!entry) {
      throw new Error(`DVN ${address} not registered on ${chainKey}`);
    }
    return { operator: entry.operator, isZk: entry.isZk, verified: entry.verified };
  }

  isRegistered(chainKey: ChainKey, address: Address): boolean {
    return this.lookup(chainKey, address) !== undefined;
  }

  /** Suggest DVNs for a profile on a given chain. */
  suggestDVNs(chainKey: ChainKey, opts: { requireZk: boolean; count: number }): DVNEntry[] {
    const chain = this.forChain(chainKey);
    const zk = chain.dvns.filter((d) => d.isZk);
    const nonZk = chain.dvns.filter((d) => !d.isZk);
    const picked: DVNEntry[] = [];
    if (opts.requireZk && zk.length > 0) {
      picked.push(zk[0]!);
    }
    const operatorsUsed = new Set(picked.map((d) => d.operator));
    for (const d of nonZk) {
      if (picked.length >= opts.count) break;
      if (operatorsUsed.has(d.operator)) continue;
      picked.push(d);
      operatorsUsed.add(d.operator);
    }
    for (const d of chain.dvns) {
      if (picked.length >= opts.count) break;
      if (picked.includes(d)) continue;
      if (operatorsUsed.has(d.operator)) continue;
      picked.push(d);
      operatorsUsed.add(d.operator);
    }
    return picked;
  }
}

export function defaultRegistry(): DVNRegistryClient {
  return new DVNRegistryClient();
}
