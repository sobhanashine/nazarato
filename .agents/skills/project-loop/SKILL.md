---
name: project-loop
description: |
  Use this skill at the START of every non-trivial task — new feature, bug
  fix, refactor, or anything that touches more than one file — and again at
  the END once the work passes its checks. Reads docs/PROJECT.md before any
  code is written so the change matches existing architecture and
  conventions; after the change passes tests + typecheck, appends a one-line
  entry to the doc's changelog and updates the Architecture or Conventions
  sections if anything in them is now stale. Skip only for true one-line
  fixes (typos, version bumps, comment tweaks).
---

# Project Loop

This skill keeps `docs/PROJECT.md` accurate as the project evolves. Without
it, the doc rots within a week and stops being trustworthy. The loop has
three phases: **read → build → update**.

If `docs/PROJECT.md` does not exist, STOP and tell the user to bootstrap it
(or offer to seed it from the current codebase) before continuing.

---

## Phase 1 — Read (before any code)

1. Read **all of `docs/PROJECT.md`**. Not a skim — actually load it.
2. Identify the sections relevant to the task:
   - Touching routes / layout / framework wiring? → §1 Architecture & Stack
   - Touching naming, TS rules, styling, workflow? → §2 Conventions & Decisions
   - About to hit something flagged in §3 Open items? → resolve or note it
3. If the task **contradicts** something in the doc (e.g. user asks to add a
   `pages/` directory, or to use `any`), pause and surface the conflict
   before writing code. Ask: "doc says X, you're asking for Y — update the
   doc, or keep the rule?"
4. If the doc is **silent** on a decision the task forces (e.g. picking a
   form library, picking a state pattern), call that out: "PROJECT.md has no
   rule for this — I'll pick Z and add it to Conventions on the way out."

Only after this is done, start the work.

---

## Phase 2 — Build

Do the task normally. The relevant sections of PROJECT.md are now your
constraints — treat them like lint rules.

---

## Phase 3 — Pass checks, then update

### 3a. Run the checks

Before touching the doc, the change must pass:

1. `npx tsc --noEmit` — TypeScript clean.
2. **Tests** — if `package.json` has a `test` script, run it. If not (current
   state — see PROJECT.md §3), run `npx eslint .` as the minimum gate and
   note in the summary that tests are not wired yet.
3. For UI changes: verify in a browser per `AGENTS.md`. Type-check alone is
   not a pass for UI.

If any check fails, **do not update the doc**. Fix the failure first.

### 3b. Append to the changelog

In `docs/PROJECT.md`, between the markers:

```
<!-- project-loop:changelog:start -->
<!-- project-loop:changelog:end -->
```

prepend a single new bullet at the top in this exact shape:

```
- **YYYY-MM-DD** — <one-line what shipped>. Files: `path/one.tsx`, `path/two.ts`. <Optional: new decision worth remembering.>
```

Newest entry on top. Keep it to one line. If you need a paragraph, the
finding belongs in §1 or §2, not the changelog.

### 3c. Update Architecture / Conventions if the truth changed

Only edit §1 or §2 when the change makes the existing text wrong or
incomplete. Examples that require an edit:

- New top-level folder, new route, new integration → §1 table or subsection.
- New env var the app now depends on → §1 (and §3 if not yet documented).
- A new rule the team should follow next time ("we picked Vitest", "forms
  use react-hook-form", "all server actions live in `app/_actions/`") → §2.
- Resolved an item in §3 → remove it from §3.

Do NOT edit §1 or §2 for one-off implementation details — those belong in
the changelog bullet or in code comments where relevant.

### 3d. Summarise

End the response with a 2-line block:

```
PROJECT.md: <changelog appended | architecture updated: <section> | conventions updated: <section> | no edits needed>
Checks: tsc <pass/fail>, tests <pass/fail/not-wired>, lint <pass/fail/skipped>
```

---

## When to skip this skill

Only for genuinely trivial edits:

- Single-line typo or copy fix
- Dependency version bump with no API change
- Comment-only edits
- Reverting a commit

Everything else — including "small" refactors — runs the loop. Small
refactors are exactly where the doc silently rots.
