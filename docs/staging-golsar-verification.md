# Golsar staging verification — 2026-10-16

Scope: [Trello 34](https://trello.com/c/L7OhGwkq), `dev` and the
`nazarato-staging` Worker only. Main's existing visual system is retained.

## Verified before release

- 403 unit tests in 82 files, TypeScript, ESLint, final OpenNext staging build,
  Wrangler staging dry-run and whitespace checks passed.
- Actual workerd sends the Gemini request and rejects redirects without
  following them. Gemini and Push regression tests cover provider redirects.
- A disposable PostgreSQL instance passed import/reimport, service-role writes,
  review counters, bookmarks, taste RPC and both populated/exposed-schema
  rollback guards. Production sentinel data remained unchanged.
- Remote staging has 22 businesses, 22 source rows, zero imported users/reviews,
  no cross-schema foreign keys or function references, and no anonymous or
  authenticated-role schema usage. Service-role REST reads succeeded.
- Fingerprints of all 18 production application tables match the pre-change
  capture. Backups, generated SQL, provider evidence and raw data are private.
- Browser checks of database-backed search, the Saye native profile and Nabz
  pair retrieval passed. The 390 px RTL profile has no horizontal overflow.
- Exact retained credential scan found no secrets in changed source or 1,618
  generated deployment files. No private artifact is Git-tracked.

## Handover gates

Record the final dev SHA, PR, Worker version, live routes and production
immutability check on the Trello card after deployment. A build alone does not
prove deployment. Hosted Cloudflare Builds had a pre-existing authentication
failure; report its state separately from a verified direct deployment.

Gemini's key is installed and retained; one simple response succeeded, while
grounded calls returned quota errors and some attempts returned provider busy.
Kavenegar key/template remain missing. Real SMS login, authenticated user
journeys and visible Push delivery still require provider/device verification.
Do not claim all features are ready or add synthetic reviews to fill results.

The source-reported closed cafe is visibly labeled and excluded from pair
supply. Production publication permission and ownership remain unverified.
This release does not promote or modify main.
