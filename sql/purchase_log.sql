CREATE TABLE IF NOT EXISTS purchase_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  amount_cents integer NOT NULL,
  currency text DEFAULT 'usd',
  product text DEFAULT 'fga-course',
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS purchase_log_created_at_idx
  ON purchase_log (created_at DESC);

CREATE INDEX IF NOT EXISTS purchase_log_source_idx
  ON purchase_log (source);
