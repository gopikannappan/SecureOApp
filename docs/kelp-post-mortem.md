# Kelp DAO lost $292M. SecureOApp's `standard` profile would have refused the config.

**Date:** April 18, 2026.
**Loss:** $292M across Kelp's rsETH bridge lanes.
**Root cause:** 1/1 DVN configuration on the Ethereum → Arbitrum lane. A single DVN operator's signing key was compromised; the attacker forged a transfer message that finalized with no second-verifier quorum to catch it.

This is not a novel failure mode. It is the same failure mode as Ronin (2022, $625M), Multichain (2023, $126M), and Orbit Chain (2023, $82M). The failure mode is: one set of keys, one point of compromise, no cryptographic backstop.

## Why 1/1 still ships in 2026

LayerZero's own quickstart template defaults to 1/1. Their audit docs recommend 2/3 with at least one ZK DVN for "production" apps — but "production" is defined nowhere enforceable. 40% of deployed OApps run 1/1 as of the week before the Kelp incident. Developers optimize for time-to-main, not time-to-safety.

The cost delta between 1/1 and a 2/3+ZK config is roughly 3 cents per message. The cost of being wrong is $292M. The ratio is absurd and yet the default persists because reading 10 pages of DVN documentation to make an informed choice is more expensive, right now, than shipping the default and moving on.

## What SecureOApp does about it

`secure-oapp` is a drop-in replacement for LayerZero's OApp/OFT templates. The only thing it does differently: refuse to ship unsafe configs.

Here is the actual output of `secure-oapp validate` against a synthetic 1/1 config matching what public post-mortems describe ([Blockaid's writeup](https://www.blockaid.io/blog/how-a-single-layerzero-dvn-compromise-drained-292m-from-kelpdao) is the cleanest external reference). The exact addresses used by Kelp are not fully public at time of writing; the validator's reasoning is what matters — the shape of the config is what determines the refusal:

```
✗ RequiredDVNCountTooLow: requiredDVNCount=1 < min=2. Increase requiredDVNs to at least 2.
  See post-mortem: Kelp DAO bridge compromise ($292M, 2026-04-18)
  https://www.blockaid.io/blog/how-a-single-layerzero-dvn-compromise-drained-292m-from-kelpdao
  Root cause: Single DVN compromised; a 1/1 config has no second verifier to catch a forged message.

✗ ZkDVNCountTooLow: zkDVNs=0 < min=1. Add a ZK verifier (Polyhedra/Succinct) to the DVN set.
  See post-mortem: Multichain / Anyswap (~$126M, 2023-07-07)
  https://rekt.news/multichain-rekt2/
  Root cause: MPC key custody failure across operator-controlled signers; no cryptographic verifier to cross-check.
```

The deploy exited with code `1`. No transaction was sent.

_Reproduce: `git clone`, `pnpm install`, run `secure-oapp validate` against the [1/1 test fixture](../packages/cli/test/e2e.test.ts) — the "validate exits 1 on a 1/1 config" test captures exactly this flow. When Kelp's full post-mortem publishes the concrete config their OFT was running, this section will be updated to use that config verbatim._

## The three profiles

- `standard` (default). Minimum 2 required DVNs, at least one ZK, two distinct operators, 5+ confirmations. For any OApp.
- `paranoid`. Minimum 3/5, two ZK, three operators, 15+ confirmations. For stablecoins, LRTs, high-TVL.
- `lite`. Minimum 2/2, no ZK requirement. For testnets and low-value L2-to-L2 messages. Still refuses 1/1.

The full rationale is in [`docs/PROFILES.md`](./PROFILES.md).

## How to adopt in 90 seconds

```bash
npx secure-oapp init my-oapp --profile standard
cd my-oapp
# Edit contracts/MyOApp.sol with your messaging logic
pnpm install
npx secure-oapp validate
npx secure-oapp deploy --network base-sepolia
```

For an existing OApp, the migration is:

```solidity
// Before
contract MyOFT is OFT { ... }

// After
contract MyOFT is OFT, SecureOApp { ... }
```

Then replace `endpoint.setConfig(...)` calls in your deploy scripts with `myOft.setSecureSendConfig(dstEid, ulnConfigBytes)`. If your current config is unsafe, the migration will throw and tell you exactly what's wrong.

## Why open-source this

We think bridge security is a public good. The tooling that enforces it should be free, auditable, and distributable. `secure-oapp` is MIT-licensed and will remain so.

If LayerZero ships equivalent enforcement in v3 and makes `secure-oapp` redundant, that's a win — the premise was that the default should be safe, and the premise will have won. Until then, this exists.

## Coordinates

- GitHub: https://github.com/gopikannappan/SecureOApp
- NPM: `secure-oapp`, `@secure-oapp/core`, `@secure-oapp/hardhat`
- Issues & DVN registry PRs: welcomed.
- Security reports: open a [GitHub security advisory](https://github.com/gopikannappan/SecureOApp/security/advisories/new).

— Gopi Kannappan. More at [github.com/gopikannappan](https://github.com/gopikannappan).
