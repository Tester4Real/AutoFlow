---
type: feature
status: done
baseline_commit: 0e378b7
story_key: 5-6-complete-recovery-ux-and-documentation
---

# Story 5.6: Complete Recovery UX And Documentation

## Intent

Recovery states for disconnected Flow context, stale media, missing local files, and start-frame repair are visible and traceable without adding a new architecture layer.

## Acceptance

- [x] Project Studio shows Flow context state in Project Facts and Details.
- [x] Video Queue rows show specific Needs Reference Upload, Disconnected, or Stale Context reasons.
- [x] Side panel Project summary surfaces disconnected/stale recovery alerts.
- [x] `docs/code-map.md` documents Gallery/Downloads, Sync Folder, Flow context cache, and stale start-frame repair ownership.
- [x] Changed JavaScript files pass syntax checks.

## Dev Agent Record

### Completion Notes

- Added side-panel disconnected Flow-context alert fallback.
- Kept recovery documentation to the code map and implementation notes only.
- Account/project switch validation is represented by VM smoke tests for stale context, repair, and retry behavior; browser manual validation still requires reloading the unpacked extension with a live Flow tab.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/sidepanel/app/00b-project-selector.js`

## File List

- `src/shared/project-domain/00-project-domain.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `src/sidepanel/app/00b-project-selector.js`
- `docs/code-map.md`
- `_bmad-output/implementation-artifacts/spec-5-6-complete-recovery-ux-and-documentation.md`

## Status

Done.
