# IRONSCOUT — Tactical Intelligence Platform

**Competitive intelligence briefs for field sales reps. In under 60 seconds. On their phone.**

IRONSCOUT is a two-tool sales intelligence platform built for field reps at small-to-mid-size industrial manufacturing companies (50–500 employees). It eliminates the "going in blind" problem by generating a structured, scannable brief from any public company website — before you walk through the door.

---

## The Problem It Solves

Field sales reps at small manufacturers rarely have access to CRM tools, research analysts, or pre-call prep support. They walk into first meetings either blind or with generic research that doesn't fit on a phone screen. IRONSCOUT gives them a structured brief — product overview, leadership, operational signals, strategic implications — generated in under 60 seconds from public data.

---

## Platform Overview

| Tool | What It Answers |
|------|----------------|
| **Tool 1 — Intelligence Brief Generator** | *"Tell me about this company I'm about to visit."* |
| **Tool 2 — SCOUT MATCH** *(Phase 3, spec complete)* | *"Which companies near me should I be visiting?"* |

---

## Current Status

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 1 | Single-file HTML tool, Claude API integration | ✅ Complete |
| Phase 2 | Express backend, Puppeteer scraping, auth, SQLite history | ✅ Complete |
| Phase 3 | SCOUT MATCH — geolocation prospect engine | 📋 Specified |
| Phase 4 | CRM integration, mobile PWA, team accounts | 🔮 Future |

---

## What's Built (Phase 2)

### Backend
- **Express.js** server with rate limiting (20 requests / 15 min per IP)
- **Anthropic Claude API** called server-side — API key never exposed to the client
- **Puppeteer** headless browser scraping of public company websites
- **SQLite** via `better-sqlite3` — persists briefs with WAL mode for performance
- **JWT authentication** stored in `httpOnly` cookies (bcrypt passwords, 12 salt rounds)
- **Brief history** — last 50 briefs per user, auto-pruned

### API Routes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, receive JWT cookie |
| POST | `/api/auth/logout` | — | Clear session |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/brief` | ✅ | Generate a brief (URL or pasted text) |
| GET | `/api/briefs` | ✅ | Get brief history (last 50) |
| DELETE | `/api/briefs/:id` | ✅ | Delete a brief |
| POST | `/api/export` | ✅ | Download brief as PDF |

### Brief Output — 7 Sections
Every brief follows this fixed structure, assembled from live scraping and Claude analysis:

1. **Product Overview** — what they sell, to whom, in 1–2 sentences
2. **Top Products / Services** — up to 5 bullets
3. **Mission & Values** — verbatim from site, max 3 sentences
4. **Philanthropy & Community** — up to 3 items with source links
5. **Senior Leadership** — name and title
6. **Operational Signals & Pain Points** — multi-source intelligence
7. **Strategic Implications** — 3 actionable insights for the rep

Each data point is labeled: `SELF-REPORTED`, `EXTERNALLY VERIFIED`, or `AI ANALYSIS`. Every brief carries a confidence flag: `HIGH / MEDIUM / LOW`.

### Frontend
- Mobile-first HUD/steel UI theme — designed to be read one-handed in a parking lot
- Animated SVG logo (gear, compass rose, lightning bolt strike on load)
- Auth modal (login / register) with JWT cookie session
- Brief history panel with re-open and delete
- PDF export
- Thin input detection — prompts for more context before generating a low-confidence brief

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — no framework |
| Backend | Node.js 18+ / Express.js |
| AI Engine | Anthropic Claude (`claude-sonnet-4-6`) |
| Web Scraping | Puppeteer (headless Chrome, public pages only) |
| Database | SQLite (`better-sqlite3`) → PostgreSQL in production |
| Auth | bcrypt + JWT in httpOnly cookies |
| PDF Export | Puppeteer print-to-PDF |
| Hosting Target | Railway (backend) + Vercel (frontend) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Setup

```bash
# Clone the repo
git clone https://github.com/byronjames100/competitive-intel-tool.git
cd competitive-intel-tool

# Install dependencies
npm install

# Configure environment
cp env.example .env
# Edit .env and add your ANTHROPIC_API_KEY and JWT_SECRET
```

### Generate a JWT secret
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Run locally
```bash
npm run dev
# Server starts at http://localhost:3000
```

---

## Environment Variables

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
JWT_SECRET=your-generated-secret-here
DATABASE_URL=./ironscout.db
PORT=3000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

---

## Project Structure

```
ironscout/
├── server/
│   ├── index.js              # Express entry point
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/*
│   │   ├── brief.js          # POST /api/brief
│   │   ├── briefs.js         # GET/DELETE /api/briefs
│   │   └── export.js         # POST /api/export
│   ├── services/
│   │   ├── claude.js         # Anthropic API wrapper + system prompt
│   │   └── scraper.js        # Puppeteer web scraper
│   ├── middleware/
│   │   └── requireAuth.js    # JWT auth guard
│   └── db/
│       └── index.js          # SQLite schema + connection
├── client/
│   └── index.html            # Full frontend (single file)
├── env.example
└── package.json
```

---

## Phase 3 — SCOUT MATCH *(Specified, not yet built)*

SCOUT MATCH answers the question reps face before any meeting: *"Who in my territory should I even be talking to?"*

The tool takes the rep's own company profile — products, capabilities, service area — generates an Ideal Customer Profile using Claude, queries public business data sources for nearby companies, scores each for fit (0–100), and displays results on an interactive map. One tap on any match launches Tool 1 for a full brief.

**Match score bands:**
- 80–100: Strong Match — high priority
- 60–79: Good Match — worth a visit
- 40–59: Possible Match — lower priority
- 0–39: Filtered out by default

See the master design document for full Phase 3 specification.

---

## Design Principles

- **Bottom Line Up Front** — most actionable info always comes first
- **Mobile first** — every output must be readable one-handed on a phone screen
- **No hallucination** — `"Not confirmed in available data"` always beats a guess
- **Source labeling** — reps always know how confident to be in what they're reading
- **Thin input gate** — never generate a low-quality brief without warning the rep first

---

## Security Notes

- API key is server-side only — never in client code
- Passwords hashed with bcrypt (12 salt rounds)
- JWT stored in `httpOnly` + `SameSite=Strict` cookies
- Rate limited: 20 brief requests per IP per 15 minutes
- Parameterized SQL throughout — no string concatenation in queries
- `.env` is gitignored — never commit real credentials

---

## Disclaimer

Insights are AI-generated from public data and may contain errors. Verify all information before use. Not business, financial, or legal advice.

---

## Course Context

**BUS670 — Strategic AI for Modern Business, Spring 2026**
Byron Enrico & Jake Slagle
