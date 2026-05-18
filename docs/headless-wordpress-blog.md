# Headless WordPress for the Blog

The `/blog` section of nazarato is powered by a headless WordPress install via
the built-in **WP REST API**. Everything else (storefront, reviews, listings) stays
in Next.js / Supabase. WordPress is *only* a writing surface for blog posts.

---

## How it works

```
WordPress (cms.nazarato.com)
        │
        │  GET /wp-json/wp/v2/posts?_embed=1
        ▼
lib/wp.ts            ← typed REST client, maps WP → BlogPost
        │
        ▼
app/blog/page.tsx           (list, ISR 60s)
app/blog/[slug]/page.tsx    (detail, ISR 60s, generateStaticParams)
        │
        ▼
components/blog/PostCard.tsx
components/blog/PostContent.tsx  ← renders WP HTML via .wp-content
```

- The REST API is built into WordPress — **no plugin required**.
- We use `?_embed=1` so author, featured image, categories, and tags come back in
  one request.
- WP's `content.rendered` is HTML; we wrap it in a `.wp-content` block styled in
  `app/globals.css`.
- If `WP_API_URL` is unset, **or** WP is unreachable, both blog pages
  automatically fall back to the static seed data in `lib/data/blog-posts.ts`.
  The site never breaks.

---

## Files

| File | Role |
|---|---|
| `lib/wp.ts` | REST client: `fetchPostsFromWp`, `fetchPostBySlugFromWp`, `fetchPostSlugsFromWp`, `isWpEnabled`. |
| `lib/data/blog-posts.ts` | `BlogPost` / `ContentBlock` types (now includes `{type:"html"}`). Still ships static seed data. |
| `app/blog/page.tsx` | Listing page. WP-first, static fallback. |
| `app/blog/[slug]/page.tsx` | Detail page + `generateStaticParams` from WP. |
| `components/blog/PostContent.tsx` | Renders blocks; new `html` case uses `dangerouslySetInnerHTML`. |
| `app/globals.css` | `.wp-content` typography (headings, lists, blockquote, images, code). |
| `next.config.ts` | `images.remotePatterns` derived from `WP_API_URL`. |
| `.env.local.example` | Documents `WP_API_URL` and `WP_REVALIDATE_SECONDS`. |

---

## Setup — one-time

### 1. Stand up a WordPress instance

Pick one:

- **Local dev (free):** install **Local by Flywheel** → "Create new site". You
  get `http://localhost:10003` (or similar).
- **Production (hosted):** any WP host works. Cheap: Hostinger / DreamHost.
  Managed: Kinsta / WP Engine / Cloudways. Put WP on a subdomain such as
  `cms.nazarato.com` — keep the storefront on the Next.js site.

### 2. Configure WordPress

In `https://your-wp-site/wp-admin`:

1. **Settings → General →** Site Language: **فارسی** (Persian dates come back
   via WP's locale; Jalali formatting still happens client-side via
   `Intl.DateTimeFormat("fa-IR-u-ca-persian")`).
2. **Settings → Permalinks →** select **Post name** (`/%postname%/`). Save.
   This activates pretty REST URLs.
3. Verify REST: open `https://your-wp-site/wp-json/wp/v2/posts` in a browser;
   you should see a JSON array.

### 3. (Optional) Recommended plugins

| Plugin | Why |
|---|---|
| **Yoast SEO** | Better excerpts and meta. We already read `excerpt.rendered`. |
| **Disable Comments** | Comments live on the Next.js side; kill WP's. |
| **WPS Hide Login** | Move `/wp-admin` to a secret path. |
| **Classic Editor** | Only if you dislike Gutenberg. |

You do **not** need WPGraphQL or any "headless" plugin.

### 4. Point Next.js at WordPress

In your project root, create `.env.local`:

```env
WP_API_URL=https://cms.nazarato.com
WP_REVALIDATE_SECONDS=60
```

Rules:
- No trailing slash. No `/wp-json`.
- Set this **before** building/deploying — `next.config.ts` reads it at build
  time to allow the image domain.

Restart `npm run dev`. The blog now reads from WP.

### 5. Deploy

