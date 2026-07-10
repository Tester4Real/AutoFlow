---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 4-3-add-drafts-to-the-manual-video-queue
---

# Story 4.3: Add Drafts To The Manual Video Queue

## Intent

Creators can manually add reviewed Video Drafts to queue-ready state and manage them before generation.

## Acceptance

- [x] Drafts become Ready video jobs only through explicit user action.
- [x] Ready jobs keep Project, Prompt Record, Selected Variant, and start-frame metadata.
- [x] Visible pre-run controls support remove, reorder, and hold.
- [x] Video rows are explicitly marked as Video jobs.
- [x] Image generation completion does not create or run video jobs.

## Dev Agent Record

### Completion Notes

- Added queue order assignment for Ready video jobs.
- Added move up/down, hold, and remove commands for non-running video jobs.
- Added Project Studio controls and a visible Video job-type chip.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for queue order, move, hold, remove, and Running job protection.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `_bmad-output/implementation-artifacts/spec-4-3-add-drafts-to-manual-video-queue.md`

## Status

Done.
