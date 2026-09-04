<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: nazarato

## Stack

- Next.js 16.3.4 (App Router), React 19.2, TypeScript 5
- Tailwind CSS v4 (PostCSS plugin)
- ESLint 9 + `eslint-config-next`
- Deployment target: TBD (assume Vercel unless told otherwise)

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

## Task tracking and completion notifications

- Track each material user-requested task on the private Trello board
  `Nazarato — 14-Day MVP`: https://trello.com/b/eHnJFMki. Internal research,
  commands, and tool calls are steps inside a task, not separate cards.
- A card may move to `Done` only after its acceptance criteria and relevant
  verification pass. Use `Needs You` only for a real user decision or access
  dependency, `Review` for a completed deliverable awaiting user acceptance,
  and `Risks` for a tracked project risk rather than active work.
- At each task's terminal outcome (`COMPLETED`, `BLOCKED`, `FAILED`, or
  `NO_ACTION`), send exactly one Persian-first RTL HTML completion email to the
  owner of the authenticated Gmail connection. Do not hardcode a personal
  address in the repository; resolve it from the connected Gmail profile.
- Before sending, search Sent mail for the exact task subject and do not send
  a duplicate. If delivery returns an uncertain result or times out, do not
  retry automatically.
- Render the email from `docs/task-completion-email-template.html`. The first
  screen must answer, in this order: what happened, whether the user must act,
  and where the project stands. Keep deliverables, risks, and technical evidence
  in separate scannable sections; never paste raw command output or long logs.
- Use the subject mapping documented in the template. The email must include a
  one-sentence outcome, explicit user action (including «فعلاً کاری لازم نیست»),
  project progress, delivered items, the next task, material risks, compact
  checks, branch/commit/PR when applicable, and the Trello card URL.
- Progress commentary, research updates, and internal subtasks do not trigger
  email. If Trello or Gmail is unavailable, finish safe local work, report the
  integration failure, and leave the task in the appropriate non-`Done` state.
