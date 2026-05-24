# نظراتو — Pages Master Doc

> Single source of truth for every page in the product: what exists, what's planned, what each page is for, and how it's structured.
> Update this when you add/rename/remove a route.

Last edited: 2026-05-22
Owner: Sobhan (solo founder)
Stack assumptions: Next.js 16 App Router, React 19, Tailwind v4, Supabase + Kavenegar OTP, RTL Persian (`lang="fa" dir="rtl"`).

---

## 1. Product context (1-minute brief)

- **What it is** — A Persian-language review platform for Iranian businesses, including regular companies (دیجی‌کالا, اسنپ‌فود…) and Instagram shops (`@manto_sara`, `@arezoo_cake`…).
- **Who it's for** — Three audiences sharing the same site:
  - **Consumers (default visitor)** — discover businesses, read reviews, write reviews. No login required for browsing. Auth required to write/save/report.
  - **Business owners** — claim a profile, respond to reviews, manage page content.
  - **Admins** — moderate reviews, approve claims, manage taxonomy. (Internal.)
- **North-star action** — A consumer writes a real, useful review about an Iranian business.
- **Login model** — Phone-based OTP via Kavenegar (no email/password assumed).
- **Review identity** — No anonymous reviews. Every review ties to a phone-verified account (identified). Public display uses a chosen display name (pseudonymous) — never the legal name, so honest negative reviews aren't suppressed.
- **Verified reviews** — Two tiers. **نقد تأییدشده** = reviewer submits proof of purchase (فاکتور / SMS confirmation / کد رهگیری, or DM screenshot / فیش for IG shops); admin checks it privately, then the proof image is **deleted** (only the verified boolean is kept — less storage, less liability). **نقد عادی** = no proof. Verified reviews rank higher, weigh more in the business score, and are the only tier eligible for reviewer badges. Verification is never mandatory — it is the aspirational tier, not a gate.
- **Locale** — `fa-IR`, RTL, Persian/Farsi digits (۱۲۳۴۵).
- **Style** — Dark, glassy/mint/lapis design system (see `app/globals.css`).

---

## 2. Information architecture (sitemap)

```
┌─ / ─────────────────────────────── Home (hero + categories + reviews + IG shops + blog)
├─ /search ───────────────────────── Search results (q, filters)
│
├─ /categories ───────────────────── All categories index
│   └─ /[slug] ────────────────────  Category detail (list businesses in فناوری / رستوران / …)
│
├─ /instagram-shops ──────────────── Instagram-shop directory (tabs: niche filter)
│
├─ /company/[slug] ───────────────── Business profile (e.g. /company/digikala)
│   ├─ /reviews ─────────────────── All reviews tab
│   ├─ /write-review ──────────────  Submit review (auth-gated)
│   └─ /claim ────────────────────── Claim this business (owner flow)
│
├─ /shop/[handle] ────────────────── Instagram-shop profile (e.g. /shop/manto_sara)
│   ├─ /reviews
│   └─ /write-review
│
├─ /reviews ──────────────────────── Recent reviews feed (all businesses)
├─ /write-review ─────────────────── Universal "start writing" entry (pick business first)
│
├─ /blog ─────────────────────────── Blog list
│   ├─ /[slug] ──────────────────── Blog post
│   ├─ /category/[slug] ─────────── Posts by category (optional)
│   └─ /tag/[slug] ──────────────── Posts by tag (optional)
│
├─ /about ────────────────────────── About us
├─ /contact ──────────────────────── Contact form
├─ /help ─────────────────────────── Help / FAQ (optional v2)
│
├─ /(auth) ───────────────────────── Auth route group (no header/footer chrome)
│   ├─ /login ──────────────────── Phone entry
│   ├─ /login/verify ─────────────  OTP code entry
│   └─ /signup ──────────────────── (only if separate from login; OTP can unify)
│
├─ /(user) ───────────────────────── Authenticated consumer area
│   ├─ /profile ──────────────────  Own profile (overview)
│   ├─ /profile/reviews ──────────  My reviews
│   ├─ /profile/edit ─────────────  Edit profile
│   ├─ /saved ────────────────────  Bookmarked businesses
│   ├─ /notifications ────────────  Activity feed
│   └─ /settings ─────────────────  Account/security/notifications/privacy
│       ├─ /security
│       ├─ /notifications
│       └─ /privacy
│
├─ /users/[username] ─────────────── Public profile of any reviewer (read-only)
│
├─ /for-business ─────────────────── Marketing landing for owners
├─ /business ─────────────────────── Owner dashboard (post-claim)
│   ├─ /reviews ─────────────────── Owner: review inbox + respond
│   ├─ /profile ─────────────────── Edit business page
│   ├─ /insights ────────────────── Basic analytics (v2)
│   ├─ /team ────────────────────── Team members (v2)
│   └─ /billing ─────────────────── Subscription (v2/v3)
│
├─ /admin ─────────────────────────── Internal moderation (gated by role)
│   ├─ /moderation ──────────────── Queue of new reviews
│   ├─ /reports ────────────────── Flagged content
│   ├─ /businesses ───────────────  Approve claims, edit listings
│   └─ /users ────────────────────  User management
│
├─ /terms ────────────────────────── Terms of service
├─ /privacy ──────────────────────── Privacy policy
├─ /cookies ──────────────────────── Cookie policy (only if you use non-essential cookies)
│
└─ System
    ├─ not-found.tsx (404)
    ├─ error.tsx (500/unhandled)
    └─ loading.tsx (streaming skeletons)
```

