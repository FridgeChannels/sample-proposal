# Sample vs Live `/p/{sn}` Routing

**Overall Progress:** `100%`

## TLDR
Serve sample (gift-challenge) or live (post-meeting) from the same `/p/{sn}` URL by reading `magnet_brand_param.status` in Supabase. Keep the URL unchanged. Drive the live-page demo iframe SN from the path.

## Critical Decisions
- Decision 1: Server-side HTML selection in `server.js` — URL never redirects; only the HTML body changes.
- Decision 2: Status `3` → live (`post-meeting.html`); all other / missing → sample (`gift-challenge-react.html`).
- Decision 3: Live demo iframe keeps `dealquest.fridgechannels.com/p/{sn}` base host; only the SN segment becomes dynamic from the current path (or `?sn=`).

## Tasks:

- [x] 🟩 **Step 1: Plan + env surface**
  - [x] 🟩 Create this tracking plan
  - [x] 🟩 Document `SUPABASE_URL` / service-role key in `.env.example`

- [x] 🟩 **Step 2: Supabase phase lookup + `/p/{sn}` routing**
  - [x] 🟩 Add `lookupSamplePhase(sn)` against `magnet_brand_param`
  - [x] 🟩 Expose `GET /api/sample-phase?sn=`
  - [x] 🟩 Route `/p/{sn}` to sample or live HTML without redirect

- [x] 🟩 **Step 3: Vite dev middleware**
  - [x] 🟩 Rewrite `/p/{sn}` to the matching HTML entry via phase API

- [x] 🟩 **Step 4: Dynamic live iframe SN**
  - [x] 🟩 Parse SN from `/p/{sn}` (or `?sn=`)
  - [x] 🟩 Replace hardcoded `LIVE_DEMO_URL` SN in `LiveDemoView`

- [x] 🟩 **Step 5: Verify**
  - [x] 🟩 `npm run build` succeeds
  - [x] 🟩 Smoke-tested sample (`status=2`) and live (`status=3`) HTML selection
  - [x] 🟩 Update plan progress to 100%
