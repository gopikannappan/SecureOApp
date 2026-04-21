# @secure-oapp/core

Security profiles, DVN registry, and ULN config validator for [SecureOApp](../../README.md). Pure TS, no side effects.

## Install

```bash
pnpm add @secure-oapp/core
```

## Usage

```ts
import {
  getProfile,
  defaultRegistry,
  validate,
  renderSecurityMd,
  formatValidationError,
} from "@secure-oapp/core";

const result = validate({
  config: myUlnConfig,
  profile: getProfile("standard"),
  chainKey: "base",
  registry: defaultRegistry(),
});

if (!result.ok) {
  for (const err of result.errors) {
    console.error(formatValidationError(err));
  }
  process.exit(1);
}

console.log(renderSecurityMd({
  projectName: "my-oapp",
  profile: getProfile("standard"),
  deployments: [/* ... */],
}));
```

## Profiles

Three preset profiles. IDs are the keccak of a version string and are shared with Solidity.

| Profile    | Required | Effective threshold | ZK DVNs | Distinct operators | Min confirmations |
|------------|----------|---------------------|---------|--------------------|-------------------|
| `standard` | 2        | 2                   | 1       | 2                  | 5                 |
| `paranoid` | 3        | 3                   | 2       | 3                  | 15                |
| `lite`     | 2        | 2                   | 0       | 2                  | 1                 |

See [`docs/PROFILES.md`](../../docs/PROFILES.md) for rationale.

## Registry

Ships with a bundled registry covering Ethereum, Arbitrum, Optimism, Base, BNB, Polygon, Avalanche, and their Sepolia testnets. Override by instantiating `new DVNRegistryClient(customData)`.
