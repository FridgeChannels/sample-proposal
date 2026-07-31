# Desktop payment summary position

## Goal

Keep the payment action visible in the desktop right column beside the Order summary, where the confirmed shipping method is shown.

## Layout

- Order summary and shipping address remain in the left column.
- The confirmed shipping method and its included-fee explanation live in Order summary.
- Amount due and the payment button lead the right column beside Order summary.
- Supporting payment information follows the primary action.
- The payment column may become sticky only after reaching that natural position.
- At 900px and below, the page returns to one column and keeps Payment after the shipping address.

## Constraints

- Do not duplicate payment totals or actions.
- Do not change order, shipping, validation, or Stripe behavior.
- Preserve the existing mobile-first reading order.
