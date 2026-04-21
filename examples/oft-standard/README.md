# oft-standard (testnet uses `lite` profile)

Example: an OFT (omnichain fungible token) deployed across Base Sepolia ↔ Arbitrum Sepolia.

**Note on profile choice.** This example uses the `lite` profile because Polyhedra's zkBridge DVN is not broadly deployed on Sepolia testnets (it's a production verifier). For a real mainnet deployment, switch `profile` to `standard` and add a Polyhedra DVN to each lane — the `secure-oapp quote` output shows the per-profile fee delta. See [`docs/PROFILES.md`](../../docs/PROFILES.md).

## Exercise it

```bash
pnpm install                # at the monorepo root
cd examples/oft-standard
pnpm validate               # runs `secure-oapp validate`
pnpm quote                  # fee comparison across profiles
```

## What's here

- `hardhat.config.ts` — wires the `@secure-oapp/hardhat` plugin with `profile: "standard"`.
- `contracts/StandardOFT.sol` — an OFT that extends `SecureOApp`. The wrapper validates DVN configs on every `setConfig` call.
- `secure-oapp.config.json` — send/receive `UlnConfig` for the Base Sepolia → Arbitrum Sepolia lane, using real DVN addresses from the registry.
- `scripts/deploy.ts` — deploys the OFT and sets the secure config.

## Try the insecure case

Edit `secure-oapp.config.json` and drop `requiredDVNCount` to `1` or swap a required DVN out for `0x000...`. Run `pnpm validate` — it should refuse with a post-mortem link pointing at the Kelp incident.

## Deployed addresses (2026-04-21)

DVN registries deployed via `contracts/script/DeployRegistry.s.sol`:

- Base Sepolia: [`0x7A5705030D3Cbc0436Dc3df9ce7b9ab974aF976e`](https://sepolia.basescan.org/address/0x7A5705030D3Cbc0436Dc3df9ce7b9ab974aF976e)
- Arbitrum Sepolia: [`0x7A5705030D3Cbc0436Dc3df9ce7b9ab974aF976e`](https://sepolia.arbiscan.io/address/0x7A5705030D3Cbc0436Dc3df9ce7b9ab974aF976e)

Each registry is seeded with three DVNs on its chain (LayerZero Labs, Nethermind, Horizen). OFT deployment pending — the registries alone are enough to demonstrate the enforcement path via `secure-oapp validate`.
