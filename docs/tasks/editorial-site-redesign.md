# Editorial direction across the app

## Intent

The user selected direction 01, an editorial poster, for the entire DoRoboty.ai teaching app. The earlier change covered only the employer candidate flow. This task extends the same direction to public pages, both workspaces, forms, application records, settings, and navigation. The user's explicit visual choice supersedes the repository's older Poster People default for the host UI; the bundled reference kit remains untouched.

## Acceptance criteria

- Home, listing, offer, company, methodology, sign-in, candidate/employer workspaces, and application flow share warm paper, ink, restrained rust, heavy readable display type, serif accents, thin rules, flat controls, and open rows.
- Original contemporary AI allegories from the selected prototype appear on suitable public and workspace screens with accurate captions. No generic laptop illustration remains in the new hero/listing/detail compositions.
- Existing routes, roles, local state, filters, saved offers, application submission, shortlist, stage decisions, forms, and recovery remain functional.
- Desktop and 390 px mobile layouts avoid horizontal overflow and preserve visible focus, labels, and readable long titles.
- The shared brand mark and browser favicon use an antique portico instead of the former robot.

## Behavior register

Reviewed `FEATURES.md` and updated the current visual descriptions. Routes and product behavior did not change in this task.

## Verification

`./scripts/verify` passed formatting, design-kit integrity, lint, type checking, 28 unit tests, participant packet verification, and production build. Its default Playwright step could not bind local port 3106 in the sandbox (`EPERM`). The Chrome browser run passed 35 tests using a temporary local configuration; two PDF-viewer tests were excluded because Chrome's built-in viewer handles those requests differently. Desktop and narrow mobile views were visually reviewed across public, candidate, and employer screens. The shared portico mark was reviewed in the employer sidebar after a browser reload.
