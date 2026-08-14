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

-- Records explicit acceptance of pilot legal terms before payment.
create table if not exists public.order_terms_acceptance (
  id bigint generated always as identity primary key,
  order_id bigint not null unique references public.order (id) on delete cascade,
  customer_id bigint not null references public.customer (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  documents text[] not null,
  signatory_name text not null,
  signatory_email text not null,
  signatory_title text,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_terms_acceptance_customer_id on public.order_terms_acceptance (customer_id);
create index if not exists idx_order_terms_acceptance_order_id on public.order_terms_acceptance (order_id);
