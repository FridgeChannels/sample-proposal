# Christmas ASIN campaign page design

## Goal

Turn the four-page campaign brief into a complete, mobile-first web experience while reusing the visual system from the proposal currently served at `http://localhost:4173/`.

## Content architecture

1. Hero: campaign title, video demo, primary value proposition, and one apply action.
2. Value loop: five outcomes presented as a flat numbered sequence.
3. Offer: Christmas-only terms, qualification language, deadline, and one application action.
4. Application: seven required contact fields followed by five guided ASIN questions.
5. Booking: confirmation state and the existing FridgeChannel Calendly destination.

## Design system

- Reuse the current proposal CSS at runtime through `extractGiftChallengeConfig()`.
- Extend its exact `--leg-*` tokens for the new page rather than introducing a separate theme.
- Preserve the current Inter Tight typography, warm neutral canvas, forest green, orange accent, pill actions, and restrained shadows.
- Add only a small seasonal layer: an evergreen/red accent pair, a CSS snow pattern, and simple inline SVG icons.
- Keep mobile sections flat and separator-free. Use space, type, and background changes for grouping.

## Interaction

- Sticky translucent navigation provides direct wayfinding and an apply shortcut.
- Multi-select answers use toggle buttons with immediate pressed feedback.
- Single-select answers use native radio inputs styled as large touch targets.
- Native input validation covers all required contact fields and guided questions.
- A successful local submit reveals the booking destination and scrolls it into view.
- Motion is limited to short reveal/press feedback and is disabled under reduced-motion preferences.

## Verification

- Run the TypeScript/Vite production build.
- Verify both the development and production routes return success.
- Inspect desktop and 375px mobile screenshots for clipping, overlap, and hierarchy.
- Exercise selection, validation, submit, and booking-link states in a real browser.
