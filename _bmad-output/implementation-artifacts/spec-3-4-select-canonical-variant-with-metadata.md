---
title: 'Story 3.4: Select Canonical Variant With Metadata'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-AutoFlow-2026-07-09/ARCHITECTURE-SPINE.md'
  - '_bmad-output/implementation-artifacts/spec-3-3-build-project-studio-image-review-board.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Image variants are visible, but the user cannot yet choose which variant is canonical. Later filename/export and video preparation need a durable `prompt_id -> variant_id` mapping without deleting alternates.

**Approach:** Add Project Studio state and UI behavior for selecting a variant. Store the selected `variant_id` on the Prompt Record with generated filename metadata, mark variants selected/unselected for rendering, and keep all alternates visible. Selection changes update metadata only.

## Boundaries & Constraints

**Always:** Selection is metadata-first. Selected state must be visible through text and styling, not color alone.

**Ask First:** Destructive file rename, export/finalization behavior, Gallery rewrite, Video Draft creation, or changing legacy side-panel gallery behavior.

**Never:** Do not delete non-selected variants. Do not auto-start or enqueue video work.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Select variant | Prompt has multiple variants | Prompt stores selected `variant_id`; chosen variant marked selected | Missing variant raises specific error |
| Change selection | Prompt already has selected variant | Mapping updates to new variant | Alternates remain visible |
| Missing local file selected | Variant metadata exists but file missing | Selection persists, readiness says repair needed | No destructive change |
| Render selected state | Board re-renders | Text says Selected and visual styling changes | Color is not sole signal |
| Wrong prompt | Variant belongs to another prompt | No write | Specific error shown |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- select variant metadata update helper.
`src/project-studio/app/01-studio-shell.js` -- variant select button behavior and selected-state rendering.
`src/project-studio/studio.css` -- selected variant visual state.
`docs/code-map.md`, `docs/architecture.md`, `docs/project-json-contract.md`, `_bmad-output/project-context.md` -- selected variant metadata ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add Project Studio state helper to select a variant for a Prompt Record.
- [x] Persist `prompt_id -> variant_id` canonical mapping without deleting variants.
- [x] Update Image Review slot controls to save selection and re-render selected state.
- [x] Keep selected state explicit through text and styling, including missing-file selected state.
- [x] Update docs.

**Acceptance Criteria:**
- Given a prompt has multiple variants, when the user selects a variant, AutoFlow stores a `prompt_id -> variant_id` canonical mapping and non-selected variants remain visible and recoverable.
- Given a Selected Variant exists, when Image Review, Gallery, or prompt rows render, the selected state is explicit through text and visual styling and does not rely on color alone.
- Given the user changes selection before downstream video work, when the new selection is saved, canonical mapping updates without deleting files, and final filename/export behavior uses the latest selected mapping.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Created Story 3.4 implementation spec from Epic 3 because no sprint-status file exists and no Story 3.4 artifact was present.
- 2026-07-10: Implemented selection as metadata-first Prompt Record state; no file rename/export, Gallery rewrite, Video Draft creation, or video queue behavior added.

### Completion Notes

- Project Studio state now exposes `selectImageVariant(promptId, variantId)`.
- Selecting a variant stores `selected_variant_id`, selected expected filename, selected generated filename, and selection timestamp on the Prompt Record.
- Variant records remain intact; selected/unselected flags update only for variants under the same Prompt Record.
- Image Review variant slots now save selection, show visible Select/Selected text, and render selected missing-file state as repair-needed.
- Docs and project context now document selected variant metadata ownership and the no-destructive-rename boundary.

### Verification

- Passed: `node --check src/shared/project-domain/00-project-domain.js`
- Passed: `node --check src/shared/project-domain/01-project-json-contract.js`
- Passed: `node --check src/project-studio/app/00-studio-state.js`
- Passed: `node --check src/project-studio/app/01-studio-shell.js`
- Passed: `manifest.json` parse.
- Passed: Project Studio loader path check for all script tags.
- Passed: Story 3.4 selection smoke test for click-driven selection, Prompt Record canonical mapping, selected generated filename metadata, non-selected variants retained, selected variant flagging, selected repair state, and video readiness text.
- Serena diagnostics: `src/project-studio/app/01-studio-shell.js` returns no diagnostics; `src/project-studio/app/00-studio-state.js` reports only pre-existing unrelated classic-JS/global inference false positives.

## File List

- `_bmad-output/implementation-artifacts/spec-3-4-select-canonical-variant-with-metadata.md`
- `_bmad-output/project-context.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `docs/project-json-contract.md`
- `src/project-studio/app/00-studio-state.js`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`

## Change Log

- 2026-07-10: Implemented selected variant metadata and Image Review selection controls; marked Story 3.4 ready for review.

## Status

review
