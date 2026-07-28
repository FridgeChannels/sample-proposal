# Stripe Checkout + DB Pilot Pricing

**Overall Progress:** `100%`

## TLDR
Live deal room loads package/pricing/discount from Supabase (`packages` + `customer_package_discounts`). Stripe Checkout is created server-side from `sn` + `quantity` only. Shipping deferred. Tax displays as Not collected.

## Critical Decisions
- Resolve package via active `customer_package_discounts` row for `magnet_sn` (admin guarantees one is configured for live). If multiple actives exist, use newest `updated_at`.
- Unit price = `packages.year_1_price`; min qty = `packages.min_quantity`; discount = `1 - discount_ratio` off while active and not past `expires_at`.
- Shipping omitted from quote and Stripe line items for now.
- Frontend never sends prices/discount rates to checkout API.

## Tasks:

- [x] 🟩 **Step 1: Tracking + env**
  - [x] 🟩 Plan doc
  - [x] 🟩 Document `STRIPE_SECRET_KEY` (+ success/cancel URLs) in `.env.example`

- [x] 🟩 **Step 2: Server quote + checkout APIs**
  - [x] 🟩 Shared Supabase helpers to load brand + active discount + package
  - [x] 🟩 `GET /api/pilot-quote?sn=`
  - [x] 🟩 `POST /api/stripe/checkout` body `{ sn, quantity }` only

- [x] 🟩 **Step 3: Live UI consumes quote**
  - [x] 🟩 Load quote into order state (price, min qty, discount, expiry)
  - [x] 🟩 Urgency rail / line items / tax copy from quote
  - [x] 🟩 Pay Now → Stripe checkout URL

- [x] 🟩 **Step 4: Verify**
  - [x] 🟩 `npm run build`
  - [x] 🟩 Smoke-tested `/api/pilot-quote` with live SN + active discount
  - [x] 🟩 Progress 100%
