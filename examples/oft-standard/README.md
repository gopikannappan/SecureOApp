# oft-standard

Example: an OFT (omnichain fungible token) deployed with SecureOApp's `standard` profile across Base Sepolia ↔ Arbitrum Sepolia.

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

## Deployment addresses

Placeholder until deploy keys are wired. Fill in after `pnpm deploy:src` / `deploy:dst`:

- Base Sepolia: `<not deployed>`
- Arbitrum Sepolia: `<not deployed>`
