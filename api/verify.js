// ═══════════════════════════════════════════════════════════
// ACCESS CODE VERIFICATION ENDPOINT
// Called from the guide page to validate access codes
// ═══════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Missing access code' });
  }

  // Normalize: uppercase, trim
  const normalizedCode = code.trim().toUpperCase();

  try {
    // Look up the code
    const { data, error } = await supabase
      .from('access_codes')
      .select('id, email, is_active, access_count, first_accessed_at')
      .eq('access_code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.status(200).json({ valid: false });
    }

    // Update access tracking
    await supabase
      .from('access_codes')
      .update({
        access_count: data.access_count + 1,
        first_accessed_at: data.first_accessed_at || new Date().toISOString(),
      })
      .eq('id', data.id);

    return res.status(200).json({
      valid: true,
      email: data.email,
    });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ valid: false, error: 'Server error' });
  }
}