---

## 3. URL & file conventions

**Slug rules**
- All public-facing URLs are lowercase ASCII (so they survive copy-paste in non-RTL contexts).
- Persian business names get a transliterated slug: `دیجی‌کالا` → `/company/digikala`.
- Instagram handle keeps the `@`-less form: `/shop/manto_sara`.

**App Router layout**
- Use route groups `(auth)`, `(user)`, `(business)`, `(admin)` to scope layouts without polluting URLs.
- Every dynamic segment needs `generateStaticParams` (where pre-rendered) **and** `notFound()` fallback. Pattern is already in `app/blog/[slug]/page.tsx` — copy it.
- Every page that fetches data needs a co-located `loading.tsx` (skeleton) and `error.tsx` (recoverable error UI).
- **No `pages/` directory.** Ever. (AGENTS.md hard rule.)

**Proposed file tree (post-MVP)**
```
app/
├── layout.tsx              ← html lang="fa" dir="rtl" + MobileTabBar
├── page.tsx                ← Home
├── globals.css
├── not-found.tsx
├── error.tsx
├── loading.tsx
│
├── search/page.tsx
│
├── categories/
│   ├── page.tsx            ← Index
│   └── [slug]/page.tsx     ← Category detail
│
├── instagram-shops/page.tsx
│
├── company/
│   └── [slug]/
│       ├── page.tsx        ← Profile overview
│       ├── reviews/page.tsx
│       ├── write-review/page.tsx
│       └── claim/page.tsx
│
├── shop/
│   └── [handle]/...        ← (mirrors /company/[slug])
│
├── reviews/page.tsx
├── write-review/page.tsx
│
├── blog/                   ← already built
│   ├── page.tsx
│   └── [slug]/page.tsx
│
├── about/page.tsx
├── contact/page.tsx
├── help/page.tsx
│
├── (auth)/
│   ├── layout.tsx          ← centered card layout, no header/footer
│   ├── login/
│   │   ├── page.tsx
│   │   └── verify/page.tsx
│   └── signup/page.tsx
│
├── (user)/
│   ├── layout.tsx          ← shared sidebar + auth guard
│   ├── profile/
│   │   ├── page.tsx
│   │   ├── reviews/page.tsx
│   │   └── edit/page.tsx
│   ├── saved/page.tsx
│   ├── notifications/page.tsx
│   └── settings/
│       ├── page.tsx
│       ├── security/page.tsx
│       ├── notifications/page.tsx
│       └── privacy/page.tsx
│
├── users/[username]/page.tsx
│
├── for-business/page.tsx
├── (business)/
│   ├── layout.tsx          ← owner shell + auth+role guard
│   └── business/
│       ├── page.tsx
│       ├── reviews/page.tsx
│       ├── profile/page.tsx
│       ├── insights/page.tsx
│       ├── team/page.tsx
│       └── billing/page.tsx
│
├── (admin)/
│   ├── layout.tsx          ← admin shell + role guard
│   └── admin/
│       ├── page.tsx
│       ├── moderation/page.tsx
│       ├── reports/page.tsx
│       ├── businesses/page.tsx
│       └── users/page.tsx
│
├── terms/page.tsx
├── privacy/page.tsx
└── cookies/page.tsx
```

---

## 4. Page catalog

Each entry is structured the same way so it scans fast:

> **Route** • **Status**: ✅ built / 🚧 partial / 📋 planned
> **Priority**: P0 = MVP, P1 = v1.0, P2 = v2+
> **Auth**: public / auth / owner / admin

### 4.1 Public — discovery

#### Home — `/` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: First impression. Convert visitor → "I trust this site, let me search."
- **Layout**: `<Header /> <Hero /> <main> ... </main> <Footer /> <MobileTabBar />` (already in `app/page.tsx`).
- **Sections**: Hero search, Categories scroller, Recent Reviews, Instagram Shops (with niche tabs), Blog teaser.
- **Data**: Static for now; later → top-rated, latest reviews, featured shops.
- **States**: Loaded only (no empty state — always populated).
- **Notes**: Replace popular-search hardcoded array with top-search analytics once data exists.

