---
name: Redirect Parameter Validation
description: Sanitize the next query parameter in login flows to prevent open redirect vulnerabilities.
metadata:
  type: project
---
# Redirect Parameter Validation

**Why:**
Passing unvalidated URLs to redirects (e.g. `redirect(searchParams.next)`) exposes the application to open redirect vulnerabilities, allowing attackers to construct malicious URLs that trick users into visiting external phishing sites.

**How to apply:**
Validate all redirect parameters at the boundary. Use `safeNext(value: string)` from `lib/auth/urls.ts` to ensure that any `next` parameter is a relative path starting with a single `/` (and not `//` or `/\`). If validation fails, default the redirect path to `/`.
