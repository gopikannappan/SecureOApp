# Solidity ↔ TypeScript parity matrix

The Solidity `DVNValidator` and the TypeScript `validate` function are two implementations of the same logic. This matrix is the source of truth: both sides carry matching parity tests (`contracts/test/Parity.t.sol` and `packages/core/test/parity.test.ts`). Every row must produce the same pass/fail outcome on both sides.

A change in one implementation requires updating the other AND updating this matrix. PRs that break parity must be rejected.

| Case ID | Profile   | Required count | Optional count/threshold | ZK DVNs present | Distinct operators | Confirmations | Expected | Rationale |
|---------|-----------|----------------|--------------------------|-----------------|--------------------|---------------|----------|-----------|
| P1 | standard | 2 | 1 / 0 | 1 | 2 | 15 | PASS | Canonical standard configuration |
| P2 | standard | 1 | 0 / 0 | 0 | 1 | 15 | FAIL RequiredDVNCountTooLow | 1/1 is always refused |
| P3 | standard | 2 | 0 / 0 | 0 | 1 | 15 | FAIL OperatorDiversityTooLow | Two DVNs, same operator |
| P4 | standard | 2 | 0 / 0 | 0 | 2 | 15 | FAIL ZkDVNCountTooLow | No ZK verifier |
| P5 | paranoid | 3 | 2 / 1 | 2 | 5 | 30 | PASS | Canonical paranoid configuration |
| P6 | paranoid | 2 | 1 / 0 | 1 | 2 | 15 | FAIL RequiredDVNCountTooLow | Standard-shaped config fails paranoid |
| P7 | lite | 2 | 0 / 0 | 0 | 2 | 1 | PASS | Canonical lite configuration |
| P8 | lite | 2 | 0 / 0 | 0 | 1 | 1 | FAIL OperatorDiversityTooLow | Lite still requires 2 distinct operators |
| P9 | standard | 2 | 1 / 0 | 1 | 2 | 1 | FAIL ConfirmationsTooLow | Standard requires ≥ 5 confirmations |
| P10 | standard | 2 | 1 / 0 | 1 | 2 | 15 | FAIL DVNNotRegistered | Unknown DVN substituted for a required slot |

## How to add a case

1. Append a row to this table with the next `P` id.
2. Add the case to `contracts/test/Parity.t.sol::PARITY_CASES`.
3. Add the case to `packages/core/test/parity.test.ts::PARITY_CASES`.
4. Run both test suites. A PR that updates only one side is a parity regression.
