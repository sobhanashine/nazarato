# nazarato — Project Doc

This is the **single source of truth** for how this project is built and the
decisions behind it. It is maintained by the `project-loop` skill: every
non-trivial task starts by reading this file and ends by updating it.

> If you are editing this file by hand, keep entries terse. One bullet, one
> idea. Link to code with `path:line` so readers can jump in.

---

## 1. Architecture & Stack

### Framework

- **Next.js 16.2.6** (App Router only — no `pages/` directory).
- **React 19.2.4**.
- **TypeScript 5** with `strict: true`, `noEmit: true`. Path alias `@/*` → repo root (`tsconfig.json:21`).
- **Tailwind CSS v4** via `@tailwindcss/postcss` (`postcss.config.mjs`). v4 syntax only — do not fall back to v3 patterns.
- **ESLint 9** + `eslint-config-next`.

### Top-level layout

| Path             | Purpose                                                                      |
| ---------------- | ---------------------------------------------------------------------------- |
| `app/`           | App Router routes. Currently: `/` (home), `/categories`, `/blog`, `/blog/[slug]`. |
| `components/`    | Grouped by role: `layout/`, `sections/`, `ui/`, `blog/`, `categories/`, `icons/`, `pwa/`. |
| `lib/`           | Data layer + integrations. `lib/wp.ts` is the WordPress client.              |
| `lib/data/`      | Static/sample data: `blog-posts`, `blog-taxonomies`, `categories`, `reviews`, `instagram-shops`. |
| `design-system/` | Design tokens / system reference (`nazarato/`).                              |
| `docs/`          | Long-form docs (this file, plus `headless-wordpress-blog.md`, `pages-master.md`). |
| `public/`        | Static assets — icons, service worker (`sw.js`), PWA manifest assets.        |
| `.claude/`       | Repo-scoped Claude config: `skills/` (commit-style, testing-discipline, spec-first, security-review, db-migrations, project-loop), `settings.json`. |

### Locale & layout direction

- App is **RTL Farsi**: `<html lang="fa" dir="rtl">` (`app/layout.tsx:52`).
- Font: **Vazirmatn** (Arabic subset, weights 300–900) via `next/font/google` (`app/layout.tsx:8`).
- All UI copy is Persian by default.

### PWA

- Manifest is generated at `app/manifest.ts` (Next 16 `Metadata` route).
- Service worker lives at `public/sw.js`, registered by `components/pwa/RegisterSW.tsx`.
- Install prompt: `components/pwa/InstallPrompt.tsx`.
- `next.config.ts:42-53` sets `Cache-Control: no-cache` and `Service-Worker-Allowed: /` for `sw.js`.

### Headless WordPress (blog)

