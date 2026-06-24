# Fast Grad Academy Full Link Audit

Audit branch: `fga-main-polish-on-latest`
Audit base: `406c980 fix: normalize accelerated cost range to canonical $5,000-$6,000`
Audit date: 2026-06-24

## Scope And Method

Files audited: `ch1.html` through `ch12.html`, `tracker.html`, `resources.html`, `guide.html`.

- Parsed every `<a href=...>` and `<img src=...>` in scope.
- Internal page/file references were checked against local files; internal anchors were checked against local element IDs where a fragment was present.
- External HTTP(S) URLs were checked with `curl -sI --max-time 12 -A "Mozilla/5.0 FGA-Link-Audit/1.0"`.
- Accepted external statuses for this audit: `200`, `301`, `302`.
- `mailto:`/`tel:` links were counted as links but skipped for HTTP verification.

## Summary

| Metric | Count | Status |
|---|---:|---|
| Files audited | 15 | OK |
| Total link instances | 1245 | OK |
| Unique external HTTP(S) URLs | 110 | OK |
| External URLs accepted by HEAD | 89 | OK |
| External URLs flagged by HEAD | 21 | Needs review |
| Unique internal/local references | 46 | OK |
| Broken internal/local links | 0 | OK |
| Broken link instances, all causes | 207 | Needs review |
| Total image instances | 7 | OK |
| Broken images | 0 | OK |

## Per-File Summary

| File | Link instances | Image instances | Broken/flagged link instances | Broken images |
|---|---:|---:|---:|---:|
| `ch1.html` | 77 | 0 | 16 | 0 |
| `ch2.html` | 31 | 1 | 0 | 0 |
| `ch3.html` | 124 | 0 | 25 | 0 |
| `ch4.html` | 86 | 2 | 29 | 0 |
| `ch5.html` | 202 | 2 | 37 | 0 |
| `ch6.html` | 74 | 0 | 3 | 0 |
| `ch7.html` | 147 | 1 | 24 | 0 |
| `ch8.html` | 54 | 0 | 4 | 0 |
| `ch9.html` | 101 | 0 | 19 | 0 |
| `ch10.html` | 117 | 0 | 23 | 0 |
| `ch11.html` | 99 | 1 | 8 | 0 |
| `ch12.html` | 76 | 0 | 18 | 0 |
| `tracker.html` | 12 | 0 | 0 | 0 |
| `resources.html` | 11 | 0 | 0 | 0 |
| `guide.html` | 34 | 0 | 1 | 0 |

## Broken Or Flagged Links

No broken internal page/file links were found. All flagged links below are external URLs whose `curl -sI` response was not `200`, `301`, or `302`. Several are likely HEAD/bot blocking (`403`) or timeout/network-blocked (`000`), but they should be manually browser-checked before launch.

| Status | URL | Instances | Files | Sample link text |
|---:|---|---:|---|---|
| 000 | https://www.washingtonpost.com/education/2026/04/19/accelerated-college-degree-hacking/ | 4 | ch1.html, ch12.html | Washington Post |
| 303 | https://www.jobs-ups.com/ | 2 | ch11.html | UPS |
| 307 | https://www.comptia.org | 2 | ch3.html, ch5.html | CompTIA |
| 403 | https://aliabdaal.com/studying/the-ultimate-guide-to-studying-for-exams/ | 1 | ch8.html | ▶ Recommended Course (Free, 3 Hours) Evidence-Based Study Techniques — Complete Course Ali Abdaal — Cambridge-trained doctor, 5M+ subscribers |
| 403 | https://careers.bankofamerica.com/en-us/benefits | 1 | ch11.html | Bank of America |
| 403 | https://cdhe.colorado.gov/students/preparing-for-college/concurrent-enrollment | 2 | ch6.html | Concurrent Enrollment |
| 403 | https://chatgpt.com | 9 | ch7.html, ch9.html | ChatGPT |
| 403 | https://claude.ai | 5 | ch9.html | Claude |
| 403 | https://modernstates.org | 41 | ch1.html, ch10.html, ch4.html, ch7.html, ch8.html, ch9.html, guide.html | Modern States |
| 403 | https://modernstates.org/ | 1 | ch4.html | ▶ Start Here — It's Free Modern States — Freshman Year for Free modernstates.org — Free CLEP prep + free exam vouchers + zero risk |
| 403 | https://study.com | 33 | ch1.html, ch10.html, ch11.html, ch3.html, ch5.html, ch7.html | Study.com |
| 403 | https://www.hesc.ny.gov/pay-for-college/financial-aid/types-of-financial-aid/nys-grants-scholarships-awards/the-excelsior-scholarship/ | 2 | ch11.html | New York Excelsior Scholarship |
| 403 | https://www.ibo.org | 32 | ch1.html, ch3.html, ch5.html | IB |
| 403 | https://www.pmi.org/certifications/project-management-pmp | 1 | ch12.html | PMP |
| 403 | https://www.prometric.com | 2 | ch5.html | Prometric |
| 403 | https://www.prometric.com/test-takers/search/dsst | 1 | ch7.html | prometric.com/dsst |
| 403 | https://www.quizlet.com | 2 | ch9.html | Quizlet |
| 403 | https://www.snhu.edu | 5 | ch10.html | Southern New Hampshire University |
| 403 | https://www.transferology.com | 30 | ch1.html, ch10.html, ch3.html, ch4.html, ch5.html, ch6.html, ch7.html | Transferology.com |
| 403 | https://www.wgu.edu | 30 | ch1.html, ch10.html, ch12.html, ch3.html, ch5.html | WGU |
| 403 | https://www.worldcampus.psu.edu/ | 1 | ch12.html | Penn State |

## Flagged Link Status Counts

| HTTP/status | Link instances |
|---:|---:|
| 000 | 4 |
| 303 | 2 |
| 307 | 2 |
| 403 | 199 |

## Image Audit

All images in audited files are local assets and all referenced files exist. No external `<img src=...>` URLs were found.

| Status | File | Image source | Alt text |
|---|---|---|---|
| OK | `ch2.html` | `img/emotional-cycle.svg` | The Emotional Cycle of Change — from uninformed optimism through the valley of despair to pushing through |
| OK | `ch4.html` | `img/screenshot-clep.jpg` | CLEP — College Board: Register for exams accepted at 2,900 colleges |
| OK | `ch4.html` | `img/screenshot-modernstates.jpg` | Modern States — Free college credit prep and free CLEP exam vouchers |
| OK | `ch5.html` | `img/screenshot-dsst.jpg` | DSST — Register for exams at a national test center |
| OK | `ch5.html` | `img/screenshot-ap.jpg` | AP Students — College Board: Get the most out of AP, 2026 exam dates |
| OK | `ch7.html` | `img/screenshot-transferology.jpg` | Transferology — See how your credits transfer to 400+ schools |
| OK | `ch11.html` | `img/cost-comparison.svg` | Cost comparison — traditional college $216,000+ vs Fast Grad path $5,000–$6,000 |

## Internal Link Result

| Check | Result |
|---|---|
| Internal page/file existence | OK: all internal page/file links resolve to local files |
| Internal fragment anchors | OK: all checked local fragments resolve to IDs/named anchors |
| Local image files | OK: all local image paths exist |

## Notes

- `403` responses are common for sites that block HEAD requests or non-browser clients; they are still flagged because this audit criterion required `curl -sI` to return `200`, `301`, or `302`.
- `303` and `307` are redirects, but they are listed as flagged because the accepted set specified for this audit was `200`, `301`, or `302`.
- The prior untracked `PRE_LAUNCH_AUDIT.md` was not part of this audit commit.
