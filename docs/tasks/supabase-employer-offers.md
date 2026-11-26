# Supabase employer offers

## Intent and acceptance

Persist the full employer offer and selected ESCO metadata across authenticated browser sessions/devices. Keep the existing shared form and schema; use real Supabase Auth at /#/pracodawca/oferty and /#/pracodawca/oferty/:id. The simulated persona picker does not grant cloud access. An explicit employer_accounts membership is seeded only from already assigned pilot recruiters. New candidate signup cannot self-promote.

Reuse C01 buttons, C02 fields, C04 approval, C17 recovery and C19 status with existing outlined panels/Field/PageTitle recipes. The shared form is extracted from the existing employer editor; browser-local publication remains available. Cloud saves are private drafts, explicitly labelled as such, not public marketplace publication. The full payload includes source brief, generated/edited description, conditions and ESCO URI/label/description/selected skills. No automatic import of browser-local offers.

Accept when the authorized employer can insert, list, reopen and update a full offer including ESCO. Reload/another authenticated session returns the saved payload. Errors keep unsaved form text. Revision-qualified updates prevent stale clients overwriting newer changes. Candidates, anonymous clients and unrelated employers cannot read/write another owner's drafts or change ownership. No cloud delete action is granted.

## Database contract

employer_offers stores id, server-default owner_id, JSON data, server-managed revision and updated_at. The data uses the shared Zod job schema narrowed to UUID IDs, cloud company marker and draft/unverified states. The migration embeds its generated JSON Schema for pg_jsonschema validation plus explicit row/payload ID, size and salary-order checks. Ownership and revision columns are not client-writable. RLS also requires server-managed employer membership. No service key or SECURITY DEFINER code is used. The existing pilot_jobs and applications remain unchanged.

The schema snapshot must be regenerated from cloudOfferDataSchema when this contract changes. Inspect generated SQL and run validation queries after applying migrations. The migration was created with the Supabase CLI migration-new command.

## Verification and review

47 unit tests passed, including insert payload/ownership separation, revision-qualified updates, stale-save failure, provider errors, response identity validation and a generated JSON Schema snapshot check. Focused lint, TypeScript and Vite build passed. The hosted migration was applied and transactional SQL assertions passed for full brief/description/ESCO round-trip, owner edit, server revision increment, stale update rejection, schema validation, immutable ownership, candidate/anonymous/unrelated-employer isolation and denied self-promotion. All synthetic database test changes were rolled back.

Reviewed the authentication gate independently of the simulated roles, privileged column grants, read/write RLS, fixed save identity for retry, record identity validation and form error recovery. Existing editor fields/ESCO are reused rather than duplicated. Browser breakpoint comparison and a real account save/reopen journey remain separate from these backend/unit checks. The security advisor found no new table/policy issue; the pre-existing leaked-password-protection warning remains (https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Performance notices concern two existing pilot foreign keys, not the new indexed owner relation.

The full ./scripts/verify remains blocked by the pre-existing docs/production-readiness.html formatting warning. Changed-file formatting is checked separately. No production merge is performed; the review branch includes the pending pilot and ESCO work from PRs #3 and #4.
