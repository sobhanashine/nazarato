# Release spec: dev to main on the existing Nazarato Worker

User-authorized target: the existing Cloudflare Worker named `nazarato`. Promote the prepared dev-based feature through dev to main, and verify the live release.

Protect the original dirty checkout. Reconcile main merge history on the feature branch; run tests, TypeScript, full lint and a real build before pushing shared branches. Inspect the existing Worker and build configuration before changing deployment settings. Preserve dashboard variables and bindings. No paid upgrades, new database or source-data publication are part of this release.

Acceptance: main contains the prepared work, dev/main remote refs are verified, and provider deployment plus representative live routes are checked separately. A missing provider connection must be reported as an access dependency; a Git push alone is not live-deployment evidence.

## Deployment configuration

The existing Git connection deploys `main` in account `d1eddb5da27fb7bd6391eddf99f27309`. Cloudflare build command: `npm run build:cloudflare`; deploy command: `npx wrangler deploy`; root: `/`. `wrangler.jsonc` enables the normal workers.dev address, preserves dashboard variables with `keep_vars`, and supplies only the static ASSETS binding. Preview URLs remain disabled.

OpenNext preserves the application's Next.js build pipeline. Its current peer requirement needs Next.js >=16.3.6, so this release uses 16.3.8 with matching ESLint config. No paid database, cache or plan is added. A Wrangler dry run packages 1,611.16 KiB gzipped.

Build variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and encrypted `SUPABASE_SERVICE_ROLE_KEY`. Runtime has the same values plus encrypted `JWT_SECRET`. No secret values are stored in Git.

## Product limits

All four OTP actions reject outside development before cookie or account access; delivery itself also rejects. This was explicitly approved by the user because the existing flow accepts the fixed development code. Real SMS delivery and per-challenge verification must precede reopening public login. `GEMINI_API_KEY` is absent; the existing chat API returns its unavailable-service response until configured.

The ignored 22-cafe Golsar snapshot remains a local development preview. Promotion to main does not make this catalog public or grant ownership/source approval. The normal public data path stays on the existing Supabase integration.

## Verified release gates

112 unit tests pass, including all production OTP entry points and immutable chat streaming snapshots. Full lint and TypeScript pass. Next 16.3.8 and OpenNext build successfully. Wrangler dry-run succeeds; uploaded worker and sourcemap contain no service-role/JWT value. The OpenNext `.env*` fallback module is aliased to `cloudflare/runtime-env.mjs`, so runtime secrets come from bindings. The ignored source snapshot is absent from the built output.

Browser verification in the Workers runtime covers home, search, categories, company direct-load/refresh, chat streaming plus reload persistence, blocked public OTP with no session cookie, RTL and overflow at 390 and 1280 pixels. AI responses in the UI check are mocked; this is not a claim that Gemini is configured. The private company URL returns the Next not-found marker even when streaming gives HTTP 200; preview routes remain unavailable.
