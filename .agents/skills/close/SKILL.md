---
name: close
description: |
  End-of-session handoff. Use when the user says "close", "/close", "wrap
  up", "end the session", "I'm done for now", or is otherwise stopping work.
  Summarizes what changed this session, persists durable facts to project
  memory, and lists unfinished threads + next steps so the next session
  resumes fast. It is a HANDOFF, not a ship step — it does not commit,
  build, push, or open PRs.
---

# Close — end-of-session handoff

When work stops, context evaporates. This skill captures it before it does:
what changed, what was decided, what is still open. Run it at the end of a
working session so the next one starts warm instead of cold.

Three phases: **summarize → persist → hand off.**

---

## Phase 1 — Summarize the session

1. Run `git status` and `git diff --stat` to see what changed since the
   session started. List files **created** and **modified**.
2. Recap, factually and briefly:
   - What was built or fixed.
   - Decisions made and the reasoning (especially anything that settled an
     open question in `docs/pages-master.md` §7 or `docs/PROJECT.md`).
   - Approaches tried and abandoned — so they aren't re-attempted.
3. No spin. If something is half-done or broken, say so plainly.

---

## Phase 2 — Persist durable facts to memory

Project memory lives in the `memory/` directory with a `MEMORY.md` index.
For each thing learned this session, decide if it is **durable** — useful in
a *future* session, not just this one.

- **Save** — project goals/constraints, settled decisions, user preferences,
  workflow feedback, external references (tickets, dashboards, URLs).
- **Don't save** — anything the repo already records (code structure, git
  history, what a file does, things in `CLAUDE.md` / `AGENTS.md` / the
  `docs/`). If it can be re-derived by reading the code, it is not a memory.

For each memory worth keeping:
1. Check `MEMORY.md` for an existing file that already covers it — **update
   that file** rather than creating a duplicate.
2. Otherwise write one file per fact with the standard frontmatter
   (`name`, `description`, `metadata.type` of `user` | `feedback` |
   `project` | `reference`). For `feedback`/`project`, include **Why:** and
   **How to apply:** lines. Convert relative dates to absolute.
3. Add a one-line pointer to `MEMORY.md`: `- [Title](file.md) — hook`.
4. Delete any memory this session proved wrong.

---

## Phase 3 — Hand off

Output a clean handoff block the next session can act on immediately:

```
## Session handoff — <date>

CHANGED
- <file> — <one line>

DECIDED
- <decision> — <why>

OPEN / IN PROGRESS
- <thread> — <state, what's blocking>

NEXT STEPS (ordered)
1. <concrete action>
2. ...
```

- **Open / in progress** — anything started but not finished, plus decisions
  still unresolved.
- **Next steps** — concrete and ordered, so the next session can start on
  step 1 without re-planning.

---

## Boundaries

- This skill does **not** commit, push, build, or open PRs. If the user
  wants to commit, that is the `commit-style` skill; to ship, run checks
  first with `qa-rampage`.
- Keep the whole handoff tight — it is a map, not a transcript.
