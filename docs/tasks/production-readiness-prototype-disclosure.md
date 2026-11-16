# Prototype disclosure

## Intent

Make the app's training-only boundary clear before someone browses offers or chooses a persona. The persona picker is a simulation, not authentication or privacy protection; only synthetic data and example CVs may be used.

## Acceptance criteria

- The public home page shows a visible, readable disclosure before the offer links.
- The person picker repeats the same disclosure before persona selection.
- The message explains that persona choice does not protect data and prohibits real or confidential information.
- Visible storage/action errors offer a user-triggered, sanitized report that excludes scenario and note content.
- Existing routes, styling tokens, and prototype behavior remain intact.

## Implementation and verification

- Reuse the host's existing `prototype-notice` treatment through a shared React component.
- Update the product behavior register.
- Run the local lint, type, unit, packet, and build checks. Browser verification depends on the Playwright Chromium binary being available.
- The report is copied locally only; the participant sends it through the course channel. The actual channel and named incident owner still need to be supplied by the course owner.
