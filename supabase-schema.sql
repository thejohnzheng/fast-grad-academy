-- FAST GRAD ACADEMY — Access Code System
-- Run this in your Supabase SQL Editor (supabase.com/dashboard)

CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  access_code TEXT NOT NULL UNIQUE,
  stripe_payment_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  first_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

CREATE INDEX idx_access_codes_code ON access_codes(access_code);
CREATE INDEX idx_access_codes_email ON access_codes(email);

CREATE OR REPLACE FUNCTION verify_access_code(code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result RECORD;
BEGIN
  SELECT id, email, is_active, access_count, first_accessed_at
  INTO result
  FROM access_codes
  WHERE access_code = code AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false);
  END IF;

  UPDATE access_codes
  SET
    access_count = access_count + 1,
    first_accessed_at = COALESCE(first_accessed_at, now())
  WHERE access_code = code;

  RETURN json_build_object(
    'valid', true,
    'email', result.email
  );
END;
$$;

ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON access_codes
  FOR ALL
  USING (auth.role() = 'service_role');

GRANT EXECUTE ON FUNCTION verify_access_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_access_code(TEXT) TO authenticated;
