import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@secure-oapp/hardhat";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.22",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    "base-sepolia": {
      url: process.env.BASE_SEPOLIA_RPC_URL ?? "",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    },
    "arbitrum-sepolia": {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL ?? "",
      accounts: process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [],
    },
  },
  secureOApp: {
    profile: "lite",
    configPath: "./secure-oapp.config.json",
    securityMdPath: "./security.md",
  },
};

export default config;
