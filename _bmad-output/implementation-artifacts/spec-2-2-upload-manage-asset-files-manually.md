---
title: 'Story 2.2: Upload And Manage Asset Files Manually'
type: 'feature'
created: '2026-07-10'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context:
  - '_bmad-output/project-context.md'
  - '_bmad-output/planning-artifacts/epics.md'
  - '_bmad-output/planning-artifacts/prds/prd-AutoFlow-project-studio-refactor-2026-07-09/prd.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-AutoFlow-2026-07-09/EXPERIENCE.md'
  - '_bmad-output/implementation-artifacts/spec-2-1-build-typed-asset-library.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** The Asset Library can create typed Asset records, but those Assets still cannot hold manually supplied reference files. Missing references must stay explicit; AutoFlow should never invent or silently upload placeholder files.

**Approach:** Add manual Asset File attachment in Project Studio's Assets view. Users upload files through row-level file pickers. Files are stored under the chosen Asset with stable `asset_file_id`, original filename, MIME type, size, data URL, source metadata, and primary-file metadata. Users can mark one file primary without changing `asset_id`.

## Boundaries & Constraints

**Always:** Files attach only to an existing Asset; Asset identity remains `asset_id`; primary selection changes `primary_file_id` and per-file flags only.

**Ask First:** Deleting files, uploading to Google Flow, resolving imported JSON references, automatic placeholder creation, or file-system permission changes.

**Never:** Do not auto-create Assets from missing JSON references, silently invent files, change `asset_id`, or trigger generation/upload jobs.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Empty Asset | User picks files on Asset row | Files attach as Asset Files and first uploaded file becomes primary | File read errors show in Asset status |
| Multiple files | User marks a file primary | Only that file is primary; `asset_id` remains unchanged | Missing file ID shows non-blocking error |
| No files | Asset row renders with no files | Direct empty-state text says "Upload reference files." | No automatic upload occurs |
| Existing files | User uploads more files | New files append without replacing existing files | Existing primary remains primary |
| Missing JSON reference | Not implemented in this story | No placeholder Asset or file is created | Deferred to JSON resolution story |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- file reading, Asset File creation, attach files, mark primary.
`src/project-studio/app/01-studio-shell.js` -- row-level upload controls, file lists, primary buttons, event handlers.
`src/project-studio/studio.css` -- Asset File panel and controls.
`docs/code-map.md` and `docs/architecture.md` -- update Asset File ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add Asset File state helpers and persistence through Project `assets`.
- [x] Render upload controls and file lists under each Asset row.
- [x] Implement primary-file selection without changing `asset_id`.
- [x] Add compact styling for file panels and empty-state text.
- [x] Update docs.

**Acceptance Criteria:**
- Given an Asset exists, when the user uploads files through the Asset file picker, then files attach to that Asset as Asset Files and empty rows say "Upload reference files."
- Given an Asset has multiple files, when the user marks one file primary, then that file becomes primary and the Asset keeps the same `asset_id`.
- Given missing JSON references exist later, this story creates no placeholder Asset or automatic upload.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- VM smoke test with fake `FileReader`: create Project, create Asset, attach two files, mark second primary, assert `asset_id` remains stable and primary flags update.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Asset File State**
- `src/project-studio/app/00-studio-state.js` -- file reading, `asset_file_id`, data URL storage, file attachment, primary-file updates.

**Asset File UI**
- `src/project-studio/app/01-studio-shell.js` -- row-level upload controls, direct empty-state text, file list, primary buttons.
- `src/project-studio/studio.css` -- file panel layout and state chips.

**Docs**
- `docs/code-map.md` and `docs/architecture.md` -- Asset File ownership.