- Client: `lib/wp.ts`. Reads `WP_API_URL` env var.
- `next.config.ts:7-22` whitelists the WordPress host's `/wp-content/uploads/**` for `next/image`.
- Background notes: `docs/headless-wordpress-blog.md`.
- Routes that consume it: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`.

### Security headers

Set globally in `next.config.ts:31-40`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Mobile

- Mobile nav is split into a top `MobileMenu` and a persistent bottom `MobileTabBar` (`components/layout/`).
- Layout mounts `MobileTabBar` globally (`app/layout.tsx:55`).

---

## 2. Conventions & Decisions

### TypeScript

- **Never `any`.** Use `unknown`, then narrow. (From `AGENTS.md`.)
- Validate all API / route inputs at the boundary.
- Log errors with context: route, userId if relevant, payload shape.

### Files & naming

- App Router conventions only. No `pages/`.
- Components are `PascalCase.tsx`, co-located by domain (`components/blog/`, `components/sections/`, ...).
- Static/sample data lives in `lib/data/*.ts` and is imported directly — no fetch needed.
- Co-locate tests next to source: `foo.ts` → `foo.test.ts`. (Test runner not wired yet — see Open items.)

### Styling

- Tailwind v4 utilities only — styling lives in JSX `className`, never as CSS classes.
- `app/globals.css` is **config only**: `@import`, `@theme` tokens, `@keyframes`,
  `@custom-variant`. Two raw-CSS blocks are allowed because they can't be utilities:
  native `::-webkit-scrollbar`, and `.wp-content` (styles WordPress HTML injected via
  `dangerouslySetInnerHTML`). Do **not** add component CSS classes here.
- Reused class bundles live in `components/ui/styles.ts` (`GLASS`, `CONTAINER`,
  `HIDE_SCROLL`, `BTN_PRIMARY`, `TAG_BADGE`); `<Container>` wraps the page gutter,
  `<Backdrop>` renders the ambient aurora/grain layers.
- Animations: declare `@keyframes` in `globals.css`, apply via `animate-[name_…]`.
- RTL is assumed; use `ms-*`/`me-*` (logical) over `ml-*`/`mr-*` when adding spacing.

### Routing

- Sole router is App Router. New routes go under `app/`.
- Dynamic segments use bracket folders (e.g. `app/blog/[slug]/page.tsx`).

### Workflow

- **Never commit to `main`** — always a feature branch (per `AGENTS.md`).
- Before any commit: a code-review pass (duplicated logic, dead code, missing error handling).
- Before shipping UI: verify in a browser, not just type-check.
- Commits follow Conventional Commits with scope tags (see `commit-style` skill).
- Bug fixes get a failing regression test FIRST (see `testing-discipline` skill).
- New features ≥ one line → spec first (see `spec-first` skill).

### Priorities (in order)

1. Bugs blocking real users
2. Features explicitly requested
3. Technical improvements / refactors
4. Nice-to-haves and polish

---

## 3. Open items / known gaps

- **No test runner wired.** `package.json` has no `test` script. When the first
  test is added, wire Vitest (preferred for Vite/Next stacks) and add a
  `test` script. Until then, `project-loop` falls back to typecheck + lint
  and flags this gap.
- **WP_API_URL** must be set in the deployment env or `lib/wp.ts` calls will
  fail. Not yet documented in a `.env.example`.

---

## 4. Change log

Each task appended by the `project-loop` skill. Newest first. One bullet per
task: what shipped, where to look, and any new decision worth remembering.

<!-- project-loop:changelog:start -->
- **2026-05-20** — Removed all hand-written component CSS. `app/globals.css` slimmed 983→~195 lines (Tailwind config + `@keyframes` + `::-webkit-scrollbar` + `.wp-content` only). Every `.glass`/`.hero`/`.site-header`/`.btn-*`/`.post-*`/`.sb-*` etc. class converted to Tailwind utilities in JSX; shared bundles extracted to `components/ui/styles.ts`, new `components/ui/Container.tsx` + `components/layout/Backdrop.tsx`, `components/blog/BlogMeta.tsx` dedupes the author row. Files: `app/globals.css`, `app/layout.tsx`, all of `components/`, `lib/data/categories.tsx`, app pages. Decision: globals.css is config-only — no component classes; pseudo-element decorations become real `aria-hidden` `<div>`s; PWA `display-mode: standalone` is a registered `@custom-variant`.
- **2026-05-20** — Added `/categories` page: client-side live search + 2-col mobile grid (3/4 cols on sm/lg) of icon+title-only centered cards, 12 categories, with empty state. Extracted `CategoryCard` (`compact` variant = centered icon+title; default = icon+title+desc, used by home `Categories` section). Files: `app/categories/page.tsx`, `components/categories/CategoryBrowser.tsx`, `components/ui/CategoryCard.tsx`, `components/sections/Categories.tsx`, `lib/data/categories.tsx`. Decisions: shared card primitives live in `components/ui/`; interactive page widgets get their own `components/categories/` group and are `"use client"`; home section shows `categories.slice(0,4)` as "popular", `/categories` shows all. Note: an `absolute` icon over an input needs explicit `z-10` — the `glass` class makes the input `position: relative`, which otherwise paints over earlier siblings.
<!-- project-loop:changelog:end -->
