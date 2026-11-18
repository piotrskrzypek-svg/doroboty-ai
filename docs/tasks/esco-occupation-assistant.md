# ESCO occupation suggestions

## Intent and acceptance

Add optional live ESCO occupation search to /#/app/oferty/nowa and the existing employer job editor. Reuse C01 buttons, C02 inputs, C04 checkboxes, C17 recovery and C19 status with the host Field/panel typography. A named section contains search, a native list of choice buttons, a Polish profile description, source link and independently selectable skills. No new theme or interaction primitive.

Accept when an employer can search, choose a profile, pick skills and explicitly append source material to the editable description without overwriting existing text. Save the profile URI, Polish label/description and selected skill URIs/labels in the optional job escoProfile property. Existing saved scenarios remain valid, including import/export and edit/reload. This extends the browser-local employer editor, not the separate Supabase submission pilot. Human approval remains required before publication.

## Integration

The Netlify function /.netlify/functions/esco accepts GET q (3–200 characters) or a strict ESCO occupation URI. It requests only the fixed official API with language=pl, eight search results and a timeout. Empty results can retry without AI/seniority prefixes, with the effective phrase shown. Essential and optional skill relations are labelled; no skill is automatically selected. Provider failures leave manual editing available. Responses validate through Zod; rate limiting and bounded short-lived caching reduce provider load. No query/free text is logged, and only a deliberate search sends the occupation phrase to ESCO. Descriptions render as text, never HTML.

The official API responded without credentials on 2026-11-18. The announced future API/key transition has no published activation instructions in the announcement. Do not invent a key header: adapt the server function when the actual new contract is available; keep any future key in Functions-scoped server environment variables. No key belongs in VITE variables. Current source: https://ec.europa.eu/esco/api/doc/esco_api_doc.html and https://esco.ec.europa.eu/en/news/upcoming-change-esco-api.

Local frontend: npm run dev; live backend: netlify dev (Netlify CLI) or Deploy Preview. Plain Vite/static hosting cannot execute the optional function; the section shows a recoverable failure and manual publication remains available.

## Validation and review

40 unit tests passed (including six ESCO boundary/persistence checks); TypeScript, focused lint and Vite build passed. A bundled function smoke test against the real ESCO service returned one Polish occupation and 25 related skills for AI Product Manager. Reviewed fixed upstream destination/URI validation, stale-request cancellation, manual approval, optional metadata compatibility and text-length handling. Full ./scripts/verify encountered the existing docs/production-readiness.html formatting issue; changed files are checked separately. Browser acceptance and live Netlify function checks are recorded after deployment.
