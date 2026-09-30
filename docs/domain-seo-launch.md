# Main domain and early SEO launch

## Requested outcome

The founder requested `nazarato.ir` to serve the existing `main` Worker and
allowed indexing before the full product is finished. Keep the existing design.

## Scope

1. Connect the apex and `www` to production, replacing the obsolete Vercel web
   records after recording their values. Preserve unrelated DNS records.
2. Permanently redirect `www` and the public `workers.dev` alias to the apex,
   preserving path and query. Force HTTPS at Cloudflare.
3. Start indexing with the homepage: a truthful Persian introduction to the
   early product, with canonical/social metadata, robots and a one-page sitemap.
4. Keep unfinished catalog, blog, account and preview routes out of the index.
   Crawlable documents carry `noindex, follow`; this is not an access-control gate.
5. Remove test reviews, fixture ratings, unsupported counts and inactive feature
   promises from the production homepage. Preserve development preview behavior.

## Data and failure handling

- No database writes, source approvals, imported cafe data, or schema changes.
- The existing Supabase environment still contains development content; its
  cleanup and catalog publication are separate tasks before widening indexing.
- A missing Search Console property does not prevent the site from being
  crawlable. Track property verification/submission separately; do not claim
  Google has indexed a page merely because crawling is allowed.
- A failed domain connection leaves the task unfinished. Check the actual
  HTTPS page and provider release after deployment, not only DNS or Git.

## Acceptance

The apex serves the exact successful `main` release over HTTPS; aliases redirect;
the homepage permits indexing and has no sample activity; all other documents
remain noindex; sitemap and canonical use the apex; tests/build/browser pass;
Trello names the next product and SEO tasks.
