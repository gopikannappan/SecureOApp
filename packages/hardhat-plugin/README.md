# @secure-oapp/hardhat

Hardhat plugin for SecureOApp. Validates your DVN config before deploying.

## Install

```bash
pnpm add -D @secure-oapp/hardhat @secure-oapp/core
```

Then in `hardhat.config.ts`:

```ts
import "@secure-oapp/hardhat";

export default {
  solidity: "0.8.22",
  secureOApp: {
    profile: "standard",
    configPath: "./secure-oapp.config.json",
    securityMdPath: "./security.md",
  },
  // networks, etc.
};
```

## Tasks

| Task | Description |
|---|---|
| `secure-oapp:validate` | Validate the config against the declared profile. |
| `secure-oapp:write-security-md` | Render `security.md` from the config. |
| `secure-oapp:deploy --network <n>` | Validate, emit security.md, then run the deploy script. |

## Fail-fast behavior

`secure-oapp:deploy` refuses to proceed unless every lane passes validation. There is no `--skip-validate` flag on the Hardhat side — if you need to ship a recovery config, use the `secure-oapp` CLI with `--skip-validate` and accept that `security.md` will reflect the unsafe state.
