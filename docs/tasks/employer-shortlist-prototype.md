# Employer shortlist prototype

## Intent and acceptance

Test whether an employer can use a transparently hand-curated shortlist, tied to one job's requirements and actual application text, to decide whom to review for an interview. On the employer candidate route, select a job, inspect two recommendations, open the complete application and record the decision through the existing stage flow. Keep all applications available below the shortlist. Use synthetic scenario records only; show an honest empty state for jobs without curation. Search, job selection and stage changes must survive the relevant route/reload behavior. Existing role gates, import/reset and candidate flows remain valid.

## Design mapping

- Route: `/#/app/kandydaci`, with employer-only job selection; detail remains `/#/app/kandydaci/:id`.
- Source families: C07 supporting facts/counts, C09 outlined repeating card anatomy, C15 filter choice, C17 empty recovery. Host controls: FormSelect, Input, Button link variant, PageTitle, ApplicationRecord.
- Data: existing jobs/applications and immutable submitted answers. Curator rationale is a small local scenario fixture keyed by application and job IDs, displayed only when the referenced application exists for the active employer and job. Match Score stays a separate text-based scenario fact.
- New local recipe: shortlist card uses the existing paper/white/ink/pink roles and 24px outlined surface, with focus and narrow-screen wrapping. It is not a new global card or scoring system.
- Acceptance check: employer and candidate role access, curated and empty jobs, full list recovery, updated stages, saved/imported state compatibility, desktop/mobile/320px, keyboard and focus, source-kit integrity and `./scripts/verify`.

## Implementation and verification

The employer candidate route now filters by the selected own job and displays a two-person manual shortlist above all three prepared applications. Without an explicit selection it opens the own job with the latest application; the detail return link preserves the chosen job. The two added candidate/application records are synthetic; older browser saves can add them through an explicit action that preserves existing records and decisions. A new EMP-11 entry and the updated EMP-07 entry in FEATURES.md describe the behavior. The shortlist is an explicit manual teaching fixture, not automatic ranking, a verified skill assessment or evidence of hiring outcomes.

`./scripts/verify` with temporary Node 24 passed format, immutable kit checks (67 files and six reference tests), lint, types, 28 unit tests, participant packet and static build. The configured Playwright Chromium binary is not provisioned, so the default browser stage stopped at launch. A temporary local Chrome test configuration ran all 35 journeys: 33 passed, including the new shortlist journey and the existing publish/application/employer-decision journey. Two existing PDF journeys failed only at their final no-external-requests assertion because local Chrome loaded its built-in `chrome-extension://` PDF viewer assets. The focused shortlist journey passed separately after the final code change and saved a full-page capture at `artifacts/employer-shortlist-desktop.png`. No browser binaries or operating system dependencies were installed.

Manual in-app browser inspection on the running Vite app confirmed the Karolina/BrightLabs shortlist with two evidence-linked cards, all three applications, the Julia detail link and the existing review actions. At 1280px the two cards sit side by side (430px each) without horizontal overflow; 390px and 320px reflow to one column with no document overflow. The manual inspection did not record a stage decision or verify the unprovisioned Playwright suite.

Separate review found and fixed a regression in the default employer list: it now opens the job with the latest application, so a newly submitted application to another job is visible. The detail return link retains that job in the hash query. Final lint, types, unit tests, build and `git diff --check` passed after this correction.
