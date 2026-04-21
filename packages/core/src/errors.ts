import type { Address } from "viem";

export type ValidationError =
  | { kind: "RequiredDVNCountTooLow"; actual: number; min: number }
  | { kind: "EffectiveThresholdTooLow"; actual: number; min: number }
  | { kind: "ZkDVNCountTooLow"; actual: number; min: number }
  | { kind: "OperatorDiversityTooLow"; actual: number; min: number }
  | { kind: "DVNNotRegistered"; dvn: Address }
  | { kind: "DuplicateDVN"; dvn: Address }
  | { kind: "ConfirmationsTooLow"; actual: bigint; min: bigint }
  | { kind: "InvalidOptionalThreshold"; threshold: number; optionalCount: number };

export interface PostMortemLink {
  incident: string;
  date: string;
  loss: string;
  url: string;
  rootCause: string;
}

/**
 * Map a validation failure to the most relevant published post-mortem.
 * The CLI prints this when refusing a deployment so the dev is confronted
 * with the concrete incident their config would have caused.
 */
export const POST_MORTEMS: Record<ValidationError["kind"], PostMortemLink> = {
  RequiredDVNCountTooLow: {
    incident: "Kelp DAO bridge compromise",
    date: "2026-04-18",
    loss: "$292M",
    url: "https://www.blockaid.io/blog/how-a-single-layerzero-dvn-compromise-drained-292m-from-kelpdao",
    rootCause: "Single DVN compromised; a 1/1 config has no second verifier to catch a forged message.",
  },
  EffectiveThresholdTooLow: {
    incident: "Kelp DAO bridge compromise",
    date: "2026-04-18",
    loss: "$292M",
    url: "https://www.blockaid.io/blog/how-a-single-layerzero-dvn-compromise-drained-292m-from-kelpdao",
    rootCause: "Effective verification threshold below 2 allows any single verifier to finalize fraudulent messages.",
  },
  ZkDVNCountTooLow: {
    incident: "Multichain / Anyswap",
    date: "2023-07-07",
    loss: "~$126M",
    url: "https://rekt.news/multichain-rekt2/",
    rootCause: "MPC key custody failure across operator-controlled signers; no cryptographic verifier to cross-check.",
  },
  OperatorDiversityTooLow: {
    incident: "Ronin Bridge exploit",
    date: "2022-03-23",
    loss: "$625M",
    url: "https://rekt.news/ronin-rekt/",
    rootCause: "Homogeneous validator set — attacker compromised a correlated subset and reached quorum.",
  },
  DVNNotRegistered: {
    incident: "Orbit Bridge exploit",
    date: "2023-12-31",
    loss: "~$82M",
    url: "https://rekt.news/orbit-bridge-rekt/",
    rootCause: "Unknown/unaudited verifier in the validation set; provenance was not independently verified.",
  },
  DuplicateDVN: {
    incident: "Duplicate-verifier class of bugs",
    date: "n/a",
    loss: "n/a",
    url: "https://docs.layerzero.network/v2/developers/evm/configuration/dvn-executor-config",
    rootCause: "Duplicate verifier addresses provide false diversity — two slots, one real verifier.",
  },
  ConfirmationsTooLow: {
    incident: "BNB Chain cross-chain exploit",
    date: "2022-10-07",
    loss: "~$127M",
    url: "https://rekt.news/bnb-bridge-rekt/",
    rootCause: "Low confirmation count on the source chain leaves the bridge vulnerable to reorgs and state replay.",
  },
  InvalidOptionalThreshold: {
    incident: "Malformed-config class",
    date: "n/a",
    loss: "n/a",
    url: "https://docs.layerzero.network/v2/developers/evm/configuration/dvn-executor-config",
    rootCause: "optionalDVNThreshold > optionalDVNCount means the config cannot be satisfied as written.",
  },
};

export function formatValidationError(e: ValidationError): string {
  const pm = POST_MORTEMS[e.kind];
  const summary = describeError(e);
  return `${e.kind}: ${summary}\n  See post-mortem: ${pm.incident} (${pm.loss}, ${pm.date})\n  ${pm.url}\n  Root cause: ${pm.rootCause}`;
}

function describeError(e: ValidationError): string {
  switch (e.kind) {
    case "RequiredDVNCountTooLow":
      return `requiredDVNCount=${e.actual} < min=${e.min}. Increase requiredDVNs to at least ${e.min}.`;
    case "EffectiveThresholdTooLow":
      return `effective threshold=${e.actual} < min=${e.min}. Raise required count or optional threshold.`;
    case "ZkDVNCountTooLow":
      return `zkDVNs=${e.actual} < min=${e.min}. Add a ZK verifier (Polyhedra/Succinct) to the DVN set.`;
    case "OperatorDiversityTooLow":
      return `distinct operators=${e.actual} < min=${e.min}. Add a DVN from a different operator.`;
    case "DVNNotRegistered":
      return `DVN ${e.dvn} is not in the registry. Either add it with a verified tag, or replace with a registered DVN.`;
    case "DuplicateDVN":
      return `DVN ${e.dvn} appears more than once in the config.`;
    case "ConfirmationsTooLow":
      return `confirmations=${e.actual} < min=${e.min}. Raise block confirmations on the source chain.`;
    case "InvalidOptionalThreshold":
      return `optionalDVNThreshold=${e.threshold} > optionalDVNCount=${e.optionalCount}. Config is unsatisfiable.`;
  }
}
