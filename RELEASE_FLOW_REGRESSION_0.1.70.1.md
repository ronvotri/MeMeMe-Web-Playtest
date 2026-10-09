# MeMeMe 0.1.70.1 — Release Flow Regression Matrix

Status: **TEST DESIGN COMPLETE / RUNTIME UNVERIFIED**  
Baseline: `PLAYTEST_GUIDE.md` (0.1.70.1). This document is a test specification, **not a claim of runtime PASS**.

## Invariants

- Jail/hospital release roll is consumed exclusively by the release decision.
- On failed release, the held player stays on the special tile and finishes their turn.
- On successful release, `specialHold` clears, `lastRoll` is reset to `null`, and the same player returns to `PRE_ROLL_ACTION`.
- A **new independent D6 roll** is required before moving. Release face must never become movement distance.
- The same rules apply to human and CPU seats, irrespective of visible modal timing.
- A modal is a presentation layer, never an authority lock.

## Test matrix

| ID | Actor | Tile | Result | Expected |
|---|---|---|---|---|
| J-H-F | Human | Jail | Fail | No movement; held; next player's turn |
| J-H-S | Human | Jail | Success | Release feedback; fresh D6; same player moves new pip count |
| H-H-F | Human | Hospital | Fail | No movement; held; next player's turn |
| H-H-S | Human | Hospital | Success | Discharge feedback; fresh D6; same player moves new pip count |
| J-C-F | CPU | Jail | Fail | No movement; CPU turn ends without input deadlock |
| J-C-S | CPU | Jail | Success | Modal cannot block fresh CPU D6 and movement |
| H-C-F | CPU | Hospital | Fail | No movement; CPU turn ends without input deadlock |
| H-C-S | CPU | Hospital | Success | Modal cannot block fresh CPU D6 and movement |
| J-H-D | Human | Jail | Success | Release D6 and movement D6 deliberately different; actual movement equals **new** roll |
| H-C-D | CPU | Hospital | Success | Release D6 and movement D6 deliberately different; actual movement equals **new** roll |
| J-C-M | CPU | Jail | Success | Leave modal open until its normal close; verify CPU resumes rather than hanging |
| H-C-M | CPU | Hospital | Success | Modal timing cannot double-trigger release or movement |
| T-CHAIN | Any | Special tile | Fail then later success | Both turns tracked; release does not skip a turn or duplicate rewards |
| T-TRAIT | Both | Both | Career exceptions | Police/doctor/thief/cascader release faces follow 0.1.70 rules |
| T-RNG | Both | Both | Replay | Deterministic replay consumes one release D6 plus one new movement D6 on success |
| T-EVENT | Both | Both | Success | No movement B$ update or landing effect before token arrives |
| T-INPUT | Human | Both | Success | One confirmed input causes one roll, never two |
| T-PRESENT | Both | Both | Any | Jail/Hospital feedback and action text fit 1280×800 and 960×540 without clipping |

## Runtime execution protocol

1. Record version/build hash, browser/OS, seat (human/CPU), tile and career trait.
2. Use an authoritative saved state or deterministic replay to reach the held state; **do not** treat a manually edited UI as authoritative.
3. Observe release D6 outcome, hold state, turn owner, `lastRoll`, and phase transition.
4. For success, verify a second independent RNG consumption before movement; capture both die faces.
5. Confirm movement distance, landing resolution, money event ordering, and eventual turn advance.
6. Record PASS/FAIL with screenshot/replay and exact reproduction steps per test ID.
7. Only mark 0.1.70.1 runtime accepted after the four human/CPU × jail/hospital success paths plus failure paths have been exercised.

## Regression guardrail

This is **not a gameplay balance change**. Keep the established career release face table, Host authority, networking, passive chances, B$, animations, and presentation sequence unchanged unless a reproducible defect explicitly requires a patch.

## Unresolved / honest status

- Live browser execution: **not performed in this document**.
- Automated seeded runtime tests: **not demonstrated**.
- No proof yet that the production minified bundle implements every invariant.
- Do not promote the release from `PENDING HUMAN ACCEPTANCE` to PASS based only on CI or this checklist.
