# secure-oapp

Command-line tool for SecureOApp. Scaffolds projects, validates configs, refuses to deploy unsafe DVN setups.

## Install

```bash
pnpm add -g secure-oapp
# or use without installing
npx secure-oapp <command>
```

## Commands

| Command | Description |
|---|---|
| `secure-oapp init [name]` | Scaffold a new LayerZero OApp with secure defaults. |
| `secure-oapp validate` | Validate `secure-oapp.config.json` against its declared profile. |
| `secure-oapp deploy` | Validate, emit `security.md`, then invoke `hardhat deploy`. |
| `secure-oapp quote` | Compare relative fees across profiles. |
| `secure-oapp registry chains` | List chains in the bundled registry. |
| `secure-oapp registry list <chain>` | List DVNs on a chain. |

## Example

```bash
npx secure-oapp init my-oapp --profile standard \
  --src-chain base-sepolia --dst-chain arbitrum-sepolia

cd my-oapp && pnpm install
npx secure-oapp validate
npx secure-oapp deploy --network base-sepolia
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | Validation failed, or deploy error |

`deploy --skip-validate` is provided as a recovery escape hatch only. Using it defeats the point of this tool.
