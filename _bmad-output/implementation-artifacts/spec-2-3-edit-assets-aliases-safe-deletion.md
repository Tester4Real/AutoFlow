---
title: 'Story 2.3: Edit Assets, Aliases, Safe Deletion'
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
  - '_bmad-output/implementation-artifacts/spec-2-2-upload-manage-asset-files-manually.md'
  - 'docs/code-map.md'
---

<frozen-after-approval reason="human-owned intent - do not modify unless human renegotiates">

## Intent

**Problem:** Assets can be created and files can be attached, but users cannot safely edit Asset labels/aliases or remove an Asset from active use. Renames must not break future prompt/job references, and destructive actions must show consequences before changing anything.

**Approach:** Add inline Asset details editing in Project Studio. Users can update Asset type, display name, and aliases while preserving `asset_id` and files. For deletion, implement reversible disable/enable instead of hard delete; the UI shows current prompt/job usage counts and asks for confirmation before disabling an Asset.

## Boundaries & Constraints

**Always:** Preserve `asset_id`, `asset_file_id`, files, and existing project structure. Aliases remain resolver metadata, not primary identity.

**Ask First:** Hard delete, dependency graph migration, imported prompt/job rewrite, automatic JSON resolution, or file deletion.

**Never:** Do not key dependencies by display name, remove files implicitly, or change Asset identity during rename/disable.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|---------------|----------------------------|----------------|
| Rename Asset | User edits display name | `display_name` updates and `asset_id` remains stable | Save error shown in Asset status |
| Edit aliases | User changes aliases | Aliases persist as resolver inputs | Empty aliases allowed |
| Disable in-use Asset | User clicks Disable on Asset with usage count | UI shows affected prompts/jobs and confirmation before disabling | Cancel leaves Asset unchanged |
| Disabled Asset | Asset has `lifecycle_status: disabled` | Row shows Disabled state and can be enabled again | Files and IDs remain intact |
| Missing Asset | Save/disable targets missing Asset | Non-blocking error shown | No Project write attempted |

</frozen-after-approval>

## Code Map

`src/project-studio/app/00-studio-state.js` -- Asset metadata update and reversible disable helpers.
`src/project-studio/app/01-studio-shell.js` -- inline Asset details edit form, dependency/consequence text, disable/enable actions.
`src/project-studio/studio.css` -- Asset edit panel and destructive action styling.
`docs/code-map.md` and `docs/architecture.md` -- update Asset edit/disable ownership.

## Tasks & Acceptance

**Execution:**
- [x] Add state helpers for Asset metadata update and reversible disable.
- [x] Render inline Asset details edit controls with stable ID/dependency text.
- [x] Confirm before disabling and preserve IDs/files.
- [x] Add compact styling for edit and consequence panels.
- [x] Update docs.

**Acceptance Criteria:**
- Given an Asset is referenced by future prompts/jobs, when the display name changes, then dependencies remain linked by `asset_id` and aliases remain resolver inputs.
- Given an Asset is in use, when disable is attempted, then the UI shows affected prompts/jobs and cancel leaves dependencies unchanged.
- Given Asset details are edited, then the flow uses one inline details surface without nested modals.
- Given changed JavaScript files, `node --check` passes for each changed JS file.

## Verification

- `node --check src/project-studio/app/00-studio-state.js`
- `node --check src/project-studio/app/01-studio-shell.js`
- `node --check src/shared/project-domain/00-project-domain.js`
- `node --check src/sidepanel/app/00b-project-selector.js`
- VM smoke test: create Project, create Asset, edit type/name/aliases, disable, enable, assert `asset_id` remains stable.
- `node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8')); console.log('manifest ok')"`
- Node script-path check for `src/project-studio/index.html` and `src/sidepanel/index.html`

## Suggested Review Order

**Asset Edit State**
- `src/project-studio/app/00-studio-state.js` -- `updateAsset()` and reversible `setAssetDisabled()`.

**Asset Edit UI**
- `src/project-studio/app/01-studio-shell.js` -- inline edit form, dependency/consequence text, disable/enable confirmation.
- `src/project-studio/studio.css` -- edit panel, consequence panel, disabled row styling.

**Docs**
- `docs/code-map.md` and `docs/architecture.md` -- Asset edit/disable ownership.
