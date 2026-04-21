import type { SecureOAppHardhatUserConfig } from "./type-extensions";

export interface ResolvedSecureOAppConfig {
  profile: SecureOAppHardhatUserConfig["profile"];
  configPath: string;
  securityMdPath: string;
}

export function resolveSecureOAppConfig(
  user: SecureOAppHardhatUserConfig | undefined,
): ResolvedSecureOAppConfig {
  if (!user) {
    throw new Error(
      "[@secure-oapp/hardhat] `secureOApp` is missing from hardhat.config. " +
        "Add { profile: 'standard' } to enable the plugin.",
    );
  }
  return {
    profile: user.profile,
    configPath: user.configPath ?? "./secure-oapp.config.json",
    securityMdPath: user.securityMdPath ?? "./security.md",
  };
}
