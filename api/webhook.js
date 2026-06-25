// ═══════════════════════════════════════════════════════════
// STRIPE WEBHOOK → Generate Access Code → Store in Supabase → Send Email via Resend
// Vercel Serverless Function
//
// Fulfillment contract:
//   1. Verify the Stripe signature (raw body required).
//   2. On checkout.session.completed: extract buyer email, generate an access
//      code, store it in Supabase (idempotent on stripe_payment_id), email it.
//   3. ALWAYS return 200 once the signature is verified — even if a downstream
//      step (Supabase / Resend) fails — so Stripe does not pile up retries.
//      Every failure is logged with full recovery context, and the Supabase
//      write is idempotent, so a manual "Resend" from the Stripe dashboard is
//      safe if a transient failure ever needs to be replayed.
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const LOG = '[webhook]';

// Log (names only, never values) which required env vars are missing so Vercel
// logs immediately show a misconfiguration instead of a vague downstream error.
function auditEnv() {
  const required = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'RESEND_API_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`${LOG} Missing required env vars: ${missing.join(', ')}`);
  }
  if (!process.env.FROM_EMAIL) {
    console.warn(`${LOG} FROM_EMAIL not set; falling back to noreply@fastgradacademy.com`);
  }
  return missing;
}

// Generate a clean, premium-feeling access code: FGA-XXXX-XXXX
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I confusion
  let code = 'FGA-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}

// Read the raw request body for Stripe signature verification.
//
// Stripe signs the EXACT bytes it sent, so we must hand constructEvent the raw
// payload — not a re-parsed/re-serialized object. Vercel's Node runtime may or
// may not have already consumed/parsed the stream depending on the bodyParser
// config, so this is defensive across every case:
//   - Buffer already provided      → use it
//   - raw string already provided  → use it
//   - stream still readable        → read it (the expected path: bodyParser off)
//   - stream consumed + parsed     → re-serialize as a last resort (logged loudly)
async function readRawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' && req.body.length) return Buffer.from(req.body, 'utf8');

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length) return Buffer.concat(chunks);

  if (req.body && typeof req.body === 'object') {
    console.error(
      `${LOG} Raw body was pre-parsed and the stream is empty; re-serializing JSON for the ` +
        `signature check. If verification keeps failing, confirm bodyParser is disabled for api/webhook.js.`
    );
    return Buffer.from(JSON.stringify(req.body), 'utf8');
  }

  return Buffer.alloc(0);
}

export async function sendAccessEmail(email, accessCode, providedName) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY');
  }

  // Prefer the customer's name from Stripe; fall back to a name derived from the email prefix.
  const firstName = (providedName && providedName.trim())
    || email.split('@')[0].replace(/[+._\d]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
    || 'there';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'Fast Grad Academy <noreply@fastgradacademy.com>',
      to: [email],
      reply_to: 'hello@fastgradacademy.com',
      subject: "You just made the smartest investment in your education",
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-family:Georgia,serif;font-size:24px;color:#ffffff;letter-spacing:-0.02em;">Fast Grad Academy</div>
    </div>

    <!-- Personal welcome -->
    <div style="font-size:16px;color:rgba(255,255,255,0.85);line-height:1.9;margin-bottom:32px;">
      <p style="margin:0 0 16px;">Hey ${firstName},</p>
      <p style="margin:0 0 16px;">I want you to know — what you just did takes guts. Most people talk about wanting to get ahead. You actually did something about it.</p>
      <p style="margin:0 0 16px;">I built this guide because I wish someone had shown me the playbook when I started. I graduated college at 19, saved over $84,000, and got a 3-year head start on my career — not because I'm smarter than anyone else, but because I found the system's own rules and used them.</p>
      <p style="margin:0 0 16px;">Now you have the same playbook. Every strategy, every shortcut, every resource — it's all yours.</p>
    </div>

    <!-- Access Code Box -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:32px;">
      <div style="font-size:12px;color:#a8a8a8;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:12px;">Your Personal Access Code</div>
      <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:0.1em;padding:16px 0;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);margin:12px 0;">
        ${accessCode}
      </div>
      <div style="font-size:12px;color:#a8a8a8;margin-top:12px;">This code + your email = lifetime access</div>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:28px 0 36px;">
      <a href="https://fastgradacademy.com/guide" style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:16px 44px;border-radius:999px;text-decoration:none;">
        Start The Guide &rarr;
      </a>
    </div>

    <!-- Quick start -->
    <div style="font-size:14px;color:rgba(255,255,255,0.55);line-height:1.8;margin-bottom:32px;">
      <strong style="color:#ffffff;">Getting started is simple:</strong><br/>
      1. Go to <a href="https://fastgradacademy.com/guide" style="color:#c0c0c0;">fastgradacademy.com/guide</a><br/>
      2. Enter your email and access code: <strong style="color:#ffffff;">${accessCode}</strong><br/>
      3. Dive into Chapter 1 — it'll change how you think about college forever
    </div>

    <!-- Closing note -->
    <div style="font-size:15px;color:rgba(255,255,255,0.75);line-height:1.8;margin-bottom:8px;">
      You're about to save yourself years of time and tens of thousands of dollars. I'm genuinely excited for you.
    </div>
    <div style="font-size:15px;color:rgba(255,255,255,0.75);margin-bottom:4px;">— John</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.35);">Founder, Fast Grad Academy</div>

    <!-- Divider -->
    <div style="height:1px;background:rgba(255,255,255,0.06);margin:40px 0;"></div>

    <!-- Footer -->
    <div style="text-align:center;">
      <div style="font-size:13px;color:#a8a8a8;margin-bottom:8px;">
        Questions? Just reply to this email — I read every one.
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:24px;">
        &copy; 2026 Fast Grad Academy. All rights reserved.<br/>
        Your access code grants lifetime access to the complete guide.
      </div>
    </div>

  </div>
