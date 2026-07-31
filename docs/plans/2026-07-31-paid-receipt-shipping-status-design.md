# Paid receipt shipping status design

## Goal

After payment, give the customer a truthful fulfillment status and one clear next step without implying that shipment data already exists.

## Shipping status

Show:

- Current shipping status
- Preparing for shipment
- “We’re preparing your order for shipment. Tracking information will be available once your order ships.”

Do not show an empty tracking number, empty carrier, logistics map, estimated route, or full logistics timeline.

## Actions

- Primary: View order in Dashboard
- Secondary: Download receipt

The primary action opens the existing FridgeChannel production dashboard. Download receipt keeps the browser print-to-PDF behavior.

## Mobile presentation

Use a flat section with a green status dot, typography, and spacing. Do not add cards, borders, or divider lines. Keep both actions at least 44px high and visually distinguish the dashboard as the primary next step.
