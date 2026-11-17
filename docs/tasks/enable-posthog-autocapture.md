# Enable PostHog interaction autocapture

## Intent and acceptance

Enable the user's requested click, change and submit autocapture in the deployed prototype and existing PostHog project. Preserve anonymous pageviews, sanitized hash-route templates and the boundary excluding CVs, form values, page text and arbitrary DOM attributes. Keep session recording disabled. Verify changed-file formatting/lint, types, unit tests and production build; run the required verification gate and report existing blockers. Confirm a real production interaction arrives as `$autocapture` after deployment.

## Review and validation

Passed: changed-file Prettier and ESLint, TypeScript, 34 unit tests across 7 files, production build with and without SDK configuration, and git diff --check. The required ./scripts/verify gate still stops at the pre-existing formatting issue in docs/production-readiness.html. Browser journeys remain subject to the previously verified Chromium launch restriction in this environment; no browser/OS packages were installed.

Separate review: verified the filter permits only pageviews and valid click/change/submit autocapture, retains the transport token, rebuilds route templates from the active hash, strips person properties and retains only DOM tag/sibling structure. Unit coverage checks the masking configuration and all three interaction types with private text, attributes and query strings. Session recording stays disabled. Project 355350 autocapture_opt_out was explicitly set to false at the user's request. Production ingestion remains to be verified after deployment.
