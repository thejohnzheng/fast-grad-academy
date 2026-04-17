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
  const firstName = email.split('@')[0].replace(/[+._\d]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim() || 'there';

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
      <p style="margin:0 0 16px;">I built this guide because I wish someone had shown me the playbook when I started. I graduated college at 20, saved over $85,000, and got a 3-year head start on my career — not because I'm smarter than anyone else, but because I found the system's own rules and used them.</p>
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
    console.error('Resend error:', err);
    throw new Error(`Email send failed: ${err}`);
  }

  return res.json();
}

async function sendSaleNotification(email, accessCode) {
  try {
    await fetch('https://api.resend.com/emails', {
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
    console.log('Sale notification sent to johnzhengmn@gmail.com');
  } catch (err) {
    console.error('Sale notification failed (non-critical):', err);
  }
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

    // Send branded welcome email to customer
    try {
      await sendAccessEmail(email, accessCode);
      console.log(`Access code ${accessCode} sent to ${email}`);
    } catch (emailErr) {
      console.error('Email send failed (code still stored):', emailErr);
      // Don't fail the webhook — the code is stored, we can resend manually
    }

    // Send sale notification to John
    await sendSaleNotification(email, accessCode);

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
