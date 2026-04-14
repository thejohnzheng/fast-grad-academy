-- ══════════════════════════════════════════════════════════════
-- Fast Grad Academy — Access Codes Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════════

-- 1. TABLE
CREATE TABLE IF NOT EXISTS public.access_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    access_code TEXT NOT NULL UNIQUE,
    stripe_payment_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    first_accessed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    access_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    notes TEXT
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON public.access_codes(access_code);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON public.access_codes(email);

-- 3. VERIFY FUNCTION (called by /api/verify endpoint)
CREATE OR REPLACE FUNCTION public.verify_access_code(p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_record RECORD;
BEGIN
    SELECT * INTO v_record
    FROM public.access_codes
    WHERE access_code = p_code AND is_active = true;

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false, 'error', 'Invalid or deactivated access code');
    END IF;

    -- Update access tracking
    UPDATE public.access_codes
    SET
        first_accessed_at = COALESCE(first_accessed_at, now()),
        last_accessed_at = now(),
        access_count = access_count + 1
    WHERE id = v_record.id;

    RETURN json_build_object(
        'valid', true,
        'email', v_record.email,
        'created_at', v_record.created_at,
        'access_count', v_record.access_count + 1
    );
END;
$$;

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (used by webhook + verify API)
CREATE POLICY "Service role full access"
ON public.access_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Anon users cannot access the table directly (must go through verify function)
CREATE POLICY "No direct anon access"
ON public.access_codes
FOR SELECT
TO anon
USING (false);
