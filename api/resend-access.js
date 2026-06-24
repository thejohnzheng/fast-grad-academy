//
// ACCESS CODE RECOVERY ENDPOINT
// POST /api/resend-access — re-sends a buyer's access code to their email.
// Reuses the exact welcome-email template from the webhook (single source of truth).
//
// Body: { "email": "user@example.com" }
// Always returns a generic message so it never reveals whether an email exists.
//

import { createClient } from '@supabase/supabase-js';
import { sendAccessEmail } from './webhook.js';

const ALLOWED_ORIGIN = 'https://fastgradacademy.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_WINDOW_MS = 5 * 60 * 1000; // one resend per email per 5 minutes
const resendHits = new Map(); // email -> last request timestamp (per warm instance)
const GENERIC = 'If an account exists with this email, we have sent the access code. Check your inbox (and spam).';

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

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!corsAllowed) return res.status(403).json({ error: 'Origin not allowed' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let body;
  try {
    body = readBody(req);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const rawEmail = body.email;
  if (!rawEmail || typeof rawEmail !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  // In-memory rate limit, applied BEFORE the lookup so it never leaks whether
  // the email exists. (For cross-instance enforcement, add a last_resend_at
  // column; in-memory is sufficient to stop rapid repeats on a warm instance.)
  const now = Date.now();
  const last = resendHits.get(email);
  if (last && now - last < RESEND_WINDOW_MS) {
    const waitSeconds = Math.ceil((RESEND_WINDOW_MS - (now - last)) / 1000);
    res.setHeader('Retry-After', String(waitSeconds));
    return res.status(429).json({
      error: 'Please wait a few minutes before requesting another access code email.',
    });
  }
  resendHits.set(email, now);

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[resend-access] Missing Supabase credentials');
    return res.status(503).json({ error: 'Access recovery is not configured.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Prefer reading the stored name for a personal greeting; fall back if the
    // optional `name` column doesn't exist yet.
    let { data, error } = await supabase
      .from('access_codes')
      .select('access_code, name')
      .eq('email', email)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && (error.code === '42703' || /name/i.test(error.message || ''))) {
      ({ data, error } = await supabase
        .from('access_codes')
        .select('access_code')
        .eq('email', email)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle());
    }

    if (error) {
      console.error('[resend-access] Lookup error:', error);
      // Generic response regardless — do not leak existence or internal errors.
      return res.status(200).json({ message: GENERIC });
    }

    if (data && data.access_code) {
      const firstName = (data.name ? String(data.name).split(' ')[0] : '') || email.split('@')[0];
      try {
        await sendAccessEmail(email, data.access_code, firstName);
        console.log(`[resend-access] Resent access code to ${email}`);
      } catch (mailErr) {
        console.error('[resend-access] Email send failed:', mailErr.message);
      }
    } else {
      console.log(`[resend-access] No active code for ${email}; generic response returned`);
    }

    return res.status(200).json({ message: GENERIC });
  } catch (err) {
    console.error('[resend-access] Unexpected error:', err);
    return res.status(200).json({ message: GENERIC });
  }
}
