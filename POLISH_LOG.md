# Polish Pass 1 — Log

**Agent:** FGA-07-POLISH
**Branch:** `fga-polish-pass-1` (off `main`)
**Date:** 2026-06-24
**Scope:** em dashes, acronym definitions, testimonial audit, pricing voice, one pull quote.
Numbers, calculators, access gate, Stripe code, CSS tokens, and JS functionality were not touched.
Content sections counted before/after every file — all intact (index.html = 15 `<section>`; each chapter = 1).

---

## Task 1 — Em dash cleanup

Goal: fewer and intentional, not zero. Decision tree applied per instance (period for joined
sentences, comma for soft pause/parenthetical, colon for list/explanation intro, keep for
parenthetical pairs / headings / bylines / dramatic beats).

**Site-wide em-dash count (literal `—` characters):**

| File | Before | After | Removed |
|------|-------:|------:|--------:|
| index.html | 160 | 153 | 7 |
| guide.html | 10 | 10 | 0 |
| ch1.html | 35 | 17 | 18 |
| ch2.html | 26 | 15 | 11 |
| ch3.html | 35 | 21 | 14 |
| ch4.html | 27 | 16 | 11 |
| ch5.html | 40 | 31 | 9 |
| ch6.html | 12 | 4 | 8 |
| ch7.html | 92 | 83 | 9 |
| ch8.html | 41 | 19 | 22 |
| ch9.html | 48 | 23 | 25 |
| ch10.html | 29 | 13 | 16 |
| ch11.html | 38 | 19 | 19 |
| ch12.html | 28 | 11 | 17 |
| **TOTAL** | **621** | **435** | **186** |

Note: index.html's remaining 153 are overwhelmingly **not prose** — 24 lines of decorative CSS
comments (`/* ——— label ——— */`), `<title>`/`<meta>` SEO strings, and HTML code comments, none of
which are reader-facing. Only ~7 prose dashes existed in index.html; 6 were changed, 1 kept.
guide.html's 10 are all either `data-fga`-bound chapter descriptions, JS UI strings, or a title-style
badge separator (see "kept" below), so 0 were changed.

**Categories KEPT (with reasoning):**
- **Parenthetical pairs** (`— ... —`) that set off a phrase containing internal commas — grammatically
  correct and clearer than commas. E.g. ch1 "The mechanisms in this course — CLEP, DSST, PSEO,
  competency-based programs — are officially sanctioned…"; ch1 "When you layer these methods
  together — cheap credits first, then fill gaps, then university… — you are not shaving off a semester."
- **Headings / labels / badges** using `" — "` as a title-style separator. E.g. "Every Acceleration
  Method — All in One Place", "How CLEP Actually Works — 60 Seconds", "Knowledge Check — Chapter N",
  "What NOT to Do — 5 Costly Mistakes". Title separators, not body-prose tells.
- **Bylines / attribution.** E.g. "@John_Zheng — The Automated Founder", "Ali Abdaal — Cambridge-trained
  doctor…", image-caption source lines.
- **Genuine dramatic beats** (one earned single per dense paragraph). E.g. index "No fake testimonials
  — ever."; ch4 "Stay calm — you've done the work."; ch12 "not a lesser candidate — they are often a
  stronger one."
- **List-vs-summary dashes** where a comma would create ambiguity. E.g. ch1 "Include AP, CLEP,
  PSEO — everything." (the dash separates the summary word from the comma list).
- **Table no-equivalent markers** (`<td>—</td>`) in ch7's degree-mapping tables — data glyphs.
- **Out of scope (left, noted):** `<title>`/`<meta>` SEO strings; JSON-LD structured-data strings
  (index line 40 schema name, FAQ answers); CSS/HTML comments; all em dashes inside `<script>` blocks
  (JS string literals such as "Chapter N Complete — click to unmark", action-card data); `data-fga`
  bound chapter descriptions (bound to `fga-truths.json` — editing the HTML would diverge from the
  source of truth and be reverted by `fga-build.js`); `&mdash;` HTML entities (ch4/ch6) which are not
  literal `—` characters; en-dash number ranges (`3–6`, `$20–35`, `$350–600`, `2–3 weeks`) which are
  correct range punctuation, never em dashes.

