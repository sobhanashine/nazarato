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
| `app/`           | App Router routes: `/`, `/search`, `/about`, `/contact`, `/categories`, `/terms`, `/privacy`, `/company/[slug]`, `/blog`, `/blog/[slug]`, the `(auth)` group (`/login`, `/login/verify`), and the `(user)` group (`/profile`, `/profile/reviews`). |
| `components/`    | Grouped by role: `layout/`, `sections/`, `ui/`, `blog/`, `categories/`, `icons/`, `pwa/`. |
| `lib/`           | Data layer + integrations. `lib/wp.ts` (WordPress client), `lib/supabase/` (service-role DB client), `lib/auth/` (signed-cookie sessions + phone-OTP).              |
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
- Never interpolate Tailwind classes (`text-${tone}`) — the v4 scanner only
  matches literal strings, so interpolated classes silently never generate.
  Use a lookup map of full class strings (see the `TONE` record in
  `app/about/page.tsx` / `app/contact/page.tsx`).
- Inline SVG icons from `components/icons` carry no intrinsic size; always pass
  an explicit `className="w-_ h-_"` (or size via a wrapper) — unsized, they
  fall back to the 300×150 SVG default and break layout.

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
- **Auth — remaining wiring.** `/login` works end-to-end in dev. Still open:
  (1) OTP delivery is a static dev code (`123456`) — wire Kavenegar in
  `lib/auth/otp.ts` `sendOtp` once SMS credit is available; (2) sessions are
  HMAC-signed cookies, a deliberate placeholder — migrate to Supabase Auth
  later (keep `getSession`/`setSession`/`clearSession` stable). Deployment
  note: run `supabase/migrations/0001_create_users_table.sql` and `0002_create_businesses_and_reviews.sql` on every new
  Supabase environment (they are applied to the current dev project).

---

## 4. Change log

Each task appended by the `project-loop` skill. Newest first. One bullet per
task: what shipped, where to look, and any new decision worth remembering.

