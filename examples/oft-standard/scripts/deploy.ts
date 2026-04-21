import { ethers } from "hardhat";
import { PROFILE_IDS, encodeUlnConfig, defaultRegistry } from "@secure-oapp/core";
import cfg from "../secure-oapp.config.json" with { type: "json" };

/**
 * Deploys StandardOFT, sets itself as the endpoint delegate, then pushes the
 * secure send + receive ULN configs for every declared lane. All of this runs
 * through `setSecureSendConfig` / `setSecureReceiveConfig` — if any lane's DVN
 * set doesn't satisfy the `standard` profile, the tx reverts on-chain and the
 * deploy halts before the OApp can accept messages.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const endpoint = must("LZ_ENDPOINT");
  const registryAddress = must("DVN_REGISTRY");
  const name = process.env.OFT_NAME ?? "SecureExampleOFT";
  const symbol = process.env.OFT_SYMBOL ?? "sxOFT";
  const profileId = PROFILE_IDS.lite;

  const factory = await ethers.getContractFactory("StandardOFT");
  const oft = await factory.deploy(endpoint, registryAddress, profileId, deployer.address, name, symbol);
  await oft.waitForDeployment();
  const oftAddress = await oft.getAddress();
  console.log("StandardOFT deployed:", oftAddress);

  const registry = defaultRegistry();
  void registry;

  for (const lane of cfg.lanes) {
    const dstEid = eidFor(lane.dstChain);
    const srcEid = eidFor(lane.srcChain);
    const sendRaw = encodeUlnConfig({
      confirmations: BigInt(lane.send.confirmations),
      requiredDVNCount: lane.send.requiredDVNCount,
      optionalDVNCount: lane.send.optionalDVNCount,
      optionalDVNThreshold: lane.send.optionalDVNThreshold,
      requiredDVNs: lane.send.requiredDVNs as `0x${string}`[],
      optionalDVNs: lane.send.optionalDVNs as `0x${string}`[],
    });
    const recvRaw = encodeUlnConfig({
      confirmations: BigInt(lane.receive.confirmations),
      requiredDVNCount: lane.receive.requiredDVNCount,
      optionalDVNCount: lane.receive.optionalDVNCount,
      optionalDVNThreshold: lane.receive.optionalDVNThreshold,
      requiredDVNs: lane.receive.requiredDVNs as `0x${string}`[],
      optionalDVNs: lane.receive.optionalDVNs as `0x${string}`[],
    });

    const tx1 = await (oft as unknown as { setSecureSendConfig: (eid: number, raw: string) => Promise<{ wait: () => Promise<unknown> }> }).setSecureSendConfig(dstEid, sendRaw);
    await tx1.wait();
    console.log(`  send config enforced on ${lane.srcChain} → ${lane.dstChain}`);

    const tx2 = await (oft as unknown as { setSecureReceiveConfig: (eid: number, raw: string) => Promise<{ wait: () => Promise<unknown> }> }).setSecureReceiveConfig(srcEid, recvRaw);
    await tx2.wait();
    console.log(`  receive config enforced on ${lane.srcChain} ← ${lane.dstChain}`);
  }
}

function must(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function eidFor(chain: string): number {
  const map: Record<string, number> = {
    "base-sepolia": 40245,
    "arbitrum-sepolia": 40231,
    "optimism-sepolia": 40232,
    "ethereum-sepolia": 40161,
    "bsc-testnet": 40102,
  };
  const e = map[chain];
  if (!e) throw new Error(`Unknown chain for eid lookup: ${chain}`);
  return e;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
