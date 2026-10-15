> Historical task 30 spec. The founder explicitly superseded its isolated-only
> database policy and its previous DEV design on 2026-10-15. Follow
> `main-design-dev-spec.md` and `staging-release.md` for the current contract.

# Spec: review the DEV release on staging

Authorized 2026-10-14: deploy the latest changes from this chat to
`https://staging.nazarato.ir` before any promotion to `main`.
The starting application is recovery commit
`f2d0827971de514fb3f82ad6c682eda604d42110` (PR #180).

**Problem.** The user needs a stable browser-accessible DEV environment to
review the recovered product before approving its production release.

**User action.**
1. Open the HTTPS staging subdomain.
2. See an explicit staging label and the latest mobile discovery/Nabz UI.
3. Exercise available flows against isolated staging data.
4. Review the deployed revision and report feedback before main promotion.

**Deployment and data changes.**
- A separate `nazarato-staging` Worker and explicit Wrangler staging routes,
  bindings and secrets; preserve the existing production Worker/domain.
- Promote the verified recovery into `dev`, with no main merge.
- Staging uses its own canonical URL, rejects indexing, and reports staging
  plus the actual Git revision through health checks.
- Require an isolated Supabase target for staging writes. Do not apply SQL,
  fixtures or test mutations to the production database.
- Preserve the existing production-mode authentication and private-source
  guards; this task does not enable development OTP on a public host.

**Failure modes.**
- Provider authentication or domain permission is unavailable: prepare and
  verify local deployment files, then record the exact access dependency.
- Staging database configuration is missing or targets production: reject
  database access and report it clearly rather than silently sharing writes.
- Deployment succeeds but DNS/TLS/route verification fails: do not call the
  staging URL ready until the public hostname is verified.

**Out of scope.** Main promotion, production deployment/database changes,
SMS activation, public source approval, and any other project or board.

**Done when.** The verified DEV revision is served over HTTPS at the staging
hostname, the browser and environment-isolation checks pass, and the user
receives the URL and an accurate account of any remaining product limitations.
