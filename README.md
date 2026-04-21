# SecureOApp

**Secure-by-default LayerZero OApp/OFT SDK.** A drop-in replacement for LayerZero's OApp/OFT templates that refuses to deploy with insecure DVN configurations. You can't ship a 1/1 bridge through this SDK.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-v0.1%20preview-orange)](https://github.com/gopikannappan/SecureOApp/releases)

---

## Why

40% of LayerZero OApps run 1/1 DVN configurations because it is the default in LayerZero's own quickstart. Kelp DAO lost $292M on April 18, 2026 to this exact config. Single-verifier bridges are a known, documented failure mode. SecureOApp inverts the default: **safe is the path of least resistance, insecure requires explicit override with documented justification.**

Read the launch post: [`docs/kelp-post-mortem.md`](./docs/kelp-post-mortem.md).

## Quick start

```bash
# Scaffold a new OApp project with secure defaults
npx secure-oapp init my-oapp
cd my-oapp

# Validate the config before deploying
npx secure-oapp validate --profile standard

# Deploy — will refuse if DVN config is insecure
npx secure-oapp deploy --profile standard --network base-sepolia

# Compare fees across profiles
npx secure-oapp quote --from base-sepolia --to arbitrum-sepolia
```

Or import the contract directly:

```solidity
import { SecureOApp } from "@secure-oapp/contracts/SecureOApp.sol";

contract MyOApp is SecureOApp {
    constructor(address endpoint, address owner, bytes32 profile)
        SecureOApp(endpoint, owner, profile) {}
}
```

## Security profiles

| Profile    | Required DVNs | ZK required | Intended use                              |
|------------|---------------|-------------|-------------------------------------------|
| `standard` | 2 of 3        | Yes (1)     | Default for most OApps                    |
| `paranoid` | 3 of 5        | Yes (2)     | LRTs, stablecoins, high-TVL bridges       |
| `lite`     | 2 of 2        | No          | Low-value testnets, L2-to-L2 utility msgs |

Details: [`docs/PROFILES.md`](./docs/PROFILES.md).

## Packages

- [`contracts/`](./contracts) — Foundry project. `SecureOApp.sol`, `SecureOFT.sol`, `DVNValidator.sol`, `DVNRegistry.sol`.
- [`packages/core/`](./packages/core) — `@secure-oapp/core`. Profiles, DVN registry, config validator, `security.md` generator.
- [`packages/cli/`](./packages/cli) — `secure-oapp` CLI. `init`, `deploy`, `validate`, `quote`.
- [`packages/hardhat-plugin/`](./packages/hardhat-plugin) — `@secure-oapp/hardhat` Hardhat plugin.
- [`examples/oft-standard/`](./examples/oft-standard) — Example OFT using the `standard` profile, Base Sepolia ↔ Arbitrum Sepolia.

## Development

```bash
pnpm install
pnpm build
pnpm test             # TS packages
pnpm test:contracts   # Foundry
```

Requires Node >= 18.17, pnpm >= 9, Foundry (for contracts).

## Status

v0.1 preview. 

## Contributing

DVN registry additions welcome — see [`docs/CONTRIBUTING.md`](./docs/CONTRIBUTING.md). For security issues, [`docs/SECURITY.md`](./docs/SECURITY.md).

## License

MIT. Published as a public good. See [`LICENSE`](./LICENSE).
