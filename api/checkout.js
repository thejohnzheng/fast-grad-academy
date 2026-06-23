// ═══════════════════════════════════════════════════════════
// STRIPE CHECKOUT SESSION CREATOR
// POST /api/checkout — creates a Stripe Checkout session for $197 guide
// Returns { url } to redirect the buyer to Stripe
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, tracking } = req.body || {};
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fastgradacademy.com';

    // Build metadata with tracking params for attribution
    const metadata = { product: 'fast_grad_academy_guide' };
    if (tracking) {
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid'].forEach(k => {
        if (tracking[k]) metadata[k] = tracking[k];
      });
    }

    // Append tracking params to success URL for conversion tag
    const successParams = new URLSearchParams({ purchased: 'true' });
    if (tracking && tracking.gclid) successParams.set('gclid', tracking.gclid);

    const sessionParams = {
      mode: 'payment',
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/guide?${successParams.toString()}`,
      cancel_url: `${siteUrl}/#pricing`,
      metadata,
    };

    // Pre-fill email if provided
    if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
