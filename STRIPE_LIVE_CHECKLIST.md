# Stripe Live Switchover Checklist

Use this checklist when switching Fast Grad Academy from test checkout to live Stripe payments.

## Current Code Path

- Checkout endpoint: `POST /api/checkout`
- Serverless file: `api/checkout.js`
- Stripe SDK: `stripe` npm package, imported with `import Stripe from 'stripe';`
- Checkout type: Stripe Checkout Session, not a Payment Intent created directly
- Mode: `payment`
- Payment methods: `card`
- Promotion codes: enabled
- Price source: `process.env.STRIPE_PRICE_ID`
- Success URL: `${NEXT_PUBLIC_SITE_URL || 'https://fastgradacademy.com'}/guide?purchased=true`
- Cancel URL: `${NEXT_PUBLIC_SITE_URL || 'https://fastgradacademy.com'}/#pricing`
- Webhook file: `api/webhook.js`
- Webhook event handled: `checkout.session.completed`

## Stripe Dashboard Steps

1. Open Stripe Dashboard in live mode.
2. Create or confirm the product:
   - Product name: `Fast Grad Academy Guide`
   - Price: `$197.00`
   - Currency: `USD`
   - Billing type: one-time
3. Copy the live price ID:
   - Expected format: `price_...`
   - This becomes `STRIPE_PRICE_ID`.
4. Open Developers -> API keys.
5. Copy the live secret key:
   - Expected format: `sk_live_...`
   - This becomes `STRIPE_SECRET_KEY`.
6. Open Developers -> Webhooks.
7. Create or confirm the webhook endpoint:
   - Endpoint URL: `https://fastgradacademy.com/api/webhook`
   - Events: `checkout.session.completed`
8. Copy the webhook signing secret:
   - Expected format: `whsec_...`
   - This becomes `STRIPE_WEBHOOK_SECRET`.

## Vercel Production Environment Variables

Set these for the Production environment.

```text
NEXT_PUBLIC_SITE_URL=https://fastgradacademy.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Confirm these existing non-Stripe dependencies are also set, because the webhook needs them to deliver access after payment.

```text
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=re_...
FROM_EMAIL=Fast Grad Academy <noreply@fastgradacademy.com>
```

Important: the current checkout code does **not** read `STRIPE_PUBLISHABLE_KEY`. Do not block launch on that variable unless the code changes.

## Deploy Steps

1. Save the Vercel environment variables.
2. Redeploy Production from `main`.
3. Confirm the deployed site is public:
   - `https://fastgradacademy.com/`
   - It should not show a password gate.
4. Confirm checkout endpoint is configured:
   - `POST https://fastgradacademy.com/api/checkout`
   - Expected success shape: `{ "url": "https://checkout.stripe.com/..." }`
   - A `503` with `Checkout is not configured.` means `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` is missing.
5. Run a live low-risk checkout verification with Stripe Dashboard open:
   - Click `Get The Guide`.
   - Confirm redirect goes to Stripe Checkout.
   - Confirm the Stripe Checkout page shows the `$197` one-time price.
   - Complete the payment only when the coordinator approves.
6. After payment, confirm redirect:
   - Expected URL: `https://fastgradacademy.com/guide?purchased=true`
7. Confirm webhook delivery in Stripe:
   - Event: `checkout.session.completed`
   - Response: `200`
8. Confirm Supabase access code insert:
   - Table: `access_codes`
   - Required fields populated: `email`, `access_code`, `stripe_payment_id`, `stripe_customer_id`
9. Confirm customer email delivery:
   - Email contains `FGA-XXXX-XXXX` access code.
   - Guide login accepts the checkout email plus code.

## Failure Checks

- Checkout returns `403 Origin not allowed`:
  - Request origin is not `https://fastgradacademy.com`.
- Checkout returns `405 Method not allowed`:
  - Endpoint was called with something other than `POST`.
- Checkout returns `503 Checkout is not configured.`:
  - Missing `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID`.
- Webhook returns `503 Webhook is not configured`:
  - Missing `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET`.
- Webhook returns `400 Missing Stripe signature`:
  - Request did not come from Stripe or signing header is missing.
- Webhook returns signature verification error:
  - `STRIPE_WEBHOOK_SECRET` does not match the live Stripe endpoint signing secret.
- Payment succeeds but no access code appears:
  - Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Access code stored but customer email missing:
  - Check `RESEND_API_KEY`, `FROM_EMAIL`, and Resend domain status.

## Final Launch Readiness

- `origin/main` is deployed.
- `STRIPE_SECRET_KEY` uses `sk_live_...`, not `sk_test_...`.
- `STRIPE_PRICE_ID` points to the live `$197` one-time price.
- `STRIPE_WEBHOOK_SECRET` is from the live webhook endpoint.
- Stripe webhook endpoint is `https://fastgradacademy.com/api/webhook`.
- Live site checkout button redirects to Stripe.
- Webhook creates a Supabase access code.
- Customer receives access email.
- `/guide` accepts email plus access code.
