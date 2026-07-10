---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 4-1-show-video-readiness-from-selected-images
---

# Story 4.1: Show Video Readiness From Selected Images

## Intent

Project Studio should show which Prompt Records are ready for Video Drafts and which still need a selected image or animation prompt.

## Acceptance

- [x] Video Queue Builder shows draftable prompts when `animation_prompt` and Selected Variant exist.
- [x] Prompts missing Selected Variant or animation prompt show Not Ready with a visible reason.
- [x] Prompts without `animation_prompt` do not create Video Drafts.
- [x] Readiness updates after image selection without adding jobs to the queue automatically.

## Dev Agent Record

### Completion Notes

- Changed video readiness derivation to evaluate all Prompt Records, not only prompts with animation prompts.
- Reused the Video Queue readiness result in Image Review so selected-image changes surface the same readiness state.
- Updated Video Queue Builder empty and missing-animation copy.

### Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- Node VM smoke test for ready, missing selected image, and missing animation prompt readiness.

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `_bmad-output/implementation-artifacts/spec-4-1-show-video-readiness-from-selected-images.md`

## Status

Done.
