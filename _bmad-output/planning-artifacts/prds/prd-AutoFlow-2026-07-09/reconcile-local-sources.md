# Input Reconciliation - Local Source Set

## Inputs Checked

- `_bmad-output/project-context.md`
- `README.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `docs/research-notes.md`
- `docs/connection-fix-v5-audit.md`
- `docs/connection-fix-v6-audit.md`
- `manifest.json`

## Reconciliation Summary

- The PRD captures the Chrome MV3 extension shell, side panel, Google Flow URL targeting, content-script world split, and host/permission scope from `manifest.json` and project context.
- The PRD captures the README's core product behavior: side-panel operation, current Google Flow session usage, prompt queueing, generated media tracking, automatic downloads, prompt-index JSON import, Jack reference attachment, exact `.png` / `.mp4` naming, Sync Folder, account switching, and Retry Failed.
- The PRD captures the architecture and code-map constraints: tiny loaders, ordered classic scripts, no bundler, shard ownership, CSS source order, and code-map-first maintenance.
- The PRD captures the connection-fix audit requirements: no extra message-listener shim, callback-based tab scan, 1.2 second fallback, no auth/session/credits/reCAPTCHA/private generation calls during connection checks, and temporal-dead-zone caution.
- The PRD keeps the future module/bundler/test upgrade path out of current scope because the source artifacts frame it as future architecture work, not current product scope.

## Gaps Preserved as Open Questions

- Product naming: AutoFlow versus current TurboFlow docs/extension naming.
- Quantitative product targets: not specified in source artifacts.
- Distribution boundary: private/unpacked versus packaged distribution is not specified.
- Automated browser smoke tests: identified as future upgrade path, not current scope.
- Additional Google Flow URL/account/project variants: not specified beyond manifest and docs.
