# Unified demo and account entry

## Intent and acceptance

Use one /#/auth/sign-in entry for prepared demo personas and real Supabase accounts. Present Candidate, Recruiter and Hiring manager role buttons followed by the personal-account panel and matching demo personas. Keep the simulated scenario and protected cloud records distinct while making navigation coherent. Reuse existing buttons/inputs/outlined panels, a labelled button group with aria-pressed, responsive wrapping and the existing persona cards; no new theme or control family.

Accept when each role shows the matching prepared people and real account login, a candidate can register, and an authorized employer can choose recruiter or hiring manager. These two employer roles currently share the existing employer membership/ownership permissions; selecting either role does not create rights or expose another owner's drafts. Accounts without employer membership receive a clear denial. Employer account activation remains owner-managed; no new privilege-granting endpoint is introduced.

Personal-account entry clears the active simulated persona. Choosing a demo persona signs out the real session locally before entering demo. The shared Supabase client/session subscription, role routes and public header avoid competing sessions and routes. A role preference contains no token and never authorizes database access. Candidate views filter applications by the authenticated candidate, while employer inboxes show assigned jobs. Legacy /pilot and /pracodawca/oferty URLs still work and redirect signed-out users to the common entry. Cloud offers and ESCO remain available in employer panels.

Existing demo next links remain for compatible local roles; account login uses fixed role destinations. Operator teaching materials remain a demo-only entry. Shared form/domain/storage behavior and all existing RLS/column grants stay in force. Real registration remains candidate-only and confirmation still depends on Supabase email/redirect configuration.

## Verification and review

55 unit tests passed, including fixed role destinations, prepared persona role mapping, candidate entry, denied employer role selection without membership, matching/mismatched membership identity and provider failure. Focused formatting/lint, TypeScript and Vite build passed. Reviewed real/demo switching, role-labelled navigation, candidate-specific application filtering, legacy signed-out redirects and unchanged owner-scoped RLS. Re-read the hosted RLS policies to confirm role preferences do not grant database privileges. No database or authorization migration was needed: recruiter and hiring manager intentionally share the existing employer capabilities. The browser journey helper now chooses the relevant role before selecting a prepared persona.

The full ./scripts/verify remains blocked by the pre-existing docs/production-readiness.html formatting issue. New-screen visual and live demo/role checks are recorded after Deploy Preview verification; real credential entry is not assumed from unit checks.
