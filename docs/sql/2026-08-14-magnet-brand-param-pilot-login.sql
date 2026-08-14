-- Store dashboard login credentials issued during pilot prep (for ops handoff to client).
-- Plaintext initial password by design: ops needs to copy/send it to the customer later.

alter table public.magnet_brand_param
  add column if not exists pilot_login_email text,
  add column if not exists pilot_initial_password text;

comment on column public.magnet_brand_param.pilot_login_email is 'Dashboard login email issued during /pilot-plan/prep Create & bind';
comment on column public.magnet_brand_param.pilot_initial_password is 'Initial dashboard password issued during prep (ops handoff; plaintext)';
