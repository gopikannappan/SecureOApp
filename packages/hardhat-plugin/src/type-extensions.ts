import type { ProfileName } from "@secure-oapp/core";

export interface SecureOAppHardhatUserConfig {
  /** Security profile every enforced config must satisfy. */
  profile: ProfileName;
  /** Path to the secure-oapp.config.json file. Defaults to `./secure-oapp.config.json`. */
  configPath?: string;
  /** Optional path to the rendered security.md artifact. Defaults to `./security.md`. */
  securityMdPath?: string;
}

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    secureOApp?: SecureOAppHardhatUserConfig;
  }

  interface HardhatConfig {
    secureOApp: Required<SecureOAppHardhatUserConfig>;
  }
}
