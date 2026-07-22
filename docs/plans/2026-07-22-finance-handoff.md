# Finance Handoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let an approving executive send a secure payment handoff to finance, track delivery and viewing, and let finance open the approved order on another device.

**Architecture:** Add a small server-side handoff API backed by an in-memory token store and optional Resend delivery. The React app creates the handoff after approval, loads handoff orders from a tokenized URL, and synchronizes status changes. The UI stays mobile-first and flat, with a one-email handoff form and explicit lifecycle states.

**Tech Stack:** React 19, TypeScript, Node HTTP server, Resend REST API via native fetch, Vite proxy.

---

### Task 1: Finance handoff API

**Files:**
- Modify: `server.js`

**Steps:**
1. Add JSON body parsing and email validation.
2. Add `POST /api/finance-handoffs` to create a random token and approved-order snapshot.
3. Send the finance email through Resend when credentials exist; otherwise return preview delivery.
4. Add `GET /api/finance-handoffs/:token` and status update support.
5. Reject missing approval, invalid recipients, unknown tokens, and expired links.

### Task 2: Shared handoff state

**Files:**
- Modify: `src/post-meeting/types.ts`
- Modify: `src/post-meeting/App.tsx`

**Steps:**
1. Add finance delivery statuses and handoff metadata to the order state.
2. Load a tokenized handoff on another device before rendering finance.
3. Poll handoff status for the sender and persist local state.
4. Preserve existing orders that do not yet contain handoff metadata.

### Task 3: CEO send flow

**Files:**
- Modify: `src/post-meeting/components/SendFinanceModal.tsx`
- Modify: `src/post-meeting/components/OrderView.tsx`
- Modify: `src/post-meeting/styles.css`

**Steps:**
1. Reduce the form to finance email, optional name/message, and CC me.
2. Add idle, validation, sending, success, preview-delivery, and error states.
3. Replace the post-send CTA with a flat handoff status row.
4. Add resend, change recipient, copy link, and review finance page actions.

### Task 4: Finance recipient experience

**Files:**
- Modify: `src/post-meeting/components/FinanceView.tsx`
- Modify: `src/post-meeting/styles.css`

**Steps:**
1. Mark the link viewed when finance opens it.
2. Keep package, amount, approval, and payment data visible.
3. Send payment-pending and paid status changes back to the handoff API.
4. Handle loading, invalid, revoked, expired, and failed states.

### Task 5: Verification

**Files:**
- Verify: `server.js`
- Verify: `src/post-meeting/components/SendFinanceModal.tsx`
- Verify: `src/post-meeting/components/FinanceView.tsx`

**Steps:**
1. Run `npm run build` and expect success.
2. Exercise API validation and preview delivery without external credentials.
3. Complete CEO approval and send from a 365px viewport.
4. Open the generated finance link in a second tab and confirm viewed status.
5. Restore the browser preview to a clean order state.