</body>
</html>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`${LOG} Resend error:`, err);
    throw new Error(`Email send failed: ${err}`);
  }

  return res.json();
}

async function sendSaleNotification(email, accessCode) {
  if (!process.env.RESEND_API_KEY) {
    console.error(`${LOG} Sale notification skipped: missing RESEND_API_KEY`);
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL || 'Fast Grad Academy <noreply@fastgradacademy.com>',
        to: ['johnzhengmn@gmail.com'],
        subject: `New FGA Sale! ${email}`,
        html: `
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:480px;margin:0 auto;padding:40px 24px;">
  <div style="font-size:36px;text-align:center;margin-bottom:16px;">💰</div>
  <div style="text-align:center;font-family:Georgia,serif;font-size:28px;color:#ffffff;margin-bottom:32px;">New Sale!</div>
  <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;">
    <div style="font-size:13px;color:#a8a8a8;margin-bottom:4px;">Customer</div>
    <div style="font-size:16px;color:#ffffff;margin-bottom:16px;font-weight:600;">${email}</div>
    <div style="font-size:13px;color:#a8a8a8;margin-bottom:4px;">Access Code</div>
    <div style="font-family:'Courier New',monospace;font-size:18px;color:#ffffff;margin-bottom:16px;">${accessCode}</div>
    <div style="font-size:13px;color:#a8a8a8;margin-bottom:4px;">Time</div>
    <div style="font-size:14px;color:#ffffff;">${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</div>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:13px;color:rgba(255,255,255,0.4);">Fast Grad Academy — Automated sale notification</div>
</div>
</body>
        `,
      }),
    });

    if (!res.ok) {
      console.error(`${LOG} Sale notification failed:`, await res.text());
      return;
    }

    console.log(`${LOG} Sale notification sent to johnzhengmn@gmail.com`);
  } catch (err) {
    console.error(`${LOG} Sale notification failed (non-critical):`, err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  auditEnv();

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Pre-verification config error: we cannot validate the event at all, so return
  // a non-2xx and let Stripe retry once the env vars are set.
  if (!secretKey || !webhookSecret) {
    console.error(`${LOG} Webhook configuration missing Stripe credentials`);
    return res.status(503).json({ error: 'Webhook is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error(`${LOG} Webhook signature header missing`);
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  // Verify Stripe webhook signature against the RAW request body.
  let event;
  try {
    const rawBody = await readRawBody(req);
    if (!rawBody || rawBody.length === 0) {
      console.error(`${LOG} Empty request body; cannot verify signature (is bodyParser disabled for this function?)`);
      return res.status(400).json({ error: 'Empty webhook payload' });
    }
    const stripe = new Stripe(secretKey);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`${LOG} Webhook signature verification failed:`, err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`${LOG} Verified event id=${event.id} type=${event.type}`);

  // Acknowledge event types we do not fulfill (return 200 so they don't retry).
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true, ignored: event.type });
  }

  // ── Fulfillment ──────────────────────────────────────────────────────────
  // From here on we ALWAYS return 200: the signature is valid, so retrying the
  // same event will not change a downstream (Supabase/Resend) outcome. Every
  // failure is logged with recovery context; the Supabase write is idempotent,
  // so the event can be safely replayed manually from the Stripe dashboard.
  try {
    const session = event.data.object;
    const rawEmail = session.customer_details?.email || session.customer_email;
    // Normalize to match how /api/verify looks up the row (trim + lowercase),
    // otherwise a mixed-case checkout email would store a row that can never log in.
    const email = rawEmail ? rawEmail.trim().toLowerCase() : null;
    // For a $0 (100%-off coupon) checkout there is no payment_intent, so fall
    // back to the session id, which is still unique for idempotency.
    const paymentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.id;
    const customerId = typeof session.customer === 'string' ? session.customer : null;
    // Stripe Checkout collects the buyer's name; use it for a personal greeting + storage.
    const customerName = (session.customer_details?.name || '').trim();
    const firstName = customerName.split(' ')[0] || (email ? email.split('@')[0] : '');

    if (!email) {
      console.error(`${LOG} No email found in checkout session ${session.id}`);
      return res.status(200).json({ received: true, warning: 'no_customer_email' });
    }

    console.log(`${LOG} Fulfilling session=${session.id} payment=${paymentId} email=${email}`);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(`${LOG} Webhook configuration missing Supabase credentials`);
      return res.status(200).json({ received: true, error: 'supabase_not_configured' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Idempotency: has this payment/session already been fulfilled?
    const { data: existing, error: existingError } = await supabase
      .from('access_codes')
      .select('access_code')
      .eq('stripe_payment_id', paymentId)
      .maybeSingle();

    if (existingError) {
      console.error(`${LOG} Supabase idempotency lookup error (payment=${paymentId}):`, existingError);
      return res.status(200).json({ received: true, error: 'idempotency_lookup_failed' });
    }

    if (existing) {
      console.log(`${LOG} Access code already exists for payment ${paymentId}: ${existing.access_code}`);
      return res.status(200).json({ received: true, code: existing.access_code });
    }

    // Generate a unique access code (retry on the rare collision).
    let accessCode;
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = generateAccessCode();
      const { data: collision, error: collisionError } = await supabase
        .from('access_codes')
        .select('id')
        .eq('access_code', candidate)
        .maybeSingle();

      if (collisionError) {
        console.error(`${LOG} Supabase collision lookup error:`, collisionError);
        return res.status(200).json({ received: true, error: 'collision_lookup_failed' });
      }

      if (!collision) {
        accessCode = candidate;
        break;
      }
    }

    if (!accessCode) {
      console.error(`${LOG} Access code generation exhausted collision attempts (email=${email}, payment=${paymentId})`);
      return res.status(200).json({ received: true, error: 'code_generation_failed' });
    }

    // Store the access code (include the customer name). If the optional `name`
    // column doesn't exist yet, retry without it so fulfillment never breaks.
    // To enable storage, run: ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS name text;
    const baseRow = {
      email,
      access_code: accessCode,
      stripe_payment_id: paymentId,
      stripe_customer_id: customerId,
    };

    let { error: insertError } = await supabase
      .from('access_codes')
      .insert({ ...baseRow, name: customerName || null });

    if (insertError && (insertError.code === '42703' || /name/i.test(insertError.message || ''))) {
      console.warn(`${LOG} Insert with name column failed (${insertError.message}); retrying without it. Run: ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS name text;`);
      ({ error: insertError } = await supabase.from('access_codes').insert(baseRow));
    }

    if (insertError) {
      // Log full recovery context: the code was generated but not stored.
      console.error(
        `${LOG} Supabase insert error — RECOVERY CONTEXT code=${accessCode} email=${email} ` +
          `payment=${paymentId} session=${session.id}:`,
        insertError
      );
      return res.status(200).json({ received: true, error: 'insert_failed' });
    }

    console.log(`${LOG} Stored access code ${accessCode} for ${email} (payment ${paymentId})`);

    // Send the branded welcome email. Non-critical: the code is already stored.
    try {
      await sendAccessEmail(email, accessCode, firstName);
      console.log(`${LOG} Access code ${accessCode} sent to ${email}`);
    } catch (emailErr) {
      console.error(`${LOG} Email send failed (code still stored, code=${accessCode}, email=${email}):`, emailErr.message);
    }

    // Send the sale notification to John. Also non-critical.
    await sendSaleNotification(email, accessCode);

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error(`${LOG} Webhook processing failed:`, err);
    // Still 200: signature was valid; a retry won't change the outcome. See log above.
    return res.status(200).json({ received: true, error: 'processing_failed' });
  }
}

// Vercel config: disable body parsing so we can verify the Stripe signature
// against the raw request bytes. readRawBody() also defends against runtimes
// that ignore this and pre-parse the body anyway.
export const config = {
  api: {
    bodyParser: false,
  },
};
