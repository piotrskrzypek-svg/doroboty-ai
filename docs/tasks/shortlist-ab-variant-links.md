# Shortlist A/B prototype links

## Intent

Make the existing employer candidate scenario available as two stable, shareable variants for a small moderated prototype comparison. A shows the complete application list without the curated shortlist; B shows the existing shortlist above the same complete list. This is a synthetic usability exercise, not a live recruitment experiment or a measurement of the 30-day North Star.

## Acceptance criteria

- `/#/app/kandydaci?wariant=A` opens the ordinary full list for Karolina's BrightLabs role and hides only the curated shortlist section.
- `/#/app/kandydaci?wariant=B` opens the current shortlist and full list. A fresh tab without a query defaults to B; after an explicit A or B link, that tab keeps its choice.
- The chosen variant survives job selection, application detail navigation, return, and reload within the same browser tab. A later explicit A or B link replaces the tab's previous choice.
- Each link works from a fresh browser session through the employer persona picker. There is no assignment, telemetry, real invitation, or cross-browser result collection.
- The normal employer and candidate flows, empty jobs, keyboard access, narrow widths, reset/import, and prepared scenario records remain valid.

## Verification record

The route reads `wariant=A/B` and remembers an explicit choice in tab-scoped session storage. A omits the existing EmployerShortlist component; B and the ordinary route retain it. The source kit and host visual recipes did not change.

Targeted lint, TypeScript, 34 unit tests, participant-packet verification and production build passed after rebasing onto current `origin/main`, including the optional PostHog integration. The source kit passed its 67-file integrity check and six reference tests when run with Node 24. Two focused browser journeys passed with locally installed Chrome: the new A/B link journey (including fresh persona selection, detail return, job change, reload and explicit B override) and the existing B shortlist journey. Desktop and 390px A screenshots were visually inspected; the A and B tests found no horizontal overflow at 320px. The new code and documentation passed targeted Prettier and `git diff --check`. PostHog removes route queries and does not attach an experiment variant or shared recruiting outcome, so manual pilot results must be recorded outside the app.

The repository-wide `./scripts/verify` stopped at `format:check` because the unchanged `docs/production-readiness.html` is not Prettier formatted. The default Playwright run also could not launch because its bundled Chromium executable is not provisioned; the same focused tests passed with system Chrome through a temporary local configuration. These local checks do not establish Netlify deployment or human research results.
