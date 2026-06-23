//
// ACCESS CODE VERIFICATION ENDPOINT
// Called from the guide page to validate access codes
// Requires both email and access code to match (anti-sharing)
//

import { createClient } from '@supabase/supabase-js';

const ALLOWED_ORIGIN = 'https://fastgradacademy.com';
const RATE_LIMIT = { limit: 12, windowMs: 5 * 60 * 1000 };
const verifyHits = new Map();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCESS_CODE_RE = /^FGA-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

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

function checkRateLimit(req) {
  const key = `verify:${clientIp(req)}`;
  const now = Date.now();
  const current = verifyHits.get(key);

  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + RATE_LIMIT.windowMs };
    verifyHits.set(key, next);
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

export default async function handler(req, res) {
  const corsAllowed = applyCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!corsAllowed) {
    return res.status(403).json({ valid: false, error: 'Origin not allowed' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rate = checkRateLimit(req);
  setRateHeaders(res, rate);
  if (!rate.allowed) {
    res.setHeader('Retry-After', String(Math.ceil((rate.resetAt - Date.now()) / 1000)));
    return res.status(429).json({
      valid: false,
      error: 'Too many access attempts. Please wait a few minutes and try again.',
    });
  }

  let body;
  try {
    body = readBody(req);
  } catch (err) {
    return res.status(400).json({ valid: false, error: err.message });
  }

  const { code, email } = body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing access code.' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing email address.' });
  }

  const normalizedCode = code.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();

  if (!ACCESS_CODE_RE.test(normalizedCode)) {
    return res.status(400).json({
      valid: false,
      error: 'Access code must match FGA-XXXX-XXXX.',
    });
  }

  if (!EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({
      valid: false,
      error: 'Enter the email address used at checkout.',
    });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ valid: false, error: 'Access verification is not configured.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('id, email, is_active, access_count, first_accessed_at')
      .eq('access_code', normalizedCode)
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Verify lookup error:', error);
      return res.status(500).json({ valid: false, error: 'Access verification failed.' });
    }

    if (!data) {
      return res.status(200).json({
        valid: false,
        error: 'The email and access code did not match.',
      });
    }

    await supabase
      .from('access_codes')
      .update({
        access_count: (data.access_count || 0) + 1,
        first_accessed_at: data.first_accessed_at || new Date().toISOString(),
      })
      .eq('id', data.id);

    return res.status(200).json({ valid: true, email: data.email });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ valid: false, error: 'Server error.' });
  }
}
