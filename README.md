# نظراتو · Nazarato

> A Persian-language review platform for Iranian businesses — regular companies (دیجی‌کالا، اسنپ‌فود…) and Instagram shops (`@manto_sara`, `@arezoo_cake`…) side by side. Think Trustpilot, built RTL-first for the Iranian market.

**North-star action:** a consumer writes a real, useful review about an Iranian business.

**Status:** Solo-founder project · pre-launch.

---

## Stack

- **Next.js 16.2.6** — App Router only (no `pages/` directory)
- **React 19.2.4**
- **TypeScript 5** — `strict: true`, path alias `@/*` → repo root
- **Tailwind CSS v4** — via `@tailwindcss/postcss` (v4 syntax only)
- **Supabase** (Postgres) — data layer, accessed server-side with the service-role key
- **Auth** — app-managed phone OTP (Kavenegar) + HMAC-signed cookie sessions
- **Testing** — Vitest (unit, co-located) + Playwright (E2E in `e2e/`)
- **ESLint 9** + `eslint-config-next`
- **Deploy target** — Vercel (assumed)

The UI is **RTL Persian** (`<html lang="fa" dir="rtl">`), Vazirmatn font, Persian digits, on a dark glassy mint/lapis design system. It also ships as a **PWA** with Web Push notifications, a headless-WordPress blog, and Gemini-powered voice dictation on the review form.

---

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev                        # http://localhost:3000
```

In dev, the OTP code is the static value **`123456`** (logged by `lib/auth/otp.ts`) — Kavenegar SMS is only wired up when credentials are present.

### Scripts

| Command            | What it does                          |
| ------------------ | ------------------------------------- |
| `npm run dev`      | Start the dev server                  |
| `npm run build`    | Production build                      |
| `npm start`        | Serve the production build            |
| `npm run lint`     | Run ESLint                            |
| `npm test`         | Run Vitest unit tests (`vitest run`)  |
| `npm run test:e2e` | Run Playwright E2E tests              |

---

## Environment variables

Copy `.env.local.example` → `.env.local` and fill in. Summary:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Server-only privileged key — **never** expose to the browser |
| `JWT_SECRET` | yes | 32+ char secret for signing session cookies |
| `KAVENEGAR_API_KEY` / `KAVENEGAR_TEMPLATE` | for SMS | OTP delivery (dev uses static code `123456`) |
| `NEXT_PUBLIC_APP_URL` | yes | Absolute base URL |
| `WP_API_URL` | for blog | Root URL of the headless WordPress site |
| `WP_REVALIDATE_SECONDS` | no | Blog fetch cache TTL (default 60) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | for push | Web Push (generate with `npx web-push generate-vapid-keys --json`) |
| `GEMINI_API_KEY` | for voice | Gemini STT for the review mic (`/api/transcribe`); when unset the mic returns a 503 toast |
| `NEXT_PUBLIC_SMFLOW_*` / `SMFLOW_WIDGET_SECRET` | no | AI assistant widget (off by default) |

---

## Project layout

```
app/                 App Router routes (see sitemap below)
  api/               Route handlers (auth/me, transcribe)
  (auth)/            Login + OTP verify — chrome-less layout
  (user)/            Authenticated consumer area (profile, saved, settings, notifications)
  (business)/        Owner dashboard (post-claim)
  (admin)/           Internal moderation + claims queues
components/          React components, grouped by domain (layout, ui, sections, review, …)
lib/                 Data layer + integrations
  auth/              Phone OTP + signed-cookie sessions
  supabase/          Service-role DB client
  data/              Per-domain query helpers (businesses, reviews, users, …)
  push/              Web Push dispatcher
  wp.ts              Headless WordPress client
supabase/migrations/ SQL migrations (run on every new environment)
docs/                Source-of-truth docs (architecture, pages, data model)
e2e/                 Playwright specs
```

### Key routes

`/` · `/search` · `/categories` + `/categories/[slug]` · `/instagram-shops` · `/company/[slug]` (+ `/claim`) · `/shop/[handle]` · `/reviews` · `/blog` (+ `/[slug]`, `/category`, `/tag`) · `/about` · `/contact` · `/login` · `/profile` · `/saved` · `/notifications` · `/settings` · `/users/[username]` · `/for-business` · `/business/*` · `/admin/moderation` + `/admin/claims` · `/terms` · `/privacy`

Reviews are written through a global bottom-sheet wizard (`ReviewSheet`), not a standalone page.

---

## Data model (high level)

Three core Supabase tables plus supporting tables, all `snake_case` with `uuid` PKs and trigger-maintained denormalized counters:

- **`users`** — phone-verified profile (pseudonymous display name; `role` is `consumer` | `admin`). App-managed, standalone — does **not** extend `auth.users`.
- **`businesses`** — one table for both companies and IG shops, distinguished by `type` (`company` | `ig_shop`), single slug namespace.
- **`reviews`** — one per `(business_id, author_id)`, moderation-gated (`pending` → `published`/`rejected`), with a two-tier verified-purchase model.

Supporting: `review_votes`, `business_responses`, `review_reports`, `bookmarks`, `notifications`, `push_subscriptions`, `business_claims`. Full schema in [`docs/data-model.md`](docs/data-model.md).

---

## Conventions

- **Never `any`** — use `unknown`, then narrow.
- **Validate all inputs at the boundary** (route handlers, server actions).
- **App Router only** — no `pages/` directory, ever.
- **Tailwind v4 utilities only** — `app/globals.css` is config-only; shared class bundles live in `components/ui/styles.ts`. Never interpolate Tailwind classes.
- **RTL-first** — use logical spacing (`ms-*`/`me-*`) over `ml-*`/`mr-*`.
- **Co-locate tests** — `foo.ts` → `foo.test.ts`.
- **Never commit to `main`** — always a feature branch; PRs merge into `dev`.

See [`AGENTS.md`](AGENTS.md) for the full rules and [`docs/PROJECT.md`](docs/PROJECT.md) for architecture decisions.

---

## Documentation

| Doc | What's in it |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Conventions, priorities, hard rules |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Architecture, stack decisions, changelog |
| [`docs/pages-master.md`](docs/pages-master.md) | Every page: status, purpose, layout |
| [`docs/data-model.md`](docs/data-model.md) | Database schema and the reasoning behind it |
