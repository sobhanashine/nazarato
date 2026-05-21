# نظراتو — Page & Flow Diagrams

> Visual companion to [`pages-master.md`](./pages-master.md). All diagrams are Mermaid — they render on GitHub and in most Markdown viewers.
> When `pages-master.md` changes, update the matching diagram here.

Generated: 2026-05-21

---

## 1. Sitemap (information architecture)

Route groups `(auth)` `(user)` `(business)` `(admin)` scope layouts without appearing in the URL.

```mermaid
graph TD
  Root(("نظراتو /"))

  subgraph Discovery["Public · Discovery"]
    Home["/ — Home"]
    Search["/search"]
    Cats["/categories"]
    CatDetail["/categories/[slug]"]
    IG["/instagram-shops"]
    Company["/company/[slug]"]
    CompanyRev["/company/[slug]/reviews"]
    CompanyWrite["/company/[slug]/write-review"]
    CompanyClaim["/company/[slug]/claim"]
    Shop["/shop/[handle]"]
    ShopRev["/shop/[handle]/reviews"]
    ShopWrite["/shop/[handle]/write-review"]
    Reviews["/reviews"]
    Write["/write-review"]
  end

  subgraph Content["Public · Content & Marketing"]
    Blog["/blog"]
    BlogPost["/blog/[slug]"]
    BlogCat["/blog/category/[slug]"]
    BlogTag["/blog/tag/[slug]"]
    About["/about"]
    Contact["/contact"]
    Help["/help"]
    ForBiz["/for-business"]
  end

  subgraph Auth["(auth) — no chrome"]
    Login["/login"]
    Verify["/login/verify"]
    Signup["/signup"]
  end

  subgraph User["(user) — auth required"]
    Profile["/profile"]
    ProfileRev["/profile/reviews"]
    ProfileEdit["/profile/edit"]
    Saved["/saved"]
    Notif["/notifications"]
    Settings["/settings"]
    SetSec["/settings/security"]
    SetNotif["/settings/notifications"]
    SetPriv["/settings/privacy"]
  end

  subgraph Business["(business) — owner role"]
    BizDash["/business"]
    BizRev["/business/reviews"]
    BizProfile["/business/profile"]
    BizInsights["/business/insights"]
    BizTeam["/business/team"]
    BizBilling["/business/billing"]
  end

  subgraph Admin["(admin) — admin role"]
    AdminHome["/admin"]
    AdminMod["/admin/moderation"]
    AdminReports["/admin/reports"]
    AdminBiz["/admin/businesses"]
    AdminUsers["/admin/users"]
  end

  subgraph Misc["Public profiles, legal & system"]
    Users["/users/[username]"]
    Terms["/terms"]
    Privacy["/privacy"]
    Cookies["/cookies"]
    NotFound["not-found.tsx · 404"]
    Error["error.tsx · 500"]
    Loading["loading.tsx · skeleton"]
  end

  Root --> Discovery
  Root --> Content
  Root --> Auth
  Root --> User
  Root --> Business
  Root --> Admin
  Root --> Misc

  Cats --> CatDetail
  Company --> CompanyRev
  Company --> CompanyWrite
  Company --> CompanyClaim
  Shop --> ShopRev
  Shop --> ShopWrite
  Blog --> BlogPost
  Blog --> BlogCat
  Blog --> BlogTag
  Login --> Verify
  Profile --> ProfileRev
  Profile --> ProfileEdit
  Settings --> SetSec
  Settings --> SetNotif
  Settings --> SetPriv
  BizDash --> BizRev
  BizDash --> BizProfile
  BizDash --> BizInsights
  BizDash --> BizTeam
  BizDash --> BizBilling
  AdminHome --> AdminMod
  AdminHome --> AdminReports
  AdminHome --> AdminBiz
  AdminHome --> AdminUsers
```

---

## 2. Audiences → areas of the site

Three audiences share one site. This shows which surfaces each touches.

