# Isolated shortlist test session

## Intent

Fix the A/B links so they always start with the same prepared BrightLabs role and three synthetic applications, even when the browser already has another persona, an empty job, or an older saved scenario. Keep the user's existing local scenario untouched.

## Acceptance criteria

- Opening either `/#/app/kandydaci?wariant=A` or `?wariant=B` starts a tab-scoped test session as Karolina with the AI Product Manager role and three submitted applications.
- A omits the shortlist; B shows two curated cards above the same three applications. An explicit switch to the other variant starts that variant from the same clean fixture.
- The session survives detail navigation and reload in its tab. Stage decisions stay within the test session; the pre-existing localStorage scenario is not overwritten.
- A regular visit with no active test session retains the normal local scenario. The app still works when session storage is unavailable, with an in-memory test session for that visit.
- Record the behavior and run the project checks, focused browser journeys and a separate review before publishing.

## Verification record

The test link now creates a sessionStorage-backed copy of the prepared scenario and selects Karolina. Opening the other explicit variant resets that copy. Ordinary localStorage state is never read or written while the test session is active; the normal route remains unchanged in a fresh tab. An in-memory fallback supports the current visit when session storage is unavailable.

Lint, TypeScript, 34 unit tests, participant-packet verification and the production build passed. The source kit passed its 67-file integrity check and six reference tests under Node 24. Three focused browser journeys passed with locally installed Chrome, including a saved empty Northstar scenario, direct A/B links, detail navigation, a saved stage, reload, variant switch and an assertion that the original localStorage bytes did not change. Desktop and mobile layouts are the same as the previously inspected variant views. `git diff --check` passed.

The required `./scripts/verify` stops at an unchanged Prettier issue in `docs/production-readiness.html`; its remaining checks were run separately. The default Playwright executable is absent, so the focused browser journeys used system Chrome through a temporary local configuration. Netlify deployment and human participant results remain separate checks.
