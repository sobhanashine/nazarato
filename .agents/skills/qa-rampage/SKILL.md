---
name: qa-rampage
description: |
  Full QA pass before shipping. Use when the user says "qa", "qa-rampage",
  "/qa-rampage", "test everything", "qa this", or wants a thorough
  pre-release check. Runs the automated gauntlet (typecheck, lint, tests,
  production build), then drives the app in a real browser to exercise
  every page state, mobile/RTL responsiveness, and the accessibility
  checklist. Produces ONE combined pass/fail report.
---

# QA Rampage — full pre-ship QA pass

A two-stage QA blitz: automated checks first (fast, catches the obvious),
then a browser walk-through (catches what a type system can't). Ends with a
single combined report.

**Scope:** by default, QA only the **routes changed on this branch**
(`git diff --name-only main...`). Do a full-site sweep only when the user
asks for it — a solo founder doesn't need every page re-checked every time.

---

## Stage 1 — Automated checks

Run all four. Capture every failure with its output — do not stop at the
first one.

| Check | Command | Notes |
|-------|---------|-------|
| Typecheck | `npx tsc --noEmit` | `tsconfig.json` has `strict: true`. Zero errors expected. |
| Lint | `npm run lint` | ESLint 9 + `eslint-config-next`. |
| Tests | `npx playwright test` | Only if test files exist (`*.test.ts(x)` or a `tests/` dir). If none, report **"no tests configured — skipped"** — do NOT fail the run for this. |
| Build | `npm run build` | Production build. A passing dev server is not a passing build. |

If Stage 1 has blocking failures (typecheck/build), report them and ask
whether to continue to Stage 2 or stop and fix first.

---

## Stage 2 — Browser blitz

Start the app (`npm run dev`) and drive it with the Playwright MCP tools.
For **each route in scope**:

### Page states — `pages-master.md` §5.3

Verify all four are handled (or explicitly N/A):

- **Loading** — skeleton blocks reserve final dimensions (no layout shift).
- **Empty** — friendly Persian copy + a primary action out of the empty state.
- **Error** — non-blame copy + retry.
- **Auth-gated** — restricted routes redirect with `?next=`, never render a
  bare "please log in".

### Responsiveness & RTL

- Resize to **mobile (~390px)** and **desktop (~1280px)**.
- App is RTL Farsi (`dir="rtl"`) — confirm layout mirrors correctly, tab
  order matches RTL visual order, and there is **no horizontal scroll**.
- Mobile: bottom `MobileTabBar` and top `MobileMenu` behave.

### Accessibility — `pages-master.md` §5.4

- [ ] Text contrast ≥ 4.5:1 (mint-on-dark-glass is the usual offender).
- [ ] Every icon-only button has a Persian `aria-label`.
- [ ] Min touch target 44×44 (FAB, tab-bar items, star selector).
- [ ] No info conveyed by color alone (rating shows a numeric value too).
- [ ] Forms: visible labels, errors near the field, `prefers-reduced-motion`
      respected.

Take screenshots of anything that looks wrong.

---

## Stage 3 — Combined report

One report, both stages together:

```
## QA Rampage — <branch> — <date>

AUTOMATED
  typecheck  ✅ / ❌  <detail>
  lint       ✅ / ❌  <detail>
  tests      ✅ / ❌ / skipped
  build      ✅ / ❌  <detail>

BROWSER  (routes: <list>)
  <route> — states ✅ / responsive ✅ / a11y ❌ <detail>

FINDINGS
  🔴 Blocking — <issue> — <file:line if known>
  🟡 Polish   — <issue> — <file:line if known>
```

- Group findings into **🔴 blocking** (breaks a user flow, fails a check)
  vs **🟡 polish** (cosmetic, nice-to-have).
- Reference `file:line` wherever the cause is locatable.
- **Do not auto-fix.** Report first. Fix only if the user asks — then
  re-run the affected check to confirm.
