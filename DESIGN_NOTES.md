# IRONSCOUT — Design Addenda
Amendments to `IRONSCOUT_Master_Documentation_v2.docx`. Applied in order.

---

## [2026-05-12] — Profile Setup Gating & SCOUT MATCH Access

**Amends:** Document 02, Section 3.2 — User Profile System

**Decision:** Stage 2 profile setup (company info, territory, products) is skippable after account creation.

**Access rules:**
- Profile skipped → Brief Generator fully accessible. SCOUT MATCH locked.
- Profile complete → Both tools unlocked. Auto-profile scrape fires in background on submit.

**UI treatment:** SCOUT MATCH tab is visible but greyed out with one-line label:
> "Complete your company profile to unlock SCOUT MATCH prospect matching."

**Skip link label:** "Skip — use research tool only"

**Rationale:** SCOUT MATCH requires the rep's own company profile (products, capabilities, service area) as the matching lens. Without it, the ICP generation and fit scoring engine have no input to work from. The Brief Generator needs only a URL and has no profile dependency.

---

## [2026-05-12] — Profile Auto-Fill via Website Scrape

**Amends:** Document 02, Section 3.2.2 — Auto-Profile Intelligence

**Decision:** Auto-fill fires on blur of the company URL field during profile setup — not at registration.

**How it works:**
1. Rep enters their company URL and tabs out
2. Frontend fires `POST /api/profile/autofill` async (non-blocking)
3. Server scrapes the URL via Puppeteer, passes content to Claude Haiku
4. Claude returns `{ company_name, industry, company_size, products[] }`
5. Fields pre-populate with green border ("Auto-detected · review before saving")
6. Editing any field removes the auto-detected indicator
7. If scrape fails, Claude falls back to training knowledge about the URL
8. If autofill fails entirely, form stays blank — rep fills manually

**Model used:** `claude-haiku-4-5-20251001` — faster and cheaper than Sonnet for this simple extraction task. 400 token cap.

**Fields auto-detected:** company name (if blank), industry, company size, products list (up to 5)

**Fields never auto-filled:** service area, service radius, target customer — these require rep's own knowledge.

**Only overwrites empty fields** — never clobbers content the rep has already typed.

---

## [2026-05-12] — Phase 2 Build Status

**What is built and committed (as of commit 75fcfbc):**

| Feature | Status |
|---|---|
| Express server + routing | ✅ Complete |
| SQLite with brief history | ✅ Complete |
| Puppeteer web scraping | ✅ Complete |
| Claude API integration (Sonnet) | ✅ Complete |
| PDF export via /api/export | ✅ Complete |
| Email/password auth + JWT cookies | ✅ Complete |
| Brief history (last 50, re-open, delete) | ✅ Complete |
| User profile — DB schema | ✅ Complete |
| User profile — setup UI (Stage 2 overlay) | ✅ Complete |
| User profile — save endpoint | ✅ Complete |
| User profile — auto-fill from company URL | ✅ Complete |
| SCOUT MATCH tab (locked placeholder) | ✅ Complete |
| Vercel deployment config | ✅ Complete |

**What remains for Phase 2:**
- Deploy to Railway (backend) + Vercel (frontend) — vercel.json is in place
- End-to-end browser testing of profile flow

**Phase 3 (SCOUT MATCH) not yet started.**

---

## [2026-05-12] — Phase 3: SCOUT MATCH — Nearby Prospect Discovery

**Feature:** Map-based prospect discovery for field sales reps.
The rep opens SCOUT MATCH, sees a map centered on their location, and gets a ranked list of nearby companies scored against their ICP.

**Requires:** Completed user profile (company, products, service area, target customer).

### 3.1 — Data Source

**Free tier:** Overpass API (OpenStreetMap)
- No API key required
- Zero cost to operate
- Returns business name, address, category
- Lower data completeness in rural/industrial areas — acceptable for MVP

**Pro tier:** Google Places API
- Richer business data including phone, website, review count
- Higher accuracy in industrial corridors
- Charges per call — cost controls required (see Section 3.5)

