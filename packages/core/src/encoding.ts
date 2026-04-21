import { encodeAbiParameters, decodeAbiParameters, type Hex } from "viem";
import type { UlnConfig } from "./types.js";

const ULN_CONFIG_ABI = [
  {
    type: "tuple",
    components: [
      { name: "confirmations", type: "uint64" },
      { name: "requiredDVNCount", type: "uint8" },
      { name: "optionalDVNCount", type: "uint8" },
      { name: "optionalDVNThreshold", type: "uint8" },
      { name: "requiredDVNs", type: "address[]" },
      { name: "optionalDVNs", type: "address[]" },
    ],
  },
] as const;

export const CONFIG_TYPE_ULN = 2;

export function encodeUlnConfig(c: UlnConfig): Hex {
  return encodeAbiParameters(ULN_CONFIG_ABI, [c]);
}

export function decodeUlnConfig(raw: Hex): UlnConfig {
  const [decoded] = decodeAbiParameters(ULN_CONFIG_ABI, raw);
  return decoded as unknown as UlnConfig;
}
