import { createClient } from '@supabase/supabase-js';

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return send(res, 405, { ok: false, error: 'Method not allowed' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return send(res, 503, { ok: false, error: 'Supabase is not configured.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error, count } = await supabase
    .from('access_codes')
    .select('id', { head: true, count: 'estimated' })
    .limit(1);

  if (error) {
    console.error('[keepalive] Supabase ping failed:', error.message || error);
    return send(res, 503, { ok: false, error: 'Supabase ping failed.' });
  }

  return send(res, 200, {
    ok: true,
    table: 'access_codes',
    count: typeof count === 'number' ? count : null,
    checked_at: new Date().toISOString(),
  });
}
