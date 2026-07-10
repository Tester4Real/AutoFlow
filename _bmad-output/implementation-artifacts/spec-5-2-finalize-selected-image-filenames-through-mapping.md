---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-2-finalize-selected-image-filenames-through-mapping
---

# Story 5.2: Finalize Selected Image Filenames Through Mapping

## Intent

Selected variants can be exported as their canonical Prompt Record `file_name` without renaming or deleting alternates.

## Acceptance

- [x] Selected variants can be finalized/downloaded as the canonical `file_name`.
- [x] Prompts without a Selected Variant are blocked and directed back to Image Review.
- [x] Finalization stores selected source-to-canonical mapping metadata for later repair/sync work.

## Dev Agent Record

### Completion Notes

- Added selected-image finalization helpers and metadata writes.
- Added Project Studio Gallery action for finalizing selected images.
- Preserved alternates and existing variant filenames.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for canonical download path, metadata persistence, and no-selection blocking.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-2-finalize-selected-image-filenames-through-mapping.md`

## Status

Done.
