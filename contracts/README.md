# @secure-oapp/contracts

Foundry package. On-chain enforcement of secure LayerZero DVN configurations.

## Install

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
forge build
forge test -vv
```

## Layout

- `src/SecureConfigBase.sol` — mix-in for any OApp. Exposes `setSecureSendConfig`/`setSecureReceiveConfig` which validate before forwarding to the LayerZero endpoint.
- `src/SecureOApp.sol` — minimal abstract OApp that inherits `SecureConfigBase`.
- `src/SecureOFT.sol` — OFT variant.
- `src/libraries/DVNValidator.sol` — pure validation. Takes a `UlnConfig`, a profile, and a registry; reverts on violation.
- `src/libraries/Profiles.sol` — profile constants (`STANDARD`, `PARANOID`, `LITE`) and `Profile` struct.
- `src/registry/DVNRegistry.sol` — per-chain registry of known DVN addresses tagged with operator + ZK flag.
- `src/registry/IDVNRegistry.sol` — interface.
- `src/interfaces/ILayerZeroEndpointV2.sol` — minimal LZ V2 endpoint interface (subset).
- `src/interfaces/IUlnConfig.sol` — ULN `UlnConfig` struct + encoding helpers.

## Design

1. **Validation is a pure library** — `DVNValidator.validate(UlnConfig, Profile, IDVNRegistry)` reverts with typed errors. Can be unit-tested offline and reused by the TS tooling via fixtures.
2. **Enforcement is opt-in via inheritance** — the user's contract extends `SecureConfigBase` (or `SecureOApp`). The LayerZero endpoint is still the source of truth; we just refuse to forward invalid configs.
3. **Registry is per-chain** — a `DVNRegistry` is deployed once per chain. The same DVN operator has different addresses on different chains, so the registry is intentionally local.
4. **No heavy dependencies** — we define minimal interfaces against LayerZero V2 instead of pulling `@layerzerolabs/lz-evm-oapp-v2`. Users bring their own OApp base and extend our mixin.
