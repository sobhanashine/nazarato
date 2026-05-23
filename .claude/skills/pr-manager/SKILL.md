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

### 1. Locate the task AND extract its acceptance criteria

- `gh pr view <PR>` — title, body, base branch, head branch, author, state.
- Find the linked issue (`Closes #N`, `Refs #N`, body mentions). **`gh issue view <N>` is mandatory** — never run the pipeline without reading the issue. If no issue is linked, STOP and ask the user which issue this PR fulfils.
- **Copy the issue's acceptance criteria verbatim into a checklist** (the `## Acceptance` / `### Acceptance` section, usually `- [ ]` bullets). This list becomes the contract for step 9 — every box must be ticked with a concrete file path, route, or test name as evidence. A PR that ships without satisfying its acceptance criteria does not merge, no matter how green the automated checks are.
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
- **Server/client boundary**: no server component calls a non-component export from a `"use client"` module. See step 5b for the mechanical check.

### 4. Invoke the `senior-frontend` skill

For any changed file under `app/`, `components/`, `src/`, or matching `*.tsx`/`*.ts` in a frontend path, invoke the **senior-frontend** skill via the Skill tool to get a frontend-specific review. Feed it the list of changed FE files.

### 5. Automated checks

Run, in parallel where possible. **All four are mandatory — none may be skipped, and a non-zero exit on any of them blocks the merge.**