**Fallback enrichment (Pro):** Apollo.io API
- Adds employee count and revenue estimate to Places results
- Used only when Google Places data is insufficient

### 3.2 — Geolocation

**Primary:** Browser GPS (`navigator.geolocation`)
- Auto-detects rep's current location on page load
- Optimized for mobile PWA — rep is in the field

**Fallback:** Manual zip code or city entry
- Used when GPS is denied or rep wants to scout a different territory
- Always show both options — never GPS-only

### 3.3 — ICP Scoring Engine

Claude reads the rep's saved profile and generates an Ideal Customer Profile. Each nearby company is scored against it.

**Scoring criteria:**

| Criteria | Weight | Notes |
|---|---|---|
| Industry match | 40% | Primary filter — must align with rep's target sector |
| Company size / employee count | 30% | Proxy for deal size potential |
| Target Company Annual Rev Estimate | 20% | Estimated via Apollo; lower confidence on private cos |
| Proximity to rep's location | 10% | Tiebreaker — closer is easier to act on |

**Output:** HIGH / MEDIUM / LOW match score displayed on each result card.
Scoring must be transparent — show the rep why a company scored HIGH.

### 3.4 — Map Display

**Library:** Leaflet.js + OpenStreetMap tiles
- Free, open source, no per-load cost
- Consistent with zero-cost free tier philosophy

**Map behavior:**
- Interactive pins centered on rep's GPS location
- Pin color-coded by ICP score: green = HIGH, yellow = MEDIUM, red = LOW
- Tapping a pin opens a company card with name, address, score, and match rationale
- Company card includes one-tap button: "Run IRONSCOUT Brief on this company"
- List view toggle available for reps who prefer scrolling

**MVP scope:** 25 nearest results max. Filter by industry category. Sort by ICP score descending.

### 3.5 — API Cost Controls (Required Before Pro Launch)

Google Places API charges per call. The following controls are non-negotiable before Pro tier goes live:

**Caching:**
- Cache each location search result for 24 hours server-side on Railway
- Repeat searches within same zip code or GPS radius within 24-hour window serve cached results
- No new API call fired for repeat searches within the cache window

**Call limits:**
- Free tier: 10 Places API calls per user per day (map searches only)
- Pro tier: 50 Places API calls per user per day
- Display remaining searches to rep in UI: "3 of 10 searches used today"

**Radius control:**
- Default search radius: 10 miles
- Rep can expand to 25 miles manually — never auto-expand
- Each manual expansion counts as a new API call

**Spend alerts:**
- Alert Byron + Jake via Railway logs when daily API spend exceeds $5.00

---

## [2026-05-12] — Freemium Tier Structure

**Core principle:** Give Mike enough to win one deal for free. Let the win sell the upgrade.

### TIER 1 — Scout (Free)

Zero operating cost per user on core feature set.

| Feature | Access |
|---|---|
| IRONSCOUT briefs | 3 per month |
| Output sections | 4 of 6 (Product Overview, Top Products, Mission & Values, Senior Leadership) |
| Section 05 — Operational Signals & Pain Points | 🔒 Locked |
| Section 06 — Strategic Implications for Your Sale | 🔒 Locked |
| SCOUT MATCH map | OpenStreetMap, rule-based ICP scoring, 10 mile radius, 10 results |
| Brief history | Expires after 24 hours |
| PDF export | ❌ Not available |
| PWA home screen install | ❌ Not available |
| IRONSCOUT watermark | Applied to all output |

**Why Sections 05 and 06 are locked:**
These are the sections that directly tell Mike how to sell — what pain to probe, how to position his pitch. Locking them creates a natural, honest upgrade trigger. The rep can see the section exists. He just can't read the most important part.

**Estimated operating cost per free user per month:** $0.30–$0.45 (Anthropic API only)

### TIER 2 — Pro ($39/month per rep)

