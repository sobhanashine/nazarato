---
name: frontend-feature
description: |
  Use this skill when the user invokes `/frontend-feature <description>` to
  build a new frontend feature end-to-end. Orchestrates the project's other
  skills in order: `spec-first` (write the one-page spec) → `frontend-design`
  (pick the visual approach) → `senior-frontend` (implement) →
  `testing-discipline` (co-located tests) → `security-review` (if the change
  touches auth, inputs, route handlers, or server actions) → `qa-rampage`
  (full pre-ship gate) → `commit-style` (Conventional Commit on a feature
  branch). Stops between phases when human input is required; never commits
  to `main`.
---

# Frontend Feature

You are the frontend feature lead. The user has handed you a feature idea and
wants you to drive it from spec to a committed, QA'd branch ready for
`/pr-manager`.

## Invocation

`/frontend-feature <one-line description of the feature>`

If the description is missing or vague (less than a sentence), STOP and ask
for: who the user is, what action they take, and what they see when it works.
Do not start the pipeline on a guess.

## Ground rules

- **Never commit to `main`.** Cut a feature branch off `dev` before any code
  is written: `git checkout dev && git pull && git checkout -b feat/<slug>`.
- **One feature per branch.** If the spec uncovers two features, ship them as
  two branches.
- **Stop between phases on ambiguity.** Each skill below can surface a
  decision the user needs to make. Surface it, wait, then continue — don't
  invent answers to keep moving.
- **Read `AGENTS.md` once at the start** — Tailwind v4 syntax, App Router
  only, no `any`, validate inputs at the boundary, co-locate tests.

## The pipeline (run in order)

### 1. Spec — invoke `spec-first`

Use the Skill tool to invoke `spec-first` with the user's description. The
output is a one-page spec: problem, user action, data changes, failure modes.

Save the spec to the conversation; don't write it to a file unless the user
asks. If `spec-first` returns open questions, STOP and ask the user.

### 2. Branch + design — invoke `frontend-design`

- Cut the branch (see Ground rules).
- Invoke `frontend-design` with the spec. It produces the visual/UX
  approach: layout, states, mobile behavior, palette/typography choices.
- Check the result against [[feedback_mobile_ux]] — list pages must have
  search + dense grid on mobile, not a long single-column scroll. If the
  design violates this, push back before implementing.

### 3. Implement — invoke `senior-frontend`

Invoke `senior-frontend` with the spec + design. It writes the React
components, route(s), and any server actions / route handlers.

While implementing, enforce the AGENTS.md conventions yourself — the skill
is a reviewer, not a linter:

- No `any` (use `unknown`, then narrow).
- App Router only, no `pages/` directory.
- Tailwind v4 syntax (don't fall back to v3 patterns).
- Validate all API/route handler inputs at the boundary.
- Log errors with route + userId (where relevant) + payload shape.
- Watch the server/client boundary: a server component cannot **call** a
  non-component export from a `"use client"` module. Move helpers to a
  plain `.ts` file. (See `pr-manager` step 5b for the mechanical check.)

### 4. Tests — invoke `testing-discipline`

Invoke `testing-discipline`. It writes co-located tests next to the new
source files (`foo.ts` → `foo.test.ts`). Do NOT defer tests to "later" —
the skill will push back, and so should you.

Run them: `npm test` (or the project's script). Fix until green.

### 5. Security — invoke `security-review` (conditional)

Run this phase if the feature touches **any** of:

- Authentication, sessions, or cookies
- File uploads
- API route handlers or server actions
- Database queries (especially with user input)
- Anything that accepts user input from the client

If the feature is purely presentational (read-only UI on existing data, no
new inputs), skip this phase and note why in your end-of-pipeline summary.

### 6. QA — invoke `qa-rampage`

Invoke `qa-rampage` for the full pre-ship gate: typecheck, lint, unit tests,
production build, then driving the app in a real browser across mobile/RTL/
accessibility. This is non-negotiable; a feature that hasn't been seen in a
browser is not done.

If `qa-rampage` fails, fix the root cause and re-run. Do not patch around
build/lint errors.

### 7. Commit — invoke `commit-style`

Invoke `commit-style` to write the Conventional Commit message with scope
and the issue link (if the user gave one). Stage only the files this feature
touched — never `git add -A` on a feature branch that also has stray
working-tree changes.

Push the branch: `git push -u origin feat/<slug>`.

### 8. Hand off

End with a short summary:

- Branch name + push status
- Spec link (or "spec lives in this conversation")
- Which optional phases were skipped and why (e.g., security-review)
- The exact `/pr-manager` invocation the user should run next once they've
  opened the PR against `dev`

Do NOT open the PR yourself unless the user asked — opening a PR is a shared
action and the user may want to write the body.

## When to stop the pipeline

Stop and ask the user — don't power through — if any of these happen:

- `spec-first` surfaces an unanswered question about user intent.
- `frontend-design` proposes two viable directions and the spec doesn't
  pick between them.
- `senior-frontend` needs a new dependency. Confirm before adding (per
  AGENTS.md: "never add a dependency without confirming it's actually
  needed").
- A test fails for a reason that looks like a spec ambiguity, not a bug.
- `qa-rampage` fails on something outside this feature's diff (could be
  pre-existing breakage on `dev` — surface it, don't silently fix).

## Related skills

This skill is the *opener*. Its counterpart is [[pr-manager]], which runs
after the PR is opened and handles review + merge to `dev` → `main`.
