---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 4-4-run-stop-and-retry-video-jobs
---

# Story 4.4: Run, Stop, And Retry Video Jobs

## Intent

Creators can run, stop, and retry Ready Project video jobs through Project Studio while keeping failed work visible.

## Acceptance

- [x] Ready video jobs can start through the existing background `START_BATCH` video path.
- [x] Running jobs show Running state and expose Stop.
- [x] Stopped or failed jobs remain visible as Failed and can be retried.
- [x] Completed jobs record output media metadata from background `PREVIEW_READY`.
- [x] Jobs without a selected start-frame Flow media ID become Needs Review instead of running ambiguously.

## Dev Agent Record

### Completion Notes

- Added `uiBatchId` to background video `PROMPT_STATUS` messages.
- Added Project Studio run/stop/retry bridge for one Project video job at a time.
- Added runtime message handling to update Project video jobs from background status and preview events.
- Flow context stale-media repair remains in Epic 5 recovery stories.

### Verification

- `node --check src/background/runtime/02c-video-generation.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for Run payload, Complete update, Stop, and Retry.

## File List

- `src/background/runtime/02c-video-generation.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-4-4-run-stop-and-retry-video-jobs.md`

## Status

Done.
