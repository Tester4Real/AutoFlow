---
title: 'Story 3.3: Build Project Studio Image Review Board'
type: 'feature'
created: '2026-07-10'
status: 'review'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/wireframes/key-screens.md'
  - '_bmad-output/implementation-artifacts/spec-3-2-persist-image-variant-records-and-filename-mapping.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Project Image Variant records now exist, but Project Studio does not show them as a usable review surface. The creator needs a large scene-row board to compare image options before later selection and video work.

**Approach:** Extend the existing Image Review workspace with a scene-row board grouped by Prompt Record. Each row shows expected filename, prompt excerpt, resolved reference chips, two fixed-size variant slots, selected/readiness text, and accessible labels. Empty/missing variants remain visible and repairable.

## Boundaries & Constraints

**Always:** Keep the board inside the existing Project Studio Image Review view. Use stable dimensions for variant slots. Do not rely on color alone.

**Ask First:** Persisting Selected Variant, changing filenames, creating video drafts, wiring background downloads directly into variants, or changing the side-panel gallery.

**Never:** Do not implement destructive rename/export behavior. Do not auto-start video work. Do not hide non-selected variants.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Variants exist | Prompt Records and Image Variants | Rows grouped by Prompt Record with two variant slots | Empty board message if none |
| Missing local files | Variant has `file_state: missing` | Slot remains visible with repairable text | No broken image required |
| Thumbnail URL exists | Variant has thumbnail or data URL | Slot displays image preview in stable frame | Alt/aria label includes filename and state |
| More/fewer variants | Variant count differs from two | First two slots stay stable; overflow count shown | Missing slots shown as empty |
| Keyboard navigation | User tabs through board | Variant controls/slots are reachable and labeled | Selection action disabled until Story 3.4 |

</frozen-after-approval>

## Code Map

`src/project-studio/app/01-studio-shell.js` -- render Image Review board grouped by Prompt Record.
`src/project-studio/studio.css` -- stable scene-row and variant-slot layout.
`docs/code-map.md`, `docs/architecture.md` -- document Image Review board ownership.

## Tasks & Acceptance

**Execution:**
- [x] Group Image Variants by Prompt Record in Image Review.
- [x] Render scene rows with expected filename, prompt excerpt, reference chips, and video readiness text.
- [x] Render two stable variant slots per row with accessible labels and selected-state text.
- [x] Preserve empty/missing/overflow states without layout jumps.
- [x] Update docs.

**Acceptance Criteria:**
- Given generated variants exist, when the user opens Image Review, variants are grouped by Prompt Record in a scene-row board, and each row shows expected filename, prompt excerpt, reference chips, two fixed-size variant slots, selected state, and video readiness.
- Given thumbnails, warnings, or selected labels load, when Image Review renders, variant slots keep stable aspect ratio and dimensions, and layout does not jump or resize controls.
- Given a user relies on keyboard or assistive labels, when Image Review is navigated, variant thumbnails have accessible labels including filename, variant number, and selected state, and controls are keyboard reachable.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Dev Agent Record

### Debug Log

- 2026-07-10: Created Story 3.3 implementation spec from Epic 3 because no sprint-status file exists and no Story 3.3 artifact was present.
- 2026-07-10: Implemented Image Review as a read-only scene-row board; selection persistence remains deferred to Story 3.4.

### Completion Notes

- Project Studio Image Review now renders a board grouped by Prompt Record from Project `image_variants`.
- Each row shows expected filename, prompt excerpt, resolved reference chips, two stable variant slots, selected/readiness state text, and video readiness text.
- Variant slots are keyboard-focusable and include ARIA labels with variant number, generated filename, selected state, and availability/repair state.
- CSS adds fixed aspect-ratio preview frames, stable desktop/mobile grid behavior, explicit selected/repair states, and no layout shift for missing variants.

### Verification

- Passed: `node --check src/shared/project-domain/00-project-domain.js`
- Passed: `node --check src/shared/project-domain/01-project-json-contract.js`
- Passed: `node --check src/project-studio/app/00-studio-state.js`
- Passed: `node --check src/project-studio/app/01-studio-shell.js`
- Passed: `manifest.json` parse.
- Passed: Project Studio loader path check for all script tags.
- Passed: Story 3.3 shell smoke test for board rendering, Prompt Record grouping, reference chips, two variant slots, generated filenames, ARIA labels, repair state, and video readiness text.
- Serena diagnostics: `src/project-studio/app/01-studio-shell.js` returns no diagnostics.

## File List

- `_bmad-output/implementation-artifacts/spec-3-3-build-project-studio-image-review-board.md`
- `_bmad-output/project-context.md`
- `docs/architecture.md`
- `docs/code-map.md`
- `src/project-studio/app/01-studio-shell.js`
- `src/project-studio/studio.css`

## Change Log

- 2026-07-10: Implemented Project Studio Image Review board; marked Story 3.3 ready for review.

## Status

review
