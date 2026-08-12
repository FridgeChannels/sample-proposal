# Stripe Invoice webhook contract (external system)

`sample-proposal` creates Stripe Invoices and redirects finance users to the hosted invoice page. It does **not** receive Stripe webhooks and does **not** mark orders paid or redeem discounts.

Payment confirmation, discount redemption, and package activation belong to the dedicated service at:

**`/Users/markbai/Documents/stripe-webhook`**

Production endpoint:

```text
https://hooks.fridgechannels.com/webhooks/stripe
```

Local default: `POST http://localhost:4180/webhooks/stripe`.

## Ownership split

| Concern | Owner |
| --- | --- |
| Quote active discount, create unpaid `order` + `order_item` snapshot | `sample-proposal` |
| Create/send Stripe Invoice from DB totals; store invoice id on `finance_handoff` | `sample-proposal` |
| Stripe `invoice.*` webhooks | `stripe-webhook` service |
| Mark `order` / `payment` / `finance_handoff` paid | `stripe-webhook` service |
| Set `customer_package_discounts.status = used` | `stripe-webhook` on successful payment only |
| Upsert `customer_packages` (one active subscription per customer) | `stripe-webhook` on successful payment only |

## Events to handle

Subscribe at minimum:

- `invoice.paid`
- `invoice.payment_failed`
- `invoice.voided`

Optional:

- `invoice.marked_uncollectible` — treat like a terminal unpaid failure for handoff status

## How to resolve the order

Prefer metadata written when `sample-proposal` creates the invoice:

| Metadata key | Purpose |
| --- | --- |
| `orderId` | **Required.** Numeric `order.id` |
| `orderNo` | Human-readable order number |
| `magnet_sn` | Sample SN |
| `finance_token` | `finance_handoff.token` when opened from a handoff link |

Fallback if metadata is missing: look up `finance_handoff` by Stripe invoice id.

Storage note:

- Preferred columns (after migration `sql/2026-07-29-finance-handoff-stripe-invoice.sql`): `stripe_invoice_id`, `hosted_invoice_url`, `stripe_customer_id`
- Until that migration is applied, `sample-proposal` may store the invoice id in legacy `stripe_checkout_session_id`

Never trust amounts from the frontend. Invoice line amounts were computed from the DB order at creation time; webhook handlers should update status only, not re-price from client input.

## `invoice.paid` (must be idempotent)

Stripe may deliver the same event more than once. Every step must be safe to repeat.

1. Resolve `orderId` from `invoice.metadata.orderId`.
2. If `order.status` is already paid (`1`), skip the order update but still ensure payment / handoff / discount steps below are applied if missing.
3. Update `order`:
   - `status = 1` (paid)
   - `payment_method = 'stripe_invoice'`
   - `payment_time = now`
   - `updated_at = now`
4. Insert a `payment` row if none exists for this Stripe invoice:
   - `transaction_no = invoice.id` (unique per invoice)
   - `order_id`, `amount` from `order.total_amount`, `currency` from order
   - `payment_method = 'stripe_invoice'`
   - `status = 1` (paid)
   - `payment_time = now`
   - optionally store the Stripe payload in `callback_data`
5. Update `finance_handoff`:
   - Prefer `metadata.finance_token`
   - Else update open rows for `order_id` with status in `sent`, `viewed`, `payment_pending`, `preview`, `failed`
   - Set `status = 'paid'`, and invoice fields when present (`stripe_invoice_id`, `hosted_invoice_url`)
6. Redeem discount **only after payment is confirmed**:
   - Parse `order.remark` JSON for `discount_id`
   - If present, update `customer_package_discounts`:
     - `status = 'used'`
     - `used_at = now`
     - `updated_at = now`
7. Activate the purchased package on `customer_packages` (idempotent):
   - `customer_id` = `order.customer_id`
   - `package_id` = `order.remark.package_id`
   - Deactivate any other `is_active=true` rows for that customer (`ends_at=now`)
   - If an active row already has the same `package_id`, refresh `updated_at` / notes only
   - Otherwise insert a new active row (`starts_at=now`, `ends_at=null`, `is_active=true`)
   - Notes may record `stripe_invoice:<id> order:<id>`

Until discount redemption runs, the discount must remain `active` so an unpaid customer can open another quote / invoice and still receive the offer.

Package activation should not roll back a successful payment write if `package_id` is missing from remark — log and continue.

## `invoice.payment_failed`

1. Resolve handoff via `metadata.finance_token` (or invoice id).
2. Set `finance_handoff.status = 'failed'`.
3. **Do not** change `order` to paid.
4. **Do not** set the discount to `used`. Leave `customer_package_discounts.status = active` so repay / retry still quotes the coupon.

## `invoice.voided`

1. Resolve handoff via `metadata.finance_token` (or invoice id).
2. Set `finance_handoff.status = 'revoked'`.
3. **Do not** mark the discount used.
4. Leave the unpaid order as unpaid unless product rules say otherwise; a new finance handoff / invoice may be created from `sample-proposal` while the discount is still active.

## Discount lifecycle (Option A)

```text
active  ──(quote / create order / create invoice)──►  still active
                                                      (snapshot only in order.remark + order_item)
active  ──(invoice.paid in stripe-webhook)──────────►  used
active  ──(payment_failed / voided)─────────────────►  still active  (no restore step needed)
```

`sample-proposal`:

- Reads only `customer_package_discounts` with `status = active`
- Snapshots `discount_id` and `discount_ratio` into `order.remark`
- Writes a discount `order_item` when the quote includes an active discount
- Never writes `status = used`
- Never writes `customer_packages`

`stripe-webhook` service:

- Is the only writer that sets discount `used`
- Is the only writer that activates `customer_packages` from pilot invoice payment
- Must not redeem discounts or change packages on failed or voided invoices

## customer_packages on paid

| Field | Source |
| --- | --- |
| `customer_id` | `order.customer_id` |
| `package_id` | `order.remark.package_id` (set by sample-proposal) |
| `is_active` | `true` for the purchased package; prior actives set to `false` |
| `starts_at` / `ends_at` | new row starts now; deactivated rows get `ends_at=now` |

Invariant: each customer has at most one `is_active = true` row after a successful paid handling.

## Invoice metadata reference (set by sample-proposal)

When creating a draft invoice, metadata includes:

```text
orderId
orderNo
magnet_sn
finance_token   (when opened from a finance handoff)
```

Currency and line amounts come from the persisted order / order items, not from the browser.
