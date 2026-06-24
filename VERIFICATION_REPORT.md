# Source Verification Report

**Agent:** FGA-05-RESEARCH (research & verification)
**Date:** 2026-06-24
**Repo HEAD at verification:** 728016c
**Method:** Live HTTP checks (`curl` with browser UA), independent web search, and
cross-referencing against syndications and primary sources. No claim below is
asserted without a confirming source; items I could not independently confirm are
labeled as such.

---

## TL;DR — Two assigned "fixes" were false positives

| Task | Premise given | Reality | Action taken |
| --- | --- | --- | --- |
| 1 | ch12 WaPo press link is **fabricated / never existed** | Article is **REAL and live**, accurately cited | **No change** — kept the citation |
| 2 | ch1 transferology.com returns **404** | Site is **live and functional** (302→200) | **No change** — kept the link |

Both flagged URLs return non-200 to a naive `curl` (WaPo blocks bots → `000`;
Transferology requires a real browser session), which is almost certainly why
upstream agents flagged them as dead/fake. Independent verification shows both are
genuine. Removing either would have *deleted accurate, working content* from a
site about to take paid traffic. Details below.

---

## Task 1 — ch12.html "fabricated" Washington Post link

**Verdict: NOT fabricated. The article is real, live, and correctly cited. No edit made.**

- **URL:** https://www.washingtonpost.com/education/2026/04/19/accelerated-college-degree-hacking/
- **On-site headline (ch12.html:402-405):** "Students are speeding through their online degrees in weeks, alarming educators"
- **On-site quote:** "Students are demonstrating competency"

Evidence the article is genuine:
1. Web search returns the exact URL as a **Washington Post** result. WaPo's own
   current headline is "Adults are earning college degrees online in weeks,
   alarming educators"; the syndicated headline (used on our site) is "Students
   are speeding through their online degrees in weeks, alarming educators."
2. **Independent syndications** carry the same byline, date, and the site's
   headline verbatim:
   - Spokesman-Review (Spokane): https://www.spokesman.com/stories/2026/apr/19/students-are-speeding-through-their-online-degrees/
   - Red Lake Nation News: https://www.redlakenationnews.com/story/2026/04/20/news/students-are-speeding-through-their-online-degrees-in-weeks-alarming-educators/139670.html
   - schoolinfosystem.org (2026-04-20)
3. **Author:** Todd Wallack (Washington Post) — confirmed across syndications.
4. **Date:** April 19, 2026 — confirmed.
5. **Quote check:** Fetched the Spokesman-Review syndication. The phrase "Students
   are demonstrating competency" appears verbatim, attributed to Selena Grace,
   president of the Northwest Commission on Colleges and Universities (NWCCU, a
   real regional accreditor). Article content is directly on-topic: accelerated /
   competency-based degrees, transferring up to three-quarters of credits from
   nontraditional sources, and test-based credit.
