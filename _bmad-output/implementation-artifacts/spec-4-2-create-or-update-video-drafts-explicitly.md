---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 4-2-create-or-update-video-drafts-explicitly
---

# Story 4.2: Create Or Update Video Drafts Explicitly

## Intent

Creators can create or update Video Drafts from selected images and animation prompts without starting video generation.

## Acceptance

- [x] Creating/updating a draft stores `job_id`, `project_id`, `prompt_id`, selected `variant_id`, animation prompt, and expected output filename.
- [x] Draft creation uses the Selected Variant as the MVP start-frame reference.
- [x] Project Asset references are not automatically attached to video jobs.
- [x] Selection changes before run update Draft jobs or mark Ready jobs Needs Review before queueing.

## Dev Agent Record

### Completion Notes

- Implemented explicit draft creation/update in Project Studio state.
- Draft jobs remain local Project metadata and do not auto-run.
- Ready jobs become Needs Review when selection changes; Running/Complete jobs remain protected.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for draft creation, Ready transition, Needs Review reconciliation, and Running job protection.

## File List

- `src/shared/project-domain/00-project-domain.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `_bmad-output/implementation-artifacts/spec-4-2-create-or-update-video-drafts-explicitly.md`

## Status

Done.
