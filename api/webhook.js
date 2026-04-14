// ═══════════════════════════════════════════════════════════
// STRIPE WEBHOOK → Generate Access Code → Store in Supabase → Send Email via Resend
// Vercel Serverless Function
// ═══════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate a clean, premium-feeling access code: FGA-XXXX-XXXX
function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O/1/I confusion
  let code = 'FGA-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[crypto.randomInt(chars.length)];
  return code;
}

async function sendAccessEmail(email, accessCode) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.FROM_EMAIL || 'Fast Grad Academy <noreply@fastgradacademy.com>',
      to: [email],
      subject: 'Your Fast Grad Academy Guide — Access Code Inside',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:48px 32px;">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:48px;">
      <div style="font-family:Georgia,serif;font-size:24px;color:#ffffff;letter-spacing:-0.02em;">Fast Grad Academy</div>
      <div style="font-size:11px;color:#a8a8a8;letter-spacing:0.2em;text-transform:uppercase;margin-top:8px;">The Complete Guide</div>
    </div>

    <!-- Main Content -->
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px 32px;text-align:center;">
      <div style="font-size:14px;color:#a8a8a8;margin-bottom:8px;">Your Personal Access Code</div>
      <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:700;color:#ffffff;letter-spacing:0.1em;padding:20px 0;border-top:1px solid rgba(255,255,255,0.08);border-bottom:1px solid rgba(255,255,255,0.08);margin:16px 0;">
        ${accessCode}
      </div>
      <div style="font-size:13px;color:#a8a8a8;margin-top:16px;line-height:1.6;">
        This code is unique to you. Do not share it.
      </div>
    </div>

    <!-- CTA Button -->
    <div style="text-align:center;margin:32px 0;">
      <a href="https://fastgradacademy.com/guide" style="display:inline-block;background:#ffffff;color:#0a0a0a;font-size:14px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:16px 40px;border-radius:999px;text-decoration:none;">
        Unlock The Guide
      </a>
    </div>

    <!-- Instructions -->
    <div style="font-size:14px;color:rgba(255,255,255,0.6);line-height:1.8;margin-top:32px;">
      <strong style="color:#ffffff;">How to access your guide:</strong><br/>
      1. Click the button above or go to <a href="https://fastgradacademy.com/guide" style="color:#c0c0c0;">fastgradacademy.com/guide</a><br/>
      2. Enter your access code: <strong style="color:#ffffff;">${accessCode}</strong><br/>
      3. Start your journey to graduating in 12 months
    </div>

    <!-- Divider -->
    <div style="height:1px;background:rgba(255,255,255,0.06);margin:40px 0;"></div>

    <!-- Footer -->
    <div style="text-align:center;">
      <div style="font-size:13px;color:#a8a8a8;margin-bottom:8px;">
        Questions? Reply to this email or contact <a href="mailto:john@executivestrategy.consulting" style="color:#c0c0c0;">john@executivestrategy.consulting</a>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.3);margin-top:24px;">
        &copy; 2026 Executive Strategy Consulting LLC d.b.a. Fast Grad Academy. All rights reserved.<br/>
        This is a non-refundable digital product. Your access code grants lifetime access.
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
    console.error('Resend error:', err);
    throw new Error(`Email send failed: ${err}`);
  }

  return res.json();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Stripe webhook signature
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // For raw body access in Vercel, we need the raw buffer
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const email = session.customer_details?.email || session.customer_email;
    const paymentId = session.payment_intent;
    const customerId = session.customer;

    if (!email) {
      console.error('No email found in checkout session');
      return res.status(400).json({ error: 'No customer email' });
    }

    // Check if this payment already has an access code (idempotency)
    const { data: existing } = await supabase
      .from('access_codes')
      .select('access_code')
      .eq('stripe_payment_id', paymentId)
      .single();

    if (existing) {
      console.log('Access code already exists for this payment:', existing.access_code);
      return res.status(200).json({ received: true, code: existing.access_code });
    }

    // Generate unique access code
    let accessCode;
    let attempts = 0;
    while (attempts < 5) {
      accessCode = generateAccessCode();
      const { data: collision } = await supabase
        .from('access_codes')
        .select('id')
        .eq('access_code', accessCode)
        .single();
      if (!collision) break;
      attempts++;
    }

    // Store in Supabase
    const { error: insertError } = await supabase
      .from('access_codes')
      .insert({
        email,
        access_code: accessCode,
        stripe_payment_id: paymentId,
        stripe_customer_id: customerId,
      });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to store access code' });
    }

    // Send branded email
    try {
      await sendAccessEmail(email, accessCode);
      console.log(`Access code ${accessCode} sent to ${email}`);
    } catch (emailErr) {
      console.error('Email send failed (code still stored):', emailErr);
      // Don't fail the webhook — the code is stored, we can resend manually
    }

    return res.status(200).json({ received: true });
  }

  // Acknowledge other event types
  return res.status(200).json({ received: true });
}

// Helper: get raw body for Stripe signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Vercel config: disable body parsing so we can verify Stripe signature
export const config = {
  api: {
    bodyParser: false,
  },
};