#### Search results — `/search?q=...&category=...&rating=...` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: Show businesses & shops matching a query. The hero's main CTA leads here, so it can't be missing in MVP.
- **Layout**: PageBanner ("نتایج جستجو برای «X»") + sidebar filters (category / rating / has-reviews / verified) + result cards + pagination.
- **Sections**:
  - Active filter chips (dismissible)
  - Sort dropdown (مرتب‌سازی: مرتبط‌ترین / امتیاز / تعداد نظر / جدیدترین)
  - Tab switcher: "همه" / "کسب‌وکارها" / "اینستاگرامی"
  - Result card = avatar + name + rating chips + 1-line excerpt of latest review
- **Data**: `?q`, `?category[]`, `?rating>=`, `?type=biz|insta`, `?page`. Server component reads `searchParams`.
- **States**: Empty ("چیزی پیدا نشد — این پیشنهادها رو ببین"), loading skeleton, error.
- **A11y**: live region for result count; first focusable element is the search input (allow refinement without scrolling).
- **Typeahead**: from the 2nd character the search box shows a live dropdown of matching businesses (companies + IG shops). The same typeahead is on the homepage hero. Logic is shared in `lib/search.ts` (`suggestBusinesses`), UI in `components/search/SearchSuggestions.tsx`.

#### Categories index — `/categories` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: All categories at a glance.
- **Layout**: PageBanner + grid of category cards (reuse `Categories` section card design, but full grid not horizontal scroll).
- **Sections**: Search field (filter visible cards), grid (sorted by popularity).
- **Data**: `lib/data/categories.tsx` (already exists).
- **Notes**: Lift the inline icon set out — current `<svg>`s are inlined per-category; consider an `icon` field referencing an icon component name once you have >20 categories.

#### Category detail — `/categories/[slug]` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: Discover businesses inside one category (e.g. all رستوران).
- **Layout**: PageBanner with category name/desc + filter sidebar + business list + pagination.
- **Sections**:
  - Sub-category chips (e.g. ایرانی / فست‌فود / کافه inside رستوران)
  - Sort: امتیاز / تعداد نظر / جدیدترین
  - Business card: image, name, rating, review count, last-review preview, city
- **Data**: server-fetched businesses filtered by category slug.
- **States**: Empty (category has zero businesses yet) shows CTA "اولین کسب‌وکار را معرفی کن".
- **`generateStaticParams`**: yes — categories change infrequently.

#### Instagram shops — `/instagram-shops` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: Browse all IG shops (with niche tabs, same UX as homepage section but full-page).
- **Layout**: PageBanner + niche tabs sticky + grid + pagination.
- **Data**: `lib/data/instagram-shops.ts` (already exists; later DB-backed).
- **Notes**: Reuse `InstagramShops.tsx` card markup; extract `<IgShopCard />` so home + this page share it.

#### Business profile — `/company/[slug]` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: The most important page in the product. Everything funnels here.
- **Layout (mobile-first)**:
  ```
  [ Cover/banner image with gradient overlay ]
  [ Avatar | Business name + verified | Average rating + count ]
  [ Action bar: "نوشتن نظر" (primary) / "ذخیره" / "اشتراک" ]
  [ Tabs: نمای کلی · نظرات · اطلاعات · مشابه ]
  ── Tab: نمای کلی ─────────────────
    - About / description
    - Rating breakdown (5★→1★ bars)
    - Latest 3 reviews + "همه نظرات →" link
    - Contact info (site, phone, IG)
    - Hours (if applicable)
    - Map embed (if physical location, v1+)
  ── Tab: نظرات ───────────────────
    - Filter chips (★5, ★4, with-photos, has-response)
    - Sort (مفیدترین / جدیدترین / قدیمی‌ترین)
    - Review list (paginated)
  ── Tab: اطلاعات ─────────────────
    - Detailed fields (CEO, founded, employees…) — owner-editable
  ── Tab: مشابه ───────────────────
    - 4–8 similar businesses in same category
  ```
- **Data**: `business`, `reviews[]`, `ratingHistogram`, `similarBusinesses[]`. Use parallel routes `@reviews` / `@about` if tab content gets heavy; otherwise a single page with anchor sections is fine for MVP.
- **States**:
  - **No reviews yet** — empty state with "اولین نظر را تو بنویس" CTA.
  - **Unclaimed** — small banner "این کسب‌وکار صاحبش ثبت نکرده · ادعای مالکیت".
  - **Claimed + verified** — green tick badge.
- **A11y**: Headings: h1 = business name, h2 per section. Rating must not rely on color only — show numeric "۴.۳ از ۵" beside stars (UX rule `color-not-only`).
- **Owner view**: same URL, plus a sticky "حالت مدیریت" bar with "ویرایش پروفایل" / "پاسخ به نظر" shortcuts when `viewer.role === "owner" && viewer.ownsBusiness`.

#### Business reviews tab — `/company/[slug]/reviews` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: Deep link to the reviews tab (for SEO and shareable filtered links like `?rating=5`).
- **Layout**: Mirrors the نظرات tab above, but as its own URL so search engines index review content.
- **Implementation note**: This can be the same page component as `/company/[slug]` with a default tab; or split it. **Recommendation**: split — better SEO and simpler streaming.

