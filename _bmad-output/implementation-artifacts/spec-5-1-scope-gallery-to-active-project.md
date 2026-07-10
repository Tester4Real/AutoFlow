---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-1-scope-gallery-to-active-project
---

# Story 5.1: Scope Gallery To The Active Project

## Intent

Project Studio Gallery / Downloads shows media for the active Project only, including image variants, selected state, and completed video outputs.

## Acceptance

- [x] Gallery entries are derived from the active Project and switch when the active Project changes.
- [x] Image variants stay linked to Prompt Records and expected canonical filenames, with selected state visible.
- [x] Completed video outputs stay linked to Video Jobs and Prompt Records, with output inspection affordances.

## Dev Agent Record

### Completion Notes

- Added active-Project Gallery derivation from `image_variants` and completed `video_jobs`.
- Rendered Project Studio Gallery / Downloads rows for images and videos.
- Added row actions back to Image Review and Video Queue.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for Project A / Project B gallery scoping and completed-video filtering.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-1-scope-gallery-to-active-project.md`

## Status

Done.