**One word-level change (flagged for transparency):** ch3.html, the IB paragraph — converting a
period split, `"…extended essay requirements — and at the end of it…"` became `"…requirements. At
the end of it…"`, dropping the coordinating conjunction "and" so the new sentence wouldn't open with
"And". This is the only place a word (a conjunction) was removed; meaning is fully preserved. Every
other change across all 13 files is a pure punctuation swap plus sentence-start capitalization
(verified: per-file digit multisets identical pre/post; per-file letter streams identical after
stripping `— . , :`, spaces, and case).

**Method:** index.html and ch1.html were done by hand in the main pass. ch2–ch12 were each processed
by a dedicated single-file subagent given the identical decision tree and "always leave" list; every
resulting diff was then verified by FGA-07-POLISH with git (digit preservation, letter-stream
integrity, section counts, and that only the 13 intended files changed).

---

## Task 2 — Acronym definitions on first use

| Acronym | File | Location | Definition added |
|---------|------|----------|------------------|
| CLEP | index.html | Hero, immediately after first mention (the guarantee line), as a muted "New here?" gloss | "CLEP (College-Level Examination Program) — standardized exams from the College Board that let you earn college credits by proving what you already know." |
| DSST | index.html | Founder letter, first mention ("…DSST exams…") | inline parenthetical: "(similar to CLEP, run by Prometric)" |
| PSEO | index.html | Founder letter, first mention | inline acronym expansion: "(Post-Secondary Enrollment Options)" — the surrounding sentence already explains the mechanism ("the state of Minnesota literally pays for you to take college courses while you're still in high school"), so only the acronym was expanded |
| CLEP | guide.html | Summer Sprint card, first mention ("A 10-week CLEP-first sprint…") | inline parenthetical: "(CLEP is the College-Level Examination Program, the College Board's credit-by-exam tests)" |

Notes: No school-count number was placed in any definition (per instruction — the canonical count
lives in `fga-truths.json` and is shown elsewhere). DSST/PSEO in guide.html appear only in
`data-fga`-bound chapter titles, which were left untouched. Surrounding copy was not rewritten —
definitions were added, not substituted. The CLEP hero gloss intentionally uses one em dash (the
canonical "term — definition" glossary form), which reads as earned, not a tell.

---

## Task 3 — Testimonial scaffolding audit

**Audit result: NO credibility gap. No changes made (no commit for this task).**

- The "Wall of Proof" marquee (`#wall1` / `#wall2`, index.html ~line 1183) looks empty in the static
  HTML, but those two `<div>`s are **JavaScript mount points**, not empty scaffolding. They are
  populated at runtime by `renderP()` from the `proof` array (index.html lines 1548–1573).
- The `proof` array holds **24 real, community-sourced testimonial cards**, each with a quote, a name,
  a source (Star Tribune, Modern States, College Hacked, Hacker News, Money.com, Peterson's, WorthyNest,
  LinkedIn, "Verified Purchase", "FGA Community", etc.), and an outcome.
- The cards are **honestly labeled**: every rendered card carries a "Community example" tag (line 1583);
  the section header reads "From the credit-by-exam community, not FGA customers" (line 1181); and a
  sourcing/results-not-typical disclaimer sits below (line 1188).
- The "No fake testimonials — ever" claim lives in a **separate** Parent Trust Block (line ~1323,
  "Transparent & Verified" card), and is honestly supported by the labeling above.

Per Task 3 Step 2, when real, honestly-labeled content exists, it is kept and the claim may stay.
There are no empty/stray testimonial cards to remove. Removing the `#wall1`/`#wall2` divs would
**break** the testimonial wall (the JS targets them by id). Therefore: leave as-is.

---

## Task 4 — Pricing sub-copy voice (third person → reader-first)

File: index.html, pricing/offer card (`<p class="p-sub">`).