#### Write review (business) — `/company/[slug]/write-review` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; auth
- **Purpose**: Submit a review for a specific business.
- **Layout**: centered single-column form on glass card.
- **Form steps** (single page, vertical):
  1. Rating selector (1–5 stars, large hit targets — UX rule `touch-target-size`)
  2. Title (single line, max 80 chars)
  3. Body (textarea, min 30 chars / max 2000; show counter)
  4. (optional) Photos upload — v1+ for MVP skip
  5. Order/purchase date (optional)
  6. Submit
- **States**: Loading, success (toast + redirect to /company/[slug]/reviews), validation errors inline. Auth gate → redirect to `/login?next=...`.
- **Validation**: server-side at the API boundary (AGENTS.md rule: "Validate all API/route inputs at the boundary").

#### Claim business — `/company/[slug]/claim` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1 &nbsp;·&nbsp; auth
- **Purpose**: Business owner asserts ownership of an unclaimed listing.
- **Flow**: identity (phone OTP already done) → proof of association (work email at domain OR upload doc) → moderation queue → email/SMS once approved.

#### Instagram-shop profile — `/shop/[handle]` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- Mirror of `/company/[slug]` but:
  - Hero shows IG-style conic-gradient avatar ring (already styled in `InstagramShops.tsx` — extract as `<IgAvatar />`).
  - "اطلاعات تماس" replaces "ساعات کاری" — handle, DM link, website.
  - "وضعیت تایید فروشگاه" badge logic differs (we verify based on activity/order proof rather than business registration).

#### All recent reviews — `/reviews` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Purpose**: Site-wide review feed (the homepage shows top 6 — this shows everything).
- **Layout**: PageBanner + filter bar (rating, category, IG-only) + infinite scroll OR paginated list of `<ReviewCard />`.
- **Sort**: Default = جدیدترین. Other: مفیدترین، بحث‌برانگیزترین.
- **Notes**: Reuse `RecentReviews.tsx` card markup → extract as `<ReviewCard />`.

#### Universal "write review" entry — `ReviewSheet` (Global Modal) &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; auth
- **Purpose**: The mobile-tab-bar FAB, header menu, and other global CTAs open this bottom sheet.
- **Layout**: Bottom sheet containing a multi-step wizard.
- **Flow**: step 1: pick business (if not pre-filled) → step 2: rate → step 3: write review → submit. Replaces the older `/write-review` standalone route pattern to keep the user in context.

### 4.2 Public — content & marketing

#### Blog list — `/blog` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- See `app/blog/page.tsx`. Already has Breadcrumb, PageBanner, post grid, sidebar (search/categories/tags/latest), pagination.
- **Outstanding**: pagination is hardcoded `totalPages={3}` — wire to real data.
- **Outstanding**: mobile "filter" button has no drawer behavior yet.

#### Blog post — `/blog/[slug]` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- See `app/blog/[slug]/page.tsx` + `components/blog/PostContent.tsx`. Has title, meta (author/cat/date), hero image, paragraph/subhead/quote/learn-list/image/requirements blocks, share bar, tags.
- **Outstanding (P1)**: related posts at the bottom; comments (or "discuss on X"); reading-time estimate; ToC for long posts.

#### Blog by category — `/blog/category/[slug]` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1
- Same shell as `/blog`, prefiltered.

#### Blog by tag — `/blog/tag/[slug]` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1

