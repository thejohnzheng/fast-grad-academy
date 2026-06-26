import { createClient } from '@supabase/supabase-js';

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function maskEmail(email) {
  if (typeof email !== 'string' || !email.includes('@')) return 'unknown';
  const [name, domain] = email.split('@');
  const first = name.charAt(0) || '*';
  return `${first}***@${domain}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return send(res, 405, { error: 'Method not allowed' });
  }

  const adminPassword = process.env.FGA_ADMIN_PASSWORD;
  if (!adminPassword) {
    return send(res, 503, { error: 'Dashboard is not configured.' });
  }

  if (req.query.password !== adminPassword) {
    return send(res, 401, { error: 'Unauthorized' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return send(res, 503, { error: 'Supabase is not configured.' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from('purchase_log')
    .select('created_at, customer_email, amount_cents, currency, source, utm_source, utm_medium, utm_campaign')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[dashboard] purchase_log query failed:', error);
    return send(res, 500, { error: 'Failed to load dashboard data.' });
  }

  const sales = (data || []).map((row) => ({
    created_at: row.created_at,
    email: maskEmail(row.customer_email),
    amount_cents: row.amount_cents || 0,
    currency: row.currency || 'usd',
    source: row.source || row.utm_source || 'direct',
    utm_source: row.utm_source || 'direct',
    utm_medium: row.utm_medium || null,
    utm_campaign: row.utm_campaign || null,
  }));

  const totalRevenueCents = sales.reduce((sum, sale) => sum + sale.amount_cents, 0);

  return send(res, 200, {
    sales,
    total_revenue: totalRevenueCents / 100,
    total_sales: sales.length,
  });
}
