# DoRoboty.ai — AIPH3 prototype

A frontend-only job marketplace for participants to extend and test. Built with React, TypeScript and Vite, using Base UI components. The required visual direction for new and changed screens is the accepted Poster People design system.

## Design system — start here for UI work

Read [project integration instructions](docs/design-system/README.md), [host implementation rules](docs/design-system/IMPLEMENTATION.md) and [application acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/agent-kit/design.md), [component API](docs/design-system/agent-kit/components/API.md) and the relevant [human documentation](docs/design-system/agent-kit/reference/index.html). The complete 67-file kit is stored under docs/design-system/agent-kit, including reusable CSS/JS, component states, listing/offer examples, screenshots, Geist Serif with license and illustration. No other chat or global skill is required.

```sh
npm run design-system:check
npm run design-system:dev
```

With Node 24, the first command verifies the preserved kit and examples; the second serves a separate local preview at http://127.0.0.1:8952/. No kit installation is needed. The main app uses port 3001 as below.

Build UI from this system, adapting its anatomy and visual roles into the existing React/Base UI components and host tokens. Preserve application behavior and hash routing; do not replace product state with the standalone demo fixtures/controllers. The application has a host adaptation. For every UI task, compare the affected anatomy, type roles, state and keyboard behavior with the reference; passing kit checks alone does not establish visual acceptance. See the integration guide for exact reading order, assets, React mapping, responsive rules and verification. AGENTS.md and CLAUDE.md enforce the same direction.

## Run

Requirements: **Node.js 24 and npm**.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. No environment file, account, database or additional service is required. Package installation requires access to the npm registry.

Select Anna or Marek as a candidate, Karolina or Tomasz as an employer, or the instructor. Publish a job, apply, switch person and record the employer decision. Changes survive reload in this browser; settings provide export, import and reset. AI and scores simulate prepared scenarios. Use example CVs only.

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The static output is dist/. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.

## Optional PostHog analytics

Copy `.env.example` to `.env.local` and set `VITE_POSTHOG_PROJECT_TOKEN` and `VITE_POSTHOG_HOST` from your PostHog project settings. Use the public project token, never a personal API key. The owner uses EU project 355350 (Default project). Set the same variables in the hosting provider **before building**, then rebuild/redeploy; Vite embeds them at build time. No credentials or env files are included in participant packages. Without configuration the production app makes no analytics requests; development logs missing-variable errors without stopping the app.

Initial/hash-route pageviews and automatic click, change and submit interactions are captured. Route templates omit local record IDs, slugs, queries and unknown paths. Filter changes alone do not count as new pageviews. Autocapture masks all text and element attributes and opts no fields into value capture. The outgoing filter retains only event type and DOM structure (tag and sibling positions), excluding text, input values, IDs, classes and URLs. Session replay, surveys and automatic exception capture remain disabled. Anonymous IDs are memory-only; selecting a shared synthetic persona does not identify a real participant. Do not interpret these counts as unique people across reloads.

After deployment, open the site, navigate between pages and verify `$pageview` and `$autocapture` events and `route` in PostHog Activity. Local checks do not prove live ingestion. A first-party reverse proxy can improve delivery when ad blockers block the ingestion host: https://posthog.com/docs/advanced/proxy. SDK reference: https://posthog.com/docs/libraries/react-router/react-router-v7-declarative-mode.