| Feature | Access |
|---|---|
| IRONSCOUT briefs | Unlimited |
| Output sections | All 6 including Operational Signals & Strategic Implications |
| SCOUT MATCH map | Google Places API, AI-powered ICP scoring, 25 mile radius, 25 results |
| Brief history | 90 days saved |
| PDF export | Clean, no watermark |
| PWA home screen install | ✅ Available |
| Priority processing | ✅ Available |

### TIER 3 — Team ($149/month for up to 5 reps)

| Feature | Access |
|---|---|
| Everything in Pro | ✅ |
| Shared brief library | Across the team |
| Custom ICP template | Per territory |
| Manager dashboard | Rep activity and company research visibility |
| CRM export | Salesforce and HubSpot |
| Admin controls | User management included |

### Upsell Trigger Moments

| Trigger Moment | What the Rep Sees |
|---|---|
| Opens brief — sections 5 & 6 locked | "Upgrade to Pro to unlock Operational Signals & Strategic Implications" |
| Tries to download or export | "Export available on Pro — $39/month" |
| Uses 3rd brief of the month | "You've used all 3 free briefs this month. Upgrade for unlimited." |
| Opens map — sees 10 results only | "Pro unlocks 25 results with AI-ranked ICP scoring" |
| Tries to save or revisit a brief | "Brief history available on Pro — briefs expire in 24 hours on free tier" |

### Recommended Build Order

1. Launch Pro only — no free tier yet
2. Give first 10 customers free Pro access in exchange for direct feedback
3. Once Pro is stable, launch Scout free tier as the acquisition funnel
4. Build Team tier when 3 or more companies independently request multi-user access

---

## [2026-05-12] — PWA Mobile Version

**Decision:** IRONSCOUT deploys as a Progressive Web App (PWA) — not a native iOS/Android app.

**Rationale:**
- Fastest path from current HTML prototype to mobile
- No App Store submission or review process
- Rep opens a URL on their phone, taps "Add to Home Screen" — lives on phone like a native app
- Proves the product before investing in native development

**PWA requirements for Pro tier:**
- `manifest.json` with IRONSCOUT name, icon, theme color
- Service worker for offline caching of last-viewed brief
- Install prompt triggered after rep generates their second brief
- Home screen icon: IRONSCOUT compass rose mark

**Native app:** Deferred until PWA has active paying users and validated use patterns.

---

## [2026-05-12] — Deployment Architecture

**Frontend:** Vercel
- `vercel.json` already committed to master branch
- Deploys automatically on every push to master
- Free tier covers early volume (100GB bandwidth)

**Backend:** Railway
- Express server + SQLite + Puppeteer
- API key stored as Railway environment variable — never in code
- Free tier: $5/month credit covers early testing volume
- Upgrade to paid Railway plan when revenue supports it

**Environment variables required on Railway:**
- `ANTHROPIC_API_KEY` — Sonnet for briefs, Haiku for profile autofill
- `JWT_SECRET` — auth token signing
- `GOOGLE_PLACES_API_KEY` — Pro tier map feature only
- `APOLLO_API_KEY` — Pro tier enrichment only (deferred)

**Spend monitoring:**
- Railway log alert when daily Anthropic spend exceeds $5.00
- Railway log alert when daily Google Places spend exceeds $5.00

---

## [2026-05-12] — Phase 4: Future Features (Deferred)

The following features are scoped but deliberately deferred until Phase 3 is live and validated:

| Feature | Tier | Notes |
|---|---|---|
| Custom email draft generator | Pro | Drafts a personalized cold email using the IRONSCOUT brief as context |
| Competitor analysis module | Pro | Analyzes a competitor's positioning vs. rep's company — originally the core concept, repositioned as an add-on |
| Native iOS/Android app | Pro/Team | After PWA proves the use case |
| Salesforce / HubSpot CRM sync | Team | One-click push of brief data to CRM contact record |
| Territory heat map | Team | Visual map of all briefs run by a rep, showing coverage density |
| API access | Enterprise | Allows companies to embed IRONSCOUT briefs into their own sales tools |

**Rule:** No Phase 4 feature gets built until IRONSCOUT has 10 paying Pro customers.

---

*IRONSCOUT — Internal Design Document — Not for external distribution*