**Before:**
> The exact 186-page system John used to finish his bachelor's in one year, saving $85,000+ in
> tuition, and graduate Harvard with his Master's at 21. Every exam, every strategy, every shortcut.

**After:**
> Everything you need to finish your degree in a year, in 186 pages. Every exam, every strategy,
> every shortcut.

The third-person founder framing in the pricing card was switched to second person. Founder-specific
figures ($85,000+ saved, Harvard Master's at 21) were not reframed as reader promises (that would
over-promise); they remain present in the hero and the stats bar. The "186 pages" and "a year"
figures are retained; no new numbers introduced. The rule-of-three tail ("Every exam, every
strategy, every shortcut.") was left untouched — rule-of-three padding is explicitly a separate pass.
Other "John" references outside the pricing card (the "Tuition John saved" stat label, the bento
roadmap line) were left as contextually appropriate per instruction.

---

## Task 5 — Promote the key founder quote

**Line:** "I entered my freshman year as a college senior."

- **Was:** buried mid-paragraph in the founder letter (`<p class="big">`, index.html line ~1154),
  between "I finished in 2020." and "I graduated with my BBA in ONE YEAR."
- **Now:** extracted into a styled, centered serif pull quote placed as a **section break
  immediately before the pricing offer** (high purchase-intent visibility, light background). Uses
  existing CSS tokens (`--serif`, `--line`, `--ink`); the task's `var(--text-2xl)` token does **not**
  exist in index.html, so an explicit `clamp(28px, 4vw, 44px)` was used instead to avoid broken
  styling. Curly quotes used for editorial polish.
- Removed from its original location so the line appears **exactly once** (verified: 1 occurrence).

---

## Verification summary

- Only 14 files touched: index.html, guide.html, ch1–ch12.html, plus this log. (Verified via git —
  no CSS, JS, API, calculator, gate, or `fga-truths.json` files changed.)
- Digit preservation: per-file digit multisets identical before/after for all 13 HTML files (the only
  added digits anywhere are the inline CSS values in the Task 5 pull-quote style — no content
  statistics changed or introduced).
- Section counts: index.html 15/15; every chapter 1/1; guide.html 1/1 — all unchanged.
- No content sections deleted.

## Commits on this branch
1. `polish: reduce em dash overuse site-wide`
2. `polish: define CLEP and acronyms on first use`
3. `polish: fix pricing copy from third person to reader-first`
4. `polish: promote key founder quote as pull quote`
5. (Task 3 produced no changes — audit only, documented above.)
6. `docs: add POLISH_LOG.md` (this file)
7. `fix: restore em dash in JSON-LD refund policy + rebase onto post-revert main` (see addendum)

---

## Addendum — 2026-06-24 (post-review rebase)

Coordinator review found the branch was cut from `main` before a revert landed.

- **Rebase:** `git rebase origin/main` onto `1f6e0f2` ("revert CLEP school count to 2,900+").
  Clean — **no conflicts**. My edits and the revert touched disjoint lines (the revert changed only
  the school-count figures; my em-dash edits were elsewhere, and the one reverted line carrying an em
  dash — the `data-fga` ch4 chapter description — was in my deliberate "leave untouched" set).
- **CLEP school count:** now `2,900+` everywhere (the canonical College Board / `fga-truths.json`
  figure). `grep -rn "3,000+" --include="*.html"` → 0 results. `grep -rn "2,900+" --include="*.html"`
  → 10. `data-count="2900"` confirmed on the animated counter (index.html). Unrelated `$3,000`
  dollar amounts (course-cost examples in ch6/ch10/index) were correctly left alone.
- **JSON-LD correction:** the Task 1 `replace_all` for the guarantee line had also caught the
  protected JSON-LD refund-policy string (index.html line 105). The em dash there has been **restored**
  (`full refund — no forms, no hoops`), since JSON-LD structured data was in the do-not-touch zone.
  The three visible-copy occurrences (hero guarantee, checklist item, FAQ answer) remain commas as
  intended.