- `pnpm typecheck` (or `npm run typecheck` / `tsc --noEmit` — match the project's script). 0 errors.
- `pnpm lint`. 0 errors (warnings noted, not blocking).
- `pnpm test` (unit / Vitest). All pass.
- `pnpm build` — **production build must succeed.** This is the non-negotiable one: if `next build` fails, the PR cannot ship to Vercel at all. Do not paper over a build failure by reverting only the failing file; investigate and fix the root cause. Common build failures to watch for: missing env vars in `next.config`, type errors that `tsc --noEmit` missed due to differing `tsconfig` paths, `generateStaticParams` returning malformed data, server/client boundary violations on pages that prerender (see step 5b).

### 5b. Server/client boundary scan (Next.js App Router)

**Why this exists**: a `"use client"` module can re-export *components* across the boundary, but a server component cannot **call** a non-component export from one. The build does not catch this — it only fires at request time, and only on routes you actually hit. Static (`○`) and SSG (`●`) routes get hit at build; dynamic (`ƒ`) routes do not, so the error ships silently. (We hit this on PR #52: `instagramShopsHref` was a plain function exported from `InstagramShopsClient.tsx`, called by the dynamic `/instagram-shops` server page — typecheck, lint, vitest, and `next build` all passed.)

Run this scan over the diff:

```bash
# 1. Find every "use client" file changed in this PR
git diff --name-only origin/dev...HEAD -- '*.ts' '*.tsx' \
  | xargs grep -l '^"use client"' 2>/dev/null

# 2. For each, list its non-component exports (functions starting with lowercase)
#    These are the dangerous ones — anything PascalCase is a component and is fine.
grep -E '^export (async )?function [a-z]' <client-file>

# 3. For every name found, search server-side code (files under app/ that are NOT
#    "use client", plus route handlers and server actions) for calls to it.
grep -RnE "\b<name>\s*\(" app/ components/ lib/ \
  | grep -v "$(grep -lE '^\"use client\"' -r app components)"
```

If a server file imports a non-component export from a `"use client"` module, that export must be moved to a plain `.ts` module (no directive). Prefer co-locating the helper next to the client component as `href.ts` / `utils.ts`.

The check is also worth running for re-exports: a barrel file that re-exports from a `"use client"` module inherits the same restriction.

### 5c. Route smoke test (catches what `next build` misses)

Boot the dev server and `curl` every route the PR adds or changes. Static analysis does not run dynamic routes — runtime-only errors (server/client boundary, missing env vars, failed server fetches) only show up here.

```bash
# Start the dev server in the background (re-use one already running on :3000 if present)
lsof -i:3000 >/dev/null || (npm run dev >/tmp/dev.log 2>&1 &)
# wait until ready
until curl -sf http://localhost:3000 -o /dev/null; do sleep 1; done

# For each new/changed route from the diff, fetch it and assert no boundary/runtime error
for route in /instagram-shops "/shop/<a-real-handle>"; do
  body=$(curl -s "http://localhost:3000$route")
  echo "$body" | grep -qE "Attempted to call|Runtime Error|Unhandled Runtime" \
    && { echo "RUNTIME ERROR on $route"; exit 1; }
done
```

A `200` with the expected page title is the bar. A `200` with an error overlay in the HTML is still a failure.

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

### 8b. Close the linked issue

Per [[project_pr_dev_close]], PRs in this repo target `dev`, so GitHub's `Closes #N` magic does NOT auto-close the issue when the PR merges — neither at PR→dev nor at dev→main. You must close it explicitly **only after** the dev→main promotion has merged AND every acceptance-criterion row in step 9's table is ✅.

```
gh issue close <N> --comment "Shipped in PR #<PR>, promoted to main via #<release-PR>. All acceptance criteria verified — see PR thread for the manager report."
```

Skip this step if:
- Any acceptance-criterion row is ❌ (drop back to step 7).
- The dev→main PR didn't actually merge (CI failed, conflict, etc.).
- The user explicitly says to keep the issue open (e.g. it tracks broader follow-up work the PR only partially addressed).

Confirm the close with `gh issue view <N> --json state` afterwards — it should report `CLOSED`.

### 9. Report

One concise message to the user. **The acceptance-criteria table is mandatory** — without it the user has no way to verify that the issue is actually closed.

- PR # + issue # shipped, with the issue title.
- **Acceptance-criteria table** — the checklist captured in step 1, with each box marked ✅ / ❌ and a concrete artifact next to it (file path, route URL, test name, screenshot). Example:

  | # | Criterion | Evidence |
  |---|---|---|
  | 1 | `/instagram-shops` with niche tabs + pagination | `app/instagram-shops/page.tsx:73-202`, smoke test 200 |
  | 2 | `/shop/[handle]` profile with `<IgAvatar />` | `components/shop/ShopProfile.tsx:114`, route GET 200 |
  | 3 | `/shop/[handle]/write-review` auth-gated | `app/shop/[handle]/write-review/page.tsx:35` (`redirect(/login?next=...)`) |
  | 4 | `generateStaticParams` + `notFound()` | `app/shop/[handle]/page.tsx:17,42` |

  If any row is ❌, the PR does NOT ship — drop back to step 7 and fix.
- Automated-check results (typecheck / lint / unit / **build** / Playwright) — one line each, pass or fail. Always cite the build result explicitly; it's the one that gates Vercel.
- What you fixed (if anything) on the fix branch.
- Playwright specs added (paths).
- Both merge commits / PR URLs.
- **Issue close confirmation** — the `gh issue close` output / link to the now-closed issue. If you skipped the close per step 8b, say why.
- Anything you noticed but did not fix (tech debt flagged, not blocked).

## Hard rules

- **Never** delete `dev` or `main`, locally or remotely. Pass `--delete-branch=false` to every `gh pr merge` and never run `git push origin --delete dev|main`.
- **Never** merge directly to `main` without going through `dev` first.
- **Never** skip Playwright. If the change is backend-only, still run the existing E2E suite as a regression guard.
- **Never** `--no-verify` past a failing hook. Fix the hook's complaint.
- **Never** force-push the PR branch or the fix branch once it has been pushed (would rewrite a shared history).
- If the PR targets `main` directly, change the base to `dev` (`gh pr edit <PR> --base dev`) and tell the user — do not silently re-route critical work.
- If the issue's acceptance criteria are unclear or missing, STOP and ask the user before fixing or merging.

## What "green" means

All of these are true at the same time, on the final commit of the PR branch. **Every acceptance-criterion box from the linked issue is ticked with a concrete artifact (file:line, route, or test name). No exceptions — a PR with green CI but unmet criteria is not green, it is incomplete.**

- typecheck: 0 errors
- lint: 0 errors (warnings noted, not blocking)
- unit tests: all pass
- production build: succeeds
- Playwright: all specs pass, including a new one for this PR's user-facing behavior
- senior-frontend review: no must-fix items outstanding
- Issue acceptance criteria: each one demonstrably met (cite the file/test that proves it)

Anything less is not green. Do not ship.
