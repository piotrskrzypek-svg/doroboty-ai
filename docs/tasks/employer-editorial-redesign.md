# Employer candidate flow: editorial redesign

## Intent

Apply the user's selected DoRoboty.ai direction 01 to the active employer candidate flow: candidate list, curated shortlist, and application detail. The source is `DoRoboty.ai/design-system/DESIGN.md` and the `doroboty-ai-editorial` skill. The user explicitly chose this direction, overriding the repository's Poster People visual default for these screens.

## Acceptance criteria

- Opening `/#/app/kandydaci` in a fresh browser shows only employer personas, styled in the same editorial direction; selecting one returns to that candidate list.
- A wrong-role visitor can switch persona and return to the requested employer route without losing the route context.
- Warm paper, ink, restrained rust, heavy readable display type, serif accent, thin rules, and rectangular actions are consistent across the employer list and detail.
- Candidate rows and shortlist entries are open and scannable; no rounded dashboard cards or default shadows remain in this flow.
- Job selection, search, shortlist links, application tabs, note entry, and stage decisions retain their behavior.
- Desktop and narrow mobile layouts remain readable and keyboard controls show focus.

## Register review

The visual redesign alone did not change behavior. A Chrome follow-up exposed a route-entry issue: a fresh browser had no selected persona, showed the generic picker, and selection sent employers to offers. The route-entry correction changes simulated persona navigation, so `FEATURES.md` AUTH-03 and AUTH-04 were updated.

## Verification

- `./scripts/verify`: formatting, design-system integrity, lint, types, 28 unit tests, participant packet, and build passed. Its Playwright step could not start the local preview on port 3106 inside the sandbox (`listen EPERM`).
- With local port access and installed Chrome, 32 of 33 applicable browser journeys passed initially. The remaining accessibility test found insufficient rust contrast in a small kicker and tab buttons; both were corrected.
- After rebuilding, the failed accessibility and stage-history journey passed, and the shortlist journey passed again. The two PDF viewer journeys were excluded because the installed Chrome PDF viewer does not expose those requests to Playwright in this environment.
- Reviewed the rendered list and application detail at the normal viewport and 390 px. Both used the editorial palette and flat geometry without horizontal overflow; tabs, buttons, labels, and stage state remained visible.
- Follow-up: a fresh-browser Chrome journey passed. The direct link showed only employer personas in the editorial style, selecting Karolina opened the candidate list, and switching from a wrong-role view returned to the same route.
