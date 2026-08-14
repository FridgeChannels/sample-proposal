# Pilot Plan Onboarding — Implementation Plan

**Date:** 2026-08-13  
**Projects:** sample-proposal, fc_lead_data, DTC-Dashboard-2  
**Audience:** Internal ops (Billy); never shown to clients.

---

## Notion field map (do not guess)

Verified 2026-08-13 against live Notion:

| Entity | Database | Key properties |
|--------|----------|----------------|
| Keyperson | `FC2.0-KeyPersonDB` (`KEYPERSON_DATABASE_ID`) | `Email` (email), `name` (title), `Client` (relation) |
| Client | `FC2.0-ClientDB` (`NOTION_CLIENT_DATABASE_SOURCE_ID`) | `Company Name`, `Website`, `Shop URL`, `Canonical Domain`, `NFC Card SN` |
| ~~account_contact~~ | Do **not** use for pilot resolve | Different schema (`email` lowercase, `account_id`) |

Resolve path: `Email` → KeyPerson → `Client` relation → Client.`NFC Card SN` → Supabase `magnet_brand_param`.

---

## Goal

Support the full meeting workflow: **Calendly (pre-meeting) → Client/SN → account → pilot inputs → live + dashboard**, without exposing Calendly matching or discount terms on the screen-share page.

---

## Page model

| Route | When | Visible to client? | Contents |
|-------|------|-------------------|----------|
| `/pilot-plan/prep` | Before meeting | No | Calendly picker, resolve Client/Keyperson, SN, create/bind account, **Ready for meeting** link |
| `/pilot-plan/meet?sn=` | During meeting | Can screen-share | Brand context, 03.1 inputs, Generate, Open Dashboard — **no Calendly, no email matching, no discount UI** |
| `/p/{sn}` | Customer | Yes | sample → live proposal; pilot objective sentence from DB |

Prep success criteria: resolved SN + sample exists in `magnet_brand_param` + customer account (create or already bound).

Meet entry: only via prep-generated link (`/pilot-plan/meet?sn=...`). Direct `/pilot-plan` redirects to prep.

---

## Data model

### `magnet_brand_param` (Supabase) — new columns

```sql
pilot_kpi            text
pilot_segment        text
pilot_duration_days  integer
pilot_confirmed_at   timestamptz
```

### Existing tables (unchanged shape)

| Field | Table |
|-------|-------|
| sample/live | `magnet_brand_param.status` (3 = live) |
| login account | `customer` + Supabase Auth |
| package + discount | `customer_package_discounts` |
| Client / Keyperson / NFC SN | Notion Client + Contact |

### Default package discount (lead_data + generate)

- `discount_ratio = 0.8` (80% off → customer pays 20%)
- `expires_at = now + 10 days`
- Applied silently on Generate; **not shown on `/pilot-plan/meet`**

---

## End-to-end flow

### Pre-meeting (`/pilot-plan/prep`)

1. `GET /api/calendly/events?date=today` — list scheduled events + invitee emails
2. User selects event → `POST /api/pilot-session/resolve` `{ email }` (proxies fc_lead_data)
   - Exact email → Notion Contact (Keyperson)
   - Domain → Notion Client (`Canonical Domain`, `Website`)
   - **Client wins**; read `NFC Card SN`
3. Confirm SN → verify `magnet_brand_param` row exists
4. If no account → `POST` lead_data `/api/customers` + bind `customer_id` on sample
5. **Ready for meeting** → copy/open `/pilot-plan/meet?sn=...`

### During meeting (`/pilot-plan/meet?sn=`)

1. Load session: brand name, package list, account status (no PII beyond company name)
2. Collect: package_id, pilot_kpi (multi), pilot_segment, pilot_duration_days (30/45/60/90)
3. **Generate pilot plan** → `POST /api/pilot-plan/generate`
   - Write `pilot_*` on `magnet_brand_param`
   - PATCH package-discount (80% / 10d defaults)
   - `ensureLive(sn)` if status ≠ 3
4. **Open Dashboard** → `POST /api/pilot-plan/open-dashboard`
   - `ensureLive(sn)`
   - Request DTC `POST /api/auth/impersonate-link` → open magic link in new tab

### Customer live page

`PilotPlanView` renders:

