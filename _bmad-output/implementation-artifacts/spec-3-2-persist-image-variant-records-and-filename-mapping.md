---
title: 'Story 3.2: Persist Image Variant Records And Filename Mapping'
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
  - '_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/EXPERIENCE.md'
  - '_bmad-output/implementation-artifacts/spec-3-1-gate-image-generation-by-project-prompt-readiness.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Project image generation runs can now be planned, but generated image options have no Project-scoped variant records. Without stable variant IDs and expected/generated filename mapping, later review, selection, gallery repair, and video draft work would have to infer relationships from filenames.

**Approach:** Add a Project-scoped Image Variant record model and Project Studio state helper for recording variants against an image run's request items. Each variant stores stable identity, `project_id`, `prompt_id`, `image_run_id`, expected prompt `file_name`, generated variant filename, variant index, and repairable local-file state. Preserve the current two-variant default and `__1` / `__2` traceability.

## Boundaries & Constraints

**Always:** Preserve legacy side-panel generation and download behavior. Keep variants scoped to the active Project and linked by stable IDs, not display names.

**Ask First:** Wiring background Google Flow completion/download events into Project records, building the visual review board, selecting canonical variants, renaming/exporting files, or creating video drafts.

**Never:** Do not destructively rename generated files. Do not delete alternate variants. Do not infer variants across Projects.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Completed run request item | Image run has prompt request item | Variant records link `project_id`, `prompt_id`, expected `file_name`, generated filename | Missing run or prompt raises a specific error |
| Two variants per prompt | Run image count defaults to 2 | Generated filenames use `__1` and `__2` before `.png` | Existing explicit generated filename can override fallback |
| Re-record same run | Existing variant record for same run/prompt/index | Stable `variant_id` preserved and metadata updated | No duplicate variant for same identity |
| Extension reload | Project state restored | Variant records survive in `image_variants` | Missing local files stay repairable metadata |
| No local file path | Variant metadata lacks local path/cache | Record marked `missing` / repairable, not discarded | Later Sync Folder can repair |

</frozen-after-approval>

## Code Map

`src/shared/project-domain/00-project-domain.js` -- persist Project `image_variants` records.
`src/project-studio/app/00-studio-state.js` -- variant ID, filename, and recording helpers.
`docs/code-map.md`, `docs/architecture.md`, `docs/project-json-contract.md`, `_bmad-output/project-context.md` -- document variant record ownership and filename mapping.

## Tasks & Acceptance

**Execution:**
- [x] Persist Project Image Variant records.
- [x] Add stable variant ID and generated filename mapping helpers.
- [x] Record variants from an image generation run without duplicate records.
- [x] Preserve repairable missing-local-file state.
- [x] Update docs.

**Acceptance Criteria:**
- Given image generation completes for a prompt, when variants are recorded, each Image Variant receives a stable `variant_id` and links `project_id`, `prompt_id`, expected `file_name`, and generated variant filename.
- Given current MVP generation behavior returns two image variants, when variants are stored, current two-variant behavior is preserved and `__1` / `__2` traceability remains compatible with existing filename rules.
- Given the extension reloads, when project state is restored, generated variant records and prompt linkage survive, and missing local files are represented as repairable state rather than lost metadata.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Created Story 3.2 implementation spec from Epic 3 because no sprint-status file exists and no Story 3.2 artifact was present.
- 2026-07-10: Implemented variant persistence as Project metadata only; background Google Flow/download wiring remains out of scope for this story.

### Completion Notes

- Project Domain now normalizes and persists `image_variants`.
- Project Studio state now exposes `getProjectImageVariants`, `buildImageVariantFileName`, and `recordImageGenerationRunVariants`.
- Recording variants from a run preserves two-variant `__1` / `__2` filename mapping, keeps stable `variant_id` values across re-records, marks missing local files as repairable metadata, and marks the run/prompt completion state.
- Docs and project context now document Project-owned Image Variant records and filename mapping.

### Verification

- Passed: `node --check src/shared/project-domain/00-project-domain.js`
- Passed: `node --check src/shared/project-domain/01-project-json-contract.js`
- Passed: `node --check src/project-studio/app/00-studio-state.js`
- Passed: `node --check src/project-studio/app/01-studio-shell.js`
- Passed: `manifest.json` parse.
- Passed: Project Studio loader path check for all script tags.
- Passed: Story 3.2 VM smoke test for default two variants, `__1` / `__2` filename mapping, reload persistence, stable variant IDs on re-record, available/missing file states, no duplicate variants, and run/prompt completion state.
- Serena diagnostics: no new Story 3.2 diagnostics; remaining diagnostics are pre-existing classic-JS/global inference false positives in `src/shared/project-domain/00-project-domain.js` and unrelated helpers in `src/project-studio/app/00-studio-state.js`.

## File List

- `_bmad-output/implementation-artifacts/spec-3-2-persist-image-variant-records-and-filename-mapping.md`
- `_bmad-output/project-context.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `docs/project-json-contract.md`
- `src/project-studio/app/00-studio-state.js`
- `src/shared/project-domain/00-project-domain.js`

## Change Log

- 2026-07-10: Implemented Project Image Variant records and filename mapping; marked Story 3.2 ready for review.

## Status

review
