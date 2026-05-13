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
