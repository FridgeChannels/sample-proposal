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

comment on table public.order_terms_acceptance is 'Checkout consent for pilot legal documents, recorded before Stripe invoicing.';
comment on column public.order_terms_acceptance.documents is 'Accepted document slugs, e.g. pilot-order-service-terms, data-processing-addendum.';
