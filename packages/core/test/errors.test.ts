import test from "node:test";
import assert from "node:assert/strict";
import { POST_MORTEMS, formatValidationError, type ValidationError } from "../src/errors.js";

const ALL_KINDS: ValidationError["kind"][] = [
  "RequiredDVNCountTooLow",
  "EffectiveThresholdTooLow",
  "ZkDVNCountTooLow",
  "OperatorDiversityTooLow",
  "DVNNotRegistered",
  "DuplicateDVN",
  "ConfirmationsTooLow",
  "InvalidOptionalThreshold",
];

test("every ValidationError kind has a POST_MORTEMS entry", () => {
  for (const kind of ALL_KINDS) {
    const pm = POST_MORTEMS[kind];
    assert.ok(pm, `${kind} has no post-mortem link`);
    assert.ok(pm.incident.length > 0, `${kind} post-mortem has no incident`);
    assert.ok(pm.url.startsWith("https://"), `${kind} post-mortem url must be https`);
    assert.ok(pm.rootCause.length > 0, `${kind} post-mortem missing rootCause`);
  }
});

test("formatValidationError includes kind, description, and post-mortem info", () => {
  const msg = formatValidationError({ kind: "RequiredDVNCountTooLow", actual: 1, min: 2 });
  assert.match(msg, /RequiredDVNCountTooLow/);
  assert.match(msg, /requiredDVNCount=1/);
  assert.match(msg, /min=2/);
  assert.match(msg, /Kelp/);
  assert.match(msg, /https:\/\//);
});

test("formatValidationError handles every error kind without throwing", () => {
  const samples: Record<ValidationError["kind"], ValidationError> = {
    RequiredDVNCountTooLow: { kind: "RequiredDVNCountTooLow", actual: 1, min: 2 },
    EffectiveThresholdTooLow: { kind: "EffectiveThresholdTooLow", actual: 1, min: 2 },
    ZkDVNCountTooLow: { kind: "ZkDVNCountTooLow", actual: 0, min: 1 },
    OperatorDiversityTooLow: { kind: "OperatorDiversityTooLow", actual: 1, min: 2 },
    DVNNotRegistered: { kind: "DVNNotRegistered", dvn: "0x0000000000000000000000000000000000000000" },
    DuplicateDVN: { kind: "DuplicateDVN", dvn: "0x0000000000000000000000000000000000000001" },
    ConfirmationsTooLow: { kind: "ConfirmationsTooLow", actual: 1n, min: 5n },
    InvalidOptionalThreshold: { kind: "InvalidOptionalThreshold", threshold: 2, optionalCount: 1 },
  };
  for (const kind of ALL_KINDS) {
    const msg = formatValidationError(samples[kind]);
    assert.ok(msg.length > 0, `${kind} produced empty formatted message`);
    assert.match(msg, new RegExp(kind));
  }
});
