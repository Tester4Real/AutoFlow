---
title: 'Story 2.5: Import Project-Aware Prompt JSON'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/implementation-artifacts/spec-2-4-define-project-json-reference-contract.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Project-aware JSON contract exists, but Project Studio cannot import prompt JSON into active Project state. Imported scenes need stable Prompt Records before resolution, generation, image review, and video queue stories can attach behavior.

**Approach:** Add Project Studio Import / Resolve import UI backed by `TFProjectJsonContract`. A valid JSON file creates Project-scoped Prompt Records with stable `prompt_id`, prompt fields, raw reference names, normalized references, source import metadata, and readiness state. Invalid JSON returns specific errors and does not write Project state.

## Boundaries & Constraints

**Always:** Preserve existing Project Assets and legacy side-panel `prompt-index.json` behavior. Project-aware imports must not attach Jack/global references.

**Ask First:** Reference resolution to Assets, blocking generation, queue creation, image/video generation, legacy importer replacement.

**Never:** Do not erase Assets, auto-create Assets/files, attach `assets/reference/Jack.jpg`, or start generation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Valid JSON | Active Project and valid prompt JSON | Appends Prompt Records with stable `prompt_id` and import metadata | Existing Assets preserved |
| No references | Prompt has no reference field | Prompt imports with `references: []` and `status: ready` | No Jack/global reference |
| With references | Prompt has `references` or compatibility field | Raw names and normalized refs stored; status awaits resolution | Resolution deferred |
| Invalid prompt | Missing `file_name` or `image_prompt` | Specific error identifies bad record | No Project write |
| No Project | No active Project | Import disabled/error shown | No storage write |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/00-project-domain.js` -- persist `prompt_records` and `prompt_imports`.
`src/project-studio/app/00-studio-state.js` -- import JSON text/file into active Project Prompt Records.
`src/project-studio/app/01-studio-shell.js` -- Import / Resolve UI, import history, prompt list.
`src/project-studio/studio.css` -- import manager and prompt record table styling.
`docs/code-map.md`, `docs/architecture.md` -- Prompt Record ownership.

## Tasks & Acceptance

**Execution:**
- [x] Persist Prompt Records/import history in Project domain updates.
- [x] Add Project Studio state helpers for project-aware JSON import.
- [x] Render Import / Resolve UI and prompt records.
- [x] Preserve Project Assets and avoid Jack/global references.
- [x] Update docs.

**Acceptance Criteria:**
- Given an active Project and valid JSON, imported Prompt Records store `file_name`, `image_prompt`, optional `animation_prompt`, optional raw reference names, and stable `prompt_id`.
- Given JSON has no references field, prompt records are ready and no global Jack/channel reference is attached.
- Given imported prompt data is invalid, user receives a specific error and existing Project state remains unchanged.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Continued Story 2.5 from the partial domain-storage patch. No sprint status file exists, so story status is tracked in this file.
- 2026-07-10: Serena diagnostics were checked after implementation. Reported TypeScript `never` inference false positives in classic JS globals; runtime syntax and VM behavior checks passed.

### Completion Notes

- Added Project-domain persistence for `prompt_records` and `prompt_imports`.
- Added Project Studio prompt JSON import helpers backed by `TFProjectJsonContract.parsePromptJson`.
- Added Import / Resolve UI with manual JSON upload, import history, grouped Prompt Records, ready/needs-resolution status display, and no automatic generation or reference resolution.
- Preserved existing Project Assets during import and verified no Jack/global reference is attached when JSON has no references.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/shared/project-domain/01-project-json-contract.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- Project Studio script loader path check via Node stdin script
- VM smoke test for valid import, no-reference ready state, referenced needs-resolution state, asset preservation, Jack exclusion, and invalid-import no-write behavior

## File List

- `src/shared/project-domain/00-project-domain.js`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/code-map.md`
- `docs/architecture.md`
- `_bmad-output/implementation-artifacts/spec-2-5-import-project-aware-prompt-json.md`

## Change Log

- 2026-07-10: Implemented Project Studio project-aware prompt JSON import into Project-scoped Prompt Records and updated ownership docs.

## Status

review
