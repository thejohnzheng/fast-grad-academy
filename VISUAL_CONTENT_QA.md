# Visual & Content QA

Scope: `index.html`, `guide.html`, `ch1.html` through `ch12.html`, plus shared CSS.

## Summary

- White-on-white rendering bugs confirmed in the chapter and guide content blocks below.
- No malformed encoding artifacts found. Raw en-dashes, em-dashes, and smart quotes are used intentionally throughout the copy and render normally.
- The repeated `color: #fff` / `rgba(255,255,255,...)` values in dark overlays, navs, and pricing/proof components are intentional and were not flagged unless the background is light or translucent-white.

## White Text On Light Background

| File | Line(s) | Affected text | Color values | Background context | Verdict |
|---|---:|---|---|---|---|
| `ch1.html` | 206-209 | `EDUCATION DATA INITIATIVE` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the default white page | Bug |
| `ch1.html` | 297-300 | `THE WASHINGTON POST` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the default white page | Bug |
| `ch2.html` | 232-234 | `A quieter version of the same advice` | `color: #fff`, `rgba(255,255,255,0.65)` | `.calm-note` uses `background: rgba(255,255,255,0.03)` with a white page behind it | Bug |
| `ch3.html` | 206-223 | `Which Path Should You Start With?` and all four option cards | `color: #fff`, `rgba(255,255,255,0.6)` | `.decision-tree` and nested cards use `background: rgba(255,255,255,0.03/0.04)` on the white page | Bug |
| `ch8.html` | 204-207 | `PSYCHOLOGICAL SCIENCE` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the default white page | Bug |
| `ch8.html` | 342-344 | `If You Have ADHD or Struggle to Focus` | `color: #fff`, `rgba(255,255,255,0.75)` | `.adhd-track` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `ch10.html` | 469-471 | `The Realistic Path Most Students Can Sustain` | `color: #fff`, `rgba(255,255,255,0.65)` | Inline block uses `background: rgba(255,255,255,0.04)` before the dark timeline section starts | Bug |
| `ch11.html` | 213-216 | `EDUCATION DATA INITIATIVE` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `ch11.html` | 221-224 | `FEDERAL RESERVE BOARD` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `ch11.html` | 297-300 | `GEORGETOWN CEW` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `ch12.html` | 206-209 | `NACE` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `ch12.html` | 400-403 | `THE WASHINGTON POST` / `Read the full article →` | `color: rgba(255,255,255,0.4)`, `rgba(255,255,255,0.85)`, `rgba(255,255,255,0.5)` | `.source-card` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |
| `guide.html` | 390-394 | `Start Here Tonight` / `Modern States` | `color: #fff`, `rgba(255,255,255,0.68)`, `color: #fff` | `.start-here` uses `background: rgba(255,255,255,0.03)` on the white page | Bug |

## Intentional White Text

The following white-text occurrences are on clearly dark overlays, dark cards, or full-bleed dark sections and are therefore intentional:

- Access gates in `ch1.html`, `ch2.html`, `ch3.html`, `ch4.html`, `ch5.html`, `ch6.html`, `ch7.html`, `ch8.html`, `ch9.html`, `ch10.html`, `ch11.html`, `ch12.html`, and `guide.html`
- `index.html` dark sections such as pricing, proof wall, final CTA, and the dark utility controls
- `ch10.html` timeline wrapper and phase/stat cards
- `ch6.html` prompt box

## Encoding / Typography Audit

- `rg -Prn "\\xe2\\x80\\x93"` style checks found many en-dashes in chapter headings and body copy.
- Smart quotes, em-dashes, and apostrophes are also used deliberately in the editorial copy.
- No mojibake, replacement characters, or broken UTF-8 artifacts were found.

## Verdict

The rendering problem is real: several chapter and guide callouts are styled with near-white text on translucent-white blocks that sit on the default white page, making them effectively unreadable.