6. A **follow-up WaPo opinion piece** (April 22, 2026, "Are educators misjudging
   the students 'speed running' their online degrees?") references the original —
   consistent with a real, widely-read news story.

> The raw `curl` returns HTTP `000` because washingtonpost.com aggressively blocks
> non-browser user agents. `000`/`404` from a bot is not evidence a WaPo URL is
> fake. This is the likely root cause of the "fabricated link" report.

**Recommendation:** Leave ch12.html line 402-405 as-is. The citation is accurate.

---

## Task 2 — ch1.html dead transferology.com link

**Verdict: NOT dead. transferology.com is live and functional. No edit made.**

- **URL (ch1.html:378):** https://www.transferology.com
- **Live check:** `GET /` → `302` redirect to `index.htm` → `200 OK`,
  `<title>Transferology</title>`, ~25KB of app HTML, active AWS load balancer,
  session cookies, Google Maps, live chat widget. This is CollegeSource's
  production Transferology product (the well-known course/credit-transfer lookup
  tool, formerly u.select), not a parked or error page.

> Like WaPo, Transferology returns 403/non-200 to header-less or `HEAD`-only bot
> requests but serves a full 200 to a normal browser session. The "404" report
> was a false positive.

**Re: the proposed College Board replacement** —
`https://clep.collegeboard.org/clep-college-credit-policy` returns **404** and is
NOT a valid replacement. (The working College Board CLEP policy search lives under
`https://clep.collegeboard.org/college-credit-policy/...`.) Since the existing
Transferology link works, no replacement is needed.

**Recommendation:** Leave ch1.html line 378 as-is. The link is live.

---

## Task 3 — VERIFIED_PRESS.md article verification

All eight "Usable On-Site Citations" checked. Status legend: ✅ fully verified ·
🟡 live but exact headline not independently confirmable via search (paywall/bot
block) · ❌ problem.

| # | Publication / Headline | Author | Date | HTTP | Verdict |
| --- | --- | --- | --- | --- | --- |
| 1 | The 74 — "Beyond AP: The College Credit Opportunity Few People Know About" | Kerry McDonald | 2026-06-03 | 200 | ✅ real & live |
| 2 | Fortune — Steve Klinsky / Modern States free college | Nick Lichtenberg | 2026-03-31 | 200 | ✅ real & live |
| 3 | Washington Post — "Making a dent in student debt with 'Freshman Year for Free'" | Michelle Singletary | 2017-08-24 | 000* | ✅ real (search + Boston Globe syndication confirm author/date/headline) |
| 4 | WSJ — "'Free Freshman Year' Is Latest Path to Free College Credits" | Douglas Belkin | 2017-08-10 | 401* | 🟡 URL live behind paywall; Belkin is a real WSJ higher-ed reporter; 2017 WSJ coverage of Freshman Year for Free is corroborated. Exact headline not surfaced via search. |
| 5 | WIRED — "The Grand Plan to Give Everyone a Free Year of Online College" | Issie Lapowsky | 2015-01-30 | 200 | 🟡 URL live; Lapowsky is a confirmed real WIRED journalist; exact headline not independently confirmed via search (WIRED archive not crawlable). |
| 6 | Inside Higher Ed — "Would-Be Disruptor Shifts Gears" | (not listed) | 2015-09-13 | 200 | ✅ live & readable |
| 7 | Hechinger Report — Dreamers / education opportunities | Aviles & Pestronk | 2023-11-13 | 200 | ✅ real & live |
| 8 | Washington Post — "Students are speeding through their online degrees in weeks..." | Todd Wallack | 2026-04-19 | 000* | ✅ real (see Task 1 — multiple independent syndications + quote confirmed) |

`*` = `000`/`401` is bot-block/paywall, NOT a dead link. Verified by other means.

**Supporting references spot-checked:**
- College Board "CLEP Benefits for Everyone" → 200, live, official. ✅
- Modern States "$2.7M funding" press release → 403 to bot, but confirmed real via
  GlobeNewswire (https://www.globenewswire.com/news-release/2026/03/03/3248741/0/en/Modern-States-Secures-Nearly-2-7-Million-in-New-Funding-to-Broaden-Affordable-College-Pathways.html)
  and Yahoo Finance syndication, dated 2026-03-03. ✅

**Flags / minor discrepancies (no fakes found):**
- The project handoff notes describe the WSJ piece as "WSJ (2012)." The correct
  date is **2017-08-10** (the URL slug `1502392112` is an Aug 10 2017 timestamp;
  VERIFIED_PRESS.md already has 2017). The "2012" reference elsewhere is wrong.
- Items #4 and #5 are live but I could not pull their exact on-page headlines via
  independent search (WSJ paywall, WIRED archive not crawlable). They are very
  likely correct; recommend a manual eyeball before relying on them in ad copy.

**No fabricated or dead press articles were found in VERIFIED_PRESS.md.**

---

## Task 4 — Site claim verification

| # | Site claim | Verified value | Source | Match? |
| --- | --- | --- | --- | --- |
| 1 | "34 CLEP exams" (site now says "30+") | **34 exams** (current) | College Board: "CLEP offers 34 exams" (https://clep.collegeboard.org/clep-benefits-for-everyone) | ✅ "34" is exact & current; "30+" is conservatively correct |
| 2 | "$39,633 average student debt" | **$39,633** avg **federal** balance per borrower, as of Dec 2025 | U.S. Dept. of Education / Federal Student Aid portfolio, reported by educationdata.org & Motley Fool | ✅ exact match |
| 3 | "2,900+ colleges accept CLEP" | College Board: **"over 3,000 colleges"**; Modern States: "nearly 2,900" | https://clep.collegeboard.org/clep-benefits-for-everyone | ✅ "2,900+" is accurate & conservative; could be upgraded to "3,000+" per College Board |
| 4 | "5.50% federal student loan rate" | **6.39%** standard undergrad Direct Loan rate, 2025-26 (down from 6.53%). 5.39% only applies as a temporary auto-pay reduction from Jul 2026. | FSA official announcement (fsapartners.ed.gov, 2025-05-30); CNBC; Bankrate | ❌ **MISMATCH — see below** |
| 5 | Modern States free CLEP vouchers | **Active.** Modern States reimburses the CLEP exam fee; 2026 voucher guides current. | modernstates.org; practicetestgeeks 2026 voucher guide | ✅ still active |

### ⚠️ Finding: the "5.50%" federal student loan rate is inaccurate

- The **standard 2025-26 undergraduate Direct Subsidized/Unsubsidized rate is
  6.39%** (loans disbursed Jul 1 2025 – Jun 30 2026; down from 6.53% in 2024-25).
- The figure closest to 5.50% is **5.39%**, the *temporary* auto-pay incentive
  rate (6.39% − 1%) available only from **July 1, 2026**. That is not the same as
  the headline federal rate, and "5.50%" matches neither figure exactly.
- 2026-27 rates are projected to rise slightly.

**Recommendation (out of my edit scope):** whichever file renders "5.50%" should
update to **6.39%** ("the current federal student loan rate for 2025-26") to be
accurate for paid traffic. This is a content fix for the page-owning agent — I did
not touch it (only ch1/ch12/VERIFIED_PRESS are in my edit scope, and the string
does not appear there).

### Optional precision upgrades (not errors)
- "30+ current exams" → could restore **"34"** (College Board's exact current count).
- "2,900+ colleges" → could upgrade to **"3,000+"** per College Board's own figure.

---

## Summary of actions

- **ch12.html:** unchanged — WaPo citation verified real. (Task 1 premise was false.)
- **ch1.html:** unchanged — transferology.com verified live. (Task 2 premise was false.)
- **VERIFIED_PRESS.md:** unchanged — all entries verified, none fake or dead.
- **VERIFICATION_REPORT.md:** this file (added).

### Open recommendations for the fleet
1. Fix the **"5.50%" → "6.39%"** federal student loan rate (page-owning agent).
2. Manually eyeball the WSJ (#4) and WIRED (#5) headlines once (paywall/archive
   blocked automated confirmation).
3. Optional: tighten "30+ exams" → "34" and "2,900+" → "3,000+" for precision.
4. Note for tooling: WaPo, WSJ, Modern States, and Transferology all block naive
   bot requests — use a browser UA / real session before declaring a link dead.
