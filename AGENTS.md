<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: nazarato

## Stack

- Next.js 16.3.8 (App Router), React 19.2.4, TypeScript 5
- Tailwind CSS v4 (PostCSS plugin)
- ESLint 9 + `eslint-config-next`
- Deployment target: existing Cloudflare Worker `nazarato`, OpenNext 1.20.7

## Solo Founder Context

Sobhan is the only developer, designer, and PM on this project.

- Prioritize shipping over perfection
- Suggest the simplest solution that works first
- If a task takes more than one session, break it into shippable pieces
- Flag tech debt but don't block features on it

## Conventions

- TypeScript: never use `any` — use `unknown` then narrow
- Validate all API/route inputs at the boundary
- Log errors with context (route, userId where relevant, payload shape)
- Co-locate tests next to source: `foo.ts` → `foo.test.ts`
- Tailwind v4 syntax — don't fall back to v3 patterns from training data
- App Router conventions only (no `pages/` directory)

## Priorities (in order)

1. Bugs blocking real users
2. Features explicitly requested
3. Technical improvements / refactors
4. Nice-to-haves and polish

## Never

- Commit directly to `main` — always feature branches
- Add a dependency without confirming it's actually needed
- Put secrets in this file, in `CLAUDE.md`, or anywhere committed to git
- Touch `node_modules/` or generated build output by hand
- Introduce a `pages/` directory or mix Pages Router with App Router

## Workflow expectations

- Before any commit: run a code-review pass (look for duplicated logic, dead code, missing error handling)
- Before shipping UI changes: verify in a browser, not just type-check
- When corrected on the same thing twice: propose updating this file or writing a skill

## Active scope and task tracking

- Read `docs/product-status.md`, `docs/nabz-rasht-mvp.md` and `docs/PROJECT.md`
  before material product work. Treat the older May pivot as decision history.
- Stay within the requested Nazarato repository and private Trello board
  `Nazarato — 14-Day MVP`: https://trello.com/b/eHnJFMki. Do not inspect unrelated
  founder projects or boards.
- Track each material user task on that board; commands/research steps are not
  separate tasks. Move to Done only after acceptance criteria and relevant checks
  pass. Review means a completed deliverable awaiting acceptance; Needs You is a
  real decision/access dependency; Risks is a project risk, not active work.
- Default browser checks are isolated (`npm run test:e2e`). Legacy remote-write
  tests need explicit authorization and a separate test database.
- At terminal outcome (`COMPLETED`, `BLOCKED`, `FAILED`, `NO_ACTION`), send exactly
  one Persian-first RTL HTML completion email using
  `docs/task-completion-email-template.html`. Resolve the recipient from the
  authenticated Gmail profile; never hardcode a personal address in Git.
- Search Sent for the exact subject before sending. Do not duplicate or retry
  an uncertain/timed-out delivery. Research updates do not trigger email.
- The first screen states outcome, required user action and project position,
  followed by deliverables, next task, risks and compact checks. Include the
  Trello URL and branch/commit/PR when applicable. Distinguish code completion
  from deployment and pilot validation; do not paste raw logs.
- If Trello/Gmail is unavailable, finish safe local work, report the integration
  failure and leave the task in the appropriate non-Done state.

## Authoritative visual baseline

- The founder selected `main`'s Persian Aurora design on 2026-10-15: dark
  navy, mint/lapis accents, glass cards, existing header/hero/navigation.
- Build DEV features by extending that design. Preserve behavior and data
  guards while integrating; do not replace the theme with the superseded
  light redesign. Verify mobile and desktop against main before staging.
- The founder authorized this project's staging to share main's Supabase
  project explicitly. Follow `docs/staging-release.md`; automated test
  mutations still use the isolated loopback fixture, never the shared DB.
