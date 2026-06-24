// ═══════════════════════════════════════════════════════════
// STRIPE CHECKOUT SESSION CREATOR
// POST /api/checkout — creates a Stripe Checkout session for $197 guide
// Returns { url } to redirect the buyer to Stripe
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';

const ALLOWED_ORIGIN = 'https://fastgradacademy.com';
const RATE_LIMIT = { limit: 20, windowMs: 60 * 1000 };
const checkoutHits = new Map();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TRACKING_KEYS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'gbraid',
  'wbraid',
  'fbclid',
  'msclkid',
  'referrer',
  'landing_page',
  'funnel',
]);

function send(res, status, body) {
  return res.status(status).json(body);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (!origin || origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    return true;
  }

  return false;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(req, scope) {
  const key = `${scope}:${clientIp(req)}`;
  const now = Date.now();
  const current = checkoutHits.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + RATE_LIMIT.windowMs };
    checkoutHits.set(key, next);
    return { allowed: true, remaining: RATE_LIMIT.limit - 1, resetAt: next.resetAt };
  }

  current.count += 1;
  return {
    allowed: current.count <= RATE_LIMIT.limit,
    remaining: Math.max(0, RATE_LIMIT.limit - current.count),
    resetAt: current.resetAt,
  };
}

function setRateHeaders(res, rate) {
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT.limit));
  res.setHeader('X-RateLimit-Remaining', String(rate.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rate.resetAt / 1000)));
  res.setHeader('X-RateLimit-Policy', `${RATE_LIMIT.limit};w=${Math.floor(RATE_LIMIT.windowMs / 1000)}`);
}

function readBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
      } catch {
        throw new Error('Malformed JSON body');
      }
    }
    throw new Error('Request body must be a JSON object');
  }

  return req.body;
}

function cleanString(value, maxLength = 180) {
  if (typeof value !== 'string') return undefined;
  const cleaned = value
    .trim()
    .replace(/[^\x20-\x7E]/g, '')
    .slice(0, maxLength);
  return cleaned || undefined;
}

function sanitizeTracking(body) {
  const source = {};

  if (body.tracking !== undefined) {
    if (!body.tracking || typeof body.tracking !== 'object' || Array.isArray(body.tracking)) {
      throw new Error('tracking must be an object');
    }
    Object.assign(source, body.tracking);
  }

  for (const key of TRACKING_KEYS) {
    if (body[key] !== undefined) source[key] = body[key];
  }

  const tracking = {};
  for (const [key, value] of Object.entries(source).slice(0, 16)) {
    if (!TRACKING_KEYS.has(key)) continue;
    const cleaned = cleanString(value);
    if (cleaned) tracking[key] = cleaned;
  }

  return tracking;
}

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!corsAllowed) {
    return send(res, 403, { error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const rate = checkRateLimit(req, 'checkout');
  setRateHeaders(res, rate);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rate.resetAt - Date.now()) / 1000)));
    return send(res, 429, { error: 'Too many checkout attempts. Please try again shortly.' });
  }

  try {
    const body = readBody(req);
    const email = cleanString(body.email, 254);
    const tracking = sanitizeTracking(body);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fastgradacademy.com';
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRICE_ID;

    if (email && !EMAIL_RE.test(email)) {
      return send(res, 400, { error: 'Enter a valid email address.' });
    }

    if (!secretKey || !priceId) {
      return send(res, 503, { error: 'Checkout is not configured.' });
    }

    const metadata = {
      product: 'fast_grad_academy_guide',
      ...tracking,
    };

    // Append tracking params to success URL for conversion tag
    const successParams = new URLSearchParams({ purchased: 'true' });
    if (tracking.gclid) successParams.set('gclid', tracking.gclid);

    const sessionParams = {
      mode: 'payment',
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${siteUrl.replace(/\/$/, '')}/confirmation.html?${successParams.toString()}`,
      cancel_url: `${siteUrl.replace(/\/$/, '')}/#pricing`,
      metadata,
    };

    if (email) {
      sessionParams.customer_email = email;
    }

    const stripe = new Stripe(secretKey);
    const session = await stripe.checkout.sessions.create(sessionParams);

    return send(res, 200, { url: session.url });
  } catch (err) {
    console.error('Checkout error:', err.message);
    const status = /body|tracking|json/i.test(err.message) ? 400 : 500;
    return send(res, status, {
      error: status === 400 ? err.message : 'Failed to create checkout session',
    });
  }
}
