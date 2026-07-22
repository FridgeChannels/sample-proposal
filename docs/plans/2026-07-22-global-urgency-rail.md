# Global Urgency Rail Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Goal:** Show a compact, state-aware conversion prompt every time a customer reloads or re-enters the proposal, without cards or persistent content obstruction.

**Architecture:** Mount one global urgency rail in `App` so it appears across Live Demo, Sample Content, Review Order, address, and internal finance views. The rail derives its message from the existing offer/order/finance state, starts expanded on each full page load, collapses after 1.2 seconds, and links to the most relevant next step. External finance-token pages remain standalone and do not show the proposal urgency rail.

**Tech Stack:** React, TypeScript, CSS animations, existing local order persistence.

---

### Task 1: Build the global state-aware urgency rail

**Files:**
- Create: `src/post-meeting/components/GlobalUrgencyRail.tsx`
- Modify: `src/post-meeting/config.ts`

**Steps:**
1. Derive active, urgent, critical, expired, secured, finance-sent, finance-viewed, payment-pending, and paid display states.
2. Render a full-width button with one primary destination per state.
3. Start expanded and collapse after 1.2 seconds on component mount.
4. Keep countdown values tabular and accessible without announcing every second.

**Test:** Build succeeds and each state returns distinct copy, tone, and destination.

### Task 2: Mount globally and remove the duplicate order-only strip

**Files:**
- Modify: `src/post-meeting/App.tsx`
- Modify: `src/post-meeting/components/OrderView.tsx`
- Delete: `src/post-meeting/components/PilotOfferStrip.tsx`

**Steps:**
1. Mount the urgency rail once for every customer-facing proposal view.
2. Exclude external finance-token pages, loading, and invalid-link screens.
3. Remove the old order-only urgency strip.
4. Route taps to Review Order or Finance depending on the current state.

**Test:** Hard reload each proposal section and confirm only one urgency module appears.

### Task 3: Add compact mobile-first visual behavior

**Files:**
- Modify: `src/post-meeting/styles.css`

**Steps:**
1. Reserve only the collapsed rail height in page layout.
2. Let the 1.2-second expanded state overlay content temporarily.
3. Use flat borders, editorial type, a red urgency accent, and no container card.
4. Animate only the entry reveal, sweep, pulse, and final-hours accent.
5. Disable nonessential motion for `prefers-reduced-motion`.

**Test:** Verify 365×898 mobile layout, bottom navigation, checkout dock, and top rail do not overlap permanently.

### Task 4: Verify state behavior

**Files:**
- Verify: `src/post-meeting/*`

**Steps:**
1. Build and run `git diff --check`.
2. Verify active, urgent, expired, approved, finance-viewed, and payment-pending states in the browser.
3. Reload to confirm expanded entry animation repeats without resetting the eight-day expiry.
4. Confirm external finance links do not show the proposal urgency rail.

**Test:** End-to-end browser checks pass with no duplicate or contradictory calls to action.
