# Fast Grad Academy — Project Bible

> **What this document is:** The single source of truth for any agent or human operating this business. If you're picking this project up cold, start here. Everything you need to understand the product, architecture, history, and current state is in this file or linked from it.

> **Last updated:** 2026-06-23 by Claude (Cowork session)
> **Owner:** John Zheng (johnzhengmn@gmail.com)

---

## 1. What Is Fast Grad Academy?

Fast Grad Academy is a $197 digital course that teaches students how to graduate college in ~1 year using credit-by-exam (CLEP, DSST), online providers (Sophia, Study.com, StraighterLine, Saylor), PSEO/dual enrollment, and strategic degree planning. The founder, John Zheng, used this system himself — he graduated at 20, saved $85,000+, and got a 3-year career head start.

**Product:** 12-chapter online guide + 12 downloadable Excel tools + interactive tracker + calculators
**Price:** $197 one-time payment
**Domain:** https://fastgradacademy.com
**Hosting:** Vercel (auto-deploys from GitHub `main` branch)
**Repo:** https://github.com/thejohnzheng/fast-grad-academy

---

## 2. Architecture

### Tech Stack
- **Frontend:** Static HTML/CSS/JS (no framework). `course.css` is the shared stylesheet with CSS custom properties (design tokens).
- **Hosting:** Vercel. Config in `vercel.json` (rewrites for clean URLs, caching headers, serverless function config).
- **Backend:** 3 Vercel serverless functions in `/api/`:
  - `checkout.js` — Creates Stripe Checkout sessions
  - `webhook.js` — Handles Stripe `checkout.session.completed` → generates access code → stores in Supabase → sends email via Resend
  - `verify.js` — Validates email + access code pairs against Supabase
- **Database:** Supabase (PostgreSQL). Table: `access_codes` (email, access_code, stripe_payment_id, stripe_customer_id, created_at)
- **Payments:** Stripe (account `acct_1S0oQsPUXG3LAWX2`)
- **Email:** Resend (logged in via GitHub `thejohnzheng`, free tier 3K/month)
- **DNS:** Network Solutions (domain renewals had card issues — see Blocking Issues)

### Access Control Flow
```
Student pays $197 on Stripe
  → Stripe fires checkout.session.completed webhook
  → webhook.js generates FGA-XXXX-XXXX code (crypto.randomInt, no 0/O/1/I confusion)
  → Code stored in Supabase access_codes table (idempotent on stripe_payment_id)
  → Branded email sent to student via Resend with code + CTA
  → Sale notification email sent to johnzhengmn@gmail.com
  → Student goes to /guide, enters email + code
  → verify.js checks Supabase → sets localStorage fga_course.access = true
  → All chapter pages check localStorage → grant or block access
```

### Beta Bypass
`/guide?beta=fga2026` sets localStorage directly, bypassing code verification. For testing and review only.

### CSS Architecture
- Design tokens in `:root` block of `course.css` (colors, typography, spacing, radius, shadows)
- Component classes: `.callout-*`, `.stat-card`, `.btn-primary`, `.btn-secondary`, `.table-scroll`, `.prompt-card`, `.chapter-progress`, `.trust-block`
- Cache busting via `?v=N` query parameter on CSS links (coordinate across all HTML files when bumping)
- Chapter pages use dark theme (dark background, light text)
- Landing page uses light theme

### Deployment
Push to `main` → Vercel auto-deploys. No build step. No CI pipeline. Preview deploys fire on feature branches but are non-critical.

### Environment Variables (Vercel)
```
STRIPE_SECRET_KEY        — Stripe secret key (live mode)
STRIPE_WEBHOOK_SECRET    — Stripe webhook signing secret
STRIPE_PUBLISHABLE_KEY   — Stripe publishable key (used in checkout.js)
SUPABASE_URL             — Supabase project URL
SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
RESEND_API_KEY           — Resend API key
FROM_EMAIL               — Sender address (default: Fast Grad Academy <noreply@fastgradacademy.com>)
```

---

## 3. File Map

