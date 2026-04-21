import type { Address } from "viem";
import type { ChainKey, ProfileName } from "@secure-oapp/core";

export interface TemplateInput {
  projectName: string;
  profile: ProfileName;
  srcChain: ChainKey;
  dstChain: ChainKey;
  srcDVNs: Address[];
  dstDVNs: Address[];
}

/**
 * Render the full file tree for a scaffolded project. Returns a map from
 * relative path to file contents. The CLI writes each file to the target
 * directory.
 */
export function renderTemplateFiles(input: TemplateInput): Record<string, string> {
  return {
    "package.json": packageJson(input),
    ".gitignore": gitignore(),
    "README.md": readme(input),
    "hardhat.config.ts": hardhatConfig(input),
    "contracts/MyOApp.sol": myOAppSol(input),
    "secure-oapp.config.json": secureOAppConfig(input),
    ".env.example": envExample(),
    "scripts/deploy.ts": deployScript(input),
  };
}

function packageJson(input: TemplateInput): string {
  return `${JSON.stringify(
    {
      name: input.projectName,
      version: "0.0.0",
      private: true,
      scripts: {
        validate: "secure-oapp validate",
        compile: "hardhat compile",
        deploy: "secure-oapp deploy",
        quote: "secure-oapp quote",
      },
      dependencies: {
        "@secure-oapp/core": "^0.1.0",
        "@secure-oapp/hardhat": "^0.1.0",
        "secure-oapp": "^0.1.0",
      },
      devDependencies: {
        hardhat: "^2.22.0",
        "@nomicfoundation/hardhat-toolbox": "^5.0.0",
        typescript: "^5.4.0",
      },
    },
    null,
    2,
  )}\n`;
}

function gitignore(): string {
  return `node_modules/\nartifacts/\ncache/\ntypechain-types/\n.env\nsecurity.md.tmp\n`;
}

function readme(input: TemplateInput): string {
  return `# ${input.projectName}

A secure-by-default LayerZero OApp. Scaffolded by \`secure-oapp init\`.

**Profile:** \`${input.profile}\`.
**Source chain:** \`${input.srcChain}\` → **destination:** \`${input.dstChain}\`.

## Commands

\`\`\`bash
secure-oapp validate          # pre-flight DVN config check
npx hardhat compile           # build contracts
secure-oapp deploy --network ${input.srcChain}
secure-oapp quote --from ${input.srcChain} --to ${input.dstChain}
\`\`\`
`;
}

function hardhatConfig(input: TemplateInput): string {
  return `import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@secure-oapp/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    "${input.srcChain}": {
      url: process.env.SRC_RPC_URL ?? "",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    },
    "${input.dstChain}": {
      url: process.env.DST_RPC_URL ?? "",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    },
  },
  secureOApp: {
    profile: "${input.profile}",
    configPath: "./secure-oapp.config.json",
  },
};

export default config;
`;
}

function myOAppSol(input: TemplateInput): string {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { SecureOApp } from "@secure-oapp/contracts/SecureOApp.sol";

/// Your OApp. Inherits SecureOApp to enforce the ${input.profile} DVN profile
/// on every setConfig call. Add your message-handling logic here.
contract MyOApp is SecureOApp {
    constructor(address endpoint, address registry, bytes32 profileId, address admin)
        SecureOApp(endpoint, registry, profileId, admin)
    {}
}
`;
}

function secureOAppConfig(input: TemplateInput): string {
  const srcCfg = laneConfigFor(input.profile, input.srcDVNs);
  const dstCfg = laneConfigFor(input.profile, input.dstDVNs);
  const oappPlaceholder = "0x0000000000000000000000000000000000000000";
  return `${JSON.stringify(
    {
      profile: input.profile,
      lanes: [
        {
          srcChain: input.srcChain,
          dstChain: input.dstChain,
          oappAddress: oappPlaceholder,
          send: srcCfg,
          receive: dstCfg,
        },
      ],
    },
    null,
    2,
  )}\n`;
}

function laneConfigFor(profile: ProfileName, dvns: Address[]) {
  const required = profile === "paranoid" ? 3 : 2;
  const confirmations = profile === "paranoid" ? 30 : profile === "standard" ? 15 : 5;
  const padded = [...dvns];
  while (padded.length < required) {
    padded.push("0x0000000000000000000000000000000000000000" as Address);
  }
  return {
    confirmations,
    requiredDVNCount: required,
    optionalDVNCount: 0,
    optionalDVNThreshold: 0,
    requiredDVNs: padded.slice(0, required),
    optionalDVNs: [],
  };
}

function envExample(): string {
  return `# Source chain RPC (required for deploy)
SRC_RPC_URL=

# Destination chain RPC (required for deploy)
DST_RPC_URL=

# Deployer private key — prefix with 0x
DEPLOYER_PK=
`;
}

function deployScript(input: TemplateInput): string {
  return `import { ethers } from "hardhat";
import { getProfile, PROFILE_IDS } from "@secure-oapp/core";

async function main() {
  const [deployer] = await ethers.getSigners();
  const profileId = PROFILE_IDS["${input.profile}"];
  const endpoint = process.env.LZ_ENDPOINT ?? "";
  const registry = process.env.DVN_REGISTRY ?? "";
  if (!endpoint || !registry) throw new Error("Set LZ_ENDPOINT and DVN_REGISTRY env vars");

  const factory = await ethers.getContractFactory("MyOApp");
  const oapp = await factory.deploy(endpoint, registry, profileId, deployer.address);
  await oapp.waitForDeployment();
  console.log("MyOApp deployed to:", await oapp.getAddress(), "profile:", "${input.profile}");
}

main().catch((e) => { console.error(e); process.exit(1); });
`;
}
