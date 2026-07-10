---
type: feature
status: done
baseline_commit: NO_VCS
story_key: 4-5-preserve-existing-queue-operations-in-side-panel
---

# Story 4.5: Preserve Existing Queue Operations In Side Panel

## Intent

The side panel should summarize active Project video work while leaving existing Run, Stop, Retry Failed, and Sync Folder operations available.

## Acceptance

- [x] Side panel shows compact active-Project queue summaries for Ready/queued, Draft, Running, Failed, and Blocked work.
- [x] Failed and Needs Review states show operational, specific alert text.
- [x] Existing Run, Stop, Retry Failed, and Sync Folder controls remain in their current side-panel locations.
- [x] Side panel opens Project Studio directly to the Video Queue for deeper preparation.

## Dev Agent Record

### Completion Notes

- Added Project queue chips to the existing Project strip.
- Added a Project Studio Video Queue deep-link button.
- Project Studio now honors `#video` on load.

### Verification

- `node --check src/sidepanel/app/00a-project-studio-link.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- `node --check src/project-studio/app/00-studio-state.js`
- VM smoke test for side-panel queue summary counts and Video Queue deep link.

## File List

- `src/sidepanel/index.html`
- `src/sidepanel/app/00a-project-studio-link.js`
- `src/sidepanel/app/00b-project-selector.js`
- `src/sidepanel/styles/05-badges-fixes-animation.css`
- `src/project-studio/app/00-studio-state.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-4-5-preserve-existing-queue-operations-in-side-panel.md`

## Status

Done.
