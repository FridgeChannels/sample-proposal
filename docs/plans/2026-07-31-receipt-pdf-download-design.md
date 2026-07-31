# Receipt PDF download design

## Goal

Replace the browser print dialog with a real one-click PDF download for paid orders.

## Approach

Use the existing unguessable finance token to request the receipt. The server verifies that both the finance handoff and the Stripe Invoice are paid, retrieves Stripe's authoritative invoice PDF, and streams it as an attachment.

This is preferred over generating a PDF from client-side order state because client state can be edited and should not be the source of truth for a payment receipt.

## Endpoint

`GET /api/finance-handoffs/{token}/receipt.pdf`

Successful responses use `application/pdf`, an attachment filename based on the order number, and private no-store caching. Unpaid, missing, or unavailable receipts return a structured JSON error.

## Client behavior

The Download receipt button requests the PDF, downloads it with a stable filename, and shows a loading state. If the receipt is unavailable, an inline error is displayed without navigating away from the paid receipt page.

