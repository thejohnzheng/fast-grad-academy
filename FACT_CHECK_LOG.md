# Fast Grad Academy Fact Check Log

Audit date: 2026-06-23

## Scope

Reviewed high-risk statistics, pricing, provider facts, news claims, and course positioning across `index.html`, `guide.html`, and `ch1.html` through `ch12.html`. The audit prioritized public-facing debt statistics, CLEP/Modern States facts, provider pricing, employer claims, and April 2026 news references.

## Source of Truth Workbook

Blocked: `FGA_Source_of_Truth_Exams_Facts.xlsx` was not found anywhere under `/Users/johnzheng/Documents` during this pass, so it could not be updated. The edits and source notes below are captured here instead.

## Corrections Made

- Student debt total changed from `$1.84 trillion` to `$1.833 trillion`, and borrower language changed to `42.8 million federal borrowers`.
- Average debt changed from `$39,633` to `$39,547` where referencing average federal borrower balance.
- Removed or softened unverified landing/course claims: `every 9 seconds`, `71% borrower regret`, `43% mental health`, `9.2 million`, `59% tuition vs 5% wages`, and several anxiety/suicidal-ideation claims where a current primary source was not traced.
- Replaced unverified Harris Poll employer block (`98%`, `96%`, `$73K`) with NACE Job Outlook 2026 skills data.
- Updated CLEP copy from exact `34 exams` / `College Board 2025` to `30+ current exams` and live-catalog language.
- Updated Modern States copy to clarify that vouchers can cover the College Board CLEP exam fee, while test center or remote-proctoring fees may still apply.
- Updated provider pricing:
  - Sophia: `$99/month`, unlimited access, two active courses at a time.
  - Study.com: College Saver starts at `$95/month`; College Saver Pro is `$235/month`.
  - StraighterLine: `$99/month + course fee`; bundle plans available.
  - Saylor: free courses with low-cost proctored credit exams; exact fee/course acceptance should be verified live.
- Replaced older narrative news copy with verified press citations. Current source of truth: `VERIFIED_PRESS.md`.
- Removed named-student retellings from the public press sections so citation blocks rely only on publication, headline, date, URL, and short attributed quotes.
- Added Summer Sprint Challenge content to `guide.html`, `index.html`, and `ch10.html`.
- Added a 2026 AI study stack callout to `ch9.html`.
- Bumped `course.css` cache references from `v13` to `v15`.

## Sources Used

- College Board CLEP registration and pricing: https://clep.collegeboard.org/register-for-an-exam
- College Board CLEP live exam catalog: https://clep.collegeboard.org/clep-exams
- College Board College Composition Modular timing: https://clep.collegeboard.org/clep-exams/college-composition-modular
- Modern States home and voucher program: https://modernstates.org/
- Modern States FAQ: https://modernstates.org/faq/
- Sophia pricing and access: https://www.sophia.org/
- Study.com college pricing: https://study.com/college/pricing.html
- StraighterLine pricing: https://www.straighterline.com/pricing
- Education Data Initiative student loan debt statistics: https://educationdata.org/student-loan-debt-statistics
- Education Data Initiative average cost of college: https://educationdata.org/average-cost-of-college
- NACE Job Outlook 2026 skills data: https://www.naceweb.org/talent-acquisition/candidate-selection/the-key-skills-employers-seek-on-college-students-resumes
- Georgetown CEW College Payoff: https://cew.georgetown.edu/cew-reports/the-college-payoff/
- Washington Post April 2026 accelerated degree feature: https://www.washingtonpost.com/education/2026/04/19/accelerated-college-degree-hacking/
- TESU transfer credit policy: https://www.tesu.edu/academics/catalog/transfer-credit
- Excelsior transfer credit overview: https://www.excelsior.edu/start-with-more-credit/transfer-more-credits/
- WGU transferable certifications: https://www.wgu.edu/admissions/transfers/wgu-transcript-request/transferable-certifications.html
- Starbucks College Achievement Plan: https://www.starbucks.com/careers/working-at-starbucks/education/
- Walmart Live Better U / Guild: https://www.guildeducation.com/walmart
- Chipotle Guild education benefits: https://www.guildeducation.com/chipotle
- Minnesota PSEO official page: https://education.mn.gov/MDE/fam/dual/pseo/

## Still Needs Manual Verification Before Final Publication

- DSST current exam count, current fees, and retake policy should be verified against DANTES/Prometric immediately before publication.
- Saylor exact current proctoring fee and eligible credit-course list should be verified directly inside Saylor's current credit/proctoring flow.
- School-specific transfer policies remain non-global by design. Every student-facing path should keep directing users to Transferology and the registrar.
- Tuition and residency prices for WGU, UMPI, TESU, Excelsior, Capella, and Purdue Global change frequently; course copy now avoids exact reliance where not re-verified.
