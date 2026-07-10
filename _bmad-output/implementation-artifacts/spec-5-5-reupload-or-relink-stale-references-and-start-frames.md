---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-5-reupload-or-relink-stale-references-and-start-frames
---

# Story 5.5: Reupload Or Relink Stale References And Start Frames

## Intent

Stale or missing selected start-frame media IDs can be repaired for the current Flow context before retrying video generation.

## Acceptance

- [x] Video jobs with stale/missing start-frame media expose a repair action.
- [x] Repair uploads the selected cached frame and stores the new media ID under the current Flow context.
- [x] Failed repair keeps the job in Needs Review with a specific missing-cache reason.
- [x] A repaired job can run using the current-context media ID without JSON re-import.

## Dev Agent Record

### Completion Notes

- Added Video Queue Repair Frame action.
- Reused existing background `UPLOAD_CACHED_FRAME` path.
- Updated selected Image Variant and Video Job media context metadata after successful repair.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for stale repair success, run-after-repair, and failed upload review state.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-5-reupload-or-relink-stale-references-and-start-frames.md`

## Status

Done.
