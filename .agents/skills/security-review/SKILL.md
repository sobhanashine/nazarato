---
name: security-review
description: |
  Use this skill whenever the user touches authentication, sessions, cookies,
  password handling, file uploads, API route handlers, server actions, database
  queries, or anything accepting user input — even if the user does not
  explicitly mention security. Reviews for SQL injection, XSS, CSRF, exposed
  secrets, broken access control, missing input validation, and unsafe
  deserialization. Tailored to a Next.js 16 App Router + React 19 stack.
---

# Security Review

Run a focused security pass on the diff or files in scope. Report findings as a
short list grouped by severity (critical / high / medium / low). Do not fix
silently — propose the fix and wait for confirmation unless the issue is a
typo-level one-liner.

## Always check

- **Input validation** — every route handler / server action validates body,
  params, and search params at the boundary. No raw `request.json()` flowing
  into business logic.
- **Authn/authz** — every protected route checks the session AND verifies the
  authenticated user is allowed to touch the resource (object-level check, not
  just "logged in").
- **SQL / query construction** — parameterised queries only. Flag any string
  interpolation into a query.
- **Secrets** — no API keys, tokens, or DB URLs in source. `.env*` not
  committed. `NEXT_PUBLIC_*` only for values that are truly public.
- **XSS** — no `dangerouslySetInnerHTML` without sanitisation. User-controlled
  content rendered through React's default escaping.
- **CSRF** — state-changing requests use POST + same-site cookies or explicit
  CSRF tokens. Server actions are fine by default; raw route handlers need a
  check.
- **File uploads** — content-type validation, size limits, never trust the
  filename, store outside web root or behind a signed URL.
- **Open redirects** — any redirect target derived from user input is
  allow-listed.
- **Error responses** — no stack traces or internal error messages leaked to
  clients in production.

## Output format

```
CRITICAL
- <file:line> — <one-line issue> — <one-line fix>

HIGH
- ...

(omit empty sections)
```

End with one of: `No issues found.` / `N issues to address before shipping.`
