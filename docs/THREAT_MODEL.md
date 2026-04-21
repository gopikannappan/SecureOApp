# Threat model

## In-scope adversaries

1. **Single-DVN operator compromise.** An attacker who gains signing authority over exactly one DVN. Defended by: `minRequiredDVNCount >= 2`, `minEffectiveThreshold >= 2`.
2. **Correlated operator compromise.** An attacker who compromises multiple DVNs run by the same operator (e.g., two LayerZero Labs DVNs on a chain). Defended by: `minDistinctOperators`.
3. **Multi-sig / custody-only verifier compromise.** All non-ZK DVNs are ultimately a quorum of signing keys. Defended by: `minZkDVNCount` forces at least one cryptographic-proof verifier in the set.
4. **Unknown / unaudited DVN substitution.** An attacker inducing a developer to include a DVN whose provenance isn't verified. Defended by: `DVNValidator` rejects any address not in the on-chain `DVNRegistry`.
5. **Config regression.** An operator later loosens the DVN config after initial deploy. Defended by: enforcement is tied to `setConfig`, which the `SecureConfigBase` delegate mediates and logs as `SecureConfigEnforced`.
6. **Source-chain reorg replay.** A short-finality source chain reorgs after a DVN has signed. Defended by: `minConfirmations` enforces a profile-appropriate block-depth buffer.

## Out-of-scope

- Bugs in LayerZero's MessageLib / endpoint contracts themselves.
- Cryptographic breaks in the underlying ZK verifier (e.g., a soundness bug in Polyhedra). Mitigated but not defended against — `paranoid` requires two independent ZK stacks precisely because no single stack is trusted to be bug-free.
- Governance attacks on the `DVNRegistry` owner key. Mitigated by key rotation policy; outside the contract's guarantee.
- Social engineering the developer into choosing `lite` or invoking `overrideProfile` with a false justification.

## Invariants

- **I1:** No call to `setSecureSendConfig` / `setSecureReceiveConfig` succeeds unless the submitted `UlnConfig` satisfies `currentProfile()`.
- **I2:** Every successful enforcement emits `SecureConfigEnforced(eid, isSend, profileId)`. The event stream is a complete audit log.
- **I3:** Every profile change emits `ProfileOverride(old, new, justification)`. Ex-post auditors can reconstruct every profile that was ever active.
- **I4:** The Solidity `DVNValidator.validate` and the TS `validate` function accept/reject the same `UlnConfig + Profile + Registry` triples. Any divergence is a bug.

## Known limitations

- **Registry trust root.** We treat `DVNRegistry` as an oracle of operator identity. If the registry owner signs a bad entry, the validator rubber-stamps it. Mitigation: registry is intended to be multi-sig with public governance; PRs that add entries reference the operator's published DVN address.
- **Profile ID collisions.** Profiles are identified by a keccak of a version string. A future profile sharing an ID would break parity. Naming convention enforces uniqueness per major version.
- **`--skip-validate` on the CLI** is a recovery escape hatch. Using it bypasses all protections. Teams should make this a break-glass operation requiring dual approval.
