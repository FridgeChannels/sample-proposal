# Paid navigation design

## Goal

Keep the paid order state while allowing the customer to revisit the Live page and the Pilot Plan.

## Navigation

- The FridgeChannel brand control in the Receipt header opens the canonical Live page.
- Live remains available after payment.
- “See Pilot Plan” opens the Pilot Plan after payment.
- “View receipt” on the paid Pilot Plan returns to the Receipt.
- Address editing remains unavailable after payment.
- A finance token is removed when leaving the Receipt for the canonical Live page.

## Paid Pilot Plan

- Keep the full plan content visible.
- Show the order status as Paid.
- Replace “Place Order” with “View receipt”.
- Do not allow creation of another payment link.
- Keep payment urgency and countdown messaging hidden.

## Verification

- Build and type-check.
- Verify the paid flow at 390px: Receipt → Live → Pilot Plan → Receipt.
- Verify no payment-link creation control appears on the paid Pilot Plan.
- Verify the page has no horizontal overflow.