On Vercel: **Project Settings → Environment Variables → Production**:

- `WP_API_URL` = `https://cms.nazarato.com`
- `WP_REVALIDATE_SECONDS` = `60` (optional)

CORS is not needed — all fetches happen server-side from Next.js.

---

## Writing a blog post in WordPress

1. **Posts → Add New**.
2. Fill in:
   - **Title** → `post.title`
   - **Body** → rich text. Rendered through `.wp-content`. Headings, lists,
     quotes, embedded images all work.
   - **Featured image** (sidebar) → card thumbnail + hero. **Required** for a
     good-looking card; otherwise falls back to
     `/images/real-images/blog-image.png`.
   - **Categories** → first one becomes `post.category`.
   - **Tags** → comma-separated, become `post.tags`. If you skip tags, the
     category is reused as a tag.
   - **Excerpt** (collapsed in sidebar) → short summary for the card.
   - **URL slug** → ASCII like `how-to-pick-a-restaurant`. Becomes
     `/blog/<slug>`.
3. **Publish**.
4. Within `WP_REVALIDATE_SECONDS` (default 60s), the post appears on
   `/blog`.

### Forcing a refresh

- Local: restart `npm run dev`.
- Production: redeploy, or wait for the ISR window.
- Faster path (future): build a `/api/revalidate-blog` route that calls
  `revalidateTag("wp:posts")` and trigger it from a WP "WP Webhooks" plugin on
  publish.

---

## Mapping reference (WP → Next.js)

| WP field | `BlogPost` field |
|---|---|
| `slug` | `slug` |
| `title.rendered` | `title` (HTML stripped, entities decoded) |
| `excerpt.rendered` | `excerpt` (HTML stripped, entities decoded) |
| `content.rendered` | `content` → `[{ type: "html", html: ... }]` |
| `date` (ISO) | `date` → Jalali via `Intl.DateTimeFormat("fa-IR-u-ca-persian")` |
| `_embedded["wp:featuredmedia"][0].source_url` | `image` |
| `_embedded.author[0].name` | `author.name`, `author.initial` (first grapheme) |
| `_embedded["wp:term"]` (taxonomy `category`) | `category` (first one wins) |
| `_embedded["wp:term"]` (taxonomy `post_tag`) | `tags[]` |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blog still shows the 5 static seed posts after setting `WP_API_URL`. | Restart `npm run dev`. Env vars are only read at process start. |
| `next/image` error "hostname not configured". | You set `WP_API_URL` after the dev server started, or the URL has a typo. Restart so `next.config.ts:wpImagePattern()` re-reads it. |
| 404 on `/wp-json/wp/v2/posts`. | Permalinks aren't set to "Post name". Fix and save. |
| Post HTML looks unstyled. | `.wp-content` styles live in `app/globals.css`. If you scoped CSS or removed them, restore. |
| Author avatar is a plain initial. | WP only exposes the name. Read `_embedded.author[0].avatar_urls` in `lib/wp.ts:mapAuthor` for Gravatar; or install **Simple Local Avatars**. |
| Date shows as ISO. | The browser/Node lacks the Persian calendar locale. Use a modern Node version on the host. The catch in `formatPersianDate` already prevents crashes. |

---

## Security notes

- WP is reached **server-side only** (`fetch` runs in Next.js server components).
  The browser never sees `WP_API_URL`.
- All HTML from `content.rendered` is injected via `dangerouslySetInnerHTML`.
  WordPress sanitises post body for non-admin authors, but: **do not give untrusted
  users `unfiltered_html`/Editor+ capability**. Treat WP authors as you would
  treat anyone with publish rights to your site.
- Harden the WP admin: strong password, 2FA plugin, **WPS Hide Login**, keep WP
  + plugins auto-updating.

---

## Future enhancements (not done yet)

- URL-driven pagination on `/blog` (`?page=2`) — currently the paginator is
  visual only.
- Instant publish refresh via `revalidateTag` + WP webhook.
- Colored author avatars (requires either Gravatar or a `meta.color` ACF
  field on user profiles).
- Category / tag landing pages (`/blog/category/<slug>`).
