# Profiles

SecureOApp ships three preset profiles. Each profile is a set of minimum constraints on the `UlnConfig` that a LayerZero OApp sets on its endpoint. Profile IDs are the keccak256 of a canonical version string, so they're identical in Solidity and TypeScript.

| Profile    | Required DVNs | Effective threshold | ZK DVNs | Distinct operators | Min confirmations |
|------------|---------------|---------------------|---------|--------------------|-------------------|
| `standard` | 2             | 2                   | 1       | 2                  | 5                 |
| `paranoid` | 3             | 3                   | 2       | 3                  | 15                |
| `lite`     | 2             | 2                   | 0       | 2                  | 1                 |

## Why these numbers

### `standard` — 2/3 with ≥ 1 ZK

The default. Picked so that compromising a single operator cannot finalize a fraudulent message, and so that at least one verifier is a cryptographic proof (not a multi-sig). Two distinct operators prevents the "two seats, one org" failure that homogenizes a quorum in practice.

This is the profile for most OApps. `standard` is the floor below which LayerZero apps should not deploy given what is already known about bridge failure modes.

### `paranoid` — 3/5 with ≥ 2 ZK

For apps that custody meaningful value. LRTs, stablecoins, anything where a single-lane compromise would be catastrophic. Two independent ZK verifiers (Polyhedra + Succinct, or equivalent) means a soundness failure in one cryptography stack doesn't break the bridge. Three distinct operators removes any plausible "correlated operator takedown" scenario.

At April 2026 gas prices, this costs roughly 3–5x `standard` per message. For a bridge moving >$10M/day, this is a rounding error.

### `lite` — 2/2, no ZK requirement

For low-value testnets and L2-to-L2 utility messages where operator diversity is the only risk being managed. Still refuses 1/1. This exists so we don't make developers bypass the tool entirely to ship internal integrations that don't warrant a ZK verifier.

## Choosing

| Use case                                        | Profile     |
|-------------------------------------------------|-------------|
| Default for any new OApp                        | `standard`  |
| LRT, stablecoin, omnichain governance           | `paranoid`  |
| Testnet fixtures, internal L2-to-L2 utility msg | `lite`      |
| 1/1 config                                      | Not shipped |

## Overriding

An admin can call `overrideProfile(newId, justification)` on the deployed `SecureConfigBase`. This:

- Emits `ProfileOverride(old, new, justification)` on-chain so auditors can always retrieve the full history.
- Affects only *future* `setSecureSendConfig` / `setSecureReceiveConfig` calls. Past configs stand.
- Is gated by `secureAdmin`. Rotate the admin key with `transferSecureAdmin`.

There is no override to drop below `lite`. To ship a 1/1 config you must bypass SecureOApp entirely — at which point the `SecureConfigEnforced` event trail stops and your `security.md` will reflect an unmanaged state.

## Adding new profiles

Extending the profile set requires changes in both Solidity (`contracts/src/libraries/Profiles.sol`) and TypeScript (`packages/core/src/profiles.ts`), plus a test proving parity. See [`docs/CONTRIBUTING.md`](./CONTRIBUTING.md).
