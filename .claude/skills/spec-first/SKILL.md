---
name: spec-first
description: |
  Use this skill at the start of any new feature, any task larger than a
  one-line fix, or any time the user says "let's build X" without details.
  Forces a one-page spec before code is written: problem, user action, data
  changes, failure modes. This is the missing PM.
---

# Spec First

Before writing code for a non-trivial feature, produce a short spec and get
explicit sign-off. No code until the spec is agreed.

## The four questions

1. **Problem** — whose problem is this, and what are they doing today instead?
   (One paragraph. If you can't name a specific user, the feature is
   speculative — flag it.)
2. **User action** — what does the user click / type / see? Walk through the
   happy path in 3–7 steps.
3. **Data changes** — what reads, writes, or schema changes does this require?
   Name the tables/columns/endpoints touched.
4. **Failure modes** — what are the three most likely ways this breaks, and
   what does the user see when it does?

## Output template

```
## Spec: <feature name>

**Problem.** ...

**User action.**
1. ...
2. ...
3. ...

**Data changes.**
- <table/endpoint>: <change>

**Failure modes.**
- <case>: <user-visible behavior> / <handling>

**Out of scope (this iteration).** ...

**Done when.** <one sentence — the demoable outcome>
```

Then ask: "OK to proceed?" Wait for yes. If the user wants to skip the spec,
ask once whether the feature is small enough to be a one-line fix; if not,
proceed but note `[no-spec]` in the commit.
