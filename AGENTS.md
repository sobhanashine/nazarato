<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: nazarato

## Stack

- Next.js 16.2.6 (App Router), React 19.2, TypeScript 5
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

