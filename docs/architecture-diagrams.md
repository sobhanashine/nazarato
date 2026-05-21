# Nazarato Architecture Diagrams

Based on the `pages-master.md` documentation, these diagrams visualize the information architecture, user flows, and technical integrations for the platform.

## 1. Information Architecture (Sitemap)
Maps the public, authenticated, and administrative routes, showing how the product is segmented by user role.

```mermaid
graph TD
    %% Global Routes
    Root[/] --> Home[Home /]
    Root --> Search[/search]
    Root --> Categories[/categories]
    Root --> IGShops[/instagram-shops]
    Root --> Reviews[/reviews]
    Root --> Blog[/blog]
    
    %% Business Hierarchies
    Categories --> CatDetail[/[slug]]
    Home --> BizProfile[/company/[slug]]
    Home --> ShopProfile[/shop/[handle]]
    
    BizProfile --> WriteReview[/write-review]
    BizProfile --> Claim[/claim]
    ShopProfile --> WriteReview
    
    %% Auth Group
    Root -.-> AuthGroup((Auth Group))
    AuthGroup --> Login[/login]
    Login --> Verify[/login/verify]
    
    %% User Group
    Root -.-> UserGroup((User Area))
    UserGroup --> Profile[/profile]
    UserGroup --> Saved[/saved]
    UserGroup --> Settings[/settings]
    
    %% Business Group
    Root -.-> BizGroup((Owner Area))
    BizGroup --> ForBiz[/for-business]
    BizGroup --> Dashboard[/business]
    Dashboard --> BizReviews[/business/reviews]
    
    %% Admin Group
    Root -.-> AdminGroup((Admin Area))
    AdminGroup --> Mod[/admin/moderation]
    AdminGroup --> Reports[/admin/reports]
```

## 2. "North-Star" User Journey
Represents the primary goal: a consumer finding a business and writing a high-quality review.

```mermaid
sequenceDiagram
    participant C as Consumer
    participant H as Home/Search
    participant P as Business Profile
    participant A as Auth (OTP)
    participant F as Review Form
    participant DB as Supabase/DB

    C->>H: Search for "Digikala"
    H->>P: Select Business
    P->>C: View Reviews & Rating
    C->>P: Click "Write Review"
    
    alt Not Logged In
        P->>A: Redirect to /login
        A->>C: Request Phone Number
        C->>A: Enter OTP
        A->>P: Redirect back to Profile
    end

    P->>F: Open Review Form
    C->>F: Select Stars, Title, Body
    F->>DB: Submit via Server Action
    DB->>P: Toast Success & Refresh
    P->>C: Review appears in "Recent"
```

## 3. Authentication & Onboarding Flow
Clarifies the login-to-onboarding logic using the phone-based OTP model via Kavenegar.

```mermaid
stateDiagram-v2
    [*] --> PhoneEntry: User visits /login
    PhoneEntry --> OTPVerification: Enter Phone (+98...)
    OTPVerification --> PhoneEntry: Wrong Number / Edit
    OTPVerification --> VerifyOTP: Send OTP via Kavenegar
    
    state VerifyOTP {
        [*] --> CodeInput
        CodeInput --> Success: Valid Code
        CodeInput --> Error: Invalid/Expired
        Error --> CodeInput: Retry
    }
    
    VerifyOTP --> CheckUser: Success
    CheckUser --> Profile: Existing User
    CheckUser --> Onboarding: New User
    Onboarding --> Profile: Set Display Name
    Profile --> [*]
```

## 4. Business Owner Lifecycle
Visualizing how a business goes from "Unclaimed" to "Managed" by an owner.

```mermaid
graph LR
    U[Unclaimed Profile] --> C{Claim Flow}
    C --> P[Proof of Association]
    P --> M[Admin Moderation]
    
    M -- Rejected --> U
    M -- Approved --> O[Owner Dashboard]
    
    O --> R[Review Inbox]
    O --> E[Edit Profile]
    R --> Resp[Respond to Review]
    E --> V[Verified Badge on Public Page]
```

## 5. Technical Architecture: Supabase + Kavenegar OTP Flow
Details the backend interaction for the passwordless phone authentication.

```mermaid
sequenceDiagram
    participant U as User (Next.js Client)
    participant SA as Next.js Server Actions
    participant K as Kavenegar API
    participant S as Supabase Auth (GoTrue)
    participant DB as Supabase Postgres

    U->>SA: Submit Phone Number (/api/auth/otp/start)
    SA->>S: Sign In With OTP (Phone)
    Note over SA,S: Supabase generates OTP & handles rate limiting
    S-->>SA: Returns Temporary Session/Status
    SA->>K: Send SMS Template (Phone, OTP Code)
    K-->>SA: SMS Queued Success
    SA-->>U: Redirect to /login/verify

    U->>SA: Submit 6-digit Code (/api/auth/otp/verify)
    SA->>S: Verify OTP (Phone, Code)
    
    alt Invalid Code
        S-->>SA: Error (Invalid/Expired)
        SA-->>U: Show Inline Error
    else Valid Code
        S->>DB: Trigger: Create User Record (if new)
        S-->>SA: Returns JWT Auth Token
        SA->>SA: Set HTTP-Only Cookie
        SA-->>U: Redirect to Dashboard / Return URL
    end
```
