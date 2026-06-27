# Fast Grad Academy Payment Plan Setup

This guide is for John to configure the optional downsell payment plan in Stripe. Codex should not create or modify Stripe products directly.

## Offer

- Product: `Fast Grad Academy — Payment Plan`
- Customer-facing price: `$69/month x 3`
- Total collected: `$207`
- Access: full course access immediately after the first successful checkout payment
- Env var used by the site: `STRIPE_PRICE_ID_PLAN`

## Recommended Stripe Setup

1. Open the Stripe Dashboard.
2. Go to **Product catalog**.
3. Create a new product named `Fast Grad Academy — Payment Plan`.
4. Add a recurring monthly price:
   - Amount: `$69.00`
   - Currency: `USD`
   - Billing period: `Monthly`
5. If Stripe exposes a built-in payment-plan or subscription-end setting, set the plan to end after `3` successful monthly payments.
6. If Stripe does not expose that setting on the price itself, create the recurring price anyway, then use Stripe's subscription schedule / automation tools to cancel after the third paid invoice.
7. Copy the new recurring Price ID. It should look like `price_...`.
8. In Vercel, add:
   - Key: `STRIPE_PRICE_ID_PLAN`
   - Value: the recurring payment-plan Price ID
9. Redeploy the site after saving the env var.

## Code Path

- One-time checkout uses `STRIPE_PRICE_ID` with Stripe Checkout `mode: payment`.
- Payment-plan checkout uses `STRIPE_PRICE_ID_PLAN` with Stripe Checkout `mode: subscription`.
- The webhook grants access on the initial `checkout.session.completed` event.
- Follow-up `invoice.payment_succeeded` events are intentionally ignored for this MVP.
- Purchase tracking logs payment-plan sales with `product: fga-course-plan`.

## Test Checklist

1. Open the landing page with a test UTM, for example:
   `https://fastgradacademy.com/?utm_source=test&utm_campaign=payment-plan`
2. Click **Start Plan**.
3. Confirm Stripe Checkout shows `$69.00` monthly.
4. Complete a test checkout.
5. Confirm the buyer receives an access code.
6. Confirm Supabase `access_codes` has the buyer row.
7. Confirm Supabase `purchase_log` has:
   - `product = fga-course-plan`
   - `amount_cents = 6900`
   - UTM fields populated or `direct`

## MVP Limitation

The site does not revoke course access if later payment-plan invoices fail. That is intentional for this MVP and should be handled manually in Stripe/Supabase until a future revocation workflow is built.
