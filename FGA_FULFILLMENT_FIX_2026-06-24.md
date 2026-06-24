# FGA Post-Checkout Fulfillment Fix

**Date:** 2026-06-24
**Agent:** FGA-07
**Branch:** `fga-07-fulfillment-fix` (off `main`)
**File changed:** `api/webhook.js` (plus this doc)
**Scope:** webhook/fulfillment pipeline only. No frontend, CSS, page structure, or Stripe product/price config touched.

---

## Symptom

A live $0.00 checkout (100%-off promo code `FGA_TEST_FREE_01`, buyer `johnzhengmn@gmail.com`)
completed in Stripe on 2026-06-24, but no access-code email or sale notification arrived. The chain
breaks somewhere after Stripe fires `checkout.session.completed`.

## Audit findings

### 1. Raw-body reading was fragile — most likely cause of a `400` at the webhook
`stripe.webhooks.constructEvent()` must verify the signature against the **exact raw bytes** Stripe
sent. The old code read the body via `req.on('data')` listeners and relied solely on
`export const config = { api: { bodyParser: false } }`. That `config` export is the **Next.js**
convention; this project is a static site with plain Vercel functions. If Vercel's Node runtime
parses the body first, the stream is already consumed and the listener resolves to an **empty
Buffer** → `constructEvent` throws → Stripe records a `400` and nothing downstream runs.

**Fix:** `readRawBody()` now defends against every case — a `Buffer` body, a string body, a still-
readable stream (`for await`), and (last resort, logged loudly) a pre-parsed object. It also guards
explicitly against an empty payload with a clear log line. The `bodyParser: false` config export is
kept (harmless if ignored, correct if honored).

### 2. Email casing mismatch — latent "code doesn't work" bug
The webhook inserted the buyer email **verbatim** from Stripe, but `/api/verify` looks the row up
with a **lowercased** email (`email.trim().toLowerCase()`) and `is_active = true`. A mixed-case
checkout email would store a row that could never be verified at `/guide`.

**Fix:** the webhook now stores `email.trim().toLowerCase()`, matching the verify lookup. (`is_active`
defaults to `true` and `access_count` to `0` in both schema files, so those were already fine.)

### 3. Retry/status behavior
The old handler returned `400/500/503` on downstream failures, which makes Stripe retry the same
event repeatedly.

**Fix (per task spec):** once the **signature is verified**, the handler **always returns `200`** —
even if Supabase or Resend fails — so retries don't pile up. Pre-verification problems still return
non-2xx so they surface and Stripe retries after a fix:
- `405` — non-POST
- `503` — missing `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` (cannot verify)
- `400` — missing `stripe-signature` header, empty body, or signature verification failure
- `200` — verified event: success, idempotent duplicate, unhandled event type, **and** any
  downstream (Supabase/Resend) failure (logged with full recovery context)

**Trade-off to know:** a *transient* Supabase outage during fulfillment now returns `200`, so Stripe
will **not** auto-retry it. Recovery is safe and easy because (a) every failure logs the generated
`code`, `email`, `payment`, and `session`, and (b) the Supabase write is idempotent on
`stripe_payment_id` — so you can replay it from **Stripe → Webhooks → the event → Resend**. If you'd
rather have Stripe auto-retry transient DB errors, flip the two Supabase-error branches
(`idempotency_lookup_failed`, `insert_failed`) back to `500`.

### 4. Logging
Every step now logs with a consistent `[webhook]` prefix and context (event id/type, session,
payment, email, generated code). An `auditEnv()` call logs **which** required env vars are missing
(names only, never values) so a misconfiguration is obvious in Vercel logs. All 13 diagnostic log
strings referenced in `FGA_STRIPE_TEST_HANDOFF_2026-06-24.md` are preserved.

### Confirmed already-correct (no change needed)
- `$0` coupon path: `payment_intent` is absent, so `paymentId` falls back to `session.id` (unique).
- Idempotency on `stripe_payment_id` + access-code collision retry loop.
- Email failures are non-critical (caught; code stays stored).
- All six env vars are referenced correctly across the pipeline (see checklist).

## Environment variables (must all be set in Vercel → fga-site → Settings → Environment Variables)

| Var | Used by | Required for |
|-----|---------|--------------|
| `STRIPE_SECRET_KEY` | checkout.js, webhook.js | create session + verify signature |
| `STRIPE_WEBHOOK_SECRET` | webhook.js | verify signature (the **exact** signing secret of the `https://fastgradacademy.com/api/webhook` endpoint) |
| `STRIPE_PRICE_ID` | checkout.js | line item (`price_1TOGG7BgwJmZP6dj1dT9cLhl`) |
| `SUPABASE_URL` | webhook.js, verify.js | store/lookup access codes |
| `SUPABASE_SERVICE_ROLE_KEY` | webhook.js, verify.js | service-role DB access |
| `RESEND_API_KEY` | webhook.js | send emails |
| `FROM_EMAIL` | webhook.js | sender; defaults to `Fast Grad Academy <noreply@fastgradacademy.com>` if unset — **the domain must be verified in Resend or all email fails** |

The code references all of these correctly; none were renamed. If email still doesn't arrive after a
Supabase row appears, the issue is Resend domain/sender verification (`FROM_EMAIL` domain), not the code.

## Test path (after deploy)

1. **Stripe → Developers → Webhooks →** the `fastgradacademy.com/api/webhook` endpoint **→ Send test
   webhook → `checkout.session.completed`.**
2. **Vercel → fga-site → Logs**, filter `/api/webhook`. Expect:
   - `[webhook] Verified event id=… type=checkout.session.completed`
   - `[webhook] Fulfilling session=… payment=… email=…`
   - `[webhook] Stored access code FGA-XXXX-XXXX for …`
   - `[webhook] Access code FGA-XXXX-XXXX sent to …`
   - `[webhook] Sale notification sent to johnzhengmn@gmail.com`
   - If anything is misconfigured, look for `[webhook] Missing required env vars: …` or
     `[webhook] Empty request body …` (raw-body/bodyParser) or
     `[webhook] Webhook signature verification failed …` (wrong `STRIPE_WEBHOOK_SECRET`).
   - Note: Stripe's synthetic "Send test webhook" payload has no real customer email, so it will log
     `No email found in checkout session` and return `200`. For a true end-to-end test, run a real
     $0 coupon checkout (which carries `customer_details.email`).
3. **Supabase → `access_codes`**: confirm a new row (lowercased `email`, `access_code` starts `FGA-`,
   `stripe_payment_id` = session/payment id).
4. **Resend → Logs**: confirm the customer email (`You just made the smartest investment…`) and the
   sale notification (`New FGA Sale! …`).
5. **`/guide`**: enter the email + access code and confirm the gate unlocks.

## Recommended follow-up (not done here — out of code scope)
- Run one real `$1` or `$197` live card test + refund to validate settlement (the $0 coupon path
  does not exercise card charge/refund).
- Verify the `FROM_EMAIL` domain in Resend if it isn't already.
