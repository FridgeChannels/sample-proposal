# Shipping name and address autocomplete

## Goal

Reduce mobile checkout typing by splitting the recipient into first and last name fields and suggesting structured shipping addresses as the user types.

## Design

- Keep `recipientName` as a compatibility field while adding optional `firstName` and `lastName` values.
- Request Google Places Autocomplete (New) through the proposal server so the API key is never exposed to the browser.
- Start searching after three characters with a short debounce and a UUID session token.
- Show at most five keyboard- and touch-accessible suggestions with Google Maps attribution.
- Resolve the selected place through Place Details (New), then fill street, city, state, postal code, and country.
- Preserve manual input at all times. Missing configuration or upstream errors must not block checkout.
- Retain legacy full names by deriving first and last name when structured fields are absent.

## Verification

- TypeScript and production build complete successfully.
- API endpoints return a clear configuration error without a key.
- The mobile form keeps first and last name side by side at 365–430px.
- Keyboard navigation supports Arrow Up, Arrow Down, Enter, and Escape.
