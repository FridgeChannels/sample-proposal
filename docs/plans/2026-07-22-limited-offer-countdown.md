# Limited Offer Countdown Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Start an eight-day 20% pilot discount on the customer's first Proposal visit, count down visibly, and restore full pricing automatically at expiry.

**Architecture:** Persist offer start and expiry timestamps with the existing order preview state. Derive all line items and totals from a shared `now` value so order, preview dock, and finance views switch together. Render a flat, mobile-first urgency strip with active, final-24-hours, and expired states.

**Tech Stack:** React 19, TypeScript, CSS, Vite, browser-based UI verification.

---

### Task 1: Persist the offer window

**Files:**
- Modify: `src/post-meeting/types.ts`
- Modify: `src/post-meeting/App.tsx`

**Steps:**
1. Add offer start and expiry timestamps to `OrderState`.
2. Initialize missing timestamps on first load and preserve them in local storage.
3. Add a one-second application clock and pass it to price-consuming views.
4. Build and confirm TypeScript accepts migrated stored orders.

### Task 2: Make pricing time-aware

**Files:**
- Modify: `src/post-meeting/config.ts`
- Modify: `src/post-meeting/components/OrderView.tsx`
- Modify: `src/post-meeting/components/PreviewCheckoutDock.tsx`
- Modify: `src/post-meeting/components/FinanceView.tsx`

**Steps:**
1. Add helpers for active, urgent, and expired offer states.
2. Keep the discount line while active and remove it after expiry.
3. Calculate all totals against the same clock value.
4. Build and verify active and expired totals.

### Task 3: Add the urgency strip

**Files:**
- Modify: `src/post-meeting/components/OrderView.tsx`
- Modify: `src/post-meeting/styles.css`

**Steps:**
1. Render the strip before the price breakdown.
2. Show days, hours, minutes, and seconds while active.
3. Intensify red motion during the final 24 hours.
4. Show a static expired message and original-price confirmation after expiry.
5. Disable flashing under `prefers-reduced-motion`.

### Task 4: Verify all states

**Files:**
- Verify: `src/post-meeting/config.ts`
- Verify: `src/post-meeting/components/OrderView.tsx`
- Verify: `src/post-meeting/styles.css`

**Steps:**
1. Run `npm run build` and expect success.
2. Check the active state in a mobile viewport.
3. Temporarily exercise the final-24-hours and expired branches without leaving test data behind.
4. Confirm expiry removes the discount and restores the full total.