<!-- project-loop:changelog:start -->
- **2026-05-22** — Built admin moderation queue (/admin/moderation) and migrated static business/review structures to a remote Supabase Postgres database. Files: `app/(admin)/layout.tsx`, `app/(admin)/admin/moderation/actions.ts`, `app/(admin)/admin/moderation/page.tsx`, `app/(admin)/admin/moderation/ModerationQueueClient.tsx`, `app/company/[slug]/write-review/actions.ts`, `lib/data/businesses.ts`, `lib/data/reviews.ts`, `supabase/migrations/0002_create_businesses_and_reviews.sql`, `supabase/seed.ts`.
- **2026-05-22** — Fixed navigation from search suggestions dropdown on landing page and search page by preventing input blur on suggestion mousedown. Cleaned up unused Link imports in terms and privacy pages to fix lints. Files: `components/search/SearchSuggestions.tsx`, `app/privacy/page.tsx`, `app/terms/page.tsx`.
- **2026-05-22** — Built `/terms` and `/privacy` pages (#19). Created premium static TSX pages in Persian (RTL) with breadcrumbs, Scale/Shield icons, and sticky desktop sidebar tables of contents using the shared `GLASS` container component. Linked both pages from the site footer. Files: `app/terms/page.tsx`, `app/privacy/page.tsx`; edited `components/layout/Footer.tsx`.
- **2026-05-22** — Built `/search` (#18) with a live typeahead. A URL-driven search over the business + IG-shop fixtures: a server component reads `searchParams` (`q`, `type`, repeatable `category`, `rating`, `reviewed`, `verified`, `sort`, `page`) and all filter/sort/paginate logic lives in the pure, framework-free `lib/search.ts` (`parseSearchParams` → `runSearch` → `searchHref` → `suggestBusinesses`). Filters, type tabs, active-filter chips and pagination are plain server-rendered `<Link>`s — no client JS for those; the client components are the sort `<select>` (`SortSelect`) and the search box (`SearchBox`), which is a real `<form method="GET">` plus a **live typeahead**: from the 2nd character it shows a dropdown of matching businesses (companies *and* IG shops) below the field — `suggestBusinesses` ranks by name match then rating, each row linking to its profile. The same typeahead is on the homepage hero (`components/sections/HeroSearch.tsx`) via the shared `SearchSuggestions` panel; the hero search `<input>` was also fixed — it wasn't inside a form, so Enter did nothing. Results reuse `<BusinessCard />` / `<IgShopCard />`; the empty state suggests popular businesses; the filter sidebar collapses into a `<details>` accordion on mobile and is a sticky `<aside>` on desktop. The search section was designed mobile-first: a full-width field with a compact embedded submit button (no width-stealing text button), count-badged type tabs, and a polished filter accordion. The mobile hamburger menu (`Header.tsx` → `MobileMenu`) now also surfaces جستجو and نوشتن نظر via a dedicated `mobileNavItems` list (desktop nav unchanged). Files: `app/search/` (`page.tsx`/`loading.tsx`/`error.tsx`), `components/search/` (`SearchBox`/`SearchSuggestions`/`SearchFilters`/`SortSelect`/`SearchPagination`), `components/sections/HeroSearch.tsx`, `lib/search.ts`; edited `components/sections/Hero.tsx`, `components/layout/Header.tsx`. Decisions: category is a business-only concept — selecting one excludes IG shops (they carry a `niche`, not a business category) and the category group is hidden on the اینستاگرامی tab; IG-shop `score`/`reviews` are pre-formatted Persian-numeral strings, so `lib/search.ts` parses them back to numbers for sorting/filtering; `/search` sets `robots: { index: false }`; per-tab result counts ignore the type filter so each tab shows its own total; the typeahead links IG-shop rows to their `href` (`#` until `/shop/[handle]` lands — #22). Verified in-browser (390 + 1280px): query results, empty state + suggestions, dismissible chips, rating/verified filters, type tabs with live counts, pagination + out-of-range page clamping, the mobile filter accordion, and the typeahead on both the page and the hero.
- **2026-05-22** — Built review submission (#17). `/company/[slug]/write-review` — an auth-gated form on a glass card: a star rating picker (1–5, 48×48 hit targets, per-rating gradient + glow reused from `RatingStars` so the row recolours red→mint as the score rises), required title (3–80 chars) and body (30–2000, live counters), optional purchase date, and an optional proof-of-purchase upload (image/PDF ≤ 5 MB + a proof type → makes the review eligible for the «نقد تأییدشده» tier; no proof is still a valid «نقد عادی»). Every field is re-validated server-side in `submitReview` (`app/company/[slug]/write-review/actions.ts`); on success a flash toast is stashed and the client navigates to the company profile. Also built `/write-review` — the universal entry the mobile-tab FAB points at: an auth-gated business search that hands off to `/company/[slug]/write-review`. Files: `app/company/[slug]/write-review/`, `app/write-review/`; `STAR_PATH`/`STAR_PALETTES` are now exported from `components/ui/RatingStars.tsx`. Decision: there is no `reviews` table yet — `businesses` is still fixture data, so a real `business_id` FK can't exist until they move to Supabase (#16/#18); `submitReview` fully validates then logs the accepted review in dev-mode (`status: 'pending'`, `proof_status`) — swap the `console.info` for an insert + a `UNIQUE (business_id, author_id)` constraint when the table lands. The auth gate sits in `page.tsx`, below the `company/[slug]/loading.tsx` Suspense boundary, so an unauthenticated hard-load streams the skeleton then client-redirects to `/login` (acceptable for a non-indexed page — `submitReview` re-checks the session regardless). Verified in-browser: inline validation errors, happy-path submit + toast, star recolour 1★→5★, the auth redirect, and the `/write-review` search + hand-off + empty state.
- **2026-05-22** — Built the consumer account area (#14). New `(user)` route group, auth-gated once in `app/(user)/layout.tsx` (`getSession()` → `redirect("/login?next=/profile")`) — shell renders `Header`/`Footer` plus account nav as a desktop sidebar / mobile tab strip (`components/profile/ProfileNav.tsx`, active state via `usePathname`). `/profile` is an at-a-glance dashboard: identity card (avatar initial + `avatar_color`, "عضو از <ماه> <سال>" built month-first since `fa-IR` defaults to year-first), a 3-up stats grid (نظرات / مفید بود / فالوور), and quick-link cards. `/profile/reviews` lists reviews with a text+colour status badge (منتشر شده / در انتظار بررسی / رد شده — never colour alone) and per-row ویرایش/حذف; delete opens a native `<dialog>` confirmation (focus-trapped, Esc-closable). Files: `app/(user)/`, `components/profile/`, `lib/data/profile.ts`, `getUserById` added to `lib/data/users.ts`. Decisions: there is no `reviews` table yet (#17 unbuilt), so `myReviews` + `profileStats` in `lib/data/profile.ts` are static fixtures and delete is optimistic local-state removal — swap for a real per-user query + server action when #17 lands; the row-count badge lives in the client `MyReviewsList` so it stays in sync after a delete; ویرایش is intentionally disabled with a title until the review-edit destination exists. The `(user)` content track is capped (`lg:grid-cols-[200px_minmax(0,640px)]`, grid centred) so the cards don't stretch sparse on wide screens. The header is now auth-aware: a new `GET /api/auth/me` route exposes session status to client components (`components/layout/useSessionStatus.ts`) — done client-side **on purpose** so `Header` doesn't read cookies on the server and force every static page (`/`, `/blog`, `/company/[slug]`) into dynamic rendering. Signed in → `HeaderAuth` shows a round avatar linking to `/profile` (and `MobileMenu` shows «پروفایل من»); signed out → «ورود». Sign-out is a `logout` server action (`app/(user)/actions.ts`, `clearSession()` → `redirect("/")`) wired to a `<form>` in `ProfileNav`. Open: `/saved` (#24) and `/settings` (#25) nav links 404 until built. Verified in-browser (320–1440px): dashboard, reviews list, delete dialog + count sync, header avatar/login swap, and the full logout cycle all confirmed.
- **2026-05-22** — Built phone-OTP auth (#13). `/login` + `/login/verify` in a new `(auth)` route group (centered, chrome-less; `MobileTabBar` hides on `/login*`). Flow: phone (normalized to `+989…`) → 6-digit auto-submitting OTP → first-login display-name step → signed-cookie session → redirect to a validated `?next`. OTP is a static dev code (`123456`, logged by `sendOtp`); Kavenegar is isolated to `lib/auth/otp.ts`. Sessions are HMAC-signed HTTP-only cookies (`lib/auth/session.ts`) — a dev-grade placeholder for Supabase Auth. Accounts persist to a Supabase `users` table: `lib/supabase/server.ts` (service-role client), `lib/data/users.ts` (`getUserByPhone`/`createUser`, boundary-validated), migration in `supabase/migrations/0001_create_users_table.sql`. A returning phone signs in directly and skips the name step; a new phone creates the row. In-memory throttles cover resend cooldown + wrong-code lockout. Files: `app/(auth)/`, `lib/auth/`, `lib/supabase/`, `lib/data/users.ts`, `components/layout/MobileTabBar.tsx`. Decisions: Supabase is the database only — the app keeps its own OTP + session (Supabase phone-OTP needs an SMS provider, and Kavenegar isn't natively supported); `users` is standalone (own `id`, own `phone` column) and does not extend `auth.users`; RLS is on with no policies — all access is server-side via the service-role key; `?next` targets are validated same-origin. Verified end-to-end in-browser (desktop + 390px): a new phone creates the `users` row then onboards; a returning phone signs in directly with no name step (no duplicate row); wrong-code, session-guard, and `?next` redirect paths confirmed. Open: wire Kavenegar; the `0001` migration must be run on each new Supabase environment.
- **2026-05-21** — Redesigned `/about` + `/contact`: replaced the faux-terminal English jargon with a clean Persian-first layout, removed every `font-mono` (numbers now render in Vazirmatn too, per request), and dropped each page's opaque `bg-[#02050A]` + local orbs so the global `<Backdrop>` shows through like `/categories` + `/blog`. Bug fixes: missing `/images/noise.png` (404) removed; unsized inline SVGs (`SendIcon` in the submit button, `ChatBubbleIcon` in the report note) given explicit dimensions — they were rendering at the 300×150 SVG default and breaking layout; contact `lg:pt-[240px]` magic-number alignment replaced with a top-aligned grid; mobile-overflowing `translateX`/`translate-y` card offsets removed. Files: `app/about/page.tsx`, `app/contact/page.tsx`, `components/contact/ContactForm.tsx`. See new §2 Styling rules on dynamic Tailwind classes + icon sizing.
- **2026-05-20** — Removed all hand-written component CSS. `app/globals.css` slimmed 983→~195 lines (Tailwind config + `@keyframes` + `::-webkit-scrollbar` + `.wp-content` only). Every `.glass`/`.hero`/`.site-header`/`.btn-*`/`.post-*`/`.sb-*` etc. class converted to Tailwind utilities in JSX; shared bundles extracted to `components/ui/styles.ts`, new `components/ui/Container.tsx` + `components/layout/Backdrop.tsx`, `components/blog/BlogMeta.tsx` dedupes the author row. Files: `app/globals.css`, `app/layout.tsx`, all of `components/`, `lib/data/categories.tsx`, app pages. Decision: globals.css is config-only — no component classes; pseudo-element decorations become real `aria-hidden` `<div>`s; PWA `display-mode: standalone` is a registered `@custom-variant`.
- **2026-05-20** — Added `/categories` page: client-side live search + 2-col mobile grid (3/4 cols on sm/lg) of icon+title-only centered cards, 12 categories, with empty state. Extracted `CategoryCard` (`compact` variant = centered icon+title; default = icon+title+desc, used by home `Categories` section). Files: `app/categories/page.tsx`, `components/categories/CategoryBrowser.tsx`, `components/ui/CategoryCard.tsx`, `components/sections/Categories.tsx`, `lib/data/categories.tsx`. Decisions: shared card primitives live in `components/ui/`; interactive page widgets get their own `components/categories/` group and are `"use client"`; home section shows `categories.slice(0,4)` as "popular", `/categories` shows all. Note: an `absolute` icon over an input needs explicit `z-10` — the `glass` class makes the input `position: relative`, which otherwise paints over earlier siblings.
<!-- project-loop:changelog:end -->