#### About — `/about` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 (because header links to it)
- **Purpose**: Trust building. "Who are you? Why should I trust this site?"
- **Layout (mobile-first)**: hero copy + mission + how we verify reviews + founder note (you're the solo founder — this is a competitive advantage; lean in) + press/social proof if any.
- See `app/about/page.tsx`: PageBanner, mission + reused `<HeroStats />`, 4-step verification, values grid, founder note, CTA.

#### Contact — `/contact` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- Email + phone + IG handle + a real form (name / email / message) wired to email-or-DB intake.
- A11y: visible labels (rule `input-labels`), inline validation on blur (rule `inline-validation`).
- See `app/contact/page.tsx` + `components/contact/ContactForm.tsx`. Form calls the `submitContact` server action (`app/contact/actions.ts`) — boundary-validated. **Pending**: no email/DB delivery yet (action logs submissions); no phone line yet (channels show email + Instagram + response hours).

#### Help / FAQ — `/help` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1
- Accordion of common questions: "چطور نظر بدم؟", "چرا نظرم تایید نشد؟", "کسب‌وکارم اینجا چطور ثبت میشه؟", "حذف حساب چگونه است؟".

### 4.3 Auth — `(auth)` route group

> Layout note: this route group gets its own `layout.tsx` that hides the marketing Header/Footer and centers a card. The MobileTabBar should also be hidden here (it's distracting during a critical flow).

#### Login (phone entry) — `/login` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0 &nbsp;·&nbsp; public
- **Layout**: centered glass card. Brand mark + heading "ورود یا ثبت‌نام" + phone input with `+98` prefix + "ارسال کد" button + terms checkbox.
- **State**: idle / submitting / rate-limited / error. Show error inline near the field (UX rule `error-placement`).
- **Submit**: POST `/api/auth/otp/start` → on success redirect to `/login/verify?phone=...&next=...`.

#### Verify OTP — `/login/verify` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- **Layout**: 6-digit code input (auto-tab, paste-supported, `inputMode="numeric"` for keyboard — UX rule `input-type-keyboard`). Resend countdown timer. "تغییر شماره" link back to `/login`.
- **State**: idle / verifying / wrong code / expired / locked-out. Auto-submit on 6th digit.
- **Submit**: POST `/api/auth/otp/verify` → set HTTP-only JWT cookie → redirect to `?next` or `/`.
- **Edge**: prefer `useFormStatus` / form actions over manual fetch; works without JS.

#### Sign-up — `/signup` &nbsp;·&nbsp; (likely merged with `/login` since OTP makes them the same)
- **Decision**: don't build a separate page unless you collect extra fields at first login. Default plan: collect display name on first-OTP-success via a one-time onboarding step.

### 4.4 User account — `(user)` route group

> Layout note: shared `layout.tsx` includes a vertical settings/profile sidebar on desktop, hidden on mobile (replaced by tabs). All pages here require auth — gate at the layout level with `redirect("/login?next=...")`.

#### My profile — `/profile` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- **Purpose**: At-a-glance dashboard for the logged-in consumer.
- **Sections**: avatar + name + member-since + stats (تعداد نظرات / مفید بود / فالوور) + tab links to "نظرات من" / "ذخیره‌شده‌ها" / "تنظیمات".

#### My reviews — `/profile/reviews` &nbsp;·&nbsp; ✅ built &nbsp;·&nbsp; P0
- **Purpose**: List of reviews you wrote, with status (منتشر شده / در انتظار / رد شده).
- **Actions per row**: ویرایش / حذف. Confirmation dialog on delete (UX rule `confirmation-dialogs`).

#### Edit profile — `/profile/edit` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P0
- Fields: avatar upload (or initial color), display name, bio (140 chars).

#### Saved — `/saved` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P0 (tab-bar links here)
- **Purpose**: Bookmarked businesses & shops.
- **Layout**: tabs "کسب‌وکارها" / "اینستاگرامی" + grid of cards (reuse business-card / ig-card).
- **Empty state**: "هنوز چیزی ذخیره نکردی — این پیشنهادها رو ببین" + 4 popular cards.

#### Notifications — `/notifications` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1
- **Purpose**: New responses to your reviews, new reviews on saved businesses, system messages.
- **Layout**: chronological list grouped by day; mark-all-read button.
- **A11y**: items use `aria-live="polite"` only for in-page updates.

#### Settings — `/settings` &nbsp;·&nbsp; 🚧 partial &nbsp;·&nbsp; P0
- **Purpose**: Index page with quick links into sub-settings.
- **Sub-pages**:
  - `/settings/security` — change phone, sessions list, logout-all (deferred for next phase).
  - `/settings/notifications` — toggles: in-website notifications (built).
  - `/settings/privacy` — public profile visibility (built), delete account (deferred).

### 4.5 Public profile of any user — `/users/[username]` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1
- **Purpose**: When you click a reviewer's name, you see their public history.
- **Layout**: hero (avatar/name/joined) + stats + their reviews list + "گزارش این کاربر" link.
- **Privacy**: respects `settings.privacy.publicProfile=false` → 404 to non-owner viewers.

### 4.6 Business owner — `(business)` route group

> Layout note: separate shell with a left sidebar nav. Gated by `viewer.role === "owner"` at the layout — otherwise redirect.

#### Marketing landing — `/for-business` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1 &nbsp;·&nbsp; public
- **Purpose**: Sell the owner-side product. Hero pitch ("نظرات واقعی، اعتماد بیشتر، فروش بهتر") + features grid + pricing teaser + CTA "ادعای مالکیت کسب‌وکار" / "ثبت کسب‌وکار جدید".

#### Owner dashboard — `/business` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1 &nbsp;·&nbsp; owner
- KPI tiles: avg rating, total reviews, new this week, unanswered count → links to each.
- Latest 5 reviews with quick "پاسخ" button.

#### Owner reviews inbox — `/business/reviews` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1 &nbsp;·&nbsp; owner
- Same data as `/company/[slug]/reviews` but with inline response composer + flag-for-removal button.

#### Edit business profile — `/business/profile` &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P1 &nbsp;·&nbsp; owner
- Edit description, contact info, hours, photos.

#### Insights / Team / Billing — &nbsp;·&nbsp; 📋 planned &nbsp;·&nbsp; P2 &nbsp;·&nbsp; owner
- v2+. Defer until owners actually ask.

### 4.7 Admin — `(admin)` route group &nbsp;·&nbsp; 🚧 partial &nbsp;·&nbsp; P1 &nbsp;·&nbsp; admin

> Internal-only. Gate by Supabase RLS + `viewer.role === "admin"`.

- `/admin` — overview tiles (pending reviews, pending claims, reported items, new businesses).
- `/admin/moderation` — ✅ built — review queue with approve/reject (including private purchase proof viewing/deletion), optional rejection reasons, dynamic dashboard statistics, and template violation chips.
- `/admin/reports` — reports inbox with action buttons.
- `/admin/businesses` — list/edit/merge/approve-claim.
- `/admin/users` — list/ban/role-toggle.

> Solo-founder note: it's tempting to skip admin pages and do everything in Supabase Studio. **Build the moderation queue at minimum** — you'll be moderating daily, and a 30-minute admin page saves hours every week.

### 4.8 Legal — &nbsp;·&nbsp; ✅ done &nbsp;·&nbsp; P0
- `/terms`, `/privacy` are linked from the footer and must exist before launch (legal expectation in Iran + Vercel TOS). Use static MDX or markdown-rendered route handler.
- `/cookies` only if you set non-essential cookies (analytics).

### 4.9 System

#### 404 — `app/not-found.tsx`
- Branded illustration + "صفحه پیدا نشد" + search bar + 4 trending businesses.

#### Error — `app/error.tsx`
- "یه چیزی خراب شد" + a "تلاش دوباره" button (`reset()` from the segment). Log to your error sink.

#### Loading skeletons — `app/loading.tsx` (and per-segment)
- Glass-style skeleton blocks. Reserve space to prevent CLS (rule `content-jumping`).

#### Maintenance — only if you need it.

---

## 5. Cross-cutting UI patterns

These are reusable across pages — extract once, share everywhere.

### 5.1 Layout primitives

| Primitive          | Used on                                                | Status      | File                                         |
|--------------------|--------------------------------------------------------|-------------|----------------------------------------------|
| `<Header />`       | Every public page                                      | ✅ built    | `components/layout/Header.tsx`               |
| `<Footer />`       | Every public page                                      | ✅ built    | `components/layout/Footer.tsx`               |
| `<MobileTabBar />` | All authenticated mobile views (and home)              | ✅ built    | `components/layout/MobileTabBar.tsx`         |
| `<MobileMenu />`   | Sub-component of Header                                | ✅ built    | `components/layout/MobileMenu.tsx`           |
| `<Breadcrumb />`   | All non-home pages                                     | ✅ built    | `components/ui/Breadcrumb.tsx`               |
| `<PageBanner />`   | All sub-pages with a title                             | ✅ built    | `components/ui/PageBanner.tsx`               |
| `<NavLink />`      | Header nav                                             | ✅ built    | `components/layout/NavLink.tsx`              |
| `<AuthLayout />`   | `/login`, `/login/verify`, `/signup`                   | ✅ built    | `app/(auth)/layout.tsx`                       |
| `<UserShell />`    | `/profile`, `/saved`, `/settings`, `/notifications`    | ✅ built    | `app/(user)/layout.tsx`                       |
| `<OwnerShell />`   | `/business/*`                                          | 📋 planned  | `app/(business)/layout.tsx`                   |
| `<AdminShell />`   | `/admin/*`                                             | ✅ built    | `app/(admin)/layout.tsx`                      |

### 5.2 Reusable cards / blocks (extract these from the home-page sections)

| Component         | Source today                          | Used on                                            |
|-------------------|---------------------------------------|----------------------------------------------------|
| `<BusinessCard />`| TBD (extract from /company tile)      | `/search`, `/categories/[slug]`, `/saved`, /admin  |
| `<IgShopCard />`  | inlined in `InstagramShops.tsx`       | `/instagram-shops`, `/shop`, `/saved`              |
| `<ReviewCard />`  | inlined in `RecentReviews.tsx`        | `/reviews`, `/company/[slug]/reviews`, `/profile/reviews`, `/users/[username]` |
| `<RatingStars />` | inlined `<Stars />` in RecentReviews  | wherever a rating is shown                         |
| `<RatingBars />`  | new                                   | `/company/[slug]` rating breakdown                 |
| `<PostCard />`    | `components/blog/PostCard.tsx`        | `/blog`, `/blog/category`, `/blog/tag`             |

> **Action**: lift `<ReviewCard />` and `<IgShopCard />` out of their sections **before** building the search/profile/reviews pages — those pages would otherwise duplicate ~150 lines of JSX each.

### 5.3 Page-state standards

Every page must define these four states explicitly:

- **Loading** — `<Skeleton />` blocks reserving the final layout's dimensions (CLS-safe).
- **Empty** — friendly Persian copy + a primary action that gets the user out of empty state.
- **Error** — non-blame copy ("یه چیزی خراب شد"), retry button, optional link to /help.
- **Auth-gated** — for restricted routes: redirect with `?next=`; never show "please log in" inline if the page itself can't render without auth.

### 5.4 Accessibility checklist (apply to every new page)

Picked from ui-ux-pro-max highest-priority rules; tick before merging:

- [ ] All text 4.5:1 contrast vs background (mint on dark glass is the usual offender — verify).
- [ ] Every icon-only button has `aria-label` (Persian).
- [ ] Tab order matches RTL visual order.
- [ ] Min touch target 44×44 (mobile FAB, tab-bar items, star selector).
- [ ] No info conveyed by color alone (rating stars also show numeric value).
- [ ] `prefers-reduced-motion` respected on Hero animations (already in `globals.css` — preserve).
- [ ] Forms: visible labels (not placeholder-only), errors near field, `aria-live` summary.

---

## 6. Recommended build order

You're a solo founder. Don't try to build the sitemap top-down. Build the minimum loop that lets one real user complete the north-star action ("find a business → read a review → write a review"), then expand.

### Phase 0 — already done ✅
- Home, Blog list, Blog post, all chrome (Header/Footer/MobileTabBar/Breadcrumb/PageBanner).

### Phase 1 — MVP loop (1–2 weeks)
> Goal: a stranger can search, read, sign in, write, see their review.
1. `/about` + `/contact` (tiny, gets you legal-ready and trust signals).
2. `/login` + `/login/verify` (OTP wiring with Kavenegar + Supabase).
3. `/profile` + `/profile/reviews` (so users see their writing).
4. Extract `<BusinessCard />`, `<ReviewCard />`, `<IgShopCard />`.
5. `/company/[slug]` (the centerpiece — overview + inline reviews + write-review CTA).
6. `/company/[slug]/write-review` (auth-gated form).
7. `/search` (so the hero search actually works).
8. `/terms` + `/privacy` (legal) — ✅ built.
9. `/admin/moderation` (the one admin page you can't avoid) — ✅ built.

### Phase 2 — v1.0 (2–4 weeks)
1. `/categories` + `/categories/[slug]`.
2. `/instagram-shops` + `/shop/[handle]` + `/shop/[handle]/write-review`.
3. `/reviews` (global feed).
4. `/saved` + bookmark API.
5. `/settings` (security + notifications + privacy + delete account).
6. `/users/[username]` (public profile).
7. `/for-business` (owner marketing) + `/company/[slug]/claim`.
8. `/business` + `/business/reviews` + `/business/profile`.
9. Blog: `/blog/category/[slug]`, `/blog/tag/[slug]`, related posts.

### Phase 3 — v2+ (when traction justifies)
- `/notifications`, `/business/insights`, `/business/team`, `/business/billing`.
- Compare businesses, follow users, Q&A on business pages, photo uploads on reviews.
- Full admin: `/admin/reports`, `/admin/businesses`, `/admin/users`.

### Gamification & trust loop (phased)

The badge/leaderboard system is an *amplifier* — it is built only once the review loop is already turning. Schema first, engine later: adding fields now is nearly free, a migration later is painful.

- **Phase 1** — Add the data fields now (`review.verified`, `review.helpfulCount`, `user.reputationScore`, `business.responseRate`). Ship the **verified badge on reviews** + **"مفید بود" helpful votes**. The verified badge is the only game mechanic at MVP.
- **Phase 2** — Public **response-rate / response-time** stat on business profiles. Reviewer profile shows total helpful votes received.
- **Phase 3** — Full system: reviewer **levels** (تازه‌وارد → منتقد ارشد, driven by helpful votes, *not* review count), rotating **leaderboards**, **"بهترین‌های دسته"** page (composite rank: rating × volume × recency × response rate), embeddable "X در نظراتو" widget.

> Anti-abuse: badges/scores only count *after* a review clears moderation. New accounts' reviews and votes weigh less. Reward quality signals (helpful votes, verified purchases, depth) — never raw review count.

---

## 7. Open decisions / questions to resolve

These will shape the doc once you decide. Flagged here so they don't get lost.

1. **Login model** — phone-only (Kavenegar OTP) or also email+password? .env hints at phone-only. Confirm before building.
2. **Onboarding** — do you collect display name on first login (extra step) or auto-generate one (e.g. کاربر+last4digits)?
3. **Photos on reviews** — MVP or v1? Adds Supabase storage + moderation work. (Note: *proof-of-purchase* uploads are a separate, decided flow — see §1 "Verified reviews". This item is only about user-attached photos in the review body.)
4. **Owner responses** — public-only, or also private DM? Most platforms do public-only.
5. **Multi-city / geo** — single-country (Iran) is given; do you want `/locations/tehran` pages for local SEO?
6. **Comments on blog posts** — comments, "discuss on X/Telegram", or none?
7. **Pricing for owners** — free always vs freemium vs paid? Determines whether `/business/billing` needs to exist.
8. **Deletion** — GDPR-style hard-delete or soft-anonymize? Affects `/settings/privacy` UX.

### Recently resolved

- **Anonymous reviews** — ❌ no anonymous reviews; identified + pseudonymous. Settled 2026-05-22 → moved to §1 "Review identity".
- **What "verified" means** — proof-of-purchase, private admin check, two-tier model. Settled 2026-05-22 → moved to §1 "Verified reviews".
- **Gamification timing** — phased (schema in Phase 1, engine in Phase 3). Settled 2026-05-22 → moved to §6 "Gamification & trust loop".
- **IG-shop vs business** — ✅ a single `businesses` table + a `type` column (`'company'` | `'ig_shop'`); one slug namespace so `/company/x` and `/shop/x` can't collide; routes stay separate. Settled 2026-05-22 → see `data-model.md` §3.

---

## 8. Maintenance

- When you ship a page, change its status here from 📋 → ✅ and link the PR.
- When you rename a route, also rename it here + the file tree.
- When a new "open decision" gets settled, move it into the relevant section and remove from §7.
- If a section grows too long, split it into its own doc under `docs/` and link.
- When you open, close, or re-scope an issue, keep the **Issue tracker index** below in sync.

### 8.1 Issue tracker index

GitHub issues mirror the build order in §6. Repo: [`sobhanashine/nazarato`](https://github.com/sobhanashine/nazarato/issues). Diagrams: [`pages-diagrams.md`](./pages-diagrams.md). Database schema: [`data-model.md`](./data-model.md).

**Phase 1 — MVP loop** · [milestone](https://github.com/sobhanashine/nazarato/milestone/1)

| Route(s) / deliverable | Issue |
|------------------------|-------|
| `/login` · `/login/verify` | [#13](https://github.com/sobhanashine/nazarato/issues/13) |
| `/profile` · `/profile/reviews` | [#14](https://github.com/sobhanashine/nazarato/issues/14) |
| Shared cards — `<BusinessCard />` `<ReviewCard />` `<IgShopCard />` `<RatingStars />` | [#15](https://github.com/sobhanashine/nazarato/issues/15) |
| `/company/[slug]` | [#16](https://github.com/sobhanashine/nazarato/issues/16) |
| `/company/[slug]/write-review` | [#17](https://github.com/sobhanashine/nazarato/issues/17) |
| `/search` | [#18](https://github.com/sobhanashine/nazarato/issues/18) |
| `/terms` · `/privacy` | [#19](https://github.com/sobhanashine/nazarato/issues/19) |
| `/admin/moderation` | [#20](https://github.com/sobhanashine/nazarato/issues/20) |

**Phase 2 — v1.0** · [milestone](https://github.com/sobhanashine/nazarato/milestone/2)

| Route(s) / deliverable | Issue |
|------------------------|-------|
| `/categories` · `/categories/[slug]` | [#21](https://github.com/sobhanashine/nazarato/issues/21) |
| `/instagram-shops` · `/shop/[handle]` · `/shop/[handle]/write-review` | [#22](https://github.com/sobhanashine/nazarato/issues/22) |
| `/reviews` | [#23](https://github.com/sobhanashine/nazarato/issues/23) |
| `/saved` (+ bookmark API) | [#24](https://github.com/sobhanashine/nazarato/issues/24) |
| `/settings` · `/settings/security` · `/settings/notifications` · `/settings/privacy` | [#25](https://github.com/sobhanashine/nazarato/issues/25) |
| `/users/[username]` | [#26](https://github.com/sobhanashine/nazarato/issues/26) |
| `/for-business` · `/company/[slug]/claim` | [#27](https://github.com/sobhanashine/nazarato/issues/27) |
| `/business` · `/business/reviews` · `/business/profile` | [#28](https://github.com/sobhanashine/nazarato/issues/28) |
| `/blog/category/[slug]` · `/blog/tag/[slug]` · related posts (+ `/blog` pagination) | [#29](https://github.com/sobhanashine/nazarato/issues/29) |

**Phase 3 — v2+** · [milestone](https://github.com/sobhanashine/nazarato/milestone/3)

| Route(s) / deliverable | Issue |
|------------------------|-------|
| `/notifications` | [#30](https://github.com/sobhanashine/nazarato/issues/30) |
| `/business/insights` · `/business/team` · `/business/billing` | [#31](https://github.com/sobhanashine/nazarato/issues/31) |
| `/admin` · `/admin/reports` · `/admin/businesses` · `/admin/users` | [#32](https://github.com/sobhanashine/nazarato/issues/32) |
| v2+ features — compare businesses, follow users, Q&A, review photos | [#33](https://github.com/sobhanashine/nazarato/issues/33) |

**Not tracked** — already ✅ built, no issue: `/` · `/blog` · `/blog/[slug]` · `/about` · `/contact`.
**Untracked gaps** — `/company/[slug]/reviews` (split recommended in §4.1, folded into #16 for now); `/help` and `/cookies` (P1/conditional, no issue yet); `/contact` email/DB delivery still pending (§4.2).

> One file. One owner. One source of truth. Don't let it rot.
