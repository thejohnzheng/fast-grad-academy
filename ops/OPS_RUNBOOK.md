# Fast Grad Academy — Operations Runbook

**Owner:** Autonomous Agent (Jarvis OS)
**Last updated:** 2026-06-23
**Repo:** github.com/thejohnzheng/fast-grad-academy (branch: main)
**Live site:** fastgradacademy.com
**Stripe account:** acct_1S0oQsPUXG3LAWX2

---

## 1. Deployment

### Normal deploy flow

Push to `main` triggers Vercel auto-deploy. There is no CI/CD pipeline, no build step, no test suite.

```
git add <files>
git commit -m "description of change"
git push origin main
```

### Verify a deploy

1. Open Vercel dashboard: https://vercel.com/thejohnzheng
2. Find the `fast-grad-academy` project.
3. Check the most recent deployment status. Green = live. Red = failed.
4. Visit https://fastgradacademy.com and hard-refresh (Ctrl+Shift+R) to bypass CDN cache.
5. Spot-check at least one chapter page and the landing page.

### Rollback

**Option A — Revert commit (preferred):**
```bash
git revert HEAD
git push origin main
```
This creates a new commit undoing the last change. Vercel auto-deploys.

**Option B — Reset to known-good commit:**
```bash
git reset --hard <commit-hash>
git push --force origin main
```

**Known restore points:**
- `f14d744` — "Clean Slate" pre-redesign baseline (April 16, 2026)
- `26a0707` — Post-redesign with full content elevation, cache v9
- `dec419f` — Launch-ready with password gate removed, conversion tracking added

Use Option B only when Option A won't fix the issue. Force-push rewrites history.

### Rollback via Vercel UI

If git access is unavailable:
1. Open Vercel dashboard → Deployments tab.
2. Find the last working deployment.
3. Click the three-dot menu → "Promote to Production."

---

## 2. Stripe Operations

### Current state

- **Account:** acct_1S0oQsPUXG3LAWX2
- **Mode:** TEST (as of June 23, 2026)
- **FGA product price:** $197 one-time
- **Public business name:** "Fast Grad Academy"
- **Statement descriptor:** "FAST GRAD ACADEMY"

### Going live — step by step

1. Log into https://dashboard.stripe.com
2. Complete account activation (requires business info, bank account, ID verification).
3. Toggle from "Test mode" to "Live mode" in the dashboard header.
4. Create the live product:
   - Products → Add product
   - Name: "Fast Grad Academy Course"
   - Price: $197.00, one-time
   - Create a Payment Link for this product
5. Generate live API keys:
   - Developers → API keys
   - Copy the **Publishable key** (pk_live_...)
   - Copy the **Secret key** (sk_live_...) — store securely, never commit to git
6. Set up webhook:
   - Developers → Webhooks → Add endpoint
   - URL: `https://fastgradacademy.com/api/webhook` (or the Vercel function URL)
   - Events to listen for: `checkout.session.completed`, `charge.refunded`
   - Copy the **Webhook signing secret** (whsec_...)

### Environment variables

Set these in Vercel (Settings → Environment Variables):

| Variable | Source | Notes |
|----------|--------|-------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | sk_live_... |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys | pk_live_... |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | whsec_... |

After setting env vars, redeploy for them to take effect:
```bash
# Trigger a redeploy without code changes
git commit --allow-empty -m "redeploy: env var update"
git push origin main
```

### Handling refund requests

1. Open Stripe Dashboard → Payments.
2. Find the payment by customer email or payment ID.
3. Click the payment → "Refund" button.
4. Select full or partial refund. Add internal note with reason.
5. If the student has course access, revoke it:
   - Go to Supabase → `access_codes` table.
   - Find the row by email.
   - Delete the row or set `revoked = true`.

### Checking webhook logs

1. Stripe Dashboard → Developers → Webhooks.
2. Click the endpoint URL.
3. View "Attempted events" — each shows status code, timestamp, and payload.
4. Filter by event type or status (succeeded / failed).
5. For failed events: click the event → "Resend" to retry.

### Webhook failure triage

If webhook delivery is failing consistently:
1. Check the HTTP status code. 4xx = your endpoint is rejecting it. 5xx = server error.
2. Check Vercel function logs (Vercel Dashboard → Logs) for the corresponding error.
3. Verify the endpoint URL matches the deployed function path.
4. Verify `STRIPE_WEBHOOK_SECRET` env var matches the signing secret shown in Stripe.

---

## 3. Content Updates

### File structure

```
/
  index.html          — Landing page (light theme, inline CSS)
  guide.html          — Course guide page
  ch1.html ... ch12.html — Chapter pages (dark theme, shared CSS)
  course.css          — Shared stylesheet for all chapter pages
  checkout.js         — Stripe checkout logic
  img/                — Images and assets
  api/                — Vercel serverless functions
```