```
fast-grad-academy/
├── index.html                  # Landing page (light theme, sales funnel)
├── guide.html                  # Course dashboard + access gate
├── ch1.html — ch12.html        # 12 course chapters (dark theme)
├── tracker.html                # Interactive degree progress tracker
├── resources.html              # Resources page
├── course.css                  # Master stylesheet (design tokens + all styles)
├── contact.html                # Contact page
├── privacy.html                # Privacy policy
├── terms.html                  # Terms of service
├── refund.html                 # Refund policy
├── 404.html                    # Custom 404
├── sitemap.xml                 # SEO sitemap
├── robots.txt                  # Robots exclusion
├── vercel.json                 # Vercel config (rewrites, headers, functions)
├── package.json                # Node dependencies (stripe, @supabase/supabase-js)
├── schema.sql                  # DB schema reference
├── supabase-schema.sql         # Supabase-specific schema
├── fga-truths.json             # Single source of truth data (prices, stats)
├── fga-build.js                # Build script for truth system
├── llms.txt / llms-full.txt    # LLM-readable site descriptions
├── README.md                   # Repo readme
│
├── api/
│   ├── checkout.js             # Stripe Checkout session creator
│   ├── verify.js               # Access code verifier
│   └── webhook.js              # Stripe webhook → code gen → Supabase → email
│
├── downloads/                  # 12 student Excel tools
│   ├── FGA_52_Week_Roadmap.xlsx
│   ├── FGA_AI_Study_Prompt_Pack.xlsx
│   ├── FGA_CLEP_Sequence_Planner.xlsx
│   ├── FGA_Credit_Planning_Tracker.xlsx
│   ├── FGA_Degree_Map_Worksheet.xlsx
│   ├── FGA_Financial_Redirect_Planner.xlsx
│   ├── FGA_Financial_Savings_Calculator.xlsx
│   ├── FGA_PSEO_Dual_Enrollment_Tracker.xlsx
│   ├── FGA_Registrar_Email_Scripts.xlsx
│   ├── FGA_School_Comparison_Matrix.xlsx
│   ├── FGA_Study_Schedule_Planner.xlsx
│   └── FGA_Transfer_Verification_Checklist.xlsx
│
├── img/                        # Image assets
│   ├── 3-graduations.png       # Hero image (viral 3-graduation photo)
│   ├── og-share.png            # Social sharing image
│   ├── favicon.svg             # Rocket emoji favicon
│   ├── preview-*.png           # Course preview screenshots (5)
│   ├── screenshot-*.jpg        # Tool screenshots (5)
│   ├── cost-comparison.svg     # Infographic
│   └── emotional-cycle.svg     # Infographic
│
├── ops/                        # Operational documents (SOPs, runbooks)
│   ├── OPS_RUNBOOK.md          # Day-to-day operations manual
│   ├── STRIPE_LIVE_SOP.md      # Stripe go-live checklist
│   ├── GOOGLE_ADS_LAUNCH.md    # Google Ads campaign plan
│   └── CODEX_PROMPTS/          # Archive of all Codex agent prompts
│       ├── 01_hotlinks.md
│       ├── 02_factcheck_summer.md
│       ├── 03_panel_fixes.md
│       ├── 04_design_overhaul.md
│       ├── 05_sync_qa_final.md
│       └── README.md           # Index of prompts and what each accomplished
│
├── _archive/                   # Historical backups (not served)
│   ├── index.ORIGINAL.html     # Pre-redesign landing page
│   ├── index.backup.html       # Another landing page backup
│   ├── guide_original.html     # Pre-redesign guide
│   └── mockup.html             # Claude Design mockup reference
│
└── PROJECT_BIBLE.md            # ← You are here
```

---

## 4. Chronological History

### Phase 0: Foundation (pre-April 2026)
- John built the initial 12-chapter course based on his personal experience graduating college at 20
- Original site built with basic HTML/CSS, dark theme chapter pages
- Course content covers CLEP, DSST, AP, PSEO, online providers, AI study tools, financial strategy, and degree planning
- Early versions had password protection via middleware

### Phase 1: Redesign (April 2026)
- **Baseline commit:** `f14d744` — the "Clean Slate" restore point
- Complete visual redesign: premium editorial aesthetic (Instrument Serif + Inter, monochrome palette, generous whitespace)
- Content restoration after accidental 700-line deletion (hard lesson → feedback_content_safety memory)
- Added access gate system (email + code verification)
- Built Stripe checkout flow, webhook, Supabase integration
- Added 12 downloadable Excel tools in `/downloads/`
- Source of truth spreadsheet created (FGA_Content_Source_of_Truth.xlsx)
- CSS tokens system started (course.css?v=9)
- **End state:** Redesigned but not launched. Stripe in test mode.

### Phase 2: Launch Prep (May-June 2026)
- Multiple Codex agent branches created:
  - `fga-launch-hardening` — asset preloads, internal link repairs, CSS cache bump
  - `fga-round2-parent-mobile` — parent nav, mobile hamburger, FAQ schema, buyer fit qualifier
  - `fga-course-hotlinks-news` — ~95 hotlinks, 8 source cards, Ch9 tool card fix
  - `fga-tracker-export-sharing` — CSV/PDF/ICS export for tracker
