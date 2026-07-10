---
title: 'Story 2.6: Resolve References And Block Unsafe Prompts'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/implementation-artifacts/spec-2-5-import-project-aware-prompt-json.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Imported Prompt Records can store raw reference names, but they do not yet resolve those references against Project Assets. Prompts with missing or ambiguous required references must not appear generation-ready.

**Approach:** Add Project Studio resolver logic that matches reference names against active Project Assets by alias, display name, and slug. Resolved references store `asset_id`; required missing or ambiguous references mark the Prompt Record `blocked` with explicit block reasons. Import / Resolve shows Ready and Blocked groups.

## Boundaries & Constraints

**Always:** Preserve existing Assets, Prompt Records, and legacy side-panel `prompt-index.json` behavior. Required unresolved references block affected Prompt Records only.

**Ask First:** Manual missing-reference mapping UI, auto-creating Assets, starting image generation, replacing the legacy importer, or changing side-panel generation behavior.

**Never:** Do not silently skip required references, attach global Jack references, auto-upload files, or start generation from Project Studio.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Resolved reference | Reference name matches one active Asset alias/display/slug | Reference stores `asset_id`; prompt can become `ready` | Existing raw name preserved |
| Missing required reference | No active Asset matches required reference | Prompt status becomes `blocked` | Block reason stores missing reference and filename remains visible |
| Ambiguous required reference | Untyped name matches multiple active Assets | Prompt status becomes `blocked` | Block reason stores candidate asset IDs |
| Optional unresolved reference | Reference has `required: false` and no/ambiguous match | Prompt may remain `ready` | Resolution detail records unresolved optional status |
| No references | Prompt has `references: []` | Prompt remains `ready` | No Jack/global reference attached |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- reference lookup, prompt reference resolution, blocked/ready status updates.
`src/project-studio/app/01-studio-shell.js` -- Ready/Blocked grouping and block reason display.
`src/project-studio/studio.css` -- resolution detail styling.
`docs/code-map.md`, `docs/architecture.md`, `docs/project-json-contract.md` -- resolver ownership and matching rules.

## Tasks & Acceptance

**Execution:**
- [x] Create Project Studio reference resolver for active Assets.
- [x] Resolve imported Prompt Records during JSON import and on manual re-run.
- [x] Store resolved `asset_id` references, block reasons, and generation guard state.
- [x] Show Ready and Blocked prompt groups with missing/ambiguous reference names.
- [x] Update docs.

**Acceptance Criteria:**
- Given imported prompts include reference names, references resolve by alias, display name, or slug to `asset_id`.
- Given a required reference is missing or ambiguous, affected Prompt Records become `blocked` and are marked not generation-ready.
- Given Import / Resolve is displayed, Ready and Blocked groups show affected filenames and blocked rows show missing or ambiguous reference names.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Created Story 2.6 spec directly from approved epics/PRD context because no sprint-status file exists.
- 2026-07-10: Serena diagnostics checked after implementation. One new helper inference warning was removed; remaining diagnostics are existing classic-JS/global false positives.

### Completion Notes

- Added Project Studio reference resolution against active Assets by alias, display/name, and slug.
- Imported Prompt Records now resolve references during JSON import and can be re-resolved manually from Import / Resolve.
- Required missing or ambiguous references mark Prompt Records `blocked`, store `blocked_references`, and set `can_generate_images: false`.
- Import / Resolve now groups Blocked, Needs Resolution, Ready, and shows missing/ambiguous reference names plus affected filenames.

### Verification

- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/shared/project-domain/01-project-json-contract.js`
- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"`
- Project Studio script loader path check via Node stdin script
- VM smoke test for alias/type/slug resolution, missing required block, ambiguous required block, optional unresolved ready state, Jack exclusion, generation-ready filtering, and manual resolver rerun summary

## File List

- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`
- `docs/project-json-contract.md`
- `docs/code-map.md`
- `docs/architecture.md`
- `_bmad-output/project-context.md`
- `_bmad-output/implementation-artifacts/spec-2-6-resolve-references-and-block-unsafe-prompts.md`

## Change Log

- 2026-07-10: Implemented Project Studio reference resolution/blocking for imported Prompt Records and updated docs/context.

## Status

review
