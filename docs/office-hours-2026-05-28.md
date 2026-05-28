# Office Hours — Nazarato Pivot Diagnostic

**Date:** 2026-05-28
**Mode:** Startup (YC-style diagnostic)
**Status:** APPROVED
**Source design doc:** `~/.gstack/projects/sobhanashine-nazarato/sobhan-main-design-20260528-025948.md`

---

## TL;DR

You came in asking "how do I get my product to final version."
You leave with: **stop trying to finish v1, pivot the framing from "Yelp for Iran" to "trust layer for Iranian Instagram shops," ship a focused wedge in 3 weeks, layer a Telegram bot in week 4–5, and do one week of field research before writing any new code.**

---

## The Diagnostic (what happened in this session)

### Q1 — Demand reality
Honest answer: **none yet.** No paying users, no waitlist asking when it ships. Pre-launch with substantial code and zero validated demand. This is the most common pre-launch failure mode — finishing v1 of a product nobody has confirmed they need.

### Q2 — Status quo
Iranians vetting an Instagram shop today use **6 fragmented platforms**: Instagram comments + DMs + Telegram channels + Twitter/X + ad-hoc sites + word of mouth. The pain is the fragmentation, not the absence of reviews.

### Q3 — Desperate specificity
The real story, in your own words:

> "some friends... they buy a thing in Instagram online shops and after that they had a bad memory of the purchase, some are not happy with size of they send to, size is not the size that it requested, some are not happy with the online shops DM answering, some are robbed they pay money and never received the product."

That last clause — *"some are robbed, they pay money and never received the product"* — is fraud, not UX. That's the wedge.

### Q4 — Narrowest wedge (after pushback)
First answer: "stick with the full Yelp-for-Iran platform vision."
After pushback: **"Instagram shop trust + scam lookup."**

You updated when the evidence pointed somewhere else. That's a founder signal. Most people defend the original answer no matter what.

---

## The Pivot

| | Before (what you came in with) | After (what you leave with) |
|---|---|---|
| **Frame** | "Yelp for Iran" — general business reviews | "Trust layer for Iranian Instagram shops" — fraud + reputation lookup |
| **Goal** | "Ship final version of v1" | "Ship the wedge, test demand in 4 weeks" |
| **Primary user** | Vague (all Iranians who want reviews) | Specific (Iranian women 20–40 who shop from Instagram weekly) |
| **Acute pain** | Diffuse ("find a good business") | Acute & financial ("I lost money to a scam shop") |
| **Wedge product** | Full platform with all business types | Free `/ig/[handle]` reputation card. No login. Shareable URL. |
| **Monetization** | Unclear | Verified-badge subscription for honest shops, month 2+ |
| **Distribution** | Generic ads / SEO | Virality through Telegram + X + DM forwards |
| **Competition** | Snappfood + Digikala + Google + Instagram (lose on all 4) | Nobody owns Iran-IG-shop trust today |
| **Codebase verdict** | Sunk cost concern | Re-aim 80% of it, throw nothing away |

---

## The 6 Premises (all confirmed)

1. Iranian Instagram commerce has an **acute fraud + trust problem** — not "nice to have," but "costs real users real money."
2. **No existing player owns this space** in Iran today.
3. The wedge is a **free consumer trust lookup** — type a handle, get a reputation card. Web-based, no login, shareable URL.
4. **Monetization is shop-side later** (verified badges, claimed pages), not consumer-side.
5. **Distribution is virality + SEO**, not paid ads. Each report and each verified page is a shareable artifact.
6. The existing nazarato codebase is **an asset, not a sunk cost.** Re-aim it; don't throw it away.

---

## Approaches Considered

### Approach A — Re-skin (Minimal Viable) — RECOMMENDED
Repoint existing `/shop`, `/write-review`, `/search` routes at Instagram handles. Add `/ig/[handle]` reputation card. Add 30-second no-login scam-report form. Seed 100 known scam handles from public Telegram channels.
- **Effort:** 2–3 weeks. **Risk:** Low. Reuses 80% of existing code.

### Approach B — Telegram-bot first (Creative)
Lead with `@nazarato_bot`: send a handle, get a reputation card. Web app exists as the public archive.
- **Effort:** 4–6 weeks. **Risk:** Med. Telegram platform dependency.

### Approach C — Full two-sided launch
Ship free consumer lookup AND paid verified-badge program in v1.
- **Effort:** 6–10 weeks. **Risk:** High (chicken-and-egg).

### CHOSEN: Hybrid — A now (weeks 1–3), then B as a launch channel (week 4–5)
- **A first** because the web URL is the artifact that flows through every Telegram and Twitter share. The bot needs somewhere to point.
- **B second** because once data exists on the web, wrapping it in a Telegram bot is ~1 week of work that 10x's distribution velocity.
- If A's web launch doesn't see organic signal in 2–3 weeks, **pivot or kill before investing in the bot.**

---

## Success Criteria (4 weeks after Approach A launch)

