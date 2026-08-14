# Pilot Plan Onboarding — Test Plan

**Date:** 2026-08-13  
**Scope:** Prep flow, meet flow, live rendering, dashboard SSO, lead_data integration

---

## Prerequisites

- Supabase with test SN in `magnet_brand_param` (`status` 2 or 4, `sample=1`)
- Notion Client row with matching `Canonical Domain` + `NFC Card SN` for test email
- Notion Contact with test invitee email linked to Client
- `CALENDLY_PAT` with at least one upcoming event (or mock `/api/calendly/events`)
- fc_lead_data running (default port 3000)
- DTC-Dashboard-2 running with `API_KEY` set
- SQL migration applied for `pilot_*` columns

---

## 1. Database migration

| ID | Step | Expected |
|----|------|----------|
| DB-1 | Run `docs/sql/2026-08-13-magnet-brand-param-pilot-fields.sql` | Columns exist on `magnet_brand_param` |
| DB-2 | `UPDATE ... SET pilot_duration_days=45` on test SN | Value readable via Supabase |

---

## 2. fc_lead_data — resolve API

| ID | Step | Expected |
|----|------|----------|
| LD-1 | `POST /api/pilot-session/resolve` `{ "email": "known@clientdomain.com" }` | `match_level: keyperson` or `domain`, `client`, `nfc_sn` populated |
| LD-2 | Resolve with unknown email | `match_level: none`, empty `nfc_sn`, `clients: []` or manual search hint |
| LD-3 | Resolve with email whose Client has empty NFC SN | `nfc_sn: null`, `warnings: ["missing_nfc_sn"]` |
| LD-4 | `GET /api/samples/{sn}` for resolved SN | Sample row exists |
| LD-5 | Sample detail form package defaults | New form shows 80% discount, expires ~10 days out |

---

## 3. sample-proposal — Calendly & session

| ID | Step | Expected |
|----|------|----------|
| SP-1 | `GET /api/calendly/events?date=today` | `{ events: [{ uri, name, start_time, invitees: [{ email, name }] }] }` |
| SP-2 | Calendly PAT missing | 503 with clear error |
| SP-3 | `GET /api/pilot-session?sn={test}` | Returns brand, status, customer_id, pilot fields |
| SP-4 | `POST /api/pilot-session/resolve` proxies lead_data | Same payload as LD-1 |

---

## 4. Generate pilot plan

| ID | Step | Expected |
|----|------|----------|
| GEN-1 | Generate without bound account | 400 — account required |
| GEN-2 | Generate with valid body | `pilot_*` saved; `customer_package_discounts` row with ratio 0.8, expires ~10d |
| GEN-3 | After Generate, `magnet_brand_param.status` | `3` (live) |
| GEN-4 | Generate twice (idempotent discount) | One active discount; prior active cancelled |
| GEN-5 | Meet page after Generate | Summary shows segment/metric/duration; **no discount line items** |
| GEN-6 | `GET /api/pilot-quote?sn=` | Includes `pilot: { kpi, segment, durationDays }` |

---

## 5. Open Dashboard

| ID | Step | Expected |
|----|------|----------|
| DASH-1 | `POST /api/pilot-plan/open-dashboard` `{ sn }` | `{ url }` magic link; sample status live |
| DASH-2 | Open returned URL in browser | Lands in DTC dashboard logged in (no password) |
| DASH-3 | Reuse same URL after success | Second open fails / expired |
| DASH-4 | Missing API key on impersonate | 401 from DTC |
| DASH-5 | Customer without email | 400 with actionable message |

---

## 6. Live customer page

| ID | Step | Expected |
|----|------|----------|
| LIVE-1 | Visit `/p/{sn}` after Generate | Serves live HTML (`post-meeting`) |
| LIVE-2 | Pilot Plan section objective text | Dynamic duration/segment/metric — no bracket placeholders |
| LIVE-3 | Visit `/p/{sn}` before Generate | sample HTML or live per status |
| LIVE-4 | Customer page | No Calendly, no internal prep UI |

---

## 7. Prep vs meet UI (manual)

| ID | Step | Expected |
|----|------|----------|
| UI-1 | Open `/pilot-plan/prep` | Calendly list visible |
| UI-2 | Select event → resolve → Ready | Link to `/pilot-plan/meet?sn=...` |
| UI-3 | Open meet URL | No Calendly block; SN in query only |
| UI-4 | Screen-share meet page | No invitee email, no discount commercial block |
| UI-5 | Direct `/pilot-plan` | Redirects to prep |
| UI-6 | Meet URL without `sn` | Error / redirect to prep |

---

## 8. Security smoke

| ID | Step | Expected |
|----|------|----------|
| SEC-1 | Call impersonate-link without key (prod) | 401 |
| SEC-2 | Calendly PAT never in browser network tab from meet page | Only server-side |
| SEC-3 | Magic link not logged in client console | Server logs only optional |

---

## 9. Regression

| ID | Step | Expected |
|----|------|----------|
| REG-1 | Existing `/api/pilot-quote` pricing for paid flow | Totals unchanged when discount active |
| REG-2 | Stripe finance handoff on live page | Still works |
| REG-3 | lead_data sample detail manual package edit | Defaults 80%/10d; save still works |

---

## Test data checklist

```
TEST_EMAIL=invitee@brand.com        # Calendly + Notion Contact
TEST_DOMAIN=brand.com               # Notion Client Canonical Domain
TEST_SN=XXXXXXXX                    # NFC Card SN + magnet_brand_param
TEST_PACKAGE_ID=<uuid>              # Active package in packages table
```

---

## Sign-off criteria

- [ ] Prep flow resolves SN for happy-path test client
- [ ] Generate persists pilot fields + discount + live
- [ ] Meet page safe for screen share (no Calendly/discount)
- [ ] Dashboard one-click login works once per link
- [ ] Live page shows filled objective sentence
