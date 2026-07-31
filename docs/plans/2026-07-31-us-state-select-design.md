# U.S. state selection

## Goal

Replace free-form state entry for U.S. shipping addresses with a reliable native list.

## Behavior

- U.S. addresses show the 50 states and Washington, DC.
- Each option displays the state name and standard two-letter abbreviation.
- The saved value is the two-letter abbreviation.
- Google address results using either a state name or abbreviation map to the same option.
- Non-U.S. addresses retain a free-form state or region field.
- An empty or unknown U.S. state blocks payment with an inline validation message.

## Responsive behavior

Use the native select control so mobile devices provide their platform state picker while desktop browsers provide a familiar keyboard-accessible list.
