-- Extend finance_handoff for Stripe Invoice mode (Hosted Invoice Page).
-- Apply in Supabase SQL editor against the FridgeChannel project.

ALTER TABLE public.finance_handoff
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
  ADD COLUMN IF NOT EXISTS hosted_invoice_url text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_handoff_stripe_invoice_id
  ON public.finance_handoff (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

ALTER TABLE public.finance_handoff
  DROP CONSTRAINT IF EXISTS finance_handoff_status_check;

ALTER TABLE public.finance_handoff
  ADD CONSTRAINT finance_handoff_status_check
  CHECK (status IN ('sent', 'viewed', 'payment_pending', 'paid', 'expired', 'revoked', 'preview', 'failed'));

COMMENT ON COLUMN public.finance_handoff.stripe_customer_id IS 'Stripe Customer used for invoice collection';
COMMENT ON COLUMN public.finance_handoff.stripe_invoice_id IS 'Stripe Invoice ID (in_...) — unique when set';
COMMENT ON COLUMN public.finance_handoff.hosted_invoice_url IS 'Stripe Hosted Invoice Page URL for finance payer';
