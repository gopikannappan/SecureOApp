# Contributing

This project is a credibility artifact. We prioritize clarity, correctness, and documented rationale over feature breadth.

## Ground rules

- **Enforcement parity.** Any change to validation logic must update both `contracts/src/libraries/DVNValidator.sol` and `packages/core/src/validator.ts`. A test that fails if the two disagree lives in `packages/core/test/validator.test.ts` (fixture parity) and `contracts/test/DVNValidator.t.sol` (shape parity).
- **No secret defaults.** Every constraint that refuses a config must have a documented reason in `docs/PROFILES.md` and a post-mortem link in `packages/core/src/errors.ts`.
- **Registry edits are the ball game.** Wrong DVN addresses produce false positives/negatives. DVN registry PRs must link the operator's public address announcement.

## Adding a DVN to the registry

1. Confirm the address from the operator's official channel (docs site or signed tweet). Link both the archived URL and the announcement in the PR.
2. Add the entry to `packages/core/src/registry/defaults.ts`.
3. If the operator is new, add an `OperatorId` in `packages/core/src/types.ts` and a `DVNOperators.<NAME>` constant in `contracts/src/registry/DVNRegistry.sol` (`keccak256(bytes("<slug>"))`).
4. On the target chain's `DVNRegistry`, submit the corresponding on-chain `register` transaction. Include the tx hash in the PR description.
5. Reviewer checks: (a) announcement is reachable and cryptographically linked to the operator; (b) chain keys match; (c) `isZk` flag is correct.

## Adding a profile

1. Define the constraints in both `contracts/src/libraries/Profiles.sol` and `packages/core/src/profiles.ts`.
2. Add a keccak-based ID: `keccak256("secure-oapp.profile.<name>.v1")`. Confirm collision-free via the `profile ids reverse to names` test.
3. Update `docs/PROFILES.md` with the rationale table row and a short motivating paragraph.
4. Add parity tests in both `contracts/test/DVNValidator.t.sol` and `packages/core/test/validator.test.ts`.

## Running the test suite

```bash
pnpm install
pnpm -r --filter "./packages/*" build
pnpm test              # TS — node:test via tsx
pnpm test:contracts    # Foundry
```

## Review expectations

- One logical change per PR. A new profile, a new DVN, a bug fix — pick one.
- Solidity changes link the deployment + verification tx hashes for any chain the registry touches.
- CLI / plugin changes include an end-to-end exercise or an updated `secure-oapp --help` snippet.

## Roadmap nudges

- Live `quoteSend` integration in `secure-oapp quote` (v0.2).
- Foundry plugin that mirrors the Hardhat plugin (`forge secure-oapp validate`).
- Multi-sig-owned registry with public governance.