### Updating chapter content

1. Open the target chapter file (e.g., `ch7.html`).
2. Make edits. Preserve all existing sections — never remove content without checking the source of truth spreadsheet (`FGA_Source_of_Truth_Exams_Facts.xlsx`).
3. If editing CSS classes or structure, test locally first.

### CSS cache busting

**This is critical.** Vercel CDN caches aggressively. If you change `course.css`, users will not see updates until the cache version is bumped.

Procedure:
1. Make your changes to `course.css`.
2. Determine the current version number by checking any chapter file for `course.css?v=N`.
3. Increment N by 1.
4. Update the `?v=N` parameter in **every HTML file** that references course.css.

```bash
# Find current version
grep -r "course.css?v=" *.html

# Replace across all files (example: v9 → v10)
sed -i 's/course\.css?v=9/course.css?v=10/g' *.html
```

5. Commit all changed files together in one commit.

### Design tokens

These are defined in `:root` of `course.css`:

**Use these:**
| Token | Purpose |
|-------|---------|
| `--bg` | Background |
| `--bg-soft` | Soft background |
| `--bg-panel` | Panel background |
| `--bg-warm` | Warm background accent |
| `--ink` | Primary text |
| `--ink-dim` | Dimmed text |
| `--ink-mute` | Muted text |
| `--line` | Borders and lines |
| `--dark-bg` | Dark theme background (chapters) |
| `--dark-fg` | Dark theme foreground (chapters) |
| `--dark-dim` | Dark theme dimmed text |
| `--dark-mute` | Dark theme muted text |
| `--serif` | Instrument Serif |
| `--sans` | Inter |
| `--mono` | JetBrains Mono |

**NEVER use these (dead vars from old dark glassmorphism theme):**
- `--font-d`, `--white`, `--muted`, `--dim`
- These are undefined and will cause invisible text.

### Theme rules

- **Landing page (index.html):** Light theme. Has its own inline CSS. Does not use `course.css`.
- **Chapter pages (ch1-ch12.html):** Dark theme. All share `course.css`.
- **Guide page (guide.html):** Check which theme it uses before editing.

### Checklist items rendering

Checklist items are rendered by JavaScript as `.ac-item` divs, NOT `<li>` elements. CSS selectors must target `.ac-items .ac-item`, not `.ac-items li`.

---

## 4. Quarterly Audit Checklist

Run this audit every 3 months. The goal is to ensure all facts, prices, and statistics cited on the site are still accurate.

### Baseline

Use `FGA_Source_of_Truth_Exams_Facts.xlsx` as the master reference. It contains:
- Sheet "Content Source of Truth": Every section in every chapter with category and status.
- Sheet "Summary": Per-chapter section counts.
- Sheet "Legend": Category definitions.

### Price checks

| Item | Where to verify | Current price |
|------|-----------------|---------------|
| CLEP exams | https://clep.collegeboard.org | Check each exam fee |
| DSST exams | https://getcollegecredit.com | Check each exam fee |
| Sophia Learning | https://sophia.org | $79/month |
| Study.com | https://study.com | $199/month |
| StraighterLine | https://straighterline.com | $99/month |
| Saylor Academy | https://saylor.org | Free |

### Statistics checks

| Statistic | Source |
|-----------|--------|
| Student debt totals / averages | https://educationdata.org |
| Employer survey data (skills vs. degree) | https://naceweb.org |
| Credit-by-exam acceptance rates | https://getcollegecredit.com |

### Audit procedure

1. Open each source URL. Record the current values.
2. Compare against the spreadsheet baseline.
3. For any changed value:
   a. Update the spreadsheet with the new value and the date checked.
   b. Find every HTML file that cites the old value.
   c. Update the HTML with the new value.
   d. Add a qualifier if the stat is approximate (e.g., "as of 2026").
4. Bump CSS cache version if any chapter HTML was changed.
5. Commit all changes in one commit with message: `audit: quarterly fact/price update YYYY-QN`.

### What to look for

- CLEP/DSST exam fee increases (College Board raises these periodically).
- Provider pricing changes (Sophia, Study.com, StraighterLine often run promotions or change tiers).
- Student debt statistics change annually — make sure we cite the most recent year.
- Employer survey methodology changes at NACE.

---

## 5. Troubleshooting

### Vercel deploy failure

**Symptoms:** Push succeeds but Vercel shows red deployment.

**Steps:**
1. Check Vercel Dashboard → Deployments → click the failed deploy → read the build log.
2. Common causes:
   - `vercel.json` schema error: Validate JSON syntax. Check for deprecated properties (Vercel removes old config keys without warning).
   - File path case mismatch: Linux (Vercel) is case-sensitive. `Img/hero.png` is not `img/hero.png`.
   - Function runtime error: Check `api/` directory for syntax errors.
