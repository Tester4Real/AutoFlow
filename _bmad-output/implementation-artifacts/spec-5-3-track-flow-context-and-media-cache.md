---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-3-track-flow-context-and-media-cache
---

# Story 5.3: Track Flow Context And Media Cache

## Intent

Project media IDs are tied to the current Flow project context so stale start-frame IDs are not reused silently.

## Acceptance

- [x] Active Project stores the current Flow context from background connection state.
- [x] Image Variant media IDs record a `flow_context_id` when variants are recorded.
- [x] Video jobs block stale, missing, or ambiguous start-frame media context before run.
- [x] Project Studio exposes Flow context state in Project Facts and Details.

## Dev Agent Record

### Completion Notes

- Added Project-domain persistence for `flow_context` and `current_flow_context_id`.
- Added Studio Flow context refresh from `GET_CONNECTION_STATE`.
- Added Needs Reference Upload / Disconnected / Stale Context checks before video jobs use selected image media IDs.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for context persistence, stale-media blocking, and matched-context video run.

## File List

- `src/shared/project-domain/00-project-domain.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-3-track-flow-context-and-media-cache.md`

## Status

Done.