```mermaid
graph LR
  Consumer["👤 Consumer<br/>(default visitor)"]
  Owner["🏪 Business owner"]
  Admin["🛡️ Admin (internal)"]

  Consumer --> Discovery["Discovery pages<br/>/ · /search · /categories · /company · /shop"]
  Consumer --> WriteFlow["Review flows<br/>/write-review · /company/[slug]/write-review"]
  Consumer --> UserArea["(user) area<br/>/profile · /saved · /settings"]
  Consumer -.login required.-> WriteFlow
  Consumer -.login required.-> UserArea

  Owner --> Marketing["/for-business"]
  Owner --> Claim["/company/[slug]/claim"]
  Owner --> BizArea["(business) dashboard<br/>/business/*"]
  Owner -.also a consumer.-> Discovery

  Admin --> AdminArea["(admin) console<br/>/admin/*"]
```

---

## 3. North-star journey

> North-star action: *a consumer writes a real, useful review about an Iranian business.*

```mermaid
flowchart LR
  A["Land on / (Home)"] --> B["Search via hero"]
  B --> C["/search results"]
  C --> D["Open /company/[slug]"]
  D --> E["Read rating + reviews"]
  E --> F{"Want to write<br/>a review?"}
  F -->|no| X["Bounce / browse more"]
  F -->|yes| G{"Logged in?"}
  G -->|no| H["/login → /login/verify (OTP)"]
  H --> I["/company/[slug]/write-review"]
  G -->|yes| I
  I --> J["Submit → moderation queue"]
  J --> K["/profile/reviews<br/>shows status: در انتظار → منتشر شده"]

  style J fill:#1d3b53,stroke:#5ec4b6,color:#fff
  style K fill:#1d3b53,stroke:#5ec4b6,color:#fff
```

---

## 4. Phone OTP auth flow

```mermaid
sequenceDiagram
  actor U as Visitor
  participant L as /login
  participant API as /api/auth/otp
  participant K as Kavenegar
  participant V as /login/verify
  participant DB as Supabase

  U->>L: enter phone (+98) + accept terms
  L->>API: POST /otp/start
  API->>K: send SMS code
  K-->>U: SMS with 6-digit code
  API-->>L: ok → redirect
  L->>V: /login/verify?phone=...&next=...
  U->>V: enter 6-digit code (auto-submit)
  V->>API: POST /otp/verify
  API->>DB: validate code, upsert user
  DB-->>API: user record
  API-->>V: set HTTP-only JWT cookie
  V-->>U: redirect to ?next or /
  Note over U,DB: First login → one-time onboarding step collects display name
```

---

## 5. Write-review flow (auth gate)

```mermaid
flowchart TD
  Start["User wants to write a review"] --> Entry{"Business<br/>pre-selected?"}
  Entry -->|no| Universal["/write-review<br/>search & pick a business"]
  Universal --> NotFound{"Found it?"}
  NotFound -->|no| Suggest["معرفی‌اش کن → submit new business"]
  NotFound -->|yes| Specific
  Entry -->|yes| Specific["/company/[slug]/write-review"]

  Specific --> Gate{"Authenticated?"}
  Gate -->|no| Redirect["redirect /login?next=..."]
  Redirect --> Specific
  Gate -->|yes| Form["Form: rating → title → body → (photos) → date"]
  Form --> Validate{"Boundary<br/>validation passes?"}
  Validate -->|no| Inline["Show inline errors"]
  Inline --> Form
  Validate -->|yes| Submit["Submit → moderation queue"]
  Submit --> Done["Toast + redirect to /company/[slug]/reviews"]
```

---

## 6. Review lifecycle (moderation states)

```mermaid
stateDiagram-v2
  [*] --> Pending: consumer submits review
  Pending --> Published: admin approves (/admin/moderation)
  Pending --> Rejected: admin rejects
  Published --> Flagged: user/owner reports it
  Flagged --> Published: admin dismisses report
  Flagged --> Rejected: admin removes
  Published --> Edited: author edits (/profile/reviews)
  Edited --> Pending: re-enters queue
  Published --> Deleted: author deletes
  Rejected --> [*]
  Deleted --> [*]
```

---

## 7. Claim-business flow

