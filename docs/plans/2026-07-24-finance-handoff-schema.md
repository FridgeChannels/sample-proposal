# finance_handoff schema

Applied via [`sql/2026-07-24-finance-handoff.sql`](../../sql/2026-07-24-finance-handoff.sql).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | `gen_random_uuid()` |
| `token` | text UNIQUE NOT NULL | Opaque URL secret (`?finance=`) |
| `order_id` | bigint NOT NULL | FK → `order(id)` ON DELETE CASCADE |
| `magnet_sn` | text NOT NULL | Sample / live SN for routing |
| `to_email` | text NOT NULL | Finance recipient |
| `to_name` | text | Optional |
| `cc_email` | text | Optional CC |
| `message` | text | Optional note from approver |
| `status` | text NOT NULL | `sent` \| `viewed` \| `payment_pending` \| `paid` \| `expired` \| `revoked` \| `preview` |
| `stripe_checkout_session_id` | text | Set when Checkout starts / completes |
| `expires_at` | timestamptz NOT NULL | Default TTL 14 days |
| `viewed_at` | timestamptz | First finance open |
| `created_at` / `updated_at` | timestamptz | Audit |

Indexes: `token` (unique), `order_id`, `magnet_sn`, `status`.

Related persistence (existing tables):

- `shipping_address` — address save
- `order` / `order_item` — placed pilot snapshot (`status` 0 unpaid → 1 paid)
- `payment` — Stripe Checkout confirmation (`payment_method: stripe_checkout`)
