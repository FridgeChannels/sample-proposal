-- Company & signatory details for pilot checkout, one row per customer.
create table if not exists public.customer_billing (
  id bigint generated always as identity primary key,
  customer_id bigint not null unique references public.customer (id) on delete cascade,
  company_name text not null default '',
  registered_address text not null default '',
  signatory_name text not null default '',
  signatory_title text not null default '',
  corporate_email text not null default '',
  po_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_billing_customer_id on public.customer_billing (customer_id);

comment on table public.customer_billing is 'Legal company and signatory details captured on #finance checkout.';
comment on column public.customer_billing.registered_address is 'Company registered / legal address.';
comment on column public.customer_billing.signatory_name is 'Authorized signatory full name.';
comment on column public.customer_billing.signatory_title is 'Signatory job title.';
comment on column public.customer_billing.corporate_email is 'Corporate email for the signatory.';
