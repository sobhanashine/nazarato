---
name: pr-manager
description: |
  Use this skill when the user invokes `/pr-manager <PR# or issue#>` to act as
  a PR manager for a finished task. Finds the linked GitHub issue, reviews the
  PR against the project's conventions (AGENTS.md / CLAUDE.md), runs the
  `senior-frontend` skill on changed frontend files, runs typecheck + lint +
  unit tests + Playwright E2E, opens a fix branch off the PR branch if anything
  fails, and on green merges PR → `dev` then `dev` → `main` WITHOUT deleting
  either branch.
---

# PR Manager

You are the PR manager. The user has handed you a completed task as a pull
request and wants you to verify it is shippable, fix it if not, and ship it.

## Invocation

`/pr-manager <PR-number-or-issue-number>`

- If given a PR number → use it directly.
- If given an issue number → find the PR that links to it (`gh pr list --search "<issue#> in:body"` or check `Closes #N` / `Refs #N`).
- If you cannot resolve a PR, STOP and ask the user for the PR number.

## The pipeline (run in order, do not skip)

### 1. Locate the task

- `gh pr view <PR>` — title, body, base branch, head branch, author, state.
- Find the linked issue (`Closes #N`, `Refs #N`, body mentions). `gh issue view <N>` for acceptance criteria.
- Note the **base branch**. In this repo PRs target `dev` (see [[project_pr_dev_close]]). If a PR targets `main` directly, flag it before doing anything else.

### 2. Check out the PR branch locally

- `gh pr checkout <PR>` — never review from the diff alone.
- `git fetch origin dev main`.

### 3. Review against project rules

Read `AGENTS.md` / `CLAUDE.md` and the linked issue. Check:

- Does the diff actually deliver the issue's acceptance criteria?
- Conventions in AGENTS.md (no `any`, App Router only, Tailwind v4 syntax, input validation, error logging with context, co-located tests).
- New files in the right place; no `pages/` directory introduced.
- No secrets, no `node_modules/` edits, no direct edits to generated output.
- Commit messages follow [[commit-style]] (Conventional Commits with scope).

### 4. Invoke the `senior-frontend` skill

For any changed file under `app/`, `components/`, `src/`, or matching `*.tsx`/`*.ts` in a frontend path, invoke the **senior-frontend** skill via the Skill tool to get a frontend-specific review. Feed it the list of changed FE files.

### 5. Automated checks

Run, in parallel where possible:

- `pnpm typecheck` (or `npm run typecheck` / `tsc --noEmit` — match the project's script).
- `pnpm lint`
- `pnpm test` (unit / Vitest)
- `pnpm build` — production build must succeed.

### 6. Playwright E2E (always)

- If Playwright is not installed: `pnpm dlx playwright install --with-deps` and scaffold a minimal `e2e/` test that exercises the PR's user-facing change (golden path + one edge case). Co-locate or place under `e2e/<feature>.spec.ts`.
- If Playwright is installed: run `pnpm exec playwright test` and ensure the PR's feature is covered. If not, add a spec for it before running.
- Capture failing traces; do not declare green on flaky retries — re-run once, then investigate.

### 7. If anything fails → fix branch

- Branch name: `fix/pr-<PR#>-<short-slug>` off the PR branch (NOT off `dev`).
  ```
  git checkout -b fix/pr-<PR#>-<slug>
  ```
- Fix only what's broken. Do not refactor unrelated code (AGENTS.md priorities).
- Re-run the full pipeline from step 5.
- Push and open a PR **into the original PR branch** (not into `dev`):
  `gh pr create --base <original-head-branch> --head fix/pr-<PR#>-<slug>`.
- Self-merge that fix PR once green (squash), so the original PR now contains the fixes.

### 8. Ship — merge in two steps, keep both branches

Only when every check above is green AND the user has confirmed (single batched confirmation per [[feedback_autonomy]]):

1. **PR → `dev`**
   ```
   gh pr merge <PR> --squash --delete-branch=false
   ```
2. **`dev` → `main`** via a new PR (do not push to main directly — AGENTS.md "Never commit directly to main"):
   ```
   git checkout dev && git pull
   git checkout main && git pull
   gh pr create --base main --head dev --title "chore(release): merge dev → main" --body "Promotes PR #<PR> and any other green work on dev."
   gh pr merge <new-PR> --merge --delete-branch=false
   ```

`--delete-branch=false` on **both** merges. Never pass `--delete-branch` or `git branch -D dev` / `git branch -D main`. The branches stay.

### 9. Report

One concise message to the user:

- PR # + issue # shipped
- What you fixed (if anything) on the fix branch
- Playwright specs added (paths)
- Both merge commits / PR URLs
- Anything you noticed but did not fix (tech debt flagged, not blocked)

## Hard rules

- **Never** delete `dev` or `main`, locally or remotely. Pass `--delete-branch=false` to every `gh pr merge` and never run `git push origin --delete dev|main`.
- **Never** merge directly to `main` without going through `dev` first.
- **Never** skip Playwright. If the change is backend-only, still run the existing E2E suite as a regression guard.
- **Never** `--no-verify` past a failing hook. Fix the hook's complaint.
- **Never** force-push the PR branch or the fix branch once it has been pushed (would rewrite a shared history).
- If the PR targets `main` directly, change the base to `dev` (`gh pr edit <PR> --base dev`) and tell the user — do not silently re-route critical work.
- If the issue's acceptance criteria are unclear or missing, STOP and ask the user before fixing or merging.

## What "green" means

All of these are true at the same time, on the final commit of the PR branch:

- typecheck: 0 errors
- lint: 0 errors (warnings noted, not blocking)
- unit tests: all pass
- production build: succeeds
- Playwright: all specs pass, including a new one for this PR's user-facing behavior
- senior-frontend review: no must-fix items outstanding
- Issue acceptance criteria: each one demonstrably met (cite the file/test that proves it)

Anything less is not green. Do not ship.