**Continue (build Approach B)** if any TWO of these are true:
- 500+ unique handle lookups in week 4 (organic, no paid traffic)
- 20+ user-submitted scam reports with evidence
- 5+ unsolicited shares of reputation card URLs in public Telegram or X
- Any single piece of unsolicited press, viral tweet, or Telegram-channel mention

**Pivot or kill** if none happen. The hypothesis is then disproven cheaply (3 weeks lost, not 4 months).

> "Users on the site" is not the metric. **Behavior that proves the trust problem is real and people will use the tool** is the metric.

---

## Open Questions to Resolve Before Launch

- **Legal exposure.** Iran has weak/unpredictable laws on user-generated defamation. A "reported scammer" badge will trigger complaints. Need: report-with-evidence requirement (screenshot or transaction proof) from day 1, and a "shop owner can respond" flow.
- **Seed data sourcing.** Identify top 3–5 public Telegram scam-warning channels in Iran. Don't ingest names without evidence — bad-faith reports will be a problem.
- **Handle normalization.** Instagram handles can be claimed/dropped/renamed. Snapshot bio + display name at first lookup, re-verify weekly. Out of scope for week 1.
- **Auth for shop claims (later, month 2).** Simplest: "post a code in your Instagram bio for 5 minutes."
- **Persian SEO baseline.** What does `nazarato.com` currently rank for? Quick check needed.

---

## Distribution Plan

- **Existing Vercel deploy of nazarato.com.** No new infra for Approach A.
- **SEO:** Persian shop-handle queries (`بررسی [handle]`, `[handle] کلاهبردار`). One indexable page per indexed handle. Wide-open territory.
- **Seed virality:** Personally send 20 reputation card URLs into Telegram group chats where the scam-report behavior already happens. Watch for re-shares.
- **PWA install prompt** (already built) — for the 1–2% who become repeat users.
- **Telegram bot (week 4):** Same Supabase backend, bot framework on top.

CI/CD already set up (Next.js + Vercel). No new work.

---

## Dependencies

- **Supabase schema migration:** Rename/repurpose `shops` to use Instagram handle as primary key. Add `scam_reports` table with evidence column.
- **Persian copy review:** All new UX strings need a native speaker pass (you).
- **Legal disclaimer:** "This is community-reported, not verified by us" — before launch.
- **No new third-party services.** Voice dictation (Gemini) and push (VAPID) already in place.

---

## THE ASSIGNMENT — Before writing one line of new code

Do these three things in the next 7 days:

1. **Talk to 5 specific Iranians who have been scammed on Instagram in the last 6 months.** Voice or video, not chat. 15 minutes each. Ask:
   - "Walk me through the day you realized you got scammed."
   - "What did you do next? Who did you tell? Where did you complain?"
   - "What would have stopped you from buying from that shop?"
   - **Do NOT pitch your product. Do NOT show mockups. Just listen.**
2. **Write down the exact words they use to describe the pain.** Those words become your Persian landing-page headline. (Your pitch is almost always weaker than the user's complaint.)
3. **Find the 3 most-followed Telegram channels in Iran that share Instagram-scam warnings.** Join them. Read 100 messages. Note: handles mentioned, evidence shown, what makes a report believable.

This is one week of work and zero lines of code. **If after one week you haven't done these three things, do not start building.** Either the problem isn't urgent enough for you to do this legwork (which means it's not urgent enough for users to change behavior), or you'll build blind. Both kill startups.

---

## What I noticed about how you think

- **You answered Q1 honestly with "none yet."** Most founders bullshit the demand question. You didn't. That self-honesty is rare and necessary.
- **Your own words found the wedge.** *"some are robbed, they pay money and never received the product"* — that sentence is more valuable than anything I told you. Your instinct already routed you to a dedicated `/instagram-shops` route in the codebase before this conversation. You knew before you knew.
- **You updated when I pushed back on the "full platform" answer.** Most founders dig in. You looked at the argument and changed your mind. Conviction with epistemic humility is the combination YC selects for.
- **You came in with the wrong frame ("final version") and ended in the right frame (wedge + demand test).** That's the whole job of office hours.

---

## Reading list (opened in your browser)

- **Why Startup Founders Should Launch Companies Sooner Than They Think** (Tyler Bosmeny, 12 min) — direct antidote to "final version" thinking. <https://www.youtube.com/watch?v=Nsx5RDVKZSk>
- **Schlep Blindness** (Paul Graham) — Iranian-Instagram-shop-fraud is a textbook schlep. The best opportunities hide inside problems other people avoid. <https://paulgraham.com/schlep.html>
- **The New Way To Build A Startup** (Garry Tan, 8 min) — the 2026 "20x company" playbook for solo founders with AI leverage. <https://www.youtube.com/watch?v=rWUWfj_PqmM>

---

## Next steps (in order)

1. **This week (no code):** Do The Assignment above.
2. **Next week:** Run `/plan-eng-review` to lock in the Approach A implementation plan (Supabase rename, `/ig/[handle]` route, scam-report flow, seed pipeline).
3. **Week 2–3:** Build Approach A. Launch publicly. Seed 20 URLs into Telegram chats.
4. **Week 4:** Measure against the kill/continue gate. If continue → build Approach B (Telegram bot). If kill → pivot.
