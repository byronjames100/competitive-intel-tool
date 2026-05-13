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
