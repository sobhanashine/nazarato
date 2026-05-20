---
name: commit-style
description: |
  Use this skill whenever the user asks to commit, stage, or write a commit
  message, or whenever you are about to run `git commit` yourself. Enforces
  Conventional Commits with scope tags and issue links so that `git log` is
  readable six months from now.
---

# Commit Style

## Format

```
<type>(<scope>): <subject>

<body — why, not what>

<footer — refs, breaking changes>
```

## Types

- `feat` — new user-visible capability
- `fix` — bug fix
- `refactor` — no behavior change
- `perf` — measurable performance change
- `docs` — docs only
- `test` — tests only
- `chore` — tooling, deps, config
- `style` — formatting only (no logic)

## Rules

- Subject ≤ 70 chars, imperative ("add", not "added"), no trailing period.
- Scope is the area of the codebase (`auth`, `blog`, `header`, `db`). One
  word, lowercase.
- Body explains **why** the change exists and what the alternative was. Not
  "what I did" — the diff already shows that.
- Reference issues in the footer: `Refs #42` / `Closes #42`.
- Breaking change: footer line `BREAKING CHANGE: <what breaks, how to migrate>`.
- If the change touches the schema, the footer notes the migration name.
- If tests were skipped under pressure: `[no-test: <reason>]` in the subject.

## Examples

```
feat(blog): add pagination to post listings

Listing was loading all 200 posts on every request, ~600ms TTFB.
Page-based pagination keeps payload <50KB and TTFB <100ms.

Refs #14
```

```
fix(auth): clear stale session cookie on logout

Cookie was being overwritten with an empty value but kept its
original Max-Age, so the browser kept resending it for 30 days.

Closes #27
```
