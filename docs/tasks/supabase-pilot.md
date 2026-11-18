# Shared application pilot

Start with one synthetic job and a candidate submission visible to the assigned recruiter across browsers. Supabase Auth provides the identities, and database policies enforce the separation. The local teaching scenario needs no account or infrastructure.

Accept when a candidate can submit once, the assigned recruiter can read the submission, and anonymous visitors and unrelated accounts cannot read it. Apply the migration in a test project before wiring the published build.

## Candidate self-registration

Added a registration mode on the pilot login form with matching passwords and an eight-character minimum. Supabase signUp manages the account and confirmation requirement. With an active session candidates proceed to the job form. With confirmation pending they see an instruction to confirm their email and return to sign in. No registration metadata grants recruiter ownership.

Validation: changed-file formatting and lint, TypeScript, 34 existing unit tests and build passed. Email delivery and the confirmation journey still require a real user mailbox. Default Supabase SMTP has delivery restrictions and the site redirect must be configured for external onboarding.

## Recruiter submission readability

Show the number of submissions per job and render each answer in a separate numbered card. Two adjacent answers previously looked like one submission. This presentation change keeps the existing database access rules and records.
