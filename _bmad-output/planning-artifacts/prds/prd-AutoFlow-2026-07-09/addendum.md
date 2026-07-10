---
title: "AutoFlow PRD Addendum"
created: "2026-07-09"
updated: "2026-07-09"
---

# AutoFlow PRD Addendum

## Source Boundary

This PRD run used only:

- `_bmad-output/project-context.md`
- `README.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `docs/research-notes.md`
- `docs/connection-fix-v5-audit.md`
- `docs/connection-fix-v6-audit.md`
- `manifest.json`

External research was intentionally skipped because the requested PRD must be based only on the existing project context and current project goals.

## Implementation Context for Downstream Architecture

- The current background runtime uses `src/background/service-worker.js` -> `src/background/runtime.js` -> ordered `src/background/runtime/*.js` via `importScripts()`.
- The current side panel uses ordered classic scripts loaded directly from `src/sidepanel/index.html`.
- CSS is split by source order through `src/sidepanel/sidepanel.css`.
- The MAIN-world content script intercepts selected Flow fetch responses and posts `FLOW_AUTO_INTERCEPT`; the isolated bridge forwards page events to the background runtime.
- The connection fix audits are product-relevant because they identify a reliability requirement: connection checks must respond through the single message router and avoid closed message-port errors.

## Notes Excluded From PRD Main Body

- The source artifacts mention a future upgrade path: explicit shared-state objects, ES modules, a small build step, source maps, and browser smoke tests. The PRD keeps this out of current scope because the sources frame it as future architecture work, not current product scope.
- The source artifacts do not specify business, adoption, retention, pricing, or distribution targets.