- All branches merged to main by June 23, 2026
- Vercel deploy failures caused by deprecated `"public"` property in vercel.json — fixed (`d3c0cd9`)

### Phase 3: Design System Overhaul (June 23, 2026)
- 25-student avatar panel reviewed site → produced design feedback and content feedback
- **Design overhaul commit (`e255f43`):** 682 insertions across 14 files:
  - CSS design tokens (`:root` custom properties)
  - Reusable component classes
  - Calculator fix (`fmt()` bug: "$2510K" → "$2.5M") + range sliders
  - New debt-vs-debt-free calculator in Ch11
  - Parent Trust Block (3-card grid on landing page)
  - Headlines marquee → curated "Movement in the News" grid
  - "Community example" labels on testimonial cards
  - Mobile scroll wrappers on 8 wide tables
  - Sticky reading progress bar on all 12 chapters
  - Student Login button in nav
- Tracker export merged (`23b46d2`)
- Codex fact-check pass executed (stat corrections, Summer Sprint, AI study stack callout) — uncommitted as of this writing, pending merge

### Phase 4: Current State (June 23, 2026)
- **Git:** `main` at `23b46d2` (163 commits), pushed to GitHub
- **Live site:** https://fastgradacademy.com — deployed, content complete, design overhauled
- **Revenue:** $0 — Stripe still in TEST mode (blocker #1)
- **Ads:** No Google Ads account exists yet (blocker #2)
- **Pending Codex work:** Fact-check merge, panel fixes (number consistency, scholarship hack reframe), Summer Sprint content

---

## 5. Key Decisions Made

| Date | Decision | Why | Impact |
|------|----------|-----|--------|
| Apr 2026 | Chose static HTML over React/Next.js | Speed, simplicity, no build step, Vercel serves it for free | Every page is a single HTML file with inline styles |
| Apr 2026 | Dark theme for chapters, light for landing | Chapters = focused reading (dark reduces eye strain), landing = trust/conversion (light = clean/legitimate) | Two visual systems to maintain |
| Apr 2026 | Access codes over user accounts | No auth system needed, no password resets, codes feel premium, simpler ops | Trade-off: no user dashboard, no analytics per user |
| Apr 2026 | Supabase over Firebase | Free tier is generous, PostgreSQL is standard, JS client is clean | access_codes table is the only table |
| Apr 2026 | Resend over SendGrid | Simpler API, free tier sufficient, better DX | 3K emails/month limit on free tier |
| Apr 2026 | $197 price point | Above impulse-buy ($47-97 range) but below "need to think about it" ($497+). Positioned as "investment" not "purchase" | Single product, no upsells yet |
| Jun 2026 | Editorial design aesthetic | 25-student panel confirmed it builds trust with skeptical first-gen and prestige-seeking segments | No gradients, no stock photos, serif display + monochrome |
| Jun 2026 | CSS design tokens over CSS-in-JS | Static HTML site, no build step, tokens provide consistency without framework overhead | All design values in one `:root` block |
| Jun 2026 | Kept all content in HTML (no CMS) | Simplicity, no API calls, instant page loads, full control over layout | Content updates require code changes |
| Jun 2026 | Codex agent parallelization | Speed — 4 agents working simultaneously on different branches | Merge conflicts require careful coordination |

---

## 6. Blocking Issues (as of June 23, 2026)

### P0 — Cannot Generate Revenue
1. **Stripe in TEST mode** — Need to flip to live, create product ($197), get 3 keys, set 6 Vercel env vars. SOP written: `ops/STRIPE_LIVE_SOP.md`
2. **No Google Ads account** — Need to create account, set up conversion tracking, replace `AW-CONVERSION_ID` placeholders in index.html and guide.html
3. **Codex fact-check work uncommitted** — Modified 14 files with stat corrections + Summer Sprint, not yet committed or merged to main

### P1 — Should Fix Before Scaling
4. **FGA domain renewal** — Card ending 0616 was declined at Network Solutions (order #1894102595)
5. **E2E test purchase** — No real-card test purchase has ever been done through the full chain
6. **Resend domain verification** — fastgradacademy.com sender domain may need DNS records
7. **3 stale GitHub branches** — Already merged, should be deleted
8. **No .gitignore** — 3 untracked backup files in repo root

### P2 — Improve After Launch
9. **Number inconsistencies** — CLEP price, debt figures, cost ranges vary across chapters (Codex prompt written)
10. **Freshman scholarship timing** — Reframed as a written-confirmation warning in Chapter 11
11. **YouTube/Medium links** — Update descriptions to point to fastgradacademy.com
12. **Vercel 2FA** — Was prompted, skipped. Should set up.

---

## 7. Revenue Model

```
Product: Fast Grad Academy Guide    $197 one-time
─────────────────────────────────────────────────
Customer Acquisition:
  Google Ads ($30/day budget planned)
  YouTube (17.7K subscribers on The Automated Founder)
  Organic search (SEO via sitemap, structured data, llms.txt)

Unit Economics (target):
  CAC: $30-50 via Google Ads
  LTV: $197 (single product, no upsell yet)
  Margin: ~$150 per sale after ads + Stripe fees

Growth Levers:
  - Affiliate/referral program (not built)
  - Email nurture sequence (not built, Resend ready)
  - TikTok/IG content (not started)
  - Upsell: 1-on-1 coaching, community (not built)
```

---

## 8. For the Operations Agent

### Your daily responsibilities:
1. **Monitor Vercel deploys** — Check that main branch deploys succeed after any push
2. **Monitor Stripe** — Check for new sales, failed webhooks, refund requests
3. **Monitor email** — Sale notifications go to johnzhengmn@gmail.com
4. **Content freshness** — Exam prices, provider pricing, and statistics change. Run a quarterly audit using `FGA_Source_of_Truth_Exams_Facts.xlsx`

### Your weekly responsibilities:
1. **Check Google Ads performance** — CTR, CPC, conversion rate, ROAS
2. **Review Supabase** — access_codes table for any anomalies
3. **Check site uptime** — Visit each page type (landing, guide, 2-3 chapters, tracker)

### Your quarterly responsibilities:
1. **Full fact-check** — All prices, stats, exam lists, provider details. Use the source of truth spreadsheet.
2. **Content update** — New exams added? Exams retired? Provider pricing changed? Update chapters + spreadsheet.
3. **Security** — Rotate GitHub token, check Vercel env vars, review Supabase access

### How to deploy a change:
1. Edit the file(s) in the repo
2. Commit with conventional commit message (`feat:`, `fix:`, `chore:`)
3. Push to `main`
4. Vercel auto-deploys. Check dashboard for "Ready" status.
5. Visit the changed page(s) to verify

### How to handle a Vercel failure:
1. Check the Vercel deploy log for the error
2. Most common: JSON schema validation in `vercel.json` (Vercel deprecates properties periodically)
3. Fix the issue, commit, push again
4. If unclear, check Vercel's changelog for breaking changes

### Key files to NEVER delete:
- `api/webhook.js` — breaks the entire purchase flow
- `vercel.json` — breaks all deploys
- `course.css` — breaks all styling
- `fga-truths.json` — single source of truth for prices/stats

### Key files that are safe to update frequently:
- `ch1.html` through `ch12.html` — course content
- `index.html` — landing page copy and layout
- `guide.html` — course dashboard
- `course.css` — styles (bump `?v=` across all files when changing)

---

## 9. External Accounts

| Service | Account | Status | Notes |
|---------|---------|--------|-------|
| GitHub | thejohnzheng | Active | Repo: fast-grad-academy |
| Vercel | (linked to GitHub) | Active | Auto-deploy from main |
| Stripe | acct_1S0oQsPUXG3LAWX2 | TEST MODE | Needs live mode activation |
| Supabase | (project exists) | Active | access_codes table |
| Resend | thejohnzheng (via GitHub) | Active | Free tier, domain verification pending |
| Network Solutions | (domain registrar) | Issue | Card declined for renewal |
| Google Ads | NOT CREATED | Blocker | Need account + conversion tracking |
| Google Drive | Multiple folder IDs | Active | See reference_google_drive memory |

---

## 10. Related Projects

FGA is one of 9 brands under John Zheng's portfolio (see `project_brand_portfolio` memory file):
- **The Automated Founder** — YouTube (17.7K subs) + Beehiiv newsletter
- **Subscribr** — $97 product
- **Hill Nelson Team / HN Mortgage** — Bell Bank mortgage (primary income)
- **LoanPresent** — Mortgage AI Copilot ($88M ARR target)
- **BitcoinCapital.ist** — Bitcoin content/strategy
- **Executive Strategy Consulting** — Consulting brand
- **thejohnzheng.com** — Hub site (DNS currently down)

FGA's visual identity (editorial, serif + sans, monochrome) is shared across the brand portfolio. See `project_brand_portfolio` memory for full brand guidelines.