3. Fix the issue locally, commit, push again.
4. If the error is unclear, check https://vercel.com/docs/errors for the error code.

### Webhook not firing

**Symptoms:** Student pays but does not get course access.

**Steps:**
1. Stripe Dashboard → Developers → Webhooks → click your endpoint.
2. Check "Attempted events." If no events appear, the webhook is not configured or the URL is wrong.
3. If events show but have non-200 status:
   - Check Vercel Dashboard → Logs for the serverless function error.
   - Verify `STRIPE_WEBHOOK_SECRET` env var matches Stripe.
   - Verify the function parses the Stripe signature correctly.
4. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   stripe trigger checkout.session.completed
   ```

### Student cannot access course

**Symptoms:** Student reports they paid but see the access gate or an error.

**Steps:**
1. Verify payment in Stripe Dashboard → Payments. Search by email.
2. If payment exists:
   a. Check Supabase → `access_codes` table. Search by email.
   b. If no row exists, the webhook failed. Check webhook logs (see above). Manually insert a row.
   c. If row exists, check that the email matches exactly (case-sensitive comparison possible).
3. If the student is on a new device/browser:
   a. Course access may be stored in `localStorage`. Different browser = no stored access.
   b. Have the student re-enter their email on the access page.
4. If the student cleared their browser data, same fix as above.

### CSS not updating

**Symptoms:** You pushed CSS changes but the site looks the same.

**Steps:**
1. Check that `course.css?v=N` was bumped in ALL HTML files, not just one.
   ```bash
   grep -r "course.css?v=" *.html
   ```
   Every file should show the same version number.
2. Hard-refresh the page: Ctrl+Shift+R (or Cmd+Shift+R on Mac).
3. Check Vercel CDN cache headers:
   - Open browser DevTools → Network tab → find `course.css` → check `Cache-Control` header.
   - If `s-maxage` is set high, the CDN is caching. The `?v=N` bump forces a new URL, bypassing this.
4. If still stale, try:
   ```bash
   curl -I "https://fastgradacademy.com/course.css?v=N"
   ```
   Check the `x-vercel-cache` header. `HIT` = CDN cache. `MISS` = fresh.

### Landing page not updating

`index.html` has its own inline CSS. Changes to `course.css` will not affect it. Edit the `<style>` block in `index.html` directly.

### Invisible text on chapter pages

If text appears but is invisible (white-on-white or transparent):
1. Check for dead CSS variables: `--font-d`, `--white`, `--muted`, `--dim`.
2. Replace with: `--serif`, `--ink`, `--ink-mute`, `--ink-dim` respectively.
3. Check for inline `style` attributes using the old dark-theme colors (e.g., `rgba(255,255,255,...)` on a light background).

---

## 6. Security Checklist

Run monthly. Document completion date.

### GitHub

- [ ] **Token rotation:** Check if the Personal Access Token (PAT) is expired or expiring soon. Generate a new one at https://github.com/settings/tokens if needed. Update any systems that use it.
- [ ] **Repository visibility:** Confirm `thejohnzheng/fast-grad-academy` is set to the intended visibility (private or public).
- [ ] **Branch protection:** Verify `main` branch has protection rules if desired (require PR reviews, status checks).
- [ ] **Collaborator audit:** Review who has access to the repo.

### Vercel

- [ ] **Environment variables:** Review all env vars in Vercel project settings. Remove any that are unused. Verify secrets have not been committed to git.
- [ ] **Deployment protection:** Check if preview deployments are publicly accessible (they are by default). Disable if the site contains unpublished content.
- [ ] **Team members:** Audit who has access to the Vercel project.

### Supabase

- [ ] **Access audit:** Review `access_codes` table for anomalies (duplicate emails, suspicious entries, bulk insertions).
- [ ] **API keys:** Check that the `anon` key is only used client-side and the `service_role` key is only in server-side env vars.
- [ ] **Row Level Security (RLS):** Verify RLS policies are enabled on all tables.
- [ ] **Database backups:** Confirm automatic backups are running.

### Domain

- [ ] **Renewal status:** Check expiration date for `fastgradacademy.com` at Network Solutions (User ID: JOZHENBUSINESS95081, Account: 119721720).
- [ ] **Also check:** `fastgradacademy.online` if still owned.
- [ ] **Auto-renewal:** Verify auto-renewal is ON and the payment method on file is valid.
- [ ] **DNS records:** Verify A/CNAME records point to Vercel.
- [ ] **SSL certificate:** Verify HTTPS is working (Vercel handles this automatically, but check).

### Stripe

- [ ] **API key rotation:** Rotate keys if there is any suspicion of compromise. Update env vars in Vercel after rotation.
- [ ] **Webhook signing secret:** Verify it has not been exposed.
- [ ] **Payment method on file:** Verify the card on the Stripe account itself is valid (for Stripe's own fees).

---

## 7. Emergency Procedures

### Site is down

**Detection:** https://fastgradacademy.com returns error or does not load.

**Triage (in order):**

1. **Check Vercel status:** https://www.vercel-status.com/ — if Vercel is having an outage, wait. Nothing you can do.
2. **Check DNS:**
   ```bash
   dig fastgradacademy.com
   nslookup fastgradacademy.com
   ```
   If DNS does not resolve, the domain may have expired or DNS records are misconfigured.
3. **Check Vercel deployment:** Dashboard → is the latest deployment healthy?
4. **Check domain registration:** Log into Network Solutions. Is the domain expired? Is it on hold?

**Fixes:**
- DNS misconfigured → Fix records in Network Solutions DNS panel. Point to Vercel.
- Domain expired → Renew immediately. DNS propagation takes up to 48 hours but is usually minutes.
- Bad deployment → Rollback via Vercel UI (Deployments → find last good → Promote to Production).
- Vercel outage → Wait. Post on social that the site is temporarily down for maintenance.

### Stripe webhook is down

**Detection:** Students are paying but not receiving course access.

**Immediate action:**
1. Check Stripe Dashboard → Webhooks → endpoint → recent events.
2. If events are failing, diagnose per Troubleshooting section above.
3. **While fixing:** Manually grant access for any students who paid.
   - Find their payment in Stripe → get email.
   - Insert row in Supabase `access_codes` table with their email and a generated code.
   - Email the student with their access code.

**Prevention:** Set up Stripe webhook email alerts for persistent failures.

### Domain expired

**Detection:** Site shows registrar parking page or DNS does not resolve.

**Immediate action:**
1. Log into Network Solutions (JOZHENBUSINESS95081 / account 119721720).
2. Renew the domain. If the card on file is declined, use a different payment method.
3. If the domain is in the grace period (usually 30 days after expiration), renew immediately. No data is lost.
4. If the domain is in redemption period (30-90 days after grace), it costs significantly more to recover. Act fast.
5. After renewal, verify DNS records still point to Vercel.

**Prevention:** Enable auto-renewal. Set a calendar reminder 30 days before expiration.

### Data breach response

**If you suspect unauthorized access to any system:**

1. **Contain immediately:**
   - Rotate all Stripe API keys. Update Vercel env vars.
   - Rotate Supabase API keys.
   - Rotate GitHub PAT.
   - Change passwords for Network Solutions, Vercel, Supabase, Stripe.

2. **Assess scope:**
   - Check Stripe for unauthorized charges or refunds.
   - Check Supabase for unauthorized data access (audit logs).
   - Check GitHub for unauthorized commits or branch changes.
   - Check Vercel for unauthorized deployments.

3. **Notify:**
   - If customer payment data was potentially exposed, Stripe handles PCI compliance, but John must be notified immediately.
   - If student emails were exposed, draft a breach notification.

4. **Document:**
   - Record what happened, when it was detected, what was accessed, and what was done.
   - Store the incident report outside the compromised systems.

---

## Appendix: Quick Reference

### Key URLs

| Resource | URL |
|----------|-----|
| Live site | https://fastgradacademy.com |
| Vercel dashboard | https://vercel.com/thejohnzheng |
| Stripe dashboard | https://dashboard.stripe.com |
| GitHub repo | https://github.com/thejohnzheng/fast-grad-academy |
| Network Solutions | https://www.networksolutions.com (User: JOZHENBUSINESS95081) |
| Vercel status | https://www.vercel-status.com |

### Key commits

| Commit | Description |
|--------|-------------|
| `f14d744` | Clean Slate — pre-redesign baseline |
| `26a0707` | Post-redesign, full content elevation, cache v9 |
| `dec419f` | Launch-ready, password gate removed, conversion tracking |

### Env vars checklist

| Variable | Where it goes | Format |
|----------|---------------|--------|
| `STRIPE_SECRET_KEY` | Vercel | sk_live_... or sk_test_... |
| `STRIPE_PUBLISHABLE_KEY` | Vercel | pk_live_... or pk_test_... |
| `STRIPE_WEBHOOK_SECRET` | Vercel | whsec_... |

### Content safety rule

Before ANY content edit: check `FGA_Source_of_Truth_Exams_Facts.xlsx`. After ANY edit: verify all sections marked "Added -- KEEP" still exist. This rule exists because 700+ lines of content were accidentally stripped during a past redesign.
