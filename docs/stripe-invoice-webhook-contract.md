# Stripe Invoice webhook contract (external system)

`sample-proposal` creates Stripe Invoices and redirects finance users to the hosted invoice page. It does **not** receive Stripe webhooks and does **not** mark orders paid or redeem discounts.

Payment confirmation and discount redemption belong to a dedicated Stripe webhook service. This document is the contract that service must implement.

## Ownership split

| Concern | Owner |
| --- | --- |
| Quote active discount, create unpaid `order` + `order_item` snapshot | `sample-proposal` |
| Create/send Stripe Invoice from DB totals; store invoice id on `finance_handoff` | `sample-proposal` |
| Stripe `invoice.*` webhooks | External webhook system |
| Mark `order` / `payment` / `finance_handoff` paid | External webhook system |
| Set `customer_package_discounts.status = used` | External webhook system on successful payment only |

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

Until this step runs, the discount must remain `active` so an unpaid customer can open another quote / invoice and still receive the offer.

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
active  ──(invoice.paid in external webhook)────────►  used
active  ──(payment_failed / voided)─────────────────►  still active  (no restore step needed)
```

`sample-proposal`:

- Reads only `customer_package_discounts` with `status = active`
- Snapshots `discount_id` and `discount_ratio` into `order.remark`
- Writes a discount `order_item` when the quote includes an active discount
- Never writes `status = used`

External webhook:

- Is the only writer that sets `used`
- Must not redeem on failed or voided invoices

## Invoice metadata reference (set by sample-proposal)

When creating a draft invoice, metadata includes:

```text
orderId
orderNo
magnet_sn
finance_token   (when opened from a finance handoff)
```

Currency and line amounts come from the persisted order / order items, not from the browser.