> Within **{pilot_duration_days}** days, run this pilot for **{pilot_segment}** by comparing customers in the same pilot segment who receive a Magnet with those who do not, based on **{pilot_kpi}**.

Source: `GET /api/pilot-quote?sn=` extended with `pilot` object.

---

## API ownership

### fc_lead_data (reuse + add)

| Endpoint | Action |
|----------|--------|
| `GET /api/clients?search=` | Manual client search (existing) |
| `GET /api/account-contact` | Contact list (existing) |
| `POST /api/customers` | Create account (existing) |
| `PATCH /api/samples/[sn]` | Bind customer, set live (existing) |
| `GET/PATCH /api/samples/[sn]/package-discount` | Package + discount (existing) |
| `GET /api/packages` | Package picker (existing) |
| **`POST /api/pilot-session/resolve`** | **New** — email → client, keyperson, nfc_sn, sample status |

Shared constants: `lib/pilot-defaults.ts` — `DEFAULT_DISCOUNT_RATIO = 0.8`, `DEFAULT_DISCOUNT_DAYS = 10`.

Update `sample-detail-form.tsx` initial defaults to match.

### sample-proposal (new orchestration)

| Endpoint | Action |
|----------|--------|
| `GET /api/calendly/events` | Calendly scheduled events (server, PAT) |
| `POST /api/pilot-session/resolve` | Proxy to lead_data resolve |
| `GET /api/pilot-session?sn=` | SN session snapshot (sample, customer, pilot fields) |
| `POST /api/pilot-plan/generate` | Save pilot + package discount + ensureLive |
| `POST /api/pilot-plan/open-dashboard` | ensureLive + impersonate link |
| `GET /api/pilot-quote` | Extend response with `pilot: { kpi, segment, durationDays, confirmedAt }` |

Env: `CALENDLY_PAT`, `LEAD_DATA_BASE_URL`, `DTC_DASHBOARD_URL`, `DTC_DASHBOARD_API_KEY`.

### DTC-Dashboard-2 (new)

| Endpoint | Action |
|----------|--------|
| `POST /api/auth/impersonate-link` | API-key gated; `admin.generateLink({ type: 'magiclink', email })` → callback URL |

Security: server-to-server only; link is single-use / short TTL via Supabase OTP.

---

## Failure handling

| Case | UX |
|------|-----|
| Email → no Client | Show warning; manual client search; block Ready until SN resolved |
| Client found, NFC SN empty | Manual SN entry or pick from sample list; update Notion after meeting |
| SN not in `magnet_brand_param` | Block Ready; link to lead_data sample admin |
| No account | Create on prep; block Generate until bound |
| Generate without package | Validation error |
| Dashboard link fails | Show error; live status still applied if ensureLive succeeded |

---

## Implementation phases

### Phase 1 — Backend (this sprint)

- [ ] SQL migration for pilot columns
- [ ] fc_lead_data: `pilot-defaults`, resolve API, form defaults 80%/10d
- [ ] sample-proposal: `pilot-session.js`, generate/open-dashboard APIs, extend pilot-quote
- [ ] DTC-Dashboard: impersonate-link

### Phase 2 — UI

- [ ] `/pilot-plan/prep` page (Calendly + resolve + account)
- [ ] `/pilot-plan/meet?sn=` mode (hide prep/discount; wire Generate/Dashboard)
- [ ] Live `PilotPlanView` dynamic objective sentence

### Phase 3 — Hardening

- [ ] Optional ops auth on pilot APIs (shared secret)
- [ ] Audit log for impersonate-link issuance
- [ ] Notion NFC SN write-back from prep (optional)

---

## Files (expected touch list)

**sample-proposal:** `pilot-commerce.js`, `pilot-session.js`, `server.js`, `src/pilot-plan-prep/*`, `src/pilot-plan/gift-challenge.html`, `src/post-meeting/components/PilotPlanView.tsx`, `vite.config.ts`, `.env.example`

**fc_lead_data:** `lib/pilot-defaults.ts`, `app/api/pilot-session/resolve/route.ts`, `components/sample-detail-form.tsx`

**DTC-Dashboard-2:** `src/api/auth/handlers.ts`, `src/index.ts`, `.env.example`

**SQL:** `docs/sql/2026-08-13-magnet-brand-param-pilot-fields.sql`
