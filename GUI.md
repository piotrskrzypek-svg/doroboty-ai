# GUI — DoRoboty.ai editorial direction

The user selected **01 — Plakat redakcyjny** for the entire app. See the local source observations in [`../DoRoboty.ai/design-system/DESIGN.md`](../DoRoboty.ai/design-system/DESIGN.md) and the installed [`doroboty-ai-editorial` skill](/Users/piotr.skrzypek/.codex/skills/doroboty-ai-editorial/SKILL.md). Their hex values and font stacks are prototype estimates, not measured official brand tokens.

## Current host implementation

- [`src/app/editorial-site.css`](src/app/editorial-site.css) contains the app-wide palette, typography, flat controls, open rows, page layouts and mobile adaptations.
- [`src/app/editorial-employer.css`](src/app/editorial-employer.css) refines the employer candidate list and application detail.
- [`src/app/illustrations/`](src/app/illustrations/) contains contemporary AI allegories reused from the selected local prototype. Keep captions and truthful alternative text; do not describe them as museum objects.
- The shared brand mark and favicon use an antique portico in the rust and paper palette.
- Use warm paper, near-black ink, restrained rust, heavy readable sans display type, a brief italic serif accent and thin rules. Keep functional screens quieter than public hero sections.

## Product and verification boundaries

Preserve the React/TypeScript/Vite app, hash routes, Base UI composition, local Zod state, role controls, filters, forms and application flows. Keep the bundled Poster People kit in [`docs/design-system/agent-kit`](docs/design-system/agent-kit) immutable as a historical reference; its visual tokens are no longer the current host target under the user's selected direction.

Check desktop and narrow mobile views, long titles, keyboard focus, selection, dialogs, error states and data recovery. Run `./scripts/verify` and report the checks that actually ran. The editorial task scope and evidence are recorded in [`docs/tasks/editorial-site-redesign.md`](docs/tasks/editorial-site-redesign.md).
