# Shipping method confirmation

## Goal

Let users choose a door-to-door delivery option in Pilot Plan, then carry that confirmed choice through payment without asking them to decide again.

## Experience

- Ocean freight is selected by default at $200 with an estimated 35-day delivery time.
- Air freight costs $800 with an estimated 5–12-day delivery time.
- Pilot Plan is the only place where the two options are selectable.
- The Pilot Plan keeps ocean selected by default and updates its total immediately when the choice changes.
- Creating the finance handoff confirms the selected method and fee for the order.
- The finance page displays the confirmed method, estimate, and fee in Order summary.
- Shipping inclusions remain collapsed directly below the shipping line under “What’s included in shipping?” until requested.
- The finance page does not repeat the method in a separate Delivery method section.

## Billing integrity

- The server owns the allowed methods and fees.
- New orders persist the default method, shipping fee, shipping line item, and total.
- Linking the shipping address reuses the method already persisted on the order and does not accept a replacement method from the payment page.
- Stripe receives the shipping line item, and its finalized total must match the persisted order total.