```mermaid
flowchart LR
  A["Owner sees unclaimed banner<br/>on /company/[slug]"] --> B["/company/[slug]/claim"]
  B --> C["Identity — phone OTP<br/>(already authenticated)"]
  C --> D["Proof of association<br/>work email @domain OR upload doc"]
  D --> E["Admin moderation queue<br/>/admin/businesses"]
  E --> F{"Approved?"}
  F -->|yes| G["SMS/email notice<br/>→ owner unlocks /business/*"]
  F -->|no| H["Rejected notice<br/>→ owner can resubmit"]
```

---

## 8. Route-group access guards

```mermaid
flowchart TD
  Req["Incoming request"] --> Grp{"Which route group?"}
  Grp -->|public| Pub["Render — Header + Footer + MobileTabBar"]
  Grp -->|"(auth)"| AuthL["Render centered card — no chrome"]
  Grp -->|"(user)"| UG{"Authenticated?"}
  Grp -->|"(business)"| BG{"role === owner?"}
  Grp -->|"(admin)"| AG{"role === admin?"}

  UG -->|yes| UserShell["UserShell + sidebar"]
  UG -->|no| R1["redirect /login?next=..."]
  BG -->|yes| OwnerShell["OwnerShell + sidebar"]
  BG -->|no| R2["redirect (not an owner)"]
  AG -->|yes| AdminShell["AdminShell — gated by Supabase RLS too"]
  AG -->|no| R3["redirect / 404"]
```

---

## 9. Shared-component reuse map

> Extract `<ReviewCard />`, `<IgShopCard />`, `<BusinessCard />` **before** building search/profile/reviews pages — otherwise each page duplicates ~150 lines of JSX.

```mermaid
graph LR
  subgraph Components["Reusable cards / blocks"]
    BC["BusinessCard"]
    IGC["IgShopCard"]
    RC["ReviewCard"]
    RS["RatingStars"]
    RB["RatingBars"]
    PC["PostCard"]
  end

  BC --> P1["/search"]
  BC --> P2["/categories/[slug]"]
  BC --> P3["/saved"]
  BC --> P4["/admin/businesses"]

  IGC --> P5["/instagram-shops"]
  IGC --> P6["/shop/[handle]"]
  IGC --> P3

  RC --> P7["/reviews"]
  RC --> P8["/company/[slug]/reviews"]
  RC --> P9["/profile/reviews"]
  RC --> P10["/users/[username]"]

  RS --> RC
  RS --> BC
  RB --> P11["/company/[slug] — rating breakdown"]

  PC --> P12["/blog"]
  PC --> P13["/blog/category/[slug]"]
  PC --> P14["/blog/tag/[slug]"]
```

---

## 10. Build order (phases)

```mermaid
timeline
  title Build order — minimum loop first, then expand
  section Phase 0 · Done ✅
    Chrome & content : Home : Blog list : Blog post : Header/Footer/TabBar
  section Phase 1 · MVP loop (1–2 wk)
    Trust & legal : /about : /contact : /terms : /privacy
    Auth : /login : /login/verify
    Consumer area : /profile : /profile/reviews
    Shared components : BusinessCard : ReviewCard : IgShopCard
    Centerpiece : /company/[slug] : /company/[slug]/write-review
    Discovery : /search
    Moderation : /admin/moderation
  section Phase 2 · v1.0 (2–4 wk)
    Categories : /categories : /categories/[slug]
    Instagram : /instagram-shops : /shop/[handle]
    Feeds & saves : /reviews : /saved
    Account : /settings : /users/[username]
    Owner side : /for-business : /company/[slug]/claim : /business : /business/reviews : /business/profile
    Blog extras : /blog/category : /blog/tag : related posts
  section Phase 3 · v2+ (on traction)
    Deferred : /notifications : /business/insights : /business/team : /business/billing
    Full admin : /admin/reports : /admin/businesses : /admin/users
    Big features : compare : follow users : Q&A : review photos
```

---

## 11. Page status overview

```mermaid
pie showData
  title Page status across the catalog
  "✅ Built" : 6
  "📋 Planned" : 33
```

> Built: `/`, `/blog`, `/blog/[slug]`, `/about`, `/contact`, plus core chrome. Everything else in §2 of the master doc is 📋 planned.
