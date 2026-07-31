# Payment form validation design

## Scope

This feedback applies to the FridgeChannel shipping form immediately before the Stripe handoff.

## Required fields

First name, last name, address line 1, city, state, ZIP code, country, and phone are required. Company and address line 2 are optional.

## Interaction

- Keep untouched fields neutral so the page does not open in an error state.
- Validate a field after the customer leaves it.
- Show a short inline error under an invalid field.
- Show a green check beside a valid field.
- Keep the payment button available. If it is pressed before completion, show the remaining required-field count and move focus to the first invalid field.
- Show progress as “x of 8 complete”, followed by “Complete ✓” when all required fields are valid.
- Show “✓ Shipping information complete” beside the payment action when the form is ready.

## Format checks

- U.S. ZIP codes accept five digits or ZIP+4.
- Phone numbers accept 7–15 digits after punctuation and spaces are removed.

## Mobile behavior

On narrow screens, the general feedback appears directly above the fixed payment button. Field errors remain inline so the correction is visible in context. The layout must not introduce horizontal scrolling.

