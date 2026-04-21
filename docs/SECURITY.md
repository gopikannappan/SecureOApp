# Security policy

## Reporting vulnerabilities

Open a [private security advisory](https://github.com/gopikannappan/SecureOApp/security/advisories/new) on GitHub with:

- A description of the vulnerability and affected package/version.
- Proof-of-concept (PoC) or reproduction steps.
- Your PGP key if you want the response encrypted.

We aim to acknowledge within 48 hours and triage within 5 business days. Please do not open a public issue for security reports.

## Scope

In-scope:

- `contracts/` — any path that affects DVN validation, enforcement, or registry integrity.
- `packages/core` — validator, profiles, registry.
- `packages/cli` + `packages/hardhat-plugin` — config parsing, file emission, process integration.

Out of scope:

- Network-level / infrastructure issues unrelated to SecureOApp code.
- LayerZero endpoint or DVN operator bugs. Report those to the respective vendor; link us if you'd like us to coordinate.

## Response process

1. Acknowledge the report and assign a tracking ID.
2. Reproduce and triage. Agree severity with the reporter.
3. Develop a fix in a private branch. Request a CVE if warranted.
4. Coordinate disclosure date. Bias toward fast public release once a patched version exists.
5. Publish a post-mortem in `docs/incidents/<id>.md` and a GitHub release note; credit the reporter unless they opt out.

## Bounty

v0.1 does not fund a formal bounty. We'll credit you publicly and point you toward relevant Immunefi listings (LayerZero, Polyhedra) if your finding overlaps their scope.

## Threat model

See [`THREAT_MODEL.md`](./THREAT_MODEL.md) for the concrete adversaries and invariants this project defends against.
