# Pilot Plan and Finance Handoff Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the three-tab navigation with a single CTA flow from Live Demo to an English Pilot Plan, then generate and copy a secure finance payment link whose destination contains the complete payable order.

**Architecture:** Keep the existing React hash-view shell and shared `OrderState`, but introduce a dedicated Pilot Plan view rather than reusing the current order screen. The Pilot Plan owns proposal content and pricing; the finance-token route owns delivery details, formal order details, payment method, and card inputs. A simplified finance-handoff API creates links without requiring a finance email.

**Tech Stack:** React 19, TypeScript, Vite, Node HTTP server, existing finance-handoff API, CSS.

---

### Task 1: Replace tab navigation with a linear CTA flow

**Files:**
- Modify: `src/post-meeting/types.ts`
- Modify: `src/post-meeting/App.tsx`
- Modify: `src/post-meeting/components/LiveDemoView.tsx`
- Modify: `src/post-meeting/components/SampleContentView.tsx`
- Delete: `src/post-meeting/components/TopNav.tsx`

**Steps:**
1. Add a dedicated `plan` view and map legacy `#order` links to it.
2. Remove `TopNav` from the application shell.
3. Add a fixed `See Pilot Plan` CTA to the Live Demo.
4. Add a clear return path from Sample Content to the Pilot Plan.
5. Verify no three-tab navigation renders.

### Task 2: Build the English Pilot Plan from the supplied PDF

**Files:**
- Create: `src/post-meeting/components/PilotPlanView.tsx`
- Modify: `src/post-meeting/App.tsx`
- Modify: `src/post-meeting/config.ts`

**Steps:**
1. Render Brand, Created Date, and Pilot Order No.
2. Render Order Summary with package, 1,000 pieces, objective, target start date, and payment terms.
3. Preserve the full pricing breakdown: magnets, shipping, discount, tax, and total.
4. Render Timeline & Responsibilities from the PDF in a mobile-readable phase list.
5. Render design confirmation rules and payment terms.
6. Add a Sample Content entry inside the Pilot Plan.

### Task 3: Generate and copy a finance payment link

**Files:**
- Create: `src/post-meeting/components/PaymentLinkModal.tsx`
- Modify: `src/post-meeting/components/PilotPlanView.tsx`
- Modify: `server.js`

**Steps:**
1. Allow `POST /api/finance-handoffs` to create a secure link without finance email or signed-in identity.
2. Keep email delivery optional for backward compatibility.
3. Add a full-width `Place Order` CTA to the Pilot Plan.
4. On click, create the handoff, attempt automatic clipboard copy, and show the generated URL.
5. Provide a manual `Copy Link` fallback and clear error/retry state.

### Task 4: Make the copied link a complete finance payment page

**Files:**
- Modify: `src/post-meeting/components/FinanceView.tsx`
- Modify: `src/post-meeting/App.tsx`

**Steps:**
1. Show product, package, quantity, included services, and the full price breakdown.
2. Keep delivery address inputs on the finance page.
3. Keep payment method choice, card number, expiry, CVC, and ACH option.
4. Keep payment actions clearly marked as preview until real Stripe submission is connected.
5. Ensure finance-token links load directly into the finance page.

### Task 5: Apply mobile-first flat layout

**Files:**
- Modify: `src/post-meeting/styles.css`

**Steps:**
1. Remove visual dependency on the old bottom tab bar.
2. Use flat sections and dividers rather than nested cards.
3. Keep primary CTA controls fixed in the thumb zone with at least 44px tap targets.
4. Validate at 390px and desktop widths.

### Task 6: Verify the complete flow

**Files:**
- Build output under `dist/`

**Steps:**
1. Run `npm run build`.
2. Check `server.js` syntax.
3. Open Live Demo and verify `See Pilot Plan`.
4. Open Pilot Plan and verify PDF content, full pricing, and Sample Content entry.
5. Generate a payment link and verify clipboard fallback.
6. Open the generated link and verify finance order, delivery, and payment fields.
