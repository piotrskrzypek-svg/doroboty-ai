# PostHog integration

## Intent and acceptance

Connect the optional browser analytics SDK to the owner's PostHog EU project. Preserve standalone participant setup and hash routes. Track only pageviews with route templates; never send form contents, CVs, search terms or shared demo-person identities. Disable autocapture, recordings and surveys. Missing production configuration remains a no-op.

Acceptance: configured SDK receives initial and navigated pageviews once; unconfigured builds work; route tests exclude dynamic IDs and query strings; existing verification is run. Publishing and live ingestion are separate checks.

## Review and validation

Separate self-review: checked hash-route handling and StrictMode deduplication; replaced captured properties with an explicit allowlist to exclude page titles, referrers, queries and arbitrary SDK properties. Shared synthetic personas deliberately remain anonymous. No visual UI changes. No merge or deployment performed.

Passed: changed-file Prettier/ESLint, repository ESLint and typecheck, 33 unit tests (7 files), design-system integrity/example checks, baseline packet check, production build with and without PostHog configuration. Build warns about the bundle size and existing Zod annotations.

`./scripts/verify` stops at an existing formatting issue in docs/production-readiness.html (not changed here). Subsequent checks were run separately. All 37 browser journeys could not launch because the required Playwright chromium_headless_shell-1243 binary is absent; no browser dependencies were installed. Live ingestion is unverified. The hosting provider must receive the two build-time variables and rebuild before events can arrive.

## Netlify activation follow-up

Configured the public project token and EU host on the existing dorobotyaii Netlify site. Review found that the event allowlist must retain the public transport token; added it and a regression assertion, and removed top-level person properties. System Chromium also cannot launch under this execution environment (socket operation not permitted), so browser journeys remain blocked. No OS packages were installed.
