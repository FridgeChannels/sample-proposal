-- Pilot plan fields on magnet_brand_param (one pilot config per sample SN).
-- Run in Supabase SQL editor before deploying generate flow.

alter table public.magnet_brand_param
  add column if not exists pilot_kpi text,
  add column if not exists pilot_segment text,
  add column if not exists pilot_duration_days integer,
  add column if not exists pilot_confirmed_at timestamptz;

comment on column public.magnet_brand_param.pilot_kpi is 'Success metrics; multi-select joined with "; "';
comment on column public.magnet_brand_param.pilot_segment is 'Target customer segment for pilot';
comment on column public.magnet_brand_param.pilot_duration_days is 'Pilot window in days (e.g. 30, 45, 60, 90)';
comment on column public.magnet_brand_param.pilot_confirmed_at is 'When pilot plan was generated in /pilot-plan/meet';
