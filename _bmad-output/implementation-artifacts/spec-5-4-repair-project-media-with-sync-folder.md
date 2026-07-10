---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-4-repair-project-media-with-sync-folder
---

# Story 5.4: Repair Project Media With Sync Folder

## Intent

Project Studio can relink active-Project image variants, selected mappings, and completed video outputs from user-selected local media files.

## Acceptance

- [x] Sync Folder relinks active-Project image variants by generated filename and `__1` / `__2` traces.
- [x] Sync Folder relinks selected canonical mappings without applying the canonical filename to non-selected alternates.
- [x] Sync Folder relinks completed video outputs by output filename.
- [x] Existing valid mappings remain intact when no matching file is found.

## Dev Agent Record

### Completion Notes

- Added Project Studio media-file matching and repair helpers.
- Added Gallery / Downloads Sync Folder action.
- Updated selected Prompt Record local mapping metadata during repair.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for `__1` variant repair, canonical selected repair, and completed video relink.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-4-repair-project-media-with-sync-folder.md`

## Status

Done.
