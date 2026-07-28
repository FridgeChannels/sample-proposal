-- Pilot finance handoff: secure email-token lifecycle for approved pilot orders.
-- Apply in Supabase SQL editor (or psql) against the FridgeChannel project.

CREATE TABLE IF NOT EXISTS public.finance_handoff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  order_id bigint NOT NULL REFERENCES public."order"(id) ON DELETE CASCADE,
  magnet_sn text NOT NULL,
  to_email text NOT NULL,
  to_name text,
  cc_email text,
  message text,
  status text NOT NULL DEFAULT 'sent'
    CHECK (status IN ('sent', 'viewed', 'payment_pending', 'paid', 'expired', 'revoked', 'preview')),
  stripe_checkout_session_id text,
  expires_at timestamptz NOT NULL,
  viewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_handoff_magnet_sn_check CHECK (length(trim(magnet_sn)) > 0),
  CONSTRAINT finance_handoff_to_email_check CHECK (position('@' in to_email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_finance_handoff_order_id ON public.finance_handoff (order_id);
CREATE INDEX IF NOT EXISTS idx_finance_handoff_magnet_sn ON public.finance_handoff (magnet_sn);
CREATE INDEX IF NOT EXISTS idx_finance_handoff_status ON public.finance_handoff (status);

COMMENT ON TABLE public.finance_handoff IS 'CEO→finance secure payment handoff tokens for pilot orders';
COMMENT ON COLUMN public.finance_handoff.token IS 'Opaque URL secret used in ?finance= query param';
