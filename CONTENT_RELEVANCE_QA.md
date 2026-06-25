# Content Relevance QA

Scope: `ch1.html` through `ch12.html`, plus `guide.html`.

## Quiz Audit

I reviewed every quiz / interactive knowledge-check block in scope.

- `ch6.html` PSEO questions match the chapter topic and the surrounding counselor / dual-enrollment guidance.
- `ch8.html` study-technique questions match the chapter and the surrounding active recall / spaced repetition content.
- `ch10.html` roadmap questions match the timeline / prioritization section they sit under.
- `ch11.html` financial-aid questions match the financial strategy chapter.

No clearly misplaced or copy-pasted quiz was found.

## Duplicate / Misplaced Content Findings

| File | Line(s) | Element / content | Chapter / section | Should be | Severity |
|---|---:|---|---|---|---|
| `ch1.html` | 289-300 | `This Is Making National News — April 2026` / `THE WASHINGTON POST` / `The students demonstrate how much they can learn as quickly as they can.` | Chapter 1, national-news proof block | Keep this as the canonical Washington Post proof block; remove the duplicate from `ch12.html` | HIGH |
| `ch12.html` | 397-404 | `This Is Making National News` / `THE WASHINGTON POST` / `The students demonstrate how much they can learn as quickly as they can.` | Chapter 12, national-news proof block | Delete or replace with chapter-specific evidence; it duplicates the Chapter 1 block almost verbatim | HIGH |
| `ch1.html` | 206-209 | `EDUCATION DATA INITIATIVE` / `Student loan debt in the United States totals...` | Chapter 1, debt reality source card | Keep one canonical debt source card in Chapter 1; replace this repetition elsewhere with a different proof point | HIGH |
| `ch11.html` | 213-216 | `EDUCATION DATA INITIATIVE` / `42.8 million student borrowers have federal loan debt.` | Chapter 11, financial-strategy source card | This is near-identical to the Chapter 1 debt evidence block; consolidate or rewrite so Chapter 11 does not repeat the same proof card | HIGH |
| `guide.html` | 390-395 | `Start Here Tonight` / `Create a free Modern States account.` | Guide dashboard, onboarding CTA | Delete or rewrite for dashboard context; this is a landing-page CTA copied into the guide | HIGH |
| `ch10.html` | 482-489 | `This is the short version of the 52-week roadmap...` / `The Sprint Rules` | Chapter 10, summer sprint CTA | Keep the chapter-specific roadmap summary, but remove the duplicated landing-page marketing block if the same CTA already appears elsewhere | LOW |

## Notes

- I did not flag the repeated quiz styling or the access-gate template elements as duplicates. Those are site-shell patterns used intentionally across chapter pages.
- The biggest content problem is repetition of proof / CTA blocks across pages, especially the Washington Post and student-debt evidence cards.

