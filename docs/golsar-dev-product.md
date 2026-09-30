# Spec: Golsar data in the existing dev product

Authorized direction: use the prepared dev design and the cleaned Golsar data. Continue on codex/golsar-existing-review-flow.

**Problem.** The founder needs to review the actual Nazarato product with Golsar cafes, using the existing pages and components.

**User action.** Open the existing homepage, search cafes or streets, open a native company profile, inspect its tabs, and write a browser-only experience through the existing global ReviewSheet.

**Data changes.** An opted-in development/loopback server adapter reads the private snapshot and maps candidates into the existing Business/BusinessDetail contracts. Normal production data and authenticated server actions keep their current behavior. Local experiences retain their existing storage keys and are never counted as published customer reviews.

**Failure modes.** Missing/invalid private snapshot gives an empty local catalog, never fixture cafes. Unknown local company IDs return notFound. Storage failure keeps text and shows a recoverable error. Production/non-loopback must never serve a source-only candidate through the adapter.

**Done when.** Home → search → native CompanyProfile works with all 22 cafes, matching dev's design on mobile and desktop; original preview hashes resolve to the native profile; local experience save/edit/delete still works.

## Run and review

Use the existing ignored snapshot at `data/private/golsar-pilot.json`, then:

```sh
NEXT_PUBLIC_SMFLOW_ENABLED=false NAZARATO_LOCAL_PREVIEW=true npm run dev -- --hostname 127.0.0.1 --port 3016
```

Open `http://127.0.0.1:3016/`. Search uses all 22 cafes and 3 result pages, with Persian/Arabic normalization and street matching. The existing native profile shows available contact/address/Plus Code/source details. Browser experiences are separate from published reviews and preserve the earlier versioned keys. Profile bookmarks are stored only in this browser.

## Verified outcome

- 103 unit tests in 16 files pass; this task adds 12 tests for DTO mapping, catalog boundaries and search failure modes. TypeScript and lint of changed source files pass.
- Native Chrome flow passes at 390 and 1280px: homepage/typeahead → search → company profile, street search, 22-cafe pagination, native category search, all profile tabs, bookmark reload/remove, shared review wizard, draft reload/edit/delete, quota failure retaining text, old hash redirects, RTL and no horizontal overflow, browser errors or network writes.
- Production build passes. With the opt-in flag set, production candidate profiles and the old preview still render notFound; root/search do not receive the private catalog. Non-loopback Host does not activate the catalog. Unknown local IDs render notFound. Streaming company pages may return HTTP 200 with Next's explicit notFound marker; checks inspect the rendered result, not just the status code.
- No private snapshot files occur in any of the 53 production build traces. Snapshot and local environment remain Git-ignored. No database records were changed and no Apify run was started.
- Full repository lint has the unchanged dev baseline: 6 errors and 6 warnings in the chat files. This is a separate existing issue.
- This is a local, dev-based feature branch. Publication and actual pilot review collection remain separate delivery steps.
