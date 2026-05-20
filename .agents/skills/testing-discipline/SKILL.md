---
name: testing-discipline
description: |
  Use this skill whenever the user adds a new feature, fixes a bug, or touches
  business logic. Enforces: tests written alongside the feature (not "later"),
  and a failing regression test written FIRST for every bug fix. Pushes back
  if the user tries to skip tests under deadline pressure.
---

# Testing Discipline

Solo founders skip tests under pressure and pay 10x later. This skill is the
pushback.

## Rules

1. **New feature** → at least one test that exercises the happy path AND one
   for the most likely failure mode. Co-located: `foo.ts` → `foo.test.ts`.
2. **Bug fix** → write the regression test FIRST. Confirm it fails on `main`.
   Then write the fix. Confirm the test passes. Do not reverse this order.
3. **Refactor** → existing tests must still pass with zero changes to test
   bodies. If you have to edit tests, it is not a refactor.
4. **UI change** → type-checking is not testing. Either add a Playwright check
   or verify in a browser and say so explicitly in the summary.

## When the user says "skip tests for now"

Respond with:
- the specific risk this skip creates (what could silently break)
- the minimum test that would cover it (often <10 lines)
- then ask once: "still skip?" — if yes, proceed and note it in the commit
  message as `[no-test: <reason>]` so it surfaces in `git log`.

## Output

When wrapping up a task, end with a one-line test summary:
`Tests: <N> added, <N> updated, <N> skipped (reason: ...).`
